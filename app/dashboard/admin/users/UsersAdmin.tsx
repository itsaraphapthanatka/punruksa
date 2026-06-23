'use client'

import { useState, useTransition } from 'react'
import { setUserRole, setUserVerified } from '@/app/actions/admin-users'
import { USER_ROLES } from '@/lib/roles'

export interface UserRow {
  id: string
  full_name: string
  email: string
  role: string
  is_verified: boolean
  created_at: string
}

const ROLE_LABEL: Record<string, string> = {
  donor: 'ผู้บริจาค',
  caretaker: 'ผู้ดูแลสัตว์',
  clinic: 'คลินิก',
  approver: 'กรรมการ',
  admin: 'แอดมิน',
}

export function UsersAdmin({ users, q }: { users: UserRow[]; q: string }) {
  const [pending, startTransition] = useTransition()
  const [busyId, setBusyId] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [search, setSearch] = useState(q)

  const filtered = users.filter((u) => {
    if (!search.trim()) return true
    const s = search.toLowerCase()
    return u.full_name?.toLowerCase().includes(s) || u.email?.toLowerCase().includes(s)
  })

  function changeRole(id: string, role: string) {
    setBusyId(id)
    setMsg(null)
    startTransition(async () => {
      const r = await setUserRole(id, role)
      setBusyId(null)
      setMsg(r.error ? '❌ ' + r.error : '✅ เปลี่ยนบทบาทแล้ว')
    })
  }
  function toggleVerify(id: string, next: boolean) {
    setBusyId(id)
    setMsg(null)
    startTransition(async () => {
      const r = await setUserVerified(id, next)
      setBusyId(null)
      setMsg(r.error ? '❌ ' + r.error : next ? '✅ ยืนยันตัวตนแล้ว' : '✅ ยกเลิกการยืนยันแล้ว')
    })
  }

  return (
    <>
      {msg && <div style={{ marginBottom: 12, padding: '10px 14px', borderRadius: 10, background: '#eef0fd', color: '#41454d', fontWeight: 600, fontSize: 14 }}>{msg}</div>}

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="ค้นหาชื่อ / อีเมล"
        className="form-input"
        style={{ marginBottom: 16, maxWidth: 360 }}
      />

      <div className="glass-card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                {['ชื่อ', 'อีเมล', 'บทบาท', 'ยืนยันตัวตน'].map((h) => (
                  <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} style={{ borderBottom: '1px solid var(--color-border)', opacity: busyId === u.id && pending ? 0.5 : 1 }}>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{u.full_name || '—'}</td>
                  <td style={{ padding: '0.75rem 1rem', color: 'var(--color-text-secondary)' }}>{u.email}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <select
                      value={u.role}
                      disabled={pending}
                      onChange={(e) => changeRole(u.id, e.target.value)}
                      className="form-input"
                      style={{ padding: '6px 10px', fontSize: 13, width: 'auto' }}
                    >
                      {USER_ROLES.map((r) => (
                        <option key={r} value={r}>{ROLE_LABEL[r] || r}</option>
                      ))}
                    </select>
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <button
                      onClick={() => toggleVerify(u.id, !u.is_verified)}
                      disabled={pending}
                      style={{ padding: '6px 12px', borderRadius: 999, fontSize: 12.5, fontWeight: 700, cursor: 'pointer', border: '1px solid', borderColor: u.is_verified ? '#b7e4c7' : '#e3e4f0', background: u.is_verified ? '#e6f7ef' : '#fff', color: u.is_verified ? '#127a52' : '#838aa3' }}
                    >
                      {u.is_verified ? '✅ ยืนยันแล้ว' : '○ ยังไม่ยืนยัน'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div style={{ marginTop: 10, fontSize: 13, color: 'var(--color-text-muted)' }}>แสดง {filtered.length} จาก {users.length} คน</div>
    </>
  )
}
