-- Script para agregar campos de comprador a la tabla profiles
-- Ejecutar en Supabase SQL Editor

-- Agregar campo para nombres (primer nombre y segundo nombre)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS first_name VARCHAR(100);

-- Agregar campo para apellidos
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_name VARCHAR(100);

-- Agregar campo para cédula/NIT (ya existe como document_id, pero asegurarnos)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS document_id VARCHAR(50);

-- Agregar campo para tipo de documento
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS document_type VARCHAR(20) DEFAULT 'CC';

-- Agregar campo para dirección de residencia
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS address TEXT;

-- Agregar campo para ciudad
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS city VARCHAR(100);

-- Agregar campo para teléfono
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

-- Agregar comentarios para documentar los campos
COMMENT ON COLUMN profiles.first_name IS 'Nombres del usuario (obligatorio para compras)';
COMMENT ON COLUMN profiles.last_name IS 'Apellidos del usuario (obligatorio para compras)';
COMMENT ON COLUMN profiles.document_id IS 'Número de cédula o NIT (obligatorio para compras)';
COMMENT ON COLUMN profiles.document_type IS 'Tipo de documento: CC, NIT, CE, PP';
COMMENT ON COLUMN profiles.address IS 'Dirección de residencia (obligatorio para compras)';
COMMENT ON COLUMN profiles.city IS 'Ciudad de residencia';
COMMENT ON COLUMN profiles.phone IS 'Teléfono de contacto';

-- Crear índice para búsquedas por documento
CREATE INDEX IF NOT EXISTS idx_profiles_document_id ON profiles(document_id);

-- Verificar que los campos se agregaron correctamente
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('first_name', 'last_name', 'document_id', 'document_type', 'address', 'city', 'phone')
ORDER BY ordinal_position;
