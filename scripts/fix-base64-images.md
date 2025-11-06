# Convertir Imágenes Base64 a Supabase Storage

## Problema
Las imágenes están guardadas como Base64 en la base de datos, lo que hace que:
- Las respuestas de la API sean muy pesadas (cientos de KB o MB)
- La carga sea extremadamente lenta
- El navegador tenga que procesar strings gigantes

## Solución
Convertir las imágenes Base64 a URLs de Supabase Storage.

### Opción 1: Migración Manual (Recomendada)
1. Exportar todas las imágenes Base64 de la BD
2. Convertirlas a archivos .jpg/.png
3. Subirlas a Supabase Storage
4. Actualizar las URLs en la BD

### Opción 2: Script Automático
Crear un script que:
1. Detecte imágenes Base64
2. Las convierta a archivos
3. Las suba a Supabase Storage
4. Actualice las URLs en la BD

## Formato Esperado
- ✅ `https://[proyecto].supabase.co/storage/v1/object/public/course-images/courses/[nombre].jpg`
- ✅ `https://img.youtube.com/vi/[video-id]/maxresdefault.jpg`
- ❌ `data:image/jpeg;base64,/9j/4AAQSkZJRg...` (Base64 - MUY PESADO)

