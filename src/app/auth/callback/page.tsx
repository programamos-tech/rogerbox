'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase-browser';
import SimpleLoading from '@/components/SimpleLoading';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Obtener el hash de la URL (donde Supabase pone los tokens)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');

        if (accessToken && refreshToken) {
          // Establecer la sesión con los tokens
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            console.error('Error setting session:', error);
            router.push('/login?error=callback_error');
            return;
          }

          // Verificar si el usuario tiene perfil completo
          if (data.user) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('height, weight, gender')
              .eq('id', data.user.id)
              .maybeSingle();

            // Si no tiene perfil completo, redirigir a onboarding
            if (!profile || !profile.height || !profile.weight) {
              router.push('/onboarding');
            } else {
              router.push('/dashboard');
            }
          }
        } else {
          // No hay tokens, redirigir al login
          router.push('/login');
        }
      } catch (error) {
        console.error('Error in auth callback:', error);
        router.push('/login?error=callback_error');
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <SimpleLoading message="Completando autenticación..." size="lg" />
    </div>
  );
}

