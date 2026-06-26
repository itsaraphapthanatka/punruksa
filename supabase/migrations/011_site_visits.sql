-- ============================================================
-- 011_site_visits.sql
-- บันทึก "ผู้เข้าชมเว็บไซต์" สำหรับหน้าหลังบ้าน admin
-- เก็บข้อมูลขั้นต่ำ + ตัดข้อมูลส่วนบุคคล (PDPA)
--   - ip_prefix: เก็บแค่ /24 (IPv4) หรือ /64 (IPv6) — ไม่ระบุตัวบุคคล
--   - user_agent: ตัดที่ 300 chars
--   - referrer: เก็บเฉพาะ host (ไม่มี query string)
--   - user_id: ผูกเฉพาะคนที่ login เท่านั้น
-- ============================================================

create table if not exists public.site_visits (
  id          uuid primary key default gen_random_uuid(),
  path        text not null,
  user_id     uuid references public.users(id) on delete set null,
  ip_prefix   text,
  user_agent  text,
  referrer    text,
  created_at  timestamptz not null default now()
);

create index if not exists idx_site_visits_created_at on public.site_visits(created_at desc);
create index if not exists idx_site_visits_path       on public.site_visits(path);
create index if not exists idx_site_visits_user_id    on public.site_visits(user_id);

alter table public.site_visits enable row level security;

-- อ่านได้เฉพาะ admin
drop policy if exists "site_visits_admin_select" on public.site_visits;
create policy "site_visits_admin_select" on public.site_visits
  for select using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'admin'
    )
  );

-- เขียนผ่าน service-role เท่านั้น (ไม่เปิด policy insert ให้ client)
-- /api/track ใช้ admin client (service-role) เพื่อ bypass RLS

comment on table public.site_visits is 'บันทึกผู้เข้าชมเว็บไซต์ — ตัด PII ตาม PDPA';
