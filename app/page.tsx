import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getImpactStats, getCaseCovers, getRecentSupporters } from '@/lib/stats'
import { SPONSORS, monogram } from '@/lib/sponsors'
import { getLocale } from '@/lib/i18n'
import { dict, statusTag, animalIcon, STEP_KEYS, caseStep } from '@/lib/dict'
import { LanguageSwitcher } from './LanguageSwitcher'

interface OpenCase {
  id: string; title: string; animal_type: string; clinic_name: string | null
  requested_amount: number; mode: string; status: string; created_at: string
}

const STEP_ICONS = ['📝', '🔎', '🎲', '🗳️', '💸']

function fmtDate(iso: string, l: string): string {
  try {
    return new Date(iso).toLocaleDateString(l === 'th' ? 'th-TH' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch {
    return ''
  }
}

export default async function LandingPage() {
  const L = await getLocale()
  const d = dict[L]
  const stats = await getImpactStats()
  const supabase = await createClient()
  const { data: openData } = await supabase
    .from('cases')
    .select('id, title, animal_type, clinic_name, requested_amount, mode, status, created_at')
    .in('status', ['received', 'voting', 'approved'])
    .order('created_at', { ascending: false })
    .limit(6)
  const openCases = (openData ?? []) as OpenCase[]
  const covers = await getCaseCovers(openCases.map((c) => c.id))
  const supporters = await getRecentSupporters(8)

  return (
    <div className="tj">
      <style>{`
        :root{ --coral:#667eea; --coral-d:#5a66d6; --coral-soft:#eef0fd; --ink:#26282e; --muted:#6b7280; --line:#ededf1; --soft:#f6f7f9; }
        .tj{background:#fff;color:var(--ink)}
        .wrap{max-width:1140px;margin:0 auto;padding:0 22px}
        @keyframes tjRise{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
        .rv{opacity:0;animation:tjRise .7s cubic-bezier(.2,.7,.2,1) forwards}
        .btnCoral{background:var(--coral);color:#fff;transition:background .15s,transform .15s,box-shadow .15s;box-shadow:0 6px 16px rgba(102,126,234,.32)}
        .btnCoral:hover{background:var(--coral-d);transform:translateY(-1px);box-shadow:0 10px 22px rgba(102,126,234,.4)}
        .btnLight{background:#fff;color:var(--ink);border:1.5px solid var(--line);transition:border-color .15s,color .15s}
        .btnLight:hover{border-color:var(--coral);color:var(--coral)}
        .btnGhost{background:rgba(255,255,255,.12);color:#fff;border:1.5px solid rgba(255,255,255,.55);backdrop-filter:blur(4px);transition:background .15s,border-color .15s,transform .15s}
        .btnGhost:hover{background:rgba(255,255,255,.22);border-color:#fff;transform:translateY(-1px)}
        .navlink{color:#41454d;font-weight:600;font-size:14.5px}
        .navlink:hover{color:var(--coral)}
        .tjcard{background:#fff;border:1px solid var(--line);border-radius:16px;overflow:hidden;box-shadow:0 3px 14px rgba(30,30,50,.05);transition:transform .2s,box-shadow .2s}
        .tjcard:hover{transform:translateY(-5px);box-shadow:0 16px 34px rgba(30,30,50,.12)}
        @media(max-width:760px){ .heroPhoto{min-height:auto!important;padding:66px 22px 72px!important} .heroMini{gap:22px!important} }
      `}</style>

      {/* NAVBAR */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(255,255,255,.92)', backdropFilter: 'blur(8px)', borderBottom: '1px solid var(--line)' }}>
        <div className="wrap" style={{ display: 'flex', alignItems: 'center', gap: 16, height: 66 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--ink)' }}>
            <span style={{ width: 36, height: 36, borderRadius: 11, background: 'var(--coral)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff"><circle cx="6.5" cy="9" r="2.1" /><circle cx="11" cy="6.2" r="2.1" /><circle cx="16" cy="6.2" r="2.1" /><circle cx="20" cy="9.6" r="1.9" /><path d="M13 12c-2.3 0-3.7 1.5-4.8 2.9C7 16.4 5.4 17.4 5.4 19.2 5.4 20.8 6.7 22 8.4 22c1.3 0 2.4-.6 3.4-.6.9 0 2 .6 3.4.6 1.7 0 3-1.2 3-2.8 0-1.8-1.6-2.8-2.8-4.3C14.5 13.5 13.1 12 13 12z" /></svg>
            </span>
            <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: '-.2px' }}>{d.brand}</span>
          </Link>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 20 }}>
            <Link href="#cases" className="navlink">{d.nav.cases}</Link>
            <Link href="#how" className="navlink">{d.nav.how}</Link>
            <Link href="/login" className="navlink">{d.nav.login}</Link>
            <LanguageSwitcher locale={L} />
            <Link href="/donate" className="btnCoral" style={{ padding: '9px 20px', borderRadius: 10, fontWeight: 700, fontSize: 14.5 }}>{d.nav.donate}</Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <header style={{ position: 'relative', backgroundColor: '#0d0b20', backgroundImage: 'linear-gradient(90deg, rgba(8,6,20,.9) 0%, rgba(8,6,20,.74) 34%, rgba(10,8,26,.4) 60%, rgba(12,10,30,.12) 82%, rgba(0,0,0,0) 100%), url(/hero-dog.jpg)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}>
        <div className="wrap heroPhoto" style={{ minHeight: 560, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '96px 22px 100px', color: '#fff' }}>
          <div style={{ maxWidth: 580 }}>
            <div className="rv" style={{ animationDelay: '.04s', display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,.14)', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,.28)', color: '#fff', fontWeight: 700, fontSize: 13, padding: '7px 14px', borderRadius: 999, marginBottom: 20 }}>{d.hero.eyebrow}</div>
            <h1 className="rv" style={{ animationDelay: '.1s', margin: 0, fontSize: 'clamp(36px,5.2vw,58px)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-1px', color: '#fff', textShadow: '0 0 2px rgba(0,0,0,.85), 0 1px 6px rgba(0,0,0,.65), 0 3px 18px rgba(0,0,0,.5)' }}>
              {d.hero.title1}<br /><span style={{ color: '#c3ccff' }}>{d.hero.title2}</span>
            </h1>
            <p className="rv" style={{ animationDelay: '.2s', margin: '18px 0 0', fontSize: 17.5, lineHeight: 1.7, color: 'rgba(255,255,255,.95)', maxWidth: 480, textShadow: '0 1px 12px rgba(0,0,0,.6)' }}>{d.hero.subtitle}</p>
            <div className="rv heroCta" style={{ animationDelay: '.3s', display: 'flex', gap: 12, marginTop: 28, flexWrap: 'wrap' }}>
              <Link href="/donate" className="btnCoral" style={{ padding: '14px 28px', borderRadius: 12, fontWeight: 700, fontSize: 16 }}>{d.hero.ctaDonate}</Link>
              <Link href="#cases" className="btnGhost" style={{ padding: '14px 26px', borderRadius: 12, fontWeight: 700, fontSize: 16 }}>{d.hero.ctaCases}</Link>
            </div>
            <div className="rv heroMini" style={{ animationDelay: '.4s', display: 'flex', gap: 30, marginTop: 32, textShadow: '0 1px 10px rgba(0,0,0,.6)' }}>
              {([[String(stats.totalCases), d.mini.cases], [String(stats.helpedCases), d.mini.helped], [String(stats.donorCount), d.mini.donors]] as [string, string][]).map(([v, l]) => (
                <div key={l}><div style={{ fontSize: 24, fontWeight: 800, color: '#fff' }}>{v}</div><div style={{ fontSize: 13, color: 'rgba(255,255,255,.85)' }}>{l}</div></div>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* IMPACT STATS */}
      <section style={{ background: 'var(--soft)', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)' }}>
        <div className="wrap" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 16, padding: '30px 22px' }}>
          {([[`${stats.totalDonated.toLocaleString()} ฿`, d.stats.fund], [String(stats.donorCount), d.stats.donors], [String(stats.totalCases), d.stats.cases], [String(stats.helpedCases), d.stats.helped]] as [string, string][]).map(([v, l]) => (
            <div key={l} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 'clamp(26px,3.4vw,34px)', fontWeight: 800, color: 'var(--coral)', letterSpacing: '-.5px' }}>{v}</div>
              <div style={{ fontSize: 13.5, color: 'var(--muted)', marginTop: 4, fontWeight: 500 }}>{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* OPEN CASES */}
      <section id="cases" className="wrap" style={{ padding: '64px 22px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 26 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 'clamp(26px,3.6vw,36px)', fontWeight: 800, letterSpacing: '-.6px' }}>{d.open.title}</h2>
            <p style={{ margin: '6px 0 0', color: 'var(--muted)', fontSize: 15 }}>{d.open.sub}</p>
          </div>
          <Link href="/cases" className="navlink" style={{ color: 'var(--coral)', fontWeight: 700, fontSize: 15 }}>{d.open.all}</Link>
        </div>
        {openCases.length === 0 ? (
          <div style={{ border: '1px dashed var(--line)', borderRadius: 16, padding: 52, textAlign: 'center', color: 'var(--muted)' }}>{d.open.empty}</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(290px,1fr))', gap: 22 }}>
            {openCases.map((c) => {
              const tag = statusTag(L, c.status)
              const step = caseStep(c.status)
              return (
                <Link key={c.id} href={`/cases/${c.id}`} className="tjcard" style={{ display: 'block', color: 'inherit' }}>
                  <div style={{ position: 'relative', height: 176, background: '#f1f2f5', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {covers[c.id] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={covers[c.id]} alt={c.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (<span style={{ fontSize: 60 }}>{animalIcon(c.animal_type)}</span>)}
                    <span style={{ position: 'absolute', top: 12, left: 12, background: tag.bg, color: tag.fg, fontSize: 12, fontWeight: 700, padding: '5px 11px', borderRadius: 999 }}>{tag.label}</span>
                    {c.mode === 'emergency' && <span style={{ position: 'absolute', top: 12, right: 12, background: 'var(--coral)', color: '#fff', fontSize: 12, fontWeight: 700, padding: '5px 10px', borderRadius: 999 }}>{d.emergency}</span>}
                  </div>
                  <div style={{ padding: 18 }}>
                    <div style={{ fontWeight: 700, fontSize: 16, lineHeight: 1.35, minHeight: 44, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{c.title}</div>
                    <div style={{ fontSize: 13, color: 'var(--muted)', margin: '5px 0 14px' }}>{animalIcon(c.animal_type)} {c.animal_type} · {c.clinic_name || d.casePage.noClinic}</div>
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--muted)', letterSpacing: '.4px', textTransform: 'uppercase', marginBottom: 9 }}>{d.casePage.reviewStatus}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10 }}>
                      <span style={{ background: tag.bg, color: tag.fg, fontSize: 12.5, fontWeight: 700, padding: '4px 11px', borderRadius: 999 }}>{tag.label}</span>
                      {step >= 0 && <span style={{ fontSize: 12, color: 'var(--muted)' }}>{L === 'en' ? `Step ${step + 1} of ${STEP_KEYS.length}` : `ขั้นที่ ${step + 1} จาก ${STEP_KEYS.length}`}</span>}
                    </div>
                    <div style={{ display: 'flex', gap: 5 }}>
                      {STEP_KEYS.map((_, i) => (
                        <div key={i} style={{ flex: 1, height: 6, borderRadius: 999, background: step >= 0 && i <= step ? 'var(--coral)' : (c.status === 'rejected' ? '#fdeaea' : '#f0f1f4') }} />
                      ))}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--line)' }}>
                      <div>
                        <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>{d.casePage.requested}</div>
                        <div><span style={{ fontSize: 16, fontWeight: 800 }}>{Number(c.requested_amount).toLocaleString()}</span><span style={{ fontSize: 12, color: 'var(--muted)' }}> {d.casePage.baht}</span></div>
                      </div>
                      <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--coral)' }}>{L === 'en' ? 'Details →' : 'ดูรายละเอียด →'}</span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </section>

      {/* HOW IT WORKS */}
      <section id="how" style={{ background: 'var(--soft)', marginTop: 56 }}>
        <div className="wrap" style={{ padding: '60px 22px' }}>
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <h2 style={{ margin: 0, fontSize: 'clamp(26px,3.6vw,36px)', fontWeight: 800, letterSpacing: '-.6px' }}>{d.how.title}</h2>
            <p style={{ margin: '8px 0 0', color: 'var(--muted)', fontSize: 15 }}>{d.how.sub}</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 16 }}>
            {d.how.steps.map((st, i) => (
              <div key={i} style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 16, padding: '22px 18px', textAlign: 'center' }}>
                <div style={{ width: 52, height: 52, margin: '0 auto 12px', borderRadius: '50%', background: 'var(--coral-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, position: 'relative' }}>
                  {STEP_ICONS[i]}
                  <span style={{ position: 'absolute', top: -6, right: -6, width: 22, height: 22, borderRadius: '50%', background: 'var(--coral)', color: '#fff', fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{i + 1}</span>
                </div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{st.t}</div>
                <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4, lineHeight: 1.6 }}>{st.s}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SUPPORTERS */}
      <section id="supporters" className="wrap" style={{ padding: '66px 22px 8px' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h2 style={{ margin: 0, fontSize: 'clamp(26px,3.6vw,36px)', fontWeight: 800, letterSpacing: '-.6px' }}>{d.sponsors.title}</h2>
          <p style={{ margin: '8px 0 0', color: 'var(--muted)', fontSize: 15 }}>{d.sponsors.sub}</p>
        </div>

        {/* พันธมิตร / โลโก้องค์กร */}
        <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--muted)', textAlign: 'center', letterSpacing: '.8px', textTransform: 'uppercase', marginBottom: 16 }}>{d.sponsors.partners}</div>
        {SPONSORS.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 18, marginBottom: 46 }}>
            {SPONSORS.map((s) => {
              const inner = (
                <>
                  <div style={{ height: 116, background: 'linear-gradient(135deg,#eef0fd,#f6f7ff)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {s.logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={s.logo} alt={s.name} style={{ width: 72, height: 72, objectFit: 'contain' }} />
                    ) : (
                      <span style={{ width: 64, height: 64, borderRadius: '50%', background: '#fff', color: 'var(--coral-d)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 22, boxShadow: '0 4px 12px rgba(102,126,234,.18)' }}>{monogram(s.name)}</span>
                    )}
                  </div>
                  <div style={{ padding: '14px 16px', textAlign: 'center' }}>
                    <div style={{ fontWeight: 700, fontSize: 15, lineHeight: 1.35 }}>{s.name}</div>
                  </div>
                </>
              )
              return s.url ? (
                <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer" className="tjcard" style={{ display: 'block', overflow: 'hidden', color: 'inherit' }}>{inner}</a>
              ) : (
                <div key={s.name} className="tjcard" style={{ overflow: 'hidden' }}>{inner}</div>
              )
            })}
          </div>
        ) : (
          <div className="tjcard" style={{ padding: '30px 24px', textAlign: 'center', marginBottom: 46 }}>
            <div style={{ fontSize: 34, marginBottom: 8 }}>🤝</div>
            <div style={{ color: 'var(--muted)', marginBottom: 16, fontSize: 15 }}>{d.sponsors.partnersEmpty}</div>
            <Link href="/donate" className="btnLight" style={{ display: 'inline-block', padding: '11px 22px', borderRadius: 11, fontWeight: 700, fontSize: 14 }}>{d.sponsors.become}</Link>
          </div>
        )}

        {/* ผู้ร่วมบริจาคล่าสุด */}
        <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--muted)', textAlign: 'center', letterSpacing: '.8px', textTransform: 'uppercase', marginBottom: 16 }}>{d.sponsors.recent}</div>
        {supporters.length === 0 ? (
          <div className="tjcard" style={{ padding: 40, textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>💜</div>
            <div style={{ color: 'var(--muted)', marginBottom: 18 }}>{d.sponsors.empty}</div>
            <Link href="/donate" className="btnCoral" style={{ display: 'inline-block', padding: '12px 26px', borderRadius: 12, fontWeight: 700, fontSize: 15 }}>{d.sponsors.become}</Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 18 }}>
            {supporters.map((s) => (
              <div key={s.id} className="tjcard" style={{ overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 18px', background: 'linear-gradient(135deg,#eef0fd,#f6f7ff)' }}>
                  <span style={{ width: 44, height: 44, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0, boxShadow: '0 4px 12px rgba(102,126,234,.18)' }}>🐾</span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14.5 }}>{s.donor_nickname || d.sponsors.anon}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>{fmtDate(s.created_at, L)}</div>
                  </div>
                  <div style={{ marginLeft: 'auto', fontWeight: 800, color: 'var(--coral)', fontSize: 17, whiteSpace: 'nowrap' }}>{Number(s.amount).toLocaleString()} ฿</div>
                </div>
                <div style={{ padding: '14px 18px', fontSize: 13.5, lineHeight: 1.6, color: s.message ? '#41454d' : 'var(--muted)' }}>
                  {s.message ? `“${s.message}”` : d.sponsors.thanks}
                </div>
              </div>
            ))}
          </div>
        )}
        <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 13, marginTop: 24 }}>{d.sponsors.thanks}</div>
      </section>

      {/* CTA */}
      <section className="wrap" style={{ padding: '64px 22px 72px' }}>
        <div style={{ background: 'linear-gradient(120deg,#667eea,#9166e8)', color: '#fff', borderRadius: 22, padding: '52px 36px', textAlign: 'center', boxShadow: '0 20px 44px rgba(102,126,234,.28)' }}>
          <h2 style={{ margin: 0, fontSize: 'clamp(24px,3.4vw,38px)', fontWeight: 800, letterSpacing: '-.5px' }}>{d.cta.title}</h2>
          <p style={{ margin: '12px auto 26px', maxWidth: 440, fontSize: 16, opacity: .95, lineHeight: 1.7 }}>{d.cta.sub}</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/login" style={{ background: '#fff', color: 'var(--coral-d)', padding: '14px 30px', borderRadius: 12, fontWeight: 800, fontSize: 16 }}>{d.cta.signup}</Link>
            <Link href="/login" style={{ background: 'rgba(255,255,255,.16)', color: '#fff', padding: '14px 28px', borderRadius: 12, fontWeight: 700, fontSize: 16, border: '1.5px solid rgba(255,255,255,.6)' }}>{d.cta.login}</Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid var(--line)', background: '#fff' }}>
        <div className="wrap" style={{ padding: '28px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', color: 'var(--muted)', fontSize: 13.5 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, color: 'var(--ink)' }}>🐾 {d.brand} · <span style={{ fontWeight: 500, color: 'var(--muted)' }}>{d.footer.tag}</span></div>
          <div>{d.footer.mvp}</div>
        </div>
      </footer>
    </div>
  )
}
