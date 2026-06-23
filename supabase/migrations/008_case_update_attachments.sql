-- ============================================================
-- 008_case_update_attachments.sql
-- แนบรูป/ไฟล์ในโพสต์อัปเดตความคืบหน้า (เก็บ URL ไฟล์เป็น array)
-- ============================================================

alter table public.case_updates
  add column if not exists attachments text[] not null default '{}';
