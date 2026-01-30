-- Script completo para crear la base de datos de RogerBox
-- Ejecutar en Supabase SQL Editor

-- 1. Crear tabla de categorías
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Crear tabla de cursos
CREATE TABLE IF NOT EXISTS courses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  short_description TEXT,
  description TEXT,
  preview_image TEXT,
  price INTEGER NOT NULL,
  discount_percentage INTEGER DEFAULT 0,
  category UUID REFERENCES categories(id),
  duration_days INTEGER,
  students_count INTEGER DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0,
  calories_burned INTEGER,
  level VARCHAR(50),
  is_published BOOLEAN DEFAULT FALSE,
  include_iva BOOLEAN DEFAULT FALSE,
  iva_percentage INTEGER DEFAULT 19,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Crear tabla de lecciones
CREATE TABLE IF NOT EXISTS course_lessons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  video_url TEXT,
  preview_image TEXT,
  lesson_number INTEGER NOT NULL,
  lesson_order INTEGER NOT NULL,
  duration_minutes INTEGER,
  is_preview BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Crear tabla de perfiles de usuario
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  full_name VARCHAR(255),
  goals TEXT,
  activity_level VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Crear tabla de calificaciones de cursos
CREATE TABLE IF NOT EXISTS course_ratings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(course_id, user_id)
);

-- 6. Crear tabla de inscripciones
CREATE TABLE IF NOT EXISTS course_enrollments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  start_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(course_id, user_id)
);

-- 7. Insertar categorías de ejemplo
INSERT INTO categories (name, description) VALUES
('Bajar de peso', 'Cursos enfocados en pérdida de peso'),
('Tonificar', 'Cursos para tonificar y definir músculos'),
('Cardio', 'Cursos de ejercicios cardiovasculares'),
('Flexibilidad', 'Cursos de estiramiento y flexibilidad'),
('Fuerza', 'Cursos de entrenamiento de fuerza')
ON CONFLICT (name) DO NOTHING;

-- 8. Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_courses_category ON courses(category);
CREATE INDEX IF NOT EXISTS idx_courses_published ON courses(is_published);
CREATE INDEX IF NOT EXISTS idx_course_lessons_course_id ON course_lessons(course_id);
CREATE INDEX IF NOT EXISTS idx_course_ratings_course_id ON course_ratings(course_id);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_course_id ON course_enrollments(course_id);

-- 9. Habilitar RLS (Row Level Security)
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_enrollments ENABLE ROW LEVEL SECURITY;

-- 10. Crear políticas RLS básicas
-- Cursos públicos (todos pueden leer)
CREATE POLICY "Cursos públicos son visibles para todos" ON courses
  FOR SELECT USING (is_published = true);

-- Perfiles (usuarios solo pueden ver/editar el suyo)
CREATE POLICY "Usuarios pueden ver su propio perfil" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Usuarios pueden actualizar su propio perfil" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Calificaciones (usuarios pueden crear/ver las suyas)
CREATE POLICY "Usuarios pueden crear calificaciones" ON course_ratings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden ver sus calificaciones" ON course_ratings
  FOR SELECT USING (auth.uid() = user_id);

-- Inscripciones (usuarios pueden ver/crear las suyas)
CREATE POLICY "Usuarios pueden ver sus inscripciones" ON course_enrollments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden inscribirse a cursos" ON course_enrollments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 11. Crear función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 12. Crear triggers para updated_at
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 13. Crear función para actualizar rating promedio
CREATE OR REPLACE FUNCTION update_course_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE courses 
  SET rating = (
    SELECT AVG(rating)::DECIMAL(3,2)
    FROM course_ratings 
    WHERE course_id = COALESCE(NEW.course_id, OLD.course_id)
  )
  WHERE id = COALESCE(NEW.course_id, OLD.course_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- 14. Crear trigger para actualizar rating
CREATE TRIGGER update_rating_on_rating_change
  AFTER INSERT OR UPDATE OR DELETE ON course_ratings
  FOR EACH ROW EXECUTE FUNCTION update_course_rating();

-- 15. Crear función para actualizar students_count
CREATE OR REPLACE FUNCTION update_students_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE courses 
  SET students_count = (
    SELECT COUNT(*)
    FROM course_enrollments 
    WHERE course_id = COALESCE(NEW.course_id, OLD.course_id)
  )
  WHERE id = COALESCE(NEW.course_id, OLD.course_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- 16. Crear trigger para actualizar students_count
CREATE TRIGGER update_students_count_on_enrollment
  AFTER INSERT OR DELETE ON course_enrollments
  FOR EACH ROW EXECUTE FUNCTION update_students_count();

-- 17. Verificar que todo se creó correctamente
SELECT 'Tablas creadas exitosamente' as status;
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;

-- Tabla de complementos (creada por admin)
CREATE TABLE IF NOT EXISTS complements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  video_url VARCHAR(500),
  thumbnail_url VARCHAR(500),
  duration INTEGER, -- en minutos
  category VARCHAR(100),
  difficulty VARCHAR(50) CHECK (difficulty IN ('Principiante', 'Intermedio', 'Avanzado')),
  instructor VARCHAR(100) DEFAULT 'RogerBox',
  is_new BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  recommended_for TEXT[], -- Array de tags de recomendación
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de interacciones del usuario con complementos
CREATE TABLE IF NOT EXISTS user_complement_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  complement_id UUID REFERENCES complements(id) ON DELETE CASCADE,
  is_favorite BOOLEAN DEFAULT false,
  user_rating INTEGER CHECK (user_rating >= 1 AND user_rating <= 5),
  is_completed BOOLEAN DEFAULT false,
  times_completed INTEGER DEFAULT 0,
  last_completed_at TIMESTAMP WITH TIME ZONE,
  personal_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, complement_id)
);

