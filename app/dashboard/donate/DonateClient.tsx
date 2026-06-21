'use client'

import { useActionState, useState, type CSSProperties } from 'react'
import { donateToPool } from '@/app/actions/community'

const presets = [100, 300, 500, 1000, 2000]

const chip = (active: boolean): CSSProperties => ({
  padding: '10px 16px', borderRadius: 11, fontWeight: 700, fontSize: 15, cursor: 'pointer',
  border: '1px solid ' + (active ? '#667eea' : '#e3e4f0'),
  background: active ? '#667eea' : '#fff', color: active ? '#fff' : '#2a2e44',
})

export function DonateClient() {
  const [amount, setAmount] = useState('300')
  const [state, formAction, pending] = useActionState(donateToPool, null)

  if (state?.success) {
    return (
      <div style={{ background: '#fff', border: '1px solid #edeef7', borderRadius: 16, padding: 28, textAlign: 'center' }}>
        <div style={{ fontSize: 44, marginBottom: 8 }}>💜</div>
        <h2 style={{ margin: 0, fontSize: 20 }}>ขอบคุณสำหรับการบริจาค!</h2>
        <p style={{ color: '#717892', margin: '8px 0 16px' }}>
          คุณบริจาค <b style={{ color: '#5560d8' }}>{Number(state.amount).toLocaleString()} บาท</b> เข้ากองทุนกลาง (เดโม)
        </p>
        <a href="/dashboard/donate" style={{ color: '#5560d8', fontWeight: 700 }}>บริจาคอีกครั้ง</a>
      </div>
    )
  }

  return (
    <div style={{ background: '#fff', border: '1px solid #edeef7', borderRadius: 16, padding: 24 }}>
      <form action={formAction}>
        <label style={{ display: 'block', fontWeight: 700, fontSize: 13.5, marginBottom: 8 }}>เลือกจำนวน (บาท)</label>
        <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap', marginBottom: 14 }}>
          {presets.map((p) => (
            <button key={p} type="button" onClick={() => setAmount(String(p))} style={chip(amount === String(p))}>
              {p.toLocaleString()}
            </button>
          ))}
        </div>
        <input
          name="amount" type="number" min="1" value={amount}
          onChange={(e) => setAmount(e.target.value)} disabled={pending}
          className="form-input" style={{ marginBottom: 14 }}
        />
        <label style={{ display: 'block', fontWeight: 700, fontSize: 13.5, marginBottom: 8 }}>ข้อความให้กำลังใจ (ไม่บังคับ)</label>
        <textarea name="message" rows={2} placeholder="เช่น ขอให้น้องๆ หายไวๆ นะ" className="form-input" disabled={pending} style={{ marginBottom: 14, resize: 'vertical' }} />

        {state?.error && (
          <div className="alert alert-error" style={{ marginBottom: 14 }}><span>⚠️</span> {state.error}</div>
        )}

        <button type="submit" className="btn btn-primary btn-full" disabled={pending}>
          {pending ? <><span className="spinner" /> กำลังบันทึก...</> : `💜 บริจาค ${Number(amount || 0).toLocaleString()} บาท (เดโม)`}
        </button>
        <div style={{ marginTop: 10, fontSize: 12, color: '#9aa0b8', textAlign: 'center' }}>
          🧪 เดโม — บันทึกลงระบบเพื่อทดสอบ ยังไม่ตัดเงินจริง
        </div>
      </form>
    </div>
  )
}
