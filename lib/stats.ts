import { createClient } from '@/lib/supabase/server'

export interface ImpactStats {
  totalDonated: number
  donationCount: number
  donorCount: number
  totalCases: number
  helpedCases: number
}

// รูปปกของแต่ละเคส (รูปแรกที่ doc_type='photo')
export async function getCaseCovers(ids: string[]): Promise<Record<string, string>> {
  if (!ids.length) return {}
  const supabase = await createClient()
  const { data } = await supabase
    .from('case_documents')
    .select('case_id, file_url, doc_type')
    .in('case_id', ids)
    .eq('doc_type', 'photo')
  const map: Record<string, string> = {}
  for (const d of (data ?? []) as { case_id: string; file_url: string }[]) {
    if (!map[d.case_id]) map[d.case_id] = d.file_url
  }
  return map
}

export interface Supporter {
  id: string
  amount: number
  message: string | null
  created_at: string
  donor_nickname: string | null
}

// ผู้ร่วมบริจาคล่าสุด — donations อ่านสาธารณะได้ (migration 004)
// หมายเหตุ: ชื่อผู้บริจาค (users.full_name) อ่านสาธารณะไม่ได้ตาม RLS → แสดงแบบไม่ระบุชื่อ (PDPA-friendly)
export async function getRecentSupporters(limit = 8): Promise<Supporter[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('donations')
    .select('id, amount, message, created_at, donor_nickname')
    .eq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(limit)
  return (data ?? []) as Supporter[]
}

// อ่านได้แม้ไม่ได้ login (RLS public ใน migration 004)
export async function getImpactStats(): Promise<ImpactStats> {
  const supabase = await createClient()
  const [{ data: donations }, { data: cases }] = await Promise.all([
    supabase.from('donations').select('donor_id, amount, amount_paid, status').eq('status', 'completed'),
    supabase.from('cases').select('status'),
  ])
  const d = (donations ?? []) as { donor_id: string | null; amount: number; amount_paid: number | null }[]
  const c = (cases ?? []) as { status: string }[]
  const namedDonors = new Set(d.map((x) => x.donor_id).filter(Boolean)).size
  const guestDonations = d.filter((x) => !x.donor_id).length
  return {
    totalDonated: d.reduce((s, x) => s + Number(x.amount_paid ?? x.amount ?? 0), 0),
    donationCount: d.length,
    donorCount: namedDonors + guestDonations,
    totalCases: c.length,
    helpedCases: c.filter((x) => ['approved', 'paid', 'closed'].includes(x.status)).length,
  }
}
