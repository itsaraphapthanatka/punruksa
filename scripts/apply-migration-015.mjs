// ตรวจ/แนะนำการ apply migration 015 (avatar_url + comments)
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

const c = await admin.from('comments').select('id').limit(1)
const a = await admin.from('users').select('avatar_url').limit(1)
const commentsOk = !c.error
const avatarOk = !a.error
if (commentsOk && avatarOk) {
  console.log('✅ ตาราง comments + คอลัมน์ users.avatar_url พร้อมใช้งานแล้ว')
  process.exit(0)
}
console.log(`สถานะ: comments=${commentsOk ? '✅' : '❌'} avatar_url=${avatarOk ? '✅' : '❌'}`)
const sql = fs.readFileSync('supabase/migrations/015_avatar_comments.sql', 'utf8')
console.log('  1. เปิด https://supabase.com/dashboard/project/rzvtitepozlvyoqagxfh/sql/new')
console.log('  2. วาง SQL ด้านล่าง แล้วกด Run:')
console.log('─'.repeat(70))
console.log(sql)
console.log('─'.repeat(70))
process.exit(1)
