-- Saldo a favor por cliente (ledger). Balance = SUM(amount) por client_info_id.
CREATE TABLE IF NOT EXISTS gym_client_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_info_id UUID NOT NULL REFERENCES gym_client_info(id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount <> 0),
  type TEXT NOT NULL CHECK (type IN ('deposit', 'apply', 'adjust', 'refund')),
  payment_id UUID REFERENCES gym_payments(id) ON DELETE SET NULL,
  membership_id UUID REFERENCES gym_memberships(id) ON DELETE SET NULL,
  notes TEXT,
  store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gym_client_credits_client
  ON gym_client_credits(client_info_id);

CREATE INDEX IF NOT EXISTS idx_gym_client_credits_created
  ON gym_client_credits(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_gym_client_credits_payment
  ON gym_client_credits(payment_id)
  WHERE payment_id IS NOT NULL;

UPDATE gym_client_credits
SET store_id = '00000000-0000-0000-0000-000000000001'
WHERE store_id IS NULL;

ALTER TABLE gym_client_credits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage gym client credits" ON gym_client_credits;
CREATE POLICY "Admins can manage gym client credits"
  ON gym_client_credits
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');
