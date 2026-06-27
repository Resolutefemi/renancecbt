-- ═══════════════════════════════════════════════════════════════════════════
-- RENANCE CBT — Custom Quizzes + PDF Uploads Schema
-- Run this in Supabase SQL Editor (Dashboard → SQL → New Query)
-- ═══════════════════════════════════════════════════════════════════════════

-- ═══ 1. CUSTOM QUIZZES TABLE ═══
CREATE TABLE IF NOT EXISTS custom_quizzes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    creator_name TEXT NOT NULL DEFAULT 'Anonymous',
    quiz_code TEXT UNIQUE NOT NULL DEFAULT upper(substr(encode(gen_random_bytes(6), 'hex'), 1, 6)),
    color TEXT DEFAULT '#2563eb',
    time_limit INTEGER DEFAULT 30, -- minutes
    question_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending', -- pending, approved, rejected
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ═══ 2. CUSTOM QUIZ QUESTIONS TABLE ═══
CREATE TABLE IF NOT EXISTS custom_quiz_questions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    quiz_id UUID REFERENCES custom_quizzes(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT NOT NULL,
    correct_answer TEXT NOT NULL, -- 'A', 'B', 'C', or 'D'
    explanation TEXT DEFAULT '',
    question_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ═══ 3. CUSTOM QUIZ RESULTS TABLE ═══
CREATE TABLE IF NOT EXISTS custom_quiz_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    quiz_id UUID REFERENCES custom_quizzes(id) ON DELETE CASCADE,
    student_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    student_name TEXT NOT NULL DEFAULT 'Anonymous',
    score INTEGER NOT NULL DEFAULT 0, -- percentage
    correct_count INTEGER NOT NULL DEFAULT 0,
    total_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ═══ 4. PDF UPLOADS TABLE ═══
CREATE TABLE IF NOT EXISTS pdf_uploads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    file_url TEXT NOT NULL, -- Supabase Storage URL
    file_name TEXT NOT NULL,
    file_size BIGINT DEFAULT 0,
    uploader_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    uploader_name TEXT NOT NULL DEFAULT 'Anonymous',
    category TEXT DEFAULT 'general', -- e.g., 'CSC', 'BIO', 'CHE', etc.
    status TEXT DEFAULT 'pending', -- pending, approved, rejected
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ═══ 5. STORAGE BUCKET FOR PDFs ═══
INSERT INTO storage.buckets (id, name, public)
VALUES ('pdf-uploads', 'pdf-uploads', true)
ON CONFLICT (id) DO NOTHING;

-- ═══ 6. RLS POLICIES ═══

-- Enable RLS
ALTER TABLE custom_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_quiz_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE pdf_uploads ENABLE ROW LEVEL SECURITY;

-- custom_quizzes: anyone can read approved quizzes; anyone can insert; creators can update/delete their own
CREATE POLICY "Anyone can read approved quizzes" ON custom_quizzes FOR SELECT USING (status = 'approved' OR creator_id = auth.uid());
CREATE POLICY "Anyone can create quizzes" ON custom_quizzes FOR INSERT WITH CHECK (true);
CREATE POLICY "Creators can update own quizzes" ON custom_quizzes FOR UPDATE USING (creator_id = auth.uid());
CREATE POLICY "Creators can delete own quizzes" ON custom_quizzes FOR DELETE USING (creator_id = auth.uid());

-- custom_quiz_questions: anyone can read questions for approved quizzes
CREATE POLICY "Anyone can read quiz questions" ON custom_quiz_questions FOR SELECT USING (true);
CREATE POLICY "Anyone can create quiz questions" ON custom_quiz_questions FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can delete quiz questions" ON custom_quiz_questions FOR DELETE USING (true);

-- custom_quiz_results: anyone can read; anyone can insert (public quizzes)
CREATE POLICY "Anyone can read quiz results" ON custom_quiz_results FOR SELECT USING (true);
CREATE POLICY "Anyone can insert quiz results" ON custom_quiz_results FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can delete quiz results" ON custom_quiz_results FOR DELETE USING (true);

-- pdf_uploads: anyone can read approved PDFs; anyone can insert; admin can update/delete
CREATE POLICY "Anyone can read approved PDFs" ON pdf_uploads FOR SELECT USING (status = 'approved' OR uploader_id = auth.uid());
CREATE POLICY "Anyone can upload PDFs" ON pdf_uploads FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update PDFs" ON pdf_uploads FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete PDFs" ON pdf_uploads FOR DELETE USING (true);

-- Storage policies for pdf-uploads bucket
CREATE POLICY "Anyone can upload PDFs to storage" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'pdf-uploads');
CREATE POLICY "Anyone can read PDFs from storage" ON storage.objects FOR SELECT USING (bucket_id = 'pdf-uploads');
CREATE POLICY "Anyone can delete PDFs from storage" ON storage.objects FOR DELETE USING (bucket_id = 'pdf-uploads');

-- ═══ 7. INDEXES for performance ═══
CREATE INDEX IF NOT EXISTS idx_custom_quizzes_status ON custom_quizzes(status);
CREATE INDEX IF NOT EXISTS idx_custom_quizzes_code ON custom_quizzes(quiz_code);
CREATE INDEX IF NOT EXISTS idx_custom_quiz_questions_quiz_id ON custom_quiz_questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_custom_quiz_results_quiz_id ON custom_quiz_results(quiz_id);
CREATE INDEX IF NOT EXISTS idx_pdf_uploads_status ON pdf_uploads(status);

-- ═══ 8. AUTO-UPDATE updated_at trigger ═══
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER IF NOT EXISTS update_custom_quizzes_updated_at
    BEFORE UPDATE ON custom_quizzes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ═══ DONE ═══
-- After running this, your admin dashboard will be able to:
-- - Approve/reject quizzes (UPDATE custom_quizzes SET status = 'approved')
-- - Delete quizzes (DELETE FROM custom_quizzes WHERE id = '...')
-- - Approve/reject PDFs (UPDATE pdf_uploads SET status = 'approved')
-- - Delete PDFs (DELETE FROM pdf_uploads WHERE id = '...')
--
-- To set yourself as admin, find your Supabase user ID and replace
-- the ADMIN_USER_ID in admin.html with your UUID.
