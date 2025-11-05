-- Agregar columna start_date a course_purchases
-- Esta columna almacena la fecha de inicio del curso seleccionada por el usuario

ALTER TABLE course_purchases 
ADD COLUMN IF NOT EXISTS start_date DATE;

-- Agregar comentario a la columna
COMMENT ON COLUMN course_purchases.start_date IS 'Fecha de inicio del curso seleccionada por el usuario. A partir de esta fecha se desbloquean las clases diariamente.';

