'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// ---------- แก้ไขโปรไฟล์ ----------
export async function updateProfile(prevState: unknown, formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'กรุณาเข้าสู่ระบบ' }

  const fullName = String(formData.get('full_name') || '').trim()
  const phone = String(formData.get('phone') || '').trim()
  if (!fullName) return { error: 'กรุณากรอกชื่อ-นามสกุล' }

  const { error } = await supabase.from('users').update({ full_name: fullName, phone: phone || null }).eq('id', user.id)
  if (error) return { error: 'บันทึกไม่สำเร็จ: ' + error.message }

  revalidatePath('/dashboard/profile')
  revalidatePath('/dashboard', 'layout')
  return { success: true, msg: 'บันทึกโปรไฟล์แล้ว' }
}

// ---------- เปลี่ยนรหัสผ่าน (ผู้ใช้เปลี่ยนของตัวเอง) ----------
export async function changePassword(prevState: unknown, formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'กรุณาเข้าสู่ระบบ' }

  const pw = String(formData.get('password') || '')
  const pw2 = String(formData.get('password2') || '')
  if (pw.length < 6) return { error: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' }
  if (pw !== pw2) return { error: 'รหัสผ่านยืนยันไม่ตรงกัน' }

  const { error } = await supabase.auth.updateUser({ password: pw })
  if (error) return { error: 'เปลี่ยนรหัสผ่านไม่สำเร็จ: ' + error.message }
  return { success: true, msg: 'เปลี่ยนรหัสผ่านเรียบร้อย' }
}

// ---------- ยกเลิกการเชื่อมต่อ LINE ----------
export async function disconnectLine() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'กรุณาเข้าสู่ระบบ' }

  const { error } = await supabase.from('users').update({ line_user_id: null }).eq('id', user.id)
  if (error) return { error: 'ยกเลิกการเชื่อมต่อไม่สำเร็จ: ' + error.message }

  await supabase.from('audit_log').insert({ actor_id: user.id, action: 'line_disconnected', details: {} })
  revalidatePath('/dashboard/profile')
  return { success: true, msg: 'ยกเลิกการเชื่อมต่อ LINE แล้ว' }
}

// ---------- ขอเป็นกรรมการ (approver) ----------
export async function requestApproverRole() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'กรุณาเข้าสู่ระบบ' }

  const { data: existing } = await supabase
    .from('role_requests')
    .select('id')
    .eq('user_id', user.id)
    .eq('status', 'pending')
    .maybeSingle()
  if (existing) return { error: 'คุณมีคำขอที่รออนุมัติอยู่แล้ว' }

  const { error } = await supabase.from('role_requests').insert({ user_id: user.id, requested_role: 'approver', status: 'pending' })
  if (error) return { error: 'ส่งคำขอไม่สำเร็จ: ' + error.message }

  await supabase.from('audit_log').insert({ actor_id: user.id, action: 'approver_requested', details: {} })
  revalidatePath('/dashboard/profile')
  return { success: true, msg: 'ส่งคำขอแล้ว รอแอดมินอนุมัติ' }
}
