-- Tabla de complementos semanales (por semana/año/día)
CREATE TABLE IF NOT EXISTS weekly_complements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  week_number INTEGER NOT NULL,
  "year" INTEGER NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 1 AND day_of_week <= 7),
  title TEXT NOT NULL,
  description TEXT,
  mux_playback_id TEXT,
  mux_asset_id TEXT,
  thumbnail_url TEXT,
  duration_seconds INTEGER,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_weekly_complements_week_year ON weekly_complements(week_number, "year");
CREATE INDEX IF NOT EXISTS idx_weekly_complements_day ON weekly_complements(day_of_week);
CREATE INDEX IF NOT EXISTS idx_weekly_complements_published ON weekly_complements(is_published) WHERE is_published = true;

-- Interacciones de usuario con complementos
CREATE TABLE IF NOT EXISTS user_complement_interactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  complement_id UUID NOT NULL,
  is_completed BOOLEAN DEFAULT false,
  times_completed INTEGER DEFAULT 0,
  last_completed_at TIMESTAMPTZ,
  is_favorite BOOLEAN DEFAULT false,
  rating INTEGER CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5)),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, complement_id)
);

CREATE INDEX IF NOT EXISTS idx_user_complement_interactions_user ON user_complement_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_complement_interactions_complement ON user_complement_interactions(complement_id);

-- RLS (el API usa service_role y no aplica RLS; estas políticas son para cliente anon/authenticated)
ALTER TABLE weekly_complements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can view published weekly_complements" ON weekly_complements;
CREATE POLICY "Authenticated can view published weekly_complements" ON weekly_complements
  FOR SELECT USING (auth.role() = 'authenticated' AND is_published = true);

-- Admins pueden gestionar (crear/editar/eliminar) complementos
DROP POLICY IF EXISTS "Admins can manage weekly_complements" ON weekly_complements;
CREATE POLICY "Admins can manage weekly_complements" ON weekly_complements
  FOR ALL USING (is_admin_user(auth.uid()));

ALTER TABLE user_complement_interactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users own interactions" ON user_complement_interactions;
CREATE POLICY "Users own interactions" ON user_complement_interactions
  FOR ALL USING (auth.uid() = user_id);
