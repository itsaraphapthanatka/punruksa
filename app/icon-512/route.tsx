import { ImageResponse } from 'next/og'
import { pawIcon } from '@/lib/brand-icon'

export const dynamic = 'force-static'

export function GET() {
  return new ImageResponse(pawIcon(512), { width: 512, height: 512 })
}
