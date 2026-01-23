-- Agregar campo is_inactive a gym_client_info
ALTER TABLE gym_client_info 
ADD COLUMN IF NOT EXISTS is_inactive BOOLEAN DEFAULT false;

-- Crear índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_gym_client_info_is_inactive ON gym_client_info(is_inactive);

-- Comentario
COMMENT ON COLUMN gym_client_info.is_inactive IS 'Indica si el cliente está inactivo (más de 1 mes sin pagar)';
