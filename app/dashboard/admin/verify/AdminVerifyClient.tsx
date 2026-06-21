'use client'

import { useState } from 'react'
import { verifyCase, rejectCase } from '@/app/actions/admin'

interface CaseDoc {
  id: string
  doc_type: string
  file_url: string
}

interface CaseWithDocs {
  id: string
  title: string
  animal_type: string
  symptoms: string
  clinic_name: string | null
  requested_amount: number
  mode: string
  status: string
  created_at: string
  created_by: string
  documents: CaseDoc[]
  creator_name: string
  creator_email: string
}

export function AdminVerifyClient({ cases }: { cases: CaseWithDocs[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [rejectReasonId, setRejectReasonId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [loading, setLoading] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleVerify = async (caseId: string) => {
    setLoading(caseId)
    setMessage(null)
    const result = await verifyCase(caseId)
    setLoading(null)
    if (result.error) {
      setMessage({ type: 'error', text: result.error })
    } else {
      setMessage({ type: 'success', text: 'ผ่านการตรวจเอกสารเรียบร้อย' })
    }
  }

  const handleReject = async (caseId: string) => {
    if (!rejectReason.trim()) {
      setMessage({ type: 'error', text: 'กรุณาระบุเหตุผลในการตีกลับ' })
      return
    }
    setLoading(caseId)
    setMessage(null)
    const result = await rejectCase(caseId, rejectReason)
    setLoading(null)
    setRejectReasonId(null)
    setRejectReason('')
    if (result.error) {
      setMessage({ type: 'error', text: result.error })
    } else {
      setMessage({ type: 'success', text: 'ตีกลับเคสเรียบร้อย' })
    }
  }

  return (
    <>
      {message && (
        <div
          className={`alert ${message.type === 'error' ? 'alert-error' : 'alert-success'}`}
          style={{ marginBottom: '1rem' }}
        >
          <span>{message.type === 'error' ? '⚠️' : '✅'}</span>
          {message.text}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {cases.map((c) => {
          const isExpanded = expandedId === c.id
          const isRejectMode = rejectReasonId === c.id
          const isLoading = loading === c.id

          return (
            <div key={c.id} className="glass-card" style={{ overflow: 'hidden' }}>
              {/* Header */}
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>{c.title}</h3>
                    <span style={{
                      padding: '0.125rem 0.5rem',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.6875rem',
                      fontWeight: 700,
                      background: c.mode === 'emergency' ? 'rgba(248, 113, 113, 0.15)' : 'rgba(102, 126, 234, 0.15)',
                      color: c.mode === 'emergency' ? '#f87171' : 'var(--color-primary-light)',
                    }}>
                      {c.mode === 'emergency' ? '🚨 ฉุกเฉิน' : '📋 ปกติ'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', display: 'flex', gap: '1rem' }}>
                    <span>🐾 {c.animal_type}</span>
                    <span>💰 ฿{Number(c.requested_amount).toLocaleString('th-TH')}</span>
                    <span>👤 {c.creator_name}</span>
                  </div>
                </div>
                <span style={{ fontSize: '1.25rem', transition: 'transform var(--transition-fast)', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)' }}>
                  ▼
                </span>
              </div>

              {/* Expanded Detail */}
              {isExpanded && (
                <div style={{
                  padding: '0 1.5rem 1.5rem',
                  borderTop: '1px solid var(--color-border)',
                  paddingTop: '1.25rem',
                }}>
                  {/* Details */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>อาการ</div>
                      <div style={{ lineHeight: 1.7, fontSize: '0.875rem' }}>{c.symptoms}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>คลินิก</div>
                      <div style={{ fontSize: '0.875rem' }}>{c.clinic_name || '—'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.75rem', marginBottom: '0.25rem' }}>ผู้เปิดเคส</div>
                      <div style={{ fontSize: '0.875rem' }}>{c.creator_name} ({c.creator_email})</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.75rem', marginBottom: '0.25rem' }}>วันที่เปิด</div>
                      <div style={{ fontSize: '0.875rem' }}>
                        {new Date(c.created_at).toLocaleDateString('th-TH', {
                          year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Documents */}
                  {c.documents.length > 0 && (
                    <div style={{ marginBottom: '1.25rem' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
                        📎 เอกสารแนบ ({c.documents.length} ไฟล์)
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {c.documents.map((doc) => (
                          <a
                            key={doc.id}
                            href={doc.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              padding: '0.5rem 0.75rem',
                              borderRadius: 'var(--radius-sm)',
                              border: '1px solid var(--color-border)',
                              background: 'var(--color-bg-input)',
                              fontSize: '0.8125rem',
                              textDecoration: 'none',
                              color: 'var(--color-text)',
                            }}
                          >
                            {doc.doc_type === 'photo' ? '🖼️' : doc.doc_type === 'bill' ? '🧾' : '📋'}
                            {doc.doc_type === 'photo' ? 'รูปภาพ' : doc.doc_type === 'bill' ? 'บิล' : 'ใบประเมิน'}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Reject reason input */}
                  {isRejectMode && (
                    <div style={{ marginBottom: '1rem' }}>
                      <textarea
                        placeholder="ระบุเหตุผลในการตีกลับ..."
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        className="form-input"
                        rows={2}
                        style={{ resize: 'vertical' }}
                      />
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                      className="btn btn-primary"
                      onClick={() => handleVerify(c.id)}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <><span className="spinner" /> กำลังดำเนินการ...</>
                      ) : (
                        '✅ ผ่านการตรวจ'
                      )}
                    </button>

                    {isRejectMode ? (
                      <>
                        <button
                          className="btn btn-danger"
                          onClick={() => handleReject(c.id)}
                          disabled={isLoading}
                        >
                          ยืนยันตีกลับ
                        </button>
                        <button
                          className="btn btn-secondary"
                          onClick={() => {
                            setRejectReasonId(null)
                            setRejectReason('')
                          }}
                        >
                          ยกเลิก
                        </button>
                      </>
                    ) : (
                      <button
                        className="btn btn-danger"
                        onClick={() => setRejectReasonId(c.id)}
                        disabled={isLoading}
                      >
                        ❌ ตีกลับ
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </>
  )
}
