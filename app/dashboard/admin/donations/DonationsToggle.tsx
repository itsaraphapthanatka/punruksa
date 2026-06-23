'use client'

import { useState, useTransition } from 'react'
import { setDonationsEnabled } from '@/app/actions/admin'

export function DonationsToggle({ initialEnabled }: { initialEnabled: boolean }) {
  const [enabled, setEnabled] = useState(initialEnabled)
  const [pending, startTransition] = useTransition()
  const [err, setErr] = useState<string | null>(null)

  const toggle = () => {
    const next = !enabled
    setErr(null)
    setEnabled(next) // optimistic
    startTransition(async () => {
      const r = await setDonationsEnabled(next)
      if (r?.error) {
        setEnabled(!next) // rollback
        setErr(r.error)
      }
    })
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: '#1d2030' }}>ร่วมสมทบทุนช่วยน้อง</div>
        <div style={{ fontSize: 11.5, color: err ? '#c2410c' : 'var(--color-text-muted)', fontWeight: 600 }}>
          {err ? err : enabled ? 'เปิดรับบริจาคอยู่' : 'ปิดรับบริจาคชั่วคราว'}
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label="เปิด/ปิด การรับบริจาค"
        onClick={toggle}
        disabled={pending}
        style={{
          position: 'relative',
          width: 48,
          height: 27,
          borderRadius: 999,
          border: '1px solid ' + (enabled ? '#b7e4c7' : '#e3e4f0'),
          background: enabled ? '#34c77b' : '#eceef5',
          cursor: pending ? 'wait' : 'pointer',
          padding: 0,
          flexShrink: 0,
          transition: 'background .18s, border-color .18s',
          opacity: pending ? 0.7 : 1,
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: 2,
            left: enabled ? 23 : 2,
            width: 21,
            height: 21,
            borderRadius: '50%',
            background: '#fff',
            boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
            transition: 'left .18s',
          }}
        />
      </button>
    </div>
  )
}
