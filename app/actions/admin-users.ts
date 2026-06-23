'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { USER_ROLES } from '@/lib/roles'
import { revalidatePath } from 'next/cache'

// ตรวจว่าเป็นแอดมิน
async function requireAdmin(): Promise<{ userId: string } | { error: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }
  const { data: p } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (p?.role !== 'admin') return { error: 'Forbidden: admin only' }
  return { userId: user.id }
}

// เปลี่ยน role ของสมาชิก (admin) — ผ่าน service-role เพราะ users_update_own ให้แก้เฉพาะตัวเอง
export async function setUserRole(userId: string, role: string): Promise<{ success?: boolean; error?: string }> {
  if (!USER_ROLES.includes(role as (typeof USER_ROLES)[number])) return { error: 'role ไม่ถูกต้อง' }
  const auth = await requireAdmin()
  if ('error' in auth) return auth
  const admin = createAdminClient()
  const { error } = await admin.from('users').update({ role }).eq('id', userId)
  if (error) return { error: error.message }
  await admin.from('audit_log').insert({ actor_id: auth.userId, action: 'user_role_changed', details: { target: userId, role } })
  revalidatePath('/dashboard/admin/users')
  return { success: true }
}

// อนุมัติคำขอเป็นกรรมการ (admin) → ตั้ง role + ยืนยันตัวตน
export async function approveRoleRequest(requestId: string): Promise<{ success?: boolean; error?: string }> {
  const auth = await requireAdmin()
  if ('error' in auth) return auth
  const admin = createAdminClient()
  const { data: req } = await admin.from('role_requests').select('id, user_id, requested_role, status').eq('id', requestId).maybeSingle()
  if (!req || req.status !== 'pending') return { error: 'คำขอนี้จัดการไปแล้ว' }
  await admin.from('users').update({ role: req.requested_role, is_verified: true }).eq('id', req.user_id)
  await admin.from('role_requests').update({ status: 'approved' }).eq('id', requestId)
  await admin.from('audit_log').insert({ actor_id: auth.userId, action: 'approver_request_approved', details: { request: requestId, user: req.user_id, role: req.requested_role } })
  revalidatePath('/dashboard/admin/users')
  return { success: true }
}

// ปฏิเสธคำขอ (admin)
export async function rejectRoleRequest(requestId: string): Promise<{ success?: boolean; error?: string }> {
  const auth = await requireAdmin()
  if ('error' in auth) return auth
  const admin = createAdminClient()
  await admin.from('role_requests').update({ status: 'rejected' }).eq('id', requestId).eq('status', 'pending')
  await admin.from('audit_log').insert({ actor_id: auth.userId, action: 'approver_request_rejected', details: { request: requestId } })
  revalidatePath('/dashboard/admin/users')
  return { success: true }
}

// ยืนยัน/ยกเลิกการยืนยันตัวตน (admin)
export async function setUserVerified(userId: string, verified: boolean): Promise<{ success?: boolean; error?: string }> {
  const auth = await requireAdmin()
  if ('error' in auth) return auth
  const admin = createAdminClient()
  const { error } = await admin.from('users').update({ is_verified: verified }).eq('id', userId)
  if (error) return { error: error.message }
  await admin.from('audit_log').insert({ actor_id: auth.userId, action: 'user_verified_changed', details: { target: userId, verified } })
  revalidatePath('/dashboard/admin/users')
  return { success: true }
}
