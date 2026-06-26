import { createClient } from '@supabase/supabase-js'
import fs from 'node:fs'
const env = fs.readFileSync('.env.local', 'utf8')
for (const line of env.split('\n')) {
  const m = line.match(/^([A-Z_]+)=(.*)$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2]
}
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const BUCKET = 'sponsors'
const { data: existing } = await admin.storage.getBucket(BUCKET)
if (existing) {
  console.log(`✅ bucket "${BUCKET}" มีอยู่แล้ว — public=${existing.public}`)
} else {
  const { error } = await admin.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: 5 * 1024 * 1024, // 5MB max
    allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'],
  })
  if (error) {
    console.error('❌ สร้าง bucket ไม่สำเร็จ:', error.message)
    process.exit(1)
  }
  console.log(`✅ สร้าง bucket "${BUCKET}" (public) เรียบร้อย`)
}
