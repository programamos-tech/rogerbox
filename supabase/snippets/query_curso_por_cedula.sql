-- Consulta: cuándo activó el curso comprado, por cédula
-- Reemplaza '1234567890' por la cédula a buscar (solo dígitos, 7-12 caracteres).

SELECT
  p.document_id AS cedula,
  p.name AS nombre_usuario,
  p.email,
  c.title AS curso,
  cp.created_at AS compra_creada_at,
  cp.access_granted_at AS acceso_concedido_at,
  cp.start_date AS fecha_inicio_elegida,
  cp.is_active AS activo
FROM profiles p
JOIN course_purchases cp ON cp.user_id = p.id
JOIN courses c ON c.id = cp.course_id
WHERE regexp_replace(TRIM(COALESCE(p.document_id, '')), '\D', '', 'g') = '1234567890'
ORDER BY cp.created_at DESC;
