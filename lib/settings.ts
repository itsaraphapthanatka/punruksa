import { createClient } from '@/lib/supabase/server'

// อ่านสถานะ "เปิดรับบริจาค" จาก app_settings
// degrade gracefully: ถ้าตารางยังไม่ถูกสร้าง (migration ยังไม่รัน) หรืออ่านพลาด → ถือว่าเปิด (true)
// เพื่อให้เว็บ production ทำงานต่อได้ตามปกติก่อน migration จะถูกใช้
export async function getDonationsEnabled(): Promise<boolean> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'donations_enabled')
      .single()
    if (error || !data) return true
    return data.value !== false
  } catch {
    return true
  }
}
