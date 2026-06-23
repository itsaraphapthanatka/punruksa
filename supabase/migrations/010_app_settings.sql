-- ============================================================
-- 010_app_settings.sql
-- ตั้งค่าระบบแบบ key-value (เช่น เปิด/ปิด การรับบริจาค)
-- อ่านได้ทุกคน (หน้า /donate ต้องเช็คก่อนแสดงฟอร์ม) แต่แก้ไขผ่าน service-role เท่านั้น
-- ============================================================

create table if not exists public.app_settings (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.users(id)
);

alter table public.app_settings enable row level security;

-- อ่านได้ทุกคน (รวม guest) เพื่อเช็คสถานะการรับบริจาค
drop policy if exists "app_settings_select_all" on public.app_settings;
create policy "app_settings_select_all" on public.app_settings for select using (true);
-- การแก้ไขทำผ่าน service-role (admin server action) — ไม่เปิด policy insert/update ให้ client

-- ค่าเริ่มต้น: เปิดรับบริจาค
insert into public.app_settings (key, value)
values ('donations_enabled', 'true'::jsonb)
on conflict (key) do nothing;
