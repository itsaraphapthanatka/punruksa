import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getImpactStats, getCaseCovers } from '@/lib/stats'
import { getLocale } from '@/lib/i18n'
import { dict, statusTag, progressOf, animalIcon } from '@/lib/dict'
import { LanguageSwitcher } from './LanguageSwitcher'

interface OpenCase {
  id: string; title: string; animal_type: string; clinic_name: string | null
  requested_amount: number; mode: string; status: string; created_at: string
}

const STEP_ICONS = ['📝', '🔎', '🎲', '🗳️', '💸']

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

  return (
    <div className="tj">
      <style>{`
        :root{ --coral:#667eea; --coral-d:#5a66d6; --coral-soft:#eef0fd; --ink:#26282e; --muted:#6b7280; --line:#ededf1; --soft:#f6f7f9; }
        .tj{background:#fff;color:var(--ink)}
        .wrap{max-width:1140px;margin:0 auto;padding:0 22px}
        @keyframes tjRise{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
        .rv{opacity:0;animation:tjRise .7s cubic-bezier(.2,.7,.2,1) forwards}
        @keyframes lpBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-9px)}}
        @keyframes lpTail{0%,100%{transform:rotate(-20deg)}50%{transform:rotate(22deg)}}
        @keyframes lpBlink{0%,90%,100%{transform:scaleY(1)}95%{transform:scaleY(.1)}}
        @keyframes lpPaw{0%,100%{transform:rotate(-4deg)}50%{transform:rotate(17deg)}}
        .lp-dog{animation:lpBob 3.4s ease-in-out infinite;transform-box:fill-box}
        .lp-tail{animation:lpTail .6s ease-in-out infinite;transform-box:fill-box;transform-origin:14% 86%}
        .lp-eyes{animation:lpBlink 4.4s infinite;transform-box:fill-box;transform-origin:center}
        .lp-paw{animation:lpPaw .7s ease-in-out infinite;transform-box:fill-box;transform-origin:55% 96%}
        .btnCoral{background:var(--coral);color:#fff;transition:background .15s,transform .15s,box-shadow .15s;box-shadow:0 6px 16px rgba(102,126,234,.32)}
        .btnCoral:hover{background:var(--coral-d);transform:translateY(-1px);box-shadow:0 10px 22px rgba(102,126,234,.4)}
        .btnLight{background:#fff;color:var(--ink);border:1.5px solid var(--line);transition:border-color .15s,color .15s}
        .btnLight:hover{border-color:var(--coral);color:var(--coral)}
        .navlink{color:#41454d;font-weight:600;font-size:14.5px}
        .navlink:hover{color:var(--coral)}
        .tjcard{background:#fff;border:1px solid var(--line);border-radius:16px;overflow:hidden;box-shadow:0 3px 14px rgba(30,30,50,.05);transition:transform .2s,box-shadow .2s}
        .tjcard:hover{transform:translateY(-5px);box-shadow:0 16px 34px rgba(30,30,50,.12)}
        @media(max-width:860px){ .heroGrid{grid-template-columns:1fr!important;text-align:center} .heroDog{margin:6px auto 0!important;order:-1} .heroCta,.heroMini{justify-content:center} }
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
            <Link href="/login" className="btnCoral" style={{ padding: '9px 20px', borderRadius: 10, fontWeight: 700, fontSize: 14.5 }}>{d.nav.donate}</Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <header style={{ background: 'linear-gradient(180deg,#f1f3ff,#fff 78%)' }}>
        <div className="wrap heroGrid" style={{ display: 'grid', gridTemplateColumns: '1.05fr .95fr', gap: 36, alignItems: 'center', padding: '56px 22px 60px' }}>
          <div>
            <div className="rv" style={{ animationDelay: '.04s', display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--coral-soft)', color: 'var(--coral-d)', fontWeight: 700, fontSize: 13, padding: '7px 14px', borderRadius: 999, marginBottom: 20 }}>{d.hero.eyebrow}</div>
            <h1 className="rv" style={{ animationDelay: '.1s', margin: 0, fontSize: 'clamp(36px,5vw,56px)', fontWeight: 800, lineHeight: 1.12, letterSpacing: '-1px' }}>
              {d.hero.title1}<br /><span style={{ color: 'var(--coral)' }}>{d.hero.title2}</span>
            </h1>
            <p className="rv" style={{ animationDelay: '.2s', margin: '18px 0 0', fontSize: 17, lineHeight: 1.7, color: 'var(--muted)', maxWidth: 460 }}>{d.hero.subtitle}</p>
            <div className="rv heroCta" style={{ animationDelay: '.3s', display: 'flex', gap: 12, marginTop: 28, flexWrap: 'wrap' }}>
              <Link href="/login" className="btnCoral" style={{ padding: '14px 28px', borderRadius: 12, fontWeight: 700, fontSize: 16 }}>{d.hero.ctaDonate}</Link>
              <Link href="#cases" className="btnLight" style={{ padding: '14px 26px', borderRadius: 12, fontWeight: 700, fontSize: 16 }}>{d.hero.ctaCases}</Link>
            </div>
            <div className="rv heroMini" style={{ animationDelay: '.4s', display: 'flex', gap: 28, marginTop: 30 }}>
              {([[String(stats.totalCases), d.mini.cases], [String(stats.helpedCases), d.mini.helped], [String(stats.donorCount), d.mini.donors]] as [string, string][]).map(([v, l]) => (
                <div key={l}><div style={{ fontSize: 24, fontWeight: 800, color: 'var(--ink)' }}>{v}</div><div style={{ fontSize: 13, color: 'var(--muted)' }}>{l}</div></div>
              ))}
            </div>
          </div>

          <div className="heroDog rv" style={{ animationDelay: '.25s', position: 'relative', width: 320, height: 320, justifySelf: 'center' }}>
            <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'radial-gradient(circle at 50% 45%, #dfe4fb, #eef0fd 62%, transparent 72%)' }} />
            <div style={{ position: 'absolute', inset: 24, borderRadius: '50%', border: '2px dashed #b9c2f3' }} />
            <svg viewBox="0 0 260 270" width="320" height="320" style={{ position: 'relative' }} role="img" aria-label="dog mascot">
              <g className="lp-dog">
                <g className="lp-tail"><path d="M186 184 q46 2 42 -42 q-3 -22 -24 -16 q16 10 9 29 q-8 21 -29 17 z" fill="#c98a52" /></g>
                <ellipse cx="124" cy="182" rx="64" ry="60" fill="#d99a63" />
                <ellipse cx="124" cy="202" rx="42" ry="38" fill="#f0d0a4" />
                <ellipse cx="84" cy="234" rx="22" ry="14" fill="#f0d0a4" /><ellipse cx="164" cy="234" rx="22" ry="14" fill="#f0d0a4" />
                <rect x="132" y="200" width="22" height="42" rx="11" fill="#d99a63" /><ellipse cx="143" cy="240" rx="15" ry="10" fill="#f0d0a4" />
                <g>
                  <path d="M82 96 L58 44 Q90 52 106 86 Z" fill="#c98a52" /><path d="M78 84 L66 56 Q84 62 94 82 Z" fill="#b9763f" />
                  <path d="M166 96 L190 44 Q158 52 142 86 Z" fill="#c98a52" /><path d="M170 84 L182 56 Q164 62 154 82 Z" fill="#b9763f" />
                  <ellipse cx="124" cy="106" rx="52" ry="48" fill="#d99a63" />
                  <circle cx="90" cy="120" r="12" fill="#f4a3a3" opacity="0.45" /><circle cx="158" cy="120" r="12" fill="#f4a3a3" opacity="0.45" />
                  <ellipse cx="124" cy="123" rx="33" ry="27" fill="#f4d6ac" />
                  <g className="lp-eyes"><ellipse cx="105" cy="98" rx="7.5" ry="10" fill="#2a2e44" /><ellipse cx="143" cy="98" rx="7.5" ry="10" fill="#2a2e44" /><circle cx="107.5" cy="94" r="2.6" fill="#fff" /><circle cx="145.5" cy="94" r="2.6" fill="#fff" /></g>
                  <ellipse cx="124" cy="114" rx="9.5" ry="7.5" fill="#33333f" /><circle cx="121" cy="112" r="2" fill="#6b6b7a" />
                  <path d="M124 121 q-12 13 -22 5 M124 121 q12 13 22 5" stroke="#9a6536" strokeWidth="3.2" fill="none" strokeLinecap="round" />
                  <ellipse cx="124" cy="133" rx="7" ry="6" fill="#f28a8a" />
                  <path d="M86 150 q38 28 76 0" stroke="#667eea" strokeWidth="11" fill="none" strokeLinecap="round" />
                  <circle cx="124" cy="167" r="9" fill="#ffce5c" stroke="#e9b53f" strokeWidth="2" /><circle cx="124" cy="167" r="3" fill="#e9b53f" />
                </g>
                <g className="lp-paw"><rect x="78" y="118" width="22" height="92" rx="11" fill="#d99a63" /><ellipse cx="89" cy="118" rx="13" ry="11" fill="#f0d0a4" /></g>
              </g>
            </svg>
            <div style={{ position: 'absolute', top: 14, right: 2, background: '#fff', boxShadow: '0 6px 16px rgba(0,0,0,.1)', color: 'var(--coral-d)', fontWeight: 800, fontSize: 13, padding: '7px 13px', borderRadius: 12 }}>{d.hero.greet}</div>
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
          <Link href="/login" className="navlink" style={{ color: 'var(--coral)', fontWeight: 700, fontSize: 15 }}>{d.open.all}</Link>
        </div>
        {openCases.length === 0 ? (
          <div style={{ border: '1px dashed var(--line)', borderRadius: 16, padding: 52, textAlign: 'center', color: 'var(--muted)' }}>{d.open.empty}</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(290px,1fr))', gap: 22 }}>
            {openCases.map((c) => {
              const tag = statusTag(L, c.status)
              const pct = progressOf(c.status)
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
                    <div style={{ height: 8, background: '#f0f1f4', borderRadius: 999, overflow: 'hidden' }}><div style={{ width: `${pct}%`, height: '100%', background: 'var(--coral)', borderRadius: 999 }} /></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                      <div><span style={{ fontSize: 19, fontWeight: 800 }}>{Number(c.requested_amount).toLocaleString()}</span><span style={{ fontSize: 12, color: 'var(--muted)' }}> {d.casePage.baht}</span></div>
                      <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--coral)' }}>{L === 'en' ? 'View →' : 'ดูเคส →'}</span>
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
