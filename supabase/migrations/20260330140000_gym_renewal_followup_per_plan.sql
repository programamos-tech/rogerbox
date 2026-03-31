-- Seguimiento "renovación descartada" por par (cliente gimnasio, plan), no global por cliente.

CREATE TABLE IF NOT EXISTS gym_renewal_followup_dismissals (
  client_info_id UUID NOT NULL REFERENCES gym_client_info(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES gym_plans(id) ON DELETE CASCADE,
  dismissed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (client_info_id, plan_id)
);

CREATE INDEX IF NOT EXISTS idx_gym_renewal_followup_dismissals_client
  ON gym_renewal_followup_dismissals (client_info_id);

COMMENT ON TABLE gym_renewal_followup_dismissals IS
  'Planes marcados como "no insistir" en el seguimiento de renovación (admin).';

-- Migrar flag legacy (solo si existía la columna por migración anterior).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'gym_client_info'
      AND column_name = 'renewal_followup_dismissed'
  ) THEN
    INSERT INTO gym_renewal_followup_dismissals (client_info_id, plan_id)
    SELECT DISTINCT m.client_info_id, m.plan_id
    FROM gym_memberships m
    INNER JOIN gym_client_info c ON c.id = m.client_info_id
    WHERE c.renewal_followup_dismissed = true
      AND m.plan_id IS NOT NULL
    ON CONFLICT (client_info_id, plan_id) DO NOTHING;
  END IF;
END $$;

ALTER TABLE gym_client_info DROP COLUMN IF EXISTS renewal_followup_dismissed;

DROP INDEX IF EXISTS idx_gym_client_info_renewal_dismissed;

ALTER TABLE gym_renewal_followup_dismissals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage renewal followup dismissals" ON gym_renewal_followup_dismissals;
CREATE POLICY "Admins can manage renewal followup dismissals"
  ON gym_renewal_followup_dismissals
  FOR ALL
  USING (is_admin_user(auth.uid()))
  WITH CHECK (is_admin_user(auth.uid()));

DROP POLICY IF EXISTS "Users can view own renewal followup dismissals" ON gym_renewal_followup_dismissals;
CREATE POLICY "Users can view own renewal followup dismissals"
  ON gym_renewal_followup_dismissals
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM gym_client_info c
      WHERE c.id = gym_renewal_followup_dismissals.client_info_id
        AND c.user_id = auth.uid()
    )
  );
