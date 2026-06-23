import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ProfileClient } from './ProfileClient'

export default async function ProfilePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('full_name, phone, email, role, is_verified')
    .eq('id', user.id)
    .single()

  // มีคำขอ pending ไหม (เผื่อ migration 009 ยังไม่ลง → ถือว่าไม่มี)
  let pendingRequest = false
  const { data: req } = await supabase.from('role_requests').select('id').eq('user_id', user.id).eq('status', 'pending').maybeSingle()
  pendingRequest = !!req

  return (
    <>
      <div className="dashboard-header">
        <h1>👤 โปรไฟล์</h1>
        <p>แก้ไขข้อมูลส่วนตัว เปลี่ยนรหัสผ่าน และจัดการบทบาท</p>
      </div>
      <ProfileClient
        profile={{
          full_name: profile?.full_name || '',
          phone: profile?.phone || '',
          email: profile?.email || user.email || '',
          role: profile?.role || 'donor',
          is_verified: !!profile?.is_verified,
        }}
        pendingRequest={pendingRequest}
      />
    </>
  )
}
