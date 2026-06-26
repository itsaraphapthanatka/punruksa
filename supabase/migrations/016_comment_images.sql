-- ============================================================
-- 016_comment_images.sql
-- แนบรูปในความคิดเห็น — เก็บใน Storage (bucket: comments)
-- ปรับ constraint ให้ความคิดเห็นมีรูปอย่างเดียว (ไม่มีข้อความ) ได้
-- ============================================================

alter table public.comments add column if not exists image_url text;

-- เดิม: body ต้องมี 1-1000 ตัวอักษร → ปรับเป็น: ยาวไม่เกิน 1000 และ (มีข้อความ หรือ มีรูปแนบ)
alter table public.comments drop constraint if exists comments_body_check;
alter table public.comments
  add constraint comments_body_chk
  check (char_length(body) <= 1000 and (char_length(body) >= 1 or image_url is not null));
