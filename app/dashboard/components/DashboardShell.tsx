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
  { href: '/donate', label: '💜 บริจาค' },
  { href: '/dashboard/profile', label: 'โปรไฟล์' },
]

const adminNav = [
  { href: '/dashboard/admin/users', label: 'สมาชิก' },
  { href: '/dashboard/admin/verify', label: 'ตรวจเอกสาร' },
  { href: '/dashboard/admin/donations', label: 'บริจาคกองทุน' },
  { href: '/dashboard/admin/platform-donations', label: 'ค่าดูแลระบบ' },
  { href: '/dashboard/admin/sponsors', label: 'ผู้สนับสนุน' },
  { href: '/dashboard/admin/payments', label: 'จ่ายเงิน' },
  { href: '/dashboard/admin/visits', label: 'ผู้เข้าชม' },
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
  const isAdmin = user.role === 'admin'

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === href : pathname.startsWith(href)

  const navLink = (item: { href: string; label: string }) => (
    <Link key={item.href} href={item.href} className={`ds-link${isActive(item.href) ? ' active' : ''}`}>
      {item.label}
    </Link>
  )

  return (
    <div className="ds-shell">
      <style>{`
        .ds-shell{display:flex;min-height:100vh;background:var(--color-bg)}
        .ds-side{width:236px;flex-shrink:0;background:#fff;border-right:1px solid #ededf1;display:flex;flex-direction:column;position:sticky;top:0;height:100vh}
        .ds-brand{display:flex;align-items:center;gap:10px;padding:16px 16px 14px;border-bottom:1px solid #f1f2f7;color:var(--color-text)}
        .ds-brand:hover{color:var(--color-text)}
        .ds-nav{flex:1;overflow-y:auto;padding:10px}
        .ds-sec{font-size:11px;font-weight:700;color:var(--color-text-muted);letter-spacing:.5px;text-transform:uppercase;padding:16px 10px 6px}
        .ds-link{display:block;padding:9px 12px;border-radius:10px;font-weight:600;font-size:14px;color:#41454d;margin-bottom:2px}
        .ds-link:hover{background:#f1f2fb;color:var(--color-text)}
        .ds-link.active{background:var(--color-primary-50);color:var(--color-primary-light)}
        .ds-foot{border-top:1px solid #f1f2f7;padding:12px 14px;display:flex;align-items:center;gap:10px}
        .ds-main{flex:1;min-width:0;padding:30px 28px 90px;max-width:1200px}
        @media(max-width:860px){
          .ds-shell{flex-direction:column}
          .ds-side{width:100%;height:auto;position:static;border-right:none;border-bottom:1px solid #ededf1}
          .ds-nav{display:flex;flex-wrap:wrap;gap:4px}
          .ds-sec{width:100%;padding:8px 10px 2px}
          .ds-main{padding:20px 16px 70px}
        }
      `}</style>

      <aside className="ds-side">
        <Link href="/dashboard" className="ds-brand">
          <span className="app-brand-icon" style={{ background: '#fff', overflow: 'hidden' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.jpg" alt="ปันรักษา" width={38} height={38} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </span>
          <div>
            <div className="app-brand-name">ปันรักษา</div>
            <div className="app-brand-sub">กองทุนรักษาสัตว์</div>
          </div>
        </Link>

        <nav className="ds-nav">
          {baseNav.map(navLink)}
          {isAdmin && (
            <>
              <div className="ds-sec">ผู้ดูแลระบบ</div>
              {adminNav.map(navLink)}
            </>
          )}
        </nav>

        <div className="ds-foot">
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="app-user-name" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.fullName}</div>
            <span className={`badge badge-${user.role}`}>{roleLabels[user.role] || user.role}</span>
          </div>
          <form action={logout}>
            <button type="submit" className="app-logout">ออก</button>
          </form>
        </div>
      </aside>

      <main className="ds-main">{children}</main>
    </div>
  )
}
