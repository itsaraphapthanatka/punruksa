'use client'

import Link from 'next/link'
import { useActionState, useEffect, useRef, useState, useTransition, type CSSProperties } from 'react'
import { postComment, deleteComment } from '@/app/actions/comments'
import type { CommentItem } from '@/lib/comments'

function Avatar({ name, url, size = 40 }: { name: string; url: string | null; size?: number }) {
  const initial = (name || '?').trim().charAt(0).toUpperCase()
  return (
    <span style={{ width: size, height: size, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: 'linear-gradient(135deg,#667eea,#5560d8)', color: '#fff', fontWeight: 800, fontSize: size * 0.42, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        initial
      )}
    </span>
  )
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'เมื่อสักครู่'
  if (m < 60) return `${m} นาทีที่แล้ว`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} ชม.ที่แล้ว`
  const d = Math.floor(h / 24)
  if (d < 30) return `${d} วันที่แล้ว`
  return new Date(iso).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })
}

const toolBtn: CSSProperties = { background: 'transparent', border: 'none', cursor: 'pointer', color: '#838aa3', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: 6, borderRadius: 8 }

const EMOJIS = ['😀','😄','😁','😆','😊','🙂','😉','😍','🥰','😘','😎','🤩','🤗','🤔','😴','😢','😭','😡','🥺','😇','👍','👎','👏','🙏','💪','🙌','👌','✌️','❤️','🧡','💛','💚','💙','💜','🔥','✨','🌟','🎉','💯','🐶','🐱','🐰','🐾','🥹','😻']

export function CommentsSection({
  comments,
  canComment,
  currentUserId,
}: {
  comments: CommentItem[]
  canComment: boolean
  currentUserId: string | null
}) {
  const [state, formAction, pending] = useActionState(postComment, null)
  const [body, setBody] = useState('')
  const formRef = useRef<HTMLFormElement>(null)
  const taRef = useRef<HTMLTextAreaElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [imgPreview, setImgPreview] = useState<string | null>(null)
  const [emojiOpen, setEmojiOpen] = useState(false)
  const [delBusy, startDel] = useTransition()
  const [delId, setDelId] = useState<string | null>(null)

  // ล้างกล่องข้อความ + รูปแนบ เมื่อส่งสำเร็จ
  useEffect(() => {
    if (state?.success) {
      setBody('')
      setImgPreview(null)
      setEmojiOpen(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }, [state])

  const insertEmoji = (emoji: string) => {
    const ta = taRef.current
    if (!ta) { setBody((b) => (b + emoji).slice(0, 1000)); return }
    const start = ta.selectionStart ?? body.length
    const end = ta.selectionEnd ?? body.length
    const next = (body.slice(0, start) + emoji + body.slice(end)).slice(0, 1000)
    setBody(next)
    requestAnimationFrame(() => {
      ta.focus()
      const pos = Math.min(start + emoji.length, next.length)
      ta.setSelectionRange(pos, pos)
    })
  }

  const clearImage = () => {
    setImgPreview(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  const remove = (id: string) => {
    if (!confirm('ลบความคิดเห็นนี้?')) return
    setDelId(id)
    startDel(async () => {
      await deleteComment(id)
      setDelId(null)
    })
  }

  // ยังไม่ login — แสดงเฉพาะคำเชิญชวน ไม่แสดงข้อความแชท
  if (!canComment) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, width: '100%', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 20 }}>
        <div style={{ fontSize: 42, marginBottom: 10 }}>💬</div>
        <div style={{ color: '#41454d', fontSize: 16, fontWeight: 700, marginBottom: 6 }}>เฉพาะสมาชิกเท่านั้น</div>
        <div style={{ color: '#717892', fontSize: 14, marginBottom: 18, lineHeight: 1.6, maxWidth: 280 }}>สมัครสมาชิกหรือเข้าสู่ระบบเพื่อดูและร่วมแสดงความคิดเห็นกับชุมชนปันรักษา</div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/register" className="btnCoral" style={{ padding: '10px 24px', borderRadius: 10, fontWeight: 700, fontSize: 14.5 }}>สมัครสมาชิก</Link>
          <Link href="/login" className="btnLight" style={{ padding: '10px 24px', borderRadius: 10, fontWeight: 700, fontSize: 14.5 }}>เข้าสู่ระบบ</Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, width: '100%' }}>
      {/* รายการความคิดเห็น (เลื่อนได้, อยู่บน) */}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14, padding: '2px 2px 6px' }}>
        {comments.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#9aa0b8', margin: 'auto', padding: '24px 0' }}>ยังไม่มีความคิดเห็น — มาเป็นคนแรกกัน 💬</div>
        ) : (
          comments.map((c) => (
            <div key={c.id} style={{ display: 'flex', gap: 12, opacity: delBusy && delId === c.id ? 0.5 : 1 }}>
              <Avatar name={c.author} url={c.avatar_url} />
              <div style={{ flex: 1, minWidth: 0, background: '#fff', border: '1px solid #edeef7', borderRadius: 12, padding: '11px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                  <b style={{ fontSize: 14.5 }}>{c.author}</b>
                  <span style={{ fontSize: 12, color: '#9aa0b8' }}>{timeAgo(c.created_at)}</span>
                  {currentUserId === c.user_id && (
                    <button type="button" onClick={() => remove(c.id)} disabled={delBusy} style={{ marginLeft: 'auto', background: 'transparent', border: 'none', color: '#c2410c', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}>ลบ</button>
                  )}
                </div>
                {c.body && <div style={{ fontSize: 14.5, color: '#3a3e4d', lineHeight: 1.6, marginTop: 3, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{c.body}</div>}
                {c.image_url && (
                  <a href={c.image_url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', marginTop: 8 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={c.image_url} alt="รูปแนบ" style={{ maxWidth: '100%', maxHeight: 280, borderRadius: 10, border: '1px solid #edeef7', display: 'block' }} />
                  </a>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* กล่องพิมพ์ (อยู่ล่าง) */}
      {canComment ? (
        <form ref={formRef} action={formAction} style={{ position: 'relative', flexShrink: 0, background: '#fff', border: '1px solid #edeef7', borderRadius: 14, padding: 12, marginTop: 12 }}>
          <textarea
            ref={taRef}
            name="body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            disabled={pending}
            rows={3}
            maxLength={1000}
            placeholder="ร่วมแสดงความคิดเห็น ให้กำลังใจ หรือบอกเล่าประสบการณ์…"
            className="form-input"
            style={{ resize: 'vertical', marginBottom: 10 }}
          />

          {/* รูปที่เลือกไว้ (พรีวิว) */}
          {imgPreview && (
            <div style={{ position: 'relative', display: 'inline-block', marginBottom: 10 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imgPreview} alt="แนบรูป" style={{ maxHeight: 110, maxWidth: '100%', borderRadius: 10, border: '1px solid #edeef7', display: 'block' }} />
              <button type="button" onClick={clearImage} aria-label="ลบรูป" style={{ position: 'absolute', top: -8, right: -8, width: 24, height: 24, borderRadius: '50%', background: '#26282e', color: '#fff', border: '2px solid #fff', cursor: 'pointer', fontSize: 12, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>
          )}

          {/* input ไฟล์ซ่อนไว้ — ถูกส่งไปกับฟอร์ม */}
          <input
            ref={fileRef}
            name="image"
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            disabled={pending}
            style={{ display: 'none' }}
            onChange={(e) => {
              const f = e.target.files?.[0]
              setImgPreview(f ? URL.createObjectURL(f) : null)
            }}
          />

          {state?.error && <div className="alert alert-error" style={{ marginBottom: 10 }}><span>⚠️</span> {state.error}</div>}

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* แนบรูป */}
            <button type="button" onClick={() => fileRef.current?.click()} disabled={pending} title="แนบรูป" aria-label="แนบรูป" style={toolBtn}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" /></svg>
            </button>
            {/* emoji */}
            <button type="button" onClick={() => setEmojiOpen((v) => !v)} disabled={pending} title="อิโมจิ" aria-label="อิโมจิ" style={{ ...toolBtn, color: emojiOpen ? '#5560d8' : '#838aa3' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" /></svg>
            </button>
            <span style={{ fontSize: 12, color: '#9aa0b8', marginLeft: 4 }}>{body.length}/1000</span>
            <button type="submit" className="btnCoral" style={{ marginLeft: 'auto', padding: '9px 22px', borderRadius: 10, fontWeight: 700, fontSize: 14.5 }} disabled={pending || (!body.trim() && !imgPreview)}>
              {pending ? 'กำลังส่ง…' : 'ส่ง'}
            </button>
          </div>

          {/* แผง emoji */}
          {emojiOpen && (
            <div style={{ position: 'absolute', bottom: 60, left: 16, zIndex: 5, background: '#fff', border: '1px solid #e3e4f0', borderRadius: 12, boxShadow: '0 12px 32px rgba(20,22,40,.16)', padding: 8, width: 264, display: 'grid', gridTemplateColumns: 'repeat(8,1fr)', gap: 2 }}>
              {EMOJIS.map((em) => (
                <button key={em} type="button" onClick={() => insertEmoji(em)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 20, padding: 4, borderRadius: 7, lineHeight: 1 }} onMouseDown={(e) => e.preventDefault()}>{em}</button>
              ))}
            </div>
          )}
        </form>
      ) : (
        <div style={{ flexShrink: 0, marginTop: 12, background: '#fff', border: '1px solid #edeef7', borderRadius: 14, padding: '18px', textAlign: 'center' }}>
          <div style={{ color: '#717892', fontSize: 14.5, marginBottom: 12 }}>เข้าสู่ระบบหรือสมัครสมาชิกเพื่อร่วมแสดงความคิดเห็น</div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/register" className="btnCoral" style={{ padding: '9px 22px', borderRadius: 10, fontWeight: 700, fontSize: 14.5 }}>สมัครสมาชิก</Link>
            <Link href="/login" className="btnLight" style={{ padding: '9px 22px', borderRadius: 10, fontWeight: 700, fontSize: 14.5 }}>เข้าสู่ระบบ</Link>
          </div>
        </div>
      )}
    </div>
  )
}
