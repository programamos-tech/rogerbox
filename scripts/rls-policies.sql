-- ============================================
-- POLÍTICAS RLS (Row Level Security)
-- ============================================
-- Ejecuta este SQL en Supabase SQL Editor
-- Este script configura las políticas de seguridad
-- para todas las tablas del sistema
--
-- INSTRUCCIONES:
-- 1. Abre Supabase Studio (local o producción)
-- 2. Ve a "SQL Editor"
-- 3. Pega y ejecuta este script completo
-- 4. Verifica que todas las políticas se crearon correctamente
--
-- IMPORTANTE:
-- - Después de ejecutar, todas las tablas tendrán RLS habilitado
-- - Los usuarios solo podrán ver/modificar sus propios datos
-- - Solo los admins podrán ver/modificar todos los datos
-- - Para marcar un usuario como admin, agrega role: 'admin' en su user_metadata
-- ============================================

-- Función helper para verificar si un usuario es admin
-- Verifica por: user_metadata.role = 'admin' o email específico
CREATE OR REPLACE FUNCTION is_admin_user(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_email TEXT;
  user_metadata JSONB;
BEGIN
  -- Obtener información del usuario
  SELECT email, raw_user_meta_data INTO user_email, user_metadata
  FROM auth.users
  WHERE id = user_id;
  
  -- Si no existe el usuario, retornar false
  IF user_email IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Verificar por role en metadata (método principal)
  IF user_metadata IS NOT NULL AND user_metadata->>'role' = 'admin' THEN
    RETURN TRUE;
  END IF;
  
  -- Verificar por email específico (rogerbox@admin.com por defecto)
  -- Puedes agregar más emails aquí si es necesario
  IF LOWER(TRIM(user_email)) IN (
    'rogerbox@admin.com',
    LOWER(TRIM(COALESCE(current_setting('app.admin_email', TRUE), '')))
  ) THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 1. PROFILES
-- ============================================
-- Habilitar RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios pueden ver y editar su propio perfil
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Política: Los admins pueden ver y editar todos los perfiles
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;
CREATE POLICY "Admins can manage all profiles" ON profiles
  FOR ALL
  USING (is_admin_user(auth.uid()));

-- ============================================
-- 2. GYM_PLANS
-- ============================================
-- Habilitar RLS
ALTER TABLE gym_plans ENABLE ROW LEVEL SECURITY;

-- Política: Todos los usuarios autenticados pueden ver planes activos
DROP POLICY IF EXISTS "Authenticated users can view active plans" ON gym_plans;
CREATE POLICY "Authenticated users can view active plans" ON gym_plans
  FOR SELECT
  USING (auth.role() = 'authenticated' AND is_active = true);

-- Política: Solo admins pueden ver todos los planes (incluyendo inactivos)
DROP POLICY IF EXISTS "Admins can view all plans" ON gym_plans;
CREATE POLICY "Admins can view all plans" ON gym_plans
  FOR SELECT
  USING (is_admin_user(auth.uid()));

-- Política: Solo admins pueden crear, actualizar y eliminar planes
DROP POLICY IF EXISTS "Admins can manage plans" ON gym_plans;
CREATE POLICY "Admins can manage plans" ON gym_plans
  FOR ALL
  USING (is_admin_user(auth.uid()));

-- ============================================
-- 3. GYM_CLIENT_INFO
-- ============================================
-- Habilitar RLS
ALTER TABLE gym_client_info ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios pueden ver su propia información de cliente
DROP POLICY IF EXISTS "Users can view own client info" ON gym_client_info;
CREATE POLICY "Users can view own client info" ON gym_client_info
  FOR SELECT
  USING (auth.uid() = user_id);

-- Política: Solo admins pueden ver, crear, actualizar y eliminar información de clientes
DROP POLICY IF EXISTS "Admins can manage client info" ON gym_client_info;
CREATE POLICY "Admins can manage client info" ON gym_client_info
  FOR ALL
  USING (is_admin_user(auth.uid()));

-- ============================================
-- 4. GYM_MEMBERSHIPS
-- ============================================
-- Habilitar RLS
ALTER TABLE gym_memberships ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios pueden ver sus propias membresías
DROP POLICY IF EXISTS "Users can view own memberships" ON gym_memberships;
CREATE POLICY "Users can view own memberships" ON gym_memberships
  FOR SELECT
  USING (auth.uid() = user_id);

-- Política: Los usuarios pueden ver membresías asociadas a su client_info_id
DROP POLICY IF EXISTS "Users can view memberships by client info" ON gym_memberships;
CREATE POLICY "Users can view memberships by client info" ON gym_memberships
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM gym_client_info
      WHERE gym_client_info.id = gym_memberships.client_info_id
      AND gym_client_info.user_id = auth.uid()
    )
  );

