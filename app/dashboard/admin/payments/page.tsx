import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PaymentClient } from './PaymentClient'

export default async function PaymentsPage() {
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

  // Fetch approved cases (ready for payment)
  const { data: approvedCases } = await supabase
    .from('cases')
    .select('id, title, animal_type, clinic_name, requested_amount, mode, status, created_at')
    .eq('status', 'approved')
    .order('created_at', { ascending: true })

  // แนบเอกสารของแต่ละเคส (รูป/บิล/ใบประเมิน) ให้แอดมินดูก่อนจ่าย
  const casesWithDocs = await Promise.all(
    (approvedCases || []).map(async (c) => {
      const { data: docs } = await supabase
        .from('case_documents')
        .select('id, doc_type, file_url')
        .eq('case_id', c.id)
      return { ...c, documents: docs || [] }
    })
  )

  return (
    <>
      <div className="dashboard-header">
        <h1>💸 บันทึกการจ่ายเงิน</h1>
        <p>เคสที่อนุมัติแล้ว รอบันทึกการจ่ายจากมูลนิธิ ({casesWithDocs.length} เคส)</p>
      </div>

      {casesWithDocs.length === 0 ? (
        <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💰</div>
          <h2 style={{ marginBottom: '0.5rem' }}>ไม่มีเคสรอจ่ายเงิน</h2>
          <p style={{ color: 'var(--color-text-secondary)' }}>เคสทั้งหมดถูกจ่ายเงินแล้ว</p>
        </div>
      ) : (
        <PaymentClient cases={casesWithDocs} />
      )}
    </>
  )
}
