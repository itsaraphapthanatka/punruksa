'use client'

import { useActionState, useState, type CSSProperties } from 'react'
import { authenticate } from '@/app/actions/auth'

const fieldStyle: CSSProperties = {
  width: '100%',
  border: '1px solid #e3e4f0',
  borderRadius: 11,
  padding: '12px 14px',
  fontSize: 14.5,
  background: '#fff',
  marginBottom: 15,
}

const labelStyle: CSSProperties = {
  display: 'block',
  fontWeight: 700,
  fontSize: 13,
  marginBottom: 6,
}

export default function AuthForm({
  initialMode = 'login',
}: {
  initialMode?: 'login' | 'signup'
}) {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode)
  const [showPw, setShowPw] = useState(false)
  const [consent, setConsent] = useState(false)
  const [notice, setNotice] = useState('')
  const [state, formAction, pending] = useActionState(authenticate, null)

  const login = mode === 'login'
  const errorMsg = state?.error

  return (
    <div style={{ minHeight: '100vh', display: 'flex' }}>
      <style>{`
        @keyframes afRise{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
        @keyframes afFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
        .af-input:focus{border-color:#667eea;outline:none}
        .af-submit:hover:not(:disabled){background:#5a66d6}
        .af-line:hover{background:#05b14c}
        .af-demo:hover{border-color:#c9cdf2;background:#fafaff}
        @media(max-width:880px){.af-brand{display:none!important}.af-right{width:100%!important}}
      `}</style>

      {/* LEFT: brand panel */}
      <div
        className="af-brand"
        style={{
          flex: 1,
          minWidth: 0,
          backgroundImage: 'linear-gradient(150deg,#667eea,#7d6df0 55%,#9166e8)',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '48px 52px',
          color: '#fff',
        }}
      >
        <div style={{ position: 'absolute', width: 340, height: 340, borderRadius: '50%', background: 'rgba(255,255,255,.07)', top: -90, right: -70 }} />
        <div style={{ position: 'absolute', width: 220, height: 220, borderRadius: '50%', background: 'rgba(255,255,255,.06)', bottom: 60, left: -60 }} />
        <div style={{ position: 'absolute', fontSize: 120, bottom: 40, right: 48, opacity: 0.16, animation: 'afFloat 5s ease-in-out infinite' }}>🐾</div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative' }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(255,255,255,.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="#fff"><circle cx="6.5" cy="9" r="2.1" /><circle cx="11" cy="6.2" r="2.1" /><circle cx="16" cy="6.2" r="2.1" /><circle cx="20" cy="9.6" r="1.9" /><path d="M13 12c-2.3 0-3.7 1.5-4.8 2.9C7 16.4 5.4 17.4 5.4 19.2 5.4 20.8 6.7 22 8.4 22c1.3 0 2.4-.6 3.4-.6.9 0 2 .6 3.4.6 1.7 0 3-1.2 3-2.8 0-1.8-1.6-2.8-2.8-4.3C14.5 13.5 13.1 12 13 12z" /></svg>
          </div>
          <div style={{ fontWeight: 800, fontSize: 18, letterSpacing: '-.2px' }}>ปันรักษา</div>
        </div>

        <div style={{ position: 'relative', maxWidth: 440 }}>
          <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '1.5px', color: '#e2e4ff', marginBottom: 14 }}>โปร่งใส · ตรวจสอบได้</div>
          <h1 style={{ margin: 0, fontSize: 38, fontWeight: 800, lineHeight: 1.2, letterSpacing: '-.6px' }}>ทุกการช่วยเหลือ<br />ผ่านมติของชุมชน</h1>
          <p style={{ margin: '18px 0 0', fontSize: 15.5, color: '#e9eaff', lineHeight: 1.7 }}>เปิดเคส แนบหลักฐาน แล้วให้สมาชิกที่ถูกสุ่มเป็นกรรมการร่วมพิจารณา ทุกขั้นตอนถูกบันทึกและเปิดให้ตรวจสอบได้</p>

          <div style={{ display: 'flex', gap: 26, marginTop: 30 }}>
            <div>
              <div style={{ fontSize: 26, fontWeight: 800 }}>สุ่ม</div>
              <div style={{ fontSize: 12.5, color: '#dcdeff', fontWeight: 600 }}>เลือกกรรมการ</div>
            </div>
            <div style={{ width: 1, background: 'rgba(255,255,255,.25)' }} />
            <div>
              <div style={{ fontSize: 26, fontWeight: 800 }}>PDPA</div>
              <div style={{ fontSize: 12.5, color: '#dcdeff', fontWeight: 600 }}>ปิดบังตัวตน</div>
            </div>
            <div style={{ width: 1, background: 'rgba(255,255,255,.25)' }} />
            <div>
              <div style={{ fontSize: 26, fontWeight: 800 }}>Audit</div>
              <div style={{ fontSize: 12.5, color: '#dcdeff', fontWeight: 600 }}>บันทึกทุกขั้น</div>
            </div>
          </div>
        </div>

        <div style={{ position: 'relative', fontSize: 12.5, color: '#dcdeff', fontWeight: 500 }}>เวอร์ชันแรก (MVP) · ยังไม่เปิดระบบการเงิน</div>
      </div>

      {/* RIGHT: auth */}
      <div
        className="af-right"
        style={{ width: 480, flex: 'none', background: '#f4f5fb', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 30px' }}
      >
        <div style={{ width: '100%', maxWidth: 372, animation: 'afRise .45s ease both' }}>
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ margin: 0, fontSize: 25, fontWeight: 800, letterSpacing: '-.4px' }}>{login ? 'ยินดีต้อนรับกลับ' : 'สมัครสมาชิก'}</h2>
            <p style={{ margin: '6px 0 0', fontSize: 14, color: '#838aa3' }}>{login ? 'เข้าสู่ระบบเพื่อจัดการเคสและร่วมโหวต' : 'สร้างบัญชีเพื่อเปิดเคสและร่วมเป็นกรรมการ'}</p>
          </div>

          {/* LINE login */}
          <a
            href="/api/auth/line/login"
            className="af-line"
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, background: '#06c755', color: '#fff', border: 'none', borderRadius: 12, padding: 13, fontSize: 15, fontWeight: 700, cursor: 'pointer', marginBottom: 14, textDecoration: 'none' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff"><path d="M12 2C6.5 2 2 5.7 2 10.2c0 4 3.6 7.4 8.5 8 .3.07.8.2.9.5.08.27.05.7.03.97l-.15.9c-.04.27-.2 1.04.91.57s6.04-3.56 8.24-6.1C21.4 13.3 22 11.8 22 10.2 22 5.7 17.5 2 12 2z" /></svg>
            เข้าสู่ระบบด้วย LINE
          </a>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '18px 0' }}>
            <div style={{ flex: 1, height: 1, background: '#e3e4f0' }} />
            <span style={{ fontSize: 12.5, color: '#9aa0b8', fontWeight: 600 }}>หรือ</span>
            <div style={{ flex: 1, height: 1, background: '#e3e4f0' }} />
          </div>

          <form action={formAction}>
            <input type="hidden" name="mode" value={mode} />

            <label style={labelStyle}>เบอร์โทร หรือ อีเมล</label>
            <input
              className="af-input"
              name="email"
              type="text"
              placeholder="08x-xxx-xxxx หรือ you@email.com"
              required
              autoComplete="username"
              disabled={pending}
              style={fieldStyle}
            />

            {!login && (
              <>
                <label style={labelStyle}>ชื่อ–นามสกุล</label>
                <input
                  className="af-input"
                  name="full_name"
                  placeholder="ชื่อจริงของคุณ"
                  required
                  disabled={pending}
                  style={fieldStyle}
                />
              </>
            )}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <label style={{ fontWeight: 700, fontSize: 13 }}>รหัสผ่าน</label>
              {login && (
                <button
                  type="button"
                  onClick={() => setNotice('ส่งลิงก์รีเซ็ตรหัสผ่านไปยังเบอร์/อีเมลของคุณแล้ว (เดโม)')}
                  style={{ border: 'none', background: 'none', color: '#5560d8', fontWeight: 700, fontSize: 12.5, cursor: 'pointer', padding: 0 }}
                >
                  ลืมรหัสผ่าน?
                </button>
              )}
            </div>
            <div style={{ position: 'relative', marginBottom: 16 }}>
              <input
                className="af-input"
                name="password"
                type={showPw ? 'text' : 'password'}
                placeholder="••••••••"
                required
                minLength={6}
                autoComplete={login ? 'current-password' : 'new-password'}
                disabled={pending}
                style={{ ...fieldStyle, padding: '12px 46px 12px 14px', marginBottom: 0 }}
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', color: '#9aa0b8', fontSize: 12, fontWeight: 700, cursor: 'pointer', padding: 8 }}
              >
                {showPw ? 'ซ่อน' : 'แสดง'}
              </button>
            </div>

            {!login && (
              <label
                onClick={() => setConsent((v) => !v)}
                style={{ display: 'flex', alignItems: 'flex-start', gap: 9, fontSize: 12.5, color: '#5d6480', cursor: 'pointer', marginBottom: 16, lineHeight: 1.5 }}
              >
                <span
                  style={{
                    flex: 'none', width: 18, height: 18, borderRadius: 5,
                    border: consent ? 'none' : '1.5px solid #c2c6da',
                    background: consent ? '#667eea' : '#fff',
                    color: '#fff', fontSize: 12, fontWeight: 800,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 1,
                  }}
                >
                  {consent ? '✓' : ''}
                </span>
                <span>ยอมรับ<b style={{ color: '#4a5176' }}>นโยบายความเป็นส่วนตัว (PDPA)</b> และยินยอมให้ระบบปิดบังตัวตนเมื่อเคสเข้าสู่รอบโหวต</span>
              </label>
            )}

            {errorMsg && (
              <div style={{ background: '#fef2f2', color: '#b91c1c', borderRadius: 10, padding: '10px 13px', fontSize: 13, fontWeight: 600, marginBottom: 14 }}>{errorMsg}</div>
            )}
            {notice && (
              <div style={{ background: '#eef2ff', color: '#4453c4', borderRadius: 10, padding: '10px 13px', fontSize: 13, fontWeight: 600, marginBottom: 14 }}>{notice}</div>
            )}

            <button
              type="submit"
              className="af-submit"
              disabled={pending || (!login && !consent)}
              style={{ width: '100%', background: '#667eea', color: '#fff', border: 'none', borderRadius: 12, padding: 14, fontSize: 15, fontWeight: 700, cursor: pending || (!login && !consent) ? 'not-allowed' : 'pointer', opacity: pending || (!login && !consent) ? 0.6 : 1 }}
            >
              {pending ? 'กำลังดำเนินการ...' : login ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13.5, color: '#838aa3' }}>
            {login ? 'ยังไม่มีบัญชี?' : 'มีบัญชีอยู่แล้ว?'}{' '}
            <button
              type="button"
              onClick={() => { setMode(login ? 'signup' : 'login'); setNotice(''); setConsent(false) }}
              style={{ border: 'none', background: 'none', color: '#5560d8', fontWeight: 700, fontSize: 13.5, cursor: 'pointer', padding: 0 }}
            >
              {login ? 'สมัครสมาชิก' : 'เข้าสู่ระบบ'}
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}
