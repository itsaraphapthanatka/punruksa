import Link from 'next/link'
import { animalIcon, statusBadge, emergencyBadgeStyle } from './case-ui'
import { STEP_KEYS, caseStep } from '@/lib/dict'

interface CardCase {
  id: string
  title: string
  animal_type: string
  clinic_name: string | null
  requested_amount: number
  mode: string
  status: string
}

export function CaseCard({
  c,
  cover,
  href,
  ownerTag,
}: {
  c: CardCase
  cover?: string | null
  href: string
  ownerTag?: boolean
}) {
  const b = statusBadge(c.status)
  const step = caseStep(c.status)

  return (
    <Link
      href={href}
      className="lp-feat"
      style={{ display: 'block', background: '#fff', border: '1px solid #edeef7', borderRadius: 16, overflow: 'hidden', color: 'inherit' }}
    >
      {/* cover */}
      <div style={{ position: 'relative', height: 150, background: 'linear-gradient(135deg,#eef0fd,#e7e0fb)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt={c.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <span style={{ fontSize: 56 }}>{animalIcon(c.animal_type)}</span>
        )}
        <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-start' }}>
          {c.mode === 'emergency' && <span style={{ ...emergencyBadgeStyle, boxShadow: '0 2px 6px rgba(0,0,0,.15)' }}>⚡ ฉุกเฉิน</span>}
          {ownerTag && <span style={{ background: '#fff', color: '#5560d8', fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 999, boxShadow: '0 2px 6px rgba(0,0,0,.12)' }}>เคสของคุณ</span>}
        </div>
        <div style={{ position: 'absolute', top: 10, right: 10 }}>
          <span style={{ ...b.style, boxShadow: '0 2px 6px rgba(0,0,0,.15)' }}>{b.label}</span>
        </div>
      </div>

      {/* body */}
      <div style={{ padding: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 15.5, lineHeight: 1.35, minHeight: 42, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {c.title}
        </div>
        <div style={{ fontSize: 12.5, color: '#909abb', margin: '4px 0 12px' }}>
          {animalIcon(c.animal_type)} {c.animal_type} · {c.clinic_name || 'ไม่ระบุคลินิก'}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#909abb', letterSpacing: '.4px', textTransform: 'uppercase' }}>สถานะการพิจารณา</span>
          {step >= 0 && <span style={{ fontSize: 12, fontWeight: 700, color: '#909abb' }}>ขั้นที่ {step + 1}/{STEP_KEYS.length}</span>}
        </div>
        <div style={{ display: 'flex', gap: 5 }}>
          {STEP_KEYS.map((_, i) => (
            <div key={i} style={{ flex: 1, height: 6, borderRadius: 999, background: step >= 0 && i <= step ? '#667eea' : (c.status === 'rejected' ? '#fdeaea' : '#eef0f5') }} />
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 12, paddingTop: 12, borderTop: '1px solid #edeef7' }}>
          <div>
            <div style={{ fontSize: 11, color: '#909abb' }}>ยอดค่ารักษาที่ขอ</div>
            <div><span style={{ fontSize: 16, fontWeight: 800, color: '#2a2e44' }}>{Number(c.requested_amount).toLocaleString()}</span><span style={{ fontSize: 12, color: '#909abb' }}> บาท</span></div>
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#5560d8' }}>ดูรายละเอียด →</span>
        </div>
      </div>
    </Link>
  )
}
