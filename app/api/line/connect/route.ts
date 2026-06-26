import { NextResponse } from 'next/server'
import crypto from 'node:crypto'
import { createClient } from '@/lib/supabase/server'
import { lineConfigured, lineAuthorizeUrl, siteUrl, LINE_LINK_PREFIX } from '@/lib/line'

// เริ่มขั้นตอน "เชื่อมต่อ LINE" สำหรับผู้ใช้ที่ login อยู่แล้ว
// ใช้ callback เดียวกับ login (/api/auth/line/callback) — แยกโหมดด้วย state prefix
export async function GET() {
  const base = siteUrl()

  // ต้อง login ก่อน
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(`${base}/login`)

  if (!lineConfigured()) {
    return NextResponse.redirect(`${base}/dashboard/profile?line=not_configured`)
  }

  const state = LINE_LINK_PREFIX + crypto.randomUUID()
  const res = NextResponse.redirect(lineAuthorizeUrl(state))
  res.cookies.set('line_oauth_state', state, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 600,
  })
  return res
}
