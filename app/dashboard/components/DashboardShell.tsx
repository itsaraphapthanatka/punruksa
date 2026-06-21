'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/app/actions/auth'

interface UserProfile {
  id: string
  fullName: string
  email: string
  role: string
}

const roleLabels: Record<string, string> = {
  donor: 'ผู้บริจาค',
  caretaker: 'ผู้ดูแลสัตว์',
  clinic: 'คลินิก',
  approver: 'ผู้อนุมัติ',
  admin: 'ผู้ดูแลระบบ',
}

const baseNav = [
  { href: '/dashboard', label: 'หน้าหลัก' },
  { href: '/dashboard/cases', label: 'รายการเคส' },
  { href: '/dashboard/cases/new', label: 'เปิดเคส' },
  { href: '/dashboard/vote', label: 'ห้องโหวต' },
  { href: '/dashboard/donate', label: '💜 บริจาค' },
]

const adminNav = [
  { href: '/dashboard/admin/verify', label: 'ตรวจเอกสาร' },
  { href: '/dashboard/admin/payments', label: 'จ่ายเงิน' },
  { href: '/dashboard/admin/audit', label: 'Audit' },
]

export function DashboardShell({
  user,
  children,
}: {
  user: UserProfile
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const nav = user.role === 'admin' ? [...baseNav, ...adminNav] : baseNav

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === href : pathname.startsWith(href)

  return (
    <div>
      <header className="app-header">
        <div className="app-header-inner">
          <Link href="/dashboard" className="app-brand">
            <div className="app-brand-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff">
                <circle cx="6.5" cy="9" r="2.1" />
                <circle cx="11" cy="6.2" r="2.1" />
                <circle cx="16" cy="6.2" r="2.1" />
                <circle cx="20" cy="9.6" r="1.9" />
                <path d="M13 12c-2.3 0-3.7 1.5-4.8 2.9C7 16.4 5.4 17.4 5.4 19.2 5.4 20.8 6.7 22 8.4 22c1.3 0 2.4-.6 3.4-.6.9 0 2 .6 3.4.6 1.7 0 3-1.2 3-2.8 0-1.8-1.6-2.8-2.8-4.3C14.5 13.5 13.1 12 13 12z" />
              </svg>
            </div>
            <div>
              <div className="app-brand-name">ปันรักษา</div>
              <div className="app-brand-sub">กองทุนรักษาสัตว์ · โปร่งใส ตรวจสอบได้</div>
            </div>
            <span className="app-badge-mvp">MVP</span>
          </Link>

          <nav className="app-nav">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={isActive(item.href) ? 'active' : ''}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="app-user">
            <div className="app-user-meta">
              <span className="app-user-name">{user.fullName}</span>
              <span className={`badge badge-${user.role}`}>
                {roleLabels[user.role] || user.role}
              </span>
            </div>
            <form action={logout}>
              <button type="submit" className="app-logout">
                ออก
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="app-main">{children}</main>
    </div>
  )
}
