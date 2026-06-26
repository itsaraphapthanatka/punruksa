'use client'

import { useState } from 'react'
import { PlatformDonateForm } from './PlatformDonateForm'
import { SlipDonateForm } from './SlipDonateForm'

export function SupportMethods({
  slipReady,
  punpayReady,
  promptpay,
  promptpayName,
}: {
  slipReady: boolean
  punpayReady: boolean
  promptpay: string | null
  promptpayName: string | null
}) {
  // ค่าเริ่มต้น: ตรวจสลิป (ถ้าพร้อม) ไม่งั้น PunPay
  const [tab, setTab] = useState<'slip' | 'punpay'>(slipReady ? 'slip' : 'punpay')

  const bothAvailable = slipReady && punpayReady
  if (!slipReady && !punpayReady) {
    return (
      <div style={{ background: '#fff', border: '1px solid #edeef7', borderRadius: 16, padding: 24, textAlign: 'center', color: '#9aa0b8' }}>
        <div style={{ fontSize: 30, marginBottom: 6 }}>🏦</div>
        <div style={{ fontSize: 14, fontWeight: 700 }}>ระบบชำระเงินกำลังจัดเตรียม</div>
      </div>
    )
  }

  const tabBtn = (key: 'slip' | 'punpay', label: string) => (
    <button
      type="button"
      onClick={() => setTab(key)}
      style={{
        flex: 1, padding: '11px 14px', borderRadius: 11, fontWeight: 700, fontSize: 14, cursor: 'pointer',
        border: '1px solid ' + (tab === key ? '#667eea' : '#e3e4f0'),
        background: tab === key ? '#667eea' : '#fff', color: tab === key ? '#fff' : '#41454d',
      }}
    >
      {label}
    </button>
  )

  return (
    <div>
      {bothAvailable && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          {tabBtn('slip', '📤 โอนแล้วแนบสลิป')}
          {tabBtn('punpay', '💳 จ่ายออนไลน์')}
        </div>
      )}
      {tab === 'slip' && slipReady ? (
        <SlipDonateForm promptpay={promptpay} promptpayName={promptpayName} />
      ) : (
        <PlatformDonateForm />
      )}
    </div>
  )
}
