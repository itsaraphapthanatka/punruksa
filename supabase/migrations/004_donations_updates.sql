-- ============================================================
-- 004_donations_updates.sql
-- ฟังก์ชันแบบ taejai (โมเดลกองกลาง): บริจาคเข้ากองทุน + อัปเดตเคส + เปิดดูสาธารณะ
-- รันใน Supabase Dashboard → SQL Editor (หลัง 001/002 และ seed)
-- ⚠️ การบริจาคเป็นเดโม (is_demo=true) ยังไม่ใช่เงินจริง
-- ============================================================

-- ---------- DONATIONS (เข้ากองกลาง) ----------
create table if not exists public.donations (
  id         uuid primary key default gen_random_uuid(),
  donor_id   uuid references public.users(id) on delete set null,
  amount     numeric(12,2) not null check (amount > 0),
  message    text,
  is_demo    boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists idx_donations_created on public.donations(created_at desc);
alter table public.donations enable row level security;

-- อ่านได้สาธารณะ (สำหรับสถิติ/ยอดกองทุนหน้าแรก) — เดโม
drop policy if exists "donations_select_public" on public.donations;
create policy "donations_select_public" on public.donations for select using (true);
-- ผู้ login บริจาคในนามตัวเอง
drop policy if exists "donations_insert_self" on public.donations;
create policy "donations_insert_self" on public.donations for insert with check (donor_id = auth.uid());

-- ---------- CASE UPDATES (อัปเดตความคืบหน้า) ----------
create table if not exists public.case_updates (
  id         uuid primary key default gen_random_uuid(),
  case_id    uuid not null references public.cases(id) on delete cascade,
  author_id  uuid references public.users(id) on delete set null,
  body       text not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_case_updates_case on public.case_updates(case_id);
alter table public.case_updates enable row level security;

drop policy if exists "case_updates_select_public" on public.case_updates;
create policy "case_updates_select_public" on public.case_updates for select using (true);
-- เจ้าของเคส หรือ admin โพสต์อัปเดตได้
drop policy if exists "case_updates_insert_owner_admin" on public.case_updates;
create policy "case_updates_insert_owner_admin" on public.case_updates for insert with check (
  public.is_admin() or exists (select 1 from public.cases c where c.id = case_id and c.created_by = auth.uid())
);

-- ---------- เปิดดูเคส/เอกสารแบบสาธารณะ (browse หน้าแรกโดยไม่ต้อง login) ----------
-- ปิดบังตัวตนเจ้าของที่ระดับ app (created_by เป็น uuid ไม่ใช่ PII)
drop policy if exists "cases_select_public" on public.cases;
create policy "cases_select_public" on public.cases for select using (true);
drop policy if exists "case_documents_select_public" on public.case_documents;
create policy "case_documents_select_public" on public.case_documents for select using (true);

-- ตรวจผล
select 'donations' t, count(*) from public.donations
union all select 'case_updates', count(*) from public.case_updates;
