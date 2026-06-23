'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

// ---------- Audit Log Helper ----------
async function writeAuditLog(
  supabase: Awaited<ReturnType<typeof createClient>>,
  action: string,
  details: Record<string, unknown> = {},
  actorId?: string,
  caseId?: string
) {
  await supabase.from('audit_log').insert({
    actor_id: actorId || null,
    case_id: caseId || null,
    action,
    details,
  })
}

// ---------- Register ----------
export async function register(prevState: unknown, formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = formData.get('full_name') as string
  const phone = formData.get('phone') as string

  if (!email || !password || !fullName) {
    return { error: 'กรุณากรอกข้อมูลให้ครบถ้วน' }
  }

  if (password.length < 6) {
    return { error: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' }
  }

  // Sign up with Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        phone: phone || '',
      },
    },
  })

  if (authError) {
    return { error: authError.message }
  }

  if (authData.user) {
    // Insert profile via service-role — ตอน signUp ยังไม่มี session (โดยเฉพาะถ้าเปิด email confirm)
    // ทำให้ insert ด้วย session ของผู้ใช้โดน RLS บล็อก → ผู้สมัครไม่ได้แถว profile
    const admin = createAdminClient()
    const { error: profileError } = await admin.from('users').upsert(
      {
        id: authData.user.id,
        email,
        full_name: fullName,
        phone: phone || null,
        role: 'donor',
        is_verified: false,
        reputation_points: 0,
      },
      { onConflict: 'id' }
    )

    if (profileError) {
      console.error('Profile creation error:', profileError)
    }

    // Write audit log
    await writeAuditLog(supabase, 'user_registered', {
      email,
      full_name: fullName,
      role: 'donor',
    }, authData.user.id)
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

// ---------- Login ----------
export async function login(prevState: unknown, formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'กรุณากรอกอีเมลและรหัสผ่าน' }
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' }
  }

  if (data.user) {
    await writeAuditLog(supabase, 'user_login', {
      email,
    }, data.user.id)
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

// ---------- Combined entry (split-screen AuthForm) ----------
// อ่าน field "mode" จากฟอร์มแล้วแตกไป register/login (ใช้กับ useActionState ตัวเดียว)
export async function authenticate(prevState: unknown, formData: FormData) {
  const mode = formData.get('mode')
  if (mode === 'signup') {
    return register(prevState, formData)
  }
  return login(prevState, formData)
}

// ---------- Logout ----------
export async function logout() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    await writeAuditLog(supabase, 'user_logout', {}, user.id)
  }

  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}
