-- ============================================================
-- 005_donations_payment.sql
-- รองรับการบริจาคจริงผ่าน PayNoi (PromptPay)
-- เพิ่มสถานะ/ข้อมูลธุรกรรมให้ตาราง donations
-- ============================================================

alter table public.donations
  add column if not exists status      text not null default 'pending',  -- pending | completed | failed | expired
  add column if not exists method      text,                             -- เช่น 'promptpay_paynoi'
  add column if not exists trans_id    text,                             -- trans_id จาก PayNoi
  add column if not exists ref1        text,                             -- reference ที่เราสร้าง
  add column if not exists amount_paid numeric(12,2),                    -- ยอดจริงที่ต้อง/ได้โอน (มีเศษสตางค์)
  add column if not exists expire_at   timestamptz;

create index if not exists idx_donations_trans on public.donations(trans_id);

-- แถวเดโมเดิม (ก่อนมีระบบจ่ายจริง) ให้นับเป็น completed เพื่อคงสถิติเดิมไว้
update public.donations set status = 'completed' where is_demo = true;

-- หมายเหตุ RLS:
--   - การอัปเดตสถานะหลังจ่ายเงิน ทำผ่าน service-role (webhook / ยืนยันการจ่าย) ซึ่ง bypass RLS อยู่แล้ว
--   - ผู้บริจาคยังคง insert ในนามตัวเองได้ (policy เดิม donations_insert_self) และอ่านสาธารณะได้ (donations_select_public)
--   - ไม่เปิด policy update ให้ผู้ใช้ทั่วไป (กันการแก้สถานะเอง)
