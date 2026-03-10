'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import DashboardNavbar from '@/components/DashboardNavbar';
import QuickLoading from '@/components/QuickLoading';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { supabase } from '@/lib/supabase';
import { UserDetailContent } from '@/shared/components/UserDetailContent';

/**
 * Mi Cuenta: misma vista que el detalle de usuario del admin,
 * usando el componente compartido UserDetailContent con isSelf=true.
 * La URL se mantiene en /profile.
 */
export default function ProfilePage() {
  const { user, loading: authLoading } = useSupabaseAuth();
  const router = useRouter();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [weightRecords, setWeightRecords] = useState<any[]>([]);
  const [loadingWeightRecords, setLoadingWeightRecords] = useState(false);

  const loadUserData = useCallback(async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      setLoadError(null);
      const response = await fetch(`/api/admin/users/${user.id}`);
      const data = await response.json();

      if (response.ok && data.user) {
        const u = data.user;
        setUserData(u);
        setEditForm({
          name: u.name || u.full_name || '',
          email: u.email || '',
          phone: u.phone || u.whatsapp || '',
          whatsapp: u.whatsapp || u.phone || '',
          document_id: u.document_id || '',
          document_type: u.document_type || 'CC',
          height: u.height || '',
          weight: u.weight || u.current_weight || '',
          current_weight: u.current_weight || u.weight || '',
          gender: u.gender || '',
          target_weight: u.target_weight || '',
          goals: Array.isArray(u.goals)
            ? u.goals
            : u.goals
              ? typeof u.goals === 'string'
                ? JSON.parse(u.goals)
                : u.goals
              : [],
          address: u.address || '',
          city: u.city || '',
          birth_date: u.birth_date || '',
          birth_year: u.birth_year || '',
          medical_restrictions: u.medical_restrictions || '',
          avatar_url: u.avatar_url || '',
        });
        if (u.id && !u.isUnregisteredClient) {
          loadWeightRecords(u.id);
        }
      } else {
        setLoadError(data.error || 'No se pudo cargar tu cuenta');
      }
    } catch (err: any) {
      setLoadError(err?.message || 'No se pudo cargar tu cuenta');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const loadWeightRecords = useCallback(async (userId: string) => {
    try {
      setLoadingWeightRecords(true);
      const { data, error } = await supabase
        .from('weight_records')
        .select('weight, record_date, created_at, notes')
        .eq('user_id', userId)
        .order('record_date', { ascending: false })
        .limit(30);
      if (!error && data) setWeightRecords(data);
    } catch {
      // ignore
    } finally {
      setLoadingWeightRecords(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/');
      return;
    }
    if (user?.id) loadUserData();
  }, [authLoading, user, router, loadUserData]);

  const handleSave = async () => {
    if (!user?.id) return;
    setIsSaving(true);
    setSaveError('');
    try {
      // Solo enviar nombre, correo y teléfono (la info fitness no es editable por el usuario)
      const payload = {
        name: (editForm.name ?? '').trim(),
        email: (editForm.email ?? '').trim() || null,
        phone: (editForm.phone ?? editForm.whatsapp ?? '').trim() || null,
      };
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Error al actualizar');
      await loadUserData();
      setIsEditing(false);
    } catch (err: any) {
      setSaveError(err.message || 'Error al guardar');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAvatar = async (avatarUrl: string) => {
    if (!user?.id) return;
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar_url: avatarUrl }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Error al actualizar');
      // Actualizar estado al instante con la nueva URL y updated_at (cache-bust)
      if (data?.avatar_url !== undefined || data?.updated_at !== undefined) {
        setUserData((prev: any) =>
          prev
            ? {
                ...prev,
                ...(data.avatar_url !== undefined && {
                  avatar_url: data.avatar_url,
                }),
                ...(data.updated_at !== undefined && {
                  updated_at: data.updated_at,
                }),
              }
            : prev,
        );
      }
      await loadUserData();
    } catch (err: any) {
      throw err;
    }
  };

  if (authLoading || (loading && !userData)) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-[#0a1628] flex items-center justify-center">
        <QuickLoading message="Cargando tu cuenta..." duration={800} />
      </div>
    );
  }

  if (!user) return null;

  if (loadError && !userData) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-[#0a1628] flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Error al cargar
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{loadError}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => {
                setLoadError(null);
                loadUserData();
              }}
              className="bg-[#85ea10] hover:bg-[#7dd30f] text-black font-semibold px-6 py-2.5 rounded-lg"
            >
              Reintentar
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold px-6 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Volver
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-[#0a1628] flex items-center justify-center">
        <QuickLoading message="Cargando tu cuenta..." duration={800} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-[#0a1628] flex flex-col">
      <DashboardNavbar notifications={[]} />

      <main className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto min-h-0">
          <UserDetailContent
            userData={userData}
            isSelf={true}
            isEditing={isEditing}
            setIsEditing={setIsEditing}
            editForm={editForm}
            setEditForm={setEditForm}
            handleSave={handleSave}
            saveError={saveError}
            loadUserData={loadUserData}
            weightRecords={weightRecords}
            loadingWeightRecords={loadingWeightRecords}
            onSaveAvatar={handleSaveAvatar}
            isSaving={isSaving}
            onCancelEdit={() => {
              setIsEditing(false);
              setSaveError('');
              loadUserData();
            }}
          />
        </div>
      </main>
    </div>
  );
}
