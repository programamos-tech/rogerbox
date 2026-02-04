-- Rogerbox: microtiendas (Física + En línea) y log de actividades para andres.st
-- Ejecutar en Supabase SQL Editor

-- 1. Tabla stores (2 microtiendas: sede física y en línea)
CREATE TABLE IF NOT EXISTS stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(50) NOT NULL UNIQUE,
  logo_url TEXT,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_stores_slug ON stores(slug);
CREATE INDEX IF NOT EXISTS idx_stores_is_active ON stores(is_active);

-- IDs fijos para las 2 microtiendas (igual que zonat main_store)
INSERT INTO stores (id, name, slug, is_active) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Sede Física', 'fisica', true),
  ('00000000-0000-0000-0000-000000000002', 'En línea', 'online', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Tabla logs (actividad por tienda, como zonat/aleyashop)
CREATE TABLE IF NOT EXISTS logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  module VARCHAR(100) NOT NULL,
  details JSONB DEFAULT '{}',
  store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_logs_store_id ON logs(store_id);
CREATE INDEX IF NOT EXISTS idx_logs_created_at ON logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_logs_user_id ON logs(user_id);

-- 3. Añadir store_id a tablas gym (actividad sede física)
ALTER TABLE gym_client_info ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES stores(id) ON DELETE SET NULL;
ALTER TABLE gym_memberships ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES stores(id) ON DELETE SET NULL;
ALTER TABLE gym_payments ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES stores(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_gym_client_info_store ON gym_client_info(store_id);
CREATE INDEX IF NOT EXISTS idx_gym_memberships_store ON gym_memberships(store_id);
CREATE INDEX IF NOT EXISTS idx_gym_payments_store ON gym_payments(store_id);

-- Asignar sede física a registros existentes
UPDATE gym_client_info SET store_id = '00000000-0000-0000-0000-000000000001' WHERE store_id IS NULL;
UPDATE gym_memberships SET store_id = '00000000-0000-0000-0000-000000000001' WHERE store_id IS NULL;
UPDATE gym_payments SET store_id = '00000000-0000-0000-0000-000000000001' WHERE store_id IS NULL;

-- RLS: permitir lectura/escritura para service role (API andres y admin)
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Stores readable by all" ON stores;
CREATE POLICY "Stores readable by all" ON stores FOR SELECT USING (true);

DROP POLICY IF EXISTS "Logs insert by service" ON logs;
CREATE POLICY "Logs insert by service" ON logs FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Logs select for andres" ON logs;
CREATE POLICY "Logs select for andres" ON logs FOR SELECT USING (true);

COMMENT ON TABLE stores IS 'Microtiendas Rogerbox: Sede Física y En línea (andres.st)';
COMMENT ON TABLE logs IS 'Log de actividades por tienda para andres.st backstage';
