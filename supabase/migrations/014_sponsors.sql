-- ============================================================
-- 014_sponsors.sql
-- ผู้ร่วมสนับสนุน (องค์กร/คลินิก/โรงพยาบาล/โรงแรมสัตว์/ร้านค้า)
-- จัดการผ่านหน้า admin — โลโก้เก็บใน Supabase Storage (bucket: sponsors)
-- อ่านได้ทุกคน (หน้าแรกแสดงโลโก้) แต่แก้ไขผ่าน service-role เท่านั้น
-- ============================================================

create table if not exists public.sponsors (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  logo_url    text,
  url         text,
  category    text,                              -- organization | clinic | hospital | pet_hotel | pet_shop
  sort_order  int  not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);
create index if not exists idx_sponsors_active on public.sponsors(is_active, sort_order);

alter table public.sponsors enable row level security;

-- อ่านได้ทุกคน (รวม guest) เพื่อแสดงบนหน้าแรก
drop policy if exists "sponsors_select_all" on public.sponsors;
create policy "sponsors_select_all" on public.sponsors for select using (true);
-- การเพิ่ม/แก้/ลบ ทำผ่าน service-role (admin server action) — ไม่เปิด policy write ให้ client
