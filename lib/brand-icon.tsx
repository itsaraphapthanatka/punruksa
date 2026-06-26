import fs from 'node:fs'
import path from 'node:path'

// อ่าน logo.jpg ครั้งเดียวเมื่อโมดูลถูกโหลด (cache ในหน่วยความจำ) แล้วฝังเป็น data URL
// — ไฟล์เล็กระดับ 50KB → cost ต่ำ
let cachedDataUrl: string | null = null
function logoDataUrl(): string {
  if (cachedDataUrl) return cachedDataUrl
  try {
    const p = path.join(process.cwd(), 'public', 'logo.jpg')
    const buf = fs.readFileSync(p)
    cachedDataUrl = `data:image/jpeg;base64,${buf.toString('base64')}`
  } catch {
    cachedDataUrl = ''
  }
  return cachedDataUrl
}

// ไอคอนแบรนด์สำหรับสร้าง PNG ด้วย ImageResponse (PWA icons 192 / 512 / Apple)
export function pawIcon(size: number) {
  const src = logoDataUrl()
  return (
    <div
      style={{
        display: 'flex',
        width: '100%',
        height: '100%',
        background: '#ffffff',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
        <img src={src} width={size} height={size} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        // fallback: เส้นวาดอุ้งเท้าถ้าโหลด logo ไม่ได้
        <svg width={Math.round(size * 0.6)} height={Math.round(size * 0.6)} viewBox="0 0 24 24" fill="#667eea">
          <circle cx="6.5" cy="9" r="2.1" />
          <circle cx="11" cy="6.2" r="2.1" />
          <circle cx="16" cy="6.2" r="2.1" />
          <circle cx="20" cy="9.6" r="1.9" />
          <path d="M13 12c-2.3 0-3.7 1.5-4.8 2.9C7 16.4 5.4 17.4 5.4 19.2 5.4 20.8 6.7 22 8.4 22c1.3 0 2.4-.6 3.4-.6.9 0 2 .6 3.4.6 1.7 0 3-1.2 3-2.8 0-1.8-1.6-2.8-2.8-4.3C14.5 13.5 13.1 12 13 12z" />
        </svg>
      )}
    </div>
  )
}
