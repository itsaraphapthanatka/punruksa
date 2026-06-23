'use client'

import { useState } from 'react'
import { finalizeVoteRound } from '@/app/actions/voting'

export interface OpenRound {
  id: string
  title: string
  mode: string
  required: number
  sampled: number
  voted: number
  approves: number
  closesAt: string
}

export function OpenRoundsAdmin({ rounds }: { rounds: OpenRound[] }) {
  const [busy, setBusy] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  if (!rounds.length) return null

  const now = Date.now()

  async function close(id: string) {
    if (!confirm('ปิดและสรุปผลรอบนี้เดี๋ยวนี้? (อนุมัติครบเกณฑ์ = ผ่าน, ไม่ครบ = ไม่ผ่าน)')) return
    setBusy(id)
    setMsg(null)
    const r = await finalizeVoteRound(id)
    setBusy(null)
    if (r.error) {
      setMsg('❌ ' + r.error)
    } else {
      setMsg('✅ สรุปผลแล้ว: ' + (r.result === 'passed' ? 'ผ่าน (อนุมัติเคส)' : 'ไม่ผ่าน'))
      location.reload()
    }
  }

  return (
    <div style={{ marginTop: 30 }}>
      <div className="dashboard-header" style={{ marginBottom: 12 }}>
        <h2 style={{ margin: 0, fontSize: 20 }}>🗳️ รอบโหวตที่เปิดอยู่ ({rounds.length})</h2>
        <p>ปิด/สรุปผลก่อนกำหนดได้ · รอบที่หมดเวลาจะถูกปิดอัตโนมัติทุก 5 นาทีอยู่แล้ว</p>
      </div>

      {msg && (
        <div style={{ marginBottom: 12, padding: '10px 14px', borderRadius: 10, background: '#eef0fd', color: '#41454d', fontWeight: 600, fontSize: 14 }}>{msg}</div>
      )}

      <div style={{ display: 'grid', gap: 12 }}>
        {rounds.map((r) => {
          const expired = new Date(r.closesAt).getTime() < now
          return (
            <div key={r.id} className="glass-card" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 220 }}>
                <div style={{ fontWeight: 700 }}>{r.title || r.id.slice(0, 8)} {r.mode === 'emergency' && '⚡'}</div>
                <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 4 }}>
                  อนุมัติ <b>{r.approves}/{r.required}</b> · โหวตแล้ว {r.voted}/{r.sampled} · ปิด {new Date(r.closesAt).toLocaleString('th-TH', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  {expired && <span style={{ color: '#c2410c', fontWeight: 700 }}> · หมดเวลาแล้ว</span>}
                </div>
              </div>
              <button
                onClick={() => close(r.id)}
                disabled={busy === r.id}
                style={{ padding: '10px 18px', borderRadius: 10, fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer', background: '#667eea', color: '#fff', opacity: busy === r.id ? 0.6 : 1 }}
              >
                {busy === r.id ? 'กำลังสรุป…' : 'สรุป/ปิดรอบ'}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
