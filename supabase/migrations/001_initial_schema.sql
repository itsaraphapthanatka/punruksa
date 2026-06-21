-- ============================================================
-- กองทุนรักษาสัตว์ — Database Schema Migration
-- Chunk 2: สร้างตารางทั้งหมดตาม MVP_Build_Plan schema
-- ⚠️ รันไฟล์นี้ใน Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- ---------- ENUM TYPES ----------

-- Role ของผู้ใช้
CREATE TYPE user_role AS ENUM ('donor', 'caretaker', 'clinic', 'approver', 'admin');

-- ประเภทเอกสาร
CREATE TYPE doc_type AS ENUM ('photo', 'bill', 'vet_estimate');

-- โหมดเคส
CREATE TYPE case_mode AS ENUM ('normal', 'emergency');

-- สถานะเคส
CREATE TYPE case_status AS ENUM (
  'received', 'verifying', 'voting', 'approved', 'rejected', 'paid', 'closed'
);

-- สถานะรอบโหวต
CREATE TYPE vote_round_status AS ENUM ('open', 'passed', 'failed', 'expired');

-- การตัดสินโหวต
CREATE TYPE vote_decision AS ENUM ('approve', 'reject');


-- ---------- 1. USERS ----------
-- extends Supabase auth.users — id ตรงกับ auth.users.id

CREATE TABLE IF NOT EXISTS public.users (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name     TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  phone         TEXT,
  role          user_role NOT NULL DEFAULT 'donor',
  is_verified   BOOLEAN NOT NULL DEFAULT false,
  reputation_points INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.users IS 'โปรไฟล์ผู้ใช้ — ต่อกับ auth.users';


-- ---------- 2. CASES ----------

CREATE TABLE IF NOT EXISTS public.cases (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT NOT NULL,
  animal_type     TEXT NOT NULL,
  symptoms        TEXT NOT NULL,
  clinic_name     TEXT,
  requested_amount NUMERIC(12,2) NOT NULL CHECK (requested_amount > 0),
  mode            case_mode NOT NULL DEFAULT 'normal',
  status          case_status NOT NULL DEFAULT 'received',
  created_by      UUID NOT NULL REFERENCES public.users(id),
  verified_by     UUID REFERENCES public.users(id),
  verified_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_cases_status ON public.cases(status);
CREATE INDEX idx_cases_created_by ON public.cases(created_by);

COMMENT ON TABLE public.cases IS 'เคสขอรับการสนับสนุนค่ารักษาสัตว์';


-- ---------- 3. CASE_DOCUMENTS ----------

CREATE TABLE IF NOT EXISTS public.case_documents (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id   UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  doc_type  doc_type NOT NULL,
  file_url  TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_case_documents_case_id ON public.case_documents(case_id);

COMMENT ON TABLE public.case_documents IS 'เอกสารแนบเคส (รูปสัตว์, บิล, ใบประเมิน)';


-- ---------- 4. VOTE_ROUNDS ----------

CREATE TABLE IF NOT EXISTS public.vote_rounds (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id             UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  mode                case_mode NOT NULL,
  required_approvals  INTEGER NOT NULL,
  sampled_count       INTEGER NOT NULL DEFAULT 0,
  opens_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  closes_at           TIMESTAMPTZ NOT NULL,
  status              vote_round_status NOT NULL DEFAULT 'open',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_vote_rounds_case_id ON public.vote_rounds(case_id);
CREATE INDEX idx_vote_rounds_status ON public.vote_rounds(status);

COMMENT ON TABLE public.vote_rounds IS 'รอบโหวตของแต่ละเคส';


-- ---------- 5. VOTE_ASSIGNMENTS ----------

CREATE TABLE IF NOT EXISTS public.vote_assignments (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vote_round_id  UUID NOT NULL REFERENCES public.vote_rounds(id) ON DELETE CASCADE,
  user_id        UUID NOT NULL REFERENCES public.users(id),
  has_voted      BOOLEAN NOT NULL DEFAULT false,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(vote_round_id, user_id)
);

CREATE INDEX idx_vote_assignments_round ON public.vote_assignments(vote_round_id);
CREATE INDEX idx_vote_assignments_user ON public.vote_assignments(user_id);

COMMENT ON TABLE public.vote_assignments IS 'สมาชิกที่ถูกสุ่มเลือกให้โหวตในแต่ละรอบ';


-- ---------- 6. VOTES ----------

CREATE TABLE IF NOT EXISTS public.votes (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vote_round_id  UUID NOT NULL REFERENCES public.vote_rounds(id) ON DELETE CASCADE,
  voter_id       UUID NOT NULL REFERENCES public.users(id),
  decision       vote_decision NOT NULL,
  reason         TEXT NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(vote_round_id, voter_id)
);

CREATE INDEX idx_votes_round ON public.votes(vote_round_id);
CREATE INDEX idx_votes_voter ON public.votes(voter_id);

COMMENT ON TABLE public.votes IS 'การโหวตของสมาชิก (บังคับพิมพ์เหตุผล)';


-- ---------- 7. AUDIT_LOG ----------

CREATE TABLE IF NOT EXISTS public.audit_log (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id    UUID REFERENCES public.cases(id) ON DELETE SET NULL,
  actor_id   UUID REFERENCES public.users(id) ON DELETE SET NULL,
  action     TEXT NOT NULL,
  details    JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_log_case_id ON public.audit_log(case_id);
CREATE INDEX idx_audit_log_actor_id ON public.audit_log(actor_id);
CREATE INDEX idx_audit_log_action ON public.audit_log(action);
CREATE INDEX idx_audit_log_created_at ON public.audit_log(created_at DESC);

COMMENT ON TABLE public.audit_log IS 'บันทึกทุกการกระทำในระบบ — ความโปร่งใส';


-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vote_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vote_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;


-- ===== USERS =====

-- ผู้ใช้ดูโปรไฟล์ตัวเองได้
CREATE POLICY "users_select_own" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- ผู้ใช้แก้ไขโปรไฟล์ตัวเองได้
CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- ผู้ใช้สร้างโปรไฟล์ตัวเอง (ตอนสมัคร)
CREATE POLICY "users_insert_own" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Admin ดูข้อมูลทุกคนได้
CREATE POLICY "users_select_admin" ON public.users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );


-- ===== CASES =====

-- ทุกคนที่ login ดูเคสได้ (จะปิดบังข้อมูลส่วนตัวที่ app level)
CREATE POLICY "cases_select_authenticated" ON public.cases
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- ผู้ใช้สร้างเคสของตัวเอง
CREATE POLICY "cases_insert_own" ON public.cases
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Admin อัปเดตเคสได้ (verify, change status)
CREATE POLICY "cases_update_admin" ON public.cases
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );


-- ===== CASE_DOCUMENTS =====

-- ดูเอกสารของเคสที่ตัวเองเปิด หรือ ทุกคนที่ login (ปิดบังที่ app level)
CREATE POLICY "case_docs_select_authenticated" ON public.case_documents
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- สร้างเอกสารสำหรับเคสที่ตัวเองเปิด
CREATE POLICY "case_docs_insert_owner" ON public.case_documents
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.cases c
      WHERE c.id = case_id AND c.created_by = auth.uid()
    )
  );


-- ===== VOTE_ROUNDS =====

CREATE POLICY "vote_rounds_select_authenticated" ON public.vote_rounds
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Admin สร้างรอบโหวต
CREATE POLICY "vote_rounds_insert_admin" ON public.vote_rounds
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- Admin อัปเดตรอบโหวต
CREATE POLICY "vote_rounds_update_admin" ON public.vote_rounds
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );


