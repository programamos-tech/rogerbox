-- Rogerbox: permitir que todos los usuarios autenticados vean nombre y avatar
-- de quienes han comentado en lecciones (para mostrar comentarios en la clase).
-- Requiere: profiles, lesson_comments

DROP POLICY IF EXISTS "Authenticated can view comment author profiles" ON profiles;
CREATE POLICY "Authenticated can view comment author profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    id IN (SELECT user_id FROM lesson_comments)
  );

COMMENT ON POLICY "Authenticated can view comment author profiles" ON profiles IS
  'Usuarios autenticados pueden ver perfiles de autores de comentarios en lecciones para mostrar nombre/avatar en la UI.';
