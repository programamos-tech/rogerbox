-- Rogerbox: tablas de cursos y lecciones
-- Requiere: 20240224000000_initial_rogerbox_schema.sql (is_admin_user, auth.users)

-- ========== Categorías de cursos (opcional) ==========
CREATE TABLE IF NOT EXISTS course_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_course_categories_is_active ON course_categories(is_active);

-- ========== Cursos ==========
CREATE TABLE IF NOT EXISTS courses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  short_description TEXT DEFAULT '',
  description TEXT,
  preview_image TEXT,
  price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  original_price NUMERIC(10, 2),
  discount_percentage NUMERIC(5, 2) DEFAULT 0,
  category TEXT,
  duration_days INTEGER NOT NULL DEFAULT 30,
  calories_burned NUMERIC(10, 2) DEFAULT 0,
  mux_playback_id TEXT DEFAULT '',
  level TEXT DEFAULT 'beginner',
  is_published BOOLEAN DEFAULT false,
  intro_video_url TEXT,
  rating NUMERIC(3, 2) DEFAULT 4.8,
  students_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_courses_slug ON courses(slug);
CREATE INDEX IF NOT EXISTS idx_courses_is_published ON courses(is_published);
CREATE INDEX IF NOT EXISTS idx_courses_created_at ON courses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_courses_category ON courses(category);

-- ========== Lecciones del curso ==========
CREATE TABLE IF NOT EXISTS course_lessons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  video_url TEXT,
  preview_image TEXT,
  lesson_number INTEGER NOT NULL,
  lesson_order INTEGER NOT NULL,
  duration_minutes INTEGER DEFAULT 0,
  is_preview BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(course_id, lesson_number)
);
CREATE INDEX IF NOT EXISTS idx_course_lessons_course_id ON course_lessons(course_id);
CREATE INDEX IF NOT EXISTS idx_course_lessons_order ON course_lessons(course_id, lesson_order);

-- ========== FK orders -> courses (opcional) ==========
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = 'public' AND table_name = 'orders'
    AND constraint_name = 'orders_course_id_fkey'
  ) THEN
    ALTER TABLE orders
    ADD CONSTRAINT orders_course_id_fkey
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ========== RLS: course_categories ==========
ALTER TABLE course_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view active categories" ON course_categories;
CREATE POLICY "Anyone can view active categories" ON course_categories
  FOR SELECT USING (is_active = true);
DROP POLICY IF EXISTS "Admins can manage categories" ON course_categories;
CREATE POLICY "Admins can manage categories" ON course_categories
  FOR ALL USING (is_admin_user(auth.uid()));

-- ========== RLS: courses ==========
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view published courses" ON courses;
CREATE POLICY "Public can view published courses" ON courses
  FOR SELECT USING (is_published = true);
DROP POLICY IF EXISTS "Admins can manage all courses" ON courses;
CREATE POLICY "Admins can manage all courses" ON courses
  FOR ALL USING (is_admin_user(auth.uid()));

-- ========== RLS: course_lessons ==========
ALTER TABLE course_lessons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view lessons of published courses" ON course_lessons;
CREATE POLICY "Public can view lessons of published courses" ON course_lessons
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM courses c
      WHERE c.id = course_lessons.course_id AND c.is_published = true
    )
  );
DROP POLICY IF EXISTS "Admins can manage all lessons" ON course_lessons;
CREATE POLICY "Admins can manage all lessons" ON course_lessons
  FOR ALL USING (is_admin_user(auth.uid()));

-- ========== Categoría por defecto ==========
INSERT INTO course_categories (id, name, is_active)
VALUES ('00000000-0000-0000-0000-000000000001'::uuid, 'General', true)
ON CONFLICT (id) DO NOTHING;
