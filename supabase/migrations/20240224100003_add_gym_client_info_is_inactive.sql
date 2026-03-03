-- Add is_inactive column to gym_client_info
ALTER TABLE gym_client_info ADD COLUMN IF NOT EXISTS is_inactive BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_gym_client_info_is_inactive ON gym_client_info(is_inactive);

COMMENT ON COLUMN gym_client_info.is_inactive IS 'Indica si el cliente esta inactivo (mas de 1 mes sin pagar)';
