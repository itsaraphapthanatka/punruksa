import Link from 'next/link'
import { DonateForm } from './DonateForm'
import { getDonationsEnabled } from '@/lib/settings'
import { getLocale } from '@/lib/i18n'
import { dict } from '@/lib/dict'
import { NavMenu } from '../NavMenu'

export default async function PublicDonatePage() {
  const donationsEnabled = await getDonationsEnabled()
  const L = await getLocale()
  const d = dict[L]
  return (
    <div style={{ background: '#f6f7f9', minHeight: '100vh' }}>
      {/* NAV */}
      <nav style={{ background: 'rgba(255,255,255,.92)', backdropFilter: 'blur(8px)', borderBottom: '1px solid #ededf1' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto', padding: '0 22px', display: 'flex', alignItems: 'center', gap: 16, height: 64 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#26282e' }}>
            <span style={{ width: 34, height: 34, borderRadius: 10, background: '#fff', overflow: 'hidden', display: 'flex' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.jpg" alt="ปันรักษา" width={34} height={34} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </span>
            <span style={{ fontWeight: 800, fontSize: 17 }}>ปันรักษา</span>
          </Link>
          <NavMenu
            items={[
              { href: '/', label: d.nav.home },
              { href: '/cases', label: d.nav.cases },
              { href: '/#how', label: d.nav.how },
              { href: '/login', label: d.nav.login },
            ]}
            donateLabel={d.nav.donate}
            locale={L}
          />
        </div>
      </nav>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '32px 20px 60px' }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, letterSpacing: '-0.3px' }}>ร่วมบริจาคเข้ากองทุน</h1>
        <p style={{ margin: '6px 0 20px', color: '#838aa3', fontSize: 14.5, lineHeight: 1.7 }}>
          เงินบริจาคเข้า <b>กองกลาง</b> เพื่อช่วยเคสที่ผ่านการสุ่มโหวตอนุมัติ — โปร่งใส ตรวจสอบได้ · ไม่ต้องสมัครสมาชิก
        </p>

        {donationsEnabled ? (
          <DonateForm />
        ) : (
          <div style={{ background: '#fff', border: '1px solid #edeef7', borderRadius: 16, padding: 28, textAlign: 'center' }}>
            <div style={{ fontSize: 44, marginBottom: 8 }}>🙏</div>
            <h2 style={{ margin: 0, fontSize: 20 }}>ปิดรับบริจาคชั่วคราว</h2>
            <p style={{ color: '#717892', margin: '8px 0 16px', lineHeight: 1.7 }}>
              ขณะนี้เราปิดรับบริจาคเข้ากองกลางเป็นการชั่วคราว ขอบคุณสำหรับน้ำใจของทุกท่าน 💜<br />
              กรุณากลับมาใหม่อีกครั้ง
            </p>
            <Link href="/" style={{ color: '#5560d8', fontWeight: 700 }}>← กลับหน้าแรก</Link>
          </div>
        )}
      </div>
    </div>
  )
}
