'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { tallyAndClose } from '@/lib/vote-tally'
import { revalidatePath } from 'next/cache'

// ---------- สรุป/ปิดรอบโหวตเดี๋ยวนี้ (แอดมิน) ----------
export async function finalizeVoteRound(voteRoundId: string): Promise<{ success?: boolean; result?: string; error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { error: 'Forbidden: admin only' }

  const admin = createAdminClient()
  const res = await tallyAndClose(admin, voteRoundId)
  if (!res.changed) return { error: 'รอบนี้ปิด/สรุปผลไปแล้ว' }

  await admin.from('audit_log').insert({
    actor_id: user.id,
    action: 'vote_round_finalized_manual',
    details: { vote_round_id: voteRoundId, result: res.status, approve_count: res.approves },
  })

  revalidatePath('/dashboard/admin/verify')
  revalidatePath('/dashboard/cases')
  revalidatePath('/')
  return { success: true, result: res.status }
}

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

// ---------- Open Vote Round ----------
export async function openVoteRound(caseId: string) {
  const supabase = await createClient()

  // Check admin
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Unauthorized' }

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') return { error: 'Forbidden: admin only' }

  // Fetch case
  const { data: caseData, error: caseError } = await supabase
    .from('cases')
    .select('id, mode, created_by, status')
    .eq('id', caseId)
    .single()

  if (caseError || !caseData) {
    return { error: 'ไม่พบเคส' }
  }

  if (caseData.status !== 'verifying') {
    return { error: 'เคสนี้ยังไม่พร้อมเปิดโหวต (ต้องอยู่สถานะ verifying)' }
  }

  // Determine mode settings
  const isEmergency = caseData.mode === 'emergency'
  const sampleSize = isEmergency ? 15 : 20
  const requiredApprovals = isEmergency ? 10 : 12
  const hoursToClose = isEmergency ? 4 : 48

  // Fetch eligible approvers (role=approver, is_verified=true, NOT the case creator)
  const { data: approvers, error: approverError } = await supabase
    .from('users')
    .select('id')
    .eq('role', 'approver')
    .eq('is_verified', true)
    .neq('id', caseData.created_by)

  if (approverError) {
    return { error: 'ไม่สามารถดึงรายชื่อผู้อนุมัติได้: ' + approverError.message }
  }

  if (!approvers || approvers.length === 0) {
    return { error: 'ไม่มีผู้อนุมัติที่ผ่านการยืนยันตัวตนในระบบ' }
  }

  // Randomly sample approvers (Fisher-Yates shuffle)
  const shuffled = [...approvers]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  const sampled = shuffled.slice(0, Math.min(sampleSize, shuffled.length))

  // Calculate closes_at
  const now = new Date()
  const closesAt = new Date(now.getTime() + hoursToClose * 60 * 60 * 1000)

  // Create vote round
  const { data: voteRound, error: roundError } = await supabase
    .from('vote_rounds')
    .insert({
      case_id: caseId,
      mode: caseData.mode,
      required_approvals: requiredApprovals,
      sampled_count: sampled.length,
      opens_at: now.toISOString(),
      closes_at: closesAt.toISOString(),
      status: 'open',
    })
    .select('id')
    .single()

  if (roundError || !voteRound) {
    return { error: 'ไม่สามารถสร้างรอบโหวตได้: ' + roundError?.message }
  }

  // Create vote assignments
  const assignments = sampled.map((a) => ({
    vote_round_id: voteRound.id,
    user_id: a.id,
    has_voted: false,
  }))

  const { error: assignError } = await supabase
    .from('vote_assignments')
    .insert(assignments)

  if (assignError) {
    console.error('Assignment error:', assignError)
    return { error: 'ไม่สามารถมอบหมายผู้โหวตได้: ' + assignError.message }
  }

  // Update case status to 'voting'
  await supabase
    .from('cases')
    .update({ status: 'voting' })
    .eq('id', caseId)

  // Write audit log
  await writeAuditLog(
    supabase,
    'vote_round_opened',
    {
      vote_round_id: voteRound.id,
      mode: caseData.mode,
      sampled_count: sampled.length,
      required_approvals: requiredApprovals,
      closes_at: closesAt.toISOString(),
      sampled_users: sampled.map((a) => a.id),
    },
    user.id,
    caseId
  )

  // แจ้งเตือนกรรมการที่ล็อกอินด้วย LINE (best effort — ไม่ทำให้เปิดรอบล้มถ้าส่งไม่ได้)
  try {
    const { lineMessagingConfigured, lineUserIdFromEmail, pushLineText, siteUrl } = await import('@/lib/line')
    if (lineMessagingConfigured()) {
      const { data: sampledUsers } = await supabase.from('users').select('id, email').in('id', sampled.map((a) => a.id))
      const link = `${siteUrl()}/dashboard/vote`
      const msg = `🐾 ปันรักษา\nคุณถูกสุ่มเป็น "กรรมการ" พิจารณาเคสใหม่!\nช่วยอ่านรายละเอียดและลงมติภายในเวลาที่กำหนด 🗳️\n${link}`
      await Promise.allSettled(
        (sampledUsers || []).map((u) => {
          const lid = lineUserIdFromEmail(u.email)
          return lid ? pushLineText(lid, msg) : Promise.resolve(false)
        })
      )
    }
  } catch (e) {
    console.error('LINE notify error:', e)
  }

  revalidatePath('/dashboard/admin/verify')
  revalidatePath(`/dashboard/cases/${caseId}`)
  revalidatePath('/dashboard/cases')

  return {
    success: true,
    sampledCount: sampled.length,
    requiredApprovals,
    closesAt: closesAt.toISOString(),
  }
}
