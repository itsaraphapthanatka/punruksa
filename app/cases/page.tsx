import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getCaseCovers } from '@/lib/stats'
import { getLocale } from '@/lib/i18n'
import { dict, statusTag, animalIcon, STEP_KEYS, caseStep } from '@/lib/dict'
import { NavMenu } from '../NavMenu'

interface CaseRow {
  id: string; title: string; animal_type: string; clinic_name: string | null
  requested_amount: number; mode: string; status: string; created_at: string
}

const FILTERS: { key: string; th: string; en: string }[] = [
  { key: '', th: 'ทั้งหมด', en: 'All' },
  { key: 'open', th: 'กำลังเปิด', en: 'Open' },
  { key: 'voting', th: 'กำลังโหวต', en: 'Voting' },
  { key: 'helped', th: 'ช่วยสำเร็จ', en: 'Helped' },
]
const GROUPS: Record<string, string[]> = {
  open: ['received', 'verifying', 'voting', 'approved'],
  voting: ['voting'],
  helped: ['approved', 'paid', 'closed'],
}

export default async function PublicCasesPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status: filter = '' } = await searchParams
  const L = await getLocale()
  const d = dict[L]
  const supabase = await createClient()

  let query = supabase
    .from('cases')
    .select('id, title, animal_type, clinic_name, requested_amount, mode, status, created_at')
    .neq('status', 'rejected')
    .order('created_at', { ascending: false })
    .limit(60)
  if (GROUPS[filter]) query = query.in('status', GROUPS[filter])
  const { data } = await query
  const cases = (data ?? []) as CaseRow[]
  const covers = await getCaseCovers(cases.map((c) => c.id))

  return (
    <div style={{ background: '#fff', color: '#26282e', minHeight: '100vh' }}>
      <style>{`
        .pcwrap{max-width:1100px;margin:0 auto;padding:0 22px}
        .pcgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:20px}
        .pccard{display:block;background:#fff;border:1px solid #ededf1;border-radius:16px;overflow:hidden;color:inherit;box-shadow:0 3px 14px rgba(30,30,50,.05);transition:transform .2s,box-shadow .2s}
        .pccard:hover{transform:translateY(-5px);box-shadow:0 16px 34px rgba(30,30,50,.12)}
        .pcchip{padding:8px 16px;border-radius:999px;font-weight:700;font-size:14px;border:1px solid #ededf1;color:#41454d}
        .pcchip.on{background:#667eea;color:#fff;border-color:#667eea}
      `}</style>

      <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(255,255,255,.92)', backdropFilter: 'blur(8px)', borderBottom: '1px solid #ededf1' }}>
        <div className="pcwrap" style={{ display: 'flex', alignItems: 'center', gap: 14, height: 64 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#26282e' }}>
            <span style={{ width: 34, height: 34, borderRadius: 10, background: '#fff', overflow: 'hidden', display: 'flex' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.jpg" alt="ปันรักษา" width={34} height={34} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </span>
            <span style={{ fontWeight: 800, fontSize: 17 }}>{d.brand}</span>
          </Link>
          <NavMenu
            items={[
              { href: '/', label: d.nav.home },
              { href: '/cases', label: d.nav.cases },
              { href: '/#how', label: d.nav.how },
              { href: '/login', label: d.nav.login },
            ]}
            donateLabel={d.nav.donate}
            locale={L}
          />
        </div>
      </nav>

      <div className="pcwrap" style={{ padding: '30px 22px 70px' }}>
        <Link href="/" style={{ color: '#838aa3', fontSize: 14, fontWeight: 600 }}>{L === 'en' ? '← Home' : '← หน้าแรก'}</Link>
        <h1 style={{ margin: '10px 0 4px', fontSize: 'clamp(26px,3.6vw,34px)', fontWeight: 800, letterSpacing: '-.6px' }}>{L === 'en' ? 'All cases' : 'เคสทั้งหมด'}</h1>
        <p style={{ margin: '0 0 20px', color: '#6b7280', fontSize: 15 }}>{d.open.sub}</p>

        <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap', marginBottom: 24 }}>
          {FILTERS.map((f) => (
            <Link key={f.key} href={f.key ? `/cases?status=${f.key}` : '/cases'} className={`pcchip${filter === f.key ? ' on' : ''}`}>
              {L === 'en' ? f.en : f.th}
            </Link>
          ))}
        </div>

        {cases.length === 0 ? (
          <div style={{ border: '1px dashed #ededf1', borderRadius: 16, padding: 52, textAlign: 'center', color: '#6b7280' }}>{d.open.empty}</div>
        ) : (
          <div className="pcgrid">
            {cases.map((c) => {
              const tag = statusTag(L, c.status)
              const step = caseStep(c.status)
              return (
                <Link key={c.id} href={`/cases/${c.id}`} className="pccard">
                  <div style={{ position: 'relative', height: 168, background: '#f1f2f5', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {covers[c.id] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={covers[c.id]} alt={c.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (<span style={{ fontSize: 58 }}>{animalIcon(c.animal_type)}</span>)}
                    <span style={{ position: 'absolute', top: 12, left: 12, background: tag.bg, color: tag.fg, fontSize: 12, fontWeight: 700, padding: '5px 11px', borderRadius: 999 }}>{tag.label}</span>
                    {c.mode === 'emergency' && <span style={{ position: 'absolute', top: 12, right: 12, background: '#667eea', color: '#fff', fontSize: 12, fontWeight: 700, padding: '5px 10px', borderRadius: 999 }}>{d.emergency}</span>}
                  </div>
                  <div style={{ padding: 18 }}>
                    <div style={{ fontWeight: 700, fontSize: 16, lineHeight: 1.35, minHeight: 44, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{c.title}</div>
                    <div style={{ fontSize: 13, color: '#6b7280', margin: '5px 0 14px' }}>{animalIcon(c.animal_type)} {c.animal_type} · {c.clinic_name || d.casePage.noClinic}</div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 11.5, fontWeight: 700, color: '#6b7280', letterSpacing: '.4px', textTransform: 'uppercase' }}>{d.casePage.reviewStatus}</span>
                      {step >= 0 && <span style={{ fontSize: 12, fontWeight: 700, color: '#6b7280' }}>{L === 'en' ? `Step ${step + 1}/${STEP_KEYS.length}` : `ขั้นที่ ${step + 1}/${STEP_KEYS.length}`}</span>}
                    </div>
                    <div style={{ display: 'flex', gap: 5 }}>
                      {STEP_KEYS.map((_, i) => (
                        <div key={i} style={{ flex: 1, height: 6, borderRadius: 999, background: step >= 0 && i <= step ? '#667eea' : (c.status === 'rejected' ? '#fdeaea' : '#f0f1f4') }} />
                      ))}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 14, paddingTop: 14, borderTop: '1px solid #ededf1' }}>
                      <div>
                        <div style={{ fontSize: 11.5, color: '#6b7280' }}>{d.casePage.requested}</div>
                        <div><span style={{ fontSize: 16, fontWeight: 800 }}>{Number(c.requested_amount).toLocaleString()}</span><span style={{ fontSize: 12, color: '#6b7280' }}> {d.casePage.baht}</span></div>
                      </div>
                      <span style={{ fontSize: 13.5, fontWeight: 700, color: '#667eea' }}>{L === 'en' ? 'Details →' : 'ดูรายละเอียด →'}</span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
