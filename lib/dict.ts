import type { Locale } from './i18n'

interface Strings {
  brand: string
  nav: { cases: string; how: string; login: string; donate: string; allCases: string; home: string }
  hero: { eyebrow: string; title1: string; title2: string; subtitle: string; ctaDonate: string; ctaCases: string; greet: string }
  mini: { cases: string; helped: string; donors: string }
  stats: { fund: string; donors: string; cases: string; helped: string }
  open: { title: string; sub: string; all: string; empty: string }
  how: { title: string; sub: string; steps: { t: string; s: string }[] }
  cta: { title: string; sub: string; signup: string; login: string }
  footer: { tag: string; mvp: string }
  status: Record<string, string>
  emergency: string
  casePage: {
    crumb: string; requested: string; baht: string; progress: string; donate: string; poolNote: string
    b1: string; b2: string; b3: string; story: string; pdpa: string; evidence: string; bill: string; estimate: string
    updates: string; noUpdates: string; openedOn: string; noClinic: string
  }
}

export const dict: Record<Locale, Strings> = {
  th: {
    brand: 'ปันรักษา',
    nav: { cases: 'เคส', how: 'วิธีการ', login: 'เข้าสู่ระบบ', donate: 'ร่วมบริจาค', allCases: '← เคสทั้งหมด', home: 'หน้าแรก / เคส' },
    hero: {
      eyebrow: '🐾 โปร่งใส · สุ่มอนุมัติ · ตรวจสอบได้',
      title1: 'ช่วยเหลือสัตว์ที่ต้องการ', title2: 'ด้วยพลังของทุกคน',
      subtitle: 'เปิดเคสขอค่ารักษา แนบหลักฐาน แล้วให้สมาชิกที่ถูกสุ่มเป็นกรรมการร่วมพิจารณา ทุกขั้นตอนเปิดให้ตรวจสอบได้',
      ctaDonate: 'ร่วมบริจาค', ctaCases: 'ดูเคสที่เปิดอยู่', greet: 'สวัสดี! 👋',
    },
    mini: { cases: 'เคสทั้งหมด', helped: 'ช่วยสำเร็จ', donors: 'ผู้บริจาค' },
    stats: { fund: 'ยอดกองทุน (เดโม)', donors: 'ผู้บริจาค', cases: 'เคสทั้งหมด', helped: 'ช่วยสำเร็จ' },
    open: { title: 'เคสที่กำลังเปิด', sub: 'ร่วมเป็นส่วนหนึ่งของการช่วยเหลือ', all: 'ดูทั้งหมด →', empty: 'ยังไม่มีเคสที่กำลังเปิด' },
    how: {
      title: 'ระบบทำงานอย่างไร', sub: 'โปร่งใสกว่าโพสต์ขอบริจาคทั่วไป ด้วยการตัดสินใจแบบกระจายอำนาจ',
      steps: [
        { t: 'เปิดเคส', s: 'แนบรูปและบิลค่ารักษา' },
        { t: 'ตรวจเอกสาร', s: 'แอดมินคัดกรอง' },
        { t: 'สุ่มกรรมการ', s: 'ปิดบังตัวตนเจ้าของ' },
        { t: 'ลงมติ', s: 'ครบเกณฑ์ = อนุมัติ' },
        { t: 'จ่าย + ปิดเคส', s: 'จ่ายตรงคลินิก' },
      ],
    },
    cta: { title: 'พร้อมช่วยเหลือสัตว์ที่ต้องการแล้วหรือยัง?', sub: 'เริ่มต้นใช้งานฟรี — ร่วมบริจาค หรือสมัครเป็นกรรมการโหวต', signup: 'สมัครสมาชิก', login: 'เข้าสู่ระบบ' },
    footer: { tag: 'กองทุนรักษาสัตว์โดยชุมชน', mvp: 'เวอร์ชันแรก (MVP) · ยังไม่เปิดระบบการเงิน' },
    status: { received: 'รับเรื่อง', verifying: 'กำลังตรวจเอกสาร', voting: 'กำลังโหวต', approved: 'อนุมัติแล้ว', paid: 'จ่ายแล้ว', closed: 'จ่ายแล้ว · ปิดเคส', rejected: 'ไม่ผ่าน' },
    emergency: '⚡ ฉุกเฉิน',
    casePage: {
      crumb: 'หน้าแรก / เคส', requested: 'ยอดค่ารักษาที่ขอ', baht: 'บาท', progress: 'ความคืบหน้า', donate: '💜 ร่วมบริจาคเข้ากองทุน',
      poolNote: 'เงินเข้ากองกลาง ช่วยเคสที่ผ่านมติการสุ่มโหวต — โปร่งใส ตรวจสอบได้',
      b1: '🎲 อนุมัติด้วยกรรมการที่ถูกสุ่ม', b2: '🔒 ปิดบังตัวตนเจ้าของ (PDPA)', b3: '📋 บันทึกทุกขั้นใน audit trail',
      story: 'เรื่องราวของเคสนี้', pdpa: '🔒 ข้อมูลส่วนตัวของเจ้าของสัตว์ถูกปิดบังตามนโยบาย PDPA — เปิดเผยเฉพาะข้อมูลที่จำเป็นต่อการพิจารณา',
      evidence: 'หลักฐาน / เอกสาร', bill: '🧾 บิลค่ารักษา', estimate: '📋 ใบประเมิน',
      updates: '📣 ความคืบหน้า', noUpdates: 'ยังไม่มีอัปเดต', openedOn: 'เปิดเมื่อ', noClinic: 'ไม่ระบุคลินิก',
    },
  },
  en: {
    brand: 'PanRaksa',
    nav: { cases: 'Cases', how: 'How it works', login: 'Log in', donate: 'Donate', allCases: '← All cases', home: 'Home / Cases' },
    hero: {
      eyebrow: '🐾 Transparent · Random approval · Auditable',
      title1: 'Help animals in need', title2: 'with the power of community',
      subtitle: 'Open a case for treatment costs, attach evidence, then let randomly-selected members review it together. Every step is open to inspection.',
      ctaDonate: 'Donate', ctaCases: 'See open cases', greet: 'Hello! 👋',
    },
    mini: { cases: 'Cases', helped: 'Helped', donors: 'Donors' },
    stats: { fund: 'Fund balance (demo)', donors: 'Donors', cases: 'Total cases', helped: 'Helped' },
    open: { title: 'Open cases', sub: 'Be part of the help', all: 'See all →', empty: 'No open cases yet' },
    how: {
      title: 'How it works', sub: 'More transparent than ordinary donation posts — with decentralized decisions',
      steps: [
        { t: 'Open a case', s: 'Attach photos + vet bill' },
        { t: 'Document review', s: 'Admin screening' },
        { t: 'Random jury', s: 'Owner identity hidden' },
        { t: 'Vote', s: 'Threshold reached = approved' },
        { t: 'Pay + close', s: 'Paid directly to clinic' },
      ],
    },
    cta: { title: 'Ready to help animals in need?', sub: 'Free to start — donate or become a voting member', signup: 'Sign up', login: 'Log in' },
    footer: { tag: 'Community animal treatment fund', mvp: 'Early version (MVP) · Payments not yet enabled' },
    status: { received: 'Received', verifying: 'Under review', voting: 'Voting', approved: 'Approved', paid: 'Paid', closed: 'Paid · Closed', rejected: 'Rejected' },
    emergency: '⚡ Urgent',
    casePage: {
      crumb: 'Home / Cases', requested: 'Requested treatment cost', baht: 'THB', progress: 'Progress', donate: '💜 Donate to the fund',
      poolNote: 'Funds go to the central pool to help cases approved by random vote — transparent and auditable.',
      b1: '🎲 Approved by a randomly-selected jury', b2: '🔒 Owner identity hidden (PDPA)', b3: '📋 Every step logged in audit trail',
      story: "This case's story", pdpa: "🔒 The owner's personal information is hidden per PDPA — only details necessary for review are shown.",
      evidence: 'Evidence / Documents', bill: '🧾 Vet bill', estimate: '📋 Estimate',
      updates: '📣 Updates', noUpdates: 'No updates yet', openedOn: 'Opened on', noClinic: 'Clinic not specified',
    },
  },
}

const STATUS_COLOR: Record<string, { bg: string; fg: string }> = {
  received: { bg: '#eef2f7', fg: '#5b6b7c' },
  verifying: { bg: '#eef2f7', fg: '#5b6b7c' },
  voting: { bg: '#fff3e0', fg: '#c2790a' },
  approved: { bg: '#e6f7ef', fg: '#127a52' },
  paid: { bg: '#e6f7ef', fg: '#127a52' },
  closed: { bg: '#e6f7ef', fg: '#127a52' },
  rejected: { bg: '#fdeaea', fg: '#c2410c' },
}

export function statusTag(l: Locale, s: string): { label: string; bg: string; fg: string } {
  const c = STATUS_COLOR[s] || { bg: '#eef2f7', fg: '#5b6b7c' }
  return { label: dict[l].status[s] || s, ...c }
}

export const progressOf = (s: string) =>
  ({ received: 12, verifying: 25, voting: 60, approved: 90, paid: 100, closed: 100, rejected: 100 } as Record<string, number>)[s] ?? 0

export const animalIcon = (t: string) =>
  t.includes('แมว') ? '🐱' : t.includes('สุนัข') || t.includes('หมา') ? '🐶' : t.includes('นก') ? '🐦' : '🐾'
