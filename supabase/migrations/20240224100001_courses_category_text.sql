-- Si courses.category se creó como UUID, pasarla a TEXT para slugs como 'lose_weight'
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'courses' AND column_name = 'category'
  ) THEN
    ALTER TABLE courses DROP CONSTRAINT IF EXISTS courses_category_fkey;
    ALTER TABLE courses ALTER COLUMN category TYPE TEXT USING (CASE WHEN category IS NULL THEN NULL ELSE category::text END);
  END IF;
END $$;
