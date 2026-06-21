import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { VoteClient } from './VoteClient'

export default async function VotePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Fetch vote assignments for this user where round is open and not yet voted
  const { data: assignments } = await supabase
    .from('vote_assignments')
    .select(`
      id,
      vote_round_id,
      has_voted,
      vote_rounds (
        id,
        case_id,
        mode,
        required_approvals,
        sampled_count,
        opens_at,
        closes_at,
        status
      )
    `)
    .eq('user_id', user.id)
    .eq('has_voted', false)

  // Filter only open rounds
  const pendingAssignments = (assignments || []).filter(
    (a) => {
      const round = a.vote_rounds as unknown as {
        id: string; case_id: string; mode: string; required_approvals: number;
        sampled_count: number; opens_at: string; closes_at: string; status: string;
      }
      return round && round.status === 'open'
    }
  )

  // Fetch case details for each assignment (PDPA: hide owner info)
  const casesForVote = await Promise.all(
    pendingAssignments.map(async (a) => {
      const round = a.vote_rounds as unknown as {
        id: string; case_id: string; mode: string; required_approvals: number;
        sampled_count: number; opens_at: string; closes_at: string; status: string;
      }

      const { data: caseData } = await supabase
        .from('cases')
        .select('id, title, animal_type, symptoms, clinic_name, requested_amount, mode, created_at')
        .eq('id', round.case_id)
        .single()

      // Fetch case documents (photos, bills)
      const { data: docs } = await supabase
        .from('case_documents')
        .select('id, doc_type, file_url')
        .eq('case_id', round.case_id)

      // Count current votes
      const { count: approveCount } = await supabase
        .from('votes')
        .select('id', { count: 'exact', head: true })
        .eq('vote_round_id', round.id)
        .eq('decision', 'approve')

      const { count: totalVotes } = await supabase
        .from('votes')
        .select('id', { count: 'exact', head: true })
        .eq('vote_round_id', round.id)

      return {
        assignmentId: a.id,
        voteRoundId: round.id,
        closesAt: round.closes_at,
        requiredApprovals: round.required_approvals,
        sampledCount: round.sampled_count,
        approveCount: approveCount || 0,
        totalVotes: totalVotes || 0,
        caseData: caseData
          ? {
              // PDPA: DO NOT include created_by, owner name, phone, address
              id: caseData.id,
              title: caseData.title,
              animalType: caseData.animal_type,
              symptoms: caseData.symptoms,
              clinicName: caseData.clinic_name,
              requestedAmount: caseData.requested_amount,
              mode: caseData.mode,
              createdAt: caseData.created_at,
            }
          : null,
        documents: docs || [],
      }
    })
  )

  return (
    <>
      <div className="dashboard-header">
        <h1>🗳️ เคสที่ฉันต้องโหวต</h1>
        <p>คุณถูกสุ่มเลือกให้พิจารณาเคสด้านล่าง ({casesForVote.length} เคส)</p>
      </div>

      {casesForVote.length === 0 ? (
        <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
          <h2 style={{ marginBottom: '0.5rem' }}>ไม่มีเคสรอโหวต</h2>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            ยังไม่มีเคสที่คุณถูกมอบหมายให้โหวตในตอนนี้
          </p>
        </div>
      ) : (
        <VoteClient cases={casesForVote} />
      )}
    </>
  )
}
