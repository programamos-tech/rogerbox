'use client';

import { supabase } from '@/lib/supabase';

interface DatabaseCourse {
  id: string;
  title: string;
  description: string;
  short_description: string;
  thumbnail: string;
  preview_image: string;
  price: number;
  original_price?: number;
  discount_percentage?: number;
  category_id: string;
  instructor: string;
  rating: number;
  students_count: number;
  lessons_count: number;
  duration: number;
  level: string;
  language: string;
  created_at: string;
  updated_at: string;
  is_published: boolean;
  is_featured: boolean;
  tags: string[];
  requirements: string[];
  learning_objectives: string[];
  intro_video_url?: string;
  certificate_included: boolean;
  lifetime_access: boolean;
  money_back_guarantee: boolean;
  support_included: boolean;
  mobile_optimized: boolean;
  downloadable_resources: boolean;
  community_access: boolean;
  instructor_rating: number;
  instructor_students: number;
  instructor_courses: number;
  instructor_reviews: number;
  instructor_biography: string;
  instructor_avatar: string;
  instructor_social_links: Record<string, string>;
  course_goals: string[];
  course_notes: string;
  course_progress_tracking: boolean;
  course_iva_included: boolean;
  course_iva_percentage: number;
  course_iva_amount: number;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  short_description: string;
  thumbnail: string;
  preview_image: string;
  price: number;
  original_price?: number;
  discount_percentage?: number;
  category_id: string;
  category_name: string;
  instructor: string;
  rating: number;
  students_count: number;
  lessons_count: number;
  duration: string;
  level: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  isNew: boolean;
  isPopular: boolean;
  view_count: number;
}

class CoursesService {
  private cache = new Map<string, { data: Course[]; timestamp: number }>();
  private readonly CACHE_DURATION = 30 * 60 * 1000; // 30 minutos
  private readonly CACHE_KEY = 'courses_optimized_v1';

