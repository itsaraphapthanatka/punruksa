import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import crypto from 'node:crypto'
import { lineConfigured, lineExchangeToken, lineProfile, siteUrl } from '@/lib/line'
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
  // อีเมลสังเคราะห์ — บัญชี LINE แยกจากบัญชีอีเมล/รหัสผ่าน (กันชนกัน)
  const email = `line_${lineId}@line.local`
  const password = crypto.randomUUID() + 'Aa1!'

  const admin = createAdminClient()
  const { data: existing } = await admin.from('users').select('id').eq('email', email).maybeSingle()
  let userId = existing?.id as string | undefined

  if (userId) {
    await admin.auth.admin.updateUserById(userId, { password })
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
      { id: userId, email, full_name: displayName, role: 'donor', is_verified: false, reputation_points: 0 },
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
