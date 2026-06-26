// One-off: create a demo case with a real photo via service-role
// Usage: node scripts/create-demo-case.mjs
import { createClient } from '@supabase/supabase-js'
import fs from 'node:fs'

// load .env.local
const env = fs.readFileSync('.env.local', 'utf8')
for (const line of env.split('\n')) {
  const m = line.match(/^([A-Z_]+)=(.*)$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2]
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) throw new Error('Missing Supabase env vars')

const admin = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ---- 1) Caretaker (fictitious) ----
const stamp = Date.now()
const email = `demo-caretaker-${stamp}@punruksa.demo`
const fullName = 'คุณณดา ปัญญา'

console.log('Creating caretaker auth user...')
const { data: authData, error: authErr } = await admin.auth.admin.createUser({
  email,
  password: `Demo!${stamp}`,
  email_confirm: true,
  user_metadata: { full_name: fullName },
})
if (authErr) throw authErr
const userId = authData.user.id
console.log('  auth user id:', userId)

console.log('Inserting public.users profile...')
const { error: profErr } = await admin.from('users').insert({
  id: userId,
  full_name: fullName,
  email,
  phone: '081-234-5678',
  role: 'caretaker',
  is_verified: true,
})
if (profErr) throw profErr

// ---- 2) Case ----
console.log('Creating case...')
const { data: newCase, error: caseErr } = await admin
  .from('cases')
  .insert({
    title: '[DEMO] น้องโชกุน ลูกโกลเด้น 3 เดือน ติดเชื้อพาร์โว ต้องรักษาด่วน',
    animal_type: 'สุนัข',
    symptoms:
      '*** เคสตัวอย่างสำหรับทดสอบระบบ ***\n\n' +
      'น้องโชกุน อายุ 3 เดือน ลูกโกลเด้นรีทรีฟเวอร์ มีอาการอาเจียนและถ่ายเป็นเลือดมา 2 วัน ' +
      'อ่อนเพลียจนกินอาหารไม่ลง พาไปคลินิกตรวจพบว่าติดเชื้อ Canine Parvovirus (CPV) ' +
      'หมอแนะนำให้นอนรักษาในคลินิก ฉีดน้ำเกลือ ยาต้านอาเจียน และยาปฏิชีวนะ ' +
      'ประมาณ 5–7 วัน อัตราการรอดอยู่ที่ ~70% หากได้รับการรักษาทันเวลา\n\n' +
      'ครอบครัวเพิ่งรับน้องเป็นลูกบุญธรรมมาจากแม่หมาจรเมื่อ 2 เดือนก่อน ' +
      'รายได้ทางเดียวจากร้านขายของชำเล็ก ๆ ไม่พอจ่ายค่ารักษาทั้งหมด ' +
      'ขอความช่วยเหลือเร่งด่วนค่ะ 🙏',
    clinic_name: 'คลินิกรักษาสัตว์ปันใจ จ.เชียงใหม่',
    requested_amount: 12500,
    mode: 'emergency',
    status: 'received',
    created_by: userId,
  })
  .select('id')
  .single()
if (caseErr) throw caseErr
console.log('  case id:', newCase.id)

// ---- 3) Upload photo to storage ----
console.log('Uploading photo to case-files bucket...')
const buf = fs.readFileSync('/tmp/demo-case-photos/dog-vet-2.jpg')
const objectName = `${newCase.id}/${stamp}-shogun-puppy.jpg`
const { error: upErr } = await admin.storage
  .from('case-files')
  .upload(objectName, buf, { contentType: 'image/jpeg', upsert: false })
if (upErr) throw upErr
const {
  data: { publicUrl },
} = admin.storage.from('case-files').getPublicUrl(objectName)
console.log('  public URL:', publicUrl)

// ---- 4) case_documents row ----
console.log('Inserting case_documents row...')
const { error: docErr } = await admin.from('case_documents').insert({
  case_id: newCase.id,
  doc_type: 'photo',
  file_url: publicUrl,
})
if (docErr) throw docErr

// ---- 5) Audit log ----
await admin.from('audit_log').insert({
  actor_id: userId,
  case_id: newCase.id,
  action: 'case_created',
  details: {
    title: '[DEMO] น้องโชกุน',
    mode: 'emergency',
    requested_amount: 12500,
    note: 'demo case created via scripts/create-demo-case.mjs',
  },
})

console.log('\n✅ Done!')
console.log('   View case: /dashboard/cases/' + newCase.id)
console.log('   Verify queue (admin): /dashboard/admin/verify')
