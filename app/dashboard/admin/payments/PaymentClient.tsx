'use client'

import { useState } from 'react'
import { useActionState } from 'react'
import { recordPayment } from '@/app/actions/payment'

interface ApprovedCase {
  id: string
  title: string
  animal_type: string
  clinic_name: string | null
  requested_amount: number
  mode: string
  status: string
  created_at: string
}

export function PaymentClient({ cases }: { cases: ApprovedCase[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [state, formAction, pending] = useActionState(recordPayment, null)

  return (
    <>
      {state?.error && (
        <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
          <span>⚠️</span> {state.error}
        </div>
      )}
      {state?.success && (
        <div className="alert alert-success" style={{ marginBottom: '1rem' }}>
          <span>✅</span> บันทึกการจ่ายเงินเรียบร้อย
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {cases.map((c) => {
          const isExpanded = expandedId === c.id

          return (
            <div key={c.id} className="glass-card" style={{ overflow: 'hidden' }}>
              <div
                onClick={() => setExpandedId(isExpanded ? null : c.id)}
                style={{
                  padding: '1.25rem 1.5rem',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.25rem' }}>{c.title}</h3>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', display: 'flex', gap: '1rem' }}>
                    <span>🐾 {c.animal_type}</span>
                    <span>🏥 {c.clinic_name || '—'}</span>
                    <span style={{ fontWeight: 700, color: 'var(--color-primary-light)' }}>
                      ฿{Number(c.requested_amount).toLocaleString('th-TH')}
                    </span>
                  </div>
                </div>
                <span className="badge badge-approver">✅ อนุมัติแล้ว</span>
              </div>

              {isExpanded && (
                <div style={{ padding: '0 1.5rem 1.5rem', borderTop: '1px solid var(--color-border)', paddingTop: '1.25rem' }}>
                  <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
                    อัปโหลดใบเสร็จจากคลินิกเพื่อบันทึกการจ่ายเงิน (จ่ายแบบ manual โดยมูลนิธิ)
                  </p>
                  <form action={formAction}>
                    <input type="hidden" name="case_id" value={c.id} />
                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                      <label className="form-label">แนบใบเสร็จจากคลินิก *</label>
                      <input
                        name="receipt"
                        type="file"
                        accept="image/*,.pdf"
                        required
                        className="form-input"
                        disabled={pending}
                        style={{ padding: '0.5rem' }}
                      />
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={pending}>
                      {pending ? (
                        <><span className="spinner" /> กำลังบันทึก...</>
                      ) : (
                        '💸 บันทึกการจ่ายเงิน + ปิดเคส'
                      )}
                    </button>
                  </form>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </>
  )
}
