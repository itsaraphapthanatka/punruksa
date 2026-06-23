// รันครั้งเดียวตอนเซิร์ฟเวอร์บูต — ตั้ง timer ปิดรอบโหวตที่หมดเวลาอัตโนมัติ (safety net)
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return

  const run = async () => {
    try {
      if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return
      const { createAdminClient } = await import('@/lib/supabase/admin')
      const { closeExpiredRounds } = await import('@/lib/vote-tally')
      const { sweepPendingDonations } = await import('@/lib/donation-sweep')
      const admin = createAdminClient()
      const rounds = await closeExpiredRounds(admin)
      if (rounds.length) console.log('[auto-close] ปิดรอบโหวตหมดเวลา:', rounds)
      const dons = await sweepPendingDonations(admin)
      if (dons.length) console.log('[auto-close] เคลียร์ donation รอชำระหมดเวลา:', dons)
    } catch (e) {
      console.error('[auto-close] error:', e)
    }
  }

  // ครั้งแรกหลังบูต 30 วิ จากนั้นทุก 5 นาที
  setTimeout(run, 30_000)
  setInterval(run, 5 * 60_000)
}
