'use client'

import { useActionState, useEffect, useState, useTransition, type CSSProperties } from 'react'
import { createSponsor, updateSponsor, toggleSponsorActive, deleteSponsor } from '@/app/actions/sponsors'
import { CATEGORY_LABELS, SPONSOR_CATEGORIES, monogram } from '@/lib/sponsors'
import type { SponsorRow } from '@/lib/sponsors-data'

const label: CSSProperties = { display: 'block', fontWeight: 700, fontSize: 13, marginBottom: 5 }

function catLabel(c?: string) {
  if (!c) return '—'
  const info = CATEGORY_LABELS[c as keyof typeof CATEGORY_LABELS]
  return info ? `${info.icon} ${info.th}` : c
}

// ฟอร์มใช้ร่วมกันทั้ง "เพิ่ม" และ "แก้ไข"
function SponsorForm({
  initial,
  onDone,
}: {
  initial?: SponsorRow
  onDone?: () => void
}) {
  const action = initial ? updateSponsor : createSponsor
  const [state, formAction, pending] = useActionState(action, null)
  const s = state as { success?: boolean; error?: string } | null

  useEffect(() => {
    if (s?.success) onDone?.()
  }, [s]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <form action={formAction} style={{ display: 'grid', gap: 12 }}>
      {initial && <input type="hidden" name="id" value={initial.id} />}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={label}>ชื่อผู้สนับสนุน *</label>
          <input name="name" required defaultValue={initial?.name} disabled={pending} className="form-input" />
        </div>
        <div>
          <label style={label}>หมวด</label>
          <select name="category" defaultValue={initial?.category || ''} disabled={pending} className="form-input">
            <option value="">— ไม่ระบุ —</option>
            {SPONSOR_CATEGORIES.map((c) => (
              <option key={c} value={c}>{CATEGORY_LABELS[c].icon} {CATEGORY_LABELS[c].th}</option>
            ))}
          </select>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
        <div>
          <label style={label}>ลิงก์เว็บไซต์ (ไม่บังคับ)</label>
          <input name="url" type="url" defaultValue={initial?.url} disabled={pending} className="form-input" placeholder="https://example.com" />
        </div>
        <div>
          <label style={label}>ลำดับการแสดง</label>
          <input name="sort_order" type="number" defaultValue={initial?.sort_order ?? 0} disabled={pending} className="form-input" />
        </div>
      </div>
      <div>
        <label style={label}>โลโก้ {initial ? '(เว้นว่าง = ใช้รูปเดิม)' : '(PNG/JPG/WebP/SVG ≤ 5MB)'}</label>
        <input name="logo" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" disabled={pending} className="form-input" />
      </div>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, fontSize: 14 }}>
        <input type="checkbox" name="is_active" defaultChecked={initial ? initial.is_active : true} disabled={pending} />
        แสดงบนหน้าเว็บ
      </label>

      {s?.error && <div className="alert alert-error"><span>⚠️</span> {s.error}</div>}

      <div style={{ display: 'flex', gap: 10 }}>
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? <><span className="spinner" /> กำลังบันทึก…</> : initial ? 'บันทึกการแก้ไข' : '+ เพิ่มผู้สนับสนุน'}
        </button>
        {initial && onDone && (
          <button type="button" className="btn btn-secondary" onClick={onDone} disabled={pending}>ยกเลิก</button>
        )}
      </div>
    </form>
  )
}

export function SponsorsAdmin({ sponsors }: { sponsors: SponsorRow[] }) {
  const [showAdd, setShowAdd] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const [busyId, setBusyId] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)

  const toggle = (id: string, next: boolean) => {
    setBusyId(id); setMsg(null)
    startTransition(async () => {
      const r = await toggleSponsorActive(id, next)
      setBusyId(null)
      if (r?.error) setMsg('❌ ' + r.error)
    })
  }
  const remove = (id: string, name: string) => {
    if (!confirm(`ลบผู้สนับสนุน "${name}" ?`)) return
    setBusyId(id); setMsg(null)
    startTransition(async () => {
      const r = await deleteSponsor(id)
      setBusyId(null)
      if (r?.error) setMsg('❌ ' + r.error)
    })
  }

  return (
    <>
      {msg && <div style={{ marginBottom: 12, padding: '10px 14px', borderRadius: 10, background: '#fdecec', color: '#c2410c', fontWeight: 600, fontSize: 14 }}>{msg}</div>}

      <div style={{ marginBottom: 16 }}>
        {showAdd ? (
          <div className="glass-card" style={{ padding: 18 }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 16 }}>เพิ่มผู้สนับสนุนใหม่</h3>
            <SponsorForm onDone={() => setShowAdd(false)} />
            <button type="button" className="btn btn-secondary" style={{ marginTop: 10 }} onClick={() => setShowAdd(false)}>ปิด</button>
          </div>
        ) : (
          <button type="button" className="btn btn-primary" onClick={() => setShowAdd(true)}>+ เพิ่มผู้สนับสนุน</button>
        )}
      </div>

      {sponsors.length === 0 ? (
        <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🤝</div>
          <h2>ยังไม่มีผู้สนับสนุน</h2>
          <p style={{ color: 'var(--color-text-muted)', marginTop: 8 }}>กดปุ่ม “เพิ่มผู้สนับสนุน” เพื่อเริ่มต้น</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {sponsors.map((sp) => (
            <div key={sp.id} className="glass-card" style={{ padding: 14 }}>
              {editId === sp.id ? (
                <SponsorForm initial={sp} onDone={() => setEditId(null)} />
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                  <div style={{ width: 52, height: 52, borderRadius: 12, overflow: 'hidden', flexShrink: 0, background: 'linear-gradient(135deg,#eef0fd,#f6f7ff)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {sp.logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={sp.logo} alt={sp.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ fontWeight: 800, color: '#5560d8', fontSize: 18 }}>{monogram(sp.name)}</span>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 150 }}>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{sp.name}</div>
                    <div style={{ fontSize: 12.5, color: 'var(--color-text-muted)', fontWeight: 600 }}>
                      {catLabel(sp.category)} · ลำดับ {sp.sort_order}
                      {sp.url ? <> · <a href={sp.url} target="_blank" rel="noopener noreferrer" style={{ color: '#5560d8' }}>เว็บไซต์ ↗</a></> : null}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggle(sp.id, !sp.is_active)}
                    disabled={pending && busyId === sp.id}
                    style={{ padding: '6px 12px', borderRadius: 999, fontSize: 12.5, fontWeight: 700, cursor: 'pointer', border: '1px solid', borderColor: sp.is_active ? '#b7e4c7' : '#e3e4f0', background: sp.is_active ? '#e6f7ef' : '#fff', color: sp.is_active ? '#127a52' : '#838aa3' }}
                  >
                    {sp.is_active ? '✅ แสดงอยู่' : '○ ซ่อนอยู่'}
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={() => setEditId(sp.id)}>แก้ไข</button>
                  <button type="button" className="btn btn-danger" onClick={() => remove(sp.id, sp.name)} disabled={pending && busyId === sp.id}>ลบ</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  )
}
