-- ============================================================
-- seed_demo_users.sql — สร้างบัญชีตัวอย่างสำหรับเดโม
-- รันใน Supabase Dashboard → SQL Editor → Run
--
-- ⚠️ สำหรับเดโม/ทดสอบเท่านั้น — ทุกบัญชีใช้รหัสผ่านเดียวกัน 'demo1234'
--    และยืนยันอีเมลให้แล้ว (email_confirmed_at) เพื่อ login ได้ทันที
--    อย่าใช้รูปแบบนี้ใน production
--
-- บัญชีที่สร้าง:
--   admin@demo.local      (admin)      ผู้ดูแลระบบ
--   caretaker@demo.local  (caretaker)  ผู้เปิดเคส/ผู้ดูแล
--   donor@demo.local      (donor)      ผู้บริจาค/ผู้เยี่ยมชม
--   approver1..15@demo.local (approver) กรรมการโหวต 15 คน (พอสำหรับสุ่มโหวตจริง)
--
-- รันซ้ำได้ (ข้ามบัญชีที่มีอยู่แล้ว)
-- ============================================================

create extension if not exists pgcrypto with schema extensions;

do $$
declare
  rec    record;
  v_id   uuid;
  v_pw   constant text := 'demo1234';
begin
  for rec in
    select email, full_name, role from (
      values
        ('admin@demo.local',     'ผู้ดูแลระบบ (เดโม)', 'admin'),
        ('caretaker@demo.local', 'คุณเมตตา ใจดี',      'caretaker'),
        ('donor@demo.local',     'คุณการุณ ผู้ให้',     'donor')
    ) as t(email, full_name, role)
    union all
    select 'approver' || g || '@demo.local', 'กรรมการ #' || g, 'approver'
    from generate_series(1, 15) as g
  loop
    -- ข้ามถ้ามีอยู่แล้ว
    if exists (select 1 from auth.users where email = rec.email) then
      continue;
    end if;

    v_id := gen_random_uuid();

    -- 1) auth.users  (ตั้ง token ว่างเป็น '' กัน GoTrue error ตอน login)
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change, email_change_token_new
    ) values (
      '00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated',
      rec.email, extensions.crypt(v_pw, extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('full_name', rec.full_name), now(), now(),
      '', '', '', ''
    );

    -- 2) auth.identities (ต้องมีเพื่อ login ด้วย email ใน GoTrue เวอร์ชันใหม่)
    insert into auth.identities (
      id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
    ) values (
      gen_random_uuid(), v_id::text, v_id,
      jsonb_build_object('sub', v_id::text, 'email', rec.email),
      'email', now(), now(), now()
    );

    -- 3) public.users (โปรไฟล์ในแอป)
    insert into public.users (id, email, full_name, role, is_verified, reputation_points)
    values (v_id, rec.email, rec.full_name, rec.role::user_role, true, 0)
    on conflict (id) do nothing;
  end loop;
end $$;

-- ตรวจผล:
select role, count(*) from public.users group by role order by role;
