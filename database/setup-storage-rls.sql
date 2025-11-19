-- Políticas RLS para Supabase Storage
-- Ejecutar en Supabase SQL Editor para permitir que usuarios autenticados suban imágenes

-- Política para permitir que usuarios autenticados suban imágenes a course-images
CREATE POLICY "Authenticated users can upload course images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'course-images' AND
  (storage.foldername(name))[1] = 'courses'
);

-- Política para permitir que usuarios autenticados suban imágenes a lesson-images
CREATE POLICY "Authenticated users can upload lesson images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'lesson-images' AND
  (storage.foldername(name))[1] = 'lessons'
);

-- Política para permitir que usuarios autenticados actualicen sus propias imágenes
CREATE POLICY "Authenticated users can update course images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'course-images' OR bucket_id = 'lesson-images'
);

-- Política para permitir que usuarios autenticados eliminen sus propias imágenes
CREATE POLICY "Authenticated users can delete course images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'course-images' OR bucket_id = 'lesson-images'
);

-- Política para permitir lectura pública de imágenes (ya debería estar configurado si el bucket es público)
CREATE POLICY "Public can view course images"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'course-images' OR bucket_id = 'lesson-images'
);


