import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import crypto from 'node:crypto'
import { lineConfigured, lineExchangeToken, lineProfile, siteUrl, isLinkState } from '@/lib/line'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  const base = siteUrl()
  const fail = (reason: string) => NextResponse.redirect(`${base}/login?error=${reason}`)
  if (!lineConfigured()) return fail('line_not_configured')

  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const cookieState = request.cookies.get('line_oauth_state')?.value
  if (!code || !state || !cookieState || state !== cookieState) return fail('line_state')

  const tok = await lineExchangeToken(code)
  if (!tok?.access_token) return fail('line_token')
  const prof = await lineProfile(tok.access_token)
  if (!prof?.userId) return fail('line_profile')

  const lineId = prof.userId
  const displayName = prof.displayName || 'ผู้ใช้ LINE'

  // ─────────── โหมด "เชื่อมต่อ LINE" (ผู้ใช้ login อยู่แล้ว) ───────────
  if (isLinkState(state)) {
    const profileUrl = (p: string) => NextResponse.redirect(`${base}/dashboard/profile?line=${p}`)
    // ต้องมี session ปัจจุบัน
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return fail('line_link_no_session')

    const admin = createAdminClient()
    // LINE นี้ถูกผูกกับบัญชีอื่นอยู่แล้วหรือไม่
    const { data: taken } = await admin
      .from('users')
      .select('id')
      .eq('line_user_id', lineId)
      .neq('id', user.id)
      .maybeSingle()
    if (taken) return profileUrl('already_linked')

    const { error: updErr } = await admin
      .from('users')
      .update({ line_user_id: lineId })
      .eq('id', user.id)
    if (updErr) return profileUrl('link_failed')

    // ดึงรูปโปรไฟล์จาก LINE มาใช้ (เฉพาะเมื่อยังไม่มีรูป — ไม่ทับรูปที่อัปโหลดเอง)
    if (prof.pictureUrl) {
      await admin.from('users').update({ avatar_url: prof.pictureUrl }).eq('id', user.id).is('avatar_url', null)
    }

    await admin.from('audit_log').insert({
      actor_id: user.id,
      action: 'line_connected',
      details: { line_display_name: displayName },
    })
    const res = profileUrl('connected')
    res.cookies.delete('line_oauth_state')
    return res
  }

  // ─────────── โหมด login ด้วย LINE (เดิม) ───────────
  // อีเมลสังเคราะห์ — บัญชี LINE แยกจากบัญชีอีเมล/รหัสผ่าน (กันชนกัน)
  const email = `line_${lineId}@line.local`
  const password = crypto.randomUUID() + 'Aa1!'

  const admin = createAdminClient()
  const { data: existing } = await admin.from('users').select('id').eq('email', email).maybeSingle()
  let userId = existing?.id as string | undefined

  if (userId) {
    await admin.auth.admin.updateUserById(userId, { password })
    // ผูก line_user_id ให้บัญชี LINE เดิมที่อาจสร้างก่อนมี column นี้
    await admin.from('users').update({ line_user_id: lineId }).eq('id', userId)
    // ดึงรูป LINE มาใช้เมื่อยังไม่มีรูป (ไม่ทับรูปที่อัปโหลดเอง)
    if (prof.pictureUrl) {
      await admin.from('users').update({ avatar_url: prof.pictureUrl }).eq('id', userId).is('avatar_url', null)
    }
  } else {
    const { data: created, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: displayName, line_user_id: lineId, avatar: prof.pictureUrl || null, provider: 'line' },
    })
    if (error || !created.user) return fail('line_create')
    userId = created.user.id
    await admin.from('users').upsert(
      { id: userId, email, full_name: displayName, role: 'donor', is_verified: false, reputation_points: 0, line_user_id: lineId, avatar_url: prof.pictureUrl || null },
      { onConflict: 'id' }
    )
  }

  // ออก session โดย bind cookie กับ response ที่จะ redirect
  const response = NextResponse.redirect(`${base}/dashboard`)
  response.cookies.delete('line_oauth_state')
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    }
  )
  const { error: signErr } = await supabase.auth.signInWithPassword({ email, password })
  if (signErr) return fail('line_signin')

  await admin.from('audit_log').insert({ actor_id: userId, action: 'user_login', details: { provider: 'line' } })
  return response
}
