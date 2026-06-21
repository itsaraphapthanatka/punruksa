import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardShell } from './components/DashboardShell'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch user profile from users table
  const { data: profile } = await supabase
    .from('users')
    .select('full_name, role, email')
    .eq('id', user.id)
    .single()

  const userProfile = {
    id: user.id,
    fullName: profile?.full_name || user.user_metadata?.full_name || 'ผู้ใช้',
    email: profile?.email || user.email || '',
    role: profile?.role || 'donor',
  }

  return <DashboardShell user={userProfile}>{children}</DashboardShell>
}
