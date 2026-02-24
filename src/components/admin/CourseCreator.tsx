'use client';

import {
  Calendar,
  CheckCircle,
  DollarSign,
  FileText,
  Flame,
  Image as ImageIcon,
  ListVideo,
  Plus,
  Save,
  Target,
  Trash2,
  Video,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import {
  deleteImage,
  getBucketFromUrl,
  getImagePathFromUrl,
  isSupabaseStorageUrl,
  uploadImage,
} from '@/lib/storage';
import { supabase } from '@/lib/supabase-browser';
import RogerAlert from '../RogerAlert';

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
  /** Si es true, se renderiza como vista de página completa (sin modal) */
  asPage?: boolean;
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
    sort_order: 1,
  },
  {
    id: 'gain_muscle',
    name: 'Ganar músculo',
    description: 'Entrenamientos para aumentar masa muscular',
    icon: '🏋️',
    color: '#85ea10',
    is_active: true,
    sort_order: 2,
  },
  {
    id: 'flexibility',
    name: 'Flexibilidad',
    description: 'Ejercicios para mejorar la flexibilidad',
    icon: '🧘',
    color: '#85ea10',
    is_active: true,
    sort_order: 3,
  },
  {
    id: 'tone',
    name: 'Tonificar',
    description: 'Rutinas para tonificar y definir',
    icon: '💪',
    color: '#85ea10',
    is_active: true,
    sort_order: 4,
  },
  {
    id: 'endurance',
    name: 'Resistencia',
    description: 'Entrenamientos para mejorar la resistencia',
    icon: '🏃',
    color: '#85ea10',
    is_active: true,
    sort_order: 5,
  },
  {
    id: 'strength',
    name: 'Fuerza',
    description: 'Ejercicios para desarrollar fuerza',
    icon: '⚡',
    color: '#85ea10',
    is_active: true,
    sort_order: 6,
  },
];

// Key para localStorage
const STORAGE_KEY = 'rogerbox_course_draft';

