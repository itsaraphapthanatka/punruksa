// Attempt to apply 011_site_visits.sql via Supabase admin client.
// Note: Supabase REST has no DDL endpoint by default. This script tries:
//   1. ตรวจว่าตาราง site_visits มีอยู่หรือยัง (HEAD select)
//   2. ถ้าไม่มี → แจ้งให้ apply เอง via Supabase Studio SQL Editor
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

// ลอง select เพื่อตรวจสอบว่าตารางมีอยู่ไหม (Supabase return PGRST205 ถ้าไม่มี)
const { error } = await admin.from('site_visits').select('id').limit(1)
if (!error) {
  console.log('✅ ตาราง site_visits มีอยู่แล้ว — ไม่ต้องทำอะไรเพิ่ม')
  process.exit(0)
}

const notFound = error.code === 'PGRST205' || /Could not find the table|relation .* does not exist/i.test(error.message || '')
if (notFound) {
  const sql = fs.readFileSync('supabase/migrations/011_site_visits.sql', 'utf8')
  console.log('❌ ตาราง site_visits ยังไม่ถูกสร้าง')
  console.log('')
  console.log('⚠️  Supabase REST ไม่รองรับ DDL — ต้อง apply ด้วยตนเอง')
  console.log('')
  console.log('วิธี:')
  console.log('  1. เปิด https://supabase.com/dashboard/project/rzvtitepozlvyoqagxfh/sql/new')
  console.log('  2. วาง SQL ด้านล่างนี้แล้วกด Run:')
  console.log('')
  console.log('─'.repeat(70))
  console.log(sql)
  console.log('─'.repeat(70))
  process.exit(1)
}

console.error('Unexpected error:', error)
process.exit(1)
