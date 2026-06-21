'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// ---------- Audit Log Helper ----------
async function writeAuditLog(
  supabase: Awaited<ReturnType<typeof createClient>>,
  action: string,
  details: Record<string, unknown> = {},
  actorId?: string,
  caseId?: string
) {
  await supabase.from('audit_log').insert({
    actor_id: actorId || null,
    case_id: caseId || null,
    action,
    details,
  })
}

// ---------- Submit Vote ----------
export async function submitVote(
  voteRoundId: string,
  decision: 'approve' | 'reject',
  reason: string
) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'กรุณาเข้าสู่ระบบ' }

  if (!reason.trim()) {
    return { error: 'กรุณาระบุเหตุผล (บังคับกรอก)' }
  }

  // Check if user is assigned to this round
  const { data: assignment } = await supabase
    .from('vote_assignments')
    .select('id, has_voted')
    .eq('vote_round_id', voteRoundId)
    .eq('user_id', user.id)
    .single()

  if (!assignment) {
    return { error: 'คุณไม่ได้ถูกมอบหมายให้โหวตในรอบนี้' }
  }

  if (assignment.has_voted) {
    return { error: 'คุณโหวตไปแล้ว' }
  }

  // Check round is still open
  const { data: round } = await supabase
    .from('vote_rounds')
    .select('id, status, case_id, closes_at, required_approvals')
    .eq('id', voteRoundId)
    .single()

  if (!round || round.status !== 'open') {
    return { error: 'รอบโหวตนี้ปิดแล้ว' }
  }

  // Check if expired
  if (new Date(round.closes_at) < new Date()) {
    return { error: 'หมดเวลาโหวตแล้ว' }
  }

  // Insert vote
  const { error: voteError } = await supabase
    .from('votes')
    .insert({
      vote_round_id: voteRoundId,
      voter_id: user.id,
      decision,
      reason,
    })

  if (voteError) {
    return { error: 'ไม่สามารถบันทึกโหวตได้: ' + voteError.message }
  }

  // Update assignment
  await supabase
    .from('vote_assignments')
    .update({ has_voted: true })
    .eq('id', assignment.id)

  // Write audit log
  await writeAuditLog(
    supabase,
    'vote_cast',
    { decision, reason },
    user.id,
    round.case_id
  )

  // ===== Chunk 7: Check vote tally =====
  await checkVoteTally(supabase, voteRoundId, round.case_id, round.required_approvals, user.id)

  revalidatePath('/dashboard/vote')
  revalidatePath(`/dashboard/cases/${round.case_id}`)

  return { success: true }
}

// ---------- Check Vote Tally (Chunk 7) ----------
async function checkVoteTally(
  supabase: Awaited<ReturnType<typeof createClient>>,
  voteRoundId: string,
  caseId: string,
  requiredApprovals: number,
  actorId: string
) {
  // Count approvals
  const { count: approveCount } = await supabase
    .from('votes')
    .select('id', { count: 'exact', head: true })
    .eq('vote_round_id', voteRoundId)
    .eq('decision', 'approve')

  const { count: totalVotes } = await supabase
    .from('votes')
    .select('id', { count: 'exact', head: true })
    .eq('vote_round_id', voteRoundId)

  // If approvals >= required → pass
  if ((approveCount || 0) >= requiredApprovals) {
    await supabase
      .from('vote_rounds')
      .update({ status: 'passed' })
      .eq('id', voteRoundId)

    await supabase
      .from('cases')
      .update({ status: 'approved' })
      .eq('id', caseId)

    await writeAuditLog(supabase, 'vote_round_passed', {
      vote_round_id: voteRoundId,
      approve_count: approveCount,
      total_votes: totalVotes,
      required: requiredApprovals,
    }, actorId, caseId)

    await writeAuditLog(supabase, 'case_approved', {
      vote_round_id: voteRoundId,
    }, actorId, caseId)
  }

  // Check if all assigned voters have voted and still not enough approvals
  const { count: assignedCount } = await supabase
    .from('vote_assignments')
    .select('id', { count: 'exact', head: true })
    .eq('vote_round_id', voteRoundId)

  const { count: votedCount } = await supabase
    .from('vote_assignments')
    .select('id', { count: 'exact', head: true })
    .eq('vote_round_id', voteRoundId)
    .eq('has_voted', true)

  // All voted but not enough approvals → failed
  if ((votedCount || 0) >= (assignedCount || 0) && (approveCount || 0) < requiredApprovals) {
    await supabase
      .from('vote_rounds')
      .update({ status: 'failed' })
      .eq('id', voteRoundId)

    await writeAuditLog(supabase, 'vote_round_failed', {
      vote_round_id: voteRoundId,
      approve_count: approveCount,
      total_votes: totalVotes,
      required: requiredApprovals,
    }, actorId, caseId)
  }
}
