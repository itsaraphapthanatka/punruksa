'use client'

import { useState } from 'react'
import { submitVote } from '@/app/actions/vote-submit'

interface CaseDoc {
  id: string
  doc_type: string
  file_url: string
}

interface VoteCase {
  assignmentId: string
  voteRoundId: string
  closesAt: string
  requiredApprovals: number
  sampledCount: number
  approveCount: number
  totalVotes: number
  caseData: {
    id: string
    title: string
    animalType: string
    symptoms: string
    clinicName: string | null
    requestedAmount: number
    mode: string
    createdAt: string
  } | null
  documents: CaseDoc[]
}

export function VoteClient({ cases }: { cases: VoteCase[] }) {
  const [loading, setLoading] = useState<string | null>(null)
  const [reasons, setReasons] = useState<Record<string, string>>({})
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [votedRounds, setVotedRounds] = useState<Set<string>>(new Set())

  const handleVote = async (voteRoundId: string, decision: 'approve' | 'reject') => {
    const reason = reasons[voteRoundId]
    if (!reason?.trim()) {
      setMessage({ type: 'error', text: 'กรุณาระบุเหตุผลก่อนโหวต (บังคับ)' })
      return
    }

    setLoading(voteRoundId)
    setMessage(null)
    const result = await submitVote(voteRoundId, decision, reason)
    setLoading(null)

    if (result.error) {
      setMessage({ type: 'error', text: result.error })
    } else {
      setMessage({ type: 'success', text: `บันทึกโหวต "${decision === 'approve' ? 'อนุมัติ' : 'ไม่อนุมัติ'}" เรียบร้อย` })
      setVotedRounds((prev) => new Set(prev).add(voteRoundId))
    }
  }

  const getTimeRemaining = (closesAt: string) => {
    const diff = new Date(closesAt).getTime() - Date.now()
    if (diff <= 0) return 'หมดเวลาแล้ว'
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours} ชม. ${minutes} นาที`
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

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {cases.map((c) => {
          if (!c.caseData || votedRounds.has(c.voteRoundId)) return null
          const isLoading = loading === c.voteRoundId
          const progress = c.requiredApprovals > 0
            ? Math.min((c.approveCount / c.requiredApprovals) * 100, 100)
            : 0

          return (
            <div key={c.voteRoundId} className="glass-card" style={{ overflow: 'hidden' }}>
              {/* Header with timer */}
              <div style={{
                padding: '1rem 1.5rem',
                background: c.caseData.mode === 'emergency'
                  ? 'rgba(248, 113, 113, 0.08)'
                  : 'rgba(102, 126, 234, 0.08)',
                borderBottom: '1px solid var(--color-border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.5rem',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{
                    padding: '0.25rem 0.5rem',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.6875rem',
                    fontWeight: 700,
                    background: c.caseData.mode === 'emergency' ? 'rgba(248, 113, 113, 0.15)' : 'rgba(102, 126, 234, 0.15)',
                    color: c.caseData.mode === 'emergency' ? '#f87171' : 'var(--color-primary-light)',
                  }}>
                    {c.caseData.mode === 'emergency' ? '🚨 ฉุกเฉิน' : '📋 ปกติ'}
                  </span>
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                  ⏱️ เหลือเวลา: <strong style={{ color: 'var(--color-warning)' }}>{getTimeRemaining(c.closesAt)}</strong>
                </div>
              </div>

              {/* Case Details — PDPA compliant (no owner info) */}
              <div style={{ padding: '1.5rem' }}>
                <h3 style={{ marginBottom: '1rem', fontSize: '1.125rem' }}>{c.caseData.title}</h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>ชนิดสัตว์</div>
                    <div>🐾 {c.caseData.animalType}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>ยอดที่ขอ</div>
                    <div style={{ fontWeight: 700, color: 'var(--color-primary-light)' }}>
                      ฿{Number(c.caseData.requestedAmount).toLocaleString('th-TH')}
                    </div>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>อาการ</div>
                    <div style={{ lineHeight: 1.7 }}>{c.caseData.symptoms}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>คลินิก</div>
                    <div>{c.caseData.clinicName || '—'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>เจ้าของสัตว์</div>
                    <div style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                      🔒 ปิดบังตาม PDPA
                    </div>
                  </div>
                </div>

                {/* Documents */}
                {c.documents.length > 0 && (
                  <div style={{ marginBottom: '1.25rem' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
                      📎 เอกสาร ({c.documents.length} ไฟล์)
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {c.documents.map((doc) => (
                        <a
                          key={doc.id}
                          href={doc.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            padding: '0.5rem 0.75rem',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--color-border)',
                            background: 'var(--color-bg-input)',
                            fontSize: '0.8125rem',
                            textDecoration: 'none',
                            color: 'var(--color-text)',
                          }}
                        >
                          {doc.doc_type === 'photo' ? '🖼️ รูป' : doc.doc_type === 'bill' ? '🧾 บิล' : '📋 ใบประเมิน'}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Vote Progress Bar */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '0.5rem' }}>
                    <span>ความคืบหน้า: {c.approveCount}/{c.requiredApprovals} เสียงอนุมัติ</span>
                    <span style={{ color: 'var(--color-text-muted)' }}>{c.totalVotes}/{c.sampledCount} คนโหวตแล้ว</span>
                  </div>
                  <div style={{
                    width: '100%',
                    height: 8,
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--color-bg-input)',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      width: `${progress}%`,
                      height: '100%',
                      background: 'var(--gradient-primary)',
                      borderRadius: 'var(--radius-full)',
                      transition: 'width var(--transition-base)',
                    }} />
                  </div>
                </div>

                {/* Reason (mandatory) */}
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label className="form-label">
                    เหตุผล * <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>(บังคับกรอก)</span>
                  </label>
                  <textarea
                    placeholder="พิมพ์เหตุผลของคุณก่อนกดโหวต..."
                    className="form-input"
                    rows={2}
                    value={reasons[c.voteRoundId] || ''}
                    onChange={(e) => setReasons((prev) => ({ ...prev, [c.voteRoundId]: e.target.value }))}
                    disabled={isLoading}
                    style={{ resize: 'vertical' }}
                  />
                </div>

                {/* Vote Buttons */}
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    className="btn btn-primary"
                    onClick={() => handleVote(c.voteRoundId, 'approve')}
                    disabled={isLoading}
                    style={{ flex: 1 }}
                  >
                    {isLoading ? <span className="spinner" /> : '✅ อนุมัติ'}
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={() => handleVote(c.voteRoundId, 'reject')}
                    disabled={isLoading}
                    style={{ flex: 1 }}
                  >
                    {isLoading ? <span className="spinner" /> : '❌ ไม่อนุมัติ'}
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
