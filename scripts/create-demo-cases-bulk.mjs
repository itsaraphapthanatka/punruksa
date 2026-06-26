// Bulk-create 10 demo cases with real photos, spread across all statuses.
// Usage: node scripts/create-demo-cases-bulk.mjs
import { createClient } from '@supabase/supabase-js'
import fs from 'node:fs'

const env = fs.readFileSync('.env.local', 'utf8')
for (const line of env.split('\n')) {
  const m = line.match(/^([A-Z_]+)=(.*)$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2]
}
const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const PHOTOS_DIR = '/tmp/demo-case-photos'

// 10 cases — each with caretaker name, animal, story, status
const CASES = [
  {
    photo: 'cat-orange.jpg',
    caretaker: 'คุณสายฝน วงศ์ใหญ่',
    phone: '081-555-1101',
    province: 'กรุงเทพฯ',
    title: 'น้องส้ม แมวจรท้องแก่ พบเลือดออกหลังคลอด',
    animal_type: 'แมว',
    symptoms: 'น้องส้มเป็นแมวจรที่เก็บมาเลี้ยง คลอดลูกได้ 3 ตัวเมื่อ 2 วันก่อน แต่ยังมีเลือดออกต่อเนื่อง ' +
      'หมอตรวจพบรกค้างและสงสัยติดเชื้อในมดลูก ต้องผ่าตัดทำหมันและให้ยาฆ่าเชื้อ ขอความช่วยเหลือค่ารักษาเร่งด่วน',
    clinic: 'รพ.สัตว์เกษตร สาขาบางเขน',
    amount: 18500,
    mode: 'emergency',
    status: 'voting',
  },
  {
    photo: 'cat-siamese.jpg',
    caretaker: 'คุณวิจิตรา ทองดี',
    phone: '089-222-3344',
    province: 'นครปฐม',
    title: 'น้องโมจิ แมวสยามไตวายเรื้อรัง รักษาประจำ',
    animal_type: 'แมว',
    symptoms: 'น้องโมจิ อายุ 11 ปี ป่วยเป็นโรคไตเรื้อรัง (CKD) ระยะที่ 3 ต้องให้น้ำเกลือใต้ผิวหนัง ' +
      'และตรวจเลือดทุก 2 สัปดาห์ ค่ายา + ตรวจครั้งนี้ ~6,500 บาท เคสนี้ได้รับเงินช่วยเหลือและจ่ายค่ารักษาเรียบร้อยแล้ว',
    clinic: 'คลินิกรักษ์แมว นครปฐม',
    amount: 6500,
    mode: 'normal',
    status: 'paid',
  },
  {
    photo: 'cat-gray.jpg',
    caretaker: 'คุณนิรันดร์ พงษ์ศรี',
    phone: '063-878-1212',
    province: 'เชียงราย',
    title: 'น้องเทา ลูกแมว 2 เดือน ตาอักเสบรุนแรง',
    animal_type: 'แมว',
    symptoms: 'น้องเทาเป็นลูกแมวเก็บได้ข้างถนน อายุประมาณ 2 เดือน ตาทั้งสองข้างบวมแฉะมีหนอง ' +
      'สงสัยติดเชื้อ Herpes ต้องหยอดยาและฉีดยาปฏิชีวนะ ติดตามอาการ 2 สัปดาห์',
    clinic: 'คลินิกหมอเอ๋ เชียงราย',
    amount: 4200,
    mode: 'normal',
    status: 'verifying',
  },
  {
    photo: 'cat-black.jpg',
    caretaker: 'คุณภัทรา สุขใจ',
    phone: '094-111-9988',
    province: 'ภูเก็ต',
    title: 'น้องดำ แมวจรพิการขาหลัง รอผ่าตัดดามกระดูก',
    animal_type: 'แมว',
    symptoms: 'น้องดำเป็นแมวจรในชุมชน ถูกรถมอเตอร์ไซค์ชน ขาหลังหักทั้ง 2 ข้าง ' +
      'X-ray พบกระดูกแตก หมอแนะนำให้ผ่าตัดดามเหล็ก ค่ารักษาประมาณ 22,000 บาท',
    clinic: 'รพ.สัตว์ไทย จ.ภูเก็ต',
    amount: 22000,
    mode: 'normal',
    status: 'received',
  },
  {
    photo: 'cat-vet.jpg',
    caretaker: 'คุณกันยา ภัทรพล',
    phone: '086-432-7878',
    province: 'ชลบุรี',
    title: 'น้องมิ้น แมวเปอร์เซีย ผ่าตัดทำหมัน + ขูดหินปูน',
    animal_type: 'แมว',
    symptoms: 'น้องมิ้น อายุ 4 ปี ทำหมันและขูดหินปูนพร้อมกัน เคสนี้ปิดเรียบร้อย ' +
      'ผลการรักษาเป็นที่น่าพอใจ น้องกลับบ้านได้ในวันเดียวกัน เก็บไว้เป็นเคสตัวอย่าง',
    clinic: 'คลินิกหมอเปิ้ล ชลบุรี',
    amount: 3800,
    mode: 'normal',
    status: 'closed',
  },
  {
    photo: 'dog-puppy.jpg',
    caretaker: 'คุณอภิชาติ จิรพัฒน์',
    phone: '098-765-4321',
    province: 'ขอนแก่น',
    title: 'น้องมะลิ ลูกหมา 4 เดือน ติดเชื้อหนอนพยาธิ',
    animal_type: 'สุนัข',
    symptoms: 'น้องมะลิ ลูกพันธุ์ผสม 4 เดือน ท้องโตผิดปกติ ขับถ่ายเหลว เห็นพยาธิตัวกลม ' +
      'หมอแนะนำให้ถ่ายพยาธิและให้วิตามินเสริมเลือด ติดตามผล 4 สัปดาห์ ผ่านการโหวตเรียบร้อยแล้ว',
    clinic: 'คลินิกสัตวแพทย์ขอนแก่นแคร์',
    amount: 5500,
    mode: 'normal',
    status: 'approved',
  },
  {
    photo: 'dog-husky.jpg',
    caretaker: 'คุณนรินทร์ ศรีวงศ์',
    phone: '081-987-6543',
    province: 'เชียงใหม่',
    title: 'น้องอลาสก้า ฮัสกี้ ฮีทสโตรก ภาวะวิกฤต',
    animal_type: 'สุนัข',
    symptoms: 'น้องอลาสก้า ฮัสกี้ เพศเมีย 6 ปี เป็นฮีทสโตรกจากอากาศร้อน อุณหภูมิร่างกาย 41.5°C ' +
      'หมดสติ ต้องเข้า ICU ฉีดน้ำเกลือเย็น และให้ออกซิเจน 48 ชม. ค่ารักษาสูง ขอความช่วยเหลือด่วน 🚨',
    clinic: 'รพ.สัตว์เชียงใหม่ 24 ชม.',
    amount: 28500,
    mode: 'emergency',
    status: 'voting',
  },
  {
    photo: 'dog-mixed.jpg',
    caretaker: 'คุณวรพล สังข์ทอง',
    phone: '062-345-6789',
    province: 'นนทบุรี',
    title: 'น้องบราวน์ หมาบ้าน ขอค่ารักษาฟันผุ',
    animal_type: 'สุนัข',
    symptoms: 'เคสนี้ถูกตีกลับเนื่องจากเอกสารไม่ครบ — ไม่มีใบประเมินจากคลินิก ' +
      'และยอดที่ขอ (2,000 บาท) สามารถจัดการเองได้ตามเกณฑ์',
    clinic: 'คลินิกใกล้บ้าน',
    amount: 2000,
    mode: 'normal',
    status: 'rejected',
  },
  {
    photo: 'rabbit.jpg',
    caretaker: 'คุณปริยา จันทร์เพ็ญ',
    phone: '085-321-1234',
    province: 'สงขลา',
    title: 'น้องคุกกี้ กระต่ายเนเธอร์แลนด์ ฟันยาวผิดปกติ',
    animal_type: 'กระต่าย',
    symptoms: 'น้องคุกกี้ อายุ 2 ปี ฟันหน้าและกรามยาวผิดปกติ กินอาหารไม่ได้ น้ำหนักลดเร็ว ' +
      'หมอแนะนำให้ตัดฟันภายใต้การวางยา ติดตามทุก 6-8 สัปดาห์',
    clinic: 'รพ.สัตว์เล็ก ม.อ.หาดใหญ่',
    amount: 7200,
    mode: 'normal',
    status: 'received',
  },
  {
    photo: 'bird-parrot.jpg',
    caretaker: 'คุณธีรพงษ์ แก้วใส',
    phone: '099-876-5432',
    province: 'กรุงเทพฯ',
    title: 'น้องโกโก้ นกแก้วโคนัวร์ ปีกหัก',
    animal_type: 'นก',
    symptoms: 'น้องโกโก้บินชนกระจกหน้าต่าง ปีกซ้ายหักร้าวต้องใส่เฝือกและให้ยาแก้ปวด ' +
      'เคสนี้ระดมทุนผ่านและจ่ายค่ารักษาเรียบร้อยแล้ว ขอบคุณทุกคนที่ช่วยเหลือ 🙏',
    clinic: 'คลินิกนกและสัตว์เลี้ยงพิเศษ',
    amount: 9800,
    mode: 'normal',
    status: 'paid',
  },
]

