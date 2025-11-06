# Migración de Imágenes Base64 a WebP

## Problema
Las imágenes están guardadas como Base64 en la base de datos, lo que causa:
- Respuestas de API muy pesadas (cientos de KB o MB)
- Carga extremadamente lenta
- Base de datos inflada

## Solución
Este script migra todas las imágenes Base64 a formato WebP en Supabase Storage.

## Requisitos

1. **Instalar Sharp** (para conversión de imágenes):
```bash
npm install sharp
```

2. **Variables de entorno** (en `.env.local` o `.env`):
```
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
```

## Uso

```bash
npm run migrate-images
```

O directamente:
```bash
node scripts/migrate-base64-to-webp.js
```

## Qué hace el script

1. ✅ Busca todos los cursos con imágenes Base64
2. ✅ Busca todas las lecciones con imágenes Base64
3. ✅ Convierte cada imagen Base64 a formato WebP (85% calidad)
4. ✅ Sube las imágenes a Supabase Storage:
   - Cursos → `course-images/courses/{id}.webp`
   - Lecciones → `lesson-images/lessons/{id}.webp`
5. ✅ Actualiza las URLs en la base de datos
6. ✅ Muestra estadísticas de reducción de tamaño

## Seguridad

- El script crea buckets automáticamente si no existen
- Los archivos temporales se eliminan después de la migración
- Usa `SUPABASE_SERVICE_ROLE_KEY` para tener permisos de escritura

## Resultado esperado

- **Antes**: Imágenes Base64 de 100-500 KB en la BD
- **Después**: URLs de WebP (~50-150 KB de archivo)
- **Mejora**: ~70-80% reducción en tamaño y carga mucho más rápida

## Notas

- El script procesa las imágenes una por una para evitar problemas de memoria
- Si hay errores, el script continúa con las siguientes imágenes
- Verifica los logs para ver qué se migró exitosamente

