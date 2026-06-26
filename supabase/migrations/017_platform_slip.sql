-- ============================================================
-- 017_platform_slip.sql
-- รองรับการสนับสนุนค่าดูแลระบบด้วย "ตรวจสลิป" (PUNSLIP) — โอนเองแล้วอัปโหลดสลิป
-- เพิ่มควบคู่กับ PunPay เดิม (charge_id ใช้เฉพาะ PunPay → ทำให้ nullable)
-- ============================================================

-- charge_id เป็นของ PunPay เท่านั้น — สลิปไม่มี → ยอมให้ว่างได้ (unique ยังคงอยู่; null ซ้ำได้ใน Postgres)
alter table public.platform_donations alter column charge_id drop not null;

-- วิธีชำระ: punpay | slip
alter table public.platform_donations add column if not exists method text not null default 'punpay';

-- ข้อมูลสลิป
alter table public.platform_donations add column if not exists slip_ref text;   -- transRef จากสลิป (กันใช้ซ้ำ)
alter table public.platform_donations add column if not exists slip_raw jsonb;   -- response ดิบจาก PUNSLIP (audit)

-- กันสลิปเดียวกันถูกใช้ซ้ำ (เฉพาะที่มี slip_ref)
create unique index if not exists uq_platform_slip_ref on public.platform_donations(slip_ref) where slip_ref is not null;
