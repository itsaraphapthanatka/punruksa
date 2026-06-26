-- ============================================================
-- 013_platform_donations.sql
-- เงินสนับสนุน "ค่าดูแลระบบ" (platform) ผ่าน PunPay
-- แยกตารางจาก donations (กองทุนรักษาสัตว์) ชัดเจน — ไม่ปนสถิติกองทุน
-- ============================================================

create table if not exists public.platform_donations (
  id           uuid primary key default gen_random_uuid(),
  charge_id    text unique not null,            -- PunPay charge id (chg_...)
  reference    text,                            -- reference ที่เราสร้าง
  amount       numeric(12,2) not null check (amount > 0),
  status       text not null default 'pending', -- pending | completed | expired
  donor_name   text,                            -- ชื่อผู้สนับสนุน (ไม่บังคับ, โชว์ขอบคุณได้)
  message      text,
  paid_at      timestamptz,
  created_at   timestamptz not null default now()
);

create index if not exists idx_platform_donations_status  on public.platform_donations(status);
create index if not exists idx_platform_donations_created on public.platform_donations(created_at desc);

alter table public.platform_donations enable row level security;

-- อ่านได้เฉพาะ admin (เขียน/อัปเดตทำผ่าน service-role ใน server action)
drop policy if exists "platform_donations_admin_select" on public.platform_donations;
create policy "platform_donations_admin_select" on public.platform_donations
  for select using (
    exists (select 1 from public.users where id = auth.uid() and role = 'admin')
  );

comment on table public.platform_donations is 'เงินสนับสนุนค่าดูแลระบบผ่าน PunPay — แยกจากกองทุนรักษาสัตว์';
