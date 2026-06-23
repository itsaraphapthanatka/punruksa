import { createClient } from '@supabase/supabase-js'

// service-role client — ใช้ฝั่งเซิร์ฟเวอร์เท่านั้น (webhook / ยืนยันการจ่าย)
// bypass RLS → ห้าม import เข้าฝั่ง client เด็ดขาด
// ต้องตั้งค่า SUPABASE_SERVICE_ROLE_KEY ใน .env.local
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}
