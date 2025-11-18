'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Onboarding from '@/components/Onboarding';
import SimpleLoading from '@/components/SimpleLoading';
import { supabase } from '@/lib/supabase';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  height: number;
  weight: number;
  gender: string;
  birthYear?: number;
  goals: string[];
  target_weight: number | null;
  dietaryHabits?: string[];
  membership_status: string;
}

export default function OnboardingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);

  // Redirigir si no está autenticado
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

  const handleComplete = async (profile: any) => {
    if (!((session as any)?.user?.email) || !((session as any)?.user?.id)) {
      console.error('No hay sesión de usuario');
      return;
    }

    setIsUpdating(true);

    try {
      console.log('=== DEBUG ONBOARDING ===');
      console.log('Session user ID:', (session as any).user.id);
      console.log('Session user email:', (session as any).user.email);
      console.log('Profile data:', profile);
      console.log('========================');

      // Primero intentar actualizar el perfil existente
      const { data: existingProfile, error: selectError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', (session as any).user.id)
        .maybeSingle();

      if (selectError) {
        console.error('Error verificando perfil existente:', selectError);
        alert('Error al verificar el perfil. Intenta de nuevo.');
        return;
      }

      let error;
      if (existingProfile) {
        // Actualizar perfil existente
        console.log('Actualizando perfil existente...');
        const updateData: any = {
          name: profile.name || 'Usuario',
          height: profile.height,
          weight: profile.weight,
          gender: profile.gender,
          goals: profile.goals,
          updated_at: new Date().toISOString()
        };

        // Solo agregar campos si existen
        if (profile.birthYear) {
          updateData.birth_year = profile.birthYear;
        }
        if (profile.dietaryHabits && profile.dietaryHabits.length > 0) {
          updateData.dietary_habits = profile.dietaryHabits;
        }
        if (profile.targetWeight) {
          updateData.target_weight = profile.targetWeight;
        }

        const { error: updateError } = await supabase
          .from('profiles')
          .update(updateData)
          .eq('id', (session as any).user.id);
        error = updateError;
      } else {
        // Crear nuevo perfil
        console.log('Creando nuevo perfil...');
        const insertData: any = {
          id: (session as any).user.id,
          name: profile.name || 'Usuario',
          email: (session as any).user.email,
          height: profile.height,
          weight: profile.weight,
          gender: profile.gender,
          goals: profile.goals,
          membership_status: 'inactive',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        // Solo agregar campos si existen
        if (profile.birthYear) {
          insertData.birth_year = profile.birthYear;
        }
        if (profile.dietaryHabits && profile.dietaryHabits.length > 0) {
          insertData.dietary_habits = profile.dietaryHabits;
        }
        if (profile.targetWeight) {
          insertData.target_weight = profile.targetWeight;
        }

        const { error: insertError } = await supabase
          .from('profiles')
          .insert(insertData);
        error = insertError;
      }

      if (error) {
        console.error('Error guardando perfil:', error);
        alert('Error al guardar el perfil. Intenta de nuevo.');
        return;
      }

      console.log('Perfil guardado exitosamente');
      
      // Crear registro inicial de peso con la fecha/hora actual (opcional, no bloquea el flujo)
      const now = new Date();
      const today = now.toISOString().split('T')[0]; // YYYY-MM-DD para compatibilidad
      
      // Intentar guardar el registro de peso inicial (silenciosamente)
      // Si falla, no es crítico - el usuario puede agregarlo después desde el dashboard
      // Usar insert en lugar de upsert para permitir múltiples registros por día
      try {
        const { data: weightData, error: weightRecordError } = await supabase
          .from('weight_records')
          .insert({
            user_id: (session as any).user.id,
            weight: profile.weight,
            record_date: today,
            notes: 'Peso inicial del onboarding'
          })
          .select();
        
        if (weightRecordError) {
          // Solo loguear en modo desarrollo, no mostrar alerta al usuario
          if (process.env.NODE_ENV === 'development') {
            console.warn('⚠️ No se pudo crear registro inicial de peso (no crítico):', {
              error: weightRecordError,
              message: weightRecordError?.message,
              code: weightRecordError?.code,
              hint: 'Esto puede deberse a que la tabla weight_records no existe o falta configuración RLS'
            });
          }
        } else {
          console.log('✅ Registro inicial de peso creado:', profile.weight, 'kg');
        }
      } catch (weightError: any) {
        // Error silencioso - no crítico para el flujo
        if (process.env.NODE_ENV === 'development') {
          console.warn('⚠️ Error al guardar registro de peso (no crítico):', weightError?.message || weightError);
        }
      }
      
      // Intentar actualizar el peso en el perfil (también opcional)
      try {
        const { error: profileWeightError } = await supabase
          .from('profiles')
          .update({
            current_weight: profile.weight,
            last_weight_update: today
          })
          .eq('id', (session as any).user.id);
        
        if (profileWeightError) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('⚠️ No se pudo actualizar peso en perfil (no crítico):', profileWeightError?.message);
          }
        } else {
          console.log('✅ Peso actualizado en perfil');
        }
      } catch (profileError: any) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('⚠️ Error al actualizar peso en perfil (no crítico):', profileError?.message);
        }
      }
      
      // Redirigir al dashboard
      router.push('/dashboard');
      
    } catch (error) {
      console.error('Error inesperado:', error);
      alert('Error inesperado. Intenta de nuevo.');
    } finally {
      setIsUpdating(false);
    }
  };

  if (status === 'loading') {
    return <SimpleLoading message="Preparando tu experiencia..." size="lg" />;
  }

  if (status === 'unauthenticated') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <Onboarding 
        onComplete={handleComplete as any} 
        isUpdating={isUpdating}
        userName={session?.user?.name || 'Usuario'}
      />
    </div>
  );
}