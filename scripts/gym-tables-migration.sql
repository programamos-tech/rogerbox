-- ============================================
-- MIGRACIÓN: Módulo de Planes Físicos (Gimnasio)
-- ============================================
-- Ejecuta este SQL en Supabase SQL Editor
-- URL del Studio:
--   Local: http://127.0.0.1:54323
--   Producción: https://[tu-project-ref].supabase.co
-- ============================================

-- 1. Crear tabla gym_plans
CREATE TABLE IF NOT EXISTS gym_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL CHECK (price > 0),
  duration_days INTEGER NOT NULL CHECK (duration_days > 0),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_gym_plans_is_active ON gym_plans(is_active);
CREATE INDEX IF NOT EXISTS idx_gym_plans_created_by ON gym_plans(created_by);

-- 2. Crear tabla gym_client_info
CREATE TABLE IF NOT EXISTS gym_client_info (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  document_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  email TEXT,
  whatsapp TEXT NOT NULL,
  birth_date DATE,
  weight NUMERIC(5, 2),
  medical_restrictions TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gym_client_info_user_id ON gym_client_info(user_id);
CREATE INDEX IF NOT EXISTS idx_gym_client_info_document_id ON gym_client_info(document_id);

-- 3. Crear tabla gym_memberships
CREATE TABLE IF NOT EXISTS gym_memberships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  client_info_id UUID NOT NULL REFERENCES gym_client_info(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES gym_plans(id) ON DELETE RESTRICT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'expired', 'cancelled', 'courtesy')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_gym_memberships_user_id ON gym_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_gym_memberships_client_info_id ON gym_memberships(client_info_id);
CREATE INDEX IF NOT EXISTS idx_gym_memberships_plan_id ON gym_memberships(plan_id);
CREATE INDEX IF NOT EXISTS idx_gym_memberships_status ON gym_memberships(status);
CREATE INDEX IF NOT EXISTS idx_gym_memberships_end_date ON gym_memberships(end_date);

-- 4. Crear tabla gym_payments
CREATE TABLE IF NOT EXISTS gym_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  membership_id UUID NOT NULL REFERENCES gym_memberships(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  client_info_id UUID NOT NULL REFERENCES gym_client_info(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES gym_plans(id) ON DELETE RESTRICT,
  amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'transfer', 'mixed')),
  payment_date DATE NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL CHECK (period_end >= period_start),
  invoice_required BOOLEAN DEFAULT false,
  invoice_number TEXT,
  invoice_pdf_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_gym_payments_membership_id ON gym_payments(membership_id);
CREATE INDEX IF NOT EXISTS idx_gym_payments_user_id ON gym_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_gym_payments_client_info_id ON gym_payments(client_info_id);
CREATE INDEX IF NOT EXISTS idx_gym_payments_plan_id ON gym_payments(plan_id);
CREATE INDEX IF NOT EXISTS idx_gym_payments_payment_date ON gym_payments(payment_date);

-- 5. Actualizar tabla orders para soportar planes físicos
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'order_type'
  ) THEN
    ALTER TABLE orders ADD COLUMN order_type TEXT DEFAULT 'course' CHECK (order_type IN ('course', 'gym_plan'));
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'gym_plan_id'
  ) THEN
    ALTER TABLE orders ADD COLUMN gym_plan_id UUID REFERENCES gym_plans(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_orders_order_type ON orders(order_type);
CREATE INDEX IF NOT EXISTS idx_orders_gym_plan_id ON orders(gym_plan_id);

-- ============================================
-- ✅ Migración completada
-- ============================================
