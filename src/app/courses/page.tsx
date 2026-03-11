'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Vista de listado de cursos eliminada.
 * Redirigir a la página de inicio.
 */
export default function CoursesPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/');
  }, [router]);

  return null;
}
