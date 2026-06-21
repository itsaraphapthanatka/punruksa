-- ============================================================
-- 002_fix_rls_recursion.sql
-- แก้ RLS infinite recursion (error 42P17) บน public.users และตารางที่อ้างถึง
--
-- สาเหตุ: policy เช็ก admin ด้วย  EXISTS(SELECT 1 FROM public.users ...)
-- ซึ่งตัวมันเองอยู่บนตาราง users → re-trigger policy เดิมไม่รู้จบ
--
-- วิธีแก้: ย้ายการเช็ก role ไปไว้ใน SECURITY DEFINER function
-- ที่รันด้วยสิทธิ์เจ้าของตาราง (bypass RLS) → ตัดวงจรวนซ้ำ
-- ============================================================

-- 1) Helper: ผู้ใช้ปัจจุบันเป็น admin ไหม
--    SECURITY DEFINER + เจ้าของเป็น postgres ⇒ query ภายใน bypass RLS ของ users
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, anon;

-- 2) สร้าง policy ที่เป็นปัญหาใหม่ ให้เรียก public.is_admin() แทน subquery ที่วนซ้ำ

-- ----- users -----
DROP POLICY IF EXISTS "users_select_admin" ON public.users;
CREATE POLICY "users_select_admin" ON public.users
  FOR SELECT USING (public.is_admin());

-- ----- cases -----
DROP POLICY IF EXISTS "cases_update_admin" ON public.cases;
CREATE POLICY "cases_update_admin" ON public.cases
  FOR UPDATE USING (public.is_admin());

-- ----- vote_rounds -----
DROP POLICY IF EXISTS "vote_rounds_insert_admin" ON public.vote_rounds;
CREATE POLICY "vote_rounds_insert_admin" ON public.vote_rounds
  FOR INSERT WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "vote_rounds_update_admin" ON public.vote_rounds;
CREATE POLICY "vote_rounds_update_admin" ON public.vote_rounds
  FOR UPDATE USING (public.is_admin());

-- ----- vote_assignments -----
DROP POLICY IF EXISTS "vote_assignments_select_admin" ON public.vote_assignments;
CREATE POLICY "vote_assignments_select_admin" ON public.vote_assignments
  FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "vote_assignments_insert_admin" ON public.vote_assignments;
CREATE POLICY "vote_assignments_insert_admin" ON public.vote_assignments
  FOR INSERT WITH CHECK (public.is_admin());

-- ----- votes -----
DROP POLICY IF EXISTS "votes_select_admin" ON public.votes;
CREATE POLICY "votes_select_admin" ON public.votes
  FOR SELECT USING (public.is_admin());

-- เสร็จ — ตาราง users / votes / vote_assignments จะอ่านได้ปกติ (ไม่ 500 อีก)
