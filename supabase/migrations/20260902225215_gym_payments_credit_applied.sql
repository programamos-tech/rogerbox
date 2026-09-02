-- Guarda cuánto de la factura se cubrió con saldo a favor.
-- `amount` sigue siendo lo cobrado en caja (efectivo/transferencia).
ALTER TABLE gym_payments
  ADD COLUMN IF NOT EXISTS credit_applied NUMERIC NOT NULL DEFAULT 0;

ALTER TABLE gym_payments
  DROP CONSTRAINT IF EXISTS gym_payments_credit_applied_check;
ALTER TABLE gym_payments
  ADD CONSTRAINT gym_payments_credit_applied_check CHECK (credit_applied >= 0);

UPDATE gym_payments p
SET credit_applied = sub.applied
FROM (
  SELECT payment_id, SUM(ABS(amount)) AS applied
  FROM gym_client_credits
  WHERE type = 'apply' AND payment_id IS NOT NULL
  GROUP BY payment_id
) sub
WHERE p.id = sub.payment_id
  AND COALESCE(p.credit_applied, 0) = 0;
