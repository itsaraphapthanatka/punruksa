import { createClient } from '@supabase/supabase-js'
import fs from 'node:fs'
const env = fs.readFileSync('.env.local', 'utf8')
for (const line of env.split('\n')) {
  const m = line.match(/^([A-Z_]+)=(.*)$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2]
}
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

console.log('--- SELECT ---')
const sel = await admin.from('site_visits').select('*').limit(1)
console.log('error:', sel.error)
console.log('data:', sel.data)

console.log('\n--- INSERT (test) ---')
const ins = await admin.from('site_visits').insert({ path: '/_test', ip_prefix: '0.0.0.0/24' }).select()
console.log('error:', ins.error)
console.log('data:', ins.data)

if (ins.data?.[0]?.id) {
  await admin.from('site_visits').delete().eq('id', ins.data[0].id)
  console.log('cleaned up test row')
}
