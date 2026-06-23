import { createAdminClient } from '@/lib/supabase/admin'

type Admin = ReturnType<typeof createAdminClient>

// สรุปผลรอบโหวต 1 รอบ (idempotent — ทำเฉพาะรอบที่ยัง 'open')
// อนุมัติครบเกณฑ์ → passed + case approved · ไม่ครบ → failed + case rejected
export async function tallyAndClose(
  admin: Admin,
  roundId: string
): Promise<{ changed: boolean; status?: string; approves?: number }> {
  const { data: round } = await admin
    .from('vote_rounds')
    .select('id, case_id, status, required_approvals')
    .eq('id', roundId)
    .maybeSingle()
  if (!round || round.status !== 'open') return { changed: false, status: round?.status }

  const { count: approves } = await admin
    .from('votes')
    .select('id', { count: 'exact', head: true })
    .eq('vote_round_id', roundId)
    .eq('decision', 'approve')

  const passed = (approves || 0) >= round.required_approvals
  await admin.from('vote_rounds').update({ status: passed ? 'passed' : 'failed' }).eq('id', roundId).eq('status', 'open')
  await admin.from('cases').update({ status: passed ? 'approved' : 'rejected' }).eq('id', round.case_id).eq('status', 'voting')
  await admin.from('audit_log').insert({
    case_id: round.case_id,
    action: passed ? 'vote_round_passed' : 'vote_round_failed',
    details: { vote_round_id: roundId, approve_count: approves || 0, required: round.required_approvals },
  })
  return { changed: true, status: passed ? 'passed' : 'failed', approves: approves || 0 }
}

// ปิดทุกรอบที่หมดเวลา (closes_at < ปัจจุบัน) แต่ยังเปิดอยู่
export async function closeExpiredRounds(admin: Admin): Promise<{ id: string; status?: string }[]> {
  const nowIso = new Date().toISOString()
  const { data: expired } = await admin
    .from('vote_rounds')
    .select('id')
    .eq('status', 'open')
    .lt('closes_at', nowIso)
  const out: { id: string; status?: string }[] = []
  for (const r of expired || []) {
    const res = await tallyAndClose(admin, r.id)
    out.push({ id: r.id, status: res.status })
  }
  return out
}
