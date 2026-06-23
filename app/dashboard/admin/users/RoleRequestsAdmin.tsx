'use client'

import { useState, useTransition } from 'react'
import { approveRoleRequest, rejectRoleRequest } from '@/app/actions/admin-users'

export interface RoleReq {
  id: string
  userName: string
  email: string
  requestedRole: string
}

export function RoleRequestsAdmin({ requests }: { requests: RoleReq[] }) {
  const [busy, startT] = useTransition()
  const [msg, setMsg] = useState<string | null>(null)
  if (!requests.length) return null

  function act(id: string, kind: 'approve' | 'reject') {
    setMsg(null)
    startT(async () => {
      const r = kind === 'approve' ? await approveRoleRequest(id) : await rejectRoleRequest(id)
      if (r.error) setMsg('❌ ' + r.error)
      else {
        setMsg(kind === 'approve' ? '✅ อนุมัติเป็นกรรมการแล้ว' : '✅ ปฏิเสธแล้ว')
        location.reload()
      }
    })
  }

  return (
    <div className="glass-card" style={{ padding: 16, marginBottom: 20, borderColor: '#ffe6a8' }}>
      <div style={{ fontWeight: 800, marginBottom: 10 }}>🙋 คำขอเป็นกรรมการ ({requests.length})</div>
      {msg && <div style={{ marginBottom: 10, fontSize: 14, fontWeight: 600 }}>{msg}</div>}
      <div style={{ display: 'grid', gap: 10 }}>
        {requests.map((r) => (
          <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', borderTop: '1px solid var(--color-border)', paddingTop: 10 }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontWeight: 700 }}>{r.userName}</div>
              <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{r.email} · ขอเป็น {r.requestedRole === 'approver' ? 'กรรมการ' : r.requestedRole}</div>
            </div>
            <button onClick={() => act(r.id, 'approve')} disabled={busy} style={{ padding: '7px 14px', borderRadius: 9, fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer', background: '#127a52', color: '#fff' }}>อนุมัติ</button>
            <button onClick={() => act(r.id, 'reject')} disabled={busy} style={{ padding: '7px 14px', borderRadius: 9, fontWeight: 700, fontSize: 13, border: '1px solid #e3e4f0', cursor: 'pointer', background: '#fff', color: '#838aa3' }}>ปฏิเสธ</button>
          </div>
        ))}
      </div>
    </div>
  )
}
