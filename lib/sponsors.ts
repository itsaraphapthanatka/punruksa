// องค์กร/พันธมิตรผู้สนับสนุน — แก้รายชื่อ/โลโก้ได้ที่ array นี้
// logo: ใส่ path รูปใน public/ (เช่น '/sponsors/jaidee.png') หรือเว้นว่างเพื่อใช้ตัวอักษรย่อแทน
// url : ลิงก์เว็บไซต์ของพันธมิตร (ไม่ใส่ก็ได้)
// category: หมวดของผู้สนับสนุน (ดู SponsorCategory ด้านล่าง)
export type SponsorCategory =
  | 'organization'
  | 'clinic'
  | 'hospital'
  | 'pet_hotel'
  | 'pet_shop'

export interface Sponsor {
  name: string
  logo?: string
  url?: string
  category?: SponsorCategory
}

// ลำดับการแสดงหมวด + label ทั้ง 2 ภาษา
export const SPONSOR_CATEGORIES: SponsorCategory[] = [
  'organization',
  'clinic',
  'hospital',
  'pet_hotel',
  'pet_shop',
]

export const CATEGORY_LABELS: Record<
  SponsorCategory,
  { th: string; en: string; icon: string }
> = {
  organization: { th: 'องค์กร & มูลนิธิ', en: 'Organizations & foundations', icon: '🏛️' },
  clinic: { th: 'คลินิกรักษาสัตว์', en: 'Veterinary clinics', icon: '💊' },
  hospital: { th: 'โรงพยาบาลสัตว์', en: 'Animal hospitals', icon: '🏥' },
  pet_hotel: { th: 'โรงแรมสัตว์เลี้ยง', en: 'Pet hotels', icon: '🏨' },
  pet_shop: { th: 'ร้านอุปกรณ์ & อาหารสัตว์', en: 'Pet shops', icon: '🛍️' },
}

// รายชื่อผู้สนับสนุนเก็บใน DB (ตาราง sponsors) จัดการผ่านหน้า admin
// โหลดข้อมูลจริงด้วย getSponsors() ใน lib/sponsors-data.ts (server-only)

// ตัวย่อสำหรับโลโก้กรณีไม่มีรูป (เช่น "คลินิกใจดี" → "คล", "Pet Care" → "PC")
export function monogram(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.trim().slice(0, 2).toUpperCase()
}

// group sponsors by category (preserving SPONSOR_CATEGORIES order); items without a category go to '_other'
export function groupSponsors(items: Sponsor[]): Array<{ key: SponsorCategory | '_other'; items: Sponsor[] }> {
  const buckets = new Map<SponsorCategory | '_other', Sponsor[]>()
  for (const s of items) {
    const k = (s.category ?? '_other') as SponsorCategory | '_other'
    if (!buckets.has(k)) buckets.set(k, [])
    buckets.get(k)!.push(s)
  }
  const out: Array<{ key: SponsorCategory | '_other'; items: Sponsor[] }> = []
  for (const k of SPONSOR_CATEGORIES) {
    if (buckets.has(k)) out.push({ key: k, items: buckets.get(k)! })
  }
  if (buckets.has('_other')) out.push({ key: '_other', items: buckets.get('_other')! })
  return out
}
