import { NextResponse } from 'next/server'
import { paynoiCheck, verifyPaynoiSignature } from '@/lib/paynoi'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

// PayNoi เรียก endpoint นี้เมื่อมีการจ่ายเงินสำเร็จ
// ตั้ง webhook URL ใน dashboard PayNoi เป็น: https://<โดเมน>/api/paynoi/webhook
export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const data = body?.data
  const transId = data?.trans_id as string | undefined
  if (!transId) return NextResponse.json({ status: 0, msg: 'bad payload' }, { status: 400 })

  const sigOk = verifyPaynoiSignature(data, body?.signature)

  // ยืนยันกับ PayNoi โดยตรงเสมอ (ไม่เชื่อ payload/signature อย่างเดียว)
  const chk = await paynoiCheck(transId)
  const completed = chk.ok && chk.paymentStatus === 'completed'

  if (completed) {
    const admin = createAdminClient()
    const { data: row } = await admin
      .from('donations')
      .select('id, status')
      .eq('trans_id', transId)
      .maybeSingle()

    if (row && row.status !== 'completed') {
      await admin
        .from('donations')
        .update({ status: 'completed', amount_paid: Number(chk.amount) || null })
        .eq('trans_id', transId)
        .eq('status', 'pending')
      await admin.from('audit_log').insert({
        action: 'donation_completed',
        details: { trans_id: transId, amount: chk.amount, source: 'webhook', signature_ok: sigOk },
      })
      revalidatePath('/')
      revalidatePath('/dashboard/donate')
      revalidatePath('/dashboard')
    }
  }

  // ตอบรับเสมอ (PayNoi คาดหวัง { status: 1 })
  return NextResponse.json({ status: 1 })
}
