-- ============================================
-- OBTENER USER ID DEL ADMINISTRADOR
-- ============================================
-- Ejecuta esto en Supabase SQL Editor para obtener el ID del admin
-- ============================================

-- Buscar usuario admin por email
SELECT 
  id as "NEXT_PUBLIC_ADMIN_USER_ID",
  email as "NEXT_PUBLIC_ADMIN_EMAIL",
  raw_user_meta_data->>'role' as "ROLE",
  raw_user_meta_data->>'name' as "NAME",
  email_confirmed_at IS NOT NULL as "EMAIL_CONFIRMED"
FROM auth.users
WHERE email = 'rogerbox@admin.com';

-- Si no existe, buscar por role en metadata
SELECT 
  id as "NEXT_PUBLIC_ADMIN_USER_ID",
  email as "NEXT_PUBLIC_ADMIN_EMAIL",
  raw_user_meta_data->>'role' as "ROLE",
  raw_user_meta_data->>'name' as "NAME",
  email_confirmed_at IS NOT NULL as "EMAIL_CONFIRMED"
FROM auth.users
WHERE raw_user_meta_data->>'role' = 'admin'
ORDER BY created_at DESC
LIMIT 1;

-- ============================================
-- INSTRUCCIONES:
-- ============================================
-- 1. Ejecuta este script en Supabase SQL Editor
-- 2. Copia el valor de "NEXT_PUBLIC_ADMIN_USER_ID"
-- 3. Úsalo en las variables de entorno de Vercel
-- ============================================
