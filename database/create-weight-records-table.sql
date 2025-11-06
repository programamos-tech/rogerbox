-- Tabla para almacenar el historial de pesos semanales
CREATE TABLE IF NOT EXISTS weight_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  weight DECIMAL(5,2) NOT NULL,
  record_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Un usuario solo puede tener un registro por fecha
  UNIQUE(user_id, record_date)
);

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_weight_records_user_id ON weight_records(user_id);
CREATE INDEX IF NOT EXISTS idx_weight_records_record_date ON weight_records(record_date);
CREATE INDEX IF NOT EXISTS idx_weight_records_user_date ON weight_records(user_id, record_date DESC);

-- Comentarios
COMMENT ON TABLE weight_records IS 'Registros semanales de peso de los usuarios';
COMMENT ON COLUMN weight_records.record_date IS 'Fecha del registro (típicamente viernes)';
COMMENT ON COLUMN weight_records.weight IS 'Peso en kilogramos';

