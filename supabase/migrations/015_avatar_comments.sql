-- ============================================================
-- 015_avatar_comments.sql
-- (1) avatar_url บนโปรไฟล์ผู้ใช้ — อัปโหลดรูปเก็บใน Storage (bucket: avatars)
-- (2) comments — ความคิดเห็นบนหน้าแรก (ต้องเป็นสมาชิกถึงจะโพสต์ได้)
-- ============================================================

-- (1) รูปโปรไฟล์
alter table public.users add column if not exists avatar_url text;

-- (2) ความคิดเห็นหน้าแรก
create table if not exists public.comments (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users(id) on delete cascade,
  body       text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now()
);
create index if not exists idx_comments_created on public.comments(created_at desc);

alter table public.comments enable row level security;

-- อ่านได้ทุกคน (รวม guest) เพื่อแสดงบนหน้าแรก
drop policy if exists "comments_select_all" on public.comments;
create policy "comments_select_all" on public.comments for select using (true);

-- โพสต์ได้เฉพาะสมาชิกที่ login และเป็นเจ้าของข้อความ
drop policy if exists "comments_insert_self" on public.comments;
create policy "comments_insert_self" on public.comments for insert with check (user_id = auth.uid());

-- ลบได้เฉพาะของตัวเอง (แอดมินลบผ่าน service-role)
drop policy if exists "comments_delete_self" on public.comments;
create policy "comments_delete_self" on public.comments for delete using (user_id = auth.uid());