let okCount = 0
const baseStamp = Date.now()

for (let i = 0; i < CASES.length; i++) {
  const c = CASES[i]
  const stamp = baseStamp + i
  const email = `demo-c${stamp}@punruksa.demo`

  try {
    // 1) auth user
    const { data: authData, error: authErr } = await admin.auth.admin.createUser({
      email,
      password: `Demo!${stamp}`,
      email_confirm: true,
      user_metadata: { full_name: c.caretaker },
    })
    if (authErr) throw new Error(`auth: ${authErr.message}`)
    const userId = authData.user.id

    // 2) public.users profile
    const { error: profErr } = await admin.from('users').insert({
      id: userId,
      full_name: c.caretaker,
      email,
      phone: c.phone,
      role: 'caretaker',
      is_verified: true,
    })
    if (profErr) throw new Error(`users: ${profErr.message}`)

    // 3) case
    const { data: newCase, error: caseErr } = await admin
      .from('cases')
      .insert({
        title: '[DEMO] ' + c.title,
        animal_type: c.animal_type,
        symptoms: '*** เคสตัวอย่างสำหรับทดสอบระบบ ***\n\n' + c.symptoms + '\n\nที่อยู่: ' + c.province,
        clinic_name: c.clinic,
        requested_amount: c.amount,
        mode: c.mode,
        status: c.status,
        created_by: userId,
      })
      .select('id')
      .single()
    if (caseErr) throw new Error(`case: ${caseErr.message}`)

    // 4) upload photo
    const buf = fs.readFileSync(`${PHOTOS_DIR}/${c.photo}`)
    const objName = `${newCase.id}/${stamp}-${c.photo}`
    const { error: upErr } = await admin.storage
      .from('case-files')
      .upload(objName, buf, { contentType: 'image/jpeg' })
    if (upErr) throw new Error(`upload: ${upErr.message}`)
    const { data: { publicUrl } } = admin.storage.from('case-files').getPublicUrl(objName)

    // 5) case_documents
    const { error: docErr } = await admin.from('case_documents').insert({
      case_id: newCase.id,
      doc_type: 'photo',
      file_url: publicUrl,
    })
    if (docErr) throw new Error(`doc: ${docErr.message}`)

    okCount++
    console.log(`✅ [${i + 1}/10] ${c.status.padEnd(10)} ${c.title.slice(0, 40)}...`)
  } catch (e) {
    console.error(`❌ [${i + 1}/10] ${c.title.slice(0, 40)}... — ${e.message}`)
  }
}

console.log(`\n=== Summary: ${okCount}/${CASES.length} cases created ===`)