  /**
   * Obtiene todos los cursos con una sola consulta optimizada
   */
  async getCourses(forceRefresh = false): Promise<Course[]> {
    // Verificar caché
    if (!forceRefresh && this.isCacheValid()) {
      console.log('📦 Usando caché de cursos');
      return this.cache.get(this.CACHE_KEY)!.data;
    }

    console.log('🔄 Cargando cursos desde base de datos...');
    const startTime = performance.now();

    try {
      // CONSULTA SIMPLIFICADA - Primero obtener cursos
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (coursesError) {
        console.error('❌ Error fetching courses:', coursesError);
        console.error('❌ Error details:', JSON.stringify(coursesError, null, 2));
        throw new Error(`Error fetching courses: ${coursesError.message || 'Unknown error'}`);
      }

      // Obtener categorías por separado
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('course_categories')
        .select('id, name')
        .eq('is_active', true);

      if (categoriesError) {
        console.warn('⚠️ Error fetching categories:', categoriesError);
      }

      // Crear mapa de categorías
      const categoryMap: { [key: string]: string } = {};
      if (categoriesData) {
        categoriesData.forEach(cat => {
          categoryMap[cat.id] = cat.name;
        });
      }

      // Obtener conteo de visitas para popularidad (consulta separada pero más eficiente)
      const viewCounts = await this.getViewCounts(coursesData?.map(c => c.id) || []);

      // Transformar datos
      const transformedCourses = this.transformCourses(coursesData || [], viewCounts, categoryMap);

      // Ordenar: Popular primero, luego por fecha
      const sortedCourses = this.sortCourses(transformedCourses);

      // Guardar en caché
      this.cache.set(this.CACHE_KEY, {
        data: sortedCourses,
        timestamp: Date.now()
      });

      const endTime = performance.now();
      console.log(`✅ Cursos cargados en ${(endTime - startTime).toFixed(2)}ms`);

      return sortedCourses;

    } catch (error) {
      console.error('❌ Error en getCourses:', error);
      console.error('❌ Error type:', typeof error);
      console.error('❌ Error message:', error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  /**
   * Obtiene conteos de visitas para determinar popularidad
   */
  private async getViewCounts(courseIds: string[]): Promise<Record<string, number>> {
    if (courseIds.length === 0) return {};

    const { data, error } = await supabase
      .from('course_views')
      .select('course_id')
      .in('course_id', courseIds)
      .gte('viewed_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    if (error) {
      console.warn('⚠️ Error fetching view counts:', error);
      return {};
    }

    // Contar visitas por curso
    const viewCounts: Record<string, number> = {};
    data?.forEach(view => {
      viewCounts[view.course_id] = (viewCounts[view.course_id] || 0) + 1;
    });

    return viewCounts;
  }

  /**
   * Transforma los datos de la base de datos al formato esperado
   */
  private transformCourses(courses: DatabaseCourse[], viewCounts: Record<string, number>, categoryMap: { [key: string]: string }): Course[] {
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

    return courses.map(course => {
      const viewCount = viewCounts[course.id] || 0;
      const isNew = new Date(course.created_at) > twoWeeksAgo;
      
      // El curso más popular es el que tiene más visitas
      const maxViews = Math.max(...Object.values(viewCounts));
      const isPopular = viewCount === maxViews && viewCount > 0;

      return {
        id: course.id,
        title: course.title,
        description: course.description,
        short_description: course.short_description,
        thumbnail: course.thumbnail || course.preview_image || '/images/course-placeholder.jpg',
        preview_image: course.preview_image || course.thumbnail || '/images/course-placeholder.jpg',
        price: course.price || 0,
        original_price: ((course.discount_percentage ?? 0) > 0) ? course.price : undefined,
        discount_percentage: course.discount_percentage || 0,
        category_id: course.category_id,
        category_name: categoryMap[course.category_id] || 'Sin categoría',
        instructor: 'RogerBox',
        rating: course.rating || 4.8,
        students_count: course.students_count || 0,
        lessons_count: course.lessons_count || 1,
        duration: typeof course.duration === 'number' ? `${course.duration} min` : (course.duration || '30 min'),
        level: course.level || 'Intermedio',
        is_published: course.is_published,
        created_at: course.created_at,
        updated_at: course.updated_at,
        isNew,
        isPopular,
        view_count: viewCount
      };
    });
  }

  /**
   * Ordena los cursos: Popular primero, luego por fecha
   */
  private sortCourses(courses: Course[]): Course[] {
    return courses.sort((a, b) => {
      // Si uno es popular y el otro no, el popular va primero
      if (a.isPopular && !b.isPopular) return -1;
      if (!a.isPopular && b.isPopular) return 1;
      
      // Si ambos son populares o ninguno, ordenar por fecha de creación (más reciente primero)
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }

  /**
   * Verifica si el caché es válido
   */
  private isCacheValid(): boolean {
    const cached = this.cache.get(this.CACHE_KEY);
    if (!cached) return false;
    
    return Date.now() - cached.timestamp < this.CACHE_DURATION;
  }

  /**
   * Limpia el caché
   */
  clearCache(): void {
    this.cache.clear();
    console.log('🗑️ Caché de cursos limpiado');
  }

  /**
   * Obtiene un curso específico por ID
   */
  async getCourseById(id: string): Promise<Course | null> {
    const courses = await this.getCourses();
    return courses.find(course => course.id === id) || null;
  }

  /**
   * Filtra cursos por categoría
   */
  async getCoursesByCategory(categoryId: string): Promise<Course[]> {
    const courses = await this.getCourses();
    return courses.filter(course => course.category_id === categoryId);
  }

  /**
   * Busca cursos por término
   */
  async searchCourses(query: string): Promise<Course[]> {
    const courses = await this.getCourses();
    const lowercaseQuery = query.toLowerCase();
    
    return courses.filter(course => 
      course.title.toLowerCase().includes(lowercaseQuery) ||
      course.short_description.toLowerCase().includes(lowercaseQuery) ||
      course.description.toLowerCase().includes(lowercaseQuery)
    );
  }
}

// Exportar instancia singleton
export const coursesService = new CoursesService();
export default coursesService;
