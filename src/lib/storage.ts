import { supabase } from '@/lib/supabase-browser';

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
async function convertToWebP(
  file: File,
  quality: number = 0.85,
): Promise<File> {
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
              { type: 'image/webp' },
            );
            resolve(webpFile);
          },
          'image/webp',
          quality,
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
 * @param bucket - Bucket de destino ('course-image' o 'lesson-images')
 * @param folder - Carpeta dentro del bucket (ej: 'courses', 'lessons')
 * @param filename - Nombre del archivo (opcional, se genera automáticamente si no se proporciona)
 * @param convertToWebP - Si debe convertir a WebP (default: true)
 * @param quality - Calidad de compresión WebP (0-1, default: 0.85)
 * @returns Promise<UploadResult>
 */
export async function uploadImage(
  file: File,
  bucket: 'course-image' | 'lesson-images',
  folder: string,
  filename?: string,
  shouldConvertToWebP: boolean = true,
  quality: number = 0.85,
): Promise<UploadResult> {
  try {
    let fileToUpload = file;

    // Convertir a WebP si está habilitado y el archivo no es ya WebP
    if (shouldConvertToWebP && !file.type.includes('webp')) {
      try {
        fileToUpload = await convertToWebP(file, quality);
      } catch (error) {
        // Continuar con el archivo original si falla la conversión
      }
    }

    // Generar nombre único si no se proporciona
    const fileExtension = fileToUpload.name.split('.').pop() || 'webp';
    const finalFilename =
      filename ||
      `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExtension}`;
    const filePath = `${folder}/${finalFilename}`;

    // Subir archivo usando el endpoint API (más seguro, usa supabaseAdmin en el servidor)
    const formData = new FormData();
    formData.append('file', fileToUpload);
    formData.append('bucket', bucket);
    formData.append('folder', folder);
    if (finalFilename) {
      formData.append('filename', finalFilename);
    }

    const response = await fetch('/api/storage/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ error: 'Error desconocido' }));
      return {
        success: false,
        error: errorData.error || 'Error al subir la imagen',
      };
    }

    const result = await response.json();

    if (!result.success || !result.url) {
      return {
        success: false,
        error: result.error || 'Error al subir la imagen',
      };
    }

    return {
      success: true,
      url: result.url,
      path: result.path,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
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
  bucket: 'course-image' | 'lesson-image' | 'lesson-images',
  path: string,
): Promise<boolean> {
  try {
    const { error } = await supabase.storage.from(bucket).remove([path]);

    if (error) {
      return false;
    }

    return true;
  } catch (error) {
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
    // Ejemplo: https://vzearvitzpwzscxhqfut.supabase.co/storage/v1/object/public/course-image/courses/123.jpg
    // Resultado: courses/123.jpg
    const match = url.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/);
    if (match && match[2]) {
      return match[2];
    }
    return null;
  } catch (error) {
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
    const match = url.match(/\/storage\/v1\/object\/public\/([^/]+)\//);
    return match ? match[1] : null;
  } catch (error) {
    return null;
  }
}
