-- Script completo para crear la tabla weight_records y configurar RLS
-- Ejecutar este script en Supabase SQL Editor

-- 1. Crear la tabla weight_records si no existe
-- NOTA: Se permite múltiples registros por día usando created_at como diferenciador
CREATE TABLE IF NOT EXISTS public.weight_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  weight DECIMAL(5,2) NOT NULL,
  record_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  
  -- Se eliminó la restricción UNIQUE para permitir múltiples registros por día
  -- Cada registro se diferencia por su created_at (timestamp)
);

-- 2. Crear índices para optimización
CREATE INDEX IF NOT EXISTS idx_weight_records_user_id ON public.weight_records(user_id);
CREATE INDEX IF NOT EXISTS idx_weight_records_record_date ON public.weight_records(record_date);
CREATE INDEX IF NOT EXISTS idx_weight_records_created_at ON public.weight_records(user_id, created_at DESC);

-- 3. Habilitar RLS
ALTER TABLE public.weight_records ENABLE ROW LEVEL SECURITY;

-- 4. Eliminar políticas existentes si las hay (para evitar conflictos)
DROP POLICY IF EXISTS "Users can view their own weight records" ON public.weight_records;
DROP POLICY IF EXISTS "Users can insert their own weight records" ON public.weight_records;
DROP POLICY IF EXISTS "Users can update their own weight records" ON public.weight_records;
DROP POLICY IF EXISTS "Users can delete their own weight records" ON public.weight_records;

-- 5. Crear políticas RLS
-- Política para que los usuarios puedan ver sus propios registros de peso
CREATE POLICY "Users can view their own weight records" ON public.weight_records
    FOR SELECT USING (auth.uid() = user_id);

-- Política para que los usuarios puedan insertar sus propios registros de peso
CREATE POLICY "Users can insert their own weight records" ON public.weight_records
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política para que los usuarios puedan actualizar sus propios registros de peso
CREATE POLICY "Users can update their own weight records" ON public.weight_records
    FOR UPDATE USING (auth.uid() = user_id);

-- Política para que los usuarios puedan eliminar sus propios registros de peso
CREATE POLICY "Users can delete their own weight records" ON public.weight_records
    FOR DELETE USING (auth.uid() = user_id);

-- 6. Comentarios
COMMENT ON TABLE public.weight_records IS 'Registros de peso de los usuarios';
COMMENT ON COLUMN public.weight_records.record_date IS 'Fecha del registro';
COMMENT ON COLUMN public.weight_records.weight IS 'Peso en kilogramos';

-- Verificar que la tabla se creó correctamente
SELECT 
    table_name, 
    column_name, 
    data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'weight_records'
ORDER BY ordinal_position;

