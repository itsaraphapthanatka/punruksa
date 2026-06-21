'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

// ---------- บริจาคเข้ากองกลาง (เดโม — ยังไม่ใช่เงินจริง) ----------
export async function donateToPool(prevState: unknown, formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const amount = Number(formData.get('amount'))
  if (!amount || amount <= 0) return { error: 'กรุณาระบุจำนวนเงินที่ถูกต้อง' }
  const message = String(formData.get('message') || '').trim()

  const { error } = await supabase
    .from('donations')
    .insert({ donor_id: user.id, amount, message: message || null, is_demo: true })
  if (error) return { error: 'บันทึกการบริจาคไม่สำเร็จ: ' + error.message }

  await supabase.from('audit_log').insert({
    actor_id: user.id,
    action: 'donation_made',
    details: { amount, demo: true },
  })

  revalidatePath('/dashboard/donate')
  revalidatePath('/dashboard')
  revalidatePath('/')
  return { success: true, amount }
}

// ---------- อัปเดตความคืบหน้าเคส (เจ้าของเคส/แอดมิน) ----------
export async function addCaseUpdate(prevState: unknown, formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const caseId = String(formData.get('case_id') || '')
  const body = String(formData.get('body') || '').trim()
  if (!caseId || !body) return { error: 'กรุณากรอกข้อความอัปเดต' }

  const { error } = await supabase
    .from('case_updates')
    .insert({ case_id: caseId, author_id: user.id, body })
  if (error) return { error: 'โพสต์อัปเดตไม่สำเร็จ: ' + error.message }

  await supabase.from('audit_log').insert({
    actor_id: user.id,
    case_id: caseId,
    action: 'case_update_posted',
    details: {},
  })

  revalidatePath(`/dashboard/cases/${caseId}`)
  return { success: true }
}
