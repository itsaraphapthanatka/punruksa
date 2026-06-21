'use client'

import { useActionState, useState } from 'react'
import { createCase } from '@/app/actions/cases'
import Link from 'next/link'

export default function NewCasePage() {
  const [state, formAction, pending] = useActionState(createCase, null)
  const [fileNames, setFileNames] = useState<string[]>([])
  const [mode, setMode] = useState<'normal' | 'emergency'>('normal')

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      setFileNames(Array.from(files).map((f) => f.name))
    }
  }

  return (
    <>
      <div className="dashboard-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
          <Link href="/dashboard/cases" className="btn btn-secondary" style={{ padding: '0.5rem 0.75rem', fontSize: '0.8125rem' }}>
            ← กลับ
          </Link>
          <h1>เปิดเคสใหม่</h1>
        </div>
        <p>กรอกข้อมูลสัตว์ที่ต้องการความช่วยเหลือค่ารักษา</p>
      </div>

      <div className="glass-card" style={{ padding: '2rem', maxWidth: 640 }}>
        {state?.error && (
          <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>
            <span>⚠️</span>
            {state.error}
          </div>
        )}

        <form action={formAction} className="auth-form">
          {/* Title */}
          <div className="form-group">
            <label htmlFor="title" className="form-label">
              หัวข้อเคส *
            </label>
            <input
              id="title"
              name="title"
              type="text"
              placeholder="เช่น สุนัขถูกรถชน ต้องผ่าตัดขา"
              className="form-input"
              required
              disabled={pending}
            />
          </div>

          {/* Animal Type */}
          <div className="form-group">
            <label htmlFor="animal_type" className="form-label">
              ชนิดสัตว์ *
            </label>
            <select
              id="animal_type"
              name="animal_type"
              className="form-input form-select"
              required
              disabled={pending}
            >
              <option value="">— เลือกชนิดสัตว์ —</option>
              <option value="สุนัข">🐕 สุนัข</option>
              <option value="แมว">🐈 แมว</option>
              <option value="นก">🐦 นก</option>
              <option value="กระต่าย">🐇 กระต่าย</option>
              <option value="สัตว์เลื้อยคลาน">🦎 สัตว์เลื้อยคลาน</option>
              <option value="อื่นๆ">🐾 อื่นๆ</option>
            </select>
          </div>

          {/* Symptoms */}
          <div className="form-group">
            <label htmlFor="symptoms" className="form-label">
              อาการ / รายละเอียด *
            </label>
            <textarea
              id="symptoms"
              name="symptoms"
              placeholder="อธิบายอาการของสัตว์ ประวัติการรักษา และสิ่งที่ต้องการความช่วยเหลือ..."
              className="form-input"
              rows={4}
              required
              disabled={pending}
              style={{ resize: 'vertical' }}
            />
          </div>

          {/* Clinic Name */}
          <div className="form-group">
            <label htmlFor="clinic_name" className="form-label">
              ชื่อคลินิก / โรงพยาบาลสัตว์
            </label>
            <input
              id="clinic_name"
              name="clinic_name"
              type="text"
              placeholder="ชื่อคลินิกที่รักษา"
              className="form-input"
              disabled={pending}
            />
          </div>

          {/* Requested Amount */}
          <div className="form-group">
            <label htmlFor="requested_amount" className="form-label">
              ยอดเงินที่ขอ (บาท) *
            </label>
            <input
              id="requested_amount"
              name="requested_amount"
              type="number"
              placeholder="0.00"
              className="form-input"
              min="1"
              step="0.01"
              required
              disabled={pending}
            />
          </div>

          {/* Mode */}
          <div className="form-group">
            <label className="form-label">โหมดเคส *</label>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <label
                style={{
                  flex: 1,
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  border: `2px solid ${mode === 'normal' ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  background: mode === 'normal' ? 'rgba(102, 126, 234, 0.1)' : 'transparent',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
                  textAlign: 'center',
                }}
              >
                <input
                  type="radio"
                  name="mode"
                  value="normal"
                  checked={mode === 'normal'}
                  onChange={() => setMode('normal')}
                  style={{ display: 'none' }}
                />
                <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>📋</div>
                <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>ปกติ</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                  โหวต 48 ชม.
                </div>
              </label>
              <label
                style={{
                  flex: 1,
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  border: `2px solid ${mode === 'emergency' ? '#f87171' : 'var(--color-border)'}`,
                  background: mode === 'emergency' ? 'rgba(248, 113, 113, 0.1)' : 'transparent',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
                  textAlign: 'center',
                }}
              >
                <input
                  type="radio"
                  name="mode"
                  value="emergency"
                  checked={mode === 'emergency'}
                  onChange={() => setMode('emergency')}
                  style={{ display: 'none' }}
                />
                <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>🚨</div>
                <div style={{ fontWeight: 600, fontSize: '0.875rem', color: mode === 'emergency' ? '#f87171' : undefined }}>
                  ฉุกเฉิน
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                  โหวต 4 ชม.
                </div>
              </label>
            </div>
          </div>

          {/* File Upload */}
          <div className="form-group">
            <label className="form-label">
              แนบรูปสัตว์ / บิลค่ารักษา
            </label>
            <label
              htmlFor="files"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '2rem',
                borderRadius: 'var(--radius-md)',
                border: '2px dashed var(--color-border)',
                background: 'var(--color-bg-input)',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
              }}
            >
              <span style={{ fontSize: '2rem' }}>📁</span>
              <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                คลิกเพื่อเลือกไฟล์ (รูปภาพ, PDF)
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                อัปโหลดได้หลายไฟล์
              </span>
              <input
                id="files"
                name="files"
                type="file"
                multiple
                accept="image/*,.pdf"
                onChange={handleFileChange}
                disabled={pending}
                style={{ display: 'none' }}
              />
            </label>
            {fileNames.length > 0 && (
              <div style={{ marginTop: '0.5rem' }}>
                {fileNames.map((name, i) => (
                  <div
                    key={i}
                    style={{
                      fontSize: '0.8125rem',
                      color: 'var(--color-success)',
                      padding: '0.25rem 0',
                    }}
                  >
                    ✓ {name}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={pending}
            style={{ marginTop: '0.5rem' }}
          >
            {pending ? (
              <>
                <span className="spinner" />
                กำลังส่งเคส...
              </>
            ) : (
              '📤 ส่งเคสเพื่อขอรับการสนับสนุน'
            )}
          </button>
        </form>
      </div>
    </>
  )
}
