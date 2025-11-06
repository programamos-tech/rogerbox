-- Script para verificar qué formato tienen las imágenes en la base de datos

-- Verificar cursos con imágenes Base64
SELECT 
  id,
  title,
  CASE 
    WHEN preview_image LIKE 'data:image%' THEN 'Base64'
    WHEN preview_image LIKE 'https://%.supabase.co%' THEN 'Supabase Storage'
    WHEN preview_image LIKE 'https://img.youtube.com%' THEN 'YouTube'
    WHEN preview_image LIKE 'https://%' THEN 'URL Externa'
    WHEN preview_image LIKE '/images/%' THEN 'Local'
    ELSE 'Desconocido'
  END as formato,
  LENGTH(preview_image) as tamanio_caracteres,
  SUBSTRING(preview_image, 1, 100) as preview
FROM courses
WHERE preview_image IS NOT NULL
ORDER BY LENGTH(preview_image) DESC
LIMIT 10;

-- Verificar lecciones con imágenes Base64
SELECT 
  id,
  title,
  course_id,
  CASE 
    WHEN preview_image LIKE 'data:image%' THEN 'Base64'
    WHEN preview_image LIKE 'https://%.supabase.co%' THEN 'Supabase Storage'
    WHEN preview_image LIKE 'https://img.youtube.com%' THEN 'YouTube'
    WHEN preview_image LIKE 'https://%' THEN 'URL Externa'
    ELSE 'Desconocido'
  END as formato,
  LENGTH(preview_image) as tamanio_caracteres,
  SUBSTRING(preview_image, 1, 100) as preview
FROM course_lessons
WHERE preview_image IS NOT NULL
ORDER BY LENGTH(preview_image) DESC
LIMIT 10;

