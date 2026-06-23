'use client'

import { useActionState, useState, useTransition } from 'react'
import { updateProfile, changePassword, requestApproverRole } from '@/app/actions/profile'

const card: React.CSSProperties = { background: '#fff', border: '1px solid #edeef7', borderRadius: 16, padding: 22, marginBottom: 18 }
const label: React.CSSProperties = { display: 'block', fontWeight: 700, fontSize: 13, marginBottom: 6 }

const ROLE_LABEL: Record<string, string> = {
  donor: 'ผู้บริจาค', caretaker: 'ผู้ดูแลสัตว์', clinic: 'คลินิก', approver: 'กรรมการ', admin: 'แอดมิน',
}

export function ProfileClient({
  profile,
  pendingRequest,
}: {
  profile: { full_name: string; phone: string; email: string; role: string; is_verified: boolean }
  pendingRequest: boolean
}) {
  const [pState, pAction, pPending] = useActionState(updateProfile, null)
  const [pwState, pwAction, pwPending] = useActionState(changePassword, null)
  const [reqBusy, startReq] = useTransition()
  const [reqMsg, setReqMsg] = useState<string | null>(pendingRequest ? 'มีคำขอรออนุมัติอยู่' : null)
  const [requested, setRequested] = useState(pendingRequest)

  function doRequest() {
    startReq(async () => {
      const r = await requestApproverRole()
      if (r.error) setReqMsg('❌ ' + r.error)
      else { setReqMsg('✅ ' + (r.msg || 'ส่งคำขอแล้ว')); setRequested(true) }
    })
  }

  const canRequest = profile.role === 'donor' || profile.role === 'caretaker' || profile.role === 'clinic'

  return (
    <div style={{ maxWidth: 560 }}>
      {/* ข้อมูลบัญชี */}
      <div style={card}>
        <h2 style={{ margin: '0 0 4px', fontSize: 17 }}>ข้อมูลบัญชี</h2>
        <div style={{ fontSize: 13.5, color: '#717892', marginBottom: 16 }}>
          {profile.email} · บทบาท: <b>{ROLE_LABEL[profile.role] || profile.role}</b> {profile.is_verified ? '· ✅ ยืนยันตัวตนแล้ว' : ''}
        </div>
        <form action={pAction}>
          <label style={label}>ชื่อ-นามสกุล *</label>
          <input name="full_name" defaultValue={profile.full_name} required disabled={pPending} className="form-input" style={{ marginBottom: 12 }} />
          <label style={label}>เบอร์โทร</label>
          <input name="phone" defaultValue={profile.phone} disabled={pPending} className="form-input" style={{ marginBottom: 12 }} inputMode="tel" />
          {pState?.error && <div className="alert alert-error" style={{ marginBottom: 10 }}><span>⚠️</span> {pState.error}</div>}
          {pState?.success && <div className="alert alert-success" style={{ marginBottom: 10 }}><span>✅</span> {pState.msg}</div>}
          <button type="submit" className="btn btn-primary btn-sm" disabled={pPending}>{pPending ? 'กำลังบันทึก...' : 'บันทึกโปรไฟล์'}</button>
        </form>
      </div>

      {/* เปลี่ยนรหัสผ่าน */}
      <div style={card}>
        <h2 style={{ margin: '0 0 14px', fontSize: 17 }}>เปลี่ยนรหัสผ่าน</h2>
        <form action={pwAction}>
          <label style={label}>รหัสผ่านใหม่</label>
          <input name="password" type="password" required disabled={pwPending} className="form-input" style={{ marginBottom: 12 }} autoComplete="new-password" />
          <label style={label}>ยืนยันรหัสผ่านใหม่</label>
          <input name="password2" type="password" required disabled={pwPending} className="form-input" style={{ marginBottom: 12 }} autoComplete="new-password" />
          {pwState?.error && <div className="alert alert-error" style={{ marginBottom: 10 }}><span>⚠️</span> {pwState.error}</div>}
          {pwState?.success && <div className="alert alert-success" style={{ marginBottom: 10 }}><span>✅</span> {pwState.msg}</div>}
          <button type="submit" className="btn btn-primary btn-sm" disabled={pwPending}>{pwPending ? 'กำลังเปลี่ยน...' : 'เปลี่ยนรหัสผ่าน'}</button>
        </form>
      </div>

      {/* ขอเป็นกรรมการ */}
      {profile.role === 'approver' || profile.role === 'admin' ? null : (
        <div style={card}>
          <h2 style={{ margin: '0 0 4px', fontSize: 17 }}>เป็นกรรมการโหวต</h2>
          <p style={{ fontSize: 13.5, color: '#717892', margin: '0 0 14px', lineHeight: 1.7 }}>
            กรรมการคือผู้ที่ถูกสุ่มให้ร่วมพิจารณาอนุมัติเคส — ขออัปเกรดบทบาทเป็นกรรมการ แล้วแอดมินจะตรวจและอนุมัติ
          </p>
          {reqMsg && <div style={{ marginBottom: 12, fontSize: 14, fontWeight: 600, color: '#41454d' }}>{reqMsg}</div>}
          <button
            onClick={doRequest}
            disabled={reqBusy || requested || !canRequest}
            className="btn btn-secondary btn-sm"
            style={{ opacity: requested ? 0.6 : 1 }}
          >
            {requested ? 'ส่งคำขอแล้ว — รออนุมัติ' : reqBusy ? 'กำลังส่ง...' : 'ขอเป็นกรรมการ'}
          </button>
        </div>
      )}
    </div>
  )
}
