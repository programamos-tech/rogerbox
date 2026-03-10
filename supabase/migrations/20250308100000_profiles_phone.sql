-- Teléfono / WhatsApp del usuario en su perfil
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS phone TEXT;

COMMENT ON COLUMN profiles.phone IS 'Teléfono o WhatsApp del usuario';
