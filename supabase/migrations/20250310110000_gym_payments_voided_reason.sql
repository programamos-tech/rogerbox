-- Motivo de anulación (obligatorio al anular, mínimo 10 caracteres en la app)
ALTER TABLE gym_payments
  ADD COLUMN IF NOT EXISTS voided_reason TEXT;
