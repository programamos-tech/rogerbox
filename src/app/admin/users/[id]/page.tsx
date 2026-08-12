'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { supabaseAdmin } from '@/lib/supabase';
import { UserDetailContent } from '@/shared/components/UserDetailContent';

function resolveAdminClientDisplayName(u: {
  full_name?: string | null;
  name?: string | null;
  gym_client_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
}): string {
  const full = typeof u.full_name === 'string' ? u.full_name.trim() : '';
  const n = typeof u.name === 'string' ? u.name.trim() : '';
  const gym = typeof u.gym_client_name === 'string' ? u.gym_client_name.trim() : '';
  const first = typeof u.first_name === 'string' ? u.first_name.trim() : '';
  const last = typeof u.last_name === 'string' ? u.last_name.trim() : '';
  const combined = [first, last].filter(Boolean).join(' ').trim();
  if (full) return full;
  if (n) return n;
  if (gym) return gym;
  if (combined) return combined;
  return 'Sin nombre';
}

const parseLocalDate = (dateStr: string): Date => {
  if (!dateStr) return new Date();
  const dateOnly = String(dateStr).slice(0, 10);
  const [y, m, d] = dateOnly.split('-').map(Number);
  if (!y || !m || !d) return new Date(dateStr);
  return new Date(y, m - 1, d);
};

