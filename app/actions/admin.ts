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

// ---------- Check Admin Role ----------
async function requireAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Unauthorized')

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') throw new Error('Forbidden: admin only')

  return user
}

// ---------- Verify Case (ผ่านการตรวจ → เปิดรอบโหวตอัตโนมัติ) ----------
export async function verifyCase(caseId: string) {
  const supabase = await createClient()
  const user = await requireAdmin(supabase)

  // Update case status to verifying
  const { error } = await supabase
    .from('cases')
    .update({
      status: 'verifying',
      verified_by: user.id,
      verified_at: new Date().toISOString(),
    })
    .eq('id', caseId)
    .eq('status', 'received') // Only verify if still in received status

  if (error) {
    return { error: 'ไม่สามารถอนุมัติเอกสารได้: ' + error.message }
  }

  await writeAuditLog(supabase, 'case_verified', {
    verified_by: user.id,
  }, user.id, caseId)

  // Auto-open vote round (Chunk 5)
  const { openVoteRound } = await import('@/app/actions/voting')
  const voteResult = await openVoteRound(caseId)

  revalidatePath('/dashboard/admin/verify')
  revalidatePath(`/dashboard/cases/${caseId}`)
  revalidatePath('/dashboard/cases')

  if (voteResult.error) {
    return { success: true, warning: 'ตรวจเอกสารผ่าน แต่เปิดโหวตไม่สำเร็จ: ' + voteResult.error }
  }

  return {
    success: true,
    voteInfo: {
      sampledCount: voteResult.sampledCount,
      requiredApprovals: voteResult.requiredApprovals,
      closesAt: voteResult.closesAt,
    },
  }
}

// ---------- Reject Case (ตีกลับ) ----------
export async function rejectCase(caseId: string, reason: string) {
  const supabase = await createClient()
  const user = await requireAdmin(supabase)

  const { error } = await supabase
    .from('cases')
    .update({ status: 'rejected' })
    .eq('id', caseId)
    .eq('status', 'received')

  if (error) {
    return { error: 'ไม่สามารถตีกลับเคสได้: ' + error.message }
  }

  await writeAuditLog(supabase, 'case_rejected', {
    reason,
    rejected_by: user.id,
  }, user.id, caseId)

  revalidatePath('/dashboard/admin/verify')
  revalidatePath(`/dashboard/cases/${caseId}`)
  revalidatePath('/dashboard/cases')

  return { success: true }
}
