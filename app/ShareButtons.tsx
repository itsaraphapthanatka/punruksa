'use client'

import { useState } from 'react'

interface Props {
  url: string
  title?: string
  text?: string
  compact?: boolean
}

export function ShareButtons({ url, title, text, compact = false }: Props) {
  const [copied, setCopied] = useState(false)
  const enc = encodeURIComponent
  const shareText = (text || title || '').slice(0, 280)

  const lineUrl = `https://social-plugins.line.me/lineit/share?url=${enc(url)}`
  const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`
  const xUrl = `https://x.com/intent/tweet?url=${enc(url)}&text=${enc(shareText)}`

  const openShare = (u: string) =>
    window.open(u, '_blank', 'noopener,noreferrer,width=600,height=600')

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // older browsers fallback
      const ta = document.createElement('textarea')
      ta.value = url
      document.body.appendChild(ta)
      ta.select()
      try { document.execCommand('copy') } catch {}
      document.body.removeChild(ta)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    }
  }

  const btn = (bg: string, color: string): React.CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: compact ? '7px 11px' : '9px 14px',
    border: 'none',
    borderRadius: 999,
    background: bg,
    color,
    fontWeight: 700,
    fontSize: compact ? 12.5 : 13.5,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'transform .12s, box-shadow .12s',
    boxShadow: '0 1px 2px rgba(40,40,90,.06)',
  })

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
      {!compact && (
        <span style={{ fontSize: 13, fontWeight: 700, color: '#717892' }}>แชร์:</span>
      )}

      <button
        onClick={() => openShare(lineUrl)}
        style={btn('#06c755', '#fff')}
        aria-label="Share to LINE"
        title="แชร์ไป LINE"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
          <path d="M19.365 9.89c.50 0 .806.31.806.81 0 .51-.306.815-.806.815h-2.25v1.44h2.25c.50 0 .806.305.806.81 0 .505-.306.81-.806.81H16.31c-.5 0-.81-.31-.81-.815V8.45c0-.51.31-.815.81-.815h3.055c.5 0 .806.305.806.81 0 .51-.306.815-.806.815h-2.25v1.44zm-5.225 3.665c-.05.15-.25.36-.5.36-.05 0-.1 0-.155-.025-.405-.13-1.8-.585-2.99-1.84-.59-.62-1.005-1.36-1.005-2.15 0-.84.39-1.6 1.005-2.16.6-.55 1.41-.92 2.31-1.04.4-.055.81 0 1.155.155.36.16.66.42.85.755.18.34.255.73.20 1.115-.025.215-.13.42-.305.585L13.6 11.5l.59.59c.16.16.255.385.255.6 0 .14-.04.265-.105.385zm-8.265-3.665c.5 0 .806.31.806.81v3.295c0 .51-.306.815-.806.815-.5 0-.81-.305-.81-.815V10.7c0-.5.31-.81.81-.81zm3.92.405c0-.21.075-.405.20-.555.13-.155.31-.245.51-.275l.04-.005c.05-.005.1-.005.15 0 .195.025.36.115.49.255.045.05.085.105.115.16l1.84 2.815V10.7c0-.5.31-.81.81-.81.5 0 .81.31.81.81v3.295c0 .21-.075.405-.20.555-.13.155-.31.245-.51.275l-.045.005c-.05.005-.1.005-.15 0-.20-.03-.385-.125-.51-.275-.025-.03-.05-.06-.07-.095l-1.84-2.815v2.35c0 .51-.306.815-.806.815-.5 0-.81-.305-.81-.815V10.295zM12 2.5c-5.79 0-10.5 3.84-10.5 8.575 0 4.25 3.73 7.81 8.78 8.48.34.075.81.225.93.515.105.265.07.68.035.95l-.15.905c-.045.265-.21 1.05.92.575 1.13-.475 6.11-3.6 8.34-6.16h-.005c1.535-1.685 2.275-3.395 2.275-5.265 0-4.735-4.71-8.575-10.5-8.575z" />
        </svg>
        LINE
      </button>

      <button
        onClick={() => openShare(fbUrl)}
        style={btn('#1877f2', '#fff')}
        aria-label="Share to Facebook"
        title="แชร์ไป Facebook"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
          <path d="M9.198 21.5h4v-8.01h3.604l.396-3.98h-4V7.5a1 1 0 0 1 1-1h3v-4h-3a5 5 0 0 0-5 5v2.01h-2l-.396 3.98h2.396V21.5Z" />
        </svg>
        Facebook
      </button>

      <button
        onClick={() => openShare(xUrl)}
        style={btn('#0f1419', '#fff')}
        aria-label="Share to X"
        title="แชร์ไป X (Twitter)"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
        X
      </button>

      <button
        onClick={copyLink}
        style={btn(copied ? '#10b981' : '#fff', copied ? '#fff' : '#41454d')}
        aria-label="Copy link"
        title="คัดลอกลิงก์"
      >
        {copied ? (
          <>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            คัดลอกแล้ว
          </>
        ) : (
          <>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
            คัดลอกลิงก์
          </>
        )}
      </button>
    </div>
  )
}