function buildEditForm(user: any) {
  return {
    name: user.name || user.full_name || '',
    email: user.email || '',
    phone: user.phone || user.whatsapp || '',
    whatsapp: user.whatsapp || user.phone || '',
    document_id: user.document_id || '',
    document_type: user.document_type || 'CC',
    height: user.height || '',
    weight: user.weight || user.current_weight || '',
    current_weight: user.current_weight || user.weight || '',
    gender: user.gender || '',
    target_weight: user.target_weight || '',
    goals: Array.isArray(user.goals)
      ? user.goals
      : user.goals
        ? typeof user.goals === 'string'
          ? JSON.parse(user.goals)
          : user.goals
        : [],
    address: user.address || '',
    city: user.city || '',
    birth_date: user.birth_date || '',
    birth_year: user.birth_year || '',
    medical_restrictions: user.medical_restrictions || '',
  };
}

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user: authUser, loading: authLoading } = useSupabaseAuth();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [weightRecords, setWeightRecords] = useState<any[]>([]);
  const [loadingWeightRecords, setLoadingWeightRecords] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [cancellingMembershipId, setCancellingMembershipId] = useState<
    string | null
  >(null);
  const [showCancelMembershipModal, setShowCancelMembershipModal] =
    useState(false);
  const [membershipToCancel, setMembershipToCancel] = useState<any>(null);
  const [editingStartDateMembershipId, setEditingStartDateMembershipId] =
    useState<string | null>(null);
  const [newStartDate, setNewStartDate] = useState('');
  const [isUpdatingStartDate, setIsUpdatingStartDate] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const userId = params?.id as string;

  const isAdmin = useMemo(() => {
    if (!authUser) return false;
    const envId = process.env.NEXT_PUBLIC_ADMIN_USER_ID;
    const envEmail =
      process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'rogerbox@admin.com';
    const matchId = envId && authUser.id === envId;
    const matchEmail = envEmail && authUser.email === envEmail;
    const matchRole = authUser.user_metadata?.role === 'admin';
    return Boolean(matchId || matchEmail || matchRole);
  }, [authUser]);

  // Auth: no disparar fetch del cliente cuando solo cambia la ref de authUser
  useEffect(() => {
    if (authLoading) return;
    if (!authUser) {
      router.replace('/login');
      return;
    }
    if (!isAdmin) {
      router.replace('/dashboard');
    }
  }, [authLoading, authUser, isAdmin, router]);

  const openEditOnLoad = searchParams.get('edit') === 'true';

  const loadUserData = useCallback(
    async (opts?: { quiet?: boolean; signal?: AbortSignal }) => {
      const quiet = opts?.quiet === true;
      const controller = new AbortController();
      const onParentAbort = () => controller.abort();
      opts?.signal?.addEventListener('abort', onParentAbort);
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      try {
        if (!quiet) {
          setLoading(true);
        }
        setLoadError(null);

        const response = await fetch(`/api/admin/users/${userId}`, {
          signal: controller.signal,
        });
        const data = await response.json();

        if (controller.signal.aborted) return;

        if (response.ok && data.user) {
          const user = data.user;
          setUserData(user);
          setEditForm(buildEditForm(user));

          // Solo abrir edición en la carga completa inicial (?edit=true)
          if (openEditOnLoad && !quiet) {
            setIsEditing(true);
          }

          if (user.id && !user.isUnregisteredClient) {
            loadWeightRecords(user.id);
          }
        } else {
          setLoadError(data.error || 'Usuario no encontrado');
        }
      } catch (error: any) {
        if (error?.name === 'AbortError') return;
        setLoadError('No se pudo cargar el usuario. Intenta de nuevo.');
      } finally {
        clearTimeout(timeoutId);
        opts?.signal?.removeEventListener('abort', onParentAbort);
        if (!quiet) {
          setLoading(false);
        }
      }
    },
    [userId, openEditOnLoad],
  );

  // Carga inicial / cambio de cliente: una sola petición por userId
  useEffect(() => {
    if (authLoading || !isAdmin || !userId) return;

    const controller = new AbortController();
    void loadUserData({ signal: controller.signal });

    return () => {
      controller.abort();
    };
  }, [authLoading, isAdmin, userId, loadUserData]);

  const handleCancelEdit = () => {
    setIsEditing(false);
    setSaveError('');
    if (userData) {
      setEditForm(buildEditForm(userData));
    }
  };

  const loadWeightRecords = async (recordUserId: string) => {
    try {
      setLoadingWeightRecords(true);
      const { data, error } = await supabaseAdmin
        .from('weight_records')
        .select('weight, record_date, created_at, notes')
        .eq('user_id', recordUserId)
        .order('record_date', { ascending: false })
        .limit(30);

      if (!error && data) {
        setWeightRecords(data);
      }
    } catch {
      // ignore
    } finally {
      setLoadingWeightRecords(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError('');

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al actualizar usuario');
      }

      await loadUserData({ quiet: true });
      setIsEditing(false);
    } catch (error: any) {
      setSaveError(error.message || 'Error al guardar cambios');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setDeleteError('');

    try {
      const endpoint =
        userData.isUnregisteredClient || userData.gym_client_id
          ? `/api/admin/gym/clients/${userData.gym_client_id || userData.id}`
          : `/api/admin/users/${userId}`;

      const response = await fetch(endpoint, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al eliminar usuario');
      }

      router.push('/admin?tab=users');
    } catch (error: any) {
      setDeleteError(error.message || 'Error al eliminar usuario');
    } finally {
      setIsDeleting(false);
    }
  };

  const openCancelMembershipModal = (membership: any) => {
    setMembershipToCancel(membership);
    setShowCancelMembershipModal(true);
  };

  const handleCancelMembership = async () => {
    if (!membershipToCancel) return;

    setCancellingMembershipId(membershipToCancel.id);

    try {
      const response = await fetch(
        `/api/admin/gym/memberships/${membershipToCancel.id}`,
        {
          method: 'DELETE',
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al cancelar membresía');
      }

      setShowCancelMembershipModal(false);
      setMembershipToCancel(null);
      await loadUserData({ quiet: true });
    } catch (error: any) {
      alert(error.message || 'Error al cancelar membresía');
    } finally {
      setCancellingMembershipId(null);
    }
  };

  const handleStartEditStartDate = (membership: any) => {
    setEditingStartDateMembershipId(membership.id);
    const d = parseLocalDate(membership.start_date);
    const formattedDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    setNewStartDate(formattedDate);
  };

  const handleCancelEditStartDate = () => {
    setEditingStartDateMembershipId(null);
    setNewStartDate('');
  };

  const handleSaveStartDate = async (membershipId: string) => {
    if (!newStartDate) {
      alert('Por favor selecciona una fecha');
      return;
    }

    setIsUpdatingStartDate(true);

    try {
      const response = await fetch(
        `/api/admin/gym/memberships/${membershipId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            start_date: newStartDate,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al actualizar fecha de inicio');
      }

      await loadUserData({ quiet: true });
      setEditingStartDateMembershipId(null);
      setNewStartDate('');
    } catch (error: any) {
      alert(error.message || 'Error al actualizar fecha de inicio');
    } finally {
      setIsUpdatingStartDate(false);
    }
  };


  if (authLoading || loading) {
    return (
      <AdminLayout
        title="Cliente"
        description="Cargando…"
        activeTab="users"
      >
        <div className="flex justify-center py-20">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-[#85ea10] border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-[#164151]/70 dark:text-white/50">
              Cargando cliente…
            </span>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (loadError && !userData) {
    return (
      <AdminLayout
        title="Cliente"
        description="Error al cargar"
        activeTab="users"
      >
        <div className="text-center max-w-md mx-auto py-12">
          <p className="text-[#164151] dark:text-white mb-4">{loadError}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={() => {
                setLoadError(null);
                loadUserData();
              }}
              className="rounded-lg bg-[#85ea10] hover:bg-[#7dd30f] text-black font-semibold px-6 py-2.5"
            >
              Reintentar
            </button>
            <button
              type="button"
              onClick={() => router.push('/admin?tab=users')}
              className="rounded-lg bg-[#164151] text-white font-semibold px-6 py-2.5 hover:bg-[#1a4d5f]"
            >
              Volver al Admin
            </button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!userData) {
    return (
      <AdminLayout
        title="Cliente"
        description="No encontrado"
        activeTab="users"
      >
        <div className="text-center py-12">
          <p className="text-[#164151] dark:text-white mb-4">
            Cliente no encontrado
          </p>
          <button
            type="button"
            onClick={() => router.push('/admin?tab=users')}
            className="rounded-lg bg-[#164151] text-white font-semibold px-6 py-2.5 hover:bg-[#1a4d5f]"
          >
            Volver al Admin
          </button>
        </div>
      </AdminLayout>
    );
  }

  const displayName = resolveAdminClientDisplayName(userData);

  return (
    <AdminLayout
      title="Cliente"
      description={displayName}
      activeTab="users"
    >
      <UserDetailContent
        userData={userData}
        isSelf={false}
        isEditing={isEditing}
        setIsEditing={setIsEditing}
        editForm={editForm}
        setEditForm={setEditForm}
        handleSave={handleSave}
        saveError={saveError}
        isSaving={isSaving}
        onCancelEdit={handleCancelEdit}
        loadUserData={loadUserData}
        weightRecords={weightRecords}
        loadingWeightRecords={loadingWeightRecords}
        showDeleteModal={showDeleteModal}
        setShowDeleteModal={setShowDeleteModal}
        handleDelete={handleDelete}
        deleteError={deleteError}
        setDeleteError={setDeleteError}
        isDeleting={isDeleting}
        showCancelMembershipModal={showCancelMembershipModal}
        setShowCancelMembershipModal={setShowCancelMembershipModal}
        membershipToCancel={membershipToCancel}
        setMembershipToCancel={setMembershipToCancel}
        handleCancelMembership={handleCancelMembership}
        cancellingMembershipId={cancellingMembershipId}
        openCancelMembershipModal={openCancelMembershipModal}
        editingStartDateMembershipId={editingStartDateMembershipId}
        setEditingStartDateMembershipId={setEditingStartDateMembershipId}
        newStartDate={newStartDate}
        setNewStartDate={setNewStartDate}
        handleStartEditStartDate={handleStartEditStartDate}
        handleCancelEditStartDate={handleCancelEditStartDate}
        handleSaveStartDate={handleSaveStartDate}
        isUpdatingStartDate={isUpdatingStartDate}
      />
    </AdminLayout>
  );
}
