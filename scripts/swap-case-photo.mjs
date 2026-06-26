// Swap a case's photo(s) to a new image
// Usage: node scripts/swap-case-photo.mjs <case_id> <local_photo_path>
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

const [caseId, photoPath] = process.argv.slice(2)
if (!caseId || !photoPath) {
  console.error('Usage: node scripts/swap-case-photo.mjs <case_id> <local_photo_path>')
  process.exit(1)
}

// 1) Confirm the case exists
const { data: c, error: cErr } = await admin
  .from('cases')
  .select('id, title, animal_type, status')
  .eq('id', caseId)
  .single()
if (cErr || !c) {
  console.error('Case not found:', cErr?.message || 'no rows')
  process.exit(1)
}
console.log(`Case: ${c.title}`)
console.log(`  type=${c.animal_type} status=${c.status}`)

// 2) Get current photos
const { data: docs } = await admin
  .from('case_documents')
  .select('id, file_url, doc_type')
  .eq('case_id', caseId)
  .eq('doc_type', 'photo')
console.log(`Existing photos: ${docs?.length ?? 0}`)
for (const d of docs || []) console.log(`  - ${d.file_url}`)

// 3) Upload new photo
const buf = fs.readFileSync(photoPath)
const stamp = Date.now()
const baseName = photoPath.split('/').pop()
const objName = `${caseId}/${stamp}-${baseName}`
console.log(`\nUploading ${photoPath} -> case-files/${objName} ...`)
const { error: upErr } = await admin.storage
  .from('case-files')
  .upload(objName, buf, { contentType: 'image/jpeg' })
if (upErr) {
  console.error('Upload failed:', upErr.message)
  process.exit(1)
}
const { data: { publicUrl } } = admin.storage.from('case-files').getPublicUrl(objName)
console.log('  publicUrl:', publicUrl)

// 4) Delete old photo storage objects (best-effort) + rows
for (const d of docs || []) {
  // Extract path after /case-files/
  const m = d.file_url.match(/\/case-files\/(.+)$/)
  if (m) {
    const objPath = decodeURIComponent(m[1])
    const { error: rmErr } = await admin.storage.from('case-files').remove([objPath])
    if (rmErr) console.warn(`  storage remove warning for ${objPath}: ${rmErr.message}`)
    else console.log(`  removed storage object: ${objPath}`)
  }
}
const { error: delErr } = await admin
  .from('case_documents')
  .delete()
  .eq('case_id', caseId)
  .eq('doc_type', 'photo')
if (delErr) {
  console.error('Failed to delete old doc rows:', delErr.message)
  process.exit(1)
}

// 5) Insert new doc row
const { error: docErr } = await admin.from('case_documents').insert({
  case_id: caseId,
  doc_type: 'photo',
  file_url: publicUrl,
})
if (docErr) {
  console.error('Insert doc failed:', docErr.message)
  process.exit(1)
}

console.log('\n✅ Photo swapped successfully.')
