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

// อ่านได้แม้ไม่ได้ login (RLS public ใน migration 004)
export async function getImpactStats(): Promise<ImpactStats> {
  const supabase = await createClient()
  const [{ data: donations }, { data: cases }] = await Promise.all([
    supabase.from('donations').select('donor_id, amount'),
    supabase.from('cases').select('status'),
  ])
  const d = (donations ?? []) as { donor_id: string | null; amount: number }[]
  const c = (cases ?? []) as { status: string }[]
  return {
    totalDonated: d.reduce((s, x) => s + Number(x.amount || 0), 0),
    donationCount: d.length,
    donorCount: new Set(d.map((x) => x.donor_id).filter(Boolean)).size,
    totalCases: c.length,
    helpedCases: c.filter((x) => ['approved', 'paid', 'closed'].includes(x.status)).length,
  }
}
