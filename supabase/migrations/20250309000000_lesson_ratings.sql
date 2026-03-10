-- Rogerbox: valoraciones por lección (clase)
-- Requiere: course_lessons, auth.users

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

-- Usuarios autenticados pueden ver valoraciones de cualquier lección
CREATE POLICY "Anyone can view lesson ratings"
  ON lesson_ratings FOR SELECT
  USING (true);

-- Solo el propio usuario puede insertar/actualizar su valoración
CREATE POLICY "Users can insert own lesson rating"
  ON lesson_ratings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own lesson rating"
  ON lesson_ratings FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own lesson rating"
  ON lesson_ratings FOR DELETE
  USING (auth.uid() = user_id);

COMMENT ON TABLE lesson_ratings IS 'Valoraciones 1-5 estrellas por lección y usuario';
