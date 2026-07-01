'use client';

import { ArrowLeft } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import CourseCreator from '@/components/admin/CourseCreator';
import QuickLoading from '@/components/QuickLoading';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { supabase } from '@/lib/supabase-browser';
import { sortCourseLessonsByOrder } from '@/shared/utils/course-lessons.util';

export default function EditCoursePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { user, loading: authLoading } = useSupabaseAuth();
  const [courseToEdit, setCourseToEdit] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [loadingCourse, setLoadingCourse] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = useCallback(() => {
    if (!user) return false;
    const envId = process.env.NEXT_PUBLIC_ADMIN_USER_ID;
    const envEmail =
      process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'rogerbox@admin.com';
    const matchId = envId && user.id === envId;
    const matchEmail = envEmail && user.email === envEmail;
    const matchRole = user.user_metadata?.role === 'admin';
    return Boolean(matchId || matchEmail || matchRole);
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace('/dashboard');
      return;
    }
    if (!isAdmin()) {
      router.replace('/admin');
      return;
    }
  }, [user, authLoading, router, isAdmin]);

  useEffect(() => {
    if (!id || !user) return;

    const load = async () => {
      setLoadingCourse(true);
      setError(null);
      const { data, error: err } = await supabase
        .from('courses')
        .select(
          `
          *,
          course_lessons (
            id,
            title,
            description,
            video_url,
            preview_image,
            lesson_number,
            lesson_order,
            duration_minutes,
            is_preview
          )
        `,
        )
        .eq('id', id)
        .order('lesson_order', {
          foreignTable: 'course_lessons',
          ascending: true,
        })
        .single();

      if (err) {
        setError(err.message || 'Curso no encontrado');
        setCourseToEdit(null);
        return;
      }
      const course = data
        ? {
            ...data,
            lessons: sortCourseLessonsByOrder(data.course_lessons || []),
          }
        : null;
      setCourseToEdit(course);
      setLoadingCourse(false);
    };

    load();
  }, [id, user]);

  const handleClose = () => {
    router.push('/admin?tab=courses');
  };

  const handleSuccess = () => {
    router.push('/admin?tab=courses');
  };

  if (authLoading || !user) {
    return <QuickLoading message="Cargando..." duration={800} />;
  }

  if (!isAdmin()) {
    return null;
  }

  if (loadingCourse) {
    return <QuickLoading message="Cargando curso..." duration={800} />;
  }

  if (error || !courseToEdit) {
    return (
      <AdminLayout
        title="Editar curso"
        description="Gestionar cursos"
        activeTab="courses"
        headerRight={
          <button
            type="button"
            onClick={() => router.push('/admin?tab=courses')}
            className="flex items-center gap-2 p-2 sm:px-4 sm:py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-[#164151]/80 dark:text-white/60"
          >
            <ArrowLeft className="w-5 h-5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline text-sm font-medium">
              Volver a Cursos
            </span>
          </button>
        }
      >
        <div className="max-w-md mx-auto text-center py-12">
          <p className="text-[#164151] dark:text-white font-medium mb-2">
            {error || 'Curso no encontrado'}
          </p>
          <button
            type="button"
            onClick={() => router.push('/admin?tab=courses')}
            className="text-sm text-[#85ea10] hover:underline"
          >
            Volver a Cursos
          </button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="Editar curso"
      description="Gestionar cursos"
      activeTab="courses"
      headerRight={
        <button
          type="button"
          onClick={handleClose}
          className="flex items-center gap-2 p-2 sm:px-4 sm:py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-[#164151]/80 dark:text-white/60 hover:text-[#164151] dark:hover:text-white transition-colors"
          title="Volver a Cursos"
        >
          <ArrowLeft className="w-5 h-5 sm:w-4 sm:h-4" />
          <span className="hidden sm:inline text-sm font-medium">
            Volver a Cursos
          </span>
        </button>
      }
    >
      <div className="w-full">
        <CourseCreator
          onClose={handleClose}
          onSuccess={handleSuccess}
          courseToEdit={courseToEdit}
          asPage
        />
      </div>
    </AdminLayout>
  );
}
