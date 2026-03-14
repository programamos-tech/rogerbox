-- Rogerbox: límite de 3 cambios de fecha de inicio por compra.
-- start_date_edit_count se incrementa cada vez que el usuario actualiza start_date.

ALTER TABLE course_purchases
  ADD COLUMN IF NOT EXISTS start_date_edit_count INTEGER NOT NULL DEFAULT 0;

COMMENT ON COLUMN course_purchases.start_date_edit_count IS
  'Número de veces que el usuario ha cambiado la fecha de inicio (máximo 3).';
