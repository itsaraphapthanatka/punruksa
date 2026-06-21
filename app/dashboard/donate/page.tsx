import { getImpactStats } from '@/lib/stats'
import { DonateClient } from './DonateClient'

export default async function DonatePage() {
  const s = await getImpactStats()
  const stat = (v: string, l: string, color = '#1d2030') => (
    <div style={{ background: '#fff', border: '1px solid #edeef7', borderRadius: 15, padding: '16px 18px' }}>
      <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.5px', color }}>{v}</div>
      <div style={{ fontSize: 13, color: '#838aa3', fontWeight: 600, marginTop: 2 }}>{l}</div>
    </div>
  )

  return (
    <div style={{ maxWidth: 620 }}>
      <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, letterSpacing: '-0.3px' }}>สนับสนุนกองทุน</h1>
      <p style={{ margin: '4px 0 20px', color: '#838aa3', fontSize: 14 }}>
        เงินบริจาคเข้า <b>กองกลาง</b> เพื่อช่วยเคสที่ผ่านการสุ่มโหวตอนุมัติ — โปร่งใส ตรวจสอบได้
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12, marginBottom: 20 }}>
        {stat(`${s.totalDonated.toLocaleString()} ฿`, 'ยอดกองทุน (เดโม)', '#5560d8')}
        {stat(String(s.donorCount), 'ผู้บริจาค')}
        {stat(String(s.donationCount), 'ครั้งที่บริจาค')}
      </div>

      <DonateClient />
    </div>
  )
}
