// ตรวจ/แนะนำการ apply migration 012 (line_user_id)
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

const { error } = await admin.from('users').select('line_user_id').limit(1)
if (!error) {
  console.log('✅ column users.line_user_id มีอยู่แล้ว — พร้อมใช้งาน')
  process.exit(0)
}

const missing = error.code === 'PGRST204' || error.code === '42703' || /column .* does not exist|line_user_id/i.test(error.message || '')
if (missing) {
  const sql = fs.readFileSync('supabase/migrations/012_line_user_id.sql', 'utf8')
  console.log('❌ ยังไม่มี column users.line_user_id')
  console.log('')
  console.log('⚠️  Supabase REST ไม่รองรับ DDL — apply ด้วยตนเอง:')
  console.log('  1. เปิด https://supabase.com/dashboard/project/rzvtitepozlvyoqagxfh/sql/new')
  console.log('  2. วาง SQL ด้านล่าง แล้วกด Run:')
  console.log('')
  console.log('─'.repeat(70))
  console.log(sql)
  console.log('─'.repeat(70))
  process.exit(1)
}

console.error('Unexpected error:', error)
process.exit(1)
