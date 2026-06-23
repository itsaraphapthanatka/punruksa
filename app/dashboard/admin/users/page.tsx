import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { UsersAdmin, type UserRow } from './UsersAdmin'
import { RoleRequestsAdmin, type RoleReq } from './RoleRequestsAdmin'

export default async function AdminUsersPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  // อ่านผ่าน service-role (หน้านี้ผ่านการเช็ค admin แล้ว)
  const admin = createAdminClient()
  const { data } = await admin
    .from('users')
    .select('id, full_name, email, role, is_verified, created_at')
    .order('created_at', { ascending: false })
    .limit(500)
  const users = (data ?? []) as UserRow[]

  const counts = users.reduce<Record<string, number>>((acc, u) => {
    acc[u.role] = (acc[u.role] || 0) + 1
    return acc
  }, {})

  // คำขอเป็นกรรมการที่รออนุมัติ (เผื่อ migration 009 ยังไม่ลง → ถือว่าว่าง)
  const { data: reqRaw } = await admin
    .from('role_requests')
    .select('id, requested_role, users(full_name, email)')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
  const requests: RoleReq[] = (reqRaw || []).map((r) => {
    const u = r.users as unknown as { full_name?: string; email?: string } | null
    return { id: r.id, userName: u?.full_name || '—', email: u?.email || '', requestedRole: r.requested_role }
  })

  return (
    <>
      <div className="dashboard-header">
        <h1>👥 จัดการสมาชิก</h1>
        <p>
          ทั้งหมด {users.length} คน · กรรมการ {counts.approver || 0} · คลินิก {counts.clinic || 0} · แอดมิน {counts.admin || 0}
        </p>
      </div>
      <RoleRequestsAdmin requests={requests} />
      <UsersAdmin users={users} q="" />
    </>
  )
}
