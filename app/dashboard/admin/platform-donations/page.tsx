import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

interface Row {
  id: string
  charge_id: string
  reference: string | null
  amount: number
  status: string
  donor_name: string | null
  message: string | null
  paid_at: string | null
  created_at: string
}

const STATUS_INFO: Record<string, { label: string; icon: string; color: string }> = {
  completed: { label: 'สำเร็จ', icon: '✅', color: '#127a52' },
  pending: { label: 'รอชำระ', icon: '⏳', color: '#c2790a' },
  expired: { label: 'หมดอายุ', icon: '⏱️', color: '#838aa3' },
}

export default async function AdminPlatformDonationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const { data, error } = await supabase
    .from('platform_donations')
    .select('id, charge_id, reference, amount, status, donor_name, message, paid_at, created_at')
    .order('created_at', { ascending: false })
    .limit(300)

  // ตารางยังไม่ถูกสร้าง → แนะนำ apply migration
  if (error && /relation .* does not exist|Could not find the table/i.test(error.message)) {
    return (
      <>
        <div className="dashboard-header"><h1>☕️ ค่าดูแลระบบ</h1></div>
        <div className="glass-card" style={{ padding: '2rem', textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>⚠️</div>
          <h2 style={{ marginBottom: 8 }}>ต้องรัน migration ก่อน</h2>
          <p style={{ color: 'var(--color-text-muted)' }}>
            เปิด Supabase Studio → SQL Editor แล้วรัน <code>supabase/migrations/013_platform_donations.sql</code>
          </p>
        </div>
      </>
    )
  }

  const rows = (data ?? []) as Row[]
  const completed = rows.filter((r) => r.status === 'completed')
  const total = completed.reduce((s, r) => s + Number(r.amount || 0), 0)
  const pendingCount = rows.filter((r) => r.status === 'pending').length
  const now = new Date()
  const monthSum = completed
    .filter((r) => { const dt = new Date(r.paid_at || r.created_at); return dt.getFullYear() === now.getFullYear() && dt.getMonth() === now.getMonth() })
    .reduce((s, r) => s + Number(r.amount || 0), 0)

  const fmt = (s: string) => new Date(s).toLocaleString('th-TH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })

  const card = (v: string, l: string, color = '#1d2030') => (
    <div className="glass-card" style={{ padding: '16px 18px' }}>
      <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.5px', color }}>{v}</div>
      <div style={{ fontSize: 13, color: 'var(--color-text-muted)', fontWeight: 600, marginTop: 2 }}>{l}</div>
    </div>
  )

  return (
    <>
      <div className="dashboard-header">
        <h1>☕️ ค่าดูแลระบบ</h1>
        <p>เงินสนับสนุนค่าดำเนินงานแพลตฟอร์มผ่าน PunPay — แยกจากกองทุนรักษาสัตว์ ({rows.length} รายการล่าสุด)</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12, marginBottom: 20 }}>
        {card(`${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ฿`, 'ยอดรวม (จ่ายแล้ว)', '#127a52')}
        {card(String(completed.length), 'สนับสนุนสำเร็จ')}
        {card(`${monthSum.toLocaleString()} ฿`, 'เดือนนี้', '#5560d8')}
        {card(String(pendingCount), 'รอชำระ', '#c2790a')}
      </div>

      {rows.length === 0 ? (
        <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>☕️</div>
          <h2>ยังไม่มีรายการสนับสนุน</h2>
          <p style={{ color: 'var(--color-text-muted)', marginTop: 8 }}>เมื่อมีผู้สนับสนุนค่าดูแลระบบ รายการจะแสดงที่นี่</p>
        </div>
      ) : (
        <div className="glass-card" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  {['เวลา', 'สถานะ', 'ยอด (บาท)', 'ผู้สนับสนุน', 'ข้อความ', 'charge id'].map((h) => (
                    <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const info = STATUS_INFO[r.status] || { label: r.status, icon: '•', color: '#838aa3' }
                  return (
                    <tr key={r.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap', color: 'var(--color-text-muted)' }}>{fmt(r.created_at)}</td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding: '0.25rem 0.625rem', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 600, background: `${info.color}20`, color: info.color }}>
                          {info.icon} {info.label}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 700, whiteSpace: 'nowrap' }}>{Number(r.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td style={{ padding: '0.75rem 1rem', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>{r.donor_name || '—'}</td>
                      <td style={{ padding: '0.75rem 1rem', color: 'var(--color-text-muted)', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.message || '—'}</td>
                      <td style={{ padding: '0.75rem 1rem', color: 'var(--color-text-muted)', fontFamily: 'monospace', fontSize: '0.7rem' }}>{r.charge_id}</td>
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
