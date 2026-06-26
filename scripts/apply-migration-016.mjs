// ตรวจ/แนะนำการ apply migration 016 (comment image_url)
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

const { error } = await admin.from('comments').select('image_url').limit(1)
if (!error) {
  console.log('✅ คอลัมน์ comments.image_url พร้อมใช้งานแล้ว')
  process.exit(0)
}
const sql = fs.readFileSync('supabase/migrations/016_comment_images.sql', 'utf8')
console.log('❌ ยังไม่มีคอลัมน์ comments.image_url')
console.log('  1. เปิด https://supabase.com/dashboard/project/rzvtitepozlvyoqagxfh/sql/new')
console.log('  2. วาง SQL ด้านล่าง แล้วกด Run:')
console.log('─'.repeat(70))
console.log(sql)
console.log('─'.repeat(70))
process.exit(1)
