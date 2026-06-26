import { createClient } from '@/lib/supabase/server'

export interface NavUser {
  name: string
  role: string
  totalDonated: number
  casesVoted: number
}

// ข้อมูลผู้ใช้สำหรับ dropdown บน navbar (ชื่อ, ยอดบริจาครวม, จำนวนเคสที่เคยโหวต)
// คืน null ถ้ายังไม่ login หรืออ่านพลาด (navbar จะโชว์ปุ่ม "เข้าสู่ระบบ" แทน)
export async function getNavUser(): Promise<NavUser | null> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return null

    const { data: profile } = await supabase
      .from('users')
      .select('full_name, role')
      .eq('id', user.id)
      .single()
    if (!profile) return null

    // ยอดบริจาครวม (เฉพาะที่จ่ายสำเร็จ) — ใช้ amount_paid ถ้ามี ไม่งั้น amount
    const { data: dons } = await supabase
      .from('donations')
      .select('amount, amount_paid')
      .eq('donor_id', user.id)
      .eq('status', 'completed')
    const totalDonated = (dons ?? []).reduce(
      (s, r) => s + Number((r as { amount_paid: number | null; amount: number }).amount_paid ?? r.amount ?? 0),
      0
    )

    // จำนวนเคสที่เคยเป็นกรรมการ (โหวต) — นับเคสไม่ซ้ำผ่าน vote_rounds.case_id
    const { data: votes } = await supabase
      .from('votes')
      .select('vote_rounds(case_id)')
      .eq('voter_id', user.id)
    const caseIds = new Set<string>()
    for (const v of votes ?? []) {
      const vr = (v as { vote_rounds: { case_id: string } | { case_id: string }[] | null }).vote_rounds
      const cid = Array.isArray(vr) ? vr[0]?.case_id : vr?.case_id
      if (cid) caseIds.add(cid)
    }

    return {
      name: profile.full_name || 'ผู้ใช้',
      role: profile.role || 'donor',
      totalDonated,
      casesVoted: caseIds.size,
    }
  } catch {
    return null
  }
}
