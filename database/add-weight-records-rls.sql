-- Políticas RLS para weight_records
-- Ejecutar en Supabase SQL Editor si la tabla weight_records tiene RLS habilitado

-- Habilitar RLS si no está habilitado
ALTER TABLE weight_records ENABLE ROW LEVEL SECURITY;

-- Política para que los usuarios puedan ver sus propios registros de peso
CREATE POLICY "Users can view their own weight records" ON weight_records
    FOR SELECT USING (auth.uid() = user_id);

-- Política para que los usuarios puedan insertar sus propios registros de peso
CREATE POLICY "Users can insert their own weight records" ON weight_records
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política para que los usuarios puedan actualizar sus propios registros de peso
CREATE POLICY "Users can update their own weight records" ON weight_records
    FOR UPDATE USING (auth.uid() = user_id);

-- Política para que los usuarios puedan eliminar sus propios registros de peso (opcional)
CREATE POLICY "Users can delete their own weight records" ON weight_records
    FOR DELETE USING (auth.uid() = user_id);

