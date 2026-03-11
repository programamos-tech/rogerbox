-- Tabla de lecciones completadas por usuario (para progreso en cursos comprados).
-- Requiere: course_lessons, auth.users

CREATE TABLE IF NOT EXISTS user_lesson_completions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES course_lessons(id) ON DELETE CASCADE,
  duration_watched INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, lesson_id)
);

CREATE INDEX IF NOT EXISTS idx_user_lesson_completions_user_id ON user_lesson_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_lesson_completions_course_id ON user_lesson_completions(course_id);
CREATE INDEX IF NOT EXISTS idx_user_lesson_completions_lesson_id ON user_lesson_completions(lesson_id);

-- RLS: cada usuario solo ve/inserta sus propias completaciones
ALTER TABLE user_lesson_completions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own completions" ON user_lesson_completions;
CREATE POLICY "Users can view own completions"
  ON user_lesson_completions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own completions" ON user_lesson_completions;
CREATE POLICY "Users can insert own completions"
  ON user_lesson_completions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own completions" ON user_lesson_completions;
CREATE POLICY "Users can update own completions"
  ON user_lesson_completions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
