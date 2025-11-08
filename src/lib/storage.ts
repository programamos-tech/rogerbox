import { supabase } from './supabase';

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
  path?: string;
}

/**
 * Convierte una imagen a formato WebP
 * @param file - Archivo de imagen original
 * @param quality - Calidad de compresión (0-1, recomendado: 0.85)
 * @returns Promise<File> - Archivo WebP convertido
 */
async function convertToWebP(file: File, quality: number = 0.85): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('No se pudo obtener contexto del canvas'));
          return;
        }
        
        ctx.drawImage(img, 0, 0);
        
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Error al convertir imagen a WebP'));
              return;
            }
            
            const webpFile = new File(
              [blob],
              file.name.replace(/\.[^/.]+$/, '.webp'),
              { type: 'image/webp' }
            );
            resolve(webpFile);
          },
          'image/webp',
          quality
        );
      };
      img.onerror = () => reject(new Error('Error al cargar la imagen'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Error al leer el archivo'));
    reader.readAsDataURL(file);
  });
}

/**
 * Sube una imagen a Supabase Storage (convierte a WebP automáticamente)
 * @param file - Archivo de imagen
 * @param bucket - Bucket de destino ('course-images' o 'lesson-images')
 * @param folder - Carpeta dentro del bucket (ej: 'courses', 'lessons')
 * @param filename - Nombre del archivo (opcional, se genera automáticamente si no se proporciona)
 * @param convertToWebP - Si debe convertir a WebP (default: true)
 * @param quality - Calidad de compresión WebP (0-1, default: 0.85)
 * @returns Promise<UploadResult>
 */
export async function uploadImage(
  file: File,
  bucket: 'course-images' | 'lesson-images',
  folder: string,
  filename?: string,
  shouldConvertToWebP: boolean = true,
  quality: number = 0.85
): Promise<UploadResult> {
  try {
    let fileToUpload = file;
    
    // Convertir a WebP si está habilitado y el archivo no es ya WebP
    if (shouldConvertToWebP && !file.type.includes('webp')) {
      console.log('🔄 Convirtiendo imagen a WebP...');
      try {
        fileToUpload = await convertToWebP(file, quality);
        console.log(`✅ Imagen convertida a WebP: ${file.size} bytes → ${fileToUpload.size} bytes (${Math.round((1 - fileToUpload.size / file.size) * 100)}% reducción)`);
      } catch (error) {
        console.warn('⚠️ Error al convertir a WebP, subiendo imagen original:', error);
        // Continuar con el archivo original si falla la conversión
      }
    }
    
    // Generar nombre único si no se proporciona
    const fileExtension = fileToUpload.name.split('.').pop() || 'webp';
    const finalFilename = filename || `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExtension}`;
    const filePath = `${folder}/${finalFilename}`;

    console.log(`📤 Subiendo imagen a ${bucket}/${filePath} (${fileToUpload.size} bytes)`);

    // Subir archivo a Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, fileToUpload, {
        cacheControl: '31536000', // Cache por 1 año (WebP es estático)
        upsert: false // No sobrescribir archivos existentes
      });

    if (error) {
      console.error('❌ Error subiendo imagen:', error);
      return {
        success: false,
        error: error.message
      };
    }

    // Obtener URL pública
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    console.log('✅ Imagen subida exitosamente:', publicUrl);

    return {
      success: true,
      url: publicUrl,
      path: data.path
    };

  } catch (error) {
    console.error('❌ Error inesperado subiendo imagen:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}

/**
 * Elimina una imagen de Supabase Storage
 * @param bucket - Bucket donde está la imagen
 * @param path - Ruta de la imagen en el bucket
 * @returns Promise<boolean>
 */
export async function deleteImage(
  bucket: 'course-images' | 'lesson-images',
  path: string
): Promise<boolean> {
  try {
    console.log(`🗑️ Eliminando imagen de ${bucket}/${path}`);

    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) {
      console.error('❌ Error eliminando imagen:', error);
      return false;
    }

    console.log('✅ Imagen eliminada exitosamente');
    return true;

  } catch (error) {
    console.error('❌ Error inesperado eliminando imagen:', error);
    return false;
  }
}

/**
 * Convierte una URL de Supabase Storage a path para eliminación
 * @param url - URL pública de la imagen
 * @returns string | null - Path de la imagen o null si no es válida
 */
export function getImagePathFromUrl(url: string): string | null {
  try {
    // Extraer el path de la URL de Supabase Storage
    // Ejemplo: https://vzearvitzpwzscxhqfut.supabase.co/storage/v1/object/public/course-images/courses/123.jpg
    // Resultado: courses/123.jpg
    const match = url.match(/\/storage\/v1\/object\/public\/([^\/]+)\/(.+)$/);
    if (match && match[2]) {
      return match[2];
    }
    return null;
  } catch (error) {
    console.error('❌ Error extrayendo path de URL:', error);
    return null;
  }
}

/**
 * Verifica si una URL es de Supabase Storage
 * @param url - URL a verificar
 * @returns boolean
 */
export function isSupabaseStorageUrl(url: string): boolean {
  return url.includes('supabase.co/storage/v1/object/public/');
}

/**
 * Obtiene el bucket de una URL de Supabase Storage
 * @param url - URL de la imagen
 * @returns string | null - Nombre del bucket o null si no es válida
 */
export function getBucketFromUrl(url: string): string | null {
  try {
    const match = url.match(/\/storage\/v1\/object\/public\/([^\/]+)\//);
    return match ? match[1] : null;
  } catch (error) {
    return null;
  }
}

