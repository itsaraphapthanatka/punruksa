import type { CSSProperties } from 'react'

// ไอคอนสัตว์จากชนิด
export const animalIcon = (t: string) =>
  t.includes('แมว') ? '🐱' : t.includes('สุนัข') || t.includes('หมา') ? '🐶' : t.includes('นก') ? '🐦' : '🐾'

const STATUS: Record<string, { label: string; bg: string; color: string }> = {
  received: { label: 'รับเรื่อง', bg: '#eef0fd', color: '#5560d8' },
  verifying: { label: 'กำลังตรวจ', bg: '#eef0fd', color: '#5560d8' },
  voting: { label: 'กำลังโหวต', bg: '#fff4e0', color: '#c77f00' },
  approved: { label: 'อนุมัติแล้ว', bg: '#ecfdf5', color: '#047857' },
  rejected: { label: 'ไม่ผ่าน', bg: '#fef2f2', color: '#b91c1c' },
  paid: { label: 'จ่ายแล้ว', bg: '#e8e6f5', color: '#5a4cae' },
  closed: { label: 'จ่ายแล้ว/ปิดเคส', bg: '#e8e6f5', color: '#5a4cae' },
}

export const statusLabel = (s: string) => STATUS[s]?.label || s

export function statusBadge(s: string): { label: string; style: CSSProperties } {
  const m = STATUS[s] || { label: s, bg: '#f1f2f7', color: '#717892' }
  return {
    label: m.label,
    style: {
      background: m.bg, color: m.color, fontSize: 12, fontWeight: 700,
      padding: '4px 11px', borderRadius: 999, whiteSpace: 'nowrap', flex: 'none',
    },
  }
}

export const emergencyBadgeStyle: CSSProperties = {
  background: '#fff1f1', color: '#d9433f', fontSize: 12, fontWeight: 700,
  padding: '4px 10px', borderRadius: 999, whiteSpace: 'nowrap', flex: 'none',
}

// progress ของเคส (โมเดลกองกลาง — อิงสถานะ/ความคืบหน้า ไม่ใช่ยอดเงินรายเคส)
export function statusProgress(status: string): { pct: number; color: string } {
  switch (status) {
    case 'received': return { pct: 10, color: '#667eea' }
    case 'verifying': return { pct: 22, color: '#667eea' }
    case 'voting': return { pct: 58, color: '#c77f00' }
    case 'approved': return { pct: 90, color: '#047857' }
    case 'paid':
    case 'closed': return { pct: 100, color: '#0f766e' }
    case 'rejected': return { pct: 100, color: '#b91c1c' }
    default: return { pct: 0, color: '#9aa0b8' }
  }
}

// การ์ดเคส (แถวรายการ) — ใช้ทั้ง list / queue
export const caseRowStyle: CSSProperties = {
  background: '#fff', border: '1px solid #edeef7', borderRadius: 14,
  padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 16, color: 'inherit',
}
export const caseIconStyle: CSSProperties = {
  flex: 'none', width: 46, height: 46, borderRadius: 11, background: '#f3f4fc',
  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
}
