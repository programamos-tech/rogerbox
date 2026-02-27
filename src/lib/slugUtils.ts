/**
 * Utilidades para generar slugs SEO-friendly
 */

/**
 * Genera un slug a partir de un texto
 * @param text - Texto a convertir en slug
 * @returns Slug limpio y SEO-friendly
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    // Reemplazar caracteres especiales y acentos
    .replace(/[áàäâã]/g, 'a')
    .replace(/[éèëê]/g, 'e')
    .replace(/[íìïî]/g, 'i')
    .replace(/[óòöôõ]/g, 'o')
    .replace(/[úùüû]/g, 'u')
    .replace(/[ñ]/g, 'n')
    .replace(/[ç]/g, 'c')
    // Reemplazar espacios y caracteres especiales con guiones
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Genera un slug único para un curso
 * @param title - Título del curso
 * @param existingSlugs - Array de slugs existentes
 * @returns Slug único
 */
export function generateUniqueSlug(title: string, existingSlugs: string[] = []): string {
  let baseSlug = generateSlug(title);
  let slug = baseSlug;
  let counter = 1;

  // Si el slug está vacío, usar un slug por defecto
  if (!slug) {
    slug = 'curso-sin-titulo';
  }

  // Verificar que el slug sea único
  while (existingSlugs.includes(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}

/**
 * Valida si un slug es válido
 * @param slug - Slug a validar
 * @returns true si es válido, false si no
 */
export function isValidSlug(slug: string): boolean {
  // Un slug válido debe:
  // - No estar vacío
  // - Solo contener letras minúsculas, números y guiones
  // - No empezar o terminar con guión
  // - Tener entre 1 y 100 caracteres
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return slug.length > 0 && slug.length <= 100 && slugRegex.test(slug);
}

/**
 * Ejemplos de generación de slugs
 */
export const slugExamples = {
  'Transformación Total 90 Días 🔥': 'transformacion-total-90-dias',
  '🔥 HIIT Cardio Activate Your Metabolism (40 MIN)': 'hiit-cardio-activate-your-metabolism-40-min',
  'Rutina HIIT Vacaciones - 12 Minutos': 'rutina-hiit-vacaciones-12-minutos',
  'Curso de Yoga para Principiantes': 'curso-de-yoga-para-principiantes',
  'Pilates & Core Strength': 'pilates-core-strength'
};
