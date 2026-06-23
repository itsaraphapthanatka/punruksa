import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

interface DonationRow {
  id: string
  amount: number
  amount_paid: number | null
  status: string
  method: string | null
  message: string | null
  created_at: string
  trans_id: string | null
  donor_id: string | null
  donor_nickname: string | null
  donor: { full_name: string } | null
  contact: { full_name: string; phone: string }[] | null
}

const STATUS_INFO: Record<string, { label: string; icon: string; color: string }> = {
  completed: { label: 'จ่ายแล้ว', icon: '✅', color: '#127a52' },
  pending: { label: 'รอชำระ', icon: '⏳', color: '#c2790a' },
  expired: { label: 'หมดอายุ', icon: '⏱️', color: '#838aa3' },
  failed: { label: 'ล้มเหลว', icon: '❌', color: '#c2410c' },
}

export default async function AdminDonationsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const { data } = await supabase
    .from('donations')
    .select('id, amount, amount_paid, status, method, message, created_at, trans_id, donor_id, donor_nickname, donor:users(full_name), contact:donation_contacts(full_name, phone)')
    .order('created_at', { ascending: false })
    .limit(200)
  const rows = (data ?? []) as unknown as DonationRow[]

  const completed = rows.filter((r) => r.status === 'completed')
  const totalFund = completed.reduce((s, r) => s + Number(r.amount_paid ?? r.amount ?? 0), 0)
  const pendingCount = rows.filter((r) => r.status === 'pending').length
  const now = new Date()
  const monthSum = completed
    .filter((r) => {
      const d = new Date(r.created_at)
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
    })
    .reduce((s, r) => s + Number(r.amount_paid ?? r.amount ?? 0), 0)

  const fmt = (s: string) =>
    new Date(s).toLocaleString('th-TH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })

  const card = (v: string, l: string, color = '#1d2030') => (
    <div className="glass-card" style={{ padding: '16px 18px' }}>
      <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.5px', color }}>{v}</div>
      <div style={{ fontSize: 13, color: 'var(--color-text-muted)', fontWeight: 600, marginTop: 2 }}>{l}</div>
    </div>
  )

  return (
    <>
      <div className="dashboard-header">
        <h1>💜 รายการบริจาค</h1>
        <p>เงินบริจาคเข้ากองกลางผ่านพร้อมเพย์ ({rows.length} รายการล่าสุด)</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12, marginBottom: 20 }}>
        {card(`${totalFund.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ฿`, 'ยอดกองทุน (จ่ายแล้ว)', '#127a52')}
        {card(String(completed.length), 'บริจาคสำเร็จ')}
        {card(`${monthSum.toLocaleString()} ฿`, 'เดือนนี้', '#5560d8')}
        {card(String(pendingCount), 'รอชำระ', '#c2790a')}
      </div>

      {rows.length === 0 ? (
        <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💜</div>
          <h2>ยังไม่มีรายการบริจาค</h2>
          <p style={{ color: 'var(--color-text-muted)', marginTop: 8 }}>เมื่อมีคนบริจาค รายการจะแสดงที่นี่ (ตั้งค่า PayNoi ให้เสร็จก่อน)</p>
        </div>
      ) : (
        <div className="glass-card" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  {['เวลา', 'สถานะ', 'ยอด (บาท)', 'ชื่อ-สกุล', 'ชื่อเล่น', 'เบอร์โทร', 'ข้อความ'].map((h) => (
                    <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const info = STATUS_INFO[r.status] || { label: r.status, icon: '•', color: '#838aa3' }
                  const shown = Number(r.amount_paid ?? r.amount ?? 0)
                  return (
                    <tr key={r.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap', color: 'var(--color-text-muted)' }}>{fmt(r.created_at)}</td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding: '0.25rem 0.625rem', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 600, background: `${info.color}20`, color: info.color }}>
                          {info.icon} {info.label}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 700, whiteSpace: 'nowrap' }}>{shown.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td style={{ padding: '0.75rem 1rem', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>{r.contact?.[0]?.full_name || r.donor?.full_name || '—'}</td>
                      <td style={{ padding: '0.75rem 1rem', color: 'var(--color-text-secondary)' }}>{r.donor_nickname || '—'}</td>
                      <td style={{ padding: '0.75rem 1rem', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>{r.contact?.[0]?.phone || '—'}</td>
                      <td style={{ padding: '0.75rem 1rem', color: 'var(--color-text-muted)', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.message || '—'}</td>
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
