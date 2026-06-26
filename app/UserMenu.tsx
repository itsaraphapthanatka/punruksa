'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { logout } from '@/app/actions/auth'
import type { NavUser } from '@/lib/nav-user'

const roleLabels: Record<string, string> = {
  donor: 'ผู้บริจาค',
  caretaker: 'ผู้ดูแลสัตว์',
  clinic: 'คลินิก',
  approver: 'กรรมการ',
  admin: 'ผู้ดูแลระบบ',
}

export function UserMenu({ user }: { user: NavUser }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // ปิดเมื่อคลิกนอกเมนู
  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const initial = (user.name || '?').trim().charAt(0).toUpperCase()

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <style>{`
        .um-trigger{display:flex;align-items:center;gap:8px;background:transparent;border:1px solid #e3e4f0;border-radius:999px;padding:5px 12px 5px 6px;cursor:pointer;font-weight:700;font-size:14px;color:#26282e}
        .um-trigger:hover{background:#f1f2fb;border-color:#c9cdf2}
        .um-avatar{width:30px;height:30px;border-radius:50%;background:linear-gradient(135deg,#667eea,#5560d8);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:14px;flex-shrink:0}
        .um-name{max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .um-panel{position:absolute;top:calc(100% + 8px);right:0;width:260px;background:#fff;border:1px solid #ededf1;border-radius:14px;box-shadow:0 12px 40px rgba(20,22,40,.16);z-index:200;overflow:hidden;animation:umIn .14s ease-out}
        @keyframes umIn{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}
        .um-head{padding:14px 16px;border-bottom:1px solid #f1f2f7}
        .um-stat{display:flex;align-items:center;justify-content:space-between;padding:11px 16px;font-size:14px}
        .um-stat + .um-stat{border-top:1px solid #f6f7fb}
        .um-foot{border-top:1px solid #f1f2f7;padding:8px}
        .um-link{display:block;padding:10px 12px;border-radius:9px;font-weight:700;font-size:14px;color:#41454d;text-decoration:none}
        .um-link:hover{background:#f1f2fb;color:#5560d8}
        .um-logout{width:100%;text-align:left;padding:10px 12px;border-radius:9px;font-weight:700;font-size:14px;color:#c2410c;background:transparent;border:none;cursor:pointer}
        .um-logout:hover{background:#fdecec}
      `}</style>

      <button type="button" className="um-trigger" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-haspopup="menu">
        <span className="um-avatar">{initial}</span>
        <span className="um-name">{user.name}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ transition: 'transform .15s', transform: open ? 'rotate(180deg)' : 'none' }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className="um-panel" role="menu">
          <div className="um-head">
            <div style={{ fontWeight: 800, fontSize: 15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</div>
            <div style={{ fontSize: 12.5, color: '#838aa3', fontWeight: 600, marginTop: 2 }}>{roleLabels[user.role] || user.role}</div>
          </div>

          <div className="um-stat">
            <span style={{ color: '#717892' }}>💜 ยอดบริจาครวม</span>
            <b style={{ color: '#5560d8' }}>{user.totalDonated.toLocaleString()} ฿</b>
          </div>
          <div className="um-stat">
            <span style={{ color: '#717892' }}>🗳️ เป็นกรรมการ</span>
            <b style={{ color: '#26282e' }}>{user.casesVoted.toLocaleString()} เคส</b>
          </div>

          <div className="um-foot">
            <Link href="/dashboard" className="um-link" onClick={() => setOpen(false)}>📊 แดชบอร์ด</Link>
            <form action={logout}>
              <input type="hidden" name="redirectTo" value="/" />
              <button type="submit" className="um-logout">↩ ออกจากระบบ</button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