-- Tabla de estadísticas agregadas de complementos
CREATE TABLE IF NOT EXISTS complement_stats (
  complement_id UUID PRIMARY KEY REFERENCES complements(id) ON DELETE CASCADE,
  total_views INTEGER DEFAULT 0,
  total_favorites INTEGER DEFAULT 0,
  average_rating DECIMAL(3,2) DEFAULT 0,
  total_ratings INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_user_complement_interactions_user_id ON user_complement_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_complement_interactions_complement_id ON user_complement_interactions(complement_id);
CREATE INDEX IF NOT EXISTS idx_complements_category ON complements(category);
CREATE INDEX IF NOT EXISTS idx_complements_difficulty ON complements(difficulty);
CREATE INDEX IF NOT EXISTS idx_complements_is_active ON complements(is_active);

-- Función para actualizar estadísticas automáticamente
CREATE OR REPLACE FUNCTION update_complement_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Actualizar estadísticas cuando cambian las interacciones
  INSERT INTO complement_stats (complement_id, total_favorites, average_rating, total_ratings)
  SELECT 
    NEW.complement_id,
    COUNT(CASE WHEN is_favorite = true THEN 1 END),
    COALESCE(AVG(user_rating), 0),
    COUNT(CASE WHEN user_rating IS NOT NULL THEN 1 END)
  FROM user_complement_interactions 
  WHERE complement_id = NEW.complement_id
  ON CONFLICT (complement_id) 
  DO UPDATE SET
    total_favorites = EXCLUDED.total_favorites,
    average_rating = EXCLUDED.average_rating,
    total_ratings = EXCLUDED.total_ratings,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar estadísticas automáticamente
CREATE TRIGGER trigger_update_complement_stats
  AFTER INSERT OR UPDATE OR DELETE ON user_complement_interactions
  FOR EACH ROW
  EXECUTE FUNCTION update_complement_stats();

-- RLS (Row Level Security)
ALTER TABLE complements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_complement_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE complement_stats ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para complements (todos pueden leer, solo admins pueden escribir)
CREATE POLICY "Complements are viewable by everyone" ON complements
  FOR SELECT USING (is_active = true);

CREATE POLICY "Complements are editable by admins" ON complements
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Políticas RLS para user_complement_interactions (usuarios solo pueden ver sus propias interacciones)
CREATE POLICY "Users can view their own interactions" ON user_complement_interactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own interactions" ON user_complement_interactions
  FOR ALL USING (auth.uid() = user_id);

-- Políticas RLS para complement_stats (todos pueden leer)
CREATE POLICY "Stats are viewable by everyone" ON complement_stats
  FOR SELECT USING (true);

-- Insertar algunos complementos de ejemplo
INSERT INTO complements (title, description, video_url, duration, category, difficulty, is_new, recommended_for) VALUES
('Estiramiento Matutino', 'Rutina de 10 minutos para empezar el día con energía y flexibilidad', 'https://player.vimeo.com/video/1120425801', 10, 'Flexibilidad', 'Principiante', true, ARRAY['Principiante', 'Flexibilidad', 'Mañana']),
('Respiración Profunda', 'Técnicas de respiración para relajación y concentración', 'https://player.vimeo.com/video/1120425801', 8, 'Relajación', 'Principiante', false, ARRAY['Principiante', 'Relajación', 'Estrés']),
('Calentamiento Dinámico', 'Prepara tu cuerpo antes de cualquier entrenamiento', 'https://player.vimeo.com/video/1120425801', 12, 'Calentamiento', 'Intermedio', false, ARRAY['Intermedio', 'Calentamiento', 'Pre-entreno']);
-- Agregar campos adicionales a la tabla profiles
-- Estos campos son requeridos por el sistema de autenticación

-- Campos físicos para el seguimiento de salud
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS name VARCHAR(255);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS weight NUMERIC(5,2);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS height NUMERIC(5,2);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gender VARCHAR(20);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS target_weight NUMERIC(5,2);

-- Campo de estado de membresía
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS membership_status VARCHAR(50) DEFAULT 'inactive';

-- Trigger para crear perfil automáticamente cuando se crea un usuario
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, membership_status)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Usuario'),
    'inactive'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger que se ejecuta cuando se crea un usuario en auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Comentarios para documentar los campos
