-- ============================================================
-- seed_demo_cases.sql — สร้างเคสตัวอย่างครอบคลุมทุกสถานะ
-- รันใน Supabase Dashboard → SQL Editor → Run
-- ⚠️ ต้องรัน seed_demo_users.sql ก่อน (ใช้ caretaker/donor/approver ที่สร้างไว้)
--
-- สร้าง 6 เคส (prefix "[เดโม]" เพื่อให้ลบง่าย):
--   1. received           รอตรวจเอกสาร            → โชว์ในคิวแอดมิน
--   2. voting (ปกติ)       กำลังโหวต 7/15 (ยังไม่ครบ) → กรรมการที่เหลือโหวตต่อได้
--   3. voting (ฉุกเฉิน)    fast-track 5/15           → โชว์โหมดฉุกเฉิน
--   4. approved           โหวตผ่านแล้ว รอจ่าย        → โชว์ในคิวจ่ายเงินแอดมิน
--   5. closed             จ่าย+ปิดเคสแล้ว           → เคสสมบูรณ์ + audit ครบ
--   6. rejected           โหวตไม่ผ่าน
--
-- รันซ้ำได้ (ถ้ามีเคสเดโมแล้วจะข้าม)
-- ============================================================

do $$
declare
  v_caretaker uuid;
  v_donor     uuid;
  v_admin     uuid;
  v_approvers uuid[];
  v_case      uuid;
  v_round     uuid;
  i           int;
  n           int;
