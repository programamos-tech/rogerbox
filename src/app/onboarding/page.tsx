'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Onboarding from '@/components/Onboarding';
import SimpleLoading from '@/components/SimpleLoading';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { supabase } from '@/lib/supabase-browser';

export default function OnboardingPage() {
  const { user, profile, loading, session } = useSupabaseAuth();
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  // Verificar autenticación y redirigir
  useEffect(() => {
    const checkAuth = async () => {
      if (loading) return;

      // Si no hay usuario en el hook, verificar directamente con Supabase
      if (!user) {
        const {
          data: { session: currentSession },
        } = await supabase.auth.getSession();
        if (!currentSession?.user) {
          router.push('/login');
          return;
        }
      }

      setAuthChecked(true);
    };

    checkAuth();
  }, [loading, user, router]);

  const handleComplete = async (profileData: any) => {
    // Obtener el usuario actual directamente de Supabase
    const {
      data: { session: currentSession },
    } = await supabase.auth.getSession();
    const currentUser = currentSession?.user || user;

    if (!currentUser?.id) {
      alert('Error: No hay sesión activa. Por favor, inicia sesión de nuevo.');
      router.push('/login');
      return;
    }

    setIsUpdating(true);

    try {
      const accessToken = currentSession?.access_token;

      if (!accessToken) {
        alert('Error de autenticación. Por favor, recarga la página.');
        setIsUpdating(false);
        return;
      }

      // Llamar a la API para guardar el perfil
      const response = await fetch('/api/profile/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ profile: profileData }),
      });

      const result = await response.json();

      if (!response.ok) {
        alert(`Error al guardar: ${result.error || 'Error desconocido'}`);
        setIsUpdating(false);
        return;
      }

      // Redirigir al dashboard - usar window.location para forzar recarga completa
      window.location.href = '/dashboard';
    } catch (_error) {
      alert('Error inesperado. Intenta de nuevo.');
      setIsUpdating(false);
    }
  };

  // Mostrar loading mientras se verifica la autenticación
  if (loading || !authChecked) {
    return <SimpleLoading message="Verificando sesión..." size="lg" />;
  }

  // Si no hay usuario después de verificar, no renderizar nada (se está redirigiendo)
  const currentUser = user;
  if (!currentUser) {
    return <SimpleLoading message="Redirigiendo..." size="lg" />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <Onboarding
        onComplete={handleComplete}
        isUpdating={isUpdating}
        userName={
          profile?.name ||
          currentUser.user_metadata?.name ||
          currentUser.email?.split('@')[0] ||
          'Usuario'
        }
      />
    </div>
  );
}
