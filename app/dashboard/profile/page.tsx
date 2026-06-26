import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ProfileClient } from './ProfileClient'
import { lineConfigured, lineMessagingConfigured, lineUserIdFromEmail } from '@/lib/line'

const LINE_MSG: Record<string, { ok: boolean; text: string }> = {
  connected: { ok: true, text: '✅ เชื่อมต่อ LINE สำเร็จ — พร้อมรับแจ้งเตือนแล้ว' },
  already_linked: { ok: false, text: '⚠️ บัญชี LINE นี้ถูกผูกกับผู้ใช้อื่นแล้ว' },
  link_failed: { ok: false, text: '❌ เชื่อมต่อ LINE ไม่สำเร็จ ลองใหม่อีกครั้ง' },
  not_configured: { ok: false, text: '⚠️ ระบบยังไม่ได้ตั้งค่า LINE' },
}

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ line?: string }>
}) {
  const { line } = await searchParams
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // เผื่อ migration 012 ยังไม่ลง (ไม่มี column line_user_id) → fallback select แบบไม่มี column นั้น
  type ProfileRow = { full_name: string; phone: string; email: string; role: string; is_verified: boolean; line_user_id?: string | null }
  let profile: ProfileRow | null = null
  const full = await supabase
    .from('users')
    .select('full_name, phone, email, role, is_verified, line_user_id')
    .eq('id', user.id)
    .single()
  if (full.error) {
    const basic = await supabase
      .from('users')
      .select('full_name, phone, email, role, is_verified')
      .eq('id', user.id)
      .single()
    profile = (basic.data as unknown as ProfileRow) ?? null
  } else {
    profile = (full.data as unknown as ProfileRow) ?? null
  }

  // รูปโปรไฟล์ (เผื่อ migration 015 ยังไม่ลง → ไม่มี column avatar_url → null)
  let avatarUrl: string | null = null
  const av = await supabase.from('users').select('avatar_url').eq('id', user.id).single()
  if (!av.error) avatarUrl = (av.data as unknown as { avatar_url: string | null })?.avatar_url ?? null

  // มีคำขอ pending ไหม (เผื่อ migration 009 ยังไม่ลง → ถือว่าไม่มี)
  let pendingRequest = false
  const { data: req } = await supabase.from('role_requests').select('id').eq('user_id', user.id).eq('status', 'pending').maybeSingle()
  pendingRequest = !!req

  const lineNotice = line && LINE_MSG[line] ? LINE_MSG[line] : null
  // ผู้ที่ login ด้วย LINE — บัญชีผูก LINE โดยกำเนิด (email สังเคราะห์ line_<id>@line.local)
  const email = profile?.email || user.email || ''
  const lineViaLogin = !!lineUserIdFromEmail(email)

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
          line_connected: !!profile?.line_user_id || lineViaLogin,
          line_via_login: lineViaLogin,
          avatar_url: avatarUrl,
        }}
        pendingRequest={pendingRequest}
        lineAvailable={lineConfigured() && lineMessagingConfigured()}
        lineNotice={lineNotice}
      />
    </>
  )
}
