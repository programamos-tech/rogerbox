-- Ejecuta este script en Supabase Studio → SQL Editor (local: http://127.0.0.1:55623)
-- para crear las tablas lesson_ratings y lesson_comments si no existen.
-- Así podrás valorar clases y dejar comentarios.

-- ========== lesson_ratings ==========
CREATE TABLE IF NOT EXISTS lesson_ratings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id UUID NOT NULL REFERENCES course_lessons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(lesson_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_lesson_ratings_lesson_id ON lesson_ratings(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_ratings_user_id ON lesson_ratings(user_id);

ALTER TABLE lesson_ratings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view lesson ratings" ON lesson_ratings;
CREATE POLICY "Anyone can view lesson ratings"
  ON lesson_ratings FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can insert own lesson rating" ON lesson_ratings;
CREATE POLICY "Users can insert own lesson rating"
  ON lesson_ratings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own lesson rating" ON lesson_ratings;
CREATE POLICY "Users can update own lesson rating"
  ON lesson_ratings FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own lesson rating" ON lesson_ratings;
CREATE POLICY "Users can delete own lesson rating"
  ON lesson_ratings FOR DELETE
  USING (auth.uid() = user_id);

-- ========== lesson_comments ==========
-- user_id → profiles(id) para que PostgREST pueda hacer join en select (profiles!inner)
CREATE TABLE IF NOT EXISTS lesson_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id UUID NOT NULL REFERENCES course_lessons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  likes_count INTEGER NOT NULL DEFAULT 0,
  is_liked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lesson_comments_lesson_id ON lesson_comments(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_comments_user_id ON lesson_comments(user_id);

ALTER TABLE lesson_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view lesson comments" ON lesson_comments;
CREATE POLICY "Anyone can view lesson comments"
  ON lesson_comments FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated can insert own comment" ON lesson_comments;
CREATE POLICY "Authenticated can insert own comment"
  ON lesson_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own comment" ON lesson_comments;
CREATE POLICY "Users can update own comment"
  ON lesson_comments FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own comment" ON lesson_comments;
CREATE POLICY "Users can delete own comment"
  ON lesson_comments FOR DELETE
  USING (auth.uid() = user_id);
