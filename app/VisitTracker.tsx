'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'

// Fire-and-forget visit beacon. Runs once per pathname change.
export function VisitTracker() {
  const pathname = usePathname()
  const lastPath = useRef<string | null>(null)

  useEffect(() => {
    if (!pathname) return
    if (lastPath.current === pathname) return
    lastPath.current = pathname

    // skip admin browsing client-side too (defence in depth)
    if (pathname.startsWith('/dashboard/admin')) return

    try {
      fetch('/api/track', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ path: pathname }),
        keepalive: true,
      }).catch(() => {})
    } catch {
      // ignore — tracking must never break the page
    }
  }, [pathname])

  return null
}
