// ทดสอบส่ง Flex Message การ์ดแจ้งเตือนโหวต ไปยัง LINE userId ที่ระบุ
// Usage: node scripts/test-line-flex.mjs <LINE_USER_ID> [caseId]
//   - LINE_USER_ID: U........ (ของคุณเอง — ต้องเพิ่ม OA ปันรักษา เป็นเพื่อนก่อน)
//   - caseId (ไม่ใส่ก็ได้): เลือกเคส demo สักเคสมาใช้รูป/ชื่อ; ถ้าไม่ใส่จะหยิบเคสล่าสุดที่มีรูป
import { createClient } from '@supabase/supabase-js'
import fs from 'node:fs'

const env = fs.readFileSync('.env.local', 'utf8')
for (const line of env.split('\n')) {
  const m = line.match(/^([A-Z_]+)=(.*)$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2]
}

const [lineUserId, caseIdArg] = process.argv.slice(2)
if (!lineUserId) {
  console.error('Usage: node scripts/test-line-flex.mjs <LINE_USER_ID> [caseId]')
  process.exit(1)
}

const token = process.env.LINE_MESSAGING_TOKEN
if (!token) {
  console.error('❌ ไม่มี LINE_MESSAGING_TOKEN ใน .env.local')
  process.exit(1)
}

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
const base = (process.env.NEXT_PUBLIC_SITE_URL || 'https://punruksa.petgo.asia').replace(/\/$/, '')

// หาเคส
let caseRow
if (caseIdArg) {
  const { data } = await admin.from('cases').select('id, title, animal_type, requested_amount, mode').eq('id', caseIdArg).single()
  caseRow = data
} else {
  const { data } = await admin.from('cases').select('id, title, animal_type, requested_amount, mode').order('created_at', { ascending: false }).limit(20)
  // หยิบเคสแรกที่มีรูป
  for (const c of data || []) {
    const { data: doc } = await admin.from('case_documents').select('file_url').eq('case_id', c.id).eq('doc_type', 'photo').limit(1).maybeSingle()
    if (doc?.file_url) { caseRow = c; caseRow._cover = doc.file_url; break }
  }
  if (!caseRow && data?.[0]) caseRow = data[0]
}
if (!caseRow) { console.error('❌ ไม่พบเคส'); process.exit(1) }

let heroUrl = caseRow._cover
if (!heroUrl) {
  const { data: doc } = await admin.from('case_documents').select('file_url').eq('case_id', caseRow.id).eq('doc_type', 'photo').limit(1).maybeSingle()
  heroUrl = doc?.file_url || `${base}/logo.jpg`
}

const isEmergency = caseRow.mode === 'emergency'
const link = `${base}/dashboard/vote`
const closesAt = new Date(Date.now() + (isEmergency ? 4 : 48) * 3600 * 1000)
const closesText = closesAt.toLocaleString('th-TH', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

const infoRow = (label, value, color = '#1d2030') => ({
  type: 'box', layout: 'baseline', spacing: 'sm',
  contents: [
    { type: 'text', text: label, color: '#9aa0b8', size: 'sm', flex: 2 },
    { type: 'text', text: value, color, size: 'sm', weight: 'bold', flex: 4, wrap: true },
  ],
})

const bubble = {
  type: 'bubble',
  hero: { type: 'image', url: heroUrl, size: 'full', aspectRatio: '20:13', aspectMode: 'cover', action: { type: 'uri', uri: link } },
  body: {
    type: 'box', layout: 'vertical', spacing: 'md',
    contents: [
      { type: 'text', text: '🐾 ปันรักษา · รอบโหวตใหม่', size: 'xs', weight: 'bold', color: '#9166e8' },
      { type: 'text', text: caseRow.title || 'เคสใหม่', weight: 'bold', size: 'lg', wrap: true },
      {
        type: 'box', layout: 'vertical', margin: 'md', spacing: 'sm',
        contents: [
          infoRow('ชนิดสัตว์', caseRow.animal_type || '-'),
          infoRow('ยอดที่ขอ', Number(caseRow.requested_amount).toLocaleString() + ' บาท', '#127a52'),
          infoRow('โหมด', isEmergency ? '🚨 ฉุกเฉิน' : 'ปกติ', isEmergency ? '#c2410c' : '#1d2030'),
          infoRow('ปิดโหวต', closesText),
        ],
      },
      { type: 'text', text: 'คุณถูกสุ่มเป็นกรรมการพิจารณาเคสนี้ — ช่วยลงมติภายในเวลาที่กำหนด 🗳️', size: 'xs', color: '#717892', wrap: true, margin: 'md' },
    ],
  },
  footer: {
    type: 'box', layout: 'vertical',
    contents: [
      { type: 'button', style: 'primary', color: '#667eea', height: 'sm', action: { type: 'uri', label: 'พิจารณาเคสนี้', uri: link } },
    ],
  },
}

console.log('เคส:', caseRow.title)
console.log('รูป:', heroUrl)
console.log('ส่งไป LINE userId:', lineUserId)

const r = await fetch('https://api.line.me/v2/bot/message/push', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  body: JSON.stringify({ to: lineUserId, messages: [{ type: 'flex', altText: `🐾 ปันรักษา: เคส "${caseRow.title}"`, contents: bubble }] }),
})
const text = await r.text()
console.log(`\nHTTP ${r.status}`, r.ok ? '✅ ส่งสำเร็จ' : '❌ ' + text)
