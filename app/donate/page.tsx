import Link from 'next/link'
import { DonateForm } from './DonateForm'
import { getDonationsEnabled } from '@/lib/settings'

export default async function PublicDonatePage() {
  const donationsEnabled = await getDonationsEnabled()
  return (
    <div style={{ background: '#f6f7f9', minHeight: '100vh' }}>
      {/* NAV */}
      <nav style={{ background: 'rgba(255,255,255,.92)', backdropFilter: 'blur(8px)', borderBottom: '1px solid #ededf1' }}>
        <div style={{ maxWidth: 640, margin: '0 auto', padding: '0 20px', display: 'flex', alignItems: 'center', gap: 12, height: 62 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#26282e' }}>
            <span style={{ width: 34, height: 34, borderRadius: 10, background: '#667eea', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="19" height="19" viewBox="0 0 24 24" fill="#fff"><circle cx="6.5" cy="9" r="2.1" /><circle cx="11" cy="6.2" r="2.1" /><circle cx="16" cy="6.2" r="2.1" /><circle cx="20" cy="9.6" r="1.9" /><path d="M13 12c-2.3 0-3.7 1.5-4.8 2.9C7 16.4 5.4 17.4 5.4 19.2 5.4 20.8 6.7 22 8.4 22c1.3 0 2.4-.6 3.4-.6.9 0 2 .6 3.4.6 1.7 0 3-1.2 3-2.8 0-1.8-1.6-2.8-2.8-4.3C14.5 13.5 13.1 12 13 12z" /></svg>
            </span>
            <span style={{ fontWeight: 800, fontSize: 17 }}>ปันรักษา</span>
          </Link>
          <Link href="/" style={{ marginLeft: 'auto', color: '#41454d', fontWeight: 600, fontSize: 14.5 }}>← กลับหน้าแรก</Link>
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
