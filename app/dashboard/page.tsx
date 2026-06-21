import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { CSSProperties } from 'react'

interface CaseRow {
  id: string
  title: string
  animal_type: string
  clinic_name: string | null
  requested_amount: number
  mode: 'normal' | 'emergency'
  status: string
  created_at: string
}

const roleLabels: Record<string, string> = {
  donor: 'ผู้บริจาค',
  caretaker: 'ผู้ดูแลสัตว์',
  clinic: 'คลินิก',
  approver: 'ผู้อนุมัติ',
  admin: 'ผู้ดูแลระบบ',
}

const animalIcon = (t: string) =>
  t.includes('แมว') ? '🐱' : t.includes('สุนัข') || t.includes('หมา') ? '🐶' : t.includes('นก') ? '🐦' : '🐾'

const statusBadge = (s: string): { label: string; style: CSSProperties } => {
  const map: Record<string, { label: string; bg: string; color: string }> = {
    received: { label: 'รับเรื่อง', bg: '#eef0fd', color: '#5560d8' },
    verifying: { label: 'กำลังตรวจ', bg: '#eef0fd', color: '#5560d8' },
    voting: { label: 'กำลังโหวต', bg: '#fff4e0', color: '#c77f00' },
    approved: { label: 'อนุมัติแล้ว', bg: '#ecfdf5', color: '#047857' },
    rejected: { label: 'ไม่ผ่าน', bg: '#fef2f2', color: '#b91c1c' },
    paid: { label: 'จ่ายแล้ว', bg: '#e8e6f5', color: '#5a4cae' },
    closed: { label: 'จ่ายแล้ว/ปิดเคส', bg: '#e8e6f5', color: '#5a4cae' },
  }
  const m = map[s] || { label: s, bg: '#f1f2f7', color: '#717892' }
  return {
    label: m.label,
    style: { background: m.bg, color: m.color, fontSize: 12, fontWeight: 700, padding: '4px 11px', borderRadius: 999, whiteSpace: 'nowrap', flex: 'none' },
  }
}

const steps = [
  { n: 1, title: 'เปิดเคส', sub: 'แนบรูป+บิลค่ารักษา' },
  { n: 2, title: 'ตรวจเอกสาร', sub: 'แอดมินคัดกรอง' },
  { n: 3, title: 'สุ่มสมาชิกโหวต', sub: 'ปิดตัวตนเจ้าของเคส' },
  { n: 4, title: 'นับมติ', sub: 'ครบเกณฑ์ = อนุมัติ' },
  { n: 5, title: 'จ่าย + ปิดเคส', sub: 'บันทึก audit ทุกขั้น' },
]

