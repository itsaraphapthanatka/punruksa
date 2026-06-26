'use client'

import { useState } from 'react'
import { CommentsSection } from './CommentsSection'
import type { CommentItem } from '@/lib/comments'

export function ChatWidget({
  comments,
  canComment,
  currentUserId,
}: {
  comments: CommentItem[]
  canComment: boolean
  currentUserId: string | null
}) {
  const [open, setOpen] = useState(false)
  const [showBubble, setShowBubble] = useState(true)

  return (
    <div className="cw-root">
      <style>{`
        .cw-root{position:fixed;right:20px;bottom:20px;z-index:300;display:flex;flex-direction:column;align-items:flex-end;gap:12px}
        .cw-greet{display:flex;align-items:center;gap:8px;background:#fff;border-radius:16px;padding:11px 14px;box-shadow:0 8px 28px rgba(20,22,40,.16);font-weight:700;font-size:14.5px;color:#26282e;max-width:240px;animation:cwPop .25s ease-out}
        .cw-greet-x{background:#f1f2f7;border:none;width:22px;height:22px;border-radius:50%;cursor:pointer;color:#838aa3;font-size:13px;line-height:1;flex-shrink:0;display:inline-flex;align-items:center;justify-content:center}
        .cw-greet-x:hover{background:#e3e4f0}
        .cw-fab{width:62px;height:62px;border-radius:50%;border:none;cursor:pointer;background:linear-gradient(135deg,#2bc4d6,#15a6bd);color:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 10px 30px rgba(21,166,189,.42);transition:transform .15s, box-shadow .15s;align-self:flex-end}
        .cw-fab:hover{transform:translateY(-2px) scale(1.04);box-shadow:0 14px 34px rgba(21,166,189,.5)}
        .cw-panel{width:min(92vw,380px);height:min(72vh,580px);background:#f6f7f9;border-radius:18px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 20px 56px rgba(20,22,40,.26);animation:cwPop .2s ease-out}
        .cw-head{background:linear-gradient(135deg,#2bc4d6,#15a6bd);color:#fff;padding:16px 18px;display:flex;align-items:center;justify-content:space-between;flex-shrink:0}
        .cw-head-x{background:rgba(255,255,255,.2);border:none;width:30px;height:30px;border-radius:50%;cursor:pointer;color:#fff;display:inline-flex;align-items:center;justify-content:center}
        .cw-head-x:hover{background:rgba(255,255,255,.32)}
        .cw-body{flex:1;min-height:0;display:flex;padding:14px}
        @keyframes cwPop{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @media(max-width:480px){.cw-panel{height:min(78vh,580px)}}
      `}</style>

      {open ? (
        <div className="cw-panel" role="dialog" aria-label="ร่วมแสดงความคิดเห็น">
          <div className="cw-head">
            <div>
              <div style={{ fontWeight: 800, fontSize: 16 }}>💬 ร่วมแสดงความคิดเห็น</div>
              <div style={{ fontSize: 12.5, opacity: .9, marginTop: 1 }}>ติดต่อเราที่นี่ได้เลยค่ะ</div>
            </div>
            <button type="button" className="cw-head-x" onClick={() => setOpen(false)} aria-label="ปิด">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
          </div>
          <div className="cw-body">
            <CommentsSection comments={comments} canComment={canComment} currentUserId={currentUserId} />
          </div>
        </div>
      ) : (
        <>
          {showBubble && (
            <div className="cw-greet">
              <span>ร่วมแสดงความคิดเห็น</span>
              <button type="button" className="cw-greet-x" onClick={() => setShowBubble(false)} aria-label="ปิดข้อความ">✕</button>
            </div>
          )}
          <button type="button" className="cw-fab" onClick={() => { setOpen(true); setShowBubble(false) }} aria-label="เปิดแชทแสดงความคิดเห็น">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
              <line x1="9" y1="10" x2="15" y2="10" />
              <line x1="9" y1="13.5" x2="13" y2="13.5" />
            </svg>
          </button>
        </>
      )}
    </div>
  )
}
