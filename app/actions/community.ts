'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { paynoiCreate, paynoiCheck, paynoiCancel } from '@/lib/paynoi'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

// ---------- สร้างรายการบริจาค (ไม่ต้องล็อกอิน, PromptPay ผ่าน PayNoi) ----------
// เก็บชื่อเล่นบน donations (โชว์ได้), เก็บชื่อจริง+เบอร์ใน donation_contacts (เฉพาะแอดมิน)
// insert ผ่าน service-role เพื่อไม่ต้องเปิด RLS ให้คนนอก
export async function createPublicDonation(prevState: unknown, formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser() // อาจไม่มี (guest) ก็ได้

  const amount = Math.floor(Number(formData.get('amount')))
  if (!amount || amount <= 0) return { error: 'กรุณาระบุจำนวนเงินที่ถูกต้อง' }

  const firstName = String(formData.get('first_name') || '').trim()
  const lastName = String(formData.get('last_name') || '').trim()
  const nickname = String(formData.get('nickname') || '').trim()
  const phone = String(formData.get('phone') || '').trim()
  const message = String(formData.get('message') || '').trim()

  if (!firstName || !lastName) return { error: 'กรุณากรอกชื่อและนามสกุล' }
  if (!/^[0-9+\-\s]{8,15}$/.test(phone)) return { error: 'กรุณากรอกเบอร์โทรให้ถูกต้อง' }

  const ref1 = `pn_${(user?.id || 'guest').slice(0, 8)}_${Date.now()}`
  const charge = await paynoiCreate({ amount, ref1 })
  if (!charge.ok) return { error: 'สร้างรายการชำระไม่สำเร็จ: ' + (charge.error || '') }

  // PayNoi คืน expire_at เป็นเวลาไทยแบบ naive (เพี้ยนเมื่อเก็บเป็น UTC) → คำนวณเอง = now + 15 นาที
  const expireAt = new Date(Date.now() + 15 * 60 * 1000).toISOString()

  const admin = createAdminClient()
  const { data: inserted, error } = await admin
    .from('donations')
    .insert({
      donor_id: user?.id ?? null,
      amount,
      amount_paid: charge.amount ? Number(charge.amount) : null,
      message: message || null,
      donor_nickname: nickname || firstName || null,
      is_demo: false,
      status: 'pending',
      method: 'promptpay_paynoi',
      trans_id: charge.trans_id,
      ref1,
      expire_at: expireAt,
    })
    .select('id')
    .single()
  if (error || !inserted) return { error: 'บันทึกการบริจาคไม่สำเร็จ: ' + (error?.message || '') }

  // เก็บข้อมูลติดต่อ (PII) แยก — เฉพาะแอดมินอ่านได้
  await admin.from('donation_contacts').insert({
    donation_id: inserted.id,
    full_name: `${firstName} ${lastName}`,
    phone,
  })

  return {
    success: true,
    trans_id: charge.trans_id,
    qr: charge.qr,
    amountToPay: charge.amount,
    expireAt,
    amount,
  }
}

// ---------- เช็กสถานะการจ่าย (เรียกจาก client เป็นระยะ, ไม่ต้องล็อกอิน) ----------
// ยืนยันกับ PayNoi โดยตรง แล้วอัปเดต DB ด้วย service-role ถ้าจ่ายแล้ว (ทำงานได้แม้ webhook ยังไม่ถูกตั้งค่า)
export async function checkDonationStatus(trans_id: string): Promise<{ status: string }> {
  if (!trans_id) return { status: 'invalid' }
  const supabase = await createClient()

  const { data: row } = await supabase
    .from('donations')
    .select('status, expire_at')
    .eq('trans_id', trans_id)
    .maybeSingle()
  if (!row) return { status: 'not_found' }
  if (row.status === 'completed') return { status: 'completed' }
  if (row.status === 'expired') return { status: 'expired' }

  const chk = await paynoiCheck(trans_id)
  if (chk.ok && chk.paymentStatus === 'completed') {
    const admin = createAdminClient()
    await admin
      .from('donations')
      .update({ status: 'completed', amount_paid: Number(chk.amount) || null })
      .eq('trans_id', trans_id)
      .eq('status', 'pending')
    await admin.from('audit_log').insert({
      action: 'donation_completed',
      details: { trans_id, amount: chk.amount, source: 'poll' },
    })
    revalidatePath('/')
    revalidatePath('/donate')
    revalidatePath('/dashboard')
    return { status: 'completed' }
  }

  // หมดอายุแล้วแต่ยังไม่จ่าย → ยกเลิกกับ PayNoi + มาร์ค expired (กัน pending ค้าง)
  const isExpired = chk.paymentStatus === 'expired' || (row.expire_at && new Date(row.expire_at).getTime() < Date.now())
  if (isExpired) {
    await paynoiCancel(trans_id)
    const admin = createAdminClient()
    await admin.from('donations').update({ status: 'expired' }).eq('trans_id', trans_id).eq('status', 'pending')
    return { status: 'expired' }
  }

  return { status: chk.paymentStatus || 'pending' }
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
  const files = formData.getAll('attachments').filter((f): f is File => f instanceof File && f.size > 0)
  if (!caseId) return { error: 'ไม่พบเคส' }
  if (!body && files.length === 0) return { error: 'กรุณากรอกข้อความ หรือแนบไฟล์อย่างน้อย 1 อย่าง' }

  // อัปโหลดไฟล์ผ่าน service-role (เลี่ยงปัญหา storage RLS ทั้ง owner/admin)
  const admin = createAdminClient()
  const urls: string[] = []
  for (const file of files) {
    const ext = (file.name.split('.').pop() || 'bin').toLowerCase()
    const path = `updates/${caseId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { error: upErr } = await admin.storage.from('case-files').upload(path, file)
    if (upErr) return { error: 'อัปโหลดไฟล์ไม่สำเร็จ: ' + upErr.message }
    urls.push(admin.storage.from('case-files').getPublicUrl(path).data.publicUrl)
  }

  // insert ผ่าน session (RLS บังคับว่าเป็นเจ้าของเคสหรือ admin)
  let { error } = await supabase
    .from('case_updates')
    .insert({ case_id: caseId, author_id: user.id, body: body || '', attachments: urls })
  // เผื่อยังไม่ได้รัน migration 008 (ไม่มีคอลัมน์ attachments) และเป็นข้อความล้วน → ลองใหม่แบบไม่มี attachments
  if (error && urls.length === 0) {
    ;({ error } = await supabase.from('case_updates').insert({ case_id: caseId, author_id: user.id, body: body || '' }))
  }
  if (error) return { error: 'โพสต์อัปเดตไม่สำเร็จ: ' + error.message }

  await supabase.from('audit_log').insert({
    actor_id: user.id,
    case_id: caseId,
    action: 'case_update_posted',
    details: { attachments: urls.length },
  })

  revalidatePath(`/dashboard/cases/${caseId}`)
  revalidatePath(`/cases/${caseId}`)
  return { success: true }
}
