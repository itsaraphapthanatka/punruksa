// ───────────────────────────────────────────────────────────
// PunPay payment gateway — hosted checkout (คืน checkout_url ให้ผู้จ่ายไปจ่าย)
// ใช้กับหน้า "สนับสนุนค่าดูแลระบบ" (/support-platform) เท่านั้น — แยกจากกองทุน (PayNoi)
// ตั้งค่าใน .env.local:
//   PUNPAY_SECRET_KEY   sk_live_... (ความลับ — server only)
//   PUNPAY_API_URL      ค่าเริ่มต้น https://punpay.petgo.asia/api/v1
// ───────────────────────────────────────────────────────────

function apiUrl(): string {
  return (process.env.PUNPAY_API_URL || 'https://punpay.petgo.asia/api/v1').replace(/\/$/, '')
}

export function punpayConfigured(): boolean {
  return Boolean(process.env.PUNPAY_SECRET_KEY)
}

export interface PunpayCharge {
  id: string
  amount: number
  currency: string
  status: string
  checkout_url: string
  reference?: string
  description?: string
  metadata?: Record<string, unknown>
  expires_at?: string | null
  paid_at?: string | null
  canceled_at?: string | null
  created_at?: string
}

// แปลงสถานะ PunPay → สถานะภายใน (completed | expired | pending)
export function punpayStatus(c: Pick<PunpayCharge, 'status' | 'paid_at' | 'canceled_at' | 'expires_at'>): 'completed' | 'expired' | 'pending' {
  if (c.paid_at) return 'completed'
  const s = (c.status || '').toLowerCase()
  if (['paid', 'succeeded', 'success', 'completed'].includes(s)) return 'completed'
  if (['expired', 'canceled', 'cancelled', 'failed'].includes(s) || c.canceled_at) return 'expired'
  if (c.expires_at && new Date(c.expires_at).getTime() < Date.now()) return 'expired'
  return 'pending'
}

async function authedFetch(path: string, init?: RequestInit): Promise<Response | null> {
  const key = process.env.PUNPAY_SECRET_KEY
  if (!key) return null
  try {
    return await fetch(`${apiUrl()}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        ...(init?.headers || {}),
      },
      cache: 'no-store',
    })
  } catch {
    return null
  }
}

// สร้าง charge → คืน checkout_url ให้ผู้บริจาคไปจ่าย
export async function punpayCreateCharge(params: {
  amount: number
  reference: string
  description?: string
  metadata?: Record<string, unknown>
  expiresIn?: number // วินาที
}): Promise<{ ok: boolean; charge?: PunpayCharge; error?: string }> {
  if (!punpayConfigured()) return { ok: false, error: 'ยังไม่ได้ตั้งค่า PUNPAY_SECRET_KEY' }
  const res = await authedFetch('/charges', {
    method: 'POST',
    body: JSON.stringify({
      amount: Number(params.amount),
      reference: params.reference,
      description: params.description || 'สนับสนุนค่าดูแลระบบ ปันรักษา',
      metadata: params.metadata || {},
      ...(params.expiresIn ? { expires_in: params.expiresIn } : {}),
    }),
  })
  if (!res) return { ok: false, error: 'เชื่อมต่อ PunPay ไม่ได้' }
  if (!res.ok) {
    let msg = `HTTP ${res.status}`
    try {
      const j = await res.json()
      msg = (j.detail as string) || (j.message as string) || msg
    } catch {}
    return { ok: false, error: 'สร้างรายการชำระไม่สำเร็จ: ' + msg }
  }
  const charge = (await res.json()) as PunpayCharge
  if (!charge?.id || !charge?.checkout_url) return { ok: false, error: 'การตอบกลับจาก PunPay ไม่ถูกต้อง' }
  return { ok: true, charge }
}

export interface PlatformSupporter {
  donor_name: string | null
  amount: number
  message: string | null
  paid_at: string | null
  created_at: string
}

// สรุปยอด + ผู้สนับสนุนค่าดูแลระบบล่าสุด (เฉพาะ completed) — ใช้ service-role อ่าน (RLS เปิดให้ admin)
// degrade gracefully: ถ้า migration 013 ยังไม่ลง → คืนค่าว่าง
export async function getPlatformSupport(limit = 10): Promise<{ total: number; count: number; recent: PlatformSupporter[] }> {
  try {
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('platform_donations')
      .select('donor_name, amount, message, paid_at, created_at')
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
    if (error || !data) return { total: 0, count: 0, recent: [] }
    const total = data.reduce((s, r) => s + Number(r.amount || 0), 0)
    return { total, count: data.length, recent: data.slice(0, limit) as PlatformSupporter[] }
  } catch {
    return { total: 0, count: 0, recent: [] }
  }
}

// ดึงสถานะ charge (authoritative)
export async function punpayGetCharge(id: string): Promise<{ ok: boolean; charge?: PunpayCharge; error?: string }> {
  if (!id) return { ok: false, error: 'invalid charge id' }
  const res = await authedFetch(`/charges/${encodeURIComponent(id)}`)
  if (!res) return { ok: false, error: 'เชื่อมต่อ PunPay ไม่ได้' }
  if (!res.ok) return { ok: false, error: `HTTP ${res.status}` }
  const charge = (await res.json()) as PunpayCharge
  return { ok: true, charge }
}
