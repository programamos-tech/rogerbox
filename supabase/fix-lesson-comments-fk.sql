-- Ejecuta esto en Supabase Studio → SQL Editor (una sola vez).
-- Corrige la FK de lesson_comments para que PostgREST pueda hacer el join con profiles
-- y así el insert/select con profiles!inner(name, avatar_url) funcione.

-- Quitar la FK a auth.users y poner FK a profiles (profiles.id = auth user id en Supabase)
ALTER TABLE lesson_comments
  DROP CONSTRAINT IF EXISTS lesson_comments_user_id_fkey;

ALTER TABLE lesson_comments
  ADD CONSTRAINT lesson_comments_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