-- ===== VOTE_ASSIGNMENTS =====

-- ดู assignment ของตัวเอง
CREATE POLICY "vote_assignments_select_own" ON public.vote_assignments
  FOR SELECT USING (user_id = auth.uid());

-- Admin ดูทุก assignment
CREATE POLICY "vote_assignments_select_admin" ON public.vote_assignments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- Admin สร้าง assignment
CREATE POLICY "vote_assignments_insert_admin" ON public.vote_assignments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- ผู้ใช้อัปเดต assignment ตัวเอง (has_voted)
CREATE POLICY "vote_assignments_update_own" ON public.vote_assignments
  FOR UPDATE USING (user_id = auth.uid());


-- ===== VOTES =====

-- ดูโหวตของตัวเอง
CREATE POLICY "votes_select_own" ON public.votes
  FOR SELECT USING (voter_id = auth.uid());

-- Admin ดูทุกโหวต
CREATE POLICY "votes_select_admin" ON public.votes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- สร้างโหวต (ถ้าถูก assign)
CREATE POLICY "votes_insert_assigned" ON public.votes
  FOR INSERT WITH CHECK (
    voter_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.vote_assignments va
      WHERE va.vote_round_id = vote_round_id
        AND va.user_id = auth.uid()
        AND va.has_voted = false
    )
  );


-- ===== AUDIT_LOG =====

-- ทุกคนที่ login เขียน audit log ได้
CREATE POLICY "audit_log_insert_authenticated" ON public.audit_log
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ทุกคนที่ login ดู audit log ได้ (ความโปร่งใส)
CREATE POLICY "audit_log_select_authenticated" ON public.audit_log
  FOR SELECT USING (auth.uid() IS NOT NULL);


-- ============================================================
-- Supabase Storage Bucket
-- ============================================================
-- สร้าง bucket สำหรับเก็บไฟล์เคส (รูป, บิล, ใบเสร็จ)
-- ⚠️ รัน SQL นี้แยก หรือสร้างผ่าน Dashboard > Storage

INSERT INTO storage.buckets (id, name, public)
VALUES ('case-files', 'case-files', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: ทุกคนที่ login อัปโหลดไฟล์ได้
CREATE POLICY "case_files_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'case-files' AND auth.uid() IS NOT NULL
  );

-- Policy: ทุกคนดูไฟล์ได้ (public bucket)
CREATE POLICY "case_files_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'case-files');


-- ============================================================
-- ✅ Migration Complete
-- ตาราง: users, cases, case_documents, vote_rounds,
--         vote_assignments, votes, audit_log
-- RLS: เปิดทุกตาราง + policies ครบ
-- Storage: bucket 'case-files' พร้อมใช้
-- ============================================================
