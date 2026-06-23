import { NextResponse } from 'next/server'
import crypto from 'node:crypto'
import { lineConfigured, lineAuthorizeUrl, siteUrl } from '@/lib/line'

export async function GET() {
  if (!lineConfigured()) {
    return NextResponse.redirect(`${siteUrl()}/login?error=line_not_configured`)
  }
  const state = crypto.randomUUID()
  const res = NextResponse.redirect(lineAuthorizeUrl(state))
  // เก็บ state ไว้กัน CSRF — ตรวจตอน callback
  res.cookies.set('line_oauth_state', state, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 600,
  })
  return res
}
