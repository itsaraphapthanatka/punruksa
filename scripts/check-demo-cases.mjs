import { createClient } from '@supabase/supabase-js'
import fs from 'node:fs'
const env = fs.readFileSync('.env.local', 'utf8')
for (const line of env.split('\n')) {
  const m = line.match(/^([A-Z_]+)=(.*)$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2]
}
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
const { data } = await admin
  .from('cases')
  .select('status,title,mode,requested_amount')
  .like('title', '[DEMO]%')
  .order('created_at', { ascending: false })
const counts = {}
for (const r of data) counts[r.status] = (counts[r.status] || 0) + 1
console.log('=== Demo cases by status ===')
for (const [k, v] of Object.entries(counts).sort()) console.log(`  ${k.padEnd(10)} ${v}`)
console.log(`  TOTAL      ${data.length}\n`)
console.log('=== All demo cases ===')
for (const r of data) {
  console.log(`  [${r.status.padEnd(10)}] (${r.mode.padEnd(9)}) ${r.requested_amount.toLocaleString().padStart(8)}฿  ${r.title}`)
}
