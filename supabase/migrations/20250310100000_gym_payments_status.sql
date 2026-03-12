-- Permitir anular pagos: no cuentan en ingresos y se muestran como anulados en la lista
ALTER TABLE gym_payments
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'voided'));

-- Valores existentes quedan como active por el default; por si acaso normalizar null
UPDATE gym_payments SET status = 'active' WHERE status IS NULL;

CREATE INDEX IF NOT EXISTS idx_gym_payments_status ON gym_payments(status);
