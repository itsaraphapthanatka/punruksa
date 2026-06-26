'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { LanguageSwitcher } from './LanguageSwitcher'
import { UserMenu } from './UserMenu'
import { logout } from '@/app/actions/auth'
import type { Locale } from '@/lib/i18n'
import type { NavUser } from '@/lib/nav-user'

interface NavItem {
  href: string
  label: string
}

interface Props {
  items: NavItem[]
  donateLabel: string
  locale: Locale
  user?: NavUser | null
}

export function NavMenu({ items, donateLabel, locale, user }: Props) {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  // portal target available only after mount (avoid SSR document access)
  useEffect(() => {
    setMounted(true)
  }, [])

  // close drawer when screen becomes desktop-sized
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth > 760) setOpen(false)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // lock body scroll while drawer open
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = prev
      }
    }
  }, [open])

  // close on Escape
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <>
      <style>{`
        .nav-right-desktop { margin-left:auto; display:flex; align-items:center; gap:20px; }
        .nav-hamburger { display:none; margin-left:auto; background:transparent; border:none; cursor:pointer; padding:8px; border-radius:10px; color:#41454d; }
        .nav-hamburger:hover { background:#f1f2fb; }
        @media (max-width: 760px) {
          .nav-right-desktop { display:none; }
          .nav-hamburger { display:inline-flex; align-items:center; justify-content:center; }
        }
        .nav-overlay { position:fixed; inset:0; background:rgba(20,22,40,.45); backdrop-filter:blur(2px); z-index:100; animation:navFade .16s ease-out; }
        .nav-drawer { position:fixed; top:0; right:0; bottom:0; width:min(86vw,340px); background:#fff; box-shadow:-12px 0 40px rgba(0,0,0,.18); z-index:101; display:flex; flex-direction:column; animation:navSlide .22s cubic-bezier(.4,0,.2,1); }
        @keyframes navFade { from{opacity:0} to{opacity:1} }
        @keyframes navSlide { from{transform:translateX(100%)} to{transform:translateX(0)} }
        .nav-drawer-head { display:flex; align-items:center; justify-content:space-between; padding:18px 18px 12px; border-bottom:1px solid #ededf1; }
        .nav-drawer-close { background:#f1f2fb; border:none; width:36px; height:36px; border-radius:10px; cursor:pointer; display:inline-flex; align-items:center; justify-content:center; color:#41454d; }
        .nav-drawer-close:hover { background:#e3e4f0; }
        .nav-drawer-body { flex:1; padding:14px; display:flex; flex-direction:column; gap:4px; overflow-y:auto; }
        .nav-drawer-link { display:block; padding:13px 14px; border-radius:11px; font-weight:700; font-size:15px; color:#26282e; text-decoration:none; }
        .nav-drawer-link:hover { background:#f1f2fb; color:var(--coral); }
        .nav-drawer-foot { padding:14px 18px 22px; border-top:1px solid #ededf1; display:flex; flex-direction:column; gap:12px; }
      `}</style>

      {/* DESKTOP — inline (>760px) */}
      <div className="nav-right-desktop">
        {items.map((it) => (
          <Link key={it.href} href={it.href} className="navlink">{it.label}</Link>
        ))}
        <LanguageSwitcher locale={locale} />
        <Link
          href="/donate"
          className="btnCoral"
          style={{ padding: '9px 20px', borderRadius: 10, fontWeight: 700, fontSize: 14.5 }}
        >
          {donateLabel}
        </Link>
        {user && <UserMenu user={user} />}
      </div>

      {/* MOBILE — hamburger */}
      <button
        type="button"
        className="nav-hamburger"
        onClick={() => setOpen(true)}
        aria-label="เปิดเมนู"
        aria-expanded={open}
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {/* DRAWER — portaled to <body> so position:fixed escapes the nav's backdrop-filter containing block */}
      {open && mounted && createPortal(
        <>
          <div className="nav-overlay" onClick={() => setOpen(false)} />
          <aside className="nav-drawer" role="dialog" aria-modal="true" aria-label="เมนู">
            <div className="nav-drawer-head">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 32, height: 32, borderRadius: 9, overflow: 'hidden', background: '#fff', display: 'flex' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/logo.jpg" alt="ปันรักษา" width={32} height={32} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </span>
                <span style={{ fontWeight: 800, fontSize: 16 }}>ปันรักษา</span>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label="ปิดเมนู" className="nav-drawer-close">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="nav-drawer-body">
              {items.map((it) => (
                <Link
                  key={it.href}
                  href={it.href}
                  className="nav-drawer-link"
                  onClick={() => setOpen(false)}
                >
                  {it.label}
                </Link>
              ))}
            </div>

            <div className="nav-drawer-foot">
              {user && (
                <div style={{ background: '#f6f7fb', borderRadius: 12, padding: '12px 14px' }}>
                  <div style={{ fontWeight: 800, fontSize: 15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, marginTop: 8 }}>
                    <span style={{ color: '#717892' }}>💜 ยอดบริจาครวม</span>
                    <b style={{ color: '#5560d8' }}>{user.totalDonated.toLocaleString()} ฿</b>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, marginTop: 6 }}>
                    <span style={{ color: '#717892' }}>🗳️ เป็นกรรมการ</span>
                    <b>{user.casesVoted.toLocaleString()} เคส</b>
                  </div>
                  <Link
                    href="/dashboard"
                    onClick={() => setOpen(false)}
                    style={{ display: 'block', textAlign: 'center', marginTop: 12, padding: '10px', borderRadius: 10, fontWeight: 700, fontSize: 14, background: '#fff', border: '1px solid #e3e4f0', color: '#41454d' }}
                  >
                    📊 แดชบอร์ด
                  </Link>
                  <form action={logout}>
                    <input type="hidden" name="redirectTo" value="/" />
                    <button type="submit" style={{ width: '100%', marginTop: 8, padding: '10px', borderRadius: 10, fontWeight: 700, fontSize: 14, background: '#fdecec', border: 'none', color: '#c2410c', cursor: 'pointer' }}>
                      ↩ ออกจากระบบ
                    </button>
                  </form>
                </div>
              )}
              <LanguageSwitcher locale={locale} />
              <Link
                href="/donate"
                className="btnCoral"
                style={{ display: 'block', textAlign: 'center', padding: '13px 22px', borderRadius: 11, fontWeight: 700, fontSize: 15 }}
                onClick={() => setOpen(false)}
              >
                {donateLabel}
              </Link>
            </div>
          </aside>
        </>,
        document.body
      )}
    </>
  )
}
