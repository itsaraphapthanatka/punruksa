import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { AdminVerifyClient } from './AdminVerifyClient'
import { OpenRoundsAdmin, type OpenRound } from './OpenRoundsAdmin'

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

  // รอบโหวตที่เปิดอยู่ (อ่านผ่าน service-role — หน้านี้ผ่านการเช็ค admin แล้ว)
  const admin = createAdminClient()
  const { data: openRoundsRaw } = await admin
    .from('vote_rounds')
    .select('id, case_id, required_approvals, sampled_count, closes_at, cases(title, mode)')
    .eq('status', 'open')
    .order('closes_at', { ascending: true })
  const openRounds: OpenRound[] = await Promise.all(
    (openRoundsRaw || []).map(async (r) => {
      const { count: approves } = await admin.from('votes').select('id', { count: 'exact', head: true }).eq('vote_round_id', r.id).eq('decision', 'approve')
      const { count: voted } = await admin.from('vote_assignments').select('id', { count: 'exact', head: true }).eq('vote_round_id', r.id).eq('has_voted', true)
      const c = r.cases as unknown as { title?: string; mode?: string } | null
      return {
        id: r.id,
        title: c?.title || '',
        mode: c?.mode || 'normal',
        required: r.required_approvals,
        sampled: r.sampled_count,
        voted: voted || 0,
        approves: approves || 0,
        closesAt: r.closes_at,
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

      <OpenRoundsAdmin rounds={openRounds} />
    </>
  )
}
