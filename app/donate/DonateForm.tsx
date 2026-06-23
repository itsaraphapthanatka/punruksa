'use client'

import { useActionState, useEffect, useState, type CSSProperties } from 'react'
import { createPublicDonation, checkDonationStatus } from '@/app/actions/community'

const presets = [20, 50, 100, 200, 500, 1000]

const chip = (active: boolean): CSSProperties => ({
  padding: '10px 16px', borderRadius: 11, fontWeight: 700, fontSize: 15, cursor: 'pointer',
  border: '1px solid ' + (active ? '#667eea' : '#e3e4f0'),
  background: active ? '#667eea' : '#fff', color: active ? '#fff' : '#2a2e44',
})

const label: CSSProperties = { display: 'block', fontWeight: 700, fontSize: 13.5, marginBottom: 6 }

interface ChargeState {
  success?: boolean
  error?: string
  trans_id?: string
  qr?: string
  amountToPay?: string
  expireAt?: string
  amount?: number
}

export function DonateForm() {
  const [amount, setAmount] = useState('100')
  const [state, formAction, pending] = useActionState(createPublicDonation, null)
  const s = state as ChargeState | null

  const [paid, setPaid] = useState(false)
  const [expired, setExpired] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null)

  const transId = s?.success ? s.trans_id : undefined

  useEffect(() => {
    if (!s?.success || !s.expireAt) return
    const end = new Date(s.expireAt).getTime()
    const tick = () => {
      const left = Math.max(0, Math.round((end - Date.now()) / 1000))
      setSecondsLeft(left)
      if (left <= 0) setExpired(true)
    }
    tick()
    const iv = setInterval(tick, 1000)
    return () => clearInterval(iv)
  }, [s])

  useEffect(() => {
    if (!transId || paid || expired) return
    let stopped = false
    const iv = setInterval(async () => {
      const r = await checkDonationStatus(transId)
      if (stopped) return
      if (r.status === 'completed') { setPaid(true); clearInterval(iv) }
      else if (r.status === 'failed' || r.status === 'expired') { setExpired(true); clearInterval(iv) }
    }, 4000)
    return () => { stopped = true; clearInterval(iv) }
  }, [transId, paid, expired])

  // ───── สำเร็จ ─────
  if (paid) {
    return (
      <div style={{ background: '#fff', border: '1px solid #edeef7', borderRadius: 16, padding: 28, textAlign: 'center' }}>
        <div style={{ fontSize: 44, marginBottom: 8 }}>💜</div>
        <h2 style={{ margin: 0, fontSize: 20 }}>ขอบคุณสำหรับการบริจาค!</h2>
        <p style={{ color: '#717892', margin: '8px 0 16px' }}>
          เราได้รับเงิน <b style={{ color: '#5560d8' }}>{Number(s?.amount || 0).toLocaleString()} บาท</b> เข้ากองทุนกลางแล้ว
        </p>
        <a href="/donate" style={{ color: '#5560d8', fontWeight: 700 }}>บริจาคอีกครั้ง</a>
      </div>
    )
  }

  // ───── แสดง QR รอชำระ ─────
  if (s?.success && s.qr) {
    const mm = secondsLeft != null ? String(Math.floor(secondsLeft / 60)).padStart(2, '0') : '--'
    const ss = secondsLeft != null ? String(secondsLeft % 60).padStart(2, '0') : '--'
    // PayNoi ปกติคืนยอดกลม (.00) — ตัด .00 ออกให้อ่านง่าย แต่ถ้ามีเศษ (กรณีจับคู่) แสดงตามจริง
    const payAmt = s.amountToPay && s.amountToPay.endsWith('.00') ? s.amountToPay.slice(0, -3) : s.amountToPay
    return (
      <div style={{ background: '#fff', border: '1px solid #edeef7', borderRadius: 16, padding: 24, textAlign: 'center' }}>
        <div style={{ fontWeight: 800, fontSize: 17, marginBottom: 4 }}>สแกนพร้อมเพย์เพื่อบริจาค</div>
        <div style={{ color: '#717892', fontSize: 13.5, marginBottom: 14 }}>เปิดแอปธนาคาร แล้วสแกน QR ด้านล่าง</div>

        {/* PayNoi อาจส่ง base64 มาพร้อม prefix 'data:...' อยู่แล้ว → ไม่เติมซ้ำ */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={s.qr.startsWith('data:') ? s.qr : `data:image/png;base64,${s.qr}`} alt="PromptPay QR" style={{ width: 240, height: 240, objectFit: 'contain', margin: '0 auto', borderRadius: 12, border: '1px solid #edeef7' }} />

        <div style={{ margin: '14px 0 4px', fontSize: 13, color: '#717892' }}>ยอดที่ต้องโอน</div>
        <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.5px', color: '#1d2030' }}>{payAmt} <span style={{ fontSize: 16, color: '#838aa3' }}>บาท</span></div>
        <div style={{ fontSize: 12.5, color: '#9aa0b8', marginTop: 4 }}>ยอดมีเศษสตางค์เพื่อจับคู่การโอนอัตโนมัติ — กรุณาโอนให้ตรงเป๊ะ</div>

        {expired ? (
          <div className="alert alert-error" style={{ marginTop: 16, justifyContent: 'center' }}><span>⏱️</span> QR หมดอายุแล้ว</div>
        ) : (
          <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#5560d8', fontWeight: 700 }}>
            <span className="spinner" /> รอรับการชำระเงิน… ({mm}:{ss})
          </div>
        )}

        <a href="/donate" style={{ display: 'inline-block', marginTop: 16, color: '#838aa3', fontWeight: 600, fontSize: 14 }}>← เริ่มใหม่ / เปลี่ยนจำนวน</a>
      </div>
    )
  }

  // ───── ฟอร์ม ─────
  return (
    <div style={{ background: '#fff', border: '1px solid #edeef7', borderRadius: 16, padding: 24 }}>
      <form action={formAction}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
          <div>
            <label style={label}>ชื่อ *</label>
            <input name="first_name" required disabled={pending} className="form-input" />
          </div>
          <div>
            <label style={label}>นามสกุล *</label>
            <input name="last_name" required disabled={pending} className="form-input" />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
          <div>
            <label style={label}>ชื่อเล่น</label>
            <input name="nickname" disabled={pending} className="form-input" placeholder="แสดงบนหน้าผู้สนับสนุน" />
          </div>
          <div>
            <label style={label}>เบอร์โทร *</label>
            <input name="phone" required disabled={pending} className="form-input" inputMode="tel" placeholder="08x-xxx-xxxx" />
          </div>
        </div>

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

        <label style={label}>ข้อความให้กำลังใจ (ไม่บังคับ)</label>
        <textarea name="message" rows={2} placeholder="เช่น ขอให้น้องๆ หายไวๆ นะ" className="form-input" disabled={pending} style={{ marginBottom: 14, resize: 'vertical' }} />

        {s?.error && (
          <div className="alert alert-error" style={{ marginBottom: 14 }}><span>⚠️</span> {s.error}</div>
        )}

        <button type="submit" className="btn btn-primary btn-full" disabled={pending}>
          {pending ? <><span className="spinner" /> กำลังสร้าง QR…</> : `💜 สมทบทุนช่วยน้อง ${Number(amount || 0).toLocaleString()} บาท`}
        </button>
        <div style={{ marginTop: 10, fontSize: 12, color: '#9aa0b8', textAlign: 'center' }}>
          ชำระผ่านพร้อมเพย์ · เงินเข้ากองกลางโดยตรง · ข้อมูลติดต่อเก็บเป็นความลับ
        </div>
      </form>
    </div>
  )
}
