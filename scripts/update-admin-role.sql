-- ============================================
-- ACTUALIZAR USUARIO A ADMINISTRADOR
-- ============================================
-- Ejecuta esto en Supabase SQL Editor para agregar el role 'admin'
-- ============================================

UPDATE auth.users
SET 
  raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || 
    jsonb_build_object(
      'role', 'admin',
      'name', 'RogerBox Admin'
    )
WHERE email = 'rogerbox@admin.com'
  AND id = '8baaa101-ddcc-482c-a409-1ed9b9fac093';

-- Verificar que se actualizó correctamente
SELECT 
  id as "NEXT_PUBLIC_ADMIN_USER_ID",
  email as "NEXT_PUBLIC_ADMIN_EMAIL",
  raw_user_meta_data->>'role' as "ROLE",
  raw_user_meta_data->>'name' as "NAME",
  email_confirmed_at IS NOT NULL as "EMAIL_CONFIRMED"
FROM auth.users
WHERE id = '8baaa101-ddcc-482c-a409-1ed9b9fac093';

-- ============================================
-- Si todo está bien, deberías ver:
-- ROLE: "admin"
-- NAME: "RogerBox Admin"
-- ============================================
