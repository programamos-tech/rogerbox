'use client';

import { supabase } from '@/lib/supabase';

export interface FastCourse {
  id: string;
  title: string;
  description: string;
  short_description: string;
  thumbnail: string;
  preview_image: string;
  price: number;
  original_price?: number;
  discount_percentage?: number;
  category_name: string;
  rating: number;
  students_count: number;
  lessons_count: number;
  duration: string;
  level: string;
  isNew: boolean;
  isPopular: boolean;
  created_at: string;
}

class FastCoursesService {
  private cache: FastCourse[] | null = null;
  private cacheTimestamp: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutos
  private loading = false;

  /**
   * Extrae el thumbnail de YouTube de una URL
   */
  private getYouTubeThumbnail(url: string): string {
    try {
      const videoId = url.split('v=')[1]?.split('&')[0];
      if (videoId) {
        return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
      }
    } catch (error) {
      console.warn('Error al extraer video ID de YouTube:', error);
    }
    return '/images/course-placeholder.jpg';
  }

  /**
   * Obtiene cursos de forma ULTRA RÁPIDA
   */
  async getCourses(forceRefresh = false): Promise<FastCourse[]> {
    // Si hay caché válido y no se fuerza refresh, devolver inmediatamente
    if (!forceRefresh && this.cache && this.isCacheValid()) {
      console.log('⚡ FastCourses: Usando caché instantáneo');
      return this.cache;
    }

    // Si ya está cargando, esperar
    if (this.loading) {
      console.log('⏳ FastCourses: Ya está cargando, esperando...');
      return this.waitForCache();
    }

    console.log('🚀 FastCourses: Cargando desde DB...');
    this.loading = true;
    const startTime = performance.now();

    try {
      // CONSULTA ULTRA SIMPLE - Solo campos esenciales
      const { data, error } = await supabase
        .from('courses')
        .select(`
          id,
          title,
          description,
          short_description,
          price,
          discount_percentage,
          category,
          created_at,
          intro_video_url,
          rating,
          students_count,
          calories_burned
        `)
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(20); // Limitar para velocidad

      if (error) {
        console.error('❌ FastCourses: Error:', error);
        throw error;
      }

      // Obtener categorías de forma paralela
      const { data: categoriesData } = await supabase
        .from('course_categories')
        .select('id, name')
        .eq('is_active', true);

      // Crear mapa de categorías
      const categoryMap: { [key: string]: string } = {};
      if (categoriesData) {
        categoriesData.forEach(cat => {
          categoryMap[cat.id] = cat.name;
        });
      }

      // Transformación ULTRA RÁPIDA
      const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
      const courses = (data || []).map(course => {
        const isNew = new Date(course.created_at) > twoWeeksAgo;
        
        return {
          id: course.id,
          title: course.title,
          description: course.description || '',
          short_description: course.short_description || '',
          thumbnail: course.intro_video_url ? this.getYouTubeThumbnail(course.intro_video_url) : '/images/course-placeholder.jpg',
          preview_image: course.intro_video_url ? this.getYouTubeThumbnail(course.intro_video_url) : '/images/course-placeholder.jpg',
          price: course.price || 0,
          original_price: course.discount_percentage > 0 ? course.price : undefined,
          discount_percentage: course.discount_percentage || 0,
          category_name: categoryMap[course.category] || 'Sin categoría',
          rating: course.rating || 4.8,
          students_count: course.students_count || 0,
          lessons_count: 12, // Valor fijo ya que no existe en la BD
          duration: '30 min', // Valor por defecto
          level: 'Intermedio', // Valor por defecto
          isNew,
          isPopular: false, // Simplificado por velocidad
          created_at: course.created_at
        };
      });

      // Guardar en caché
      this.cache = courses;
      this.cacheTimestamp = Date.now();
      this.loading = false;

      const endTime = performance.now();
      console.log(`⚡ FastCourses: Cargados en ${(endTime - startTime).toFixed(2)}ms`);

      return courses;

    } catch (error) {
      console.error('❌ FastCourses: Error:', error);
      this.loading = false;
      
      // Devolver caché anterior si existe
      if (this.cache) {
        console.log('🔄 FastCourses: Usando caché anterior por error');
        return this.cache;
      }
      
      throw error;
    }
  }

  /**
   * Espera a que termine la carga actual
   */
  private async waitForCache(): Promise<FastCourse[]> {
    return new Promise((resolve) => {
      const checkCache = () => {
        if (!this.loading && this.cache) {
          resolve(this.cache);
        } else {
          setTimeout(checkCache, 50);
        }
      };
      checkCache();
    });
  }

  /**
   * Verifica si el caché es válido
   */
  private isCacheValid(): boolean {
    return Date.now() - this.cacheTimestamp < this.CACHE_DURATION;
  }

  /**
   * Limpia el caché
   */
  clearCache(): void {
    this.cache = null;
    this.cacheTimestamp = 0;
    console.log('🗑️ FastCourses: Caché limpiado');
  }

  /**
   * Obtiene un curso específico
   */
  async getCourseById(id: string): Promise<FastCourse | null> {
    const courses = await this.getCourses();
    return courses.find(course => course.id === id) || null;
  }
}

// Exportar instancia singleton
export const fastCoursesService = new FastCoursesService();
export default fastCoursesService;