const statCard: CSSProperties = { background: '#fff', border: '1px solid #edeef7', borderRadius: 15, padding: '16px 18px' }

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('users')
    .select('full_name, role')
    .eq('id', user!.id)
    .single()

  const fullName = profile?.full_name || 'ผู้ใช้'
  const role = profile?.role || 'donor'

  const { data: casesData } = await supabase
    .from('cases')
    .select('id, title, animal_type, clinic_name, requested_amount, mode, status, created_at')
    .order('created_at', { ascending: false })

  const cases = (casesData ?? []) as CaseRow[]
  const countBy = (s: string | string[]) =>
    cases.filter((c) => (Array.isArray(s) ? s.includes(c.status) : c.status === s)).length

  const stats = [
    { value: cases.length, label: 'เคสทั้งหมด', top: undefined as string | undefined, valueColor: '#1d2030' },
    { value: countBy('voting'), label: 'กำลังโหวต', top: '#667eea', valueColor: '#4f46e5' },
    { value: countBy('approved'), label: 'อนุมัติแล้ว', top: '#10b981', valueColor: '#047857' },
    { value: countBy(['paid', 'closed']), label: 'จ่ายแล้ว/ปิดเคส', top: '#0d9488', valueColor: '#0f766e' },
  ]

  const recent = cases.slice(0, 5)

  return (
    <section style={{ animation: 'none' }}>
      {/* greeting */}
      <div style={{ marginBottom: 22 }}>
        <h1 style={{ margin: 0, fontSize: 27, fontWeight: 800, letterSpacing: '-0.4px' }}>สวัสดี, {fullName}</h1>
        <div style={{ marginTop: 5, fontSize: 14, color: '#717892' }}>
          บทบาท: <span style={{ fontWeight: 700, color: '#4a5176' }}>{roleLabels[role] || role}</span>
        </div>
      </div>

      {/* stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 14, marginBottom: 22 }}>
        {stats.map((s) => (
          <div key={s.label} style={{ ...statCard, ...(s.top ? { borderTop: `3px solid ${s.top}` } : {}) }}>
            <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.5px', color: s.valueColor }}>{s.value}</div>
            <div style={{ fontSize: 13, color: '#838aa3', fontWeight: 600, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div style={{ borderRadius: 16, padding: '22px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 26, backgroundImage: 'linear-gradient(120deg,#667eea,#7d6df0)' }}>
        <div>
          <div style={{ color: '#fff', fontSize: 18, fontWeight: 800 }}>ต้องการความช่วยเหลือค่ารักษาสัตว์?</div>
          <div style={{ color: '#e7e9ff', fontSize: 14, marginTop: 3 }}>เปิดเคส แนบรูปและบิล แล้วให้สมาชิกที่ถูกสุ่มร่วมพิจารณา</div>
        </div>
        <Link href="/dashboard/cases/new" style={{ background: '#fff', color: '#5560d8', borderRadius: 11, padding: '12px 22px', fontSize: 15, fontWeight: 700, whiteSpace: 'nowrap' }}>
          เปิดเคสใหม่
        </Link>
      </div>

      {/* workflow */}
      <div style={{ fontSize: 13, fontWeight: 700, color: '#9aa0b8', letterSpacing: '0.4px', marginBottom: 12 }}>ขั้นตอนการทำงานของระบบ</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 10, marginBottom: 30 }}>
        {steps.map((st) => (
          <div key={st.n} style={{ background: '#fff', border: '1px solid #edeef7', borderRadius: 13, padding: '15px 14px' }}>
            <div style={{ width: 26, height: 26, borderRadius: 8, background: '#eef0fd', color: '#5560d8', fontWeight: 800, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 9 }}>{st.n}</div>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{st.title}</div>
            <div style={{ fontSize: 12, color: '#909abb', marginTop: 2 }}>{st.sub}</div>
          </div>
        ))}
      </div>

      {/* recent cases */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ fontSize: 16, fontWeight: 800 }}>เคสล่าสุด</div>
        <Link href="/dashboard/cases" style={{ color: '#5560d8', fontWeight: 700, fontSize: 13 }}>ดูทั้งหมด →</Link>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
        {recent.length === 0 && (
          <div style={{ background: '#fff', border: '1px dashed #dfe1ef', borderRadius: 14, padding: 40, textAlign: 'center', color: '#9aa0b8' }}>
            ยังไม่มีเคส
          </div>
        )}
        {recent.map((c) => {
          const b = statusBadge(c.status)
          return (
            <Link
              key={c.id}
              href={`/dashboard/cases/${c.id}`}
              style={{ background: '#fff', border: '1px solid #edeef7', borderRadius: 14, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 16, color: 'inherit' }}
            >
              <div style={{ flex: 'none', width: 46, height: 46, borderRadius: 11, background: '#f3f4fc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{animalIcon(c.animal_type)}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.title}</div>
                <div style={{ fontSize: 12.5, color: '#909abb', marginTop: 2 }}>
                  {c.animal_type} · {c.clinic_name || 'ไม่ระบุคลินิก'} · {Number(c.requested_amount).toLocaleString()} บาท
                </div>
              </div>
              {c.mode === 'emergency' && (
                <span style={{ background: '#fff1f1', color: '#d9433f', fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 999, whiteSpace: 'nowrap', flex: 'none' }}>⚡ ฉุกเฉิน</span>
              )}
              <span style={b.style}>{b.label}</span>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