COMMENT ON COLUMN profiles.name IS 'Nombre completo del usuario';
COMMENT ON COLUMN profiles.weight IS 'Peso actual del usuario en kg';
COMMENT ON COLUMN profiles.height IS 'Altura del usuario en cm';
COMMENT ON COLUMN profiles.gender IS 'Género del usuario (male, female, other)';
COMMENT ON COLUMN profiles.target_weight IS 'Peso objetivo del usuario en kg';
COMMENT ON COLUMN profiles.membership_status IS 'Estado de membresía (active, inactive, trial)';
-- =============================================
-- TABLAS FALTANTES PARA ROGERBOX
-- =============================================
-- Esta migración agrega todas las tablas necesarias que estaban en database/
-- pero no en las migraciones de Supabase

-- =============================================
-- 1. NUTRITIONAL BLOGS
-- =============================================

CREATE TABLE IF NOT EXISTS nutritional_blogs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    author VARCHAR(100) NOT NULL,
    reading_time INTEGER NOT NULL, -- en minutos
    excerpt TEXT NOT NULL, -- texto corto de resumen
    content TEXT NOT NULL, -- contenido completo del blog
    featured_image_url TEXT,
    is_published BOOLEAN DEFAULT false,
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_nutritional_blogs_published ON nutritional_blogs(is_published, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_nutritional_blogs_slug ON nutritional_blogs(slug);

-- =============================================
-- 2. WOMPI PAYMENT INTEGRATION
-- =============================================

-- Tabla de órdenes de pago
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,

  -- Información de la orden
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'COP',
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined', 'error', 'cancelled')),

  -- Información de Wompi
  wompi_transaction_id VARCHAR(255) UNIQUE,
  wompi_reference VARCHAR(255) UNIQUE,
  payment_method VARCHAR(50),
  payment_source_id VARCHAR(255),

  -- Metadatos
  customer_email VARCHAR(255),
  customer_name VARCHAR(255),
  redirect_url TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 minutes')
);

-- Tabla de transacciones Wompi (log detallado)
CREATE TABLE IF NOT EXISTS wompi_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,

  -- IDs de Wompi
  wompi_transaction_id VARCHAR(255) UNIQUE NOT NULL,
  wompi_reference VARCHAR(255),

  -- Estado de la transacción
  status VARCHAR(50) NOT NULL,
  status_message TEXT,

  -- Información del pago
  amount_in_cents INTEGER NOT NULL,
  currency VARCHAR(3) DEFAULT 'COP',
  payment_method_type VARCHAR(50),
  payment_source_id VARCHAR(255),

  -- Información del cliente
  customer_email VARCHAR(255),
  customer_name VARCHAR(255),

  -- Webhook data
  signature_checksum VARCHAR(255),
  raw_webhook_data JSONB,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  finalized_at TIMESTAMP WITH TIME ZONE,
  webhook_received_at TIMESTAMP WITH TIME ZONE
);

-- =============================================
-- 3. COURSE PURCHASES & USER FAVORITES
-- =============================================

-- Tabla de compras de cursos (relación usuario-curso)
CREATE TABLE IF NOT EXISTS course_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,

  -- Estado de la compra
  is_active BOOLEAN DEFAULT true,
  access_granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  access_expires_at TIMESTAMP WITH TIME ZONE,

  -- Metadatos
  purchase_price DECIMAL(10,2),
  discount_applied DECIMAL(10,2) DEFAULT 0,

  -- Timestamps
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraint: un usuario no puede comprar el mismo curso dos veces
  UNIQUE(user_id, course_id)
);

-- Tabla de favoritos
CREATE TABLE IF NOT EXISTS user_favorites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, course_id)
);

-- =============================================
-- 4. ÍNDICES PARA OPTIMIZACIÓN
-- =============================================

-- Índices para orders
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_course_id ON orders(course_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_wompi_transaction_id ON orders(wompi_transaction_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

-- Índices para wompi_transactions
CREATE INDEX IF NOT EXISTS idx_wompi_transactions_order_id ON wompi_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_wompi_transactions_wompi_id ON wompi_transactions(wompi_transaction_id);
CREATE INDEX IF NOT EXISTS idx_wompi_transactions_status ON wompi_transactions(status);
CREATE INDEX IF NOT EXISTS idx_wompi_transactions_created_at ON wompi_transactions(created_at);

-- Índices para course_purchases
CREATE INDEX IF NOT EXISTS idx_course_purchases_user_id ON course_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_course_purchases_course_id ON course_purchases(course_id);
CREATE INDEX IF NOT EXISTS idx_course_purchases_order_id ON course_purchases(order_id);
CREATE INDEX IF NOT EXISTS idx_course_purchases_active ON course_purchases(is_active) WHERE is_active = true;

-- Índices para user_favorites
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_course_id ON user_favorites(course_id);

-- =============================================
-- 5. TRIGGERS
-- =============================================

-- Trigger para nutritional_blogs
CREATE TRIGGER update_nutritional_blogs_updated_at
    BEFORE UPDATE ON nutritional_blogs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Triggers para orders y course_purchases
CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_course_purchases_updated_at
    BEFORE UPDATE ON course_purchases
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 6. ROW LEVEL SECURITY (RLS)
-- =============================================

-- Habilitar RLS
ALTER TABLE nutritional_blogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE wompi_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

-- Políticas para nutritional_blogs (todos pueden leer, solo admins escribir)
CREATE POLICY "Published blogs are viewable by everyone" ON nutritional_blogs
    FOR SELECT USING (is_published = true);

CREATE POLICY "Admins can manage all blogs" ON nutritional_blogs
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Políticas para orders
CREATE POLICY "Users can view their own orders" ON orders
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own orders" ON orders
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Políticas para wompi_transactions
CREATE POLICY "Users can view transactions for their orders" ON wompi_transactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM orders
            WHERE orders.id = wompi_transactions.order_id
            AND orders.user_id = auth.uid()
        )
    );

