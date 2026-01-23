'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  Upload, 
  X, 
  Plus, 
  Trash2, 
  Save, 
  Eye, 
  Clock, 
  Users, 
  Star, 
  Flame,
  Play,
  Image as ImageIcon,
  Video,
  Calendar,
  DollarSign,
  Tag,
  Target
} from 'lucide-react';
import { supabase } from '@/lib/supabase-browser';
import RogerAlert from '../RogerAlert';
import { uploadImage, deleteImage, isSupabaseStorageUrl, getImagePathFromUrl, getBucketFromUrl } from '@/lib/storage';

interface CourseData {
  title: string;
  slug: string;
  short_description: string;
  preview_image: string | null;
  price: number | null;
  discount_percentage: number | null;
  category: string;
  duration_days: number | null;
  calories_burned: number | null;
  mux_playback_id: string;
  level: string;
  is_published: boolean;
  // include_iva: boolean; // Temporalmente deshabilitado
  // iva_percentage: number | null; // Temporalmente deshabilitado
}

interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  is_active: boolean;
  sort_order: number;
}

interface LessonData {
  id?: string;
  title: string;
  description: string;
  preview_image: string | null;
  video_url: string;
  lesson_number: number;
  lesson_order: number;
  duration_minutes: number;
  is_preview: boolean;
}

interface CourseCreatorProps {
  onClose: () => void;
  onSuccess: () => void;
  courseToEdit?: any; // Curso existente para editar
}

// Categorías hardcoded - Las 6 categorías exactas del onboarding
const HARDCODED_CATEGORIES: Category[] = [
  {
    id: 'lose_weight',
    name: 'Bajar de peso',
    description: 'Rutinas enfocadas en pérdida de peso',
    icon: '🔥',
    color: '#85ea10',
    is_active: true,
    sort_order: 1
  },
  {
    id: 'gain_muscle',
    name: 'Ganar músculo',
    description: 'Entrenamientos para aumentar masa muscular',
    icon: '🏋️',
    color: '#85ea10',
    is_active: true,
    sort_order: 2
  },
  {
    id: 'flexibility',
    name: 'Flexibilidad',
    description: 'Ejercicios para mejorar la flexibilidad',
    icon: '🧘',
    color: '#85ea10',
    is_active: true,
    sort_order: 3
  },
  {
    id: 'tone',
    name: 'Tonificar',
    description: 'Rutinas para tonificar y definir',
    icon: '💪',
    color: '#85ea10',
    is_active: true,
    sort_order: 4
  },
  {
    id: 'endurance',
    name: 'Resistencia',
    description: 'Entrenamientos para mejorar la resistencia',
    icon: '🏃',
    color: '#85ea10',
    is_active: true,
    sort_order: 5
  },
  {
    id: 'strength',
    name: 'Fuerza',
    description: 'Ejercicios para desarrollar fuerza',
    icon: '⚡',
    color: '#85ea10',
    is_active: true,
    sort_order: 6
  }
];

// Key para localStorage
const STORAGE_KEY = 'rogerbox_course_draft';

