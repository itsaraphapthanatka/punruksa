// ───────────────────────────────────────────────────────────
// PUNSLIP — ตรวจสอบสลิปโอนเงิน (https://punslip.petgo.asia)
// ใช้กับหน้า "สนับสนุนค่าดูแลระบบ" (/support-platform) — ผู้ใช้โอนเองแล้วอัปโหลดสลิป
// ตั้งค่าใน .env.local:
//   PUNSLIP_API_KEY   cs_... (ความลับ — server only)
//   PUNSLIP_API_URL   ค่าเริ่มต้น https://punslip.petgo.asia/api/v1
// API: POST /verify  (header x-api-key)  body: multipart field "file" (รูปสลิป) หรือ JSON { payload }
// response: { ok, duplicate, reference, result:{ verified, provider, ... } }
// ───────────────────────────────────────────────────────────

function apiUrl(): string {
  return (process.env.PUNSLIP_API_URL || 'https://punslip.petgo.asia/api/v1').replace(/\/$/, '')
}

export function punslipConfigured(): boolean {
  return Boolean(process.env.PUNSLIP_API_KEY)
}

export interface SlipVerifyResult {
  ok: boolean
  duplicate: boolean
  verified: boolean
  amount: number | null
  transRef: string | null
  sender: string | null
  raw: unknown
  error?: string
}

// ค้นค่าในอ็อบเจกต์แบบลึก: คืนค่าแรกที่ key ตรง regex และผ่าน pred
function deepFind(obj: unknown, keyRe: RegExp, pred: (v: unknown) => boolean, depth = 0): unknown {
  if (!obj || typeof obj !== 'object' || depth > 6) return undefined
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    if (keyRe.test(k) && pred(v)) return v
  }
  for (const v of Object.values(obj as Record<string, unknown>)) {
    if (v && typeof v === 'object') {
      const found = deepFind(v, keyRe, pred, depth + 1)
      if (found !== undefined) return found
    }
  }
  return undefined
}

function toAmount(v: unknown): number | null {
  if (typeof v === 'number' && v > 0) return v
  if (typeof v === 'string') {
    const n = Number(v.replace(/[, ]/g, ''))
    if (Number.isFinite(n) && n > 0) return n
  }
  // บางกรณี amount เป็น object เช่น { amount: 100 }
  if (v && typeof v === 'object') {
    const inner = (v as Record<string, unknown>).amount ?? (v as Record<string, unknown>).value
    return toAmount(inner)
  }
  return null
}

function extract(json: Record<string, unknown>): { amount: number | null; transRef: string | null; sender: string | null } {
  const scope = { reference: json.reference, result: json.result, ...json }
  const amountRaw = deepFind(scope, /^(amount|amountvalue|transamount|amount_baht)$/i, (v) => toAmount(v) !== null)
  const refRaw = deepFind(scope, /(trans.?ref|transactionid|^ref$|refid|reference_?id)/i, (v) => typeof v === 'string' && v.length > 3)
  const senderRaw = deepFind(scope, /(sender.*name|^name$|displayname|account.*name)/i, (v) => typeof v === 'string' && (v as string).length > 0)
  return {
    amount: toAmount(amountRaw),
    transRef: typeof refRaw === 'string' ? refRaw : null,
    sender: typeof senderRaw === 'string' ? senderRaw : null,
  }
}

// ตรวจสลิปจากไฟล์รูป (multipart field "file")
export async function verifySlipFile(file: File): Promise<SlipVerifyResult> {
  const key = process.env.PUNSLIP_API_KEY
  const empty: SlipVerifyResult = { ok: false, duplicate: false, verified: false, amount: null, transRef: null, sender: null, raw: null }
  if (!key) return { ...empty, error: 'ยังไม่ได้ตั้งค่า PUNSLIP_API_KEY' }

  let res: Response
  try {
    const fd = new FormData()
    fd.append('file', file, file.name || 'slip.jpg')
    res = await fetch(`${apiUrl()}/verify`, {
      method: 'POST',
      headers: { 'x-api-key': key }, // อย่าตั้ง Content-Type เอง — ให้ fetch ใส่ boundary
      body: fd,
      cache: 'no-store',
    })
  } catch {
    return { ...empty, error: 'เชื่อมต่อระบบตรวจสลิปไม่ได้' }
  }

  let json: Record<string, unknown> = {}
  try { json = (await res.json()) as Record<string, unknown> } catch {}

  // ไม่มีโครงสร้างผลตรวจ (เช่น 500 ตอนอ่าน QR ไม่ออก) → ข้อความที่เป็นมิตร
  if (typeof json.ok !== 'boolean') {
    return { ...empty, error: 'อ่านสลิปไม่ได้ กรุณาอัปโหลดรูปสลิปที่ชัดเจนและเห็น QR ครบถ้วน' }
  }

  const result = (json.result || {}) as Record<string, unknown>
  const ok = json.ok === true
  const duplicate = json.duplicate === true
  const verified = result.verified === true || ok
  const { amount, transRef, sender } = extract(json)
  const error = !ok
    ? (typeof result.error === 'string' ? result.error : typeof json.error === 'string' ? (json.error as string) : 'ตรวจสลิปไม่ผ่าน')
    : undefined

  return { ok, duplicate, verified, amount, transRef, sender, raw: json, error }
}
