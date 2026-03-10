-- Foto de perfil del usuario
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

COMMENT ON COLUMN profiles.avatar_url IS 'URL pública de la foto de perfil (ej. Supabase Storage)';
