// องค์กร/พันธมิตรผู้สนับสนุน — แก้รายชื่อ/โลโก้ได้ที่ array นี้
// logo: ใส่ path รูปใน public/ (เช่น '/sponsors/jaidee.png') หรือเว้นว่างเพื่อใช้ตัวอักษรย่อแทน
// url : ลิงก์เว็บไซต์ของพันธมิตร (ไม่ใส่ก็ได้)
export interface Sponsor {
  name: string
  logo?: string
  url?: string
}

// ว่างไว้ = หน้าเว็บจะโชว์การ์ดเชิญชวน "ร่วมเป็นผู้สนับสนุน" แทน (ปลอดภัยสำหรับหน้าจริง)
// เพิ่มของจริงได้เลย เช่น:
//   { name: 'คลินิกรักษาสัตว์ใจดี', logo: '/sponsors/jaidee.png', url: 'https://example.com' },
export const SPONSORS: Sponsor[] = []

// ตัวย่อสำหรับโลโก้กรณีไม่มีรูป (เช่น "คลินิกใจดี" → "คล", "Pet Care" → "PC")
export function monogram(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.trim().slice(0, 2).toUpperCase()
}
