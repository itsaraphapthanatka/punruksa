-- ============================================================
-- 007_receipt_privacy.sql
-- สลิป/หลักฐานการจ่ายเงิน (ไฟล์ใต้ path "receipts/") อาจมีเลขบัญชี/ข้อมูลธนาคาร
-- → ให้เห็นเฉพาะแอดมิน ไม่เปิดสาธารณะ (แยกด้วย path ไม่ต้องเพิ่ม enum)
-- ============================================================

-- สาธารณะ (anon): เห็นทุกเอกสารยกเว้นสลิป
drop policy if exists "case_documents_select_public" on public.case_documents;
create policy "case_documents_select_public" on public.case_documents
  for select using (file_url not like '%/receipts/%');

-- ผู้ล็อกอินทั่วไป: เดิมเห็นทุก doc → จำกัดให้ไม่เห็นสลิป
drop policy if exists "case_docs_select_authenticated" on public.case_documents;
create policy "case_docs_select_authenticated" on public.case_documents
  for select using (auth.uid() is not null and file_url not like '%/receipts/%');

-- แอดมิน: เห็นทุกอย่างรวมสลิป
drop policy if exists "case_documents_select_admin" on public.case_documents;
create policy "case_documents_select_admin" on public.case_documents
  for select using (public.is_admin());
