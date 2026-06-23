import { createAdminClient } from '@/lib/supabase/admin'
import { paynoiCheck } from '@/lib/paynoi'

type Admin = ReturnType<typeof createAdminClient>

// เคลียร์ donation ที่ "รอชำระ" แต่เลยเวลา (expire_at < now)
// เช็คกับ PayNoi ก่อน: จ่ายแล้ว → completed, ไม่งั้น → expired (กันค้างในหน้าแอดมิน)
export async function sweepPendingDonations(admin: Admin): Promise<{ id: string; status: string }[]> {
  // QR ของ PayNoi อายุ 15 นาที — ใช้อายุจาก created_at (เชื่อถือได้กว่า expire_at ที่ PayNoi ส่งมาเป็นเวลาไทย)
  const cutoff = new Date(Date.now() - 16 * 60 * 1000).toISOString()
  const { data: stale } = await admin
    .from('donations')
    .select('id, trans_id, amount')
    .eq('status', 'pending')
    .lt('created_at', cutoff)

  const out: { id: string; status: string }[] = []
  for (const d of stale || []) {
    let next: 'completed' | 'expired' = 'expired'
    let amountPaid: number | null = null
    if (d.trans_id) {
      const chk = await paynoiCheck(d.trans_id)
      if (chk.ok && chk.paymentStatus === 'completed') {
        next = 'completed'
        amountPaid = Number(chk.amount) || d.amount
      }
    }
    await admin
      .from('donations')
      .update(next === 'completed' ? { status: 'completed', amount_paid: amountPaid } : { status: 'expired' })
      .eq('id', d.id)
      .eq('status', 'pending')
    out.push({ id: d.id, status: next })
  }
  return out
}