-- Política: Solo admins pueden crear, actualizar y eliminar membresías
DROP POLICY IF EXISTS "Admins can manage memberships" ON gym_memberships;
CREATE POLICY "Admins can manage memberships" ON gym_memberships
  FOR ALL
  USING (is_admin_user(auth.uid()));

-- ============================================
-- 5. GYM_PAYMENTS
-- ============================================
-- Habilitar RLS
ALTER TABLE gym_payments ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios pueden ver sus propios pagos
DROP POLICY IF EXISTS "Users can view own payments" ON gym_payments;
CREATE POLICY "Users can view own payments" ON gym_payments
  FOR SELECT
  USING (auth.uid() = user_id);

-- Política: Los usuarios pueden ver pagos asociados a su client_info_id
DROP POLICY IF EXISTS "Users can view payments by client info" ON gym_payments;
CREATE POLICY "Users can view payments by client info" ON gym_payments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM gym_client_info
      WHERE gym_client_info.id = gym_payments.client_info_id
      AND gym_client_info.user_id = auth.uid()
    )
  );

-- Política: Solo admins pueden crear, actualizar y eliminar pagos
DROP POLICY IF EXISTS "Admins can manage payments" ON gym_payments;
CREATE POLICY "Admins can manage payments" ON gym_payments
  FOR ALL
  USING (is_admin_user(auth.uid()));

-- ============================================
-- 6. ORDERS
-- ============================================
-- Habilitar RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios pueden ver sus propias órdenes
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
CREATE POLICY "Users can view own orders" ON orders
  FOR SELECT
  USING (auth.uid() = user_id);

-- Política: Solo admins pueden ver, crear, actualizar y eliminar todas las órdenes
DROP POLICY IF EXISTS "Admins can manage all orders" ON orders;
CREATE POLICY "Admins can manage all orders" ON orders
  FOR ALL
  USING (is_admin_user(auth.uid()));

-- ============================================
-- 7. COURSES
-- ============================================
-- Habilitar RLS (si la tabla existe)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'courses') THEN
    ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
    
    -- Política: Todos los usuarios autenticados pueden ver cursos publicados
    DROP POLICY IF EXISTS "Authenticated users can view published courses" ON courses;
    CREATE POLICY "Authenticated users can view published courses" ON courses
      FOR SELECT
      USING (auth.role() = 'authenticated' AND is_published = true);
    
    -- Política: Solo admins pueden ver todos los cursos y gestionarlos
    DROP POLICY IF EXISTS "Admins can manage courses" ON courses;
    CREATE POLICY "Admins can manage courses" ON courses
      FOR ALL
      USING (is_admin_user(auth.uid()));
  END IF;
END $$;

-- ============================================
-- 8. COURSE_PURCHASES
-- ============================================
-- Habilitar RLS (si la tabla existe)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'course_purchases') THEN
    ALTER TABLE course_purchases ENABLE ROW LEVEL SECURITY;
    
    -- Política: Los usuarios pueden ver sus propias compras
    DROP POLICY IF EXISTS "Users can view own purchases" ON course_purchases;
    CREATE POLICY "Users can view own purchases" ON course_purchases
      FOR SELECT
      USING (auth.uid() = user_id);
    
    -- Política: Solo admins pueden gestionar todas las compras
    DROP POLICY IF EXISTS "Admins can manage purchases" ON course_purchases;
    CREATE POLICY "Admins can manage purchases" ON course_purchases
      FOR ALL
      USING (is_admin_user(auth.uid()));
  END IF;
END $$;

-- ============================================
-- 9. NUTRITIONAL_BLOGS
-- ============================================
-- Habilitar RLS (si la tabla existe)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'nutritional_blogs') THEN
    ALTER TABLE nutritional_blogs ENABLE ROW LEVEL SECURITY;
    
    -- Política: Todos los usuarios autenticados pueden ver blogs publicados
    DROP POLICY IF EXISTS "Authenticated users can view published blogs" ON nutritional_blogs;
    CREATE POLICY "Authenticated users can view published blogs" ON nutritional_blogs
      FOR SELECT
      USING (auth.role() = 'authenticated' AND is_published = true);
    
    -- Política: Solo admins pueden gestionar blogs
    DROP POLICY IF EXISTS "Admins can manage blogs" ON nutritional_blogs;
    CREATE POLICY "Admins can manage blogs" ON nutritional_blogs
      FOR ALL
      USING (is_admin_user(auth.uid()));
  END IF;
END $$;

