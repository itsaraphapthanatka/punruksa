'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { punpayCreateCharge, punpayGetCharge, punpayStatus } from '@/lib/punpay'
import { verifySlipFile } from '@/lib/punslip'
import { revalidatePath } from 'next/cache'

// ---------- สนับสนุนค่าดูแลระบบด้วยการตรวจสลิป (PUNSLIP) ----------
export async function createPlatformSlipDonation(prevState: unknown, formData: FormData) {
  const name = String(formData.get('name') || '').trim().slice(0, 80)
  const message = String(formData.get('message') || '').trim().slice(0, 300)
  const enteredAmount = Math.floor(Number(formData.get('amount'))) || 0

  const file = formData.get('slip')
  if (!(file instanceof File) || file.size === 0) return { error: 'กรุณาแนบรูปสลิปการโอนเงิน' }
  if (file.size > 5 * 1024 * 1024) return { error: 'ไฟล์สลิปใหญ่เกิน 5MB' }
  if (!/^image\/(png|jpeg|webp)$/.test(file.type)) return { error: 'รองรับเฉพาะรูป PNG / JPG / WebP' }

  const v = await verifySlipFile(file)
  if (!v.ok || !v.verified) return { error: 'ตรวจสลิปไม่ผ่าน: ' + (v.error || 'สลิปไม่ถูกต้อง') }
  if (v.duplicate) return { error: 'สลิปนี้ถูกใช้ไปแล้ว — กรุณาใช้สลิปการโอนใหม่' }

  // เชื่อยอดตามสลิปจริง (fallback เป็นยอดที่กรอกถ้าอ่านจากสลิปไม่ได้)
  const amount = v.amount ?? enteredAmount
  if (!amount || amount <= 0) return { error: 'อ่านยอดเงินจากสลิปไม่ได้ กรุณากรอกยอดที่โอน' }

  const admin = createAdminClient()
  const { error } = await admin.from('platform_donations').insert({
    method: 'slip',
    reference: `slip_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    amount,
    status: 'completed',
    donor_name: name || null,
    message: message || null,
    slip_ref: v.transRef,
    slip_raw: v.raw as object,
    paid_at: new Date().toISOString(),
  })
  if (error) {
    // unique violation บน slip_ref = สลิปซ้ำ
    if (error.code === '23505') return { error: 'สลิปนี้ถูกใช้ไปแล้ว' }
    return { error: 'บันทึกรายการไม่สำเร็จ: ' + error.message }
  }

  await admin.from('audit_log').insert({
    action: 'platform_donation_slip',
    details: { amount, slip_ref: v.transRef, sender: v.sender },
  })
  revalidatePath('/support-platform')
  return { success: true, amount }
}

// ---------- สร้างรายการสนับสนุนค่าดูแลระบบ (ผ่าน PunPay hosted checkout) ----------
export async function createPlatformDonation(prevState: unknown, formData: FormData) {
  const amount = Math.floor(Number(formData.get('amount')))
  if (!amount || amount <= 0) return { error: 'กรุณาระบุจำนวนเงินที่ถูกต้อง' }
  if (amount > 200000) return { error: 'จำนวนเงินเกินกำหนด' }

  const name = String(formData.get('name') || '').trim().slice(0, 80)
  const message = String(formData.get('message') || '').trim().slice(0, 300)

  const reference = `plat_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  const created = await punpayCreateCharge({
    amount,
    reference,
    description: 'สนับสนุนค่าดูแลระบบ ปันรักษา',
    metadata: { kind: 'platform', name: name || undefined, message: message || undefined },
    expiresIn: 1800, // 30 นาที
  })
  if (!created.ok || !created.charge) return { error: created.error || 'สร้างรายการชำระไม่สำเร็จ' }

  const c = created.charge
  const admin = createAdminClient()
  const { error } = await admin.from('platform_donations').insert({
    charge_id: c.id,
    reference,
    amount,
    status: 'pending',
    donor_name: name || null,
    message: message || null,
  })
  if (error) return { error: 'บันทึกรายการไม่สำเร็จ: ' + error.message }

  return { success: true, chargeId: c.id, checkoutUrl: c.checkout_url, amount }
}

// ---------- เช็กสถานะ (poll จาก client) — ยืนยันกับ PunPay โดยตรง ----------
export async function checkPlatformDonationStatus(chargeId: string): Promise<{ status: string }> {
  if (!chargeId) return { status: 'invalid' }
  const admin = createAdminClient()

  const { data: row } = await admin
    .from('platform_donations')
    .select('status')
    .eq('charge_id', chargeId)
    .maybeSingle()
  if (!row) return { status: 'not_found' }
  if (row.status === 'completed') return { status: 'completed' }

  const r = await punpayGetCharge(chargeId)
  if (!r.ok || !r.charge) return { status: row.status }

  const st = punpayStatus(r.charge)
  if (st === 'completed') {
    await admin
      .from('platform_donations')
      .update({ status: 'completed', paid_at: r.charge.paid_at || new Date().toISOString() })
      .eq('charge_id', chargeId)
      .eq('status', 'pending')
    await admin.from('audit_log').insert({
      action: 'platform_donation_completed',
      details: { charge_id: chargeId, amount: r.charge.amount },
    })
    revalidatePath('/support-platform')
    return { status: 'completed' }
  }
  if (st === 'expired') {
    await admin.from('platform_donations').update({ status: 'expired' }).eq('charge_id', chargeId).eq('status', 'pending')
    return { status: 'expired' }
  }
  return { status: 'pending' }
}
