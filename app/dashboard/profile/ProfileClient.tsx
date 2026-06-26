'use client'

import { useActionState, useEffect, useRef, useState, useTransition } from 'react'
import { updateProfile, changePassword, requestApproverRole, disconnectLine, uploadAvatar } from '@/app/actions/profile'

const card: React.CSSProperties = { background: '#fff', border: '1px solid #edeef7', borderRadius: 16, padding: 22, marginBottom: 18 }
const label: React.CSSProperties = { display: 'block', fontWeight: 700, fontSize: 13, marginBottom: 6 }

const ROLE_LABEL: Record<string, string> = {
  donor: 'ผู้บริจาค', caretaker: 'ผู้ดูแลสัตว์', clinic: 'คลินิก', approver: 'กรรมการ', admin: 'แอดมิน',
}

export function ProfileClient({
  profile,
  pendingRequest,
  lineAvailable,
  lineNotice,
}: {
  profile: { full_name: string; phone: string; email: string; role: string; is_verified: boolean; line_connected: boolean; line_via_login: boolean; avatar_url: string | null }
  pendingRequest: boolean
  lineAvailable: boolean
  lineNotice: { ok: boolean; text: string } | null
}) {
  const [avState, avAction, avPending] = useActionState(uploadAvatar, null)
  const [preview, setPreview] = useState<string | null>(null)
  const avInputRef = useRef<HTMLInputElement>(null)
  const avatarSrc = preview || profile.avatar_url || null
  const avInitial = (profile.full_name || '?').trim().charAt(0).toUpperCase()

  // ล้าง preview เมื่ออัปโหลดสำเร็จ (รูปจริงจะมาจาก profile.avatar_url ที่ revalidate แล้ว)
  useEffect(() => {
    if (avState?.success) setPreview(null)
  }, [avState])
  const [pState, pAction, pPending] = useActionState(updateProfile, null)
  const [pwState, pwAction, pwPending] = useActionState(changePassword, null)
  const [reqBusy, startReq] = useTransition()
  const [reqMsg, setReqMsg] = useState<string | null>(pendingRequest ? 'มีคำขอรออนุมัติอยู่' : null)
  const [requested, setRequested] = useState(pendingRequest)

  const [lineConnected, setLineConnected] = useState(profile.line_connected)
  const [lineBusy, startLine] = useTransition()
  const [lineMsg, setLineMsg] = useState<string | null>(lineNotice?.text ?? null)

  function doRequest() {
    startReq(async () => {
      const r = await requestApproverRole()
      if (r.error) setReqMsg('❌ ' + r.error)
      else { setReqMsg('✅ ' + (r.msg || 'ส่งคำขอแล้ว')); setRequested(true) }
    })
  }

  function doDisconnectLine() {
    startLine(async () => {
      const r = await disconnectLine()
      if (r.error) setLineMsg('❌ ' + r.error)
      else { setLineMsg('✅ ' + (r.msg || 'ยกเลิกการเชื่อมต่อแล้ว')); setLineConnected(false) }
    })
  }

  const canRequest = profile.role === 'donor' || profile.role === 'caretaker' || profile.role === 'clinic'
  // กรรมการ / แอดมิน เป็นกลุ่มเป้าหมายหลักที่ต้องรับแจ้งเตือนโหวต
  const showLineCard = profile.role === 'approver' || profile.role === 'admin'

  return (
    <div style={{ maxWidth: 560 }}>
      {/* รูปโปรไฟล์ */}
      <div style={card}>
        <h2 style={{ margin: '0 0 14px', fontSize: 17 }}>รูปโปรไฟล์</h2>
        <form action={avAction} style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
          <div style={{ width: 88, height: 88, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: 'linear-gradient(135deg,#667eea,#5560d8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 34 }}>
            {avatarSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarSrc} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              avInitial
            )}
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <input
              ref={avInputRef}
              name="avatar"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              disabled={avPending}
              className="form-input"
              style={{ marginBottom: 10 }}
              onChange={(e) => {
                const f = e.target.files?.[0]
                setPreview(f ? URL.createObjectURL(f) : null)
              }}
            />
            <div style={{ fontSize: 12.5, color: '#9aa0b8', marginBottom: 10 }}>PNG / JPG / WebP · ไม่เกิน 5MB</div>
            {avState?.error && <div className="alert alert-error" style={{ marginBottom: 10 }}><span>⚠️</span> {avState.error}</div>}
            {avState?.success && <div className="alert alert-success" style={{ marginBottom: 10 }}><span>✅</span> {avState.msg}</div>}
            <button type="submit" className="btn btn-primary btn-sm" disabled={avPending}>{avPending ? 'กำลังอัปโหลด...' : 'อัปโหลดรูป'}</button>
          </div>
        </form>
      </div>

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

      {/* เชื่อมต่อ LINE (สำหรับกรรมการ/แอดมิน รับแจ้งเตือนโหวต) */}
      {showLineCard && (
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <span style={{ width: 30, height: 30, borderRadius: 8, background: '#06c755', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
                <path d="M12 2C6.5 2 2 5.6 2 10.1c0 4 3.6 7.4 8.4 8 .33.07.78.22.9.5.1.26.07.66.03.92l-.14.88c-.04.26-.2 1.02.9.56s5.95-3.5 8.12-6h0C21.46 13.4 22 11.8 22 10.1 22 5.6 17.5 2 12 2z" />
              </svg>
            </span>
            <h2 style={{ margin: 0, fontSize: 17 }}>เชื่อมต่อ LINE</h2>
          </div>
          <p style={{ fontSize: 13.5, color: '#717892', margin: '0 0 14px', lineHeight: 1.7 }}>
            เชื่อมบัญชี LINE เพื่อรับ<b>แจ้งเตือนเมื่อถูกสุ่มให้พิจารณาอนุมัติเคส</b> จะได้ไม่พลาดรอบโหวต
            {' '}(อย่าลืมเพิ่มบัญชีทางการ <b>ปันรักษา</b> เป็นเพื่อนใน LINE ด้วย)
          </p>

          {lineMsg && (
            <div style={{ marginBottom: 12, fontSize: 14, fontWeight: 600, color: '#41454d' }}>{lineMsg}</div>
          )}

          {!lineAvailable ? (
            <div style={{ fontSize: 13, color: '#9aa0b8' }}>ระบบ LINE ยังไม่พร้อมใช้งาน</div>
          ) : profile.line_via_login ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 999, background: '#e6f7ef', color: '#127a52', fontWeight: 700, fontSize: 13 }}>
                ✅ เชื่อมต่อแล้ว
              </span>
              <span style={{ fontSize: 12.5, color: '#9aa0b8' }}>ผ่านการเข้าสู่ระบบด้วย LINE — ไม่ต้องเชื่อมต่อเพิ่ม</span>
            </div>
          ) : lineConnected ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 999, background: '#e6f7ef', color: '#127a52', fontWeight: 700, fontSize: 13 }}>
                ✅ เชื่อมต่อแล้ว
              </span>
              <button onClick={doDisconnectLine} disabled={lineBusy} className="btn btn-secondary btn-sm">
                {lineBusy ? 'กำลังยกเลิก...' : 'ยกเลิกการเชื่อมต่อ'}
              </button>
            </div>
          ) : (
            <a
              href="/api/line/connect"
              className="btn btn-sm"
              style={{ background: '#06c755', color: '#fff', display: 'inline-flex', alignItems: 'center', gap: 8 }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
                <path d="M12 2C6.5 2 2 5.6 2 10.1c0 4 3.6 7.4 8.4 8 .33.07.78.22.9.5.1.26.07.66.03.92l-.14.88c-.04.26-.2 1.02.9.56s5.95-3.5 8.12-6h0C21.46 13.4 22 11.8 22 10.1 22 5.6 17.5 2 12 2z" />
              </svg>
              เชื่อมต่อ LINE
            </a>
          )}
        </div>
      )}

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