-- Políticas para course_purchases
CREATE POLICY "Users can view their own purchases" ON course_purchases
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own purchases" ON course_purchases
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own purchases" ON course_purchases
    FOR UPDATE USING (auth.uid() = user_id);

-- Políticas para user_favorites
CREATE POLICY "Users can view their own favorites" ON user_favorites
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own favorites" ON user_favorites
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorites" ON user_favorites
    FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- 7. VISTAS ÚTILES
-- =============================================

-- Vista para órdenes con información del curso
CREATE OR REPLACE VIEW orders_with_course_info AS
SELECT
    o.*,
    c.title as course_title,
    c.preview_image as course_image
FROM orders o
LEFT JOIN courses c ON o.course_id = c.id;

-- Vista para compras activas del usuario
CREATE OR REPLACE VIEW user_active_purchases AS
SELECT
    cp.*,
    c.title as course_title,
    c.preview_image as course_image,
    c.duration_days
FROM course_purchases cp
JOIN courses c ON cp.course_id = c.id
WHERE cp.is_active = true;
-- Agregar política RLS para INSERT en profiles
-- Esto permite que los usuarios creen su propio perfil si el trigger falla

CREATE POLICY "Usuarios pueden crear su propio perfil" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Actualizar trigger para crear perfil automáticamente cuando se crea un usuario
-- Esto funciona tanto para registro con email como con OAuth (Google)

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_name TEXT;
BEGIN
  -- Obtener el nombre del usuario desde los metadatos
  user_name := COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', 'Usuario');
  
  INSERT INTO public.profiles (id, email, name, full_name, membership_status, weight, height, gender, goals)
  VALUES (
    NEW.id,
    NEW.email,
    user_name,
    user_name, -- También guardar en full_name para compatibilidad
    'inactive',
    0, -- Se llenará en el onboarding
    0, -- Se llenará en el onboarding
    'other', -- Se llenará en el onboarding
    '[]' -- Se llenará en el onboarding (JSON string vacío)
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, public.profiles.name),
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recrear el trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Comentario
COMMENT ON FUNCTION public.handle_new_user() IS 'Crea o actualiza automáticamente el perfil cuando se registra un usuario (email o OAuth)';

-- Agregar columnas relacionadas con video/Mux a la tabla courses
-- Estas columnas son necesarias para el manejo de videos de cursos

ALTER TABLE courses 
ADD COLUMN IF NOT EXISTS mux_playback_id VARCHAR(255);

ALTER TABLE courses 
ADD COLUMN IF NOT EXISTS intro_video_url TEXT;

ALTER TABLE courses 
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

ALTER TABLE courses 
ADD COLUMN IF NOT EXISTS video_preview_url TEXT;

ALTER TABLE courses 
ADD COLUMN IF NOT EXISTS slug VARCHAR(255);

-- Índice para búsqueda por slug
CREATE INDEX IF NOT EXISTS idx_courses_slug ON courses(slug);

-- Comentarios
COMMENT ON COLUMN courses.mux_playback_id IS 'ID de reproducción de Mux para el video del curso';
COMMENT ON COLUMN courses.intro_video_url IS 'URL del video de introducción del curso';
COMMENT ON COLUMN courses.thumbnail_url IS 'URL de la imagen miniatura del curso';
COMMENT ON COLUMN courses.video_preview_url IS 'URL del video de preview del curso';
COMMENT ON COLUMN courses.slug IS 'Slug único para URLs amigables del curso';




-- ============================================
-- CATEGORÍAS POR DEFECTO PARA CURSOS
-- ============================================
-- Estas son las mismas categorías que aparecen en el onboarding
-- para mantener consistencia en toda la plataforma
-- ============================================

-- Crear tabla de categorías de cursos si no existe
CREATE TABLE IF NOT EXISTS course_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  color VARCHAR(20),
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_course_categories_sort_order ON course_categories(sort_order);
CREATE INDEX IF NOT EXISTS idx_course_categories_is_active ON course_categories(is_active);

-- Habilitar RLS
ALTER TABLE course_categories ENABLE ROW LEVEL SECURITY;

-- Política: Todos pueden leer categorías activas
DROP POLICY IF EXISTS "Anyone can view active categories" ON course_categories;
CREATE POLICY "Anyone can view active categories"
  ON course_categories FOR SELECT
  USING (is_active = true);

