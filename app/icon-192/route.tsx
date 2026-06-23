import { ImageResponse } from 'next/og'
import { pawIcon } from '@/lib/brand-icon'

export const dynamic = 'force-static'

export function GET() {
  return new ImageResponse(pawIcon(192), { width: 192, height: 192 })
}
