-- =========================================
-- MIGRACIÓN DE PLANES DESDE BIGBOSS
-- Ejecutar en Supabase SQL Editor
-- =========================================

-- Plan principal: cupo ROGERBOX (541 registros históricos)
INSERT INTO gym_plans (name, description, price, duration_days, is_active)
VALUES ('cupo ROGERBOX', 'Plan principal RogerBox - Migrado desde BigBoss (541 registros históricos)', 145000, 30, true)
ON CONFLICT DO NOTHING;

-- Plan virtual: cupo ROGERBOX virtual (55 registros históricos)
INSERT INTO gym_plans (name, description, price, duration_days, is_active)
VALUES ('cupo ROGERBOX virtual', 'Plan RogerBox Virtual - Migrado desde BigBoss (55 registros históricos)', 135000, 30, true)
ON CONFLICT DO NOTHING;

-- Asesoría VIP (12 registros históricos)
INSERT INTO gym_plans (name, description, price, duration_days, is_active)
VALUES ('ASESORIA VIP - COACHING', 'Asesoría VIP de Coaching - Migrado desde BigBoss (12 registros históricos)', 150000, 30, true)
ON CONFLICT DO NOTHING;

-- Plan 15 días (5 registros históricos)
INSERT INTO gym_plans (name, description, price, duration_days, is_active)
VALUES ('BOX 15 DIAS', 'Plan de 15 días - Migrado desde BigBoss (5 registros históricos)', 85000, 15, true)
ON CONFLICT DO NOTHING;

-- Productos históricos (inactivos)
INSERT INTO gym_plans (name, description, price, duration_days, is_active)
VALUES ('LINIMENTO', 'Producto Linimento - Migrado desde BigBoss (2 registros históricos)', 55000, 30, false)
ON CONFLICT DO NOTHING;

INSERT INTO gym_plans (name, description, price, duration_days, is_active)
VALUES ('ASESORIA PLATA', 'Asesoría Plata - Migrado desde BigBoss (2 registros históricos)', 50000, 30, false)
ON CONFLICT DO NOTHING;

INSERT INTO gym_plans (name, description, price, duration_days, is_active)
VALUES ('BANDA BOX', 'Banda Box - Migrado desde BigBoss (1 registro histórico)', 60000, 30, false)
ON CONFLICT DO NOTHING;

-- Verificar planes creados
SELECT id, name, price, duration_days, is_active FROM gym_plans ORDER BY is_active DESC, price DESC;
