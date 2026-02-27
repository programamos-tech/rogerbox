'use client';

import { useRouter } from 'next/navigation';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import CourseCreator from '@/components/admin/CourseCreator';
import QuickLoading from '@/components/QuickLoading';

export default function NewCoursePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useSupabaseAuth();

  const isAdmin = () => {
    if (!user) return false;
    const envId = process.env.NEXT_PUBLIC_ADMIN_USER_ID;
    const envEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'rogerbox@admin.com';
    const matchId = envId && user.id === envId;
    const matchEmail = envEmail && user.email === envEmail;
    const matchRole = user.user_metadata?.role === 'admin';
    return Boolean(matchId || matchEmail || matchRole);
  };

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
  }, [user, authLoading, router]);

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

  return (
    <AdminLayout
      title="Crear curso"
      description="Gestionar cursos"
      activeTab="courses"
      headerRight={
        <button
          onClick={handleClose}
          className="flex items-center gap-2 p-2 sm:px-4 sm:py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-[#164151]/80 dark:text-white/60 hover:text-[#164151] dark:hover:text-white transition-colors"
          title="Volver a Cursos"
        >
          <ArrowLeft className="w-5 h-5 sm:w-4 sm:h-4" />
          <span className="hidden sm:inline text-sm font-medium">Volver a Cursos</span>
        </button>
      }
    >
      <div className="w-full">
        <CourseCreator
          onClose={handleClose}
          onSuccess={handleSuccess}
          asPage
        />
      </div>
    </AdminLayout>
  );
}
