import crypto from 'node:crypto'

// ───────────────────────────────────────────────────────────
// PayNoi PromptPay gateway — https://paynoi.com/apidoc
// ตั้งค่าใน .env.local:
//   PAYNOI_API_KEY        api key จาก PayNoi (ความลับ)
//   PAYNOI_ACCOUNT        เลขพร้อมเพย์ของกองทุน (เบอร์โทร หรือ เลขบัตร ปชช.)
//   PAYNOI_ACCOUNT_TYPE   '1' = เบอร์โทร, '2' = เลขบัตรประชาชน
//   PAYNOI_KEY_ID         รหัสธนาคาร: 100568 กสิกร, 100569 กรุงศรี, 100570 ไทยพาณิชย์
// ───────────────────────────────────────────────────────────

const API_URL = 'https://paynoi.com/ppay_api'

export function paynoiConfigured(): boolean {
  return Boolean(process.env.PAYNOI_API_KEY && process.env.PAYNOI_ACCOUNT && process.env.PAYNOI_KEY_ID)
}

export interface PaynoiCharge {
  ok: boolean
  trans_id?: string
  qr?: string // base64 PNG (ไม่มี prefix data:)
  amount?: string // ยอดจริงที่ต้องโอน เช่น "100.24"
  amountCheck?: number // ยอดเป็นสตางค์
  expireAt?: string
  error?: string
}

async function call(payload: Record<string, unknown>): Promise<Record<string, unknown> | null> {
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      cache: 'no-store',
    })
    return (await res.json()) as Record<string, unknown>
  } catch {
    return null
  }
}

// สร้างรายการชำระ + QR
export async function paynoiCreate(params: { amount: number; ref1: string }): Promise<PaynoiCharge> {
  if (!paynoiConfigured()) return { ok: false, error: 'ยังไม่ได้ตั้งค่า PayNoi (PAYNOI_API_KEY / PAYNOI_ACCOUNT / PAYNOI_KEY_ID)' }
  const j = await call({
    method: 'create',
    api_key: process.env.PAYNOI_API_KEY,
    amount: params.amount,
    ref1: params.ref1,
    key_id: process.env.PAYNOI_KEY_ID,
    account: process.env.PAYNOI_ACCOUNT,
    type: process.env.PAYNOI_ACCOUNT_TYPE || '1',
  })
  if (!j || j.status !== 1) return { ok: false, error: (j?.msg as string) || 'สร้างรายการไม่สำเร็จ' }
  return {
    ok: true,
    trans_id: j.trans_id as string,
    qr: j.qr_image_base64 as string,
    amount: String(j.amount),
    amountCheck: j.amount_check as number,
    expireAt: j.expire_at as string,
  }
}

// เช็กสถานะการจ่าย (authoritative)
export async function paynoiCheck(trans_id: string): Promise<{ ok: boolean; paymentStatus?: string; amount?: string; ref1?: string; error?: string }> {
  if (!process.env.PAYNOI_API_KEY) return { ok: false, error: 'ยังไม่ได้ตั้งค่า PAYNOI_API_KEY' }
  const j = await call({ method: 'check', api_key: process.env.PAYNOI_API_KEY, trans_id })
  if (!j || j.status !== 1) return { ok: false, error: (j?.msg as string) || 'เช็กสถานะไม่สำเร็จ' }
  return { ok: true, paymentStatus: j.payment_status as string, amount: String(j.amount), ref1: j.ref1 as string }
}

// ยกเลิกรายการที่ยัง pending / หมดอายุ
export async function paynoiCancel(trans_id: string): Promise<boolean> {
  if (!process.env.PAYNOI_API_KEY) return false
  const j = await call({ method: 'cancel', api_key: process.env.PAYNOI_API_KEY, trans_id })
  return Boolean(j && j.status === 1)
}

// ตรวจ HMAC-SHA256 ของ webhook (best-effort — ยังยืนยันซ้ำด้วย paynoiCheck เสมอ)
export function verifyPaynoiSignature(data: unknown, signature: unknown): boolean {
  const key = process.env.PAYNOI_API_KEY
  if (!key || typeof signature !== 'string' || !signature) return false
  const expected = crypto.createHmac('sha256', key).update(JSON.stringify(data)).digest('hex')
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
  } catch {
    return false
  }
}
