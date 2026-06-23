-- ============================================================
-- 006_guest_donations.sql
-- รองรับการบริจาคแบบไม่ต้องล็อกอิน + เก็บข้อมูลผู้บริจาค
-- ============================================================

-- ชื่อเล่น = display name (โชว์บนวอลล์ผู้สนับสนุนได้ ไม่ใช่ PII อ่อนไหว)
alter table public.donations add column if not exists donor_nickname text;
-- donor_id เป็น null สำหรับผู้บริจาคที่ไม่ล็อกอิน (คอลัมน์ nullable อยู่แล้ว)

-- ข้อมูลติดต่อผู้บริจาค (PII) — เก็บแยก, อ่านได้เฉพาะแอดมิน, ไม่เปิดสาธารณะ
create table if not exists public.donation_contacts (
  id          uuid primary key default gen_random_uuid(),
  donation_id uuid not null references public.donations(id) on delete cascade,
  full_name   text not null,
  phone       text not null,
  created_at  timestamptz not null default now()
);
create index if not exists idx_donation_contacts_donation on public.donation_contacts(donation_id);

alter table public.donation_contacts enable row level security;

-- อ่าน PII ได้เฉพาะแอดมิน (ใช้ is_admin() จาก migration 002)
drop policy if exists "donation_contacts_select_admin" on public.donation_contacts;
create policy "donation_contacts_select_admin" on public.donation_contacts
  for select using (public.is_admin());

-- ไม่เปิด policy insert ให้ผู้ใช้ทั่วไป — insert ทำผ่าน service-role (bypass RLS) ในฝั่งเซิร์ฟเวอร์เท่านั้น