-- Política: Solo admins pueden insertar/actualizar/eliminar
DROP POLICY IF EXISTS "Admins can manage categories" ON course_categories;
CREATE POLICY "Admins can manage categories"
  ON course_categories FOR ALL
  USING (
    auth.uid() IN (
      SELECT id FROM auth.users
      WHERE raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Insertar categorías por defecto
INSERT INTO course_categories (name, description, icon, color, sort_order, is_active) VALUES
(
  'Bajar de peso',
  'Cursos y programas enfocados en pérdida de peso saludable y sostenible',
  'scale',
  '#EF4444', -- Red
  1,
  true
),
(
  'Tonificar',
  'Programas para tonificar y definir músculos, mejorar la composición corporal',
  'dumbbell',
  '#8B5CF6', -- Purple
  2,
  true
),
(
  'Cardio',
  'Entrenamientos cardiovasculares para mejorar resistencia y quemar calorías',
  'heart',
  '#F59E0B', -- Amber
  3,
  true
),
(
  'Flexibilidad',
  'Cursos de estiramiento, movilidad y flexibilidad para mejorar el rango de movimiento',
  'move',
  '#10B981', -- Green
  4,
  true
),
(
  'Fuerza',
  'Programas de entrenamiento de fuerza para ganar masa muscular y potencia',
  'zap',
  '#3B82F6', -- Blue
  5,
  true
)
ON CONFLICT (name) DO NOTHING;
-- Deshabilitar RLS para tablas administrativas
-- Estas tablas son manejadas solo por administradores y el service_role

-- Deshabilitar RLS para courses
ALTER TABLE courses DISABLE ROW LEVEL SECURITY;

-- Deshabilitar RLS para course_lessons  
ALTER TABLE course_lessons DISABLE ROW LEVEL SECURITY;

-- Deshabilitar RLS para course_categories
ALTER TABLE course_categories DISABLE ROW LEVEL SECURITY;

-- Deshabilitar RLS para nutritional_blogs
ALTER TABLE nutritional_blogs DISABLE ROW LEVEL SECURITY;

-- Deshabilitar RLS para complements
ALTER TABLE complements DISABLE ROW LEVEL SECURITY;

-- Comentario
COMMENT ON TABLE courses IS 'Tabla de cursos - RLS deshabilitado, acceso controlado por service_role';
COMMENT ON TABLE course_lessons IS 'Tabla de lecciones - RLS deshabilitado, acceso controlado por service_role';




-- ==================== BANNERS ====================
-- Tabla para banners del dashboard de usuarios

CREATE TABLE IF NOT EXISTS banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255),
  image_url TEXT NOT NULL,
  link_url TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS para banners
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Banners son públicos para lectura" ON banners;
CREATE POLICY "Banners son públicos para lectura" ON banners
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Usuarios autenticados pueden gestionar banners" ON banners;
CREATE POLICY "Usuarios autenticados pueden gestionar banners" ON banners
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- ==================== COMPLEMENTOS (Reels/Historias semanales) ====================
-- Tabla para complementos/reels semanales

CREATE TABLE IF NOT EXISTS weekly_complements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_number INTEGER NOT NULL, -- Número de semana del año (1-52)
  year INTEGER NOT NULL, -- Año
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 1 AND day_of_week <= 5), -- 1=Lunes, 2=Martes, etc.
  title VARCHAR(255) NOT NULL,
  description TEXT,
  mux_playback_id VARCHAR(255), -- ID de Mux para el video
  mux_asset_id VARCHAR(255), -- Asset ID de Mux
  thumbnail_url TEXT,
  duration_seconds INTEGER DEFAULT 60,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Único por semana/año/día
  UNIQUE(week_number, year, day_of_week)
);

-- Índices para búsqueda rápida
CREATE INDEX IF NOT EXISTS idx_weekly_complements_week ON weekly_complements(year, week_number);
CREATE INDEX IF NOT EXISTS idx_weekly_complements_published ON weekly_complements(is_published);

-- RLS para weekly_complements
ALTER TABLE weekly_complements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Complementos publicados son públicos" ON weekly_complements;
CREATE POLICY "Complementos publicados son públicos" ON weekly_complements
  FOR SELECT USING (is_published = true);

DROP POLICY IF EXISTS "Usuarios autenticados pueden gestionar complementos" ON weekly_complements;
CREATE POLICY "Usuarios autenticados pueden gestionar complementos" ON weekly_complements
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_banners_updated_at ON banners;
CREATE TRIGGER update_banners_updated_at
  BEFORE UPDATE ON banners
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_weekly_complements_updated_at ON weekly_complements;
CREATE TRIGGER update_weekly_complements_updated_at
  BEFORE UPDATE ON weekly_complements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();




-- Cambiar la columna category de UUID a VARCHAR para permitir IDs de string
-- Las categorías ahora son hardcoded en el frontend con IDs como 'lose_weight', 'gain_muscle', etc.

-- Primero quitar el constraint de foreign key si existe
ALTER TABLE courses DROP CONSTRAINT IF EXISTS courses_category_fkey;

-- Cambiar el tipo de columna a VARCHAR
ALTER TABLE courses ALTER COLUMN category TYPE VARCHAR(100);

