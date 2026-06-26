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
    .select('id, mode, created_by, status, title, animal_type, requested_amount')
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

  // แจ้งเตือนกรรมการผ่าน LINE — Flex Message การ์ดมีรูปเคส (best effort — ไม่ทำให้เปิดรอบล้มถ้าส่งไม่ได้)
  // ใช้ line_user_id ที่ผูกไว้ (เชื่อมต่อที่หน้าโปรไฟล์) ก่อน — ถ้าไม่มีค่อย fallback ไป email สังเคราะห์ของคน login ด้วย LINE
  try {
    const { lineMessagingConfigured, lineUserIdFromEmail, pushLineFlex, siteUrl } = await import('@/lib/line')
    if (lineMessagingConfigured()) {
      const base = siteUrl()
      const link = `${base}/dashboard/vote`

      // รูปปกเคส (รูปแรก doc_type=photo) — fallback เป็นโลโก้ถ้าไม่มี
      const { data: coverDoc } = await supabase
        .from('case_documents')
        .select('file_url')
        .eq('case_id', caseId)
        .eq('doc_type', 'photo')
        .limit(1)
        .maybeSingle()
      const heroUrl = coverDoc?.file_url || `${base}/logo.jpg`

      const closesText = closesAt.toLocaleString('th-TH', {
        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
      })
      const amountText = Number(caseData.requested_amount).toLocaleString() + ' บาท'
      const title = caseData.title || 'เคสใหม่'

      const infoRow = (label: string, value: string, color = '#1d2030') => ({
        type: 'box', layout: 'baseline', spacing: 'sm',
        contents: [
          { type: 'text', text: label, color: '#9aa0b8', size: 'sm', flex: 2 },
          { type: 'text', text: value, color, size: 'sm', weight: 'bold', flex: 4, wrap: true },
        ],
      })

      const bubble = {
        type: 'bubble',
        hero: {
          type: 'image',
          url: heroUrl,
          size: 'full',
          aspectRatio: '20:13',
          aspectMode: 'cover',
          action: { type: 'uri', uri: link },
        },
        body: {
          type: 'box', layout: 'vertical', spacing: 'md',
          contents: [
            { type: 'text', text: '🐾 ปันรักษา · รอบโหวตใหม่', size: 'xs', weight: 'bold', color: '#9166e8' },
            { type: 'text', text: title, weight: 'bold', size: 'lg', wrap: true },
            {
              type: 'box', layout: 'vertical', margin: 'md', spacing: 'sm',
              contents: [
                infoRow('ชนิดสัตว์', caseData.animal_type || '-'),
                infoRow('ยอดที่ขอ', amountText, '#127a52'),
                infoRow('โหมด', isEmergency ? '🚨 ฉุกเฉิน' : 'ปกติ', isEmergency ? '#c2410c' : '#1d2030'),
                infoRow('ปิดโหวต', closesText),
              ],
            },
            { type: 'text', text: 'คุณถูกสุ่มเป็นกรรมการพิจารณาเคสนี้ — ช่วยลงมติภายในเวลาที่กำหนด 🗳️', size: 'xs', color: '#717892', wrap: true, margin: 'md' },
          ],
        },
        footer: {
          type: 'box', layout: 'vertical',
          contents: [
            { type: 'button', style: 'primary', color: '#667eea', height: 'sm',
              action: { type: 'uri', label: 'พิจารณาเคสนี้', uri: link } },
          ],
        },
      }
      const altText = `🐾 ปันรักษา: คุณถูกสุ่มเป็นกรรมการพิจารณาเคส "${title}" — ลงมติได้ที่ ${link}`

      const ids = sampled.map((a) => a.id)
      // เผื่อ migration 012 ยังไม่ลง (ไม่มี column line_user_id) → fallback select แบบไม่มี column นั้น
      let sampledUsers: { id: string; email: string; line_user_id?: string | null }[] = []
      const withCol = await supabase.from('users').select('id, email, line_user_id').in('id', ids)
      if (withCol.error) {
        const basic = await supabase.from('users').select('id, email').in('id', ids)
        sampledUsers = (basic.data || []) as typeof sampledUsers
      } else {
        sampledUsers = (withCol.data || []) as typeof sampledUsers
      }
      await Promise.allSettled(
        sampledUsers.map((u) => {
          const lid = u.line_user_id || lineUserIdFromEmail(u.email)
          return lid ? pushLineFlex(lid, altText, bubble) : Promise.resolve(false)
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
