-- Rogerbox: correcciones para dashboard (course_categories.sort_order, course_purchases, courses.thumbnail_url)

-- ========== 1. course_categories: sort_order, icon, color ==========
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'course_categories' AND column_name = 'sort_order') THEN
    ALTER TABLE course_categories ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'course_categories' AND column_name = 'icon') THEN
    ALTER TABLE course_categories ADD COLUMN icon TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'course_categories' AND column_name = 'color') THEN
    ALTER TABLE course_categories ADD COLUMN color TEXT;
  END IF;
END $$;

-- ========== 2. courses: thumbnail_url, video_preview_url ==========
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'courses' AND column_name = 'thumbnail_url') THEN
    ALTER TABLE courses ADD COLUMN thumbnail_url TEXT;
    UPDATE courses SET thumbnail_url = preview_image WHERE preview_image IS NOT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'courses' AND column_name = 'video_preview_url') THEN
    ALTER TABLE courses ADD COLUMN video_preview_url TEXT;
  END IF;
END $$;

-- ========== 3. course_purchases ==========
CREATE TABLE IF NOT EXISTS course_purchases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  purchase_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  access_granted_at TIMESTAMP WITH TIME ZONE,
  start_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_course_purchases_user_id ON course_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_course_purchases_course_id ON course_purchases(course_id);
CREATE INDEX IF NOT EXISTS idx_course_purchases_order_id ON course_purchases(order_id);
CREATE INDEX IF NOT EXISTS idx_course_purchases_is_active ON course_purchases(is_active);

-- RLS course_purchases
ALTER TABLE course_purchases ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own purchases" ON course_purchases;
CREATE POLICY "Users can view own purchases" ON course_purchases
  FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins can manage all purchases" ON course_purchases;
CREATE POLICY "Admins can manage all purchases" ON course_purchases
  FOR ALL USING (is_admin_user(auth.uid()));
-- Permitir insert desde API (service role) o usuario para sí mismo
DROP POLICY IF EXISTS "Users can insert own purchases" ON course_purchases;
CREATE POLICY "Users can insert own purchases" ON course_purchases
  FOR INSERT WITH CHECK (auth.uid() = user_id);
