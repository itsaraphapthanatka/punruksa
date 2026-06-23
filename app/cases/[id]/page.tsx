import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getLocale, localeTag } from '@/lib/i18n'
import { dict, statusTag, animalIcon, STEP_KEYS, caseStep } from '@/lib/dict'
import { LanguageSwitcher } from '../../LanguageSwitcher'

export default async function PublicCasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const L = await getLocale()
  const d = dict[L]
  const cp = d.casePage
  const supabase = await createClient()

  const { data: c } = await supabase.from('cases')
    .select('id, title, animal_type, symptoms, clinic_name, requested_amount, mode, status, created_at')
    .eq('id', id).single()
  if (!c) notFound()

  const { data: docs } = await supabase.from('case_documents').select('id, doc_type, file_url').eq('case_id', id)
  const { data: updates } = await supabase.from('case_updates').select('*').eq('case_id', id).order('created_at', { ascending: false })

  const documents = docs ?? []
  const isSlip = (url: string) => url.includes('/receipts/')
  const slips = documents.filter((x) => isSlip(x.file_url)) // RLS คืนเฉพาะแอดมิน
  const photos = documents.filter((x) => x.doc_type === 'photo' && !isSlip(x.file_url))
  const otherDocs = documents.filter((x) => x.doc_type !== 'photo' && !isSlip(x.file_url))
  const cover = photos[0]?.file_url
  const tag = statusTag(L, c.status)
  const step = caseStep(c.status)
  const fmtDate = (s: string) => new Date(s).toLocaleDateString(localeTag(L), { year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div style={{ background: '#fff', color: '#26282e', minHeight: '100vh' }}>
      <style>{`
        :root{--ind:#667eea;--ind-d:#5a66d6;--soft:#eef0fd;--muted:#6b7280;--line:#ededf1}
        .pc-wrap{max-width:1060px;margin:0 auto;padding:0 22px}
        .pc-grid{display:grid;grid-template-columns:1.7fr 1fr;gap:30px;align-items:start}
        .pc-side{position:sticky;top:88px}
        .pc-btn{background:var(--ind);color:#fff;transition:background .15s,transform .15s;box-shadow:0 8px 18px rgba(102,126,234,.32)}
        .pc-btn:hover{background:var(--ind-d);transform:translateY(-1px)}
        .pc-link:hover{color:var(--ind)}
        @media(max-width:820px){.pc-grid{grid-template-columns:1fr}.pc-side{position:static}}
      `}</style>

      <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(255,255,255,.92)', backdropFilter: 'blur(8px)', borderBottom: '1px solid var(--line)' }}>
        <div className="pc-wrap" style={{ display: 'flex', alignItems: 'center', gap: 14, height: 64 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#26282e' }}>
            <span style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--ind)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="19" height="19" viewBox="0 0 24 24" fill="#fff"><circle cx="6.5" cy="9" r="2.1" /><circle cx="11" cy="6.2" r="2.1" /><circle cx="16" cy="6.2" r="2.1" /><circle cx="20" cy="9.6" r="1.9" /><path d="M13 12c-2.3 0-3.7 1.5-4.8 2.9C7 16.4 5.4 17.4 5.4 19.2 5.4 20.8 6.7 22 8.4 22c1.3 0 2.4-.6 3.4-.6.9 0 2 .6 3.4.6 1.7 0 3-1.2 3-2.8 0-1.8-1.6-2.8-2.8-4.3C14.5 13.5 13.1 12 13 12z" /></svg>
            </span>
            <span style={{ fontWeight: 800, fontSize: 17 }}>{d.brand}</span>
          </Link>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 16 }}>
            <LanguageSwitcher locale={L} />
            <Link href="/" className="pc-link" style={{ color: '#41454d', fontWeight: 600, fontSize: 14.5 }}>{d.nav.allCases}</Link>
          </div>
        </div>
      </nav>

      <div className="pc-wrap" style={{ padding: '28px 22px 80px' }}>
        <Link href="/" className="pc-link" style={{ color: 'var(--muted)', fontSize: 14, fontWeight: 600 }}>{cp.crumb}</Link>

        <div className="pc-grid" style={{ marginTop: 16 }}>
          <div>
            <div style={{ borderRadius: 18, overflow: 'hidden', border: '1px solid var(--line)', height: 380, background: '#f1f2f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {cover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={cover} alt={c.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (<span style={{ fontSize: 96 }}>{animalIcon(c.animal_type)}</span>)}
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 18, flexWrap: 'wrap' }}>
              <span style={{ background: tag.bg, color: tag.fg, fontSize: 12.5, fontWeight: 700, padding: '5px 12px', borderRadius: 999 }}>{tag.label}</span>
              {c.mode === 'emergency' && <span style={{ background: '#667eea', color: '#fff', fontSize: 12.5, fontWeight: 700, padding: '5px 12px', borderRadius: 999 }}>{d.emergency}</span>}
            </div>

            <h1 style={{ margin: '14px 0 0', fontSize: 'clamp(26px,3.6vw,38px)', fontWeight: 800, letterSpacing: '-.5px', lineHeight: 1.2 }}>{c.title}</h1>
            <div style={{ marginTop: 10, color: 'var(--muted)', fontSize: 14.5 }}>
              {animalIcon(c.animal_type)} {c.animal_type} · 🏥 {c.clinic_name || cp.noClinic} · {cp.openedOn} {fmtDate(c.created_at)}
            </div>

            <div style={{ marginTop: 28 }}>
              <h2 style={{ fontSize: 19, fontWeight: 800, marginBottom: 10 }}>{cp.story}</h2>
              <p style={{ fontSize: 15.5, lineHeight: 1.85, color: '#3b3f47', whiteSpace: 'pre-wrap' }}>{c.symptoms}</p>
              <div style={{ marginTop: 14, background: 'var(--soft)', borderRadius: 12, padding: '12px 16px', fontSize: 13.5, color: '#4a5176' }}>{cp.pdpa}</div>
            </div>

            {documents.length > 0 && (
              <div style={{ marginTop: 30 }}>
                <h2 style={{ fontSize: 19, fontWeight: 800, marginBottom: 12 }}>{cp.evidence}</h2>
                {photos.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: 10, marginBottom: 12 }}>
                    {photos.map((x) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <a key={x.id} href={x.file_url} target="_blank" rel="noopener noreferrer"><img src={x.file_url} alt="evidence" style={{ width: '100%', height: 110, objectFit: 'cover', borderRadius: 10, border: '1px solid var(--line)' }} /></a>
                    ))}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {otherDocs.map((x) => (
                    <a key={x.id} href={x.file_url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, border: '1px solid var(--line)', borderRadius: 10, padding: '9px 14px', fontSize: 13.5, color: '#41454d', fontWeight: 600 }}>
                      {x.doc_type === 'bill' ? cp.bill : cp.estimate}
                    </a>
                  ))}
                </div>

                {/* สลิป/หลักฐานการจ่ายเงิน — RLS คืนเฉพาะแอดมิน */}
                {slips.length > 0 && (
                  <div style={{ marginTop: 16, padding: 14, background: '#e6f7ef', borderRadius: 12 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 800, color: '#127a52', marginBottom: 8 }}>
                      🧾 สลิป/หลักฐานการจ่ายเงิน <span style={{ fontWeight: 500, color: 'var(--muted)' }}>· เห็นเฉพาะแอดมิน</span>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {slips.map((x) => (
                        <a key={x.id} href={x.file_url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, border: '1px solid #b7e4c7', background: '#fff', borderRadius: 10, padding: '9px 14px', fontSize: 13.5, color: '#127a52', fontWeight: 700 }}>
                          🧾 ดูสลิป
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div style={{ marginTop: 30 }}>
              <h2 style={{ fontSize: 19, fontWeight: 800, marginBottom: 12 }}>{cp.updates}</h2>
              {(!updates || updates.length === 0) ? (
                <p style={{ color: 'var(--muted)', fontSize: 14.5 }}>{cp.noUpdates}</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {updates.map((u) => (
                    <div key={u.id} style={{ borderLeft: '3px solid var(--ind)', paddingLeft: 14 }}>
                      <div style={{ fontSize: 12.5, color: 'var(--muted)' }}>{new Date(u.created_at).toLocaleString(localeTag(L), { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
                      {u.body && <div style={{ fontSize: 14.5, lineHeight: 1.7, whiteSpace: 'pre-wrap', marginTop: 2 }}>{u.body}</div>}
                      {u.attachments?.length > 0 && (
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                          {u.attachments.map((url: string, i: number) => /\.(jpe?g|png|gif|webp)(\?|$)/i.test(url) ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <a key={i} href={url} target="_blank" rel="noopener noreferrer"><img src={url} alt="attachment" style={{ width: 92, height: 92, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--line)' }} /></a>
                          ) : (
                            <a key={i} href={url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, border: '1px solid var(--line)', borderRadius: 8, padding: '7px 12px', fontSize: 13, color: '#41454d', fontWeight: 600 }}>📎 ไฟล์แนบ</a>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <aside>
            <div className="pc-side" style={{ border: '1px solid var(--line)', borderRadius: 18, padding: 22, boxShadow: '0 6px 24px rgba(30,30,50,.06)' }}>
              {/* สถานะการพิจารณา (workflow) — แยกจากยอดเงิน, เป็น step ไม่ใช่ % เงินที่ระดมได้ */}
              <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--muted)', letterSpacing: '.4px', textTransform: 'uppercase', marginBottom: 9 }}>{cp.reviewStatus}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 11 }}>
                <span style={{ background: tag.bg, color: tag.fg, fontSize: 13, fontWeight: 700, padding: '5px 12px', borderRadius: 999 }}>{tag.label}</span>
                {step >= 0 && <span style={{ fontSize: 12.5, color: 'var(--muted)' }}>{L === 'en' ? `Step ${step + 1} of ${STEP_KEYS.length}` : `ขั้นที่ ${step + 1} จาก ${STEP_KEYS.length}`}</span>}
              </div>
              <div style={{ display: 'flex', gap: 5 }}>
                {STEP_KEYS.map((_, i) => (
                  <div key={i} style={{ flex: 1, height: 6, borderRadius: 999, background: step >= 0 && i <= step ? 'var(--ind)' : (c.status === 'rejected' ? '#fdeaea' : '#f0f1f4') }} />
                ))}
              </div>

              {/* ยอดค่ารักษาที่ขอ (ข้อมูลอ้างอิง) + บริจาคเข้ากองกลาง */}
              <div style={{ borderTop: '1px solid var(--line)', marginTop: 20, paddingTop: 18 }}>
                <div style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 600 }}>{cp.requested}</div>
                <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-1px', margin: '2px 0 0' }}>{Number(c.requested_amount).toLocaleString()} <span style={{ fontSize: 16, color: 'var(--muted)' }}>{cp.baht}</span></div>
                <Link href="/donate" className="pc-btn" style={{ display: 'block', textAlign: 'center', marginTop: 16, padding: '14px', borderRadius: 12, fontWeight: 800, fontSize: 16 }}>{cp.donate}</Link>
                <div style={{ marginTop: 12, fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.6, textAlign: 'center' }}>{cp.poolNote}</div>
              </div>
              <div style={{ borderTop: '1px solid var(--line)', marginTop: 18, paddingTop: 16, fontSize: 13, color: 'var(--muted)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div>{cp.b1}</div><div>{cp.b2}</div><div>{cp.b3}</div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