-- ============================================
-- 10. COMPLEMENTS
-- ============================================
-- Habilitar RLS (si la tabla existe)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'complements') THEN
    ALTER TABLE complements ENABLE ROW LEVEL SECURITY;
    
    -- Política: Todos los usuarios autenticados pueden ver complementos activos
    DROP POLICY IF EXISTS "Authenticated users can view active complements" ON complements;
    CREATE POLICY "Authenticated users can view active complements" ON complements
      FOR SELECT
      USING (auth.role() = 'authenticated' AND is_active = true);
    
    -- Política: Solo admins pueden gestionar complementos
    DROP POLICY IF EXISTS "Admins can manage complements" ON complements;
    CREATE POLICY "Admins can manage complements" ON complements
      FOR ALL
      USING (is_admin_user(auth.uid()));
  END IF;
END $$;

-- ============================================
-- 11. COMPLEMENT_INTERACTIONS
-- ============================================
-- Habilitar RLS (si la tabla existe)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'complement_interactions') THEN
    ALTER TABLE complement_interactions ENABLE ROW LEVEL SECURITY;
    
    -- Política: Los usuarios pueden ver sus propias interacciones
    DROP POLICY IF EXISTS "Users can view own interactions" ON complement_interactions;
    CREATE POLICY "Users can view own interactions" ON complement_interactions
      FOR SELECT
      USING (auth.uid() = user_id);
    
    -- Política: Los usuarios pueden crear sus propias interacciones
    DROP POLICY IF EXISTS "Users can create own interactions" ON complement_interactions;
    CREATE POLICY "Users can create own interactions" ON complement_interactions
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
    
    -- Política: Solo admins pueden gestionar todas las interacciones
    DROP POLICY IF EXISTS "Admins can manage interactions" ON complement_interactions;
    CREATE POLICY "Admins can manage interactions" ON complement_interactions
      FOR ALL
      USING (is_admin_user(auth.uid()));
  END IF;
END $$;

-- ============================================
-- 12. CATEGORIES
-- ============================================
-- Habilitar RLS (si la tabla existe)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'categories') THEN
    ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
    
    -- Política: Todos los usuarios autenticados pueden ver categorías
    -- (verificamos si existe is_active, si no, mostramos todas)
    DROP POLICY IF EXISTS "Authenticated users can view categories" ON categories;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'is_active') THEN
      CREATE POLICY "Authenticated users can view categories" ON categories
        FOR SELECT
        USING (auth.role() = 'authenticated' AND is_active = true);
    ELSE
      CREATE POLICY "Authenticated users can view categories" ON categories
        FOR SELECT
        USING (auth.role() = 'authenticated');
    END IF;
    
    -- Política: Solo admins pueden gestionar categorías
    DROP POLICY IF EXISTS "Admins can manage categories" ON categories;
    CREATE POLICY "Admins can manage categories" ON categories
      FOR ALL
      USING (is_admin_user(auth.uid()));
  END IF;
END $$;

-- ============================================
-- 13. BANNERS
-- ============================================
-- Habilitar RLS (si la tabla existe)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'banners') THEN
    ALTER TABLE banners ENABLE ROW LEVEL SECURITY;
    
    -- Política: Todos los usuarios autenticados pueden ver banners
    -- (verificamos si existe is_active, si no, mostramos todos)
    DROP POLICY IF EXISTS "Authenticated users can view banners" ON banners;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'banners' AND column_name = 'is_active') THEN
      CREATE POLICY "Authenticated users can view banners" ON banners
        FOR SELECT
        USING (auth.role() = 'authenticated' AND is_active = true);
    ELSE
      CREATE POLICY "Authenticated users can view banners" ON banners
        FOR SELECT
        USING (auth.role() = 'authenticated');
    END IF;
    
    -- Política: Solo admins pueden gestionar banners
    DROP POLICY IF EXISTS "Admins can manage banners" ON banners;
    CREATE POLICY "Admins can manage banners" ON banners
      FOR ALL
      USING (is_admin_user(auth.uid()));
  END IF;
END $$;

-- ============================================
-- NOTAS IMPORTANTES
-- ============================================
-- 1. Las políticas RLS se aplican automáticamente a todas las consultas
-- 2. Para que la función is_admin_user funcione correctamente, necesitas configurar
--    las variables de entorno en Supabase:
--    - app.admin_email: Email del administrador
--    - app.admin_user_id: ID del usuario administrador
-- 3. Alternativamente, puedes marcar usuarios como admin agregando
--    role: 'admin' en su user_metadata en auth.users
-- 4. Las vistas (views) como user_active_purchases, orders_with_course_info, etc.
--    heredan las políticas de las tablas base
-- ============================================
