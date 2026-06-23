import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { CSSProperties } from 'react'
import { animalIcon, statusBadge, emergencyBadgeStyle } from '../../case-ui'
import { UpdateForm } from './UpdateForm'

const FLOW = ['received', 'voting', 'approved', 'closed'] as const
const FLOW_LABEL: Record<string, string> = { received: 'รับเรื่อง', voting: 'โหวต', approved: 'อนุมัติ', closed: 'จ่าย/ปิด' }

const cardStyle: CSSProperties = { background: '#fff', border: '1px solid #edeef7', borderRadius: 16, padding: 22 }
const fieldLabel: CSSProperties = { fontSize: 12, color: '#9aa0b8', fontWeight: 600 }

export default async function CaseDetailPage(props: PageProps<'/dashboard/cases/[id]'>) {
  const { id } = await props.params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: caseData, error } = await supabase.from('cases').select('*').eq('id', id).single()
  if (error || !caseData) notFound()

  const { data: documents } = await supabase
    .from('case_documents').select('*').eq('case_id', id).order('created_at', { ascending: true })

  const { data: auditLogs } = await supabase
    .from('audit_log').select('id, action, details, created_at, actor_id').eq('case_id', id).order('created_at', { ascending: true })

  const { data: updates } = await supabase
    .from('case_updates').select('*').eq('case_id', id).order('created_at', { ascending: false })

  const { data: userProfile } = await supabase.from('users').select('role').eq('id', user!.id).single()
  const isOwner = caseData.created_by === user?.id
  const isAdmin = userProfile?.role === 'admin'
  const canSeeOwnerInfo = isOwner || isAdmin

  const b = statusBadge(caseData.status)
  const curIdx = caseData.status === 'rejected' ? -1 : FLOW.indexOf(caseData.status)

  return (
    <>
      <div style={{ marginBottom: 18 }}>
        <Link href="/dashboard/cases" style={{ color: '#5560d8', fontWeight: 700, fontSize: 13 }}>← กลับรายการเคส</Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 10, flexWrap: 'wrap' }}>
          <h1 style={{ margin: 0, fontSize: 23, fontWeight: 800, letterSpacing: '-0.3px' }}>{caseData.title}</h1>
          {caseData.mode === 'emergency' && <span style={emergencyBadgeStyle}>⚡ ฉุกเฉิน</span>}
          <span style={b.style}>{b.label}</span>
        </div>
      </div>

      {/* timeline */}
      <div style={{ ...cardStyle, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start' }}>
          {FLOW.map((step, i) => {
            const done = i < curIdx
            const active = i === curIdx
            return (
              <div key={step} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                {i < FLOW.length - 1 && (
                  <div style={{ position: 'absolute', top: 15, left: '50%', width: '100%', height: 2, background: done ? '#10b981' : '#edeef7' }} />
                )}
                <div style={{
                  width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, fontWeight: 800, position: 'relative', zIndex: 1,
                  background: active ? '#667eea' : done ? '#ecfdf5' : '#f1f2f7',
                  color: active ? '#fff' : done ? '#047857' : '#9aa0b8',
                  border: active ? 'none' : '2px solid #fff',
                }}>{done ? '✓' : i + 1}</div>
                <span style={{ fontSize: 12, marginTop: 6, fontWeight: active ? 700 : 500, color: active ? '#2a2e44' : '#9aa0b8' }}>{FLOW_LABEL[step]}</span>
              </div>
            )
          })}
        </div>
        {caseData.status === 'rejected' && (
          <div style={{ marginTop: 14, background: '#fef2f2', color: '#b91c1c', borderRadius: 10, padding: '10px 14px', fontSize: 13, fontWeight: 600 }}>เคสนี้ถูกตีกลับ / โหวตไม่ผ่าน</div>
        )}
      </div>

      {/* details + documents */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 16, marginBottom: 16 }}>
        <div style={cardStyle}>
          <h2 style={{ margin: '0 0 14px', fontSize: 16 }}>รายละเอียดเคส</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div><div style={fieldLabel}>ชนิดสัตว์</div><div>{animalIcon(caseData.animal_type)} {caseData.animal_type}</div></div>
            <div><div style={fieldLabel}>อาการ</div><div style={{ lineHeight: 1.7 }}>{caseData.symptoms}</div></div>
            <div><div style={fieldLabel}>คลินิก</div><div>{caseData.clinic_name || '—'}</div></div>
            <div><div style={fieldLabel}>ยอดที่ขอ</div><div style={{ fontSize: 20, fontWeight: 800, color: '#5560d8' }}>{Number(caseData.requested_amount).toLocaleString()} บาท</div></div>
            <div><div style={fieldLabel}>วันที่เปิดเคส</div><div>{new Date(caseData.created_at).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div></div>
            <div>
              <div style={fieldLabel}>ผู้เปิดเคส</div>
              {canSeeOwnerInfo
                ? <div>{isOwner ? 'คุณ (เจ้าของเคส)' : `ID: ${caseData.created_by.slice(0, 8)}…`}</div>
                : <div style={{ color: '#9aa0b8' }}>🔒 ปิดบังตาม PDPA</div>}
            </div>
          </div>
        </div>

        <div style={cardStyle}>
          <h2 style={{ margin: '0 0 14px', fontSize: 16 }}>เอกสารแนบ</h2>
          {(!documents || documents.length === 0) ? (
            <p style={{ color: '#9aa0b8' }}>ไม่มีเอกสารแนบ</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(120px,1fr))', gap: 10 }}>
              {documents.map((doc) => (
                <a key={doc.id} href={doc.file_url} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: 10, borderRadius: 10, border: '1px solid #edeef7', background: '#fafbff', color: '#5d6480', fontSize: 12, fontWeight: 600 }}>
                  {doc.doc_type === 'photo' ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={doc.file_url} alt="เอกสาร" style={{ width: '100%', height: 76, objectFit: 'cover', borderRadius: 8 }} />
                  ) : (
                    <div style={{ fontSize: 30 }}>{doc.doc_type === 'bill' ? '🧾' : '📋'}</div>
                  )}
                  {doc.doc_type === 'photo' ? 'รูปภาพ' : doc.doc_type === 'bill' ? 'บิล' : 'ใบประเมิน'}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* updates */}
      <div style={{ ...cardStyle, marginBottom: 16 }}>
        <h2 style={{ margin: '0 0 14px', fontSize: 16 }}>📣 ความคืบหน้า (อัปเดต)</h2>
        {(!updates || updates.length === 0) ? (
          <p style={{ color: '#9aa0b8', fontSize: 14 }}>ยังไม่มีอัปเดต</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {updates.map((u) => (
              <div key={u.id} style={{ borderLeft: '3px solid #667eea', padding: '2px 0 2px 12px' }}>
                <div style={{ fontSize: 12, color: '#9aa0b8' }}>{new Date(u.created_at).toLocaleString('th-TH', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
                {u.body && <div style={{ fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{u.body}</div>}
                {u.attachments?.length > 0 && (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                    {u.attachments.map((url: string, i: number) => /\.(jpe?g|png|gif|webp)(\?|$)/i.test(url) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer"><img src={url} alt="attachment" style={{ width: 84, height: 84, objectFit: 'cover', borderRadius: 8, border: '1px solid #e9eaf3' }} /></a>
                    ) : (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, border: '1px solid #e9eaf3', borderRadius: 8, padding: '7px 12px', fontSize: 13, color: '#41454d', fontWeight: 600 }}>📎 ไฟล์แนบ</a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        {canSeeOwnerInfo && <UpdateForm caseId={id} />}
      </div>

      {/* audit */}
      {auditLogs && auditLogs.length > 0 && (
        <div style={cardStyle}>
          <h2 style={{ margin: '0 0 14px', fontSize: 16 }}>📋 Audit Trail</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {auditLogs.map((log) => (
              <div key={log.id} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '10px 12px', borderRadius: 10, background: '#fafbff', fontSize: 13 }}>
                <span style={{ color: '#9aa0b8', fontSize: 12, whiteSpace: 'nowrap' }}>{new Date(log.created_at).toLocaleString('th-TH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                <span style={{ fontWeight: 700, color: '#5560d8' }}>{log.action}</span>
                {log.details && Object.keys(log.details as object).length > 0 && (
                  <span style={{ color: '#9aa0b8', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{JSON.stringify(log.details).slice(0, 80)}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
