import { createClient } from '@supabase/supabase-js'
import fs from 'node:fs'
const env = fs.readFileSync('.env.local', 'utf8')
for (const line of env.split('\n')) {
  const m = line.match(/^([A-Z_]+)=(.*)$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2]
}
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
const id = process.argv[2]
const { data: c } = await admin.from('cases').select('*').eq('id', id).single()
const { data: docs } = await admin.from('case_documents').select('*').eq('case_id', id)
console.log('Case:', JSON.stringify(c, null, 2))
console.log('Docs:', JSON.stringify(docs, null, 2))
