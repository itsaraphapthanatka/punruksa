'use client'

import { useActionState } from 'react'
import { addCaseUpdate } from '@/app/actions/community'

export function UpdateForm({ caseId }: { caseId: string }) {
  const [state, formAction, pending] = useActionState(addCaseUpdate, null)
  return (
    <form action={formAction} style={{ marginTop: 14, borderTop: '1px dashed #e9eaf3', paddingTop: 14 }}>
      <input type="hidden" name="case_id" value={caseId} />
      <label style={{ display: 'block', fontWeight: 700, fontSize: 13, marginBottom: 6 }}>โพสต์อัปเดตความคืบหน้า</label>
      <textarea name="body" rows={2} required disabled={pending} placeholder="เช่น น้องผ่าตัดเรียบร้อย กำลังพักฟื้น..." className="form-input" style={{ resize: 'vertical', marginBottom: 8 }} />
      {state?.error && <div className="alert alert-error" style={{ marginBottom: 8 }}><span>⚠️</span> {state.error}</div>}
      <button type="submit" className="btn btn-primary btn-sm" disabled={pending}>{pending ? 'กำลังโพสต์...' : 'โพสต์อัปเดต'}</button>
    </form>
  )
}
