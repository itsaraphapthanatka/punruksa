'use client'

import { useActionState, useEffect, useState, type CSSProperties } from 'react'
import { createPlatformDonation, checkPlatformDonationStatus } from '@/app/actions/platform'

const presets = [50, 100, 200, 500, 1000]

const chip = (active: boolean): CSSProperties => ({
  padding: '10px 16px', borderRadius: 11, fontWeight: 700, fontSize: 15, cursor: 'pointer',
  border: '1px solid ' + (active ? '#667eea' : '#e3e4f0'),
  background: active ? '#667eea' : '#fff', color: active ? '#fff' : '#2a2e44',
})
const label: CSSProperties = { display: 'block', fontWeight: 700, fontSize: 13.5, marginBottom: 6 }

interface ChargeState {
  success?: boolean
  error?: string
  chargeId?: string
  checkoutUrl?: string
  amount?: number
}

export function PlatformDonateForm() {
  const [amount, setAmount] = useState('100')
  const [state, formAction, pending] = useActionState(createPlatformDonation, null)
  const s = state as ChargeState | null

  const [paid, setPaid] = useState(false)
  const chargeId = s?.success ? s.chargeId : undefined

  // poll สถานะ ระหว่างหน้านี้ยังเปิดอยู่ (ผู้ใช้ไปจ่ายที่ checkout แท็บใหม่)
  useEffect(() => {
    if (!chargeId || paid) return
    let stopped = false
    const iv = setInterval(async () => {
      const r = await checkPlatformDonationStatus(chargeId)
      if (stopped) return
      if (r.status === 'completed') { setPaid(true); clearInterval(iv) }
    }, 4000)
    return () => { stopped = true; clearInterval(iv) }
  }, [chargeId, paid])

  // ───── สำเร็จ ─────
  if (paid) {
    return (
      <div style={{ background: '#fff', border: '1px solid #edeef7', borderRadius: 16, padding: 28, textAlign: 'center' }}>
        <div style={{ fontSize: 44, marginBottom: 8 }}>🙏</div>
        <h2 style={{ margin: 0, fontSize: 20 }}>ขอบคุณที่สนับสนุนค่าดูแลระบบ!</h2>
        <p style={{ color: '#717892', margin: '8px 0 16px' }}>
          ได้รับ <b style={{ color: '#5560d8' }}>{Number(s?.amount || 0).toLocaleString()} บาท</b> แล้ว — ช่วยให้ปันรักษาเปิดให้ใช้ฟรีต่อไป 💜
        </p>
        <a href="/support-platform" style={{ color: '#5560d8', fontWeight: 700 }}>สนับสนุนอีกครั้ง</a>
      </div>
    )
  }

  // ───── สร้าง charge แล้ว → ปุ่มไปหน้าชำระเงิน + รอผล ─────
  if (s?.success && s.checkoutUrl) {
    return (
      <div style={{ background: '#fff', border: '1px solid #edeef7', borderRadius: 16, padding: 24, textAlign: 'center' }}>
        <div style={{ fontWeight: 800, fontSize: 17, marginBottom: 4 }}>เกือบเสร็จแล้ว!</div>
        <div style={{ color: '#717892', fontSize: 13.5, marginBottom: 16, lineHeight: 1.6 }}>
          กดปุ่มด้านล่างเพื่อไปหน้าชำระเงินที่ปลอดภัยของ PunPay (เปิดแท็บใหม่) — หลังจ่ายเสร็จ กลับมาที่หน้านี้ได้เลย
        </div>
        <a
          href={s.checkoutUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-primary btn-full"
          style={{ display: 'inline-flex', justifyContent: 'center', textDecoration: 'none' }}
        >
          ไปหน้าชำระเงิน {Number(s.amount || 0).toLocaleString()} บาท →
        </a>
        <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#5560d8', fontWeight: 700, fontSize: 14 }}>
          <span className="spinner" /> รอรับการชำระเงิน…
        </div>
        <a href="/support-platform" style={{ display: 'inline-block', marginTop: 14, color: '#838aa3', fontWeight: 600, fontSize: 14 }}>← เริ่มใหม่ / เปลี่ยนจำนวน</a>
      </div>
    )
  }

  // ───── ฟอร์ม ─────
  return (
    <div style={{ background: '#fff', border: '1px solid #edeef7', borderRadius: 16, padding: 24 }}>
      <form action={formAction}>
        <label style={label}>เลือกจำนวน (บาท)</label>
        <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap', marginBottom: 10 }}>
          {presets.map((p) => (
            <button key={p} type="button" onClick={() => setAmount(String(p))} style={chip(amount === String(p))}>
              {p.toLocaleString()}
            </button>
          ))}
        </div>
        <input
          name="amount" type="number" min="1" step="1" value={amount}
          onChange={(e) => setAmount(e.target.value)} disabled={pending}
          className="form-input" style={{ marginBottom: 14 }}
        />

        <label style={label}>ชื่อผู้สนับสนุน (ไม่บังคับ)</label>
        <input name="name" disabled={pending} className="form-input" placeholder="แสดงคำขอบคุณ" style={{ marginBottom: 14 }} />

        <label style={label}>ข้อความ (ไม่บังคับ)</label>
        <textarea name="message" rows={2} placeholder="เช่น เป็นกำลังใจให้ทีมงาน" className="form-input" disabled={pending} style={{ marginBottom: 14, resize: 'vertical' }} />

        {s?.error && (
          <div className="alert alert-error" style={{ marginBottom: 14 }}><span>⚠️</span> {s.error}</div>
        )}

        <button type="submit" className="btn btn-primary btn-full" disabled={pending}>
          {pending ? <><span className="spinner" /> กำลังสร้างรายการ…</> : `☕️ สนับสนุน ${Number(amount || 0).toLocaleString()} บาท`}
        </button>
        <div style={{ marginTop: 10, fontSize: 12, color: '#9aa0b8', textAlign: 'center' }}>
          ชำระผ่าน PunPay · แยกบัญชีจากกองทุนรักษาสัตว์
        </div>
      </form>
    </div>
  )
}
