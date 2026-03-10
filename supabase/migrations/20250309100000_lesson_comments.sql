-- Rogerbox: comentarios por lección (clase)
-- Requiere: course_lessons, profiles

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

-- Cualquiera puede ver comentarios de lecciones
CREATE POLICY "Anyone can view lesson comments"
  ON lesson_comments FOR SELECT
  USING (true);

-- Solo autenticados pueden insertar su comentario
CREATE POLICY "Authenticated can insert own comment"
  ON lesson_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Solo el autor puede actualizar (likes_count/is_liked se actualiza por app)
CREATE POLICY "Users can update own comment"
  ON lesson_comments FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Solo el autor puede eliminar
CREATE POLICY "Users can delete own comment"
  ON lesson_comments FOR DELETE
  USING (auth.uid() = user_id);

COMMENT ON TABLE lesson_comments IS 'Comentarios por lección con likes denormalizados';
