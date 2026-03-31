-- Seguimiento comercial de renovación: la dueña puede descartar hasta que el cliente renueve de verdad.
ALTER TABLE gym_client_info
  ADD COLUMN IF NOT EXISTS renewal_followup_dismissed BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN gym_client_info.renewal_followup_dismissed IS
  'Si true, no mostrar como pendiente de renovación (seguimiento cerrado manualmente).';

CREATE INDEX IF NOT EXISTS idx_gym_client_info_renewal_dismissed
  ON gym_client_info (renewal_followup_dismissed)
  WHERE renewal_followup_dismissed = true;
