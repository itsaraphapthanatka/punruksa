import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getAllSponsors } from '@/lib/sponsors-data'
import { SponsorsAdmin } from './SponsorsAdmin'

export default async function AdminSponsorsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const sponsors = await getAllSponsors()

  return (
    <>
      <div className="dashboard-header">
        <h1>🤝 ผู้ร่วมสนับสนุน</h1>
        <p>จัดการรายชื่อองค์กร/คลินิก/ร้านค้าที่ร่วมสนับสนุน — แสดงบนหน้าแรก ({sponsors.length} รายการ)</p>
      </div>

      <SponsorsAdmin sponsors={sponsors} />
    </>
  )
}
