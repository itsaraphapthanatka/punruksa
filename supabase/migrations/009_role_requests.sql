-- ============================================================
-- 009_role_requests.sql
-- คำขอเปลี่ยนบทบาท (เช่น ผู้ใช้ขอเป็นกรรมการ approver)
-- ============================================================

create table if not exists public.role_requests (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.users(id) on delete cascade,
  requested_role text not null default 'approver',
  status         text not null default 'pending',  -- pending | approved | rejected
  note           text,
  created_at     timestamptz not null default now()
);
create index if not exists idx_role_requests_status on public.role_requests(status);

alter table public.role_requests enable row level security;

-- ผู้ใช้สร้าง/ดูคำขอของตัวเอง
drop policy if exists "role_requests_insert_self" on public.role_requests;
create policy "role_requests_insert_self" on public.role_requests for insert with check (user_id = auth.uid());
drop policy if exists "role_requests_select_self" on public.role_requests;
create policy "role_requests_select_self" on public.role_requests for select using (user_id = auth.uid());
-- แอดมินดูทั้งหมด (อนุมัติ/ปฏิเสธทำผ่าน service-role)
drop policy if exists "role_requests_select_admin" on public.role_requests;
create policy "role_requests_select_admin" on public.role_requests for select using (public.is_admin());
