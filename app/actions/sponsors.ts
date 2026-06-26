'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

const BUCKET = 'sponsors'

// ---------- ตรวจสิทธิ์ admin ----------
async function requireAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') throw new Error('Forbidden: admin only')
  return user
}

// อัปโหลดโลโก้ผ่าน service-role → คืน public URL (หรือ null ถ้าไม่มีไฟล์)
async function uploadLogo(file: File | null): Promise<{ url?: string; error?: string }> {
  if (!file || file.size === 0) return {}
  if (file.size > 5 * 1024 * 1024) return { error: 'ไฟล์ใหญ่เกิน 5MB' }
  const admin = createAdminClient()
  const ext = (file.name.split('.').pop() || 'png').toLowerCase()
  const path = `logos/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const { error } = await admin.storage.from(BUCKET).upload(path, file, { contentType: file.type })
  if (error) return { error: 'อัปโหลดโลโก้ไม่สำเร็จ: ' + error.message }
  return { url: admin.storage.from(BUCKET).getPublicUrl(path).data.publicUrl }
}

function readForm(formData: FormData) {
  return {
    name: String(formData.get('name') || '').trim(),
    url: String(formData.get('url') || '').trim() || null,
    category: String(formData.get('category') || '').trim() || null,
    sort_order: Number(formData.get('sort_order') || 0) || 0,
    is_active: formData.get('is_active') === 'on' || formData.get('is_active') === 'true',
    file: (formData.get('logo') as File) || null,
  }
}

// ---------- เพิ่มผู้สนับสนุน ----------
export async function createSponsor(prevState: unknown, formData: FormData) {
  await requireAdmin()
  const f = readForm(formData)
  if (!f.name) return { error: 'กรุณากรอกชื่อผู้สนับสนุน' }

  const up = await uploadLogo(f.file)
  if (up.error) return { error: up.error }

  const admin = createAdminClient()
  const { error } = await admin.from('sponsors').insert({
    name: f.name,
    url: f.url,
    category: f.category,
    sort_order: f.sort_order,
    is_active: f.is_active,
    logo_url: up.url || null,
  })
  if (error) return { error: 'บันทึกไม่สำเร็จ: ' + error.message }

  revalidatePath('/dashboard/admin/sponsors')
  revalidatePath('/')
  return { success: true }
}

// ---------- แก้ไขผู้สนับสนุน ----------
export async function updateSponsor(prevState: unknown, formData: FormData) {
  await requireAdmin()
  const id = String(formData.get('id') || '')
  if (!id) return { error: 'ไม่พบรายการ' }
  const f = readForm(formData)
  if (!f.name) return { error: 'กรุณากรอกชื่อผู้สนับสนุน' }

  const patch: Record<string, unknown> = {
    name: f.name,
    url: f.url,
    category: f.category,
    sort_order: f.sort_order,
    is_active: f.is_active,
  }

  const up = await uploadLogo(f.file)
  if (up.error) return { error: up.error }
  if (up.url) patch.logo_url = up.url // เปลี่ยนโลโก้เฉพาะเมื่ออัปโหลดใหม่

  const admin = createAdminClient()
  const { error } = await admin.from('sponsors').update(patch).eq('id', id)
  if (error) return { error: 'บันทึกไม่สำเร็จ: ' + error.message }

  revalidatePath('/dashboard/admin/sponsors')
  revalidatePath('/')
  return { success: true }
}

// ---------- เปิด/ปิดแสดง (toggle เร็ว) ----------
export async function toggleSponsorActive(id: string, isActive: boolean) {
  await requireAdmin()
  const admin = createAdminClient()
  const { error } = await admin.from('sponsors').update({ is_active: isActive }).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/dashboard/admin/sponsors')
  revalidatePath('/')
  return { success: true }
}

// ---------- ลบผู้สนับสนุน ----------
export async function deleteSponsor(id: string) {
  await requireAdmin()
  const admin = createAdminClient()
  const { error } = await admin.from('sponsors').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/dashboard/admin/sponsors')
  revalidatePath('/')
  return { success: true }
}
