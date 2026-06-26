import { ImageResponse } from 'next/og'
import { pawIcon } from '@/lib/brand-icon'

// Browser tab favicon — Next.js convention: app/icon.tsx
export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(pawIcon(32), size)
}
