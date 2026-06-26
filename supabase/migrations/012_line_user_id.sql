-- ============================================================
-- 012_line_user_id.sql
-- ผูกบัญชี LINE เข้ากับผู้ใช้ (สำหรับส่งแจ้งเตือนผ่าน LINE Messaging API)
-- ใช้กับ "กรรมการโหวต" เป็นหลัก — เพื่อรับแจ้งเตือนเมื่อถูกสุ่มให้พิจารณาเคส
--
-- line_user_id = LINE userId (U...) จาก LINE Login profile
--   - ผู้ที่ login ด้วย LINE จะมี userId อยู่แล้ว (สังเคราะห์จาก email line_<id>@line.local)
--   - ผู้ที่สมัครด้วย email ปกติ ต้อง "เชื่อมต่อ LINE" ที่หน้าโปรไฟล์ก่อนถึงจะรับแจ้งเตือนได้
-- ============================================================

alter table public.users add column if not exists line_user_id text;

-- กันไม่ให้ LINE บัญชีเดียวผูกกับผู้ใช้หลายคน (partial unique — อนุญาต null ซ้ำได้)
create unique index if not exists idx_users_line_user_id
  on public.users(line_user_id)
  where line_user_id is not null;

comment on column public.users.line_user_id is 'LINE userId สำหรับส่งแจ้งเตือน (ผูกผ่านหน้าโปรไฟล์ หรือ login ด้วย LINE)';
