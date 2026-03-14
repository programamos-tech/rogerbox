-- Rogerbox: permitir que el usuario actualice su propia compra (ej. fecha de inicio).
-- Sin esta política, el UPDATE de start_date en course_purchases falla por RLS y el modal se queda en "Guardando...".

DROP POLICY IF EXISTS "Users can update own purchases" ON course_purchases;
CREATE POLICY "Users can update own purchases"
  ON course_purchases FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

COMMENT ON POLICY "Users can update own purchases" ON course_purchases IS
  'El usuario puede actualizar su propia compra (p. ej. start_date) desde el modal de fecha de inicio.';
