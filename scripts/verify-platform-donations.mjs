// Smoke test: ยืนยันว่า schema platform_donations ตรงกับโค้ด insert จริง
import { createClient } from '@supabase/supabase-js'
import fs from 'node:fs'
const env = fs.readFileSync('.env.local', 'utf8')
for (const line of env.split('\n')) {
  const m = line.match(/^([A-Z_]+)=(.*)$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2]
}
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const chargeId = 'chg_smoketest_' + Date.now()
console.log('--- INSERT (รูปแบบเดียวกับ createPlatformDonation) ---')
const ins = await admin.from('platform_donations').insert({
  charge_id: chargeId,
  reference: 'plat_smoketest',
  amount: 100,
  status: 'pending',
  donor_name: 'ทดสอบระบบ',
  message: 'smoke test',
}).select().single()
if (ins.error) { console.error('❌ insert:', ins.error.message); process.exit(1) }
console.log('✅ insert OK — id:', ins.data.id)

console.log('--- UPDATE → completed (รูปแบบเดียวกับ checkPlatformDonationStatus) ---')
const upd = await admin.from('platform_donations')
  .update({ status: 'completed', paid_at: new Date().toISOString() })
  .eq('charge_id', chargeId).eq('status', 'pending')
if (upd.error) { console.error('❌ update:', upd.error.message); process.exit(1) }
console.log('✅ update OK')

console.log('--- CLEANUP (ลบ row ทดสอบ) ---')
const del = await admin.from('platform_donations').delete().eq('charge_id', chargeId)
if (del.error) { console.error('⚠️ ลบไม่สำเร็จ (ลบเองได้):', del.error.message); process.exit(1) }
console.log('✅ ลบ row ทดสอบแล้ว — schema ตรงกับโค้ดทุกฟิลด์ พร้อมใช้งานจริง 🎉')