-- Comentario
COMMENT ON COLUMN courses.category IS 'ID de la categoría del curso (string, ej: lose_weight, gain_muscle, etc.)';

-- POLÍTICAS RLS PARA PRODUCCIÓN
-- Permite lectura pública y escritura para usuarios autenticados (admins)

-- ==================== CATEGORIES (tabla antigua) ====================
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Categorías son públicas para lectura" ON categories;
CREATE POLICY "Categorías son públicas para lectura" ON categories
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Usuarios autenticados pueden gestionar categorías" ON categories;
CREATE POLICY "Usuarios autenticados pueden gestionar categorías" ON categories
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- ==================== COURSES ====================
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- Lectura: Todos pueden ver cursos publicados
DROP POLICY IF EXISTS "Cursos publicados son públicos" ON courses;
CREATE POLICY "Cursos publicados son públicos" ON courses
  FOR SELECT USING (is_published = true OR auth.role() = 'authenticated');

-- Insertar: Usuarios autenticados pueden crear cursos
DROP POLICY IF EXISTS "Usuarios autenticados pueden crear cursos" ON courses;
CREATE POLICY "Usuarios autenticados pueden crear cursos" ON courses
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Actualizar: Usuarios autenticados pueden actualizar cursos
DROP POLICY IF EXISTS "Usuarios autenticados pueden actualizar cursos" ON courses;
CREATE POLICY "Usuarios autenticados pueden actualizar cursos" ON courses
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Eliminar: Usuarios autenticados pueden eliminar cursos
DROP POLICY IF EXISTS "Usuarios autenticados pueden eliminar cursos" ON courses;
CREATE POLICY "Usuarios autenticados pueden eliminar cursos" ON courses
  FOR DELETE USING (auth.role() = 'authenticated');

-- ==================== COURSE_LESSONS ====================
ALTER TABLE course_lessons ENABLE ROW LEVEL SECURITY;

-- Lectura: Todos pueden ver lecciones
DROP POLICY IF EXISTS "Lecciones son públicas para lectura" ON course_lessons;
CREATE POLICY "Lecciones son públicas para lectura" ON course_lessons
  FOR SELECT USING (true);

-- Insertar: Usuarios autenticados pueden crear lecciones
DROP POLICY IF EXISTS "Usuarios autenticados pueden crear lecciones" ON course_lessons;
CREATE POLICY "Usuarios autenticados pueden crear lecciones" ON course_lessons
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Actualizar: Usuarios autenticados pueden actualizar lecciones
DROP POLICY IF EXISTS "Usuarios autenticados pueden actualizar lecciones" ON course_lessons;
CREATE POLICY "Usuarios autenticados pueden actualizar lecciones" ON course_lessons
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Eliminar: Usuarios autenticados pueden eliminar lecciones
DROP POLICY IF EXISTS "Usuarios autenticados pueden eliminar lecciones" ON course_lessons;
CREATE POLICY "Usuarios autenticados pueden eliminar lecciones" ON course_lessons
  FOR DELETE USING (auth.role() = 'authenticated');

-- ==================== COURSE_CATEGORIES ====================
ALTER TABLE course_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Categorías son públicas" ON course_categories;
CREATE POLICY "Categorías son públicas" ON course_categories
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Usuarios autenticados pueden gestionar categorías" ON course_categories;
CREATE POLICY "Usuarios autenticados pueden gestionar categorías" ON course_categories
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- ==================== NUTRITIONAL_BLOGS ====================
ALTER TABLE nutritional_blogs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Blogs son públicos para lectura" ON nutritional_blogs;
CREATE POLICY "Blogs son públicos para lectura" ON nutritional_blogs
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Usuarios autenticados pueden gestionar blogs" ON nutritional_blogs;
CREATE POLICY "Usuarios autenticados pueden gestionar blogs" ON nutritional_blogs
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- ==================== COMPLEMENTS ====================
ALTER TABLE complements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Complementos son públicos para lectura" ON complements;
CREATE POLICY "Complementos son públicos para lectura" ON complements
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Usuarios autenticados pueden gestionar complementos" ON complements;
CREATE POLICY "Usuarios autenticados pueden gestionar complementos" ON complements
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- ==================== BANNERS ====================
-- Tabla para banners del dashboard de usuarios

CREATE TABLE IF NOT EXISTS banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255),
  image_url TEXT NOT NULL,
  link_url TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS para banners
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Banners son públicos para lectura" ON banners;
CREATE POLICY "Banners son públicos para lectura" ON banners
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Usuarios autenticados pueden gestionar banners" ON banners;
CREATE POLICY "Usuarios autenticados pueden gestionar banners" ON banners
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- ==================== COMPLEMENTOS (Reels/Historias semanales) ====================
-- Tabla para complementos/reels semanales

CREATE TABLE IF NOT EXISTS weekly_complements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_number INTEGER NOT NULL, -- Número de semana del año (1-52)
  year INTEGER NOT NULL, -- Año
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 1 AND day_of_week <= 5), -- 1=Lunes, 2=Martes, etc.
  title VARCHAR(255) NOT NULL,
  description TEXT,
  mux_playback_id VARCHAR(255), -- ID de Mux para el video
  mux_asset_id VARCHAR(255), -- Asset ID de Mux
  thumbnail_url TEXT,
  duration_seconds INTEGER DEFAULT 60,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Único por semana/año/día
  UNIQUE(week_number, year, day_of_week)
);

