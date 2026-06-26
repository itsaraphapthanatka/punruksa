import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

interface VisitRow {
  id: string
  path: string
  user_id: string | null
  ip_prefix: string | null
  user_agent: string | null
  referrer: string | null
  created_at: string
  user: { full_name: string; role: string } | null
}

function fmt(iso: string): string {
  return new Date(iso).toLocaleString('th-TH', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
}

function browserOf(ua: string | null | undefined): string {
  if (!ua) return '—'
  if (/bot|crawler|spider|slurp|bingbot/i.test(ua)) return '🤖 bot'
  if (/Edg\//i.test(ua)) return 'Edge'
  if (/OPR\//i.test(ua)) return 'Opera'
  if (/Chrome/i.test(ua) && !/Edg\//i.test(ua)) return 'Chrome'
  if (/Firefox/i.test(ua)) return 'Firefox'
  if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) return 'Safari'
  if (/Line\//i.test(ua)) return 'LINE'
  return ua.slice(0, 24)
}

function deviceOf(ua: string | null | undefined): string {
  if (!ua) return '—'
  if (/Mobile|Android|iPhone/i.test(ua)) return '📱'
  if (/iPad|Tablet/i.test(ua)) return '📱'
  return '🖥️'
}

export default async function AdminVisitsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  // recent visits (last 200)
  const { data: recent, error: recentErr } = await supabase
    .from('site_visits')
    .select('id, path, user_id, ip_prefix, user_agent, referrer, created_at, user:users(full_name, role)')
    .order('created_at', { ascending: false })
    .limit(200)

  // ถ้าตารางยังไม่ถูกสร้าง แสดงคำแนะนำให้ apply migration
  if (recentErr && /relation .* does not exist/i.test(recentErr.message)) {
    return (
      <>
        <div className="dashboard-header">
          <h1>👀 ผู้เข้าชมเว็บไซต์</h1>
        </div>
        <div className="glass-card" style={{ padding: '2rem', textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>⚠️</div>
          <h2 style={{ marginBottom: 8 }}>ต้องรัน migration ก่อน</h2>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: 16 }}>
            ตาราง <code>site_visits</code> ยังไม่ถูกสร้างในฐานข้อมูล
          </p>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            เปิด <strong>Supabase Studio → SQL Editor</strong> แล้วรันไฟล์{' '}
            <code>supabase/migrations/011_site_visits.sql</code>
          </p>
        </div>
      </>
    )
  }

  const rows = (recent ?? []) as unknown as VisitRow[]

  // aggregate: today / 7d / total
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const sevenDaysAgo = new Date(now.getTime() - 7 * 86400 * 1000)

  // pull aggregates separately (more reliable than relying on a 200-row window)
  const { count: totalCount } = await supabase
    .from('site_visits')
    .select('id', { count: 'exact', head: true })

  const { count: todayCount } = await supabase
    .from('site_visits')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', startOfToday.toISOString())

  const { count: weekCount } = await supabase
    .from('site_visits')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', sevenDaysAgo.toISOString())

  // top paths (last 7 days) — derive from the 200-row recent window first; if 200 isn't enough we still get a useful top-10
  const { data: weekRows } = await supabase
    .from('site_visits')
    .select('path')
    .gte('created_at', sevenDaysAgo.toISOString())
    .limit(2000)
  const pathCounts = new Map<string, number>()
  for (const r of weekRows ?? []) {
    pathCounts.set(r.path, (pathCounts.get(r.path) ?? 0) + 1)
  }
  const topPaths = [...pathCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)

  const card = (v: string, l: string, color = '#1d2030') => (
    <div className="glass-card" style={{ padding: '16px 18px' }}>
      <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.5px', color }}>{v}</div>
      <div style={{ fontSize: 13, color: 'var(--color-text-muted)', fontWeight: 600, marginTop: 2 }}>{l}</div>
    </div>
  )

  return (
    <>
      <div className="dashboard-header">
        <h1>👀 ผู้เข้าชมเว็บไซต์</h1>
        <p>สถิติการเข้าชม ({rows.length} รายการล่าสุด · ตัด PII ตาม PDPA · ไม่นับ admin)</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 12, marginBottom: 20 }}>
        {card((todayCount ?? 0).toLocaleString(), 'วันนี้', '#5560d8')}
        {card((weekCount ?? 0).toLocaleString(), '7 วันที่ผ่านมา', '#127a52')}
        {card((totalCount ?? 0).toLocaleString(), 'รวมทั้งหมด')}
        {card(String(new Set(rows.map(r => r.ip_prefix).filter(Boolean)).size), 'IP ที่ไม่ซ้ำ (200 ล่าสุด)', '#c2790a')}
      </div>

      {/* Top paths (7d) */}
      <div className="glass-card" style={{ padding: '1rem 1.25rem', marginBottom: 20 }}>
        <h2 style={{ fontSize: '1rem', marginBottom: 12 }}>🔥 หน้าที่เข้าชมเยอะที่สุด (7 วัน)</h2>
        {topPaths.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>ยังไม่มีข้อมูล</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {topPaths.map(([path, n]) => {
              const max = topPaths[0][1]
              const pct = Math.round((n / max) * 100)
              return (
                <div key={path} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ flex: 1, position: 'relative', background: '#f3f4fc', borderRadius: 6, height: 28, overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', inset: 0, width: `${pct}%`, background: 'linear-gradient(90deg,#eef0fd,#dde1ff)' }} />
                    <div style={{ position: 'relative', padding: '0 10px', height: '100%', display: 'flex', alignItems: 'center', fontSize: 13, fontWeight: 600, color: '#1d2030' }}>
                      {path}
                    </div>
                  </div>
                  <div style={{ minWidth: 60, textAlign: 'right', fontWeight: 700, color: '#5560d8' }}>{n.toLocaleString()}</div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Recent visits */}
      <div className="glass-card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid var(--color-border)' }}>
          <h2 style={{ fontSize: '1rem', margin: 0 }}>🕐 รายการล่าสุด</h2>
        </div>
        {rows.length === 0 ? (
          <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>📭</div>
            ยังไม่มีข้อมูลผู้เข้าชม
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  {['เวลา', 'หน้า', 'อุปกรณ์', 'เบราว์เซอร์', 'IP /24', 'อ้างอิงจาก', 'ผู้ใช้'].map((h) => (
                    <th key={h} style={{ padding: '0.625rem 1rem', textAlign: 'left', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '0.55rem 1rem', whiteSpace: 'nowrap', color: 'var(--color-text-muted)' }}>{fmt(r.created_at)}</td>
                    <td style={{ padding: '0.55rem 1rem', maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 600 }}>{r.path}</td>
                    <td style={{ padding: '0.55rem 1rem', textAlign: 'center', fontSize: 16 }}>{deviceOf(r.user_agent)}</td>
                    <td style={{ padding: '0.55rem 1rem', color: 'var(--color-text-secondary)' }}>{browserOf(r.user_agent)}</td>
                    <td style={{ padding: '0.55rem 1rem', color: 'var(--color-text-muted)', fontFamily: 'monospace', fontSize: '0.75rem' }}>{r.ip_prefix || '—'}</td>
                    <td style={{ padding: '0.55rem 1rem', color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>{r.referrer || '—'}</td>
                    <td style={{ padding: '0.55rem 1rem', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>
                      {r.user?.full_name ? (
                        <span style={{ fontWeight: 600 }}>{r.user.full_name}</span>
                      ) : (
                        <span style={{ color: 'var(--color-text-muted)' }}>guest</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
