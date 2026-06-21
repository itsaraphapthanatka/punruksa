import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AuditLogPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/dashboard')

  // Fetch recent audit logs (limit 100)
  const { data: logs } = await supabase
    .from('audit_log')
    .select('id, action, details, created_at, case_id, actor_id')
    .order('created_at', { ascending: false })
    .limit(100)

  const actionLabels: Record<string, { label: string; icon: string; color: string }> = {
    user_registered: { label: 'สมัครสมาชิก', icon: '👤', color: '#60a5fa' },
    user_login: { label: 'เข้าสู่ระบบ', icon: '🔑', color: '#34d399' },
    user_logout: { label: 'ออกจากระบบ', icon: '🚪', color: '#9898b8' },
    case_created: { label: 'เปิดเคส', icon: '📝', color: '#a78bfa' },
    case_verified: { label: 'ตรวจเอกสารผ่าน', icon: '✅', color: '#34d399' },
    case_rejected: { label: 'ตีกลับเคส', icon: '❌', color: '#f87171' },
    case_approved: { label: 'อนุมัติเคส', icon: '🎉', color: '#2dd4bf' },
    case_closed: { label: 'ปิดเคส', icon: '📁', color: '#9898b8' },
    vote_round_opened: { label: 'เปิดรอบโหวต', icon: '🗳️', color: '#fbbf24' },
    vote_round_passed: { label: 'โหวตผ่าน', icon: '✅', color: '#34d399' },
    vote_round_failed: { label: 'โหวตไม่ผ่าน', icon: '❌', color: '#f87171' },
    vote_cast: { label: 'ลงคะแนน', icon: '🗳️', color: '#a78bfa' },
    payment_recorded: { label: 'บันทึกจ่ายเงิน', icon: '💸', color: '#2dd4bf' },
  }

  return (
    <>
      <div className="dashboard-header">
        <h1>📜 Audit Log</h1>
        <p>บันทึกทุกการกระทำในระบบ ({logs?.length || 0} รายการล่าสุด)</p>
      </div>

      {(!logs || logs.length === 0) ? (
        <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📜</div>
          <h2>ยังไม่มี log</h2>
        </div>
      ) : (
        <div className="glass-card" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>เวลา</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>การกระทำ</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>เคส</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>ผู้กระทำ</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>รายละเอียด</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => {
                  const info = actionLabels[log.action] || { label: log.action, icon: '📋', color: '#9898b8' }

                  return (
                    <tr key={log.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap', color: 'var(--color-text-muted)' }}>
                        {new Date(log.created_at).toLocaleString('th-TH', {
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit',
                        })}
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.375rem',
                          padding: '0.25rem 0.625rem',
                          borderRadius: 'var(--radius-full)',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          background: `${info.color}20`,
                          color: info.color,
                        }}>
                          {info.icon} {info.label}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: 'var(--color-text-secondary)' }}>
                        {log.case_id ? log.case_id.slice(0, 8) + '...' : '—'}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: 'var(--color-text-secondary)' }}>
                        {log.actor_id ? log.actor_id.slice(0, 8) + '...' : '—'}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: 'var(--color-text-muted)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {log.details ? JSON.stringify(log.details).slice(0, 60) : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  )
}
