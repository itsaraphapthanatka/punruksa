import type { Locale } from './i18n'

interface Strings {
  brand: string
  nav: { cases: string; how: string; login: string; donate: string; allCases: string; home: string }
  hero: { eyebrow: string; title1: string; title2: string; subtitle: string; ctaDonate: string; ctaCases: string; greet: string }
  mini: { cases: string; helped: string; donors: string }
  stats: { fund: string; donors: string; cases: string; helped: string }
  open: { title: string; sub: string; all: string; empty: string }
  how: { title: string; sub: string; steps: { t: string; s: string }[]; details: { title: string; sub: string; bullets: { icon: string; t: string; s: string }[]; foot?: string }[] }
  cta: { title: string; sub: string; signup: string; login: string }
  footer: { tag: string; mvp: string }
  sponsors: { title: string; sub: string; partners: string; partnersEmpty: string; recent: string; anon: string; empty: string; become: string; thanks: string }
  status: Record<string, string>
  emergency: string
  casePage: {
    crumb: string; requested: string; baht: string; progress: string; reviewStatus: string; donate: string; poolNote: string
    b1: string; b2: string; b3: string; story: string; pdpa: string; evidence: string; bill: string; estimate: string
    updates: string; noUpdates: string; openedOn: string; noClinic: string
  }
}

