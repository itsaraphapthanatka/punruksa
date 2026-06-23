import { ImageResponse } from 'next/og'
import { pawIcon } from '@/lib/brand-icon'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(pawIcon(180), size)
}
