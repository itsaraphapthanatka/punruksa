import { createClient } from '@/lib/supabase/server'
import type { Sponsor, SponsorCategory } from '@/lib/sponsors'

export interface SponsorRow extends Sponsor {
  id: string
  is_active: boolean
  sort_order: number
}

// โหลดผู้สนับสนุนที่เปิดแสดง (is_active) เรียงตาม sort_order — สำหรับหน้าแรก/หน้าสาธารณะ
// degrade gracefully: ถ้าตารางยังไม่ถูกสร้าง หรืออ่านพลาด → คืน [] (หน้าเว็บจะโชว์การ์ดเชิญชวนแทน)
export async function getSponsors(): Promise<Sponsor[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('sponsors')
      .select('name, logo_url, url, category')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })
    if (error || !data) return []
    return data.map((r) => ({
      name: r.name,
      logo: r.logo_url || undefined,
      url: r.url || undefined,
      category: (r.category || undefined) as SponsorCategory | undefined,
    }))
  } catch {
    return []
  }
}

// โหลดทั้งหมด (รวมที่ปิดแสดง) สำหรับหน้า admin
export async function getAllSponsors(): Promise<SponsorRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('sponsors')
    .select('id, name, logo_url, url, category, sort_order, is_active')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })
  if (error || !data) return []
  return data.map((r) => ({
    id: r.id,
    name: r.name,
    logo: r.logo_url || undefined,
    url: r.url || undefined,
    category: (r.category || undefined) as SponsorCategory | undefined,
    sort_order: r.sort_order,
    is_active: r.is_active,
  }))
}
