// LINE Login (OAuth 2.1) — Supabase ไม่มี provider นี้ในตัว จึงทำเอง
// ต้องตั้งค่าใน .env.local:
//   LINE_CHANNEL_ID, LINE_CHANNEL_SECRET  (จาก LINE Developers Console → LINE Login channel)
//   NEXT_PUBLIC_SITE_URL = https://punruksa.petgo.asia  (โดเมนจริง สำหรับ callback)

const AUTHORIZE_URL = 'https://access.line.me/oauth2/v2.1/authorize'
const TOKEN_URL = 'https://api.line.me/oauth2/v2.1/token'
const PROFILE_URL = 'https://api.line.me/v2/profile'

export function lineConfigured(): boolean {
  return Boolean(process.env.LINE_CHANNEL_ID && process.env.LINE_CHANNEL_SECRET)
}

export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || 'https://punruksa.petgo.asia').replace(/\/$/, '')
}

export function lineCallbackUrl(): string {
  return `${siteUrl()}/api/auth/line/callback`
}

export function lineAuthorizeUrl(state: string): string {
  const p = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.LINE_CHANNEL_ID!,
    redirect_uri: lineCallbackUrl(),
    state,
    scope: 'profile openid email',
  })
  return `${AUTHORIZE_URL}?${p.toString()}`
}

// prefix สำหรับ state ในโหมด "เชื่อมต่อบัญชี" (ผู้ใช้ login อยู่แล้ว ต้องการผูก LINE)
// ใช้ callback เดียวกับ login เพื่อไม่ต้องลงทะเบียน redirect_uri เพิ่มใน LINE console
export const LINE_LINK_PREFIX = 'link:'
export const isLinkState = (state: string | null | undefined): boolean =>
  typeof state === 'string' && state.startsWith(LINE_LINK_PREFIX)

export async function lineExchangeToken(code: string): Promise<{ access_token?: string; id_token?: string } | null> {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: lineCallbackUrl(),
    client_id: process.env.LINE_CHANNEL_ID!,
    client_secret: process.env.LINE_CHANNEL_SECRET!,
  })
  try {
    const r = await fetch(TOKEN_URL, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body })
    return await r.json()
  } catch {
    return null
  }
}

export async function lineProfile(accessToken: string): Promise<{ userId?: string; displayName?: string; pictureUrl?: string } | null> {
  try {
    const r = await fetch(PROFILE_URL, { headers: { Authorization: `Bearer ${accessToken}` } })
    return await r.json()
  } catch {
    return null
  }
}

// อีเมลจาก id_token (ถ้าผู้ใช้อนุญาต scope email)
export function emailFromIdToken(idToken?: string): string | undefined {
  if (!idToken) return undefined
  try {
    const payload = JSON.parse(Buffer.from(idToken.split('.')[1], 'base64').toString('utf8'))
    return typeof payload.email === 'string' ? payload.email : undefined
  } catch {
    return undefined
  }
}

// ───────── LINE Messaging API (push แจ้งเตือน) ─────────
// ต้องตั้ง LINE_MESSAGING_TOKEN (Channel access token จาก OA / Messaging API channel)
const PUSH_URL = 'https://api.line.me/v2/bot/message/push'

export function lineMessagingConfigured(): boolean {
  return Boolean(process.env.LINE_MESSAGING_TOKEN)
}

// ดึง LINE userId จาก email สังเคราะห์ line_<id>@line.local
export function lineUserIdFromEmail(email?: string | null): string | null {
  if (!email) return null
  const m = email.match(/^line_(.+)@line\.local$/)
  return m ? m[1] : null
}

// ส่งข้อความ push หา userId เดียว (ต้องเป็นเพื่อนกับ OA) — best effort
export async function pushLineText(userId: string, text: string): Promise<boolean> {
  const token = process.env.LINE_MESSAGING_TOKEN
  if (!token || !userId) return false
  try {
    const r = await fetch(PUSH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ to: userId, messages: [{ type: 'text', text }] }),
    })
    return r.ok
  } catch {
    return false
  }
}

// ส่ง Flex Message (การ์ดมีรูป) หา userId เดียว — best effort
// contents = Flex bubble/carousel object; altText = ข้อความสำรองเวลาแสดงเป็น notification
export async function pushLineFlex(userId: string, altText: string, contents: unknown): Promise<boolean> {
  const token = process.env.LINE_MESSAGING_TOKEN
  if (!token || !userId) return false
  try {
    const r = await fetch(PUSH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ to: userId, messages: [{ type: 'flex', altText: altText.slice(0, 400), contents }] }),
    })
    return r.ok
  } catch {
    return false
  }
}
