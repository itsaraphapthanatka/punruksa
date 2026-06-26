import { createAdminClient } from '@/lib/supabase/admin'
import { lineMessagingConfigured, lineUserIdFromEmail, pushLineFlex, siteUrl } from '@/lib/line'

type Admin = ReturnType<typeof createAdminClient>

// ส่ง Flex "ขอบคุณ" หากรรมการที่โหวต approve เมื่อเคสผ่านการอนุมัติ (best effort)
async function notifyApproversThankYou(admin: Admin, caseId: string, roundId: string, approveCount: number) {
  if (!lineMessagingConfigured()) return

  // เคส (ชื่อ) + รูปปก
  const { data: caseRow } = await admin.from('cases').select('title').eq('id', caseId).maybeSingle()
  const { data: coverDoc } = await admin
    .from('case_documents')
    .select('file_url')
    .eq('case_id', caseId)
    .eq('doc_type', 'photo')
    .limit(1)
    .maybeSingle()
  const base = siteUrl()
  const heroUrl = coverDoc?.file_url || `${base}/logo.jpg`
  const title = caseRow?.title || 'เคส'
  const link = `${base}/dashboard/cases/${caseId}`

  // คนที่โหวต approve ในรอบนี้
  const { data: approveVotes } = await admin
    .from('votes')
    .select('voter_id')
    .eq('vote_round_id', roundId)
    .eq('decision', 'approve')
  const voterIds = (approveVotes || []).map((v) => v.voter_id)
  if (voterIds.length === 0) return

  // map → line id (เผื่อ migration 012 ยังไม่ลง → fallback select แบบไม่มี column)
  let voters: { id: string; email: string; line_user_id?: string | null }[] = []
  const withCol = await admin.from('users').select('id, email, line_user_id').in('id', voterIds)
  if (withCol.error) {
    const basic = await admin.from('users').select('id, email').in('id', voterIds)
    voters = (basic.data || []) as typeof voters
  } else {
    voters = (withCol.data || []) as typeof voters
  }

  const bubble = {
    type: 'bubble',
    hero: {
      type: 'image', url: heroUrl, size: 'full', aspectRatio: '20:13', aspectMode: 'cover',
      action: { type: 'uri', uri: link },
    },
    body: {
      type: 'box', layout: 'vertical', spacing: 'md',
      contents: [
        { type: 'text', text: '💜 ปันรักษา · ขอบคุณ', size: 'xs', weight: 'bold', color: '#9166e8' },
        { type: 'text', text: `เคส "${title}" ได้รับการอนุมัติแล้ว 🎉`, weight: 'bold', size: 'md', wrap: true },
        { type: 'text', text: 'ขอบคุณที่ร่วมเป็นกรรมการพิจารณา 🙏 ทุกเสียงของคุณช่วยให้น้องได้รับการรักษา', size: 'sm', color: '#717892', wrap: true },
        {
          type: 'box', layout: 'baseline', spacing: 'sm', margin: 'md',
          contents: [
            { type: 'text', text: 'มติอนุมัติ', color: '#9aa0b8', size: 'sm', flex: 2 },
            { type: 'text', text: `${approveCount} เสียง`, color: '#127a52', size: 'sm', weight: 'bold', flex: 4 },
          ],
        },
      ],
    },
    footer: {
      type: 'box', layout: 'vertical',
      contents: [
        { type: 'button', style: 'primary', color: '#667eea', height: 'sm',
          action: { type: 'uri', label: 'ดูเคส', uri: link } },
      ],
    },
  }
  const altText = `💜 ปันรักษา: เคส "${title}" ได้รับการอนุมัติแล้ว — ขอบคุณที่ร่วมพิจารณา 🙏`

  await Promise.allSettled(
    voters.map((u) => {
      const lid = u.line_user_id || lineUserIdFromEmail(u.email)
      return lid ? pushLineFlex(lid, altText, bubble) : Promise.resolve(false)
    })
  )
}

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

  // เคสผ่าน → ส่ง Flex "ขอบคุณ" หากรรมการที่โหวตอนุมัติ (best effort — ไม่กระทบผลการนับ)
  if (passed) {
    try {
      await notifyApproversThankYou(admin, round.case_id, roundId, approves || 0)
    } catch (e) {
      console.error('LINE thank-you notify error:', e)
    }
  }

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