export const dict: Record<Locale, Strings> = {
  th: {
    brand: 'ปันรักษา',
    nav: { cases: 'เคส', how: 'วิธีการ', login: 'เข้าสู่ระบบ', donate: 'สมทบทุนช่วยน้อง', allCases: '← เคสทั้งหมด', home: 'หน้าแรก / เคส' },
    hero: {
      eyebrow: '🐾 โปร่งใส · สุ่มอนุมัติ · ตรวจสอบได้',
      title1: 'ช่วยเหลือสัตว์ที่ต้องการ', title2: 'ด้วยพลังของทุกคน',
      subtitle: 'เปิดเคสขอค่ารักษา แนบหลักฐาน แล้วให้สมาชิกที่ถูกสุ่มเป็นกรรมการร่วมพิจารณา ทุกขั้นตอนเปิดให้ตรวจสอบได้',
      ctaDonate: 'สมทบทุนช่วยน้อง', ctaCases: 'ดูเคสที่เปิดอยู่', greet: 'สวัสดี! 👋',
    },
    mini: { cases: 'เคสทั้งหมด', helped: 'ช่วยสำเร็จ', donors: 'ผู้บริจาค' },
    stats: { fund: 'ยอดกองทุน', donors: 'ผู้บริจาค', cases: 'เคสทั้งหมด', helped: 'ช่วยสำเร็จ' },
    open: { title: 'เคสที่กำลังเปิด', sub: 'เคสที่ชุมชนกำลังร่วมพิจารณา — ทุกการบริจาคเข้ากองกลางเดียว ไม่ได้ระดมทุนแยกรายเคส', all: 'ดูทั้งหมด →', empty: 'ยังไม่มีเคสที่กำลังเปิด' },
    how: {
      title: 'ระบบทำงานอย่างไร', sub: 'โปร่งใสกว่าโพสต์ขอบริจาคทั่วไป ด้วยการตัดสินใจแบบกระจายอำนาจ',
      steps: [
        { t: 'เปิดเคส', s: 'แนบรูปและบิลค่ารักษา' },
        { t: 'ตรวจเอกสาร', s: 'แอดมินคัดกรอง' },
        { t: 'สุ่มกรรมการ', s: 'ปิดบังตัวตนเจ้าของ' },
        { t: 'ลงมติ', s: 'ครบเกณฑ์ = อนุมัติ' },
        { t: 'จ่าย + ปิดเคส', s: 'จ่ายตรงคลินิก' },
      ],
      details: [
        {
          title: '📝 เปิดเคสทำอย่างไร',
          sub: 'ผู้ดูแลสัตว์เปิดเคสขอรับการสนับสนุนค่ารักษา พร้อมแนบหลักฐาน',
          bullets: [
            { icon: '🐾', t: 'ข้อมูลสัตว์', s: 'ระบุชนิดสัตว์ อาการ และรายละเอียดการรักษาที่ต้องการ' },
            { icon: '📷', t: 'แนบหลักฐาน', s: 'รูปสัตว์ + บิลค่ารักษา / ใบประเมินจากคลินิก เพื่อให้กรรมการพิจารณา' },
            { icon: '💰', t: 'ระบุยอดที่ขอ', s: 'จำนวนเงินค่ารักษาที่ต้องการการสนับสนุน' },
            { icon: '⚡', t: 'เลือกโหมด', s: 'ปกติ (พิจารณา 48 ชม.) หรือ ฉุกเฉิน (4 ชม.) สำหรับเคสที่รอไม่ได้' },
          ],
        },
        {
          title: '🔎 ตรวจเอกสารทำอย่างไร',
          sub: 'แอดมินคัดกรองเอกสารก่อน เพื่อให้เฉพาะเคสที่ถูกต้องเข้าสู่การโหวต',
          bullets: [
            { icon: '✅', t: 'ตรวจความครบถ้วน', s: 'เอกสารและหลักฐานสอดคล้องกับยอดที่ขอ และเป็นเคสจริง' },
            { icon: '🚫', t: 'กรองเคสไม่เข้าเกณฑ์', s: 'ตัดเคสซ้ำ ข้อมูลไม่ครบ หรือไม่ตรงวัตถุประสงค์ออก' },
            { icon: '🔄', t: 'ผลการตรวจ', s: 'ผ่าน → เปิดรอบโหวตอัตโนมัติทันที · ไม่ผ่าน → ตีกลับพร้อมเหตุผล' },
          ],
        },
        {
          title: '🎲 การสุ่มกรรมการทำอย่างไร',
          sub: 'หัวใจของระบบ — ตัดสินใจกระจายอำนาจ ป้องกันการล็อบบี้ และยุติธรรมต่อทุกเคส',
          bullets: [
            { icon: '👥', t: 'จำนวนกรรมการที่สุ่ม', s: 'โหมดปกติ: สุ่ม 20 คน · ต้องอนุมัติ ≥ 12 คนถึงผ่าน\nโหมดฉุกเฉิน: สุ่ม 15 คน · ต้องอนุมัติ ≥ 10 คน' },
            { icon: '⏱️', t: 'กรอบเวลาในการโหวต', s: 'โหมดปกติ 48 ชั่วโมง · โหมดฉุกเฉิน 4 ชั่วโมง — กรรมการที่ถูกสุ่มจะได้รับแจ้งทันที' },
            { icon: '🔀', t: 'อัลกอริทึมการสุ่ม', s: 'ใช้ Fisher–Yates shuffle — ทุกคนใน pool มีโอกาสถูกสุ่มเท่ากัน ไม่สามารถบังคับเลือกได้' },
            { icon: '🛡️', t: 'คุณสมบัติของกรรมการ', s: 'ต้องเป็นสมาชิก role = approver และผ่านการยืนยันตัวตน (is_verified) — แอดมินตรวจก่อน' },
            { icon: '🔒', t: 'ปิดบังตัวตนเจ้าของ', s: 'กรรมการเห็นเฉพาะข้อมูลเคส (อาการ บิล รูป) — ไม่เห็นชื่อหรือเบอร์เจ้าของ ตาม PDPA' },
            { icon: '🚫', t: 'กันการมีส่วนได้ส่วนเสีย', s: 'เจ้าของเคสจะไม่ถูกสุ่มในเคสของตัวเอง — แยกผู้ขอกับผู้พิจารณาออกจากกัน' },
          ],
          foot: 'ทุกขั้นตอนถูกบันทึกใน audit log สามารถตรวจสอบย้อนหลังได้',
        },
        {
          title: '🗳️ การลงมติทำอย่างไร',
          sub: 'กรรมการที่ถูกสุ่มอ่านรายละเอียดเคสแล้วลงมติอย่างอิสระ',
          bullets: [
            { icon: '👍', t: 'อนุมัติ / ไม่อนุมัติ', s: 'ลงมติพร้อม "เหตุผล" ที่บังคับให้พิมพ์ทุกครั้ง — โปร่งใส ตรวจสอบได้' },
            { icon: '🎯', t: 'เกณฑ์ผ่าน', s: 'ปกติ: อนุมัติ ≥ 12 จาก 20 เสียง · ฉุกเฉิน: ≥ 10 จาก 15 เสียง' },
            { icon: '⏱️', t: 'ภายในเวลาที่กำหนด', s: 'ปกติ 48 ชม. · ฉุกเฉิน 4 ชม. — ครบเกณฑ์เมื่อไหร่ปิดรอบทันที' },
            { icon: '⚖️', t: 'ตัดสินจากข้อเท็จจริง', s: 'พิจารณาจากหลักฐานในเคส ไม่ใช่ความสัมพันธ์ส่วนตัว' },
          ],
        },
        {
          title: '💸 การจ่าย + ปิดเคสทำอย่างไร',
          sub: 'เคสที่ผ่านมติ จ่ายตรงคลินิกแล้วปิดเคสอย่างโปร่งใส',
          bullets: [
            { icon: '🏥', t: 'จ่ายตรงคลินิก', s: 'โอนเงินตรงไปคลินิก/โรงพยาบาลสัตว์ ไม่ผ่านมือเจ้าของ — กันการนำเงินไปใช้ผิด' },
            { icon: '🧾', t: 'บันทึกหลักฐานการจ่าย', s: 'แนบหลักฐานการโอนไว้ในเคส' },
            { icon: '📣', t: 'อัปเดตผลการรักษา', s: 'โพสต์ความคืบหน้าให้ผู้บริจาคติดตามผลได้' },
            { icon: '📋', t: 'ปิดเคส + บันทึก', s: 'บันทึกทุกขั้นใน audit log ตรวจสอบย้อนหลังได้เสมอ' },
          ],
        },
      ],
    },
    cta: { title: 'พร้อมช่วยเหลือสัตว์ที่ต้องการแล้วหรือยัง?', sub: 'เริ่มต้นใช้งานฟรี — ร่วมบริจาค หรือสมัครเป็นกรรมการโหวต', signup: 'สมัครสมาชิก', login: 'เข้าสู่ระบบ' },
    footer: { tag: 'กองทุนรักษาสัตว์โดยชุมชน', mvp: 'เวอร์ชันแรก (MVP) · รับบริจาคผ่านพร้อมเพย์' },
    sponsors: { title: 'ผู้สนับสนุน', sub: 'ขอบคุณทุกพลังที่ร่วมดูแลสัตว์ป่วยไปกับเรา', partners: 'พันธมิตร & องค์กรผู้สนับสนุน', partnersEmpty: 'พื้นที่สำหรับโลโก้พันธมิตร — สนใจร่วมเป็นผู้สนับสนุน? ติดต่อเราได้เลย', recent: 'ผู้ร่วมบริจาคล่าสุด', anon: 'ผู้สนับสนุนใจดี', empty: 'ยังไม่มีผู้บริจาค — ร่วมเป็นผู้สนับสนุนคนแรก! 💜', become: 'ร่วมเป็นผู้สนับสนุน', thanks: 'ขอบคุณทุกการสนับสนุน 💜' },
    status: { received: 'รับเรื่อง', verifying: 'กำลังตรวจเอกสาร', voting: 'กำลังโหวต', approved: 'อนุมัติแล้ว', paid: 'จ่ายแล้ว', closed: 'จ่ายแล้ว · ปิดเคส', rejected: 'ไม่ผ่าน' },
    emergency: '⚡ ฉุกเฉิน',
    casePage: {
      crumb: 'หน้าแรก / เคส', requested: 'ยอดค่ารักษาที่ขอ', baht: 'บาท', progress: 'ความคืบหน้า', reviewStatus: 'สถานะการพิจารณา', donate: '💜 ร่วมบริจาคเข้ากองทุน',
      poolNote: 'เงินเข้ากองกลาง ช่วยเคสที่ผ่านมติการสุ่มโหวต — โปร่งใส ตรวจสอบได้',
      b1: '🎲 อนุมัติด้วยกรรมการที่ถูกสุ่ม', b2: '🔒 ปิดบังตัวตนเจ้าของ (PDPA)', b3: '📋 บันทึกทุกขั้นใน audit trail',
      story: 'เรื่องราวของเคสนี้', pdpa: '🔒 ข้อมูลส่วนตัวของเจ้าของสัตว์ถูกปิดบังตามนโยบาย PDPA — เปิดเผยเฉพาะข้อมูลที่จำเป็นต่อการพิจารณา',
      evidence: 'หลักฐาน / เอกสาร', bill: '🧾 บิลค่ารักษา', estimate: '📋 ใบประเมิน',
      updates: '📣 ความคืบหน้า', noUpdates: 'ยังไม่มีอัปเดต', openedOn: 'เปิดเมื่อ', noClinic: 'ไม่ระบุคลินิก',
    },
  },
  en: {
    brand: 'PanRaksa',
    nav: { cases: 'Cases', how: 'How it works', login: 'Log in', donate: 'Help a pet', allCases: '← All cases', home: 'Home / Cases' },
    hero: {
      eyebrow: '🐾 Transparent · Random approval · Auditable',
      title1: 'Help animals in need', title2: 'with the power of community',
      subtitle: 'Open a case for treatment costs, attach evidence, then let randomly-selected members review it together. Every step is open to inspection.',
      ctaDonate: 'Help a pet', ctaCases: 'See open cases', greet: 'Hello! 👋',
    },
    mini: { cases: 'Cases', helped: 'Helped', donors: 'Donors' },
    stats: { fund: 'Fund balance', donors: 'Donors', cases: 'Total cases', helped: 'Helped' },
    open: { title: 'Open cases', sub: 'Cases under community review — all donations go to one shared pool, not per-case fundraising', all: 'See all →', empty: 'No open cases yet' },
    how: {
      title: 'How it works', sub: 'More transparent than ordinary donation posts — with decentralized decisions',
      steps: [
        { t: 'Open a case', s: 'Attach photos + vet bill' },
        { t: 'Document review', s: 'Admin screening' },
        { t: 'Random jury', s: 'Owner identity hidden' },
        { t: 'Vote', s: 'Threshold reached = approved' },
        { t: 'Pay + close', s: 'Paid directly to clinic' },
      ],
      details: [
        {
          title: '📝 How opening a case works',
          sub: 'A caretaker opens a case requesting treatment support, with evidence attached',
          bullets: [
            { icon: '🐾', t: 'Animal info', s: 'Species, symptoms, and the treatment details needed' },
            { icon: '📷', t: 'Attach evidence', s: 'Animal photos + vet bill / estimate so jurors can judge' },
            { icon: '💰', t: 'Requested amount', s: 'The treatment cost that needs support' },
            { icon: '⚡', t: 'Pick a mode', s: 'Normal (48h review) or Urgent (4h) for cases that can’t wait' },
          ],
        },
        {
          title: '🔎 How document review works',
          sub: 'Admin screens documents so only valid cases reach voting',
          bullets: [
            { icon: '✅', t: 'Completeness check', s: 'Evidence matches the requested amount and the case is genuine' },
            { icon: '🚫', t: 'Filter ineligible', s: 'Remove duplicates, incomplete info, or off-purpose cases' },
            { icon: '🔄', t: 'Outcome', s: 'Pass → vote round opens automatically · Fail → returned with a reason' },
          ],
        },
        {
          title: '🎲 How the random jury works',
          sub: 'The heart of the system — decentralized decisions, lobby-proof, and fair to every case',
          bullets: [
            { icon: '👥', t: 'Jury size', s: 'Normal: sample 20 · need ≥ 12 approvals\nUrgent: sample 15 · need ≥ 10 approvals' },
            { icon: '⏱️', t: 'Voting window', s: 'Normal 48h · Urgent 4h — selected jurors are notified instantly' },
            { icon: '🔀', t: 'Sampling algorithm', s: 'Fisher–Yates shuffle — every eligible member has equal odds, no way to game it' },
            { icon: '🛡️', t: 'Juror eligibility', s: 'Must be role = approver with verified identity (is_verified) — admin-screened' },
            { icon: '🔒', t: 'Owner identity hidden', s: 'Jurors see only case data (symptoms, bill, photos) — no owner name/phone, per PDPA' },
            { icon: '🚫', t: 'Conflict of interest', s: 'The owner is never sampled into their own case — requesters separate from reviewers' },
          ],
          foot: 'Every step is recorded in the audit log and can be reviewed retrospectively',
        },
        {
          title: '🗳️ How voting works',
          sub: 'Selected jurors read the case and vote independently',
          bullets: [
            { icon: '👍', t: 'Approve / reject', s: 'Each vote requires a written reason — transparent and auditable' },
            { icon: '🎯', t: 'Pass threshold', s: 'Normal: ≥ 12 of 20 · Urgent: ≥ 10 of 15' },
            { icon: '⏱️', t: 'Within the window', s: 'Normal 48h · Urgent 4h — closes as soon as the threshold is met' },
            { icon: '⚖️', t: 'Judged on facts', s: 'Decided from case evidence, not personal relationships' },
          ],
        },
        {
          title: '💸 How pay + close works',
          sub: 'Approved cases are paid directly to the clinic, then closed transparently',
          bullets: [
            { icon: '🏥', t: 'Paid directly to clinic', s: 'Funds go straight to the vet — never through the owner — preventing misuse' },
            { icon: '🧾', t: 'Payment proof recorded', s: 'Transfer evidence attached to the case' },
            { icon: '📣', t: 'Treatment updates', s: 'Progress posted so donors can follow the outcome' },
            { icon: '📋', t: 'Close + log', s: 'Every step recorded in the audit log, always reviewable' },
          ],
        },
      ],
    },
    cta: { title: 'Ready to help animals in need?', sub: 'Free to start — donate or become a voting member', signup: 'Sign up', login: 'Log in' },
    footer: { tag: 'Community animal treatment fund', mvp: 'Early version (MVP) · PromptPay donations' },
    sponsors: { title: 'Our supporters', sub: 'Thank you to everyone helping us care for animals in need', partners: 'Partners & sponsoring organizations', partnersEmpty: 'Space for partner logos — interested in sponsoring? Get in touch', recent: 'Recent supporters', anon: 'Kind supporter', empty: 'No donations yet — be the first supporter! 💜', become: 'Become a supporter', thanks: 'Thank you for every bit of support 💜' },
    status: { received: 'Received', verifying: 'Under review', voting: 'Voting', approved: 'Approved', paid: 'Paid', closed: 'Paid · Closed', rejected: 'Rejected' },
    emergency: '⚡ Urgent',
    casePage: {
      crumb: 'Home / Cases', requested: 'Requested treatment cost', baht: 'THB', progress: 'Progress', reviewStatus: 'Review status', donate: '💜 Donate to the fund',
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

// ลำดับขั้นตอนการพิจารณา (workflow) — ใช้แสดงแถบ step ทั้งหน้าแรกและหน้ารายละเอียด
export const STEP_KEYS = ['received', 'verifying', 'voting', 'approved', 'paid']
// index ขั้นปัจจุบัน (closed = ขั้นสุดท้าย, rejected = -1 คือหลุดเส้นทาง)
export const caseStep = (s: string): number => (s === 'closed' ? STEP_KEYS.length - 1 : STEP_KEYS.indexOf(s))

export const animalIcon = (t: string) =>
  t.includes('แมว') ? '🐱' : t.includes('สุนัข') || t.includes('หมา') ? '🐶' : t.includes('นก') ? '🐦' : '🐾'
