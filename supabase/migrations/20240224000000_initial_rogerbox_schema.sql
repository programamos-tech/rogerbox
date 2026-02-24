-- Rogerbox: esquema inicial (profiles, weight_records, orders, nutritional_blogs, gym_*, RLS)
-- Se aplica automáticamente con: supabase db reset (local) o supabase db push (remoto)

-- ========== Tablas base ==========

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Usuario',
  full_name TEXT,
  email TEXT,
  height NUMERIC(5, 2),
  weight NUMERIC(5, 2),
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  goals TEXT DEFAULT '[]',
  target_weight NUMERIC(5, 2),
  membership_status TEXT NOT NULL DEFAULT 'inactive' CHECK (membership_status IN ('inactive', 'active', 'expired')),
  document_id TEXT,
  document_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_membership_status ON profiles(membership_status);

CREATE TABLE IF NOT EXISTS weight_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  weight NUMERIC(5, 2) NOT NULL,
  record_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_weight_records_user_id ON weight_records(user_id);
CREATE INDEX IF NOT EXISTS idx_weight_records_record_date ON weight_records(record_date);

CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID,
  amount NUMERIC(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'COP',
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'declined', 'error', 'expired')),
  wompi_reference TEXT,
  wompi_transaction_id TEXT,
  payment_method TEXT,
  customer_email TEXT,
  customer_name TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_wompi_reference ON orders(wompi_reference);

CREATE TABLE IF NOT EXISTS nutritional_blogs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  author VARCHAR(100) NOT NULL,
  reading_time INTEGER NOT NULL,
  excerpt TEXT NOT NULL,
  content TEXT NOT NULL,
  featured_image_url TEXT,
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_nutritional_blogs_published ON nutritional_blogs(is_published, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_nutritional_blogs_slug ON nutritional_blogs(slug);

-- ========== Tablas gimnasio ==========

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

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'order_type') THEN
    ALTER TABLE orders ADD COLUMN order_type TEXT DEFAULT 'course' CHECK (order_type IN ('course', 'gym_plan'));
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'gym_plan_id') THEN
    ALTER TABLE orders ADD COLUMN gym_plan_id UUID REFERENCES gym_plans(id) ON DELETE SET NULL;
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_orders_order_type ON orders(order_type);
CREATE INDEX IF NOT EXISTS idx_orders_gym_plan_id ON orders(gym_plan_id);

-- ========== Políticas RLS ==========

CREATE OR REPLACE FUNCTION is_admin_user(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_email TEXT;
  user_metadata JSONB;
BEGIN
  SELECT email, raw_user_meta_data INTO user_email, user_metadata
  FROM auth.users WHERE id = user_id;
  IF user_email IS NULL THEN RETURN FALSE; END IF;
  IF user_metadata IS NOT NULL AND user_metadata->>'role' = 'admin' THEN RETURN TRUE; END IF;
  IF LOWER(TRIM(user_email)) IN ('rogerbox@admin.com', LOWER(TRIM(COALESCE(current_setting('app.admin_email', TRUE), '')))) THEN RETURN TRUE; END IF;
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;
CREATE POLICY "Admins can manage all profiles" ON profiles FOR ALL USING (is_admin_user(auth.uid()));

ALTER TABLE gym_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can view active plans" ON gym_plans;
CREATE POLICY "Authenticated users can view active plans" ON gym_plans FOR SELECT USING (auth.role() = 'authenticated' AND is_active = true);
DROP POLICY IF EXISTS "Admins can view all plans" ON gym_plans;
CREATE POLICY "Admins can view all plans" ON gym_plans FOR SELECT USING (is_admin_user(auth.uid()));
DROP POLICY IF EXISTS "Admins can manage plans" ON gym_plans;
CREATE POLICY "Admins can manage plans" ON gym_plans FOR ALL USING (is_admin_user(auth.uid()));

ALTER TABLE gym_client_info ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own client info" ON gym_client_info;
CREATE POLICY "Users can view own client info" ON gym_client_info FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins can manage client info" ON gym_client_info;
CREATE POLICY "Admins can manage client info" ON gym_client_info FOR ALL USING (is_admin_user(auth.uid()));

ALTER TABLE gym_memberships ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own memberships" ON gym_memberships;
CREATE POLICY "Users can view own memberships" ON gym_memberships FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can view memberships by client info" ON gym_memberships;
CREATE POLICY "Users can view memberships by client info" ON gym_memberships FOR SELECT
  USING (EXISTS (SELECT 1 FROM gym_client_info WHERE gym_client_info.id = gym_memberships.client_info_id AND gym_client_info.user_id = auth.uid()));
DROP POLICY IF EXISTS "Admins can manage memberships" ON gym_memberships;
CREATE POLICY "Admins can manage memberships" ON gym_memberships FOR ALL USING (is_admin_user(auth.uid()));

ALTER TABLE gym_payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own payments" ON gym_payments;
CREATE POLICY "Users can view own payments" ON gym_payments FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can view payments by client info" ON gym_payments;
CREATE POLICY "Users can view payments by client info" ON gym_payments FOR SELECT
  USING (EXISTS (SELECT 1 FROM gym_client_info WHERE gym_client_info.id = gym_payments.client_info_id AND gym_client_info.user_id = auth.uid()));
DROP POLICY IF EXISTS "Admins can manage payments" ON gym_payments;
CREATE POLICY "Admins can manage payments" ON gym_payments FOR ALL USING (is_admin_user(auth.uid()));

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
CREATE POLICY "Users can view own orders" ON orders FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins can manage all orders" ON orders;
CREATE POLICY "Admins can manage all orders" ON orders FOR ALL USING (is_admin_user(auth.uid()));

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'nutritional_blogs') THEN
    ALTER TABLE nutritional_blogs ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Authenticated users can view published blogs" ON nutritional_blogs;
    CREATE POLICY "Authenticated users can view published blogs" ON nutritional_blogs FOR SELECT USING (auth.role() = 'authenticated' AND is_published = true);
    DROP POLICY IF EXISTS "Admins can manage blogs" ON nutritional_blogs;
    CREATE POLICY "Admins can manage blogs" ON nutritional_blogs FOR ALL USING (is_admin_user(auth.uid()));
  END IF;
END $$;
