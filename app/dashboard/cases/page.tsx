import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { CaseCard } from '../CaseCard'
import { getCaseCovers } from '@/lib/stats'

interface CaseRow {
  id: string
  title: string
  animal_type: string
  clinic_name: string | null
  requested_amount: number
  mode: 'normal' | 'emergency'
  status: string
  created_at: string
  created_by: string
}

const FILTERS = [
  { key: '', label: 'ทั้งหมด' },
  { key: 'received', label: 'รับเรื่อง' },
  { key: 'voting', label: 'กำลังโหวต' },
  { key: 'approved', label: 'อนุมัติแล้ว' },
  { key: 'closed', label: 'จ่ายแล้ว' },
  { key: 'rejected', label: 'ไม่ผ่าน' },
]

export default async function CasesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status: statusFilter = '' } = await searchParams
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  let query = supabase
    .from('cases')
    .select('id, title, animal_type, clinic_name, requested_amount, mode, status, created_at, created_by')
    .order('created_at', { ascending: false })
  if (statusFilter) query = query.eq('status', statusFilter)
  const { data, error } = await query
  const cases = (data ?? []) as CaseRow[]
  const covers = await getCaseCovers(cases.map((c) => c.id))

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 18 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, letterSpacing: '-0.3px' }}>รายการเคส</h1>
          <p style={{ margin: '4px 0 0', color: '#838aa3', fontSize: 14 }}>เคสทั้งหมดในระบบ (ปิดบังตัวตนเจ้าของตาม PDPA)</p>
        </div>
        <Link href="/dashboard/cases/new" className="btn btn-primary">＋ เปิดเคสใหม่</Link>
      </div>

      {/* filter chips */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
        {FILTERS.map((f) => {
          const active = statusFilter === f.key
          return (
            <Link
              key={f.key || 'all'}
              href={f.key ? `/dashboard/cases?status=${f.key}` : '/dashboard/cases'}
              style={{
                padding: '7px 14px', borderRadius: 999, fontSize: 13, fontWeight: 700,
                border: '1px solid ' + (active ? '#667eea' : '#e3e4f0'),
                background: active ? '#667eea' : '#fff',
                color: active ? '#fff' : '#717892',
              }}
            >
              {f.label}
            </Link>
          )
        })}
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: 16 }}><span>⚠️</span> โหลดข้อมูลไม่สำเร็จ: {error.message}</div>
      )}

      {cases.length === 0 ? (
        <div style={{ background: '#fff', border: '1px dashed #dfe1ef', borderRadius: 14, padding: 48, textAlign: 'center', color: '#9aa0b8' }}>
          {statusFilter ? 'ไม่มีเคสในสถานะนี้' : 'ยังไม่มีเคส'} — <Link href="/dashboard/cases/new" style={{ color: '#5560d8', fontWeight: 700 }}>เปิดเคสใหม่</Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(250px,1fr))', gap: 16 }}>
          {cases.map((c) => (
            <CaseCard key={c.id} c={c} cover={covers[c.id]} href={`/dashboard/cases/${c.id}`} ownerTag={c.created_by === user?.id} />
          ))}
        </div>
      )}
    </>
  )
}
