// ทดสอบส่ง Flex "ขอบคุณ" (เคสได้รับการอนุมัติ) ไปยัง LINE userId ที่ระบุ
// Usage: node scripts/test-line-thanks.mjs <LINE_USER_ID> [caseId]
import { createClient } from '@supabase/supabase-js'
import fs from 'node:fs'

const env = fs.readFileSync('.env.local', 'utf8')
for (const line of env.split('\n')) {
  const m = line.match(/^([A-Z_]+)=(.*)$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2]
}

const [lineUserId, caseIdArg] = process.argv.slice(2)
if (!lineUserId) {
  console.error('Usage: node scripts/test-line-thanks.mjs <LINE_USER_ID> [caseId]')
  process.exit(1)
}
const token = process.env.LINE_MESSAGING_TOKEN
if (!token) { console.error('❌ ไม่มี LINE_MESSAGING_TOKEN'); process.exit(1) }

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
const base = (process.env.NEXT_PUBLIC_SITE_URL || 'https://punruksa.petgo.asia').replace(/\/$/, '')

// หาเคสที่มีรูป
let caseRow, cover
if (caseIdArg) {
  const { data } = await admin.from('cases').select('id, title').eq('id', caseIdArg).single()
  caseRow = data
} else {
  const { data } = await admin.from('cases').select('id, title').order('created_at', { ascending: false }).limit(20)
  for (const c of data || []) {
    const { data: doc } = await admin.from('case_documents').select('file_url').eq('case_id', c.id).eq('doc_type', 'photo').limit(1).maybeSingle()
    if (doc?.file_url) { caseRow = c; cover = doc.file_url; break }
  }
  if (!caseRow && data?.[0]) caseRow = data[0]
}
if (!caseRow) { console.error('❌ ไม่พบเคส'); process.exit(1) }
if (!cover) {
  const { data: doc } = await admin.from('case_documents').select('file_url').eq('case_id', caseRow.id).eq('doc_type', 'photo').limit(1).maybeSingle()
  cover = doc?.file_url || `${base}/logo.jpg`
}

const title = caseRow.title || 'เคส'
const link = `${base}/dashboard/cases/${caseRow.id}`
const bubble = {
  type: 'bubble',
  hero: { type: 'image', url: cover, size: 'full', aspectRatio: '20:13', aspectMode: 'cover', action: { type: 'uri', uri: link } },
  body: {
    type: 'box', layout: 'vertical', spacing: 'md',
    contents: [
      { type: 'text', text: '💜 ปันรักษา · ขอบคุณ', size: 'xs', weight: 'bold', color: '#9166e8' },
      { type: 'text', text: `เคส "${title}" ได้รับการอนุมัติแล้ว 🎉`, weight: 'bold', size: 'md', wrap: true },
      { type: 'text', text: 'ขอบคุณที่ร่วมเป็นกรรมการพิจารณา 🙏 ทุกเสียงของคุณช่วยให้น้องได้รับการรักษา', size: 'sm', color: '#717892', wrap: true },
      {
        type: 'box', layout: 'baseline', spacing: 'sm', margin: 'md',
        contents: [
          { type: 'text', text: 'มติอนุมัติ', color: '#9aa0b8', size: 'sm', flex: 2 },
          { type: 'text', text: '12 เสียง', color: '#127a52', size: 'sm', weight: 'bold', flex: 4 },
        ],
      },
    ],
  },
  footer: {
    type: 'box', layout: 'vertical',
    contents: [{ type: 'button', style: 'primary', color: '#667eea', height: 'sm', action: { type: 'uri', label: 'ดูเคส', uri: link } }],
  },
}

console.log('เคส:', title, '\nรูป:', cover, '\nส่งไป:', lineUserId)
const r = await fetch('https://api.line.me/v2/bot/message/push', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  body: JSON.stringify({ to: lineUserId, messages: [{ type: 'flex', altText: `💜 เคส "${title}" อนุมัติแล้ว — ขอบคุณที่ร่วมพิจารณา`, contents: bubble }] }),
})
console.log(`\nHTTP ${r.status}`, r.ok ? '✅ ส่งสำเร็จ' : '❌ ' + (await r.text()))