export default function CourseCreator({
  onClose,
  onSuccess,
  courseToEdit,
  asPage = false,
}: CourseCreatorProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [categories] = useState<Category[]>(HARDCODED_CATEGORIES);
  const [dragActive, setDragActive] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [formattedPrice, setFormattedPrice] = useState<string>('');
  const [_formattedIvaPrice, _setFormattedIvaPrice] = useState<string>('');
  const [expandedLessons, setExpandedLessons] = useState<Set<number>>(
    new Set(),
  );
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
          if (draft.courseData?.price)
            setFormattedPrice(formatPrice(draft.courseData.price));
        } catch (_e) {}
      }
    }
  }, [courseToEdit, formatPrice]);

  // Limpiar localStorage al guardar exitosamente
  const clearDraft = () => {
    localStorage.removeItem(STORAGE_KEY);
  };

  // Inicializar categoría por defecto si no hay una seleccionada
  useEffect(() => {
    if (!courseData.category && categories.length > 0) {
      setCourseData((prev) => ({ ...prev, category: categories[0].id }));
    }
  }, [categories.length, categories[0].id, courseData.category]);

  // Cargar datos del curso a editar
  useEffect(() => {
    if (courseToEdit) {
      if (courseToEdit.lessons && courseToEdit.lessons.length > 0) {
      }

      // Mantener el ID de la categoría para la comparación
      const categoryValue = courseToEdit.category || '';

      const newCourseData = {
        title: courseToEdit.title || '',
        slug: courseToEdit.slug || '',
        short_description: courseToEdit.short_description || '',
        preview_image: courseToEdit.preview_image || null,
        price: courseToEdit.price !== undefined ? courseToEdit.price : null,
        discount_percentage:
          courseToEdit.discount_percentage !== undefined
            ? courseToEdit.discount_percentage
            : null,
        category: categoryValue,
        duration_days:
          courseToEdit.duration_days !== undefined
            ? courseToEdit.duration_days
            : null,
        calories_burned:
          courseToEdit.calories_burned !== undefined
            ? courseToEdit.calories_burned
            : null,
        mux_playback_id: courseToEdit.mux_playback_id || '',
        level: courseToEdit.level || 'beginner',
        is_published:
          courseToEdit.is_published !== undefined
            ? courseToEdit.is_published
            : false,
        // include_iva: courseToEdit.include_iva !== undefined ? courseToEdit.include_iva : false, // Temporalmente deshabilitado
        // iva_percentage: courseToEdit.iva_percentage !== undefined ? courseToEdit.iva_percentage : 19 // Temporalmente deshabilitado
      };

      setCourseData(newCourseData);

      // Formatear precio para mostrar
      setFormattedPrice(formatPrice(newCourseData.price));

      // Cargar lecciones del curso
      if (courseToEdit.lessons) {
        setLessons(courseToEdit.lessons);
      } else {
      }
    }
  }, [courseToEdit, formatPrice]);

  const handleImageUpload = async (
    file: File,
    type: 'course' | 'lesson',
    lessonIndex?: number,
  ) => {
    try {
      // Determinar el bucket y folder según el tipo
      const bucket = type === 'course' ? 'course-image' : 'lesson-images';
      const folder = type === 'course' ? 'courses' : 'lessons';

      // Generar nombre único para el archivo
      const fileExtension = file.name.split('.').pop() || 'jpg';
      const filename =
        type === 'course'
          ? `course-${Date.now()}.${fileExtension}`
          : `lesson-${Date.now()}-${lessonIndex}.${fileExtension}`;
      const uploadResult = await uploadImage(file, bucket, folder, filename);

      if (!uploadResult.success || !uploadResult.url) {
        throw new Error(
          uploadResult.error || 'Error desconocido al subir la imagen',
        );
      }

      // Actualizar el estado con la URL de Storage
      if (type === 'course') {
        setCourseData((prev) => ({
          ...prev,
          preview_image: uploadResult.url!,
        }));
      } else if (type === 'lesson' && lessonIndex !== undefined) {
        const updatedLessons = [...lessons];
        updatedLessons[lessonIndex].preview_image = uploadResult.url!;
        setLessons(updatedLessons);
      }
    } catch (error) {
      setValidationErrors([
        `Error al procesar la imagen: ${error instanceof Error ? error.message : 'Error desconocido'}`,
      ]);
    }
  };

  // Función para eliminar imagen de Storage
  const handleImageDelete = async (
    imageUrl: string,
    type: 'course' | 'lesson',
  ) => {
    try {
      // Si es una URL de Supabase Storage, eliminarla
      if (isSupabaseStorageUrl(imageUrl)) {
        const bucket = getBucketFromUrl(imageUrl);
        const path = getImagePathFromUrl(imageUrl);

        if (bucket && path) {
          const deleted = await deleteImage(
            bucket as 'course-image' | 'lesson-images',
            path,
          );

          if (deleted) {
          } else {
          }
        }
      } else if (imageUrl.startsWith('data:image')) {
      }

      // Eliminar del estado local
      if (type === 'course') {
        setCourseData((prev) => ({ ...prev, preview_image: null }));
      } else if (type === 'lesson') {
      }
    } catch (_error) {}
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

  const handleDrop = (
    e: React.DragEvent,
    type: 'course' | 'lesson',
    lessonIndex?: number,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files?.[0]) {
      handleImageUpload(e.dataTransfer.files[0], type, lessonIndex);
    }
  };

  const addLesson = () => {
    const newLesson: LessonData = {
      title: `Clase ${lessons.length + 1}`,
      description: '',
      preview_image: null,
      video_url: '',
      lesson_number: lessons.length + 1,
      lesson_order: lessons.length + 1,
      duration_minutes: 30,
      is_preview: false,
    };
    // Actualizar los números de las lecciones existentes
    const updatedLessons = lessons.map((l, i) => ({
      ...l,
      lesson_number: i + 2,
      lesson_order: i + 2,
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

  // Función para parsear precio desde string (quita puntos de miles y comas)
  const parsePrice = (priceString: string) => {
    const cleanPrice = priceString.replace(/\./g, '').replace(/,/g, '').trim();
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
  const _isFormValid = () => {
    const titleValid =
      courseData.title.trim() && courseData.title.length <= 100;
    const slugValid = courseData.slug.trim() && courseData.slug.length <= 100;
    const shortDescriptionValid =
      courseData.short_description.trim() &&
      courseData.short_description.length <= 200;
    const priceValid = courseData.price && courseData.price > 0;
    const categoryValid = courseData.category;
    const durationValid =
      courseData.duration_days && courseData.duration_days > 0;
    const levelValid = courseData.level;
    const lessonsValid = lessons.length > 0;
    const lessonsContentValid = lessons.every(
      (lesson) =>
        lesson.title.trim() &&
        lesson.title.length <= 100 &&
        lesson.description.trim() &&
        lesson.description.length <= 300 &&
        lesson.video_url.trim() &&
        lesson.duration_minutes &&
        lesson.duration_minutes > 0,
    );

    const isValid =
      titleValid &&
      slugValid &&
      shortDescriptionValid &&
      priceValid &&
      categoryValid &&
      durationValid &&
      levelValid &&
      lessonsValid &&
      lessonsContentValid;

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
          errors.push(
            `El título de la lección ${i + 1} no puede exceder 100 caracteres`,
          );
        }
        if (!lesson.description.trim()) {
          errors.push(`La lección ${i + 1} debe tener una descripción`);
        }
        if (lesson.description.length > 300) {
          errors.push(
            `La descripción de la lección ${i + 1} no puede exceder 300 caracteres`,
          );
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
          const alertElement = document.querySelector(
            '[data-validation-alerts]',
          );
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
        is_published: courseData.is_published || false,
        // Temporalmente sin IVA hasta resolver problema de caché de Supabase
      };

      // Crear o actualizar el curso
      let course;
      let courseError;

      if (courseToEdit) {
        // Esperar más tiempo para que el esquema se actualice
        await new Promise((resolve) => setTimeout(resolve, 3000));

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
        await new Promise((resolve) => setTimeout(resolve, 3000));

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
        // Manejo específico para errores de esquema (temporalmente deshabilitado)
        // if (courseError.message.includes('schema cache') || courseError.message.includes('include_iva')) {
        //   throw new Error('Error de esquema de base de datos. Las columnas de IVA no están disponibles. Por favor, contacta al administrador.');
        // }

        throw new Error(
          `Error al ${courseToEdit ? 'actualizar' : 'crear'} el curso: ${courseError.message}`,
        );
      }

      // Manejar lecciones
      if (lessons.length > 0) {
        if (courseToEdit) {
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
              is_preview: lesson.is_preview,
            };

            if (lesson.id) {
              // Actualizar lección existente
              const { error: updateError } = await supabase
                .from('course_lessons')
                .update(lessonData)
                .eq('id', lesson.id);

              if (updateError) {
                throw new Error(
                  `Error al actualizar la lección ${i + 1}: ${updateError.message}`,
                );
              }
            } else {
              // Crear nueva lección si no tiene ID
              const { error: insertError } = await supabase
                .from('course_lessons')
                .insert([
                  {
                    ...lessonData,
                    course_id: course.id,
                  },
                ]);

              if (insertError) {
                throw new Error(
                  `Error al crear la lección ${i + 1}: ${insertError.message}`,
                );
              }
            }
          }

          // PASO 3: Eliminar lecciones que ya no están en la lista
          const currentLessonIds = lessons.filter((l) => l.id).map((l) => l.id);
          if (existingLessons && existingLessons.length > 0) {
            const lessonsToDelete = existingLessons.filter(
              (el) => !currentLessonIds.includes(el.id),
            );
            if (lessonsToDelete.length > 0) {
              const { error: deleteError } = await supabase
                .from('course_lessons')
                .delete()
                .in(
                  'id',
                  lessonsToDelete.map((l) => l.id),
                );

              if (deleteError) {
                // No lanzar error aquí, solo loguear
              }
            }
          }
        } else {
          // Crear nuevas lecciones para curso nuevo
          const lessonsWithCourseId = lessons.map((lesson, index) => ({
            ...lesson,
            course_id: course.id,
            lesson_number: index + 1,
            lesson_order: index + 1,
          }));

          const { error: lessonsError } = await supabase
            .from('course_lessons')
            .insert(lessonsWithCourseId);

          if (lessonsError) {
            throw new Error(
              `Error al crear las lecciones: ${lessonsError.message}`,
            );
          }
        }
      }

      setShowSuccessModal(true);
      clearDraft(); // Limpiar borrador al guardar exitosamente
      onSuccess();
    } catch (error: any) {
      setValidationErrors([
        `Error al ${courseToEdit ? 'actualizar' : 'crear'} el curso: ${error.message || 'Error desconocido'}`,
      ]);
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
    { number: 1, title: 'Información Básica', icon: FileText },
    { number: 2, title: 'Detalles del Curso', icon: DollarSign },
    { number: 3, title: 'Lecciones', icon: ListVideo },
    { number: 4, title: 'Revisar y Crear', icon: CheckCircle },
  ];

  const header = !asPage ? (
    <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 dark:border-white/10">
      <h2 className="text-2xl font-bold text-[#164151] dark:text-white">
        {courseToEdit ? 'Editar Curso' : 'Crear Nuevo Curso'}
      </h2>
      <button
        onClick={onClose}
        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1"
      >
        <X className="w-6 h-6" />
      </button>
    </div>
  ) : null;

  const innerContent = (
    <>
      {header}

      {/* Progress Steps - organizado: iconos, etiquetas completas, líneas visibles */}
      <div className="px-6 py-5 border-b border-gray-200 dark:border-white/10">
        <div className="flex items-center w-full gap-0">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStep === step.number;
            const isCompleted = currentStep > step.number;
            return (
              <div key={step.number} className="contents">
                <div className="flex items-center gap-2.5 flex-shrink-0 py-1">
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-xl border-2 flex-shrink-0 transition-colors ${
                      isActive
                        ? 'border-[#164151] dark:border-white bg-[#164151] dark:bg-white text-white dark:text-[#164151]'
                        : isCompleted
                          ? 'border-gray-400 dark:border-white/40 bg-gray-200 dark:bg-white/20 text-[#164151] dark:text-white'
                          : 'border-gray-300 dark:border-white/20 bg-gray-100 dark:bg-white/10 text-[#164151]/70 dark:text-white/70'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle
                        className="w-5 h-5 flex-shrink-0"
                        strokeWidth={2.5}
                      />
                    ) : (
                      <Icon className="w-5 h-5 flex-shrink-0" strokeWidth={2} />
                    )}
                  </div>
                  <p
                    className={`text-xs font-semibold whitespace-nowrap ${
                      isActive
                        ? 'text-[#164151] dark:text-white'
                        : isCompleted
                          ? 'text-[#164151]/80 dark:text-white/80'
                          : 'text-[#164151]/70 dark:text-white/70'
                    }`}
                  >
                    {step.title}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 min-w-[24px] h-1 mx-3 rounded-full transition-colors ${
                      isCompleted
                        ? 'bg-gray-400 dark:bg-white/40'
                        : 'bg-gray-300 dark:bg-white/20'
                    }`}
                    aria-hidden
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div
        className={`p-6 overflow-y-auto ${asPage ? 'min-h-[50vh]' : 'max-h-[60vh]'}`}
      >
        {/* Alertas de validación */}
        {validationErrors.length > 0 && (
          <div
            data-validation-alerts
            className="mb-6 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl"
          >
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-500 dark:text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-semibold text-red-800 dark:text-red-200">
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
            <h3 className="text-lg font-bold text-[#164151] dark:text-white mb-4">
              Información Básica
            </h3>

            <div>
              <label className="block text-sm font-semibold text-[#164151] dark:text-white mb-2">
                Nombre del Curso * ({courseData.title.length}/100)
              </label>
              <input
                type="text"
                value={courseData.title}
                onChange={(e) => {
                  setCourseData((prev) => ({ ...prev, title: e.target.value }));
                  clearValidationErrors();
                }}
                className={`w-full px-5 py-3.5 rounded-xl border transition-all bg-gray-50 dark:bg-white/5 text-[#164151] dark:text-white placeholder-gray-400 dark:placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#164151]/40 dark:focus:ring-white/40 focus:border-[#164151]/40 dark:focus:border-white/40 ${
                  courseData.title.length > 100
                    ? 'border-red-500 dark:border-red-500'
                    : 'border-gray-200 dark:border-white/10'
                }`}
                placeholder="Ej: Transformación Total 90 Días (máx. 100 caracteres)"
                maxLength={100}
              />
              {courseData.title.length > 100 && (
                <p className="text-red-500 text-sm mt-1">
                  El nombre del curso no puede exceder 100 caracteres
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#164151] dark:text-white mb-2">
                Descripción Corta * ({courseData.short_description.length}/200)
              </label>
              <input
                type="text"
                value={courseData.short_description}
                onChange={(e) =>
                  setCourseData((prev) => ({
                    ...prev,
                    short_description: e.target.value,
                  }))
                }
                className={`w-full px-5 py-3.5 rounded-xl border transition-all bg-gray-50 dark:bg-white/5 text-[#164151] dark:text-white placeholder-gray-400 dark:placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#164151]/40 dark:focus:ring-white/40 focus:border-[#164151]/40 dark:focus:border-white/40 ${
                  courseData.short_description.length > 200
                    ? 'border-red-500 dark:border-red-500'
                    : 'border-gray-200 dark:border-white/10'
                }`}
                placeholder="Una descripción breve del curso (máx. 200 caracteres)"
                maxLength={200}
              />
              {courseData.short_description.length > 200 && (
                <p className="text-red-500 text-sm mt-1">
                  La descripción corta no puede exceder 200 caracteres
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#164151] dark:text-white mb-2">
                Slug del Curso * ({courseData.slug.length}/100)
              </label>
              <input
                type="text"
                value={courseData.slug}
                onChange={(e) => {
                  const slug = e.target.value
                    .toLowerCase()
                    .replace(/[^a-z0-9\s-]/g, '')
                    .replace(/\s+/g, '-')
                    .replace(/-+/g, '-')
                    .trim();
                  setCourseData((prev) => ({ ...prev, slug }));
                }}
                className={`w-full px-5 py-3.5 rounded-xl border transition-all bg-gray-50 dark:bg-white/5 text-[#164151] dark:text-white placeholder-gray-400 dark:placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#164151]/40 dark:focus:ring-white/40 focus:border-[#164151]/40 dark:focus:border-white/40 ${
                  courseData.slug.length > 100
                    ? 'border-red-500 dark:border-red-500'
                    : 'border-gray-200 dark:border-white/10'
                }`}
                placeholder="curso-hiit-intenso-cardio"
                maxLength={100}
              />
              <p className="text-sm text-[#164151]/60 dark:text-white/60 mt-1.5">
                URL amigable para el curso (ej: curso-hiit-intenso-cardio)
              </p>
              {courseData.slug.length > 100 && (
                <p className="text-red-500 text-sm mt-1">
                  El slug no puede exceder 100 caracteres
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#164151] dark:text-white mb-3">
                Categoría *
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() =>
                      setCourseData((prev) => ({
                        ...prev,
                        category: category.id,
                      }))
                    }
                    className={`flex items-center gap-2.5 p-3.5 rounded-xl border-2 transition-all text-left ${
                      courseData.category === category.id
                        ? 'border-[#164151] dark:border-white bg-[#164151]/10 dark:bg-white/10 text-[#164151] dark:text-white'
                        : 'border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-[#164151] dark:text-white/80 hover:border-gray-300 dark:hover:border-white/20'
                    }`}
                  >
                    <span className="text-xl">{category.icon}</span>
                    <span className="text-sm font-semibold">
                      {category.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-[#164151] dark:text-white mb-4">
              Detalles del Curso
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-[#164151] dark:text-white mb-2">
                  Precio (COP) *
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#164151]/50 dark:text-white/50" />
                  <input
                    type="text"
                    value={formattedPrice}
                    onChange={(e) => {
                      const parsedPrice = parsePrice(e.target.value);
                      setCourseData((prev) => ({
                        ...prev,
                        price: parsedPrice,
                      }));
                      setFormattedPrice(formatPrice(parsedPrice));
                      clearValidationErrors();
                    }}
                    onBlur={() => {
                      setFormattedPrice(formatPrice(courseData.price));
                    }}
                    className="w-full pl-12 pr-5 py-3.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-[#164151] dark:text-white placeholder-gray-400 dark:placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#164151]/40 dark:focus:ring-white/40 focus:border-[#164151]/40 dark:focus:border-white/40 transition-all"
                    placeholder="50.000"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#164151] dark:text-white mb-2">
                  Descuento (%)
                </label>
                <input
                  type="number"
                  value={courseData.discount_percentage || ''}
                  onChange={(e) => {
                    const discountValue = parseInt(e.target.value, 10) || 0;
                    setCourseData((prev) => ({
                      ...prev,
                      discount_percentage: discountValue,
                    }));
                    clearValidationErrors();
                  }}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-white/10 rounded-xl bg-gray-50 dark:bg-white/5 text-[#164151] dark:text-white placeholder-gray-400 dark:placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#164151]/40 dark:focus:ring-white/40 focus:border-[#164151]/40 dark:focus:border-white/40 transition-all"
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
                La configuración de IVA estará disponible próximamente. Por
                ahora, los precios se manejan sin IVA.
              </p>
            </div>

            {/* Duración y calorías */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-[#164151] dark:text-white mb-2">
                  Duración (días) *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#164151]/50 dark:text-white/50" />
                  <input
                    type="number"
                    value={courseData.duration_days || ''}
                    onChange={(e) =>
                      setCourseData((prev) => ({
                        ...prev,
                        duration_days: parseInt(e.target.value, 10) || null,
                      }))
                    }
                    className="w-full pl-12 pr-5 py-3.5 border border-gray-200 dark:border-white/10 rounded-xl bg-gray-50 dark:bg-white/5 text-[#164151] dark:text-white placeholder-gray-400 dark:placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#164151]/40 dark:focus:ring-white/40 focus:border-[#164151]/40 dark:focus:border-white/40 transition-all"
                    placeholder="30"
                    min="1"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#164151] dark:text-white mb-2">
                  Calorías Quemadas
                </label>
                <div className="relative">
                  <Flame className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#164151]/50 dark:text-white/50" />
                  <input
                    type="number"
                    value={courseData.calories_burned || ''}
                    onChange={(e) =>
                      setCourseData((prev) => ({
                        ...prev,
                        calories_burned: parseInt(e.target.value, 10) || null,
                      }))
                    }
                    className="w-full pl-12 pr-5 py-3.5 border border-gray-200 dark:border-white/10 rounded-xl bg-gray-50 dark:bg-white/5 text-[#164151] dark:text-white placeholder-gray-400 dark:placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#164151]/40 dark:focus:ring-white/40 focus:border-[#164151]/40 dark:focus:border-white/40 transition-all"
                    placeholder="500"
                    min="0"
                  />
                </div>
              </div>
            </div>

            {/* Nivel del curso */}
            <div>
              <label className="block text-sm font-semibold text-[#164151] dark:text-white mb-2">
                Nivel del Curso *
              </label>
              <div className="relative">
                <Target className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#164151]/50 dark:text-white/50" />
                <select
                  value={courseData.level}
                  onChange={(e) =>
                    setCourseData((prev) => ({
                      ...prev,
                      level: e.target.value,
                    }))
                  }
                  className="w-full pl-12 pr-5 py-3.5 border border-gray-200 dark:border-white/10 rounded-xl bg-gray-50 dark:bg-white/5 text-[#164151] dark:text-white placeholder-gray-400 dark:placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#164151]/40 dark:focus:ring-white/40 focus:border-[#164151]/40 dark:focus:border-white/40 transition-all"
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
              <label className="block text-sm font-semibold text-[#164151] dark:text-white mb-2">
                Mux Playback ID del Video Introductorio
              </label>
              <div className="relative">
                <Video className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#164151]/50 dark:text-white/50" />
                <input
                  type="text"
                  value={courseData.mux_playback_id}
                  onChange={(e) =>
                    setCourseData((prev) => ({
                      ...prev,
                      mux_playback_id: e.target.value,
                    }))
                  }
                  className="w-full pl-12 pr-5 py-3.5 border border-gray-200 dark:border-white/10 rounded-xl bg-gray-50 dark:bg-white/5 text-[#164151] dark:text-white placeholder-gray-400 dark:placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#164151]/40 dark:focus:ring-white/40 focus:border-[#164151]/40 dark:focus:border-white/40 transition-all"
                  placeholder="8wRPxlLcp01JrCKhEsyq00BPSrah1qkRY01aOvr01p4suEU"
                />
              </div>
              <p className="text-xs text-[#164151]/60 dark:text-white/60 mt-1">
                Ingresa el Playback ID de Mux (no la URL completa)
              </p>
            </div>

            {/* Preview Image */}
            <div>
              <label className="block text-sm font-semibold text-[#164151] dark:text-white mb-2">
                Imagen de Preview
              </label>
              <div
                className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer hover:border-gray-300 dark:hover:border-white/20 ${
                  dragActive
                    ? 'border-[#164151] dark:border-white bg-[#164151]/5 dark:bg-white/10'
                    : 'border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5'
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
                          await handleImageDelete(
                            courseData.preview_image,
                            'course',
                          );
                        }
                        setCourseData((prev) => ({
                          ...prev,
                          preview_image: null,
                        }));
                      }}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div>
                    <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-[#164151]/60 dark:text-white/60 mb-2">
                      Arrastra una imagen aquí o haz clic para seleccionar
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = 'image/*';
                        input.onchange = (e) => {
                          const file = (e.target as HTMLInputElement)
                            .files?.[0];
                          if (file) {
                            handleImageUpload(file, 'course');
                          }
                        };
                        input.click();
                      }}
                      className="border-2 border-[#164151] dark:border-white bg-transparent hover:bg-[#164151]/10 dark:hover:bg-white/10 text-[#164151] dark:text-white px-4 py-2 rounded-lg transition-colors"
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
            {/* Header: título + Agregar clase (principal) */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-[#164151] dark:text-white">
                  Lecciones {lessons.length > 0 && `(${lessons.length})`}
                </h3>
                {lessons.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (expandedLessons.size === lessons.length) {
                        setExpandedLessons(new Set());
                      } else {
                        setExpandedLessons(new Set(lessons.map((_, i) => i)));
                      }
                    }}
                    className="text-sm text-[#164151] dark:text-white font-medium hover:underline"
                  >
                    {expandedLessons.size === lessons.length
                      ? 'Colapsar todo'
                      : 'Expandir todo'}
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    addLesson();
                    setTimeout(() => {
                      setExpandedLessons(
                        (prev) => new Set([...prev, lessons.length]),
                      );
                      lessonsContainerRef.current?.scrollTo({
                        top: lessonsContainerRef.current?.scrollHeight ?? 0,
                        behavior: 'smooth',
                      });
                    }, 100);
                  }}
                  className="border-2 border-[#164151] dark:border-white bg-transparent hover:bg-[#164151]/10 dark:hover:bg-white/10 text-[#164151] dark:text-white px-4 py-2.5 rounded-xl font-semibold flex items-center gap-2 text-sm transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Agregar clase
                </button>
                {lessons.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      value={bulkAddCount}
                      onChange={(e) =>
                        setBulkAddCount(
                          Math.max(
                            1,
                            Math.min(100, parseInt(e.target.value, 10) || 1),
                          ),
                        )
                      }
                      className="w-11 px-1.5 py-1.5 text-center text-sm border border-gray-200 dark:border-white/10 rounded-lg bg-gray-50 dark:bg-white/5 text-[#164151] dark:text-white"
                      min={1}
                      max={100}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newLessons: LessonData[] = [];
                        for (let i = 0; i < bulkAddCount; i++) {
                          newLessons.push({
                            title: `Clase ${lessons.length + i + 1}`,
                            description: '',
                            preview_image: null,
                            video_url: '',
                            lesson_number: lessons.length + i + 1,
                            lesson_order: lessons.length + i + 1,
                            duration_minutes: 30,
                            is_preview: false,
                          });
                        }
                        setLessons([...newLessons, ...lessons]);
                        setExpandedLessons(new Set([0]));
                      }}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-gray-100 dark:bg-white/10 text-[#164151] dark:text-white/80 hover:bg-gray-200 dark:hover:bg-white/20 border border-gray-200 dark:border-white/10"
                    >
                      +{bulkAddCount}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {lessons.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/5 p-10 text-center">
                <div className="max-w-sm mx-auto">
                  <div className="w-14 h-14 rounded-xl bg-gray-200 dark:bg-white/10 flex items-center justify-center mx-auto mb-4">
                    <ListVideo className="w-7 h-7 text-[#164151]/70 dark:text-white/70" />
                  </div>
                  <h4 className="text-lg font-bold text-[#164151] dark:text-white mb-2">
                    Agrega las clases de tu curso
                  </h4>
                  <p className="text-sm text-[#164151]/70 dark:text-white/70 mb-6">
                    Cada clase tiene nombre, descripción, imagen y tiempo.
                    Agrega la primera para comenzar.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      addLesson();
                      setTimeout(() => {
                        setExpandedLessons(new Set([0]));
                      }, 100);
                    }}
                    className="border-2 border-[#164151] dark:border-white bg-transparent hover:bg-[#164151]/10 dark:hover:bg-white/10 text-[#164151] dark:text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 mx-auto transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                    Agregar primera clase
                  </button>
                </div>
              </div>
            ) : (
              <div
                ref={lessonsContainerRef}
                className="space-y-3 max-h-[480px] overflow-y-auto pr-1"
              >
                {lessons.map((lesson, index) => {
                  const isExpanded = expandedLessons.has(index);
                  return (
                    <div
                      key={index}
                      className="border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden bg-white dark:bg-gray-900/30"
                    >
                      {/* Header compacto - siempre visible */}
                      <div
                        className={`flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition-colors ${isExpanded ? 'bg-gray-50 dark:bg-white/5' : ''}`}
                        onClick={() => {
                          setExpandedLessons((prev) => {
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
                          <span className="flex-shrink-0 w-8 h-8 bg-[#164151] dark:bg-white/20 text-white dark:text-white rounded-full flex items-center justify-center text-sm font-bold">
                            {index + 1}
                          </span>
                          <input
                            type="text"
                            value={lesson.title}
                            onChange={(e) => {
                              e.stopPropagation();
                              updateLesson(index, 'title', e.target.value);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="flex-1 min-w-0 px-2 py-1 border-0 bg-transparent text-gray-900 dark:text-white focus:ring-1 focus:ring-[#164151] dark:focus:ring-white rounded"
                            placeholder="Nombre de la clase"
                          />
                          <span className="flex-shrink-0 text-xs text-[#164151]/60 dark:text-white/60">
                            {lesson.duration_minutes}min
                          </span>
                          {lesson.preview_image && (
                            <ImageIcon
                              className="flex-shrink-0 w-4 h-4 text-blue-500"
                              aria-label="Tiene imagen"
                            />
                          )}
                          {lesson.video_url && (
                            <Video
                              className="flex-shrink-0 w-4 h-4 text-green-500"
                              aria-label="Tiene video"
                            />
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
                          <span
                            className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                          >
                            ▼
                          </span>
                        </div>
                      </div>

                      {/* Contenido expandido: nombre, descripción, imagen, tiempo */}
                      {isExpanded && (
                        <div className="p-4 pt-2 border-t border-gray-200 dark:border-white/10 space-y-4">
                          <div>
                            <label className="block text-sm font-semibold text-[#164151] dark:text-white mb-1.5">
                              Nombre de la clase *
                            </label>
                            <input
                              type="text"
                              value={lesson.title}
                              onChange={(e) =>
                                updateLesson(index, 'title', e.target.value)
                              }
                              className={`w-full px-3 py-2.5 border rounded-xl bg-gray-50 dark:bg-white/5 text-[#164151] dark:text-white placeholder-gray-400 dark:placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#164151]/40 dark:focus:ring-white/40 focus:border-[#164151]/40 dark:focus:border-white/40 text-sm ${
                                lesson.title.length > 100
                                  ? 'border-red-500'
                                  : 'border-gray-200 dark:border-white/10'
                              }`}
                              placeholder="Ej: Introducción al HIIT"
                              maxLength={100}
                            />
                            <p className="text-xs text-[#164151]/60 dark:text-white/60 mt-0.5">
                              {lesson.title.length}/100
                            </p>
                          </div>

                          <div>
                            <label className="block text-sm font-semibold text-[#164151] dark:text-white mb-1.5">
                              Descripción de la clase
                            </label>
                            <textarea
                              value={lesson.description}
                              onChange={(e) =>
                                updateLesson(
                                  index,
                                  'description',
                                  e.target.value,
                                )
                              }
                              rows={2}
                              className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-white/10 rounded-xl bg-gray-50 dark:bg-white/5 text-[#164151] dark:text-white placeholder-gray-400 dark:placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#164151]/40 dark:focus:ring-white/40"
                              placeholder="Qué verás en esta clase..."
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-semibold text-[#164151] dark:text-white mb-1.5">
                              Imagen de la clase
                            </label>
                            {lesson.preview_image ? (
                              <div className="relative inline-block">
                                <img
                                  src={lesson.preview_image}
                                  alt="Preview"
                                  className="w-32 h-20 object-cover rounded-xl border border-gray-200 dark:border-white/10"
                                />
                                <button
                                  onClick={async () => {
                                    if (lesson.preview_image) {
                                      await handleImageDelete(
                                        lesson.preview_image,
                                        'lesson',
                                      );
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
                                    const file = (e.target as HTMLInputElement)
                                      .files?.[0];
                                    if (file)
                                      handleImageUpload(file, 'lesson', index);
                                  };
                                  input.click();
                                }}
                                className="w-32 h-20 border-2 border-dashed border-gray-200 dark:border-white/10 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-gray-300 dark:hover:border-white/20 bg-gray-50 dark:bg-white/5 transition-colors"
                              >
                                <ImageIcon className="w-6 h-6 text-[#164151]/40 dark:text-white/40 mb-1" />
                                <span className="text-xs text-[#164151]/60 dark:text-white/60">
                                  Subir imagen
                                </span>
                              </div>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-semibold text-[#164151] dark:text-white mb-1.5">
                              Tiempo de la clase (minutos)
                            </label>
                            <input
                              type="number"
                              value={lesson.duration_minutes}
                              onChange={(e) =>
                                updateLesson(
                                  index,
                                  'duration_minutes',
                                  parseInt(e.target.value, 10) || 0,
                                )
                              }
                              min={1}
                              className="w-full max-w-[120px] px-3 py-2.5 text-sm border border-gray-200 dark:border-white/10 rounded-xl bg-gray-50 dark:bg-white/5 text-[#164151] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#164151]/40 dark:focus:ring-white/40"
                              placeholder="30"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-semibold text-[#164151] dark:text-white mb-1.5">
                              Video (ID Mux)
                            </label>
                            <input
                              type="text"
                              value={lesson.video_url}
                              onChange={(e) =>
                                updateLesson(index, 'video_url', e.target.value)
                              }
                              className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-white/10 rounded-xl bg-gray-50 dark:bg-white/5 text-[#164151] dark:text-white placeholder-gray-400 dark:placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#164151]/40 dark:focus:ring-white/40"
                              placeholder="ID del video en Mux"
                            />
                          </div>

                          <div className="flex items-center pt-1">
                            <label className="flex items-center gap-2 text-sm cursor-pointer">
                              <input
                                type="checkbox"
                                checked={lesson.is_preview}
                                onChange={(e) =>
                                  updateLesson(
                                    index,
                                    'is_preview',
                                    e.target.checked,
                                  )
                                }
                                className="h-4 w-4 rounded border-gray-200 dark:border-white/20 accent-[#164151] dark:accent-white focus:ring-[#164151]/40 dark:focus:ring-white/40"
                              />
                              <span className="text-[#164151] dark:text-white/80">
                                Clase de preview gratuito
                              </span>
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
            <h3 className="text-lg font-bold text-[#164151] dark:text-white mb-4">
              {courseToEdit
                ? 'Revisar y Actualizar Curso'
                : 'Revisar y Crear Curso'}
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
                  <p className="text-sm text-[#164151]/60 dark:text-white/60">
                    Título
                  </p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {courseData.title || 'Sin título'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-[#164151]/60 dark:text-white/60">
                    Categoría
                  </p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {categories.find((c) => c.id === courseData.category)
                      ?.name || 'Sin categoría'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-[#164151]/60 dark:text-white/60">
                    Precio
                  </p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    ${courseData.price}{' '}
                    {courseData.discount_percentage &&
                      courseData.discount_percentage > 0 &&
                      `(${courseData.discount_percentage}% descuento)`}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-[#164151]/60 dark:text-white/60">
                    Duración
                  </p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {courseData.duration_days} días
                  </p>
                </div>
                <div>
                  <p className="text-sm text-[#164151]/60 dark:text-white/60">
                    Calorías
                  </p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {courseData.calories_burned} cal
                  </p>
                </div>
                <div>
                  <p className="text-sm text-[#164151]/60 dark:text-white/60">
                    Lecciones
                  </p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {lessons.length} lecciones
                  </p>
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
                  onChange={(e) =>
                    setCourseData((prev) => ({
                      ...prev,
                      is_published: e.target.checked,
                    }))
                  }
                  className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
                <div>
                  <label
                    htmlFor="publish_course"
                    className="text-lg font-semibold text-blue-900 dark:text-blue-200 cursor-pointer"
                  >
                    Publicar curso inmediatamente
                  </label>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    {courseData.is_published
                      ? 'El curso será visible en el dashboard y disponible para compra.'
                      : 'El curso se guardará como borrador y podrás publicarlo más tarde desde el panel de administración.'}
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
                    <div
                      key={index}
                      className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700 last:border-b-0"
                    >
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {lesson.lesson_order}. {lesson.title || 'Sin título'}
                        </p>
                        <p className="text-sm text-[#164151]/60 dark:text-white/60">
                          {lesson.duration_minutes} min{' '}
                          {lesson.is_preview && '(Preview)'}
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

      {/* Footer - estilos dashboard/planes */}
      <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-white/10">
        <button
          onClick={onClose}
          className="px-5 py-2.5 rounded-xl bg-gray-100 dark:bg-white/10 text-[#164151] dark:text-white hover:bg-gray-200 dark:hover:bg-white/20 transition-colors text-sm font-semibold"
        >
          Cancelar
        </button>

        <div className="flex items-center gap-3">
          {currentStep > 1 && (
            <button
              onClick={() => setCurrentStep(currentStep - 1)}
              type="button"
              className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-[#164151] dark:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors text-sm font-semibold"
            >
              Anterior
            </button>
          )}

          {currentStep < 4 ? (
            <button
              onClick={() => setCurrentStep(currentStep + 1)}
              disabled={
                !courseData.title ||
                !courseData.slug ||
                !courseData.short_description
              }
              type="button"
              className="px-5 py-2.5 rounded-xl bg-[#85ea10] hover:bg-[#7dd30f] text-black font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              Siguiente
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              type="button"
              className="px-5 py-2.5 rounded-xl bg-[#85ea10] hover:bg-[#7dd30f] text-black font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
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
                        : 'Crear Borrador'}
                  </span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </>
  );

  return (
    <>
      {asPage ? (
        <div className="w-full">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-white/10 overflow-hidden shadow-sm">
            {innerContent}
          </div>
        </div>
      ) : (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
            {innerContent}
          </div>
        </div>
      )}

      <RogerAlert
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          onClose();
        }}
        title={
          courseToEdit
            ? '¡Curso Actualizado Exitosamente! 🎉'
            : '¡Curso Creado Exitosamente! 🎉'
        }
        message={
          courseToEdit
            ? 'El curso ha sido actualizado correctamente. Los cambios se reflejarán inmediatamente en el dashboard.'
            : 'El curso ha sido creado y está listo para ser publicado. Los estudiantes podrán verlo en el dashboard.'
        }
        type="success"
      />
    </>
  );
}
