import Link from 'next/link'
import type { Metadata } from 'next'
import { getLocale } from '@/lib/i18n'
import { dict } from '@/lib/dict'
import { NavMenu } from '../NavMenu'
import { SupportMethods } from './SupportMethods'
import { punpayConfigured, getPlatformSupport } from '@/lib/punpay'
import { punslipConfigured } from '@/lib/punslip'

export const metadata: Metadata = {
  title: 'สนับสนุนค่าดูแลระบบ — ปันรักษา',
  description: 'ปันรักษาเปิดให้ใช้ฟรี เงินบริจาคกองทุน 100% ไปค่ารักษาสัตว์ — ค่าดูแลระบบ (เซิร์ฟเวอร์ โดเมน ความปลอดภัย) มาจากผู้สนับสนุนที่สมัครใจ แยกบัญชีชัดเจน',
}

const card: React.CSSProperties = {
  background: '#fff', border: '1px solid #edeef7', borderRadius: 16, padding: 24, marginBottom: 18,
}

export default async function SupportPlatformPage() {
  const L = await getLocale()
  const d = dict[L]
  const punpayReady = punpayConfigured()
  const promptpay = process.env.PLATFORM_PROMPTPAY || null
  const promptpayName = process.env.PLATFORM_PROMPTPAY_NAME || null
  const slipReady = punslipConfigured() && Boolean(promptpay)
  const support = await getPlatformSupport(12)

  const fmtDate = (s: string) => {
    try { return new Date(s).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }) } catch { return '' }
  }

  const costs = [
    { icon: '🖥️', t: 'เซิร์ฟเวอร์ & โฮสติ้ง', s: 'ค่าเช่าเครื่อง ฐานข้อมูล และพื้นที่เก็บรูป/เอกสารเคส' },
    { icon: '🌐', t: 'โดเมน & ความปลอดภัย', s: 'ชื่อเว็บ ใบรับรอง SSL และการสำรองข้อมูล' },
    { icon: '💬', t: 'แจ้งเตือน LINE', s: 'ค่าส่งข้อความแจ้งเตือนกรรมการและผู้ใช้' },
    { icon: '🛠️', t: 'ดูแล & พัฒนาต่อเนื่อง', s: 'แก้บั๊ก ปรับปรุงระบบ และเพิ่มฟีเจอร์ใหม่' },
  ]

  return (
    <div style={{ background: '#f6f7f9', minHeight: '100vh' }}>
      {/* NAV */}
      <nav style={{ background: 'rgba(255,255,255,.92)', backdropFilter: 'blur(8px)', borderBottom: '1px solid #ededf1', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '0 20px', display: 'flex', alignItems: 'center', gap: 12, height: 62 }}>
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

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '32px 20px 70px' }}>
        {/* HERO */}
        <div style={{ textAlign: 'center', marginBottom: 26 }}>
          <div style={{ fontSize: 46, marginBottom: 6 }}>☕️</div>
          <h1 style={{ margin: 0, fontSize: 'clamp(24px,4vw,32px)', fontWeight: 800, letterSpacing: '-0.4px' }}>สนับสนุนค่าดูแลระบบ</h1>
          <p style={{ margin: '10px auto 0', maxWidth: 520, color: '#717892', fontSize: 15, lineHeight: 1.7 }}>
            ช่วยให้ <b>ปันรักษา</b> เปิดให้ทุกคนใช้ฟรีต่อไป — ค่าดูแลระบบเป็นคนละส่วนกับเงินกองทุนรักษาสัตว์
          </p>
        </div>

        {/* โปร่งใส: แยกเงิน 2 ก้อน */}
        <div style={{ ...card, background: 'linear-gradient(135deg,#ecfdf5,#f0fdf8)', border: '1px solid #b7ecd4' }}>
          <h2 style={{ margin: '0 0 12px', fontSize: 17, color: '#127a52' }}>🔒 แยกบัญชีชัดเจน โปร่งใส 100%</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 12 }}>
            <div style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', border: '1px solid #d7f0e3' }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#127a52', marginBottom: 4 }}>💜 กองทุนรักษาสัตว์</div>
              <div style={{ fontSize: 13.5, color: '#41454d', lineHeight: 1.6 }}>เงินบริจาคเข้ากองทุน <b>100% ไปค่ารักษาสัตว์</b> ที่ผ่านมติการสุ่มโหวต — ไม่หักเป็นค่าระบบแม้แต่บาทเดียว</div>
            </div>
            <div style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', border: '1px solid #d7f0e3' }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#5560d8', marginBottom: 4 }}>☕️ ค่าดูแลระบบ (หน้านี้)</div>
              <div style={{ fontSize: 13.5, color: '#41454d', lineHeight: 1.6 }}>เป็นการสนับสนุน <b>ค่าใช้จ่ายในการดำเนินงานแพลตฟอร์ม</b> โดยสมัครใจ <b>แยกบัญชี</b>จากกองทุน</div>
            </div>
          </div>
        </div>

        {/* ค่าดูแลระบบไปไหนบ้าง */}
        <div style={card}>
          <h2 style={{ margin: '0 0 14px', fontSize: 17 }}>เงินสนับสนุนนำไปใช้ทำอะไร</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 12 }}>
            {costs.map((c) => (
              <div key={c.t} style={{ display: 'flex', gap: 12, padding: '12px 14px', background: '#f7f8fe', border: '1px solid #ededf7', borderRadius: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0, boxShadow: '0 2px 6px rgba(102,126,234,.10)' }}>{c.icon}</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#1d2030' }}>{c.t}</div>
                  <div style={{ fontSize: 12.5, color: '#717892', lineHeight: 1.6, marginTop: 2 }}>{c.s}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* วิธีสนับสนุน — PunPay */}
        <div style={{ marginBottom: 18 }}>
          <h2 style={{ margin: '0 0 4px', fontSize: 17 }}>ร่วมสนับสนุนค่าดูแลระบบ</h2>
          <p style={{ fontSize: 13.5, color: '#717892', margin: '0 0 16px', lineHeight: 1.7 }}>
            เลือกจำนวนที่สะดวก แล้วชำระผ่านระบบที่ปลอดภัย — ทุกบาทมีค่ามาก 🙏
          </p>
          <SupportMethods slipReady={slipReady} punpayReady={punpayReady} promptpay={promptpay} promptpayName={promptpayName} />
        </div>

        {/* ผู้สนับสนุนค่าดูแลระบบ */}
        {support.count > 0 && (
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
              <h2 style={{ margin: 0, fontSize: 17 }}>🙏 ผู้สนับสนุนค่าดูแลระบบ</h2>
              <div style={{ fontSize: 13.5, color: '#717892' }}>
                รวม <b style={{ color: '#5560d8', fontSize: 16 }}>{support.total.toLocaleString()}</b> บาท · {support.count.toLocaleString()} ครั้ง
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {support.recent.map((sp, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 12px', background: '#f7f8fe', border: '1px solid #ededf7', borderRadius: 10 }}>
                  <span style={{ width: 34, height: 34, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0, boxShadow: '0 2px 6px rgba(102,126,234,.10)' }}>☕️</span>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#1d2030' }}>{sp.donor_name || 'ผู้สนับสนุนใจดี'}</div>
                    {sp.message && <div style={{ fontSize: 12.5, color: '#717892', lineHeight: 1.5, marginTop: 1 }}>“{sp.message}”</div>}
                    <div style={{ fontSize: 11.5, color: '#9aa0b8', marginTop: 2 }}>{fmtDate(sp.paid_at || sp.created_at)}</div>
                  </div>
                  <div style={{ fontWeight: 800, color: '#5560d8', fontSize: 15, whiteSpace: 'nowrap' }}>{Number(sp.amount).toLocaleString()} ฿</div>
                </div>
              ))}
            </div>
            <div style={{ textAlign: 'center', color: '#9aa0b8', fontSize: 12.5, marginTop: 12 }}>ขอบคุณทุกการสนับสนุนที่ช่วยให้ปันรักษาเดินต่อได้ 💜</div>
          </div>
        )}

        {/* CTA กลับไปบริจาคกองทุน */}
        <div style={{ textAlign: 'center', marginTop: 8 }}>
          <p style={{ fontSize: 13.5, color: '#717892', margin: '0 0 12px' }}>อยากช่วยน้องๆ โดยตรง? ร่วมบริจาคเข้ากองทุนรักษาสัตว์ได้ที่</p>
          <Link href="/donate" style={{ display: 'inline-block', background: '#667eea', color: '#fff', padding: '12px 26px', borderRadius: 12, fontWeight: 700, fontSize: 15 }}>💜 บริจาคเข้ากองทุน</Link>
        </div>
      </div>
    </div>
  )
}
