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

// ---------- Record Payment (Manual) ----------
export async function recordPayment(prevState: unknown, formData: FormData) {
  const supabase = await createClient()

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

  const caseId = formData.get('case_id') as string

  // Verify case is approved
  const { data: caseData } = await supabase
    .from('cases')
    .select('status')
    .eq('id', caseId)
    .single()

  if (!caseData || caseData.status !== 'approved') {
    return { error: 'เคสนี้ยังไม่ได้รับการอนุมัติ' }
  }

  // Upload receipt
  const file = formData.get('receipt') as File
  if (!file || file.size === 0) {
    return { error: 'กรุณาแนบใบเสร็จ' }
  }

  const fileExt = file.name.split('.').pop()
  const fileName = `receipts/${caseId}/${Date.now()}.${fileExt}`

  const { error: uploadError } = await supabase.storage
    .from('case-files')
    .upload(fileName, file)

  if (uploadError) {
    return { error: 'อัปโหลดใบเสร็จไม่สำเร็จ: ' + uploadError.message }
  }

  const { data: publicUrl } = supabase.storage
    .from('case-files')
    .getPublicUrl(fileName)

  // Save receipt as document
  await supabase.from('case_documents').insert({
    case_id: caseId,
    doc_type: 'bill',
    file_url: publicUrl.publicUrl,
  })

  // Update status to paid
  await supabase
    .from('cases')
    .update({ status: 'paid' })
    .eq('id', caseId)

  await writeAuditLog(supabase, 'payment_recorded', {
    receipt_url: publicUrl.publicUrl,
  }, user.id, caseId)

  // Auto-close
  await supabase
    .from('cases')
    .update({ status: 'closed' })
    .eq('id', caseId)

  await writeAuditLog(supabase, 'case_closed', {}, user.id, caseId)

  revalidatePath('/dashboard/cases')
  revalidatePath(`/dashboard/cases/${caseId}`)
  revalidatePath('/dashboard/admin/payments')

  return { success: true }
}
