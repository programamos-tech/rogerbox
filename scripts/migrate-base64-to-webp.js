/**
 * Script para migrar imágenes Base64 a WebP en Supabase Storage
 * 
 * Este script:
 * 1. Encuentra todas las imágenes Base64 en cursos y lecciones
 * 2. Las convierte a formato WebP usando Sharp
 * 3. Las sube a Supabase Storage
 * 4. Actualiza las URLs en la base de datos
 * 
 * Uso: node scripts/migrate-base64-to-webp.js
 * 
 * Requisitos:
 * - npm install sharp
 * - Variables de entorno: NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY
 */

const { createClient } = require('@supabase/supabase-js');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Cargar variables de entorno desde .env.local primero, luego .env
require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 
                    process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY ||
                    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Variables de entorno faltantes');
  console.error('Necesitas NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Convierte Base64 a archivo WebP usando Sharp
 */
async function base64ToWebP(base64String, outputPath) {
  // Remover el prefijo data:image/xxx;base64,
  const base64Data = base64String.replace(/^data:image\/\w+;base64,/, '');
  const buffer = Buffer.from(base64Data, 'base64');
  
  // Convertir a WebP con Sharp
  await sharp(buffer)
    .webp({ quality: 85 })
    .toFile(outputPath);
}

/**
 * Sube un archivo a Supabase Storage
 */
async function uploadToStorage(filePath, bucket, storagePath) {
  const fileBuffer = fs.readFileSync(filePath);
  
  // Subir archivo
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(storagePath, fileBuffer, {
      contentType: 'image/webp',
      cacheControl: '31536000',
      upsert: true
    });

  if (error) {
    throw new Error(`Error subiendo a Storage: ${error.message}`);
  }

  // Obtener URL pública
  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(storagePath);

  return publicUrl;
}

/**
 * Migra imágenes de cursos
 */
async function migrateCourses() {
  console.log('\n📚 Migrando imágenes de cursos...\n');

  // Obtener todos los cursos con imágenes Base64
  const { data: courses, error } = await supabase
    .from('courses')
    .select('id, title, preview_image, thumbnail_url');

  if (error) {
    throw new Error(`Error obteniendo cursos: ${error.message}`);
  }

  if (!courses || courses.length === 0) {
    console.log('✅ No hay cursos');
    return;
  }

  // Filtrar solo los que tienen Base64
  const coursesWithBase64 = courses.filter(course => 
    (course.preview_image && course.preview_image.startsWith('data:image')) ||
    (course.thumbnail_url && course.thumbnail_url.startsWith('data:image'))
  );

  console.log(`📊 Encontrados ${coursesWithBase64.length} cursos con imágenes Base64\n`);

  if (coursesWithBase64.length === 0) {
    console.log('✅ No hay cursos con imágenes Base64 para migrar');
    return;
  }

  const tempDir = path.join(process.cwd(), 'temp-images');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  let successCount = 0;
  let errorCount = 0;

  for (const course of coursesWithBase64) {
    try {
      console.log(`🔄 Procesando: ${course.title?.substring(0, 50) || course.id}...`);

      // Determinar qué campo tiene la imagen Base64 (priorizar preview_image)
      let base64Image = null;
      let fieldToUpdate = null;

      if (course.preview_image?.startsWith('data:image')) {
        base64Image = course.preview_image;
        fieldToUpdate = 'preview_image';
      } else if (course.thumbnail_url?.startsWith('data:image')) {
        base64Image = course.thumbnail_url;
        fieldToUpdate = 'thumbnail_url';
      }

      if (!base64Image || !fieldToUpdate) {
        console.log(`⚠️  No se encontró imagen Base64 válida`);
        continue;
      }

      // Convertir a WebP
      const tempWebPPath = path.join(tempDir, `course-${course.id}.webp`);
      await base64ToWebP(base64Image, tempWebPPath);

      // Obtener tamaño del archivo original vs WebP
      const originalSize = Buffer.from(base64Image).length;
      const webpSize = fs.statSync(tempWebPPath).size;
      const reduction = Math.round((1 - webpSize / originalSize) * 100);

      // Subir a Storage
      const storagePath = `courses/${course.id}.webp`;
      const publicUrl = await uploadToStorage(tempWebPPath, 'course-images', storagePath);

      // Actualizar en la base de datos
      const { error: updateError } = await supabase
        .from('courses')
        .update({ [fieldToUpdate]: publicUrl })
        .eq('id', course.id);

      if (updateError) {
        throw new Error(`Error actualizando BD: ${updateError.message}`);
      }

      // Limpiar archivo temporal
      fs.unlinkSync(tempWebPPath);

      console.log(`✅ Migrado (${reduction}% reducción): ${publicUrl}`);
      successCount++;

    } catch (error) {
      console.error(`❌ Error procesando curso ${course.id}:`, error.message);
      errorCount++;
    }
  }

  // Limpiar directorio temporal
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }

  console.log(`\n📊 Resumen cursos:`);
  console.log(`   ✅ Exitosos: ${successCount}`);
  console.log(`   ❌ Errores: ${errorCount}`);
}