begin
  select id into v_caretaker from public.users where email = 'caretaker@demo.local';
  select id into v_donor     from public.users where email = 'donor@demo.local';
  select id into v_admin     from public.users where email = 'admin@demo.local';
  select array_agg(id order by email) into v_approvers from public.users where role = 'approver';

  if v_caretaker is null or v_donor is null or v_admin is null or v_approvers is null then
    raise exception 'ยังไม่มีบัญชีเดโมครบ — กรุณารัน seed_demo_users.sql ก่อน';
  end if;
  n := array_length(v_approvers, 1);

  if exists (select 1 from public.cases where title like '[เดโม]%') then
    raise notice 'มีเคสเดโมอยู่แล้ว — ข้าม (ลบ title LIKE ''[เดโม]%%'' ก่อนถ้าต้องการสร้างใหม่)';
    return;
  end if;

  -- ========== 1) RECEIVED — รอตรวจ ==========
  insert into public.cases (title, animal_type, symptoms, clinic_name, requested_amount, mode, status, created_by, created_at)
  values ('[เดโม] แมวจรถูกรถชน ขาหลังหัก', 'แมว', 'ขาหลังซ้ายหักจากอุบัติเหตุรถชน เดินไม่ได้ ต้องเอกซเรย์และดามกระดูกด่วน', 'โรงพยาบาลสัตว์ลาดพร้าว', 8500, 'normal', 'received', v_caretaker, now() - interval '3 hours')
  returning id into v_case;
  insert into public.case_documents (case_id, doc_type, file_url) values
    (v_case, 'photo', 'https://placehold.co/640x420/eef0fd/5560d8?text=Cat+Photo'),
    (v_case, 'bill',  'https://placehold.co/640x420/eef0fd/5560d8?text=Vet+Bill');
  insert into public.audit_log (case_id, actor_id, action, details)
  values (v_case, v_caretaker, 'case_created', jsonb_build_object('title', '[เดโม] แมวจรถูกรถชน ขาหลังหัก'));

  -- ========== 2) VOTING (ปกติ) — 7/15 ==========
  insert into public.cases (title, animal_type, symptoms, clinic_name, requested_amount, mode, status, created_by, verified_by, verified_at, created_at)
  values ('[เดโม] สุนัขป่วยลำไส้อักเสบรุนแรง', 'สุนัข', 'อาเจียน ท้องเสียมีเลือด ซึม ไม่กินอาหาร 3 วัน ต้องแอดมิทให้น้ำเกลือและยาปฏิชีวนะ', 'คลินิกรักษาสัตว์ใจดี', 12000, 'normal', 'voting', v_donor, v_admin, now() - interval '6 hours', now() - interval '1 day')
  returning id into v_case;
  insert into public.case_documents (case_id, doc_type, file_url) values
    (v_case, 'photo', 'https://placehold.co/640x420/ecfdf5/047857?text=Dog+Photo'),
    (v_case, 'vet_estimate', 'https://placehold.co/640x420/ecfdf5/047857?text=Estimate');
  insert into public.vote_rounds (case_id, mode, required_approvals, sampled_count, opens_at, closes_at, status)
  values (v_case, 'normal', 12, n, now() - interval '6 hours', now() + interval '42 hours', 'open')
  returning id into v_round;
  for i in 1..n loop
    insert into public.vote_assignments (vote_round_id, user_id, has_voted) values (v_round, v_approvers[i], i <= 7);
  end loop;
  for i in 1..7 loop
    insert into public.votes (vote_round_id, voter_id, decision, reason)
    values (v_round, v_approvers[i],
      (case when i = 5 then 'reject' else 'approve' end)::vote_decision,
      case when i = 5 then 'ขอใบประเมินค่ารักษาเพิ่มเติมก่อน' else 'เอกสารครบ อาการสมเหตุผล ควรช่วยเหลือ' end);
  end loop;
  insert into public.audit_log (case_id, actor_id, action, details) values
    (v_case, v_donor, 'case_created', jsonb_build_object('title', '[เดโม] สุนัขป่วยลำไส้อักเสบรุนแรง')),
    (v_case, v_admin, 'vote_round_opened', jsonb_build_object('sampled', n, 'required', 12));

  -- ========== 3) VOTING (ฉุกเฉิน) — 5/15 ==========
  insert into public.cases (title, animal_type, symptoms, clinic_name, requested_amount, mode, status, created_by, verified_by, verified_at, created_at)
  values ('[เดโม] ลูกสุนัขถูกสุนัขใหญ่กัด เลือดออกมาก', 'สุนัข', 'บาดแผลฉีกขาดบริเวณคอและขา เสียเลือดมาก ต้องผ่าตัดเย็บแผลและให้เลือดด่วน', 'โรงพยาบาลสัตว์ 24 ชม.', 15000, 'emergency', 'voting', v_caretaker, v_admin, now() - interval '90 minutes', now() - interval '2 hours')
  returning id into v_case;
  insert into public.case_documents (case_id, doc_type, file_url) values
    (v_case, 'photo', 'https://placehold.co/640x420/fef2f2/b91c1c?text=Emergency'),
    (v_case, 'bill',  'https://placehold.co/640x420/fef2f2/b91c1c?text=Bill');
  insert into public.vote_rounds (case_id, mode, required_approvals, sampled_count, opens_at, closes_at, status)
  values (v_case, 'emergency', 10, n, now() - interval '90 minutes', now() + interval '150 minutes', 'open')
  returning id into v_round;
  for i in 1..n loop
    insert into public.vote_assignments (vote_round_id, user_id, has_voted) values (v_round, v_approvers[i], i <= 5);
  end loop;
  for i in 1..5 loop
    insert into public.votes (vote_round_id, voter_id, decision, reason)
    values (v_round, v_approvers[i], 'approve', 'เคสฉุกเฉิน อาการน่าเชื่อ ควรช่วยเร่งด่วน');
  end loop;
  insert into public.audit_log (case_id, actor_id, action, details) values
    (v_case, v_caretaker, 'case_created', jsonb_build_object('title', '[เดโม] ลูกสุนัขถูกสุนัขใหญ่กัด')),
    (v_case, v_admin, 'vote_round_opened', jsonb_build_object('sampled', n, 'required', 10, 'mode', 'emergency'));

  -- ========== 4) APPROVED — โหวตผ่าน รอจ่าย ==========
  insert into public.cases (title, animal_type, symptoms, clinic_name, requested_amount, mode, status, created_by, verified_by, verified_at, created_at)
  values ('[เดโม] แมวกระดูกเชิงกรานหัก ต้องผ่าตัด', 'แมว', 'ตกจากที่สูง กระดูกเชิงกรานหัก ต้องผ่าตัดดามและพักฟื้น 1 เดือน', 'โรงพยาบาลสัตว์มหิดล', 22000, 'normal', 'approved', v_caretaker, v_admin, now() - interval '3 days', now() - interval '4 days')
  returning id into v_case;
  insert into public.case_documents (case_id, doc_type, file_url) values
    (v_case, 'photo', 'https://placehold.co/640x420/eef0fd/5560d8?text=Cat'),
    (v_case, 'vet_estimate', 'https://placehold.co/640x420/eef0fd/5560d8?text=Estimate');
  insert into public.vote_rounds (case_id, mode, required_approvals, sampled_count, opens_at, closes_at, status)
  values (v_case, 'normal', 12, n, now() - interval '3 days', now() - interval '1 day', 'passed')
  returning id into v_round;
  for i in 1..n loop
    insert into public.vote_assignments (vote_round_id, user_id, has_voted) values (v_round, v_approvers[i], true);
  end loop;
  for i in 1..n loop
    insert into public.votes (vote_round_id, voter_id, decision, reason)
    values (v_round, v_approvers[i],
      (case when i <= 13 then 'approve' else 'reject' end)::vote_decision,
      case when i <= 13 then 'เอกสารครบ จำเป็นต้องผ่าตัด เห็นควรอนุมัติ' else 'ยอดสูง ขอตรวจสอบเพิ่ม' end);
  end loop;
  insert into public.audit_log (case_id, actor_id, action, details) values
    (v_case, v_caretaker, 'case_created', jsonb_build_object('title', '[เดโม] แมวกระดูกเชิงกรานหัก')),
    (v_case, v_admin, 'vote_round_opened', jsonb_build_object('sampled', n, 'required', 12)),
    (v_case, null, 'case_approved', jsonb_build_object('approve', 13, 'required', 12));

  -- ========== 5) CLOSED — จ่าย+ปิดแล้ว ==========
  insert into public.cases (title, animal_type, symptoms, clinic_name, requested_amount, mode, status, created_by, verified_by, verified_at, created_at)
  values ('[เดโม] สุนัขชราผ่าตัดเนื้องอกเต้านม', 'สุนัข', 'พบก้อนเนื้อบริเวณเต้านม ผลชิ้นเนื้อเป็นเนื้องอก ต้องผ่าตัดออกและพักฟื้น', 'คลินิกสัตวแพทย์รังสิต', 18000, 'normal', 'closed', v_donor, v_admin, now() - interval '10 days', now() - interval '12 days')
  returning id into v_case;
  insert into public.case_documents (case_id, doc_type, file_url) values
    (v_case, 'photo', 'https://placehold.co/640x420/e8e6f5/5a4cae?text=Dog'),
    (v_case, 'bill',  'https://placehold.co/640x420/e8e6f5/5a4cae?text=Receipt');
  insert into public.vote_rounds (case_id, mode, required_approvals, sampled_count, opens_at, closes_at, status)
  values (v_case, 'normal', 12, n, now() - interval '10 days', now() - interval '8 days', 'passed')
  returning id into v_round;
  for i in 1..n loop
    insert into public.vote_assignments (vote_round_id, user_id, has_voted) values (v_round, v_approvers[i], true);
  end loop;
  for i in 1..n loop
    insert into public.votes (vote_round_id, voter_id, decision, reason)
    values (v_round, v_approvers[i],
      (case when i <= 14 then 'approve' else 'reject' end)::vote_decision,
      case when i <= 14 then 'เคสชัดเจน ควรช่วยเหลือ' else 'ขอข้อมูลเพิ่ม' end);
  end loop;
  insert into public.audit_log (case_id, actor_id, action, details) values
    (v_case, v_donor, 'case_created', jsonb_build_object('title', '[เดโม] สุนัขชราผ่าตัดเนื้องอก')),
    (v_case, v_admin, 'vote_round_opened', jsonb_build_object('sampled', n, 'required', 12)),
    (v_case, null, 'case_approved', jsonb_build_object('approve', 14, 'required', 12)),
    (v_case, v_admin, 'payment_recorded', jsonb_build_object('amount', 18000, 'receipt', 'INV-DEMO-0001 จ่ายตรงคลินิกสัตวแพทย์รังสิต'));

  -- ========== 6) REJECTED — โหวตไม่ผ่าน ==========
  insert into public.cases (title, animal_type, symptoms, clinic_name, requested_amount, mode, status, created_by, verified_by, verified_at, created_at)
  values ('[เดโม] ขอค่ารักษาทั่วไป (เอกสารไม่ครบ)', 'แมว', 'ขอค่ารักษาแต่แนบเอกสารไม่ครบ ไม่มีใบประเมินจากคลินิก', null, 9000, 'normal', 'rejected', v_donor, v_admin, now() - interval '5 days', now() - interval '6 days')
  returning id into v_case;
  insert into public.vote_rounds (case_id, mode, required_approvals, sampled_count, opens_at, closes_at, status)
  values (v_case, 'normal', 12, n, now() - interval '5 days', now() - interval '3 days', 'failed')
  returning id into v_round;
  for i in 1..n loop
    insert into public.vote_assignments (vote_round_id, user_id, has_voted) values (v_round, v_approvers[i], i <= 12);
  end loop;
  for i in 1..12 loop
    insert into public.votes (vote_round_id, voter_id, decision, reason)
    values (v_round, v_approvers[i],
      (case when i <= 3 then 'approve' else 'reject' end)::vote_decision,
      case when i <= 3 then 'พอช่วยได้' else 'เอกสารไม่ครบ ไม่มีใบประเมินค่ารักษา' end);
  end loop;
  insert into public.audit_log (case_id, actor_id, action, details) values
    (v_case, v_donor, 'case_created', jsonb_build_object('title', '[เดโม] ขอค่ารักษาทั่วไป')),
    (v_case, v_admin, 'vote_round_opened', jsonb_build_object('sampled', n, 'required', 12)),
    (v_case, null, 'case_rejected_by_vote', jsonb_build_object('approve', 3, 'reject', 9));

  raise notice 'สร้างเคสเดโม 6 เคสเรียบร้อย';
end $$;

-- ตรวจผล:
select status, count(*) from public.cases where title like '[เดโม]%' group by status order by status;
