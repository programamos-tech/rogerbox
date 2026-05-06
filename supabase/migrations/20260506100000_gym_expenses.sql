-- Egresos sede física (gimnasio)
CREATE TABLE IF NOT EXISTS gym_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  concept TEXT NOT NULL,
  category VARCHAR(80) NOT NULL,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  expense_date DATE NOT NULL,
  payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('cash', 'transfer', 'mixed')),
  notes TEXT,
  store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gym_expenses_store_id ON gym_expenses(store_id);
CREATE INDEX IF NOT EXISTS idx_gym_expenses_date ON gym_expenses(expense_date DESC);
CREATE INDEX IF NOT EXISTS idx_gym_expenses_category ON gym_expenses(category);

UPDATE gym_expenses
SET store_id = '00000000-0000-0000-0000-000000000001'
WHERE store_id IS NULL;

ALTER TABLE gym_expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage gym expenses" ON gym_expenses;
CREATE POLICY "Admins can manage gym expenses"
  ON gym_expenses
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');
