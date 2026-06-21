'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

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

// ---------- Create Case ----------
export async function createCase(prevState: unknown, formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'กรุณาเข้าสู่ระบบก่อน' }
  }

  const title = formData.get('title') as string
  const animalType = formData.get('animal_type') as string
  const symptoms = formData.get('symptoms') as string
  const clinicName = formData.get('clinic_name') as string
  const requestedAmount = parseFloat(formData.get('requested_amount') as string)
  const mode = formData.get('mode') as string

  // Validation
  if (!title || !animalType || !symptoms || !requestedAmount) {
    return { error: 'กรุณากรอกข้อมูลให้ครบถ้วน' }
  }

  if (isNaN(requestedAmount) || requestedAmount <= 0) {
    return { error: 'จำนวนเงินไม่ถูกต้อง' }
  }

  if (!['normal', 'emergency'].includes(mode)) {
    return { error: 'โหมดเคสไม่ถูกต้อง' }
  }

  // Create case
  const { data: newCase, error: caseError } = await supabase
    .from('cases')
    .insert({
      title,
      animal_type: animalType,
      symptoms,
      clinic_name: clinicName || null,
      requested_amount: requestedAmount,
      mode,
      status: 'received',
      created_by: user.id,
    })
    .select('id')
    .single()

  if (caseError) {
    console.error('Case creation error:', caseError)
    return { error: 'ไม่สามารถสร้างเคสได้: ' + caseError.message }
  }

  // Upload files
  const files = formData.getAll('files') as File[]
  const docType = formData.get('doc_type') as string || 'photo'

  for (const file of files) {
    if (file.size === 0) continue

    const fileExt = file.name.split('.').pop()
    const fileName = `${newCase.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('case-files')
      .upload(fileName, file)

    if (uploadError) {
      console.error('Upload error:', uploadError)
      continue
    }

    const { data: publicUrl } = supabase.storage
      .from('case-files')
      .getPublicUrl(fileName)

    // Determine doc type from file
    let detectedDocType: 'photo' | 'bill' | 'vet_estimate' = 'photo'
    if (file.name.toLowerCase().includes('bill') || file.name.toLowerCase().includes('ใบเสร็จ')) {
      detectedDocType = 'bill'
    } else if (file.name.toLowerCase().includes('estimate') || file.name.toLowerCase().includes('ประเมิน')) {
      detectedDocType = 'vet_estimate'
    }

    await supabase.from('case_documents').insert({
      case_id: newCase.id,
      doc_type: detectedDocType,
      file_url: publicUrl.publicUrl,
    })
  }

  // Write audit log
  await writeAuditLog(
    supabase,
    'case_created',
    {
      title,
      animal_type: animalType,
      mode,
      requested_amount: requestedAmount,
      files_count: files.filter((f) => f.size > 0).length,
    },
    user.id,
    newCase.id
  )

  revalidatePath('/dashboard/cases')
  redirect('/dashboard/cases')
}
