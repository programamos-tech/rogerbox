-- Permite factura $0 cuando la membresía se cubre 100% con saldo a favor.
ALTER TABLE gym_payments DROP CONSTRAINT IF EXISTS gym_payments_amount_check;
ALTER TABLE gym_payments
  ADD CONSTRAINT gym_payments_amount_check CHECK (amount >= 0);
