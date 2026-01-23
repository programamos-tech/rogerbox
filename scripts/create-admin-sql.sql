-- ============================================
-- SCRIPT SQL PARA CREAR USUARIO ADMINISTRADOR
-- ============================================
-- Ejecuta este script en Supabase SQL Editor
-- ============================================

-- Crear usuario administrador
-- Nota: Supabase usa auth.users que se crea automáticamente con auth.signup
-- Para crear manualmente, usamos la función auth.users

DO $$
DECLARE
  admin_user_id UUID;
  admin_email TEXT := 'rogerbox@admin.com';
  admin_password TEXT := 'Admin123!@#'; -- Cambia esta contraseña si lo deseas
BEGIN
  -- Verificar si el usuario ya existe
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = admin_email;
  
  IF admin_user_id IS NOT NULL THEN
    RAISE NOTICE '⚠️  El usuario ya existe con ID: %', admin_user_id;
    RAISE NOTICE '📧 Email: %', admin_email;
    RAISE NOTICE '';
    RAISE NOTICE '✅ Usa este ID como NEXT_PUBLIC_ADMIN_USER_ID:';
    RAISE NOTICE '   NEXT_PUBLIC_ADMIN_USER_ID=%', admin_user_id;
  ELSE
    -- Crear el usuario usando la función de Supabase
    -- Nota: En Supabase, los usuarios se crean mejor desde el Dashboard
    -- o usando la API. Este SQL es para referencia.
    
    RAISE NOTICE '💡 Para crear el usuario, usa una de estas opciones:';
    RAISE NOTICE '';
    RAISE NOTICE 'OPCIÓN 1 (Recomendada): Dashboard de Supabase';
    RAISE NOTICE '   1. Ve a Authentication → Users → Add User';
    RAISE NOTICE '   2. Email: %', admin_email;
    RAISE NOTICE '   3. Password: %', admin_password;
    RAISE NOTICE '   4. Marca "Auto Confirm User"';
    RAISE NOTICE '   5. User Metadata: {"role": "admin", "name": "RogerBox Admin"}';
    RAISE NOTICE '   6. Copia el "User UID" que aparece';
    RAISE NOTICE '';
    RAISE NOTICE 'OPCIÓN 2: Actualizar usuario existente';
    RAISE NOTICE '   Si ya tienes un usuario, ejecuta el siguiente bloque:';
  END IF;
END $$;

-- ============================================
-- ACTUALIZAR USUARIO EXISTENTE A ADMIN
-- ============================================
-- Si ya tienes un usuario y quieres convertirlo en admin,
-- ejecuta esto (reemplaza 'TU_EMAIL_AQUI' con el email del usuario):

/*
UPDATE auth.users
SET 
  raw_user_meta_data = jsonb_build_object(
    'role', 'admin',
    'name', 'RogerBox Admin'
  )
WHERE email = 'rogerbox@admin.com';

-- Ver el ID del usuario actualizado
SELECT id, email, raw_user_meta_data
FROM auth.users
WHERE email = 'rogerbox@admin.com';
*/

-- ============================================
-- VERIFICAR USUARIOS ADMIN
-- ============================================
-- Ejecuta esto para ver todos los usuarios admin:

SELECT 
  id,
  email,
  raw_user_meta_data->>'role' as role,
  raw_user_meta_data->>'name' as name,
  email_confirmed_at,
  created_at
FROM auth.users
WHERE 
  raw_user_meta_data->>'role' = 'admin'
  OR email = 'rogerbox@admin.com'
ORDER BY created_at DESC;

-- ============================================
-- NOTAS IMPORTANTES:
-- ============================================
-- 1. El ID que aparece en la consulta es tu NEXT_PUBLIC_ADMIN_USER_ID
-- 2. Copia ese ID y úsalo en las variables de entorno de Vercel
-- 3. Asegúrate de que el usuario tenga email_confirmed_at no nulo
-- 4. El user_metadata debe tener: {"role": "admin"}
-- ============================================