/**
 * Migra imágenes de lecciones
 */
async function migrateLessons() {
  console.log('\n📖 Migrando imágenes de lecciones...\n');

  // Obtener todas las lecciones
  const { data: lessons, error } = await supabase
    .from('course_lessons')
    .select('id, title, course_id, preview_image');

  if (error) {
    throw new Error(`Error obteniendo lecciones: ${error.message}`);
  }

  if (!lessons || lessons.length === 0) {
    console.log('✅ No hay lecciones');
    return;
  }

  // Filtrar solo las que tienen Base64
  const lessonsWithBase64 = lessons.filter(lesson =>
    (lesson.preview_image && lesson.preview_image.startsWith('data:image'))
  );

  console.log(`📊 Encontradas ${lessonsWithBase64.length} lecciones con imágenes Base64\n`);

  if (lessonsWithBase64.length === 0) {
    console.log('✅ No hay lecciones con imágenes Base64 para migrar');
    return;
  }

  const tempDir = path.join(process.cwd(), 'temp-images');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  let successCount = 0;
  let errorCount = 0;

  for (const lesson of lessonsWithBase64) {
    try {
      console.log(`🔄 Procesando: ${lesson.title?.substring(0, 50) || lesson.id}...`);

      // Determinar qué campo tiene la imagen Base64
      let base64Image = null;
      let fieldToUpdate = null;

      if (lesson.preview_image?.startsWith('data:image')) {
        base64Image = lesson.preview_image;
        fieldToUpdate = 'preview_image';
      }

      if (!base64Image || !fieldToUpdate) {
        console.log(`⚠️  No se encontró imagen Base64 válida`);
        continue;
      }

      // Convertir a WebP
      const tempWebPPath = path.join(tempDir, `lesson-${lesson.id}.webp`);
      await base64ToWebP(base64Image, tempWebPPath);

      // Obtener tamaño del archivo original vs WebP
      const originalSize = Buffer.from(base64Image).length;
      const webpSize = fs.statSync(tempWebPPath).size;
      const reduction = Math.round((1 - webpSize / originalSize) * 100);

      // Subir a Storage
      const storagePath = `lessons/${lesson.id}.webp`;
      const publicUrl = await uploadToStorage(tempWebPPath, 'lesson-images', storagePath);

      // Actualizar en la base de datos
      const { error: updateError } = await supabase
        .from('course_lessons')
        .update({ [fieldToUpdate]: publicUrl })
        .eq('id', lesson.id);

      if (updateError) {
        throw new Error(`Error actualizando BD: ${updateError.message}`);
      }

      // Limpiar archivo temporal
      fs.unlinkSync(tempWebPPath);

      console.log(`✅ Migrado (${reduction}% reducción): ${publicUrl}`);
      successCount++;

    } catch (error) {
      console.error(`❌ Error procesando lección ${lesson.id}:`, error.message);
      errorCount++;
    }
  }

  // Limpiar directorio temporal
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }

  console.log(`\n📊 Resumen lecciones:`);
  console.log(`   ✅ Exitosos: ${successCount}`);
  console.log(`   ❌ Errores: ${errorCount}`);
}

/**
 * Función principal
 */
async function main() {
  console.log('🚀 Iniciando migración de imágenes Base64 a WebP\n');
  console.log('⚠️  Este proceso puede tardar varios minutos...\n');

  try {
    // Verificar que los buckets existan
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketNames = buckets?.map(b => b.name) || [];

    if (!bucketNames.includes('course-images')) {
      console.log('📦 Creando bucket course-images...');
      const { error } = await supabase.storage.createBucket('course-images', {
        public: true,
        allowedMimeTypes: ['image/webp'],
        fileSizeLimit: 5242880 // 5MB
      });
      if (error) {
        console.error('❌ Error creando bucket:', error.message);
      } else {
        console.log('✅ Bucket course-images creado');
      }
    }

    if (!bucketNames.includes('lesson-images')) {
      console.log('📦 Creando bucket lesson-images...');
      const { error } = await supabase.storage.createBucket('lesson-images', {
        public: true,
        allowedMimeTypes: ['image/webp'],
        fileSizeLimit: 5242880 // 5MB
      });
      if (error) {
        console.error('❌ Error creando bucket:', error.message);
      } else {
        console.log('✅ Bucket lesson-images creado');
      }
    }

    // Migrar cursos
    await migrateCourses();

    // Migrar lecciones
    await migrateLessons();

    console.log('\n🎉 ¡Migración completada!');
    console.log('\n💡 Las imágenes ahora están en Supabase Storage en formato WebP');
    console.log('💡 La carga de la página debería ser mucho más rápida ahora');

  } catch (error) {
    console.error('\n❌ Error fatal:', error);
    process.exit(1);
  }
}

// Ejecutar
main();