-- Índices para búsqueda rápida
CREATE INDEX IF NOT EXISTS idx_weekly_complements_week ON weekly_complements(year, week_number);
CREATE INDEX IF NOT EXISTS idx_weekly_complements_published ON weekly_complements(is_published);

-- RLS para weekly_complements
ALTER TABLE weekly_complements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Complementos publicados son públicos" ON weekly_complements;
CREATE POLICY "Complementos publicados son públicos" ON weekly_complements
  FOR SELECT USING (is_published = true);

DROP POLICY IF EXISTS "Usuarios autenticados pueden gestionar complementos" ON weekly_complements;
CREATE POLICY "Usuarios autenticados pueden gestionar complementos" ON weekly_complements
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_banners_updated_at ON banners;
CREATE TRIGGER update_banners_updated_at
  BEFORE UPDATE ON banners
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_weekly_complements_updated_at ON weekly_complements;
CREATE TRIGGER update_weekly_complements_updated_at
  BEFORE UPDATE ON weekly_complements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==================== STORAGE BUCKETS ====================
-- Crear buckets para almacenamiento de imágenes

-- Bucket para imágenes de cursos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('course-images', 'course-images', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO NOTHING;

-- Bucket para imágenes de lecciones
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('lesson-images', 'lesson-images', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO NOTHING;

-- Bucket para banners
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('banners', 'banners', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO NOTHING;

-- ==================== POLÍTICAS DE STORAGE ====================

-- Políticas para course-images
DROP POLICY IF EXISTS "Imágenes de cursos son públicas" ON storage.objects;
CREATE POLICY "Imágenes de cursos son públicas" ON storage.objects
  FOR SELECT USING (bucket_id = 'course-images');

DROP POLICY IF EXISTS "Usuarios autenticados pueden subir imágenes de cursos" ON storage.objects;
CREATE POLICY "Usuarios autenticados pueden subir imágenes de cursos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'course-images' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Usuarios autenticados pueden actualizar imágenes de cursos" ON storage.objects;
CREATE POLICY "Usuarios autenticados pueden actualizar imágenes de cursos" ON storage.objects
  FOR UPDATE USING (bucket_id = 'course-images' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Usuarios autenticados pueden eliminar imágenes de cursos" ON storage.objects;
CREATE POLICY "Usuarios autenticados pueden eliminar imágenes de cursos" ON storage.objects
  FOR DELETE USING (bucket_id = 'course-images' AND auth.role() = 'authenticated');

-- Políticas para lesson-images
DROP POLICY IF EXISTS "Imágenes de lecciones son públicas" ON storage.objects;
CREATE POLICY "Imágenes de lecciones son públicas" ON storage.objects
  FOR SELECT USING (bucket_id = 'lesson-images');

DROP POLICY IF EXISTS "Usuarios autenticados pueden subir imágenes de lecciones" ON storage.objects;
CREATE POLICY "Usuarios autenticados pueden subir imágenes de lecciones" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'lesson-images' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Usuarios autenticados pueden actualizar imágenes de lecciones" ON storage.objects;
CREATE POLICY "Usuarios autenticados pueden actualizar imágenes de lecciones" ON storage.objects
  FOR UPDATE USING (bucket_id = 'lesson-images' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Usuarios autenticados pueden eliminar imágenes de lecciones" ON storage.objects;
CREATE POLICY "Usuarios autenticados pueden eliminar imágenes de lecciones" ON storage.objects
  FOR DELETE USING (bucket_id = 'lesson-images' AND auth.role() = 'authenticated');

-- Políticas para banners
DROP POLICY IF EXISTS "Banners son públicos" ON storage.objects;
CREATE POLICY "Banners son públicos" ON storage.objects
  FOR SELECT USING (bucket_id = 'banners');

DROP POLICY IF EXISTS "Usuarios autenticados pueden subir banners" ON storage.objects;
CREATE POLICY "Usuarios autenticados pueden subir banners" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'banners' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Usuarios autenticados pueden actualizar banners" ON storage.objects;
CREATE POLICY "Usuarios autenticados pueden actualizar banners" ON storage.objects
  FOR UPDATE USING (bucket_id = 'banners' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Usuarios autenticados pueden eliminar banners" ON storage.objects;
CREATE POLICY "Usuarios autenticados pueden eliminar banners" ON storage.objects
  FOR DELETE USING (bucket_id = 'banners' AND auth.role() = 'authenticated');




-- Tabla para guardar el progreso de lecciones completadas por usuario
CREATE TABLE IF NOT EXISTS user_lesson_completions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    lesson_id UUID NOT NULL REFERENCES course_lessons(id) ON DELETE CASCADE,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    duration_watched INTEGER DEFAULT 0, -- Minutos vistos de la lección
    UNIQUE(user_id, lesson_id) -- Un usuario solo puede completar una lección una vez
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_user_lesson_completions_user ON user_lesson_completions (user_id);
CREATE INDEX IF NOT EXISTS idx_user_lesson_completions_course ON user_lesson_completions (course_id);
CREATE INDEX IF NOT EXISTS idx_user_lesson_completions_completed ON user_lesson_completions (completed_at);

-- RLS para user_lesson_completions
ALTER TABLE user_lesson_completions ENABLE ROW LEVEL SECURITY;

-- Los usuarios pueden ver sus propias completaciones
CREATE POLICY "Usuarios pueden ver sus completaciones" ON user_lesson_completions
    FOR SELECT USING (auth.uid() = user_id);

-- Los usuarios pueden insertar sus propias completaciones
CREATE POLICY "Usuarios pueden registrar completaciones" ON user_lesson_completions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Los usuarios pueden actualizar sus propias completaciones
CREATE POLICY "Usuarios pueden actualizar completaciones" ON user_lesson_completions
    FOR UPDATE USING (auth.uid() = user_id);

-- Los usuarios pueden eliminar sus propias completaciones
CREATE POLICY "Usuarios pueden eliminar completaciones" ON user_lesson_completions
    FOR DELETE USING (auth.uid() = user_id);




-- Tabla para registrar el historial de peso de los usuarios
CREATE TABLE IF NOT EXISTS weight_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    weight DECIMAL(5,2) NOT NULL,
    record_date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_weight_records_user ON weight_records (user_id);
CREATE INDEX IF NOT EXISTS idx_weight_records_date ON weight_records (record_date);
CREATE INDEX IF NOT EXISTS idx_weight_records_user_date ON weight_records (user_id, record_date);

-- RLS para weight_records
ALTER TABLE weight_records ENABLE ROW LEVEL SECURITY;

-- Los usuarios pueden ver sus propios registros de peso
CREATE POLICY "Usuarios pueden ver sus registros de peso" ON weight_records
    FOR SELECT USING (auth.uid() = user_id);

-- Los usuarios pueden insertar sus propios registros de peso
CREATE POLICY "Usuarios pueden insertar registros de peso" ON weight_records
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Los usuarios pueden actualizar sus propios registros de peso
CREATE POLICY "Usuarios pueden actualizar registros de peso" ON weight_records
    FOR UPDATE USING (auth.uid() = user_id);

-- Los usuarios pueden eliminar sus propios registros de peso
CREATE POLICY "Usuarios pueden eliminar registros de peso" ON weight_records
    FOR DELETE USING (auth.uid() = user_id);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_weight_records_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_weight_records_updated_at ON weight_records;
CREATE TRIGGER update_weight_records_updated_at
    BEFORE UPDATE ON weight_records
    FOR EACH ROW EXECUTE FUNCTION update_weight_records_updated_at();




-- Eliminar el foreign key constraint existente que apunta solo a 'complements'
ALTER TABLE user_complement_interactions 
DROP CONSTRAINT IF EXISTS user_complement_interactions_complement_id_fkey;

-- También eliminar el FK de complement_stats
ALTER TABLE complement_stats 
DROP CONSTRAINT IF EXISTS complement_stats_complement_id_fkey;

-- No agregamos un nuevo foreign key porque el complement_id puede venir
-- de 'complements' o 'weekly_complements'. La validación se hace en la API.

-- Agregar comentarios para documentar
COMMENT ON COLUMN user_complement_interactions.complement_id IS 'ID del complemento (puede ser de tabla complements o weekly_complements)';
COMMENT ON COLUMN complement_stats.complement_id IS 'ID del complemento (puede ser de tabla complements o weekly_complements)';

-- Agregar campos de información del comprador a la tabla profiles
-- Estos campos son necesarios para Wompi y facturación

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS document_id VARCHAR(50);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS document_type VARCHAR(10) DEFAULT 'CC';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS address TEXT;

-- Crear índice para búsqueda rápida por documento
CREATE INDEX IF NOT EXISTS idx_profiles_document_id ON profiles(document_id);

-- Comentarios para documentar los campos
COMMENT ON COLUMN profiles.document_id IS 'Número de documento de identidad del usuario';
COMMENT ON COLUMN profiles.document_type IS 'Tipo de documento (CC, NIT, CE, etc.)';
COMMENT ON COLUMN profiles.address IS 'Dirección de residencia del usuario';
-- =============================================
-- AGREGAR COLUMNA start_date A course_purchases
-- =============================================
-- Esta migración agrega la columna start_date para permitir
-- que los usuarios seleccionen una fecha de inicio personalizada
-- para sus cursos comprados

-- Agregar columna start_date (DATE) a course_purchases
ALTER TABLE course_purchases
ADD COLUMN IF NOT EXISTS start_date DATE;

-- Comentario en la columna para documentación
COMMENT ON COLUMN course_purchases.start_date IS 'Fecha de inicio seleccionada por el usuario para el curso. Si es NULL, se usa created_at como fecha de inicio.';

-- Índice para optimizar consultas por fecha de inicio
CREATE INDEX IF NOT EXISTS idx_course_purchases_start_date 
ON course_purchases(start_date) 
WHERE start_date IS NOT NULL;

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
