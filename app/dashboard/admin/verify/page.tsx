import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AdminVerifyClient } from './AdminVerifyClient'

export default async function AdminVerifyPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Check admin role
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    redirect('/dashboard')
  }

  // Fetch pending cases (status = 'received')
  const { data: pendingCases } = await supabase
    .from('cases')
    .select(`
      id, title, animal_type, symptoms, clinic_name,
      requested_amount, mode, status, created_at, created_by
    `)
    .eq('status', 'received')
    .order('created_at', { ascending: true })

  // Fetch documents for each case
  const casesWithDocs = await Promise.all(
    (pendingCases || []).map(async (c) => {
      const { data: docs } = await supabase
        .from('case_documents')
        .select('id, doc_type, file_url')
        .eq('case_id', c.id)

      // Get creator name (admin can see)
      const { data: creator } = await supabase
        .from('users')
        .select('full_name, email')
        .eq('id', c.created_by)
        .single()

      return {
        ...c,
        documents: docs || [],
        creator_name: creator?.full_name || 'ไม่ทราบ',
        creator_email: creator?.email || '',
      }
    })
  )

  return (
    <>
      <div className="dashboard-header">
        <h1>✅ ตรวจเอกสาร</h1>
        <p>เคสที่รอการตรวจสอบจาก Admin ({casesWithDocs.length} เคส)</p>
      </div>

      {casesWithDocs.length === 0 ? (
        <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✨</div>
          <h2 style={{ marginBottom: '0.5rem' }}>ไม่มีเคสรอตรวจ</h2>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            เคสทั้งหมดผ่านการตรวจแล้ว
          </p>
        </div>
      ) : (
        <AdminVerifyClient cases={casesWithDocs} />
      )}
    </>
  )
}
