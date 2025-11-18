-- Script para eliminar la restricción UNIQUE de weight_records
-- Esto permite múltiples registros por día
-- Ejecutar en Supabase SQL Editor si la tabla ya existe

-- Eliminar la restricción UNIQUE si existe
ALTER TABLE public.weight_records 
DROP CONSTRAINT IF EXISTS weight_records_user_id_record_date_key;

-- También eliminar cualquier otro constraint UNIQUE relacionado
DO $$ 
BEGIN
    -- Intentar eliminar cualquier constraint UNIQUE en (user_id, record_date)
    IF EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname LIKE '%user_id%record_date%' 
        AND conrelid = 'public.weight_records'::regclass
    ) THEN
        EXECUTE (
            SELECT 'ALTER TABLE public.weight_records DROP CONSTRAINT ' || conname
            FROM pg_constraint 
            WHERE conname LIKE '%user_id%record_date%' 
            AND conrelid = 'public.weight_records'::regclass
            LIMIT 1
        );
    END IF;
END $$;

-- Crear un nuevo índice en created_at para mejor rendimiento al ordenar
CREATE INDEX IF NOT EXISTS idx_weight_records_created_at ON public.weight_records(user_id, created_at DESC);

-- Verificar que la restricción se eliminó
SELECT 
    conname as constraint_name,
    contype as constraint_type
FROM pg_constraint 
WHERE conrelid = 'public.weight_records'::regclass
AND contype = 'u';

