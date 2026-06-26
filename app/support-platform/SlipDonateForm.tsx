'use client'

import { useActionState, useRef, useState, type CSSProperties } from 'react'
import { createPlatformSlipDonation } from '@/app/actions/platform'

const presets = [50, 100, 200, 500, 1000]

const chip = (active: boolean): CSSProperties => ({
  padding: '10px 16px', borderRadius: 11, fontWeight: 700, fontSize: 15, cursor: 'pointer',
  border: '1px solid ' + (active ? '#667eea' : '#e3e4f0'),
  background: active ? '#667eea' : '#fff', color: active ? '#fff' : '#2a2e44',
})
const label: CSSProperties = { display: 'block', fontWeight: 700, fontSize: 13.5, marginBottom: 6 }

export function SlipDonateForm({ promptpay, promptpayName }: { promptpay: string | null; promptpayName: string | null }) {
  const [amount, setAmount] = useState('100')
  const [state, formAction, pending] = useActionState(createPlatformSlipDonation, null)
  const s = state as { success?: boolean; error?: string; amount?: number } | null
  const [slipPreview, setSlipPreview] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [copied, setCopied] = useState(false)

  const copy = () => {
    if (!promptpay) return
    navigator.clipboard?.writeText(promptpay).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500) }).catch(() => {})
  }

  if (s?.success) {
    return (
      <div style={{ background: '#fff', border: '1px solid #edeef7', borderRadius: 16, padding: 28, textAlign: 'center' }}>
        <div style={{ fontSize: 44, marginBottom: 8 }}>🙏</div>
        <h2 style={{ margin: 0, fontSize: 20 }}>ตรวจสลิปผ่านแล้ว — ขอบคุณมากค่ะ!</h2>
        <p style={{ color: '#717892', margin: '8px 0 16px' }}>
          ได้รับ <b style={{ color: '#5560d8' }}>{Number(s?.amount || 0).toLocaleString()} บาท</b> แล้ว — ช่วยให้ปันรักษาเปิดให้ใช้ฟรีต่อไป 💜
        </p>
        <a href="/support-platform" style={{ color: '#5560d8', fontWeight: 700 }}>สนับสนุนอีกครั้ง</a>
      </div>
    )
  }

  if (!promptpay) {
    return (
      <div style={{ background: '#fff', border: '1px solid #edeef7', borderRadius: 16, padding: 24, textAlign: 'center', color: '#9aa0b8' }}>
        <div style={{ fontSize: 30, marginBottom: 6 }}>🏦</div>
        <div style={{ fontSize: 14, fontWeight: 700 }}>ยังไม่ได้ตั้งค่าบัญชีพร้อมเพย์สำหรับรับโอน</div>
      </div>
    )
  }

  return (
    <div style={{ background: '#fff', border: '1px solid #edeef7', borderRadius: 16, padding: 24 }}>
      {/* ขั้นที่ 1 — โอนเงิน */}
      <div style={{ background: '#f7f8fe', border: '1px solid #ededf7', borderRadius: 12, padding: 16, marginBottom: 18 }}>
        <div style={{ fontWeight: 800, fontSize: 14.5, marginBottom: 8 }}>1️⃣ โอนเงินเข้าพร้อมเพย์</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '0.5px', color: '#1d2030' }}>{promptpay}</div>
            {promptpayName && <div style={{ fontSize: 13, color: '#717892' }}>{promptpayName}</div>}
          </div>
          <button type="button" onClick={copy} className="btn btn-secondary btn-sm" style={{ marginLeft: 'auto' }}>
            {copied ? '✓ คัดลอกแล้ว' : 'คัดลอกเลข'}
          </button>
        </div>
        <div style={{ fontSize: 12.5, color: '#9aa0b8', marginTop: 8 }}>เปิดแอปธนาคาร → พร้อมเพย์ → โอนตามจำนวนที่ต้องการ แล้วบันทึกสลิปไว้</div>
      </div>

      {/* ขั้นที่ 2 — อัปโหลดสลิป */}
      <form action={formAction}>
        <div style={{ fontWeight: 800, fontSize: 14.5, marginBottom: 10 }}>2️⃣ แนบสลิปเพื่อยืนยันอัตโนมัติ</div>

        <label style={label}>จำนวนที่โอน (บาท)</label>
        <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap', marginBottom: 10 }}>
          {presets.map((p) => (
            <button key={p} type="button" onClick={() => setAmount(String(p))} style={chip(amount === String(p))}>{p.toLocaleString()}</button>
          ))}
        </div>
        <input name="amount" type="number" min="1" step="1" value={amount} onChange={(e) => setAmount(e.target.value)} disabled={pending} className="form-input" style={{ marginBottom: 6 }} />
        <div style={{ fontSize: 12, color: '#9aa0b8', marginBottom: 14 }}>* ระบบจะยึดยอดจริงตามสลิป (ช่องนี้ใช้สำรองกรณีอ่านสลิปไม่ได้)</div>

        <label style={label}>สลิปการโอนเงิน *</label>
        <input
          ref={fileRef}
          name="slip"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          required
          disabled={pending}
          className="form-input"
          style={{ marginBottom: 10 }}
          onChange={(e) => { const f = e.target.files?.[0]; setSlipPreview(f ? URL.createObjectURL(f) : null) }}
        />
        {slipPreview && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={slipPreview} alt="สลิป" style={{ maxHeight: 200, maxWidth: '100%', borderRadius: 10, border: '1px solid #edeef7', display: 'block', marginBottom: 14 }} />
        )}

        <label style={label}>ชื่อผู้สนับสนุน (ไม่บังคับ)</label>
        <input name="name" disabled={pending} className="form-input" placeholder="แสดงคำขอบคุณ" style={{ marginBottom: 14 }} />
        <label style={label}>ข้อความ (ไม่บังคับ)</label>
        <textarea name="message" rows={2} placeholder="เช่น เป็นกำลังใจให้ทีมงาน" className="form-input" disabled={pending} style={{ marginBottom: 14, resize: 'vertical' }} />

        {s?.error && <div className="alert alert-error" style={{ marginBottom: 14 }}><span>⚠️</span> {s.error}</div>}

        <button type="submit" className="btn btn-primary btn-full" disabled={pending}>
          {pending ? <><span className="spinner" /> กำลังตรวจสลิป…</> : '📤 ส่งสลิปเพื่อยืนยัน'}
        </button>
        <div style={{ marginTop: 10, fontSize: 12, color: '#9aa0b8', textAlign: 'center' }}>ตรวจสลิปอัตโนมัติด้วย PUNSLIP · แยกบัญชีจากกองทุนรักษาสัตว์</div>
      </form>
    </div>
  )
}
