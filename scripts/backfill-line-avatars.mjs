import { createClient } from '@supabase/supabase-js'
import fs from 'node:fs'
const env = fs.readFileSync('.env.local', 'utf8')
for (const line of env.split('\n')) {
  const m = line.match(/^([A-Z_]+)=(.*)$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2]
}
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

// auth users ที่มีรูปจาก LINE ใน metadata
const { data: au } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
const withPic = (au?.users || []).filter(u => u.user_metadata?.avatar)
console.log(`auth users with LINE avatar metadata: ${withPic.length}`)

let updated = 0
for (const u of withPic) {
  const pic = u.user_metadata.avatar
  // เซ็ตเฉพาะเมื่อ avatar_url ยังว่าง (ไม่ทับรูปที่อัปโหลดเอง)
  const { data, error } = await admin.from('users')
    .update({ avatar_url: pic }).eq('id', u.id).is('avatar_url', null).select('id')
  if (error) { console.log('  ❌', u.email, error.message); continue }
  if (data?.length) { updated++; console.log('  ✅', u.email) }
}
console.log(`backfilled: ${updated}`)
