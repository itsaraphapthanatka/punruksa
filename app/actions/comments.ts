'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

// ---------- โพสต์ความคิดเห็น (ต้องเป็นสมาชิก) ----------
export async function postComment(prevState: unknown, formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'กรุณาเข้าสู่ระบบก่อนแสดงความคิดเห็น' }

  const body = String(formData.get('body') || '').trim()
  if (body.length > 1000) return { error: 'ข้อความยาวเกินไป (สูงสุด 1000 ตัวอักษร)' }

  // แนบรูป (ไม่บังคับ) — อัปโหลดผ่าน service-role
  let imageUrl: string | null = null
  const file = formData.get('image')
  if (file instanceof File && file.size > 0) {
    if (file.size > 5 * 1024 * 1024) return { error: 'รูปใหญ่เกิน 5MB' }
    if (!/^image\/(png|jpeg|webp|gif)$/.test(file.type)) return { error: 'รองรับเฉพาะรูป PNG / JPG / WebP / GIF' }
    const admin = createAdminClient()
    const ext = (file.name.split('.').pop() || 'png').toLowerCase()
    const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { error: upErr } = await admin.storage.from('comments').upload(path, file, { contentType: file.type })
    if (upErr) return { error: 'อัปโหลดรูปไม่สำเร็จ: ' + upErr.message }
    imageUrl = admin.storage.from('comments').getPublicUrl(path).data.publicUrl
  }

  if (!body && !imageUrl) return { error: 'กรุณาพิมพ์ข้อความ หรือแนบรูป' }

  // ใส่ image_url เฉพาะเมื่อมีรูป (เผื่อ migration 016 ยังไม่ลง → ข้อความล้วนยังโพสต์ได้)
  const row: Record<string, unknown> = { user_id: user.id, body }
  if (imageUrl) row.image_url = imageUrl

  const { error } = await supabase.from('comments').insert(row)
  if (error) return { error: 'ส่งความคิดเห็นไม่สำเร็จ: ' + error.message }

  revalidatePath('/')
  return { success: true }
}

// ---------- ลบความคิดเห็น (เจ้าของลบของตัวเอง; RLS บังคับ) ----------
export async function deleteComment(id: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'กรุณาเข้าสู่ระบบ' }

  const { error } = await supabase.from('comments').delete().eq('id', id).eq('user_id', user.id)
  if (error) return { error: error.message }

  revalidatePath('/')
  return { success: true }
}
