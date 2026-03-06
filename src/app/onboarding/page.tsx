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
  const [showLinkedMessage, setShowLinkedMessage] = useState(false);
  const [showOtherEmailMessage, setShowOtherEmailMessage] = useState(false);

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

      if (result.linkedExistingClient) {
        setShowLinkedMessage(true);
        setIsUpdating(false);
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 2200);
        return;
      }

      if (result.cedulaAssociatedWithOtherEmail) {
        setShowOtherEmailMessage(true);
        setIsUpdating(false);
        return;
      }

      window.location.href = '/dashboard';
    } catch (error) {
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
      {showLinkedMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 sm:p-8 max-w-sm w-full border border-[#85ea10]/30 shadow-xl text-center">
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-[#85ea10]/20 flex items-center justify-center">
              <span className="text-3xl" aria-hidden>✓</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              ¡Te identificamos!
            </h2>
            <p className="text-gray-600 dark:text-white/80 text-sm">
              Tu cuenta está vinculada con RogerBox físico. Ya puedes ver tus
              membresías y cursos.
            </p>
            <p className="mt-3 text-xs text-gray-500 dark:text-white/50">
              Redirigiendo al dashboard...
            </p>
          </div>
        </div>
      )}
      {showOtherEmailMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 sm:p-8 max-w-sm w-full border border-amber-500/40 shadow-xl text-center">
            <p className="text-gray-600 dark:text-white/80 text-sm mb-4">
              Tu cédula está registrada en RogerBox físico con otro correo. Para
              vincular tu cuenta, contacta a soporte{' '}
              <a
                href="https://wa.me/573002061711?text=Hola%20RogerBox.%20Reporto%3A%20Mi%20c%C3%A9dula%20est%C3%A1%20registrada%20en%20RogerBox%20con%20otro%20correo%20y%20quiero%20vincularla%20a%20esta%20cuenta."
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-medium text-amber-600 dark:text-amber-400"
              >
                3002061711
              </a>{' '}
              de RogerBox.
            </p>
            <button
              type="button"
              onClick={() => {
                setShowOtherEmailMessage(false);
                window.location.href = '/dashboard';
              }}
              className="bg-[#85ea10] hover:bg-[#7dd30f] text-black font-bold px-6 py-2.5 rounded-xl transition-colors"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
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