export default function CourseCreator({ onClose, onSuccess, courseToEdit }: CourseCreatorProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [categories] = useState<Category[]>(HARDCODED_CATEGORIES);
  const [dragActive, setDragActive] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [formattedPrice, setFormattedPrice] = useState<string>('');
  const [formattedIvaPrice, setFormattedIvaPrice] = useState<string>('');
  const [expandedLessons, setExpandedLessons] = useState<Set<number>>(new Set());
  const [bulkAddCount, setBulkAddCount] = useState<number>(10);
  const [courseData, setCourseData] = useState<CourseData>({
    title: '',
    slug: '',
    short_description: '',
    preview_image: null,
    price: null,
    discount_percentage: null,
    category: '',
    duration_days: null,
    calories_burned: null,
    mux_playback_id: '',
    level: 'beginner',
    is_published: false,
    // include_iva: false, // Temporalmente deshabilitado
    // iva_percentage: 19 // Temporalmente deshabilitado
  });
  const [lessons, setLessons] = useState<LessonData[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lessonsContainerRef = useRef<HTMLDivElement>(null);

  // Guardar en localStorage cuando cambia el estado (solo si no es edición)
  useEffect(() => {
    if (!courseToEdit && (courseData.title || lessons.length > 0)) {
      const draft = { courseData, lessons, currentStep };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    }
  }, [courseData, lessons, currentStep, courseToEdit]);

  // Cargar del localStorage al iniciar (solo si no es edición)
  useEffect(() => {
    if (!courseToEdit) {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const draft = JSON.parse(saved);
          if (draft.courseData) setCourseData(draft.courseData);
          if (draft.lessons) setLessons(draft.lessons);
          if (draft.currentStep) setCurrentStep(draft.currentStep);
          if (draft.courseData?.price) setFormattedPrice(formatPrice(draft.courseData.price));
        } catch (e) {
          console.warn('Error cargando borrador:', e);
        }
      }
    }
  }, [courseToEdit]);

  // Limpiar localStorage al guardar exitosamente
  const clearDraft = () => {
    localStorage.removeItem(STORAGE_KEY);
  };

  // Inicializar categoría por defecto si no hay una seleccionada
  useEffect(() => {
    if (!courseData.category && categories.length > 0) {
      setCourseData(prev => ({ ...prev, category: categories[0].id }));
    }
  }, []);

  // Cargar datos del curso a editar
  useEffect(() => {
    if (courseToEdit) {
      console.log('🔍 CourseCreator - courseToEdit recibido:', courseToEdit);
      console.log('🔍 CourseCreator - lessons en courseToEdit:', courseToEdit.lessons);
      console.log('🔍 CourseCreator - price:', courseToEdit.price, 'type:', typeof courseToEdit.price);
      console.log('🔍 CourseCreator - duration_days:', courseToEdit.duration_days, 'type:', typeof courseToEdit.duration_days);
      console.log('🔍 CourseCreator - calories_burned:', courseToEdit.calories_burned, 'type:', typeof courseToEdit.calories_burned);
      console.log('🔍 CourseCreator - category:', courseToEdit.category, 'type:', typeof courseToEdit.category);
      
      if (courseToEdit.lessons && courseToEdit.lessons.length > 0) {
        console.log('🔍 CourseCreator - Primera lección:', courseToEdit.lessons[0]);
        console.log('🔍 CourseCreator - duration_minutes primera lección:', courseToEdit.lessons[0]?.duration_minutes);
      }
      
      // Mantener el ID de la categoría para la comparación
      let categoryValue = courseToEdit.category || '';
      console.log('🔍 CourseCreator - categoryValue original:', categoryValue);

      const newCourseData = {
        title: courseToEdit.title || '',
        slug: courseToEdit.slug || '',
        short_description: courseToEdit.short_description || '',
        preview_image: courseToEdit.preview_image || null,
        price: courseToEdit.price !== undefined ? courseToEdit.price : null,
        discount_percentage: courseToEdit.discount_percentage !== undefined ? courseToEdit.discount_percentage : null,
        category: categoryValue,
        duration_days: courseToEdit.duration_days !== undefined ? courseToEdit.duration_days : null,
        calories_burned: courseToEdit.calories_burned !== undefined ? courseToEdit.calories_burned : null,
        mux_playback_id: courseToEdit.mux_playback_id || '',
        level: courseToEdit.level || 'beginner',
        is_published: courseToEdit.is_published !== undefined ? courseToEdit.is_published : false,
        // include_iva: courseToEdit.include_iva !== undefined ? courseToEdit.include_iva : false, // Temporalmente deshabilitado
        // iva_percentage: courseToEdit.iva_percentage !== undefined ? courseToEdit.iva_percentage : 19 // Temporalmente deshabilitado
      };
      
      console.log('🔍 CourseCreator - newCourseData establecido:', newCourseData);
      console.log('🔍 CourseCreator - category en newCourseData:', newCourseData.category);
      console.log('🔍 CourseCreator - mux_playback_id en newCourseData:', newCourseData.mux_playback_id);
      console.log('🔍 CourseCreator - courseToEdit.mux_playback_id:', courseToEdit.mux_playback_id);
      
      setCourseData(newCourseData);
      
      // Formatear precio para mostrar
      setFormattedPrice(formatPrice(newCourseData.price));
      
      // Cargar lecciones del curso
      if (courseToEdit.lessons) {
        console.log('✅ CourseCreator - Cargando lecciones:', courseToEdit.lessons);
        setLessons(courseToEdit.lessons);
      } else {
        console.log('❌ CourseCreator - No hay lecciones en courseToEdit');
      }
    }
  }, [courseToEdit, categories]);


  const handleImageUpload = async (file: File, type: 'course' | 'lesson', lessonIndex?: number) => {
    try {
      console.log(`📤 Procesando imagen ${type}:`, file.name);
      
      // Determinar el bucket y folder según el tipo
      const bucket = type === 'course' ? 'course-images' : 'lesson-images';
      const folder = type === 'course' ? 'courses' : 'lessons';
      
      // Generar nombre único para el archivo
      const fileExtension = file.name.split('.').pop() || 'jpg';
      const filename = type === 'course' 
        ? `course-${Date.now()}.${fileExtension}`
        : `lesson-${Date.now()}-${lessonIndex}.${fileExtension}`;
      
      // Subir imagen a Supabase Storage
      console.log(`📤 Subiendo imagen a ${bucket}/${folder}/${filename}...`);
      const uploadResult = await uploadImage(file, bucket, folder, filename);
      
      if (!uploadResult.success || !uploadResult.url) {
        throw new Error(uploadResult.error || 'Error desconocido al subir la imagen');
      }
      
      console.log('✅ Imagen subida exitosamente a Storage:', uploadResult.url);
      
      // Actualizar el estado con la URL de Storage
      if (type === 'course') {
        setCourseData(prev => ({ ...prev, preview_image: uploadResult.url! }));
      } else if (type === 'lesson' && lessonIndex !== undefined) {
        const updatedLessons = [...lessons];
        updatedLessons[lessonIndex].preview_image = uploadResult.url!;
        setLessons(updatedLessons);
      }
      
    } catch (error) {
      console.error('❌ Error procesando imagen:', error);
      setValidationErrors([`Error al procesar la imagen: ${error instanceof Error ? error.message : 'Error desconocido'}`]);
    }
  };

  // Función para eliminar imagen de Storage
  const handleImageDelete = async (imageUrl: string, type: 'course' | 'lesson') => {
    try {
      // Si es una URL de Supabase Storage, eliminarla
      if (isSupabaseStorageUrl(imageUrl)) {
        const bucket = getBucketFromUrl(imageUrl);
        const path = getImagePathFromUrl(imageUrl);
        
        if (bucket && path) {
          console.log(`🗑️ Eliminando imagen de Storage: ${bucket}/${path}`);
          const deleted = await deleteImage(bucket as 'course-images' | 'lesson-images', path);
          
          if (deleted) {
            console.log('✅ Imagen eliminada de Storage');
          } else {
            console.warn('⚠️ No se pudo eliminar la imagen de Storage');
          }
        }
      } else if (imageUrl.startsWith('data:image')) {
        // Si es base64, no hay nada que eliminar en Storage
        console.log('ℹ️ Imagen es base64, no se elimina de Storage');
      }
      
      // Eliminar del estado local
      if (type === 'course') {
        setCourseData(prev => ({ ...prev, preview_image: null }));
      } else if (type === 'lesson') {
        // Necesitamos el índice de la lección, pero esta función no lo tiene
        // Por ahora, solo logueamos
        console.log('ℹ️ Para eliminar imagen de lección, usar la función específica de la lección');
      }
    } catch (error) {
      console.error('❌ Error eliminando imagen:', error);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent, type: 'course' | 'lesson', lessonIndex?: number) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageUpload(e.dataTransfer.files[0], type, lessonIndex);
    }
  };

  const addLesson = () => {
    // Agregar al inicio y reordenar
    const newLesson: LessonData = {
      title: `Día ${lessons.length + 1}`,
      description: '',
      preview_image: null,
      video_url: '',
      lesson_number: 1,
      lesson_order: 1,
      duration_minutes: 30,
      is_preview: false
    };
    // Actualizar los números de las lecciones existentes
    const updatedLessons = lessons.map((l, i) => ({
      ...l,
      lesson_number: i + 2,
      lesson_order: i + 2
    }));
    setLessons([newLesson, ...updatedLessons]);
  };

  const removeLesson = (index: number) => {
    const updatedLessons = lessons.filter((_, i) => i !== index);
    // Reordenar las lecciones
    updatedLessons.forEach((lesson, i) => {
      lesson.lesson_number = i + 1;
      lesson.lesson_order = i + 1;
    });
    setLessons(updatedLessons);
  };

  const updateLesson = (index: number, field: keyof LessonData, value: any) => {
    const updatedLessons = [...lessons];
    updatedLessons[index] = { ...updatedLessons[index], [field]: value };
    setLessons(updatedLessons);
    // Limpiar errores cuando el usuario modifica algo
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
  };

  // Función para limpiar errores cuando el usuario modifica el curso
  const clearValidationErrors = () => {
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
  };

  // Función para formatear precio con puntos
  const formatPrice = (price: number | null) => {
    if (!price) return '';
    return price.toLocaleString('es-CO');
  };

  // Función para parsear precio desde string con puntos
  const parsePrice = (priceString: string) => {
    // Remover puntos y convertir a número
    const cleanPrice = priceString.replace(/\./g, '');
    return parseFloat(cleanPrice) || 0;
  };

  // Funciones de IVA temporalmente deshabilitadas
  // const calculatePriceWithIva = (basePrice: number, ivaPercentage: number) => {
  //   return Math.round(basePrice * (1 + ivaPercentage / 100));
  // };

  // const formatIvaPrice = (basePrice: number | null, ivaPercentage: number | null) => {
  //   if (!basePrice || !ivaPercentage) return '';
  //   const priceWithIva = calculatePriceWithIva(basePrice, ivaPercentage);
  //   return priceWithIva.toLocaleString('es-CO');
  // };

  // Función para validar si el formulario está completo
  const isFormValid = () => {
    const titleValid = courseData.title.trim() && courseData.title.length <= 100;
    const slugValid = courseData.slug.trim() && courseData.slug.length <= 100;
    const shortDescriptionValid = courseData.short_description.trim() && courseData.short_description.length <= 200;
    const priceValid = courseData.price && courseData.price > 0;
    const categoryValid = courseData.category;
    const durationValid = courseData.duration_days && courseData.duration_days > 0;
    const levelValid = courseData.level;
    const lessonsValid = lessons.length > 0;
    const lessonsContentValid = lessons.every(lesson => 
      lesson.title.trim() &&
      lesson.title.length <= 100 &&
      lesson.description.trim() &&
      lesson.description.length <= 300 &&
      lesson.video_url.trim() &&
      lesson.duration_minutes && lesson.duration_minutes > 0
    );
    
    const isValid = titleValid && slugValid && shortDescriptionValid && 
                   priceValid && categoryValid && durationValid && levelValid && 
                   lessonsValid && lessonsContentValid;
    
    console.log('🔍 isFormValid - Validando formulario:');
    console.log('  - titleValid:', titleValid, '(', courseData.title.trim(), ')');
    console.log('  - slugValid:', slugValid, '(', courseData.slug.trim(), ')');
    console.log('  - shortDescriptionValid:', shortDescriptionValid, '(', courseData.short_description.trim(), ')');
    console.log('  - priceValid:', priceValid, '(', courseData.price, ')');
    console.log('  - categoryValid:', categoryValid, '(', courseData.category, ')');
    console.log('  - durationValid:', durationValid, '(', courseData.duration_days, ')');
    console.log('  - levelValid:', levelValid, '(', courseData.level, ')');
    console.log('  - lessonsValid:', lessonsValid, '(', lessons.length, ')');
    console.log('  - lessonsContentValid:', lessonsContentValid);
    console.log('  - lessons:', lessons);
    console.log('  - isValid:', isValid);
    
    return isValid;
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setValidationErrors([]); // Limpiar errores anteriores

      const errors: string[] = [];

      // Validaciones obligatorias
      if (!courseData.title.trim()) {
        errors.push('El nombre del curso es obligatorio');
      }
      
      if (courseData.title.length > 100) {
        errors.push('El nombre del curso no puede exceder 100 caracteres');
      }
      
      if (!courseData.slug.trim()) {
        errors.push('El slug del curso es obligatorio');
      }
      
      if (courseData.slug.length > 100) {
        errors.push('El slug del curso no puede exceder 100 caracteres');
      }
      
      if (!courseData.short_description.trim()) {
        errors.push('La descripción corta es obligatoria');
      }
      
      if (courseData.short_description.length > 200) {
        errors.push('La descripción corta no puede exceder 200 caracteres');
      }
      
      if (!courseData.price || courseData.price <= 0) {
        errors.push('El precio debe ser mayor a 0');
      }
      
      if (!courseData.category) {
        errors.push('Debes seleccionar una categoría');
      }
      
      if (!courseData.duration_days || courseData.duration_days <= 0) {
        errors.push('La duración debe ser mayor a 0 días');
      }
      
      if (!courseData.level) {
        errors.push('Debes seleccionar un nivel');
      }
      
      if (lessons.length === 0) {
        errors.push('Debes agregar al menos una lección');
      }

      // Validar que todas las lecciones tengan datos obligatorios
      for (let i = 0; i < lessons.length; i++) {
        const lesson = lessons[i];
        if (!lesson.title.trim()) {
          errors.push(`La lección ${i + 1} debe tener un título`);
        }
        if (lesson.title.length > 100) {
          errors.push(`El título de la lección ${i + 1} no puede exceder 100 caracteres`);
        }
        if (!lesson.description.trim()) {
          errors.push(`La lección ${i + 1} debe tener una descripción`);
        }
        if (lesson.description.length > 300) {
          errors.push(`La descripción de la lección ${i + 1} no puede exceder 300 caracteres`);
        }
        if (!lesson.video_url.trim()) {
          errors.push(`La lección ${i + 1} debe tener una URL de video`);
        }
        if (!lesson.duration_minutes || lesson.duration_minutes <= 0) {
          errors.push(`La lección ${i + 1} debe tener una duración válida`);
        }
      }

      // Si hay errores, mostrarlos y salir
      if (errors.length > 0) {
        setValidationErrors(errors);
        setLoading(false);
        // Hacer scroll hacia las alertas
        setTimeout(() => {
          const alertElement = document.querySelector('[data-validation-alerts]');
          if (alertElement) {
            alertElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);
        return;
      }

      // Preparar datos del curso - SIN IVA temporalmente hasta resolver caché
      const courseDataToSubmit = {
        title: courseData.title,
        slug: courseData.slug,
        short_description: courseData.short_description || '',
        preview_image: courseData.preview_image || null,
        price: courseData.price || 0,
        discount_percentage: courseData.discount_percentage || 0,
        category: courseData.category || null,
        duration_days: courseData.duration_days || 30,
        calories_burned: courseData.calories_burned || 0,
        mux_playback_id: courseData.mux_playback_id || '',
        level: courseData.level || 'beginner',
        is_published: courseData.is_published || false
        // Temporalmente sin IVA hasta resolver problema de caché de Supabase
      };

      console.log('Creando curso con datos:', courseDataToSubmit);
      console.log('Lecciones:', lessons);
      console.log('🔍 mux_playback_id en courseDataToSubmit:', courseDataToSubmit.mux_playback_id);

      // Crear o actualizar el curso
      let course;
      let courseError;
      
      if (courseToEdit) {
        // Esperar más tiempo para que el esquema se actualice
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Actualizar curso existente
        const { data, error } = await supabase
          .from('courses')
          .update(courseDataToSubmit)
          .eq('id', courseToEdit.id)
          .select()
          .single();
        course = data;
        courseError = error;
      } else {
        // Esperar más tiempo para que el esquema se actualice
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Crear nuevo curso
        const { data, error } = await supabase
          .from('courses')
          .insert([courseDataToSubmit])
          .select()
          .single();
        course = data;
        courseError = error;
      }

      if (courseError) {
        console.error('Error completo de Supabase:', courseError);
        console.error('Mensaje de error:', courseError.message);
        console.error('Código de error:', courseError.code);
        console.error('Detalles de error:', courseError.details);
        
        // Manejo específico para errores de esquema (temporalmente deshabilitado)
        // if (courseError.message.includes('schema cache') || courseError.message.includes('include_iva')) {
        //   throw new Error('Error de esquema de base de datos. Las columnas de IVA no están disponibles. Por favor, contacta al administrador.');
        // }
        
        throw new Error(`Error al ${courseToEdit ? 'actualizar' : 'crear'} el curso: ${courseError.message}`);
      }

      console.log(`Curso ${courseToEdit ? 'actualizado' : 'creado'} exitosamente:`, course);

      // Manejar lecciones
      if (lessons.length > 0) {
        if (courseToEdit) {
          // Actualizar lecciones existentes
          console.log('Actualizando lecciones existentes...');
          
          // PASO 1: Primero, resetear todos los lesson_number a valores temporales negativos
          // para evitar conflictos con la restricción única
          const { data: existingLessons } = await supabase
            .from('course_lessons')
            .select('id')
            .eq('course_id', course.id);
          
          if (existingLessons && existingLessons.length > 0) {
            for (let i = 0; i < existingLessons.length; i++) {
              await supabase
                .from('course_lessons')
                .update({ lesson_number: -(i + 1) }) // Valores temporales negativos
                .eq('id', existingLessons[i].id);
            }
          }
          
          // PASO 2: Ahora actualizar/crear lecciones con los números correctos
          for (let i = 0; i < lessons.length; i++) {
            const lesson = lessons[i];
            const lessonData = {
              title: lesson.title,
              description: lesson.description,
              video_url: lesson.video_url,
              preview_image: lesson.preview_image,
              lesson_number: i + 1,
              lesson_order: i + 1,
              duration_minutes: lesson.duration_minutes,
              is_preview: lesson.is_preview
            };

            if (lesson.id) {
              // Actualizar lección existente
              const { error: updateError } = await supabase
                .from('course_lessons')
                .update(lessonData)
                .eq('id', lesson.id);

              if (updateError) {
                console.error(`Error actualizando lección ${i + 1}:`, updateError);
                throw new Error(`Error al actualizar la lección ${i + 1}: ${updateError.message}`);
              }
            } else {
              // Crear nueva lección si no tiene ID
              const { error: insertError } = await supabase
                .from('course_lessons')
                .insert([{
                  ...lessonData,
                  course_id: course.id
                }]);

              if (insertError) {
                console.error(`Error creando lección ${i + 1}:`, insertError);
                throw new Error(`Error al crear la lección ${i + 1}: ${insertError.message}`);
              }
            }
          }
          
          // PASO 3: Eliminar lecciones que ya no están en la lista
          const currentLessonIds = lessons.filter(l => l.id).map(l => l.id);
          if (existingLessons && existingLessons.length > 0) {
            const lessonsToDelete = existingLessons.filter(el => !currentLessonIds.includes(el.id));
            if (lessonsToDelete.length > 0) {
              const { error: deleteError } = await supabase
                .from('course_lessons')
                .delete()
                .in('id', lessonsToDelete.map(l => l.id));
              
              if (deleteError) {
                console.error('Error eliminando lecciones obsoletas:', deleteError);
                // No lanzar error aquí, solo loguear
              }
            }
          }
          
          console.log('Lecciones actualizadas exitosamente');
        } else {
          // Crear nuevas lecciones para curso nuevo
          const lessonsWithCourseId = lessons.map((lesson, index) => ({
            ...lesson,
            course_id: course.id,
            lesson_number: index + 1,
            lesson_order: index + 1
          }));

          console.log('Creando lecciones:', lessonsWithCourseId);

          const { error: lessonsError } = await supabase
            .from('course_lessons')
            .insert(lessonsWithCourseId);

          if (lessonsError) {
            console.error('Error creando lecciones:', lessonsError);
            throw new Error(`Error al crear las lecciones: ${lessonsError.message}`);
          }

          console.log('Lecciones creadas exitosamente');
        }
      }

      setShowSuccessModal(true);
      clearDraft(); // Limpiar borrador al guardar exitosamente
      onSuccess();
    } catch (error: any) {
      console.error('Error creating course:', error);
      setValidationErrors([`Error al ${courseToEdit ? 'actualizar' : 'crear'} el curso: ${error.message || 'Error desconocido'}`]);
      // Hacer scroll hacia las alertas
      setTimeout(() => {
        const alertElement = document.querySelector('[data-validation-alerts]');
        if (alertElement) {
          alertElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { number: 1, title: 'Información Básica', icon: Target },
    { number: 2, title: 'Detalles del Curso', icon: DollarSign },
    { number: 3, title: 'Lecciones', icon: Play },
    { number: 4, title: 'Revisar y Crear', icon: Eye }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {courseToEdit ? 'Editar Curso' : 'Crear Nuevo Curso'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.number;
              const isCompleted = currentStep > step.number;
              
              return (
                <div key={step.number} className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    isActive || isCompleted
                      ? 'bg-[#85ea10] border-[#85ea10] text-black'
                      : 'border-gray-300 text-gray-400'
                  }`}>
                    {isCompleted ? (
                      <X className="w-5 h-5" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </div>
                  <div className="ml-3">
                    <p className={`text-sm font-medium ${
                      isActive ? 'text-[#85ea10]' : 'text-gray-500'
                    }`}>
                      {step.title}
                    </p>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-16 h-0.5 mx-4 ${
                      isCompleted ? 'bg-[#85ea10]' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Alertas de validación */}
          {validationErrors.length > 0 && (
            <div data-validation-alerts className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                    Por favor corrige los siguientes errores:
                  </h3>
                  <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                    <ul className="list-disc list-inside space-y-1">
                      {validationErrors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Información Básica
              </h3>
              
              {/* Título del curso */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nombre del Curso * ({courseData.title.length}/100)
                </label>
                <input
                  type="text"
                  value={courseData.title}
                  onChange={(e) => {
                    setCourseData(prev => ({ ...prev, title: e.target.value }));
                    clearValidationErrors();
                  }}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#85ea10] focus:border-[#85ea10] bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                    courseData.title.length > 100 
                      ? 'border-red-500 dark:border-red-500' 
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Ej: Transformación Total 90 Días (máx. 100 caracteres)"
                  maxLength={100}
                />
                {courseData.title.length > 100 && (
                  <p className="text-red-500 text-sm mt-1">El nombre del curso no puede exceder 100 caracteres</p>
                )}
              </div>

              {/* Descripción corta */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Descripción Corta * ({courseData.short_description.length}/200)
                </label>
                <input
                  type="text"
                  value={courseData.short_description}
                  onChange={(e) => setCourseData(prev => ({ ...prev, short_description: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#85ea10] focus:border-[#85ea10] bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                    courseData.short_description.length > 200 
                      ? 'border-red-500 dark:border-red-500' 
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Una descripción breve del curso (máx. 200 caracteres)"
                  maxLength={200}
                />
                {courseData.short_description.length > 200 && (
                  <p className="text-red-500 text-sm mt-1">La descripción corta no puede exceder 200 caracteres</p>
                )}
              </div>

              {/* Slug del curso */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Slug del Curso * ({courseData.slug.length}/100)
                </label>
                <input
                  type="text"
                  value={courseData.slug}
                  onChange={(e) => {
                    const slug = e.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9\s-]/g, '') // Solo letras, números, espacios y guiones
                      .replace(/\s+/g, '-') // Reemplazar espacios con guiones
                      .replace(/-+/g, '-') // Reemplazar múltiples guiones con uno solo
                      .trim();
                    setCourseData(prev => ({ ...prev, slug }));
                  }}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#85ea10] focus:border-[#85ea10] bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                    courseData.slug.length > 100 
                      ? 'border-red-500 dark:border-red-500' 
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="curso-hiit-intenso-cardio"
                  maxLength={100}
                />
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  URL amigable para el curso (ej: curso-hiit-intenso-cardio)
                </p>
                {courseData.slug.length > 100 && (
                  <p className="text-red-500 text-sm mt-1">El slug no puede exceder 100 caracteres</p>
                )}
              </div>

              {/* Categoría */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Categoría *
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {categories.map(category => (
                    <button
                      key={category.id}
                      onClick={() => setCourseData(prev => ({ ...prev, category: category.id }))}
                      className={`flex items-center space-x-2 p-3 rounded-lg border-2 transition-all ${
                        courseData.category === category.id
                          ? 'border-[#85ea10] bg-[#85ea10]/10 text-[#85ea10]'
                          : 'border-gray-300 dark:border-gray-600 hover:border-[#85ea10]/50'
                      }`}
                      style={{
                        borderColor: courseData.category === category.id ? category.color : undefined,
                        backgroundColor: courseData.category === category.id ? category.color + '20' : undefined
                      }}
                    >
                      <span className="text-lg">{category.icon}</span>
                      <span className="text-sm font-medium">{category.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Detalles del Curso
              </h3>
              
              {/* Precio y descuento */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Precio (COP) *
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={formattedPrice}
                      onChange={(e) => {
                        const parsedPrice = parsePrice(e.target.value);
                        setCourseData(prev => ({ ...prev, price: parsedPrice }));
                        setFormattedPrice(e.target.value);
                        clearValidationErrors();
                      }}
                      onBlur={(e) => {
                        const parsedPrice = parsePrice(e.target.value);
                        setFormattedPrice(formatPrice(parsedPrice));
                      }}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#85ea10] focus:border-[#85ea10] bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      placeholder="50.000"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Descuento (%)
                  </label>
                  <input
                    type="number"
                    value={courseData.discount_percentage || ''}
                    onChange={(e) => {
                      const discountValue = parseInt(e.target.value) || 0;
                      setCourseData(prev => ({ ...prev, discount_percentage: discountValue }));
                      clearValidationErrors();
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#85ea10] focus:border-[#85ea10] bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    placeholder="0"
                    min="0"
                    max="100"
                  />
                </div>
              </div>

              {/* IVA - Temporalmente deshabilitado */}
              <div className="space-y-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-700">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
                    <span className="text-xs text-yellow-800 font-bold">!</span>
                  </div>
                  <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    Funcionalidad de IVA temporalmente deshabilitada
                  </h4>
                </div>
                <p className="text-xs text-yellow-700 dark:text-yellow-300">
                  La configuración de IVA estará disponible próximamente. Por ahora, los precios se manejan sin IVA.
                </p>
              </div>

              {/* Duración y calorías */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Duración (días) *
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      value={courseData.duration_days || ''}
                      onChange={(e) => setCourseData(prev => ({ ...prev, duration_days: parseInt(e.target.value) || null }))}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#85ea10] focus:border-[#85ea10] bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      placeholder="30"
                      min="1"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Calorías Quemadas
                  </label>
                  <div className="relative">
                    <Flame className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      value={courseData.calories_burned || ''}
                      onChange={(e) => setCourseData(prev => ({ ...prev, calories_burned: parseInt(e.target.value) || null }))}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#85ea10] focus:border-[#85ea10] bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      placeholder="500"
                      min="0"
                    />
                  </div>
                </div>

              </div>

              {/* Nivel del curso */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nivel del Curso *
                </label>
                <div className="relative">
                  <Target className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <select
                    value={courseData.level}
                    onChange={(e) => setCourseData(prev => ({ ...prev, level: e.target.value }))}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#85ea10] focus:border-[#85ea10] bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="beginner">Principiante</option>
                    <option value="intermediate">Intermedio</option>
                    <option value="advanced">Avanzado</option>
                    <option value="expert">Experto</option>
                  </select>
                </div>
              </div>

              {/* Mux Playback ID del video introductorio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Mux Playback ID del Video Introductorio
                </label>
                <div className="relative">
                  <Video className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={courseData.mux_playback_id}
                    onChange={(e) => setCourseData(prev => ({ ...prev, mux_playback_id: e.target.value }))}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#85ea10] focus:border-[#85ea10] bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    placeholder="8wRPxlLcp01JrCKhEsyq00BPSrah1qkRY01aOvr01p4suEU"
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Ingresa el Playback ID de Mux (no la URL completa)
                </p>
              </div>

              {/* Preview Image */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Imagen de Preview
                </label>
                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer hover:border-[#85ea10] ${
                    dragActive
                      ? 'border-[#85ea10] bg-[#85ea10]/10'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDrag}
                  onDrop={(e) => handleDrop(e, 'course')}
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) {
                        handleImageUpload(file, 'course');
                      }
                    };
                    input.click();
                  }}
                >
                  {courseData.preview_image ? (
                    <div className="relative">
                      <img
                        src={courseData.preview_image}
                        alt="Preview"
                        className="w-full max-h-80 rounded-lg object-contain"
                      />
                      <button
                        onClick={async () => {
                          if (courseData.preview_image) {
                            await handleImageDelete(courseData.preview_image, 'course');
                          }
                          setCourseData(prev => ({ ...prev, preview_image: null }));
                        }}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 dark:text-gray-400 mb-2">
                        Arrastra una imagen aquí o haz clic para seleccionar
                      </p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = 'image/*';
                          input.onchange = (e) => {
                            const file = (e.target as HTMLInputElement).files?.[0];
                            if (file) {
                              handleImageUpload(file, 'course');
                            }
                          };
                          input.click();
                        }}
                        className="bg-[#85ea10] hover:bg-[#7dd30f] text-black px-4 py-2 rounded-lg transition-colors"
                      >
                        Seleccionar Imagen
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            handleImageUpload(e.target.files[0], 'course');
                          }
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              {/* Header con controles */}
              <div className="flex flex-wrap items-center justify-between gap-4 sticky top-0 bg-white dark:bg-gray-900 py-2 z-10">
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Lecciones ({lessons.length})
                  </h3>
                  {lessons.length > 0 && (
                    <button
                      onClick={() => {
                        if (expandedLessons.size === lessons.length) {
                          setExpandedLessons(new Set());
                        } else {
                          setExpandedLessons(new Set(lessons.map((_, i) => i)));
                        }
                      }}
                      className="text-sm text-[#85ea10] hover:underline"
                    >
                      {expandedLessons.size === lessons.length ? 'Colapsar todo' : 'Expandir todo'}
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {/* Agregar una lección */}
                  <button
                    onClick={() => {
                      addLesson();
                      // Expandir la nueva lección y scroll
                      setTimeout(() => {
                        setExpandedLessons(prev => new Set([...prev, lessons.length]));
                        lessonsContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
                      }, 100);
                    }}
                    className="bg-[#85ea10] hover:bg-[#7dd30f] text-black px-3 py-2 rounded-lg transition-colors flex items-center gap-1 text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+1</span>
                  </button>
                  {/* Agregar en bloque */}
                  <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                    <input
                      type="number"
                      value={bulkAddCount}
                      onChange={(e) => setBulkAddCount(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
                      className="w-12 px-2 py-1 text-center text-sm border-0 bg-transparent text-gray-900 dark:text-white focus:ring-0"
                      min="1"
                      max="100"
                    />
                    <button
                      onClick={() => {
                        const newLessons: LessonData[] = [];
                        for (let i = 0; i < bulkAddCount; i++) {
                          newLessons.push({
                            title: `Día ${lessons.length + i + 1}`,
                            description: '',
                            preview_image: null,
                            video_url: '',
                            lesson_number: lessons.length + i + 1,
                            lesson_order: lessons.length + i + 1,
                            duration_minutes: 30,
                            is_preview: false
                          });
                        }
                        setLessons([...newLessons, ...lessons]); // Agregar al inicio
                        setExpandedLessons(new Set([0])); // Expandir la primera
                      }}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm transition-colors"
                    >
                      Agregar {bulkAddCount}
                    </button>
                  </div>
                </div>
              </div>

              {lessons.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <Play className="w-20 h-20 mx-auto mb-6 text-[#85ea10]" />
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mb-2">¿Cuántas clases tendrá tu curso?</p>
                  <p className="text-sm mb-8 text-gray-500">Ingresa el número de lecciones y las crearemos por ti</p>
                  
                  <div className="flex items-center justify-center gap-4 mb-6">
                    <input
                      type="number"
                      value={bulkAddCount}
                      onChange={(e) => setBulkAddCount(Math.max(1, Math.min(365, parseInt(e.target.value) || 1)))}
                      className="w-24 px-4 py-3 text-center text-2xl font-bold border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#85ea10] focus:border-[#85ea10]"
                      min="1"
                      max="365"
                      placeholder="30"
                    />
                    <span className="text-lg text-gray-600 dark:text-gray-400">lecciones</span>
                  </div>

                  <button
                    onClick={() => {
                      const newLessons: LessonData[] = [];
                      for (let i = 0; i < bulkAddCount; i++) {
                        newLessons.push({
                          title: `Día ${i + 1}`,
                          description: '',
                          preview_image: null,
                          video_url: '',
                          lesson_number: i + 1,
                          lesson_order: i + 1,
                          duration_minutes: 30,
                          is_preview: i === 0 // Primera lección como preview
                        });
                      }
                      setLessons(newLessons);
                      setExpandedLessons(new Set([0])); // Expandir la primera
                    }}
                    className="bg-[#85ea10] hover:bg-[#7dd30f] text-black px-8 py-4 rounded-xl transition-colors text-lg font-bold"
                  >
                    Crear {bulkAddCount} {bulkAddCount === 1 ? 'lección' : 'lecciones'}
                  </button>

                  <div className="mt-8 flex justify-center gap-3">
                    <button
                      onClick={() => setBulkAddCount(7)}
                      className={`px-4 py-2 rounded-lg text-sm transition-colors ${bulkAddCount === 7 ? 'bg-[#85ea10] text-black' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
                    >
                      1 semana
                    </button>
                    <button
                      onClick={() => setBulkAddCount(30)}
                      className={`px-4 py-2 rounded-lg text-sm transition-colors ${bulkAddCount === 30 ? 'bg-[#85ea10] text-black' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
                    >
                      1 mes
                    </button>
                    <button
                      onClick={() => setBulkAddCount(60)}
                      className={`px-4 py-2 rounded-lg text-sm transition-colors ${bulkAddCount === 60 ? 'bg-[#85ea10] text-black' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
                    >
                      2 meses
                    </button>
                    <button
                      onClick={() => setBulkAddCount(90)}
                      className={`px-4 py-2 rounded-lg text-sm transition-colors ${bulkAddCount === 90 ? 'bg-[#85ea10] text-black' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
                    >
                      3 meses
                    </button>
                  </div>
                </div>
              ) : (
                <div ref={lessonsContainerRef} className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                  {lessons.map((lesson, index) => {
                    const isExpanded = expandedLessons.has(index);
                    return (
                      <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                        {/* Header compacto - siempre visible */}
                        <div 
                          className={`flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 ${isExpanded ? 'bg-gray-50 dark:bg-gray-800' : ''}`}
                          onClick={() => {
                            setExpandedLessons(prev => {
                              const newSet = new Set(prev);
                              if (newSet.has(index)) {
                                newSet.delete(index);
                              } else {
                                newSet.add(index);
                              }
                              return newSet;
                            });
                          }}
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <span className="flex-shrink-0 w-8 h-8 bg-[#85ea10] text-black rounded-full flex items-center justify-center text-sm font-bold">
                              {lesson.lesson_order}
                            </span>
                            <input
                              type="text"
                              value={lesson.title}
                              onChange={(e) => {
                                e.stopPropagation();
                                updateLesson(index, 'title', e.target.value);
                              }}
                              onClick={(e) => e.stopPropagation()}
                              className="flex-1 min-w-0 px-2 py-1 border-0 bg-transparent text-gray-900 dark:text-white focus:ring-1 focus:ring-[#85ea10] rounded"
                              placeholder={`Título de lección ${lesson.lesson_order}`}
                            />
                            <span className="flex-shrink-0 text-xs text-gray-500">
                              {lesson.duration_minutes}min
                            </span>
                            {lesson.preview_image && (
                              <ImageIcon className="flex-shrink-0 w-4 h-4 text-blue-500" aria-label="Tiene imagen" />
                            )}
                            {lesson.video_url && (
                              <Video className="flex-shrink-0 w-4 h-4 text-green-500" aria-label="Tiene video" />
                            )}
                          </div>
                          <div className="flex items-center gap-2 ml-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeLesson(index);
                              }}
                              className="text-red-500 hover:text-red-700 p-1"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <span className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                              ▼
                            </span>
                          </div>
                        </div>

                        {/* Contenido expandido */}
                        {isExpanded && (
                          <div className="p-4 pt-2 border-t border-gray-200 dark:border-gray-700 space-y-3">
                            {/* Título de la lección */}
                            <div>
                              <label className="block text-xs font-medium text-gray-500 mb-1">Título de la Lección * ({lesson.title.length}/100)</label>
                              <input
                                type="text"
                                value={lesson.title}
                                onChange={(e) => updateLesson(index, 'title', e.target.value)}
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#85ea10] focus:border-[#85ea10] bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                                  lesson.title.length > 100 
                                    ? 'border-red-500' 
                                    : 'border-gray-300 dark:border-gray-600'
                                }`}
                                placeholder="Ej: Día 1 - Introducción al HIIT"
                                maxLength={100}
                              />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Duración (min)</label>
                                <input
                                  type="number"
                                  value={lesson.duration_minutes}
                                  onChange={(e) => updateLesson(index, 'duration_minutes', parseInt(e.target.value) || 0)}
                                  className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-[#85ea10] bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Playback ID (Mux)</label>
                                <input
                                  type="text"
                                  value={lesson.video_url}
                                  onChange={(e) => updateLesson(index, 'video_url', e.target.value)}
                                  className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-[#85ea10] bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                  placeholder="abc123def456"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-500 mb-1">Descripción</label>
                              <textarea
                                value={lesson.description}
                                onChange={(e) => updateLesson(index, 'description', e.target.value)}
                                rows={2}
                                className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-[#85ea10] bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                placeholder="Descripción de la lección..."
                              />
                            </div>
                            {/* Imagen de preview */}
                            <div>
                              <label className="block text-xs font-medium text-gray-500 mb-1">Imagen de Preview</label>
                              {lesson.preview_image ? (
                                <div className="relative inline-block">
                                  <img
                                    src={lesson.preview_image}
                                    alt="Preview"
                                    className="w-32 h-20 object-cover rounded border border-gray-300"
                                  />
                                  <button
                                    onClick={async () => {
                                      if (lesson.preview_image) {
                                        await handleImageDelete(lesson.preview_image, 'lesson');
                                      }
                                      updateLesson(index, 'preview_image', null);
                                    }}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ) : (
                                <div
                                  onClick={() => {
                                    const input = document.createElement('input');
                                    input.type = 'file';
                                    input.accept = 'image/*';
                                    input.onchange = (e) => {
                                      const file = (e.target as HTMLInputElement).files?.[0];
                                      if (file) handleImageUpload(file, 'lesson', index);
                                    };
                                    input.click();
                                  }}
                                  className="w-32 h-20 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded flex flex-col items-center justify-center cursor-pointer hover:border-[#85ea10] transition-colors"
                                >
                                  <ImageIcon className="w-6 h-6 text-gray-400 mb-1" />
                                  <span className="text-xs text-gray-500">Subir imagen</span>
                                </div>
                              )}
                            </div>

                            <div className="flex items-center">
                              <label className="flex items-center gap-2 text-sm">
                                <input
                                  type="checkbox"
                                  checked={lesson.is_preview}
                                  onChange={(e) => updateLesson(index, 'is_preview', e.target.checked)}
                                  className="h-4 w-4 text-[#85ea10] focus:ring-[#85ea10] border-gray-300 rounded"
                                />
                                <span className="text-gray-700 dark:text-gray-300">Preview gratuito</span>
                              </label>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                {courseToEdit ? 'Revisar y Actualizar Curso' : 'Revisar y Crear Curso'}
              </h3>
              
              {/* Resumen del curso */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Resumen del Curso
                </h4>
                
                {/* Imagen del curso */}
                {courseData.preview_image && (
                  <div className="mb-6">
                    <img
                      src={courseData.preview_image}
                      alt={courseData.title || 'Preview del curso'}
                      className="w-full max-h-80 rounded-lg shadow-md object-contain"
                    />
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Título</p>
                    <p className="font-medium text-gray-900 dark:text-white">{courseData.title || 'Sin título'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Categoría</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {categories.find(c => c.id === courseData.category)?.name || 'Sin categoría'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Precio</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      ${courseData.price} {courseData.discount_percentage && courseData.discount_percentage > 0 && `(${courseData.discount_percentage}% descuento)`}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Duración</p>
                    <p className="font-medium text-gray-900 dark:text-white">{courseData.duration_days} días</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Calorías</p>
                    <p className="font-medium text-gray-900 dark:text-white">{courseData.calories_burned} cal</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Lecciones</p>
                    <p className="font-medium text-gray-900 dark:text-white">{lessons.length} lecciones</p>
                  </div>
                </div>
              </div>

              {/* Checkbox de publicación */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="publish_course"
                    checked={courseData.is_published}
                    onChange={(e) => setCourseData(prev => ({ ...prev, is_published: e.target.checked }))}
                    className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <div>
                    <label htmlFor="publish_course" className="text-lg font-semibold text-blue-900 dark:text-blue-200 cursor-pointer">
                      Publicar curso inmediatamente
                    </label>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                      {courseData.is_published 
                        ? 'El curso será visible en el dashboard y disponible para compra.' 
                        : 'El curso se guardará como borrador y podrás publicarlo más tarde desde el panel de administración.'
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Lista de lecciones */}
              {lessons.length > 0 && (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Lecciones ({lessons.length})
                  </h4>
                  <div className="space-y-2">
                    {lessons.map((lesson, index) => (
                      <div key={index} className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {lesson.lesson_order}. {lesson.title || 'Sin título'}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {lesson.duration_minutes} min {lesson.is_preview && '(Preview)'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            Cancelar
          </button>
          
          <div className="flex items-center space-x-3">
            {currentStep > 1 && (
              <button
                onClick={() => setCurrentStep(currentStep - 1)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Anterior
              </button>
            )}
            
            {currentStep < 4 ? (
              <button
                onClick={() => setCurrentStep(currentStep + 1)}
                disabled={!courseData.title || !courseData.slug || !courseData.short_description}
                className="px-4 py-2 bg-[#85ea10] hover:bg-[#7dd30f] text-black font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-4 py-2 bg-[#85ea10] hover:bg-[#7dd30f] text-black font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
                    <span>{courseToEdit ? 'Actualizando...' : 'Creando...'}</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>
                      {courseToEdit 
                        ? 'Actualizar Curso' 
                        : courseData.is_published 
                          ? 'Crear y Publicar Curso' 
                          : 'Crear Borrador'
                      }
                    </span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Success Modal */}
      <RogerAlert
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          onClose();
        }}
        title={courseToEdit ? "¡Curso Actualizado Exitosamente! 🎉" : "¡Curso Creado Exitosamente! 🎉"}
        message={courseToEdit ? "El curso ha sido actualizado correctamente. Los cambios se reflejarán inmediatamente en el dashboard." : "El curso ha sido creado y está listo para ser publicado. Los estudiantes podrán verlo en el dashboard."}
        type="success"
      />
    </div>
  );
}
