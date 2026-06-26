import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// PDPA: keep only /24 (IPv4) or /64 (IPv6) prefix — not identifiable
function maskIp(ip: string): string {
  if (!ip) return ''
  if (ip.includes(':')) {
    const parts = ip.split(':').filter(Boolean)
    return parts.slice(0, 4).join(':') + '::/64'
  }
  const parts = ip.split('.')
  if (parts.length === 4) return parts.slice(0, 3).join('.') + '.0/24'
  return ''
}

// Skip non-page paths
function shouldSkip(path: string): boolean {
  if (!path) return true
  if (path.startsWith('/api')) return true
  if (path.startsWith('/_next')) return true
  if (/\.[a-z0-9]+$/i.test(path)) return true
  // admin browsing ไม่นับ
  if (path.startsWith('/dashboard/admin')) return true
  return false
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as { path?: string }
    const path = String(body.path || '').slice(0, 300)
    if (shouldSkip(path)) return NextResponse.json({ ok: true, skipped: true })

    const h = await headers()
    const ip = (h.get('x-forwarded-for') || h.get('x-real-ip') || '').split(',')[0].trim()
    const ua = (h.get('user-agent') || '').slice(0, 300)
    const refRaw = h.get('referer') || ''
    let refHost = ''
    try {
      if (refRaw) {
        const u = new URL(refRaw)
        const ownHost = new URL(req.url).host
        if (u.host && u.host !== ownHost) refHost = u.host.slice(0, 200)
      }
    } catch {
      // ignore malformed referer
    }

    // resolve logged-in user (optional)
    let userId: string | null = null
    try {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      userId = user?.id ?? null
    } catch {
      // unauthenticated — fine
    }

    const admin = createAdminClient()
    await admin.from('site_visits').insert({
      path,
      user_id: userId,
      ip_prefix: maskIp(ip),
      user_agent: ua,
      referrer: refHost,
    })

    return NextResponse.json({ ok: true })
  } catch {
    // don't fail the response — visit tracking must never break the user flow
    return NextResponse.json({ ok: false }, { status: 200 })
  }
}
