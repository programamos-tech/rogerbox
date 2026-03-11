'use client';

import {
  AlertTriangle,
  Ban,
  BookOpen,
  Calendar,
  CheckCircle,
  CreditCard,
  Dumbbell,
  Edit,
  FileText,
  Globe,
  LogOut,
  Mail,
  MapPin,
  MessageSquare,
  PenLine,
  Phone,
  Ruler,
  Scale,
  Target,
  Trash2,
  TrendingUp,
  User,
  X,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { formatDateOnlyLocal } from '@/lib/dateUtils';

function ProfilePhotoAndNameCard({
  avatarUrl,
  avatarUpdatedAt,
  userId,
  onSaveAvatar,
  userName,
  userEmail,
  userPhone,
  isEditing,
  editForm,
  setEditForm,
  saveError,
  isSaving = false,
  onCancelEdit,
  onEditClick,
  onSave,
  onLogout,
}: {
  avatarUrl: string | null | undefined;
  /** Para cache-busting: evita que el navegador muestre la imagen antigua tras actualizar */
  avatarUpdatedAt?: string | null;
  userId: string;
  onSaveAvatar: (url: string) => Promise<void>;
  userName: string;
  userEmail: string | null | undefined;
  userPhone: string | null | undefined;
  isEditing: boolean;
  editForm: any;
  setEditForm: (v: any) => void;
  saveError: string;
  /** Acciones: editar, guardar, cancelar, cerrar sesión (solo cuando isSelf) */
  isSaving?: boolean;
  onCancelEdit?: () => void;
  onEditClick?: () => void;
  onSave?: () => void;
  onLogout?: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const displayAvatarUrl =
    avatarUrl && avatarUrl.trim()
      ? `${avatarUrl}${avatarUrl.includes('?') ? '&' : '?'}v=${avatarUpdatedAt || ''}`
      : null;

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) {
      setError('Selecciona una imagen (JPG, PNG o WebP).');
      return;
    }
    setError('');
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', 'avatars');
      formData.append('folder', userId);
      formData.append('filename', 'avatar');
      const res = await fetch('/api/storage/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al subir');
      if (!data.url) throw new Error('No se recibió la URL');
      await onSaveAvatar(data.url);
    } catch (err: any) {
      setError(err?.message || 'Error al subir la foto');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="mb-6 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-white/10 p-6">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-6">
        <label
          htmlFor={`avatar-upload-${userId}`}
          className="relative self-center sm:self-auto flex-shrink-0 cursor-pointer group block"
          title={avatarUrl ? 'Actualizar foto' : 'Subir foto'}
        >
          <input
            id={`avatar-upload-${userId}`}
            type="file"
            accept="image/*"
            onChange={handleFile}
            disabled={uploading}
            className="sr-only"
          />
          <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden flex items-center justify-center ring-2 ring-transparent group-hover:ring-[#85ea10]/40 transition-all">
            {uploading ? (
              <div className="w-full h-full flex items-center justify-center bg-black/20 dark:bg-black/40">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#85ea10] border-t-transparent" />
              </div>
            ) : displayAvatarUrl ? (
              <img
                src={displayAvatarUrl}
                alt="Tu foto de perfil"
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-12 h-12 text-gray-400 dark:text-gray-500" />
            )}
          </div>
          {(avatarUrl || displayAvatarUrl) && !uploading && (
            <span
              className="absolute -bottom-0.5 -right-0.5 w-7 h-7 rounded-full bg-white dark:bg-gray-800 border-2 border-[#85ea10] text-[#85ea10] flex items-center justify-center shadow-sm"
              aria-hidden
            >
              <PenLine className="w-3.5 h-3.5" strokeWidth={2.2} />
            </span>
          )}
          {!avatarUrl && (
            <span className="mt-1.5 block text-center text-xs text-gray-500 dark:text-white/50 group-hover:text-[#85ea10] transition-colors">
              Subir foto
            </span>
          )}
        </label>
        <div className="flex-1 min-w-0 text-center sm:text-left w-full">
          {isEditing ? (
            <input
              type="text"
              value={editForm.name || ''}
              onChange={(e) =>
                setEditForm({ ...editForm, name: e.target.value })
              }
              placeholder="Tu nombre"
              className="w-full px-4 py-2.5 text-lg font-semibold bg-white dark:bg-gray-800 border border-gray-300 dark:border-white/20 rounded-xl text-[#164151] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#85ea10]/50"
            />
          ) : (
            <h2 className="text-xl font-bold text-[#164151] dark:text-white">
              {userName || 'Usuario'}
            </h2>
          )}
          {/* Datos personales: email y teléfono */}
          <div className="mt-3 space-y-1.5 text-sm">
            {isEditing ? (
              <>
                <div>
                  <label className="text-xs text-gray-500 dark:text-white/40 block mb-0.5">
                    Email
                  </label>
                  <input
                    type="email"
                    value={editForm.email || ''}
                    onChange={(e) =>
                      setEditForm({ ...editForm, email: e.target.value })
                    }
                    className="w-full px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-white/20 rounded-lg text-[#164151] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#85ea10]/50 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 dark:text-white/40 block mb-0.5">
                    Teléfono / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={editForm.phone || editForm.whatsapp || ''}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        phone: e.target.value,
                        whatsapp: e.target.value,
                      })
                    }
                    className="w-full px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-white/20 rounded-lg text-[#164151] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#85ea10]/50 text-sm"
                  />
                </div>
              </>
            ) : (
              <>
                <p className="text-gray-600 dark:text-white/80">
                  <Mail className="w-4 h-4 inline mr-1.5 text-gray-400 align-middle" />
                  {userEmail || 'No especificado'}
                </p>
                <p className="text-gray-600 dark:text-white/80">
                  <Phone className="w-4 h-4 inline mr-1.5 text-gray-400 align-middle" />
                  {userPhone || 'No especificado'}
                </p>
              </>
            )}
          </div>
          {(error || saveError) && (
            <p className="mt-2 text-sm text-red-500 dark:text-red-400">
              {error || saveError}
            </p>
          )}
        </div>
        {/* Botones a la derecha del card */}
        {onEditClick && onLogout && (
          <div className="flex flex-shrink-0 flex-col sm:border-l sm:border-gray-200 sm:dark:border-white/10 sm:pl-6 items-center sm:items-end justify-center gap-2">
            {isEditing ? (
              <>
                <button
                  type="button"
                  onClick={onCancelEdit}
                  className="text-sm text-gray-500 dark:text-white/50 hover:text-gray-700 dark:hover:text-white/80 transition-colors w-full sm:w-auto"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={onSave}
                  disabled={isSaving}
                  className="text-sm font-medium text-[#164151] dark:text-cyan-400 hover:underline disabled:opacity-50 transition-colors w-full sm:w-auto"
                >
                  {isSaving ? 'Guardando…' : 'Guardar'}
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={onEditClick}
                  className="text-sm text-gray-500 dark:text-white/50 hover:text-gray-700 dark:hover:text-white/80 transition-colors inline-flex items-center gap-1.5 w-full sm:w-auto justify-center sm:justify-end"
                  title="Editar perfil"
                >
                  <Edit className="w-3.5 h-3.5" />
                  Editar perfil
                </button>
                <button
                  type="button"
                  onClick={onLogout}
                  className="text-sm text-gray-500 dark:text-white/50 hover:text-gray-700 dark:hover:text-white/80 transition-colors inline-flex items-center gap-1.5 w-full sm:w-auto justify-center sm:justify-end"
                  title="Cerrar sesión"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Cerrar sesión
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const translateGoal = (goal: string): string => {
  const translations: Record<string, string> = {
    lose_weight: 'Bajar de peso',
    gain_muscle: 'Ganar músculo',
    improve_health: 'Mejorar salud',
    maintain_weight: 'Mantener peso',
    increase_endurance: 'Aumentar resistencia',
    flexibility: 'Flexibilidad',
    stress_relief: 'Reducir estrés',
    energy: 'Más energía',
    tone: 'Tonificar',
    endurance: 'Resistencia',
  };
  return translations[goal] || goal;
};

const parseLocalDate = (dateStr: string): Date => {
  if (!dateStr) return new Date();
  const dateOnly = String(dateStr).slice(0, 10);
  const [y, m, d] = dateOnly.split('-').map(Number);
  if (!y || !m || !d) return new Date(dateStr);
  return new Date(y, m - 1, d);
};

const formatGoals = (goals: string | string[] | null | undefined): string => {
  if (!goals) return 'No especificada';
  if (typeof goals === 'string') {
    try {
      const parsed = JSON.parse(goals);
      if (Array.isArray(parsed)) {
        return parsed.map(translateGoal).join(', ');
      }
    } catch {
      return translateGoal(goals);
    }
    return translateGoal(goals);
  }
  if (Array.isArray(goals)) {
    if (goals.length === 0) return 'No especificada';
    return goals.map(translateGoal).join(', ');
  }
  return 'No especificada';
};

export interface UserDetailContentProps {
  userData: any;
  isSelf: boolean;
  isEditing: boolean;
  setIsEditing: (v: boolean) => void;
  editForm: any;
  setEditForm: (v: any) => void;
  handleSave: () => void;
  saveError: string;
  loadUserData: () => Promise<void>;
  weightRecords: any[];
  loadingWeightRecords: boolean;
  /** Admin-only: omit when isSelf */
  showDeleteModal?: boolean;
  setShowDeleteModal?: (v: boolean) => void;
  handleDelete?: () => void;
  deleteError?: string;
  setDeleteError?: (value: string) => void;
  isDeleting?: boolean;
  showCancelMembershipModal?: boolean;
  setShowCancelMembershipModal?: (v: boolean) => void;
  membershipToCancel?: any;
  setMembershipToCancel?: (v: any) => void;
  handleCancelMembership?: () => void;
  cancellingMembershipId?: string | null;
  openCancelMembershipModal?: (membership: any) => void;
  editingStartDateMembershipId?: string | null;
  setEditingStartDateMembershipId?: (v: string | null) => void;
  newStartDate?: string;
  setNewStartDate?: (v: string) => void;
  handleStartEditStartDate?: (membership: any) => void;
  handleCancelEditStartDate?: () => void;
  handleSaveStartDate?: (membershipId: string) => Promise<void>;
  isUpdatingStartDate?: boolean;
  /** Cuando isSelf: guardar nueva URL de avatar tras subir foto */
  onSaveAvatar?: (avatarUrl: string) => Promise<void>;
  /** Cuando isSelf: guardando perfil (deshabilita Guardar) */
  isSaving?: boolean;
  /** Cuando isSelf: callback al cancelar edición */
  onCancelEdit?: () => void;
}

export function UserDetailContent({
  userData,
  isSelf,
  isEditing,
  setIsEditing,
  editForm,
  setEditForm,
  handleSave,
  saveError,
  loadUserData,
  weightRecords,
  loadingWeightRecords,
  showDeleteModal = false,
  setShowDeleteModal = () => {},
  handleDelete = () => {},
  deleteError = '',
  setDeleteError = () => {},
  isDeleting = false,
  showCancelMembershipModal = false,
  setShowCancelMembershipModal = () => {},
  membershipToCancel = null,
  setMembershipToCancel = () => {},
  handleCancelMembership = async () => {},
  cancellingMembershipId = null,
  openCancelMembershipModal = () => {},
  editingStartDateMembershipId = null,
  setEditingStartDateMembershipId = () => {},
  newStartDate = '',
  setNewStartDate = () => {},
  handleStartEditStartDate = () => {},
  handleCancelEditStartDate = () => {},
  handleSaveStartDate = async () => {},
  isUpdatingStartDate = false,
  onSaveAvatar,
  isSaving = false,
  onCancelEdit,
}: UserDetailContentProps) {
  const router = useRouter();

  return (
    <>
      <div className="flex-1 overflow-y-auto">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
          {/* Un solo card: foto + nombre (solo cuando el usuario ve su propio perfil) */}
          {isSelf && onSaveAvatar && (
            <ProfilePhotoAndNameCard
              avatarUrl={userData.avatar_url}
              avatarUpdatedAt={userData.updated_at}
              userId={userData.id}
              onSaveAvatar={onSaveAvatar}
              userName={
                userData.full_name?.trim() ||
                userData.name?.trim() ||
                (userData.first_name && userData.last_name
                  ? `${userData.first_name} ${userData.last_name}`.trim()
                  : '')
              }
              userEmail={userData.email}
              userPhone={userData.phone || userData.whatsapp}
              isEditing={isEditing}
              editForm={editForm}
              setEditForm={setEditForm}
              saveError={saveError}
              isSaving={isSaving}
              onCancelEdit={onCancelEdit}
              onEditClick={() => setIsEditing(true)}
              onSave={handleSave}
              onLogout={() => router.push('/signout')}
            />
          )}

          {/* Client Stats Dashboard - datos internos, no mostrar al usuario */}
          {!isSelf &&
            (() => {
              const memberships = userData.gym_memberships || [];
              const totalMemberships = memberships.filter(
                (m: any) => m.status !== 'cancelled',
              ).length;
              const totalPaid = memberships.reduce((sum: number, m: any) => {
                return sum + (m.payment?.amount || 0);
              }, 0);
              const lastPayment = memberships
                .filter((m: any) => m.payment?.payment_date)
                .sort(
                  (a: any, b: any) =>
                    new Date(b.payment.payment_date).getTime() -
                    new Date(a.payment.payment_date).getTime(),
                )[0];
              const averageTicket =
                totalMemberships > 0
                  ? Math.round(totalPaid / totalMemberships)
                  : 0;

              // Meses en RogerBox = meses transcurridos desde la primera membresía (no cantidad de productos)
              const sortedByStart = [...memberships]
                .filter((m: any) => m.start_date)
                .sort(
                  (a: any, b: any) =>
                    new Date(a.start_date).getTime() -
                    new Date(b.start_date).getTime(),
                );

              let monthsTraining = 0;
              if (sortedByStart.length > 0) {
                const firstStart = new Date(sortedByStart[0].start_date);
                const today = new Date();
                firstStart.setHours(0, 0, 0, 0);
                today.setHours(0, 0, 0, 0);
                let months =
                  (today.getFullYear() - firstStart.getFullYear()) * 12 +
                  (today.getMonth() - firstStart.getMonth());
                if (today.getDate() < firstStart.getDate()) months--;
                monthsTraining = Math.max(0, months);
              }

              // Preparar datos para la gráfica: una barra por día (sumando todos los pagos de ese día)
              const paymentsByDate = new Map<string, number>();
              memberships
                .filter(
                  (m: any) =>
                    m.payment?.payment_date && m.payment?.amount != null,
                )
                .forEach((m: any) => {
                  const dateStr = m.payment.payment_date;
                  const amount = Number(m.payment.amount);
                  paymentsByDate.set(
                    dateStr,
                    (paymentsByDate.get(dateStr) || 0) + amount,
                  );
                });
              const chartData = [...paymentsByDate.entries()]
                .sort(
                  ([a], [b]) => new Date(a).getTime() - new Date(b).getTime(),
                )
                .map(([dateStr, totalAmount]) => ({
                  date: formatDateOnlyLocal(
                    dateStr,
                    { day: 'numeric', month: 'short' },
                    'es-CO',
                  ),
                  weekday: formatDateOnlyLocal(
                    dateStr,
                    { weekday: 'long' },
                    'es-CO',
                  ),
                  amount: totalAmount,
                }));

              return (
                <div className="mb-6 space-y-4">
                  {/* Stats Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-white dark:bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-white/10 p-4 text-center">
                      <div className="text-2xl font-bold text-[#164151] dark:text-white">
                        {totalMemberships}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-white/50 flex items-center justify-center gap-1">
                        <CreditCard className="w-3 h-3" /> Membresías
                      </div>
                    </div>
                    <div className="bg-white dark:bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-white/10 p-4 text-center">
                      <div className="text-2xl font-bold text-[#164151] dark:text-white">
                        ${totalPaid.toLocaleString('es-CO')}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-white/50 flex items-center justify-center gap-1">
                        <TrendingUp className="w-3 h-3" /> Total Pagado
                      </div>
                    </div>
                    <div className="bg-white dark:bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-white/10 p-4 text-center">
                      <div className="text-2xl font-bold text-[#164151] dark:text-white">
                        {monthsTraining}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-white/50 flex items-center justify-center gap-1">
                        <Dumbbell className="w-3 h-3" /> Meses en RogerBox
                      </div>
                    </div>
                    <div className="bg-white dark:bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-white/10 p-4 text-center">
                      <div className="text-2xl font-bold text-[#164151] dark:text-white">
                        {lastPayment?.payment?.payment_date
                          ? formatDateOnlyLocal(
                              lastPayment.payment.payment_date,
                              { day: 'numeric', month: 'short' },
                              'es-CO',
                            )
                          : '-'}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-white/50 flex items-center justify-center gap-1">
                        <Calendar className="w-3 h-3" /> Último Pago
                      </div>
                    </div>
                  </div>

                  {/* Historial de pagos - barras simples (sin recharts para evitar error de build d3-array) */}
                  {chartData.length > 0 &&
                    (() => {
                      const amounts = chartData.map((d: { amount: number }) =>
                        Number(d.amount),
                      );
                      const maxAmount = Math.max(...amounts, 1);
                      return (
                        <div className="bg-white dark:bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-white/10 p-4">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-semibold text-gray-500 dark:text-white/50 flex items-center gap-2">
                              <TrendingUp className="w-4 h-4" /> Historial de
                              Pagos
                            </h3>
                          </div>
                          <div className="h-40 flex items-end gap-1">
                            {chartData.map(
                              (
                                d: {
                                  date: string;
                                  weekday: string;
                                  amount: number;
                                },
                                i: number,
                              ) => {
                                const value = Number(d.amount);
                                const pct =
                                  maxAmount > 0
                                    ? Math.max((value / maxAmount) * 100, 8)
                                    : 8;
                                return (
                                  <div
                                    key={i}
                                    className="flex-1 flex flex-col items-center gap-1 group relative min-w-0 self-stretch"
                                  >
                                    <div
                                      className="w-full flex-1 min-h-0 flex flex-col justify-end"
                                      style={{ minHeight: 0 }}
                                    >
                                      <div
                                        className="w-full rounded-t bg-[#85ea10]/30 hover:bg-[#85ea10]/50 transition-colors flex-shrink-0"
                                        style={{
                                          height: `${pct}%`,
                                          minHeight: '4px',
                                        }}
                                        title={`${d.date} (total): $${value.toLocaleString('es-CO')}`}
                                      />
                                    </div>
                                    <span className="text-[9px] text-gray-500 dark:text-white/50 truncate max-w-full flex-shrink-0 capitalize">
                                      {d.weekday}
                                    </span>
                                  </div>
                                );
                              },
                            )}
                          </div>
                          <div className="flex justify-between mt-1 text-[10px] text-gray-500 dark:text-white/50">
                            <span>$0</span>
                            <span>${(maxAmount / 1000).toFixed(0)}k</span>
                          </div>
                        </div>
                      );
                    })()}
                </div>
              );
            })()}

          <div
            className={`grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 ${userData.is_inactive ? 'opacity-75' : ''}`}
          >
            {/* Left Column - Información Personal y Fitness */}
            <div className="lg:col-span-2 space-y-4 md:space-y-6">
              {/* Estado y Tipo - datos internos, no mostrar al usuario */}
              {!isSelf && (
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-white/10 p-6">
                  <h2 className="text-sm font-semibold text-gray-500 dark:text-white/40 uppercase tracking-wider mb-4">
                    Estado del Cliente
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-white/40 mb-1">
                        Estado
                      </p>
                      <div>
                        {(() => {
                          // Si tiene membresía vencida, mostrar estado apropiado
                          if (
                            userData.hasGymMembership &&
                            !userData.hasActiveGymMembership
                          ) {
                            // Si está marcado como inactivo en la BD, mostrar "Inactivo"
                            if (userData.is_inactive) {
                              return (
                                <p className="text-sm font-medium text-[#164151] dark:text-white">
                                  <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400">
                                    <X className="w-5 h-5" />
                                    Inactivo
                                  </span>
                                </p>
                              );
                            }

                            // Siempre mostrar "Renovar" cuando está vencido (no importa cuántos días)
                            return (
                              <p className="text-sm font-medium text-[#164151] dark:text-white">
                                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400">
                                  <AlertTriangle className="w-5 h-5" />
                                  Renovar
                                </span>
                              </p>
                            );
                          }

                          if (
                            userData.hasActiveGymMembership ||
                            userData.hasOnlinePurchase
                          ) {
                            return (
                              <p className="text-sm font-medium text-[#164151] dark:text-white">
                                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#85ea10]/20 text-[#164151] dark:bg-[#85ea10]/30 dark:text-[#85ea10]">
                                  <CheckCircle className="w-5 h-5" />
                                  Al día
                                </span>
                              </p>
                            );
                          }

                          // Si no está registrado y no tiene membresías, mostrar "Nuevo cliente"
                          if (userData.isUnregisteredClient) {
                            return (
                              <p className="text-sm font-medium text-[#164151] dark:text-white">
                                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400">
                                  <User className="w-5 h-5" />
                                  Nuevo cliente
                                </span>
                              </p>
                            );
                          }

                          // Cliente registrado pero sin compras
                          return (
                            <p className="text-sm font-medium text-[#164151] dark:text-white">
                              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400">
                                <User className="w-5 h-5" />
                                Nuevo cliente
                              </span>
                            </p>
                          );
                        })()}
                      </div>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 dark:text-white/40 mb-1">
                        Tipo de Cliente
                      </p>
                      {(() => {
                        const hasGym =
                          (userData.gym_memberships?.length ?? 0) > 0;
                        const hasOnline =
                          (userData.course_purchases?.length ?? 0) > 0 ||
                          userData.hasOnlinePurchase;
                        const type: string =
                          userData.userType ??
                          (hasGym && hasOnline
                            ? 'both'
                            : hasGym
                              ? 'physical'
                              : hasOnline
                                ? 'online'
                                : 'none');
                        return (
                          <>
                            {type === 'both' && (
                              <p className="text-sm font-medium text-[#164151] dark:text-white">
                                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400">
                                  Físico + Online
                                </span>
                              </p>
                            )}
                            {type === 'physical' && (
                              <p className="text-sm font-medium text-[#164151] dark:text-white">
                                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400">
                                  <Dumbbell className="w-5 h-5" />
                                  Físico
                                </span>
                              </p>
                            )}
                            {type === 'online' && (
                              <p className="text-sm font-medium text-[#164151] dark:text-white">
                                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-100 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-400">
                                  <Globe className="w-5 h-5" />
                                  Online
                                </span>
                              </p>
                            )}
                            {type === 'none' && (
                              <p className="text-sm font-medium text-gray-400 dark:text-white/40">
                                -
                              </p>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Botón Inactivar/Activar - solo admin */}
                  {!isSelf && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-white/10">
                      {(() => {
                        const clientInfoId = userData.isUnregisteredClient
                          ? userData.id
                          : userData.client_info_id ||
                            userData.gym_memberships?.[0]?.client_info_id ||
                            null;

                        if (!clientInfoId) return null;

                        const isInactive = userData.is_inactive || false;

                        // Calcular si tiene planes vencidos (estado "Renovar")
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const allMemberships = userData.gym_memberships || [];
                        const activeMemberships = allMemberships.filter(
                          (m: any) => {
                            const endDate = new Date(m.end_date);
                            endDate.setHours(0, 0, 0, 0);
                            return endDate >= today && m.status !== 'cancelled';
                          },
                        );
                        const expiredMemberships = allMemberships.filter(
                          (m: any) => {
                            const endDate = new Date(m.end_date);
                            endDate.setHours(0, 0, 0, 0);
                            return endDate < today && m.status !== 'cancelled';
                          },
                        );

                        // Solo puede inactivarse si tiene estado "Renovar" (todos vencidos, sin activos, excluyendo cancelados)
                        const hasOnlyExpiredMemberships =
                          expiredMemberships.length > 0 &&
                          activeMemberships.length === 0;

                        const latestExpired =
                          expiredMemberships.length > 0
                            ? expiredMemberships.sort(
                                (a: any, b: any) =>
                                  new Date(b.end_date).getTime() -
                                  new Date(a.end_date).getTime(),
                              )[0]
                            : null;
                        const daysSinceExpired = latestExpired
                          ? Math.floor(
                              (today.getTime() -
                                new Date(latestExpired.end_date).getTime()) /
                                (1000 * 60 * 60 * 24),
                            )
                          : 0;
                        const hasExpiredMoreThan30Days = daysSinceExpired > 30;

                        // Botón Inactivar - solo si tiene estado "Renovar" (todos vencidos) y más de 30 días PERO NO está inactivo
                        if (
                          hasOnlyExpiredMemberships &&
                          hasExpiredMoreThan30Days &&
                          !isInactive
                        ) {
                          const handleInactivate = async () => {
                            if (
                              !confirm(
                                `¿Estás seguro de inactivar a ${userData.name || userData.full_name || 'este usuario'}?`,
                              )
                            ) {
                              return;
                            }

                            try {
                              const response = await fetch(
                                `/api/admin/gym/clients/${clientInfoId}/toggle-inactive`,
                                {
                                  method: 'PATCH',
                                  headers: {
                                    'Content-Type': 'application/json',
                                  },
                                  body: JSON.stringify({ is_inactive: true }),
                                },
                              );

                              if (!response.ok) {
                                throw new Error('Error al actualizar estado');
                              }

                              // Recargar datos del usuario usando la función existente
                              await loadUserData();
                            } catch (error) {
                              alert('Error al inactivar el usuario');
                            }
                          };

                          return (
                            <button
                              onClick={handleInactivate}
                              className="w-full px-4 py-2.5 rounded-lg bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-500/30 transition-colors flex items-center justify-center gap-2 text-sm font-semibold"
                              title="Inactivar usuario (30 días sin pagar)"
                            >
                              <Ban className="w-5 h-5" />
                              Inactivar Usuario
                            </button>
                          );
                        }

                        // Botón Activar - solo si está inactivo
                        if (isInactive) {
                          const handleActivate = async () => {
                            try {
                              const response = await fetch(
                                `/api/admin/gym/clients/${clientInfoId}/toggle-inactive`,
                                {
                                  method: 'PATCH',
                                  headers: {
                                    'Content-Type': 'application/json',
                                  },
                                  body: JSON.stringify({ is_inactive: false }),
                                },
                              );

                              if (!response.ok) {
                                throw new Error('Error al actualizar estado');
                              }

                              // Recargar datos del usuario usando la función existente
                              await loadUserData();
                            } catch (error) {
                              alert('Error al activar el usuario');
                            }
                          };

                          return (
                            <button
                              onClick={handleActivate}
                              className="w-full px-4 py-2.5 rounded-lg bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-500/30 transition-colors flex items-center justify-center gap-2 text-sm font-semibold"
                              title="Activar usuario"
                            >
                              <CheckCircle className="w-5 h-5" />
                              Activar Usuario
                            </button>
                          );
                        }

                        return null;
                      })()}
                    </div>
                  )}
                </div>
              )}

              {/* Información Personal - solo para vista admin (no mostrar al usuario en Mi cuenta) */}
              {!isSelf && (
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-white/10 p-6">
                  <h2 className="text-sm font-semibold text-gray-500 dark:text-white/40 uppercase tracking-wider mb-4">
                    Información Personal
                  </h2>
                  {saveError && (
                    <div className="mb-4 p-3 bg-red-50 dark:bg-red-500/20 border border-red-200 dark:border-red-500/30 rounded-lg">
                      <p className="text-sm text-red-600 dark:text-red-400">
                        {saveError}
                      </p>
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
                      <User className="w-5 h-5 text-gray-400" />
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 dark:text-white/40 mb-1">
                          Nombre completo
                        </p>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editForm.name || ''}
                            onChange={(e) =>
                              setEditForm({ ...editForm, name: e.target.value })
                            }
                            className="w-full px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-white/20 rounded-lg text-sm text-[#164151] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#85ea10]/50"
                          />
                        ) : (
                          <p className="text-sm font-medium text-[#164151] dark:text-white">
                            {userData.first_name && userData.last_name
                              ? `${userData.first_name} ${userData.last_name}`
                              : userData.name ||
                                userData.full_name ||
                                'No especificado'}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
                      <Mail className="w-5 h-5 text-gray-400" />
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 dark:text-white/40 mb-1">
                          Email
                        </p>
                        {isEditing ? (
                          <input
                            type="email"
                            value={editForm.email || ''}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                email: e.target.value,
                              })
                            }
                            className="w-full px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-white/20 rounded-lg text-sm text-[#164151] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#85ea10]/50"
                          />
                        ) : (
                          <p className="text-sm font-medium text-[#164151] dark:text-white">
                            {userData.email || 'No especificado'}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
                      <Phone className="w-5 h-5 text-gray-400" />
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 dark:text-white/40 mb-1">
                          Teléfono / WhatsApp
                        </p>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editForm.phone || editForm.whatsapp || ''}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                phone: e.target.value,
                                whatsapp: e.target.value,
                              })
                            }
                            className="w-full px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-white/20 rounded-lg text-sm text-[#164151] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#85ea10]/50"
                          />
                        ) : (
                          <p className="text-sm font-medium text-[#164151] dark:text-white">
                            {userData.phone ||
                              userData.whatsapp ||
                              'No especificado'}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
                      <CreditCard className="w-5 h-5 text-gray-400" />
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 dark:text-white/40 mb-1">
                          Documento
                        </p>
                        {isEditing ? (
                          <div className="flex gap-2">
                            <select
                              value={editForm.document_type || 'CC'}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  document_type: e.target.value,
                                })
                              }
                              className="px-2 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-white/20 rounded-lg text-sm text-[#164151] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#85ea10]/50"
                            >
                              <option value="CC">CC</option>
                              <option value="CE">CE</option>
                              <option value="TI">TI</option>
                              <option value="PA">PA</option>
                            </select>
                            <input
                              type="text"
                              value={editForm.document_id || ''}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  document_id: e.target.value,
                                })
                              }
                              disabled={userData.isUnregisteredClient}
                              className="flex-1 px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-white/20 rounded-lg text-sm text-[#164151] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#85ea10]/50 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
                            />
                          </div>
                        ) : (
                          <p className="text-sm font-medium text-[#164151] dark:text-white">
                            {userData.document_id
                              ? `${userData.document_type || 'CC'}: ${userData.document_id}`
                              : 'No especificado'}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Historial Clínico / Restricciones Médicas - solo admin */}
                    {!isSelf && (
                      <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-white/5 rounded-xl md:col-span-2">
                        <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-xs text-gray-500 dark:text-white/40 mb-1">
                            Historial Clínico / Restricciones Médicas
                          </p>
                          {isEditing ? (
                            <textarea
                              value={editForm.medical_restrictions || ''}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  medical_restrictions: e.target.value,
                                })
                              }
                              rows={3}
                              className="w-full px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-white/20 rounded-lg text-sm text-[#164151] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#85ea10]/50 resize-none"
                              placeholder="Restricciones médicas o historial clínico..."
                            />
                          ) : (
                            <p className="text-sm font-medium text-[#164151] dark:text-white">
                              {userData.medical_restrictions ||
                                'No especificado'}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {userData.address && !isEditing && (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
                        <MapPin className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500 dark:text-white/40">
                            Dirección
                          </p>
                          <p className="text-sm font-medium text-[#164151] dark:text-white">
                            {userData.address}
                            {userData.city ? `, ${userData.city}` : ''}
                          </p>
                        </div>
                      </div>
                    )}

                    {isEditing && (
                      <>
                        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
                          <MapPin className="w-5 h-5 text-gray-400" />
                          <div className="flex-1">
                            <p className="text-xs text-gray-500 dark:text-white/40 mb-1">
                              Dirección
                            </p>
                            <input
                              type="text"
                              value={editForm.address || ''}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  address: e.target.value,
                                })
                              }
                              className="w-full px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-white/20 rounded-lg text-sm text-[#164151] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#85ea10]/50"
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
                          <MapPin className="w-5 h-5 text-gray-400" />
                          <div className="flex-1">
                            <p className="text-xs text-gray-500 dark:text-white/40 mb-1">
                              Ciudad
                            </p>
                            <input
                              type="text"
                              value={editForm.city || ''}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  city: e.target.value,
                                })
                              }
                              className="w-full px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-white/20 rounded-lg text-sm text-[#164151] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#85ea10]/50"
                            />
                          </div>
                        </div>
                      </>
                    )}

                    {!isEditing &&
                      (userData.birth_date || userData.birth_year) && (
                        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
                          <Calendar className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="text-xs text-gray-500 dark:text-white/40">
                              Fecha de nacimiento
                            </p>
                            <p className="text-sm font-medium text-[#164151] dark:text-white">
                              {userData.birth_date
                                ? (() => {
                                    const birthDate = new Date(
                                      userData.birth_date,
                                    );
                                    const today = new Date();
                                    const age =
                                      today.getFullYear() -
                                      birthDate.getFullYear();
                                    const monthDiff =
                                      today.getMonth() - birthDate.getMonth();
                                    const dayDiff =
                                      today.getDate() - birthDate.getDate();
                                    const finalAge =
                                      monthDiff < 0 ||
                                      (monthDiff === 0 && dayDiff < 0)
                                        ? age - 1
                                        : age;
                                    return `${birthDate.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })} (${finalAge} años)`;
                                  })()
                                : userData.birth_year
                                  ? `${userData.birth_year} (${new Date().getFullYear() - userData.birth_year} años)`
                                  : 'No especificado'}
                            </p>
                          </div>
                        </div>
                      )}

                    {isEditing && (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
                        <Calendar className="w-5 h-5 text-gray-400" />
                        <div className="flex-1">
                          <p className="text-xs text-gray-500 dark:text-white/40 mb-1">
                            Fecha de nacimiento
                          </p>
                          <input
                            type="date"
                            value={
                              editForm.birth_date || editForm.birth_year
                                ? `${editForm.birth_year || new Date().getFullYear()}-01-01`
                                : ''
                            }
                            onChange={(e) => {
                              const year = e.target.value
                                ? new Date(e.target.value).getFullYear()
                                : '';
                              setEditForm({
                                ...editForm,
                                birth_date: e.target.value,
                                birth_year: year,
                              });
                            }}
                            className="w-full px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-white/20 rounded-lg text-sm text-[#164151] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#85ea10]/50"
                          />
                        </div>
                      </div>
                    )}

                    {!isSelf && (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
                        <Calendar className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500 dark:text-white/40">
                            Fecha de registro
                          </p>
                          <p className="text-sm font-medium text-[#164151] dark:text-white">
                            {new Date(userData.created_at).toLocaleDateString(
                              'es-ES',
                              {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              },
                            )}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Información Fitness - Mostrar para todos los usuarios */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-white/10 p-6">
                <h2 className="text-sm font-semibold text-gray-500 dark:text-white/40 uppercase tracking-wider mb-4">
                  Información Fitness
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
                    <Scale className="w-5 h-5 text-gray-400" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 dark:text-white/40 mb-1">
                        Peso actual
                      </p>
                      {isEditing && !isSelf ? (
                        <input
                          type="number"
                          step="0.1"
                          value={
                            editForm.current_weight || editForm.weight || ''
                          }
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              current_weight: e.target.value
                                ? parseFloat(e.target.value)
                                : '',
                              weight: e.target.value
                                ? parseFloat(e.target.value)
                                : '',
                            })
                          }
                          className="w-full px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-white/20 rounded-lg text-sm text-[#164151] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#85ea10]/50"
                          placeholder="kg"
                        />
                      ) : (
                        <p className="text-sm font-medium text-[#164151] dark:text-white">
                          {userData.current_weight || userData.weight
                            ? `${userData.current_weight || userData.weight} kg`
                            : 'No especificado'}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
                    <Target className="w-5 h-5 text-gray-400" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 dark:text-white/40 mb-1">
                        Peso objetivo
                      </p>
                      {isEditing && !isSelf ? (
                        <input
                          type="number"
                          step="0.1"
                          value={editForm.target_weight || ''}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              target_weight: e.target.value
                                ? parseFloat(e.target.value)
                                : null,
                            })
                          }
                          className="w-full px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-white/20 rounded-lg text-sm text-[#164151] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#85ea10]/50"
                          placeholder="kg"
                        />
                      ) : (
                        <p className="text-sm font-medium text-[#164151] dark:text-white">
                          {userData.target_weight
                            ? `${userData.target_weight} kg`
                            : 'No especificado'}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
                    <Ruler className="w-5 h-5 text-gray-400" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 dark:text-white/40 mb-1">
                        Altura
                      </p>
                      {isEditing && !isSelf ? (
                        <input
                          type="number"
                          value={editForm.height || ''}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              height: e.target.value
                                ? parseInt(e.target.value)
                                : null,
                            })
                          }
                          className="w-full px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-white/20 rounded-lg text-sm text-[#164151] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#85ea10]/50"
                          placeholder="cm"
                        />
                      ) : (
                        <p className="text-sm font-medium text-[#164151] dark:text-white">
                          {userData.height
                            ? `${userData.height} cm`
                            : 'No especificada'}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
                    <User className="w-5 h-5 text-gray-400" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 dark:text-white/40 mb-1">
                        Género
                      </p>
                      {isEditing && !isSelf ? (
                        <select
                          value={editForm.gender || ''}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              gender: e.target.value,
                            })
                          }
                          className="w-full px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-white/20 rounded-lg text-sm text-[#164151] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#85ea10]/50"
                        >
                          <option value="">Seleccionar</option>
                          <option value="male">Masculino</option>
                          <option value="female">Femenino</option>
                          <option value="other">Otro</option>
                        </select>
                      ) : (
                        <p className="text-sm font-medium text-[#164151] dark:text-white">
                          {userData.gender === 'male'
                            ? 'Masculino'
                            : userData.gender === 'female'
                              ? 'Femenino'
                              : userData.gender === 'other'
                                ? 'Otro'
                                : 'No especificado'}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-white/5 rounded-xl md:col-span-2">
                    <Target className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 dark:text-white/40 mb-1">
                        Metas
                      </p>
                      {isEditing && !isSelf ? (
                        <div className="flex flex-wrap gap-2">
                          {[
                            'lose_weight',
                            'gain_muscle',
                            'improve_health',
                            'maintain_weight',
                            'increase_endurance',
                            'flexibility',
                            'tone',
                            'endurance',
                          ].map((goal) => (
                            <label
                              key={goal}
                              className="flex items-center gap-2 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={
                                  Array.isArray(editForm.goals) &&
                                  editForm.goals.includes(goal)
                                }
                                onChange={(e) => {
                                  const currentGoals = Array.isArray(
                                    editForm.goals,
                                  )
                                    ? editForm.goals
                                    : [];
                                  if (e.target.checked) {
                                    setEditForm({
                                      ...editForm,
                                      goals: [...currentGoals, goal],
                                    });
                                  } else {
                                    setEditForm({
                                      ...editForm,
                                      goals: currentGoals.filter(
                                        (g: string) => g !== goal,
                                      ),
                                    });
                                  }
                                }}
                                className="rounded border-gray-300 text-[#85ea10] focus:ring-[#85ea10]"
                              />
                              <span className="text-xs text-[#164151] dark:text-white">
                                {translateGoal(goal)}
                              </span>
                            </label>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm font-medium text-[#164151] dark:text-white">
                          {formatGoals(userData.goals || userData.goal)}
                        </p>
                      )}
                    </div>
                  </div>

                  {userData.dietary_habits &&
                    userData.dietary_habits.length > 0 &&
                    !isEditing && (
                      <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-white/5 rounded-xl md:col-span-2">
                        <BookOpen className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-xs text-gray-500 dark:text-white/40">
                            Hábitos alimenticios
                          </p>
                          <p className="text-sm font-medium text-[#164151] dark:text-white">
                            {userData.dietary_habits.join(', ')}
                          </p>
                        </div>
                      </div>
                    )}

                  {/* Estadísticas de actividad */}
                  {!isEditing && (
                    <div className="grid grid-cols-2 gap-3 md:col-span-2">
                      <div className="p-4 bg-gray-100 dark:bg-white/10 rounded-xl text-center">
                        <p className="text-2xl font-bold text-[#164151] dark:text-white">
                          {userData.streak_days || 0}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-white/40">
                          Días de racha
                        </p>
                      </div>
                      <div className="p-4 bg-blue-500/10 rounded-xl text-center">
                        <p className="text-2xl font-bold text-blue-500">
                          {userData.weight_progress_percentage || 0}%
                        </p>
                        <p className="text-xs text-gray-500 dark:text-white/40">
                          Progreso peso
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Productos y Negocio */}
            <div className="space-y-6">
              {/* Productos Activos - Solo para usuarios "Al día" o "Parcial" */}
              {(() => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                // Filtrar membresías activas (vigentes o programadas/futuras)
                const activeMemberships = (
                  userData.gym_memberships || []
                ).filter((membership: any) => {
                  const endDate = parseLocalDate(membership.end_date);
                  // Incluir si: no está cancelada Y (fecha fin >= hoy O es membresía futura)
                  return membership.status !== 'cancelled' && endDate >= today;
                });

                // Verificar si tiene cursos activos
                const hasActiveCourses =
                  userData.activeCoursePurchases &&
                  userData.activeCoursePurchases.length > 0;

                const hasActiveProducts =
                  activeMemberships.length > 0 || hasActiveCourses;

                return (
                  <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-white/10 p-6">
                    <h2 className="text-sm font-semibold text-gray-500 dark:text-white/40 uppercase tracking-wider mb-4">
                      Productos Activos
                    </h2>
                    <div className="space-y-3">
                      {!hasActiveProducts ? (
                        <p className="text-sm text-gray-500 dark:text-white/50 py-4">
                          No tienes productos activos (membresías ni cursos en
                          línea).
                        </p>
                      ) : (
                        <>
                          {/* Membresías activas y programadas */}
                          {activeMemberships
                            .sort(
                              (a: any, b: any) =>
                                new Date(a.start_date).getTime() -
                                new Date(b.start_date).getTime(),
                            )
                            .map((membership: any) => {
                              // Determinar si es membresía actual o programada (pago anticipado)
                              const startDate = parseLocalDate(
                                membership.start_date,
                              );
                              const isScheduled = startDate > today;

                              return (
                                <div
                                  key={membership.id}
                                  className={`p-4 rounded-xl border ${
                                    isScheduled
                                      ? 'bg-cyan-50 dark:bg-cyan-500/10 border-cyan-200 dark:border-cyan-500/20'
                                      : 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10'
                                  }`}
                                >
                                  <div className="flex items-center gap-3 mb-3">
                                    <div
                                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                        isScheduled
                                          ? 'bg-cyan-100 dark:bg-cyan-500/20'
                                          : 'bg-[#85ea10]/30 dark:bg-[#85ea10]/40'
                                      }`}
                                    >
                                      <Dumbbell
                                        className={`w-5 h-5 ${
                                          isScheduled
                                            ? 'text-cyan-600 dark:text-cyan-400'
                                            : 'text-[#164151] dark:text-[#85ea10]'
                                        }`}
                                      />
                                    </div>
                                    <div className="flex-1">
                                      <div className="flex items-center justify-between mb-1">
                                        <p className="text-sm font-medium text-[#164151] dark:text-white">
                                          {membership.plan?.name || 'Plan'}
                                        </p>
                                        <div className="flex items-center gap-2">
                                          <span
                                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                              isScheduled
                                                ? 'bg-cyan-100 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-400'
                                                : 'bg-[#85ea10]/30 text-[#164151] dark:bg-[#85ea10]/30 dark:text-[#85ea10]'
                                            }`}
                                          >
                                            {isScheduled ? 'Próximo' : 'Al día'}
                                          </span>
                                          {!isSelf && (
                                            <button
                                              onClick={() =>
                                                openCancelMembershipModal(
                                                  membership,
                                                )
                                              }
                                              disabled={
                                                cancellingMembershipId ===
                                                membership.id
                                              }
                                              className="p-1 rounded-lg text-red-500 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors disabled:opacity-50"
                                              title="Cancelar membresía"
                                            >
                                              {cancellingMembershipId ===
                                              membership.id ? (
                                                <div className="w-4 h-4 border-2 border-red-300 border-t-red-500 rounded-full animate-spin" />
                                              ) : (
                                                <X className="w-4 h-4" />
                                              )}
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                      <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                          {!isSelf &&
                                          editingStartDateMembershipId ===
                                            membership.id ? (
                                            <div className="flex items-center gap-2 flex-1">
                                              <span className="text-xs text-gray-500 dark:text-white/50">
                                                Inicia:
                                              </span>
                                              <input
                                                type="date"
                                                value={newStartDate}
                                                onChange={(e) =>
                                                  setNewStartDate(
                                                    e.target.value,
                                                  )
                                                }
                                                className="px-2 py-1 text-xs rounded-lg border border-gray-300 dark:border-white/20 bg-white dark:bg-gray-800 text-[#164151] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#164151]/50"
                                                disabled={isUpdatingStartDate}
                                              />
                                              <button
                                                onClick={() =>
                                                  handleSaveStartDate(
                                                    membership.id,
                                                  )
                                                }
                                                disabled={isUpdatingStartDate}
                                                className="px-2 py-1 text-xs bg-[#85ea10] text-[#164151] rounded-lg hover:bg-[#85ea10]/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                title="Guardar fecha"
                                              >
                                                {isUpdatingStartDate
                                                  ? '...'
                                                  : '✓'}
                                              </button>
                                              <button
                                                onClick={
                                                  handleCancelEditStartDate
                                                }
                                                disabled={isUpdatingStartDate}
                                                className="px-2 py-1 text-xs bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-white/20 transition-colors disabled:opacity-50"
                                                title="Cancelar"
                                              >
                                                ✕
                                              </button>
                                            </div>
                                          ) : (
                                            <>
                                              <p className="text-xs text-gray-500 dark:text-white/50">
                                                Inicia:{' '}
                                                {parseLocalDate(
                                                  membership.start_date,
                                                ).toLocaleDateString('es-ES', {
                                                  day: '2-digit',
                                                  month: 'long',
                                                  year: 'numeric',
                                                })}
                                              </p>
                                              {!isSelf && (
                                                <button
                                                  onClick={() =>
                                                    handleStartEditStartDate(
                                                      membership,
                                                    )
                                                  }
                                                  className="p-1.5 rounded-lg text-[#164151] dark:text-white hover:bg-[#164151]/10 dark:hover:bg-white/10 transition-colors border border-transparent hover:border-[#164151]/20 dark:hover:border-white/20"
                                                  title="Editar fecha de inicio"
                                                >
                                                  <Edit className="w-4 h-4" />
                                                </button>
                                              )}
                                            </>
                                          )}
                                        </div>
                                        <p
                                          className={`text-xs ${isScheduled ? 'text-cyan-600 dark:text-cyan-400' : 'text-gray-500 dark:text-white/50'}`}
                                        >
                                          Vence:{' '}
                                          {parseLocalDate(
                                            membership.end_date,
                                          ).toLocaleDateString('es-ES', {
                                            day: '2-digit',
                                            month: 'long',
                                            year: 'numeric',
                                          })}
                                        </p>
                                      </div>
                                      {membership.payment?.invoice_number && (
                                        <p className="text-xs font-medium text-[#164151] dark:text-white mt-1">
                                          Factura: #
                                          {membership.payment.invoice_number}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}

                          {/* Cursos activos */}
                          {hasActiveCourses && (
                            <div className="space-y-3">
                              <p className="text-xs font-medium text-gray-500 dark:text-white/50 uppercase tracking-wider">
                                Cursos en línea activos
                              </p>
                              {userData.activeCoursePurchases.map(
                                (purchase: any) => (
                                  <div
                                    key={purchase.id}
                                    className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10"
                                  >
                                    <div className="w-10 h-10 rounded-lg bg-cyan-500/20 dark:bg-cyan-400/20 flex items-center justify-center flex-shrink-0">
                                      <BookOpen className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-[#164151] dark:text-white">
                                        {purchase.course?.title || 'Curso'}
                                      </p>
                                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-gray-500 dark:text-white/50">
                                        {purchase.access_granted_at && (
                                          <span>
                                            Acceso:{' '}
                                            {formatDateOnlyLocal(
                                              String(
                                                purchase.access_granted_at,
                                              ).slice(0, 10),
                                              {
                                                day: 'numeric',
                                                month: 'short',
                                                year: 'numeric',
                                              },
                                              'es-CO',
                                            )}
                                          </span>
                                        )}
                                        {purchase.purchase_price != null &&
                                          Number(purchase.purchase_price) >
                                            0 && (
                                            <span>
                                              $
                                              {Number(
                                                purchase.purchase_price,
                                              ).toLocaleString('es-CO')}
                                            </span>
                                          )}
                                      </div>
                                      {isSelf && (
                                        <a
                                          href="/student"
                                          className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-cyan-600 dark:text-cyan-400 hover:underline"
                                        >
                                          Ver clases →
                                        </a>
                                      )}
                                    </div>
                                  </div>
                                ),
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Planes que necesitan renovación */}
              {(() => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                // Filtrar membresías vencidas (excluir canceladas) que aún no tienen renovación
                const expiredMemberships = (
                  userData.gym_memberships || []
                ).filter((membership: any) => {
                  const endDate = parseLocalDate(membership.end_date);
                  if (endDate >= today || membership.status === 'cancelled')
                    return false;
                  // No mostrar en "necesitan renovación" si ya renovó (tiene otra membresía activa o próxima del mismo plan)
                  const hasRenewedSamePlan = (
                    userData.gym_memberships || []
                  ).some(
                    (m: any) =>
                      m.id !== membership.id &&
                      m.plan_id === membership.plan_id &&
                      m.status !== 'cancelled' &&
                      parseLocalDate(m.end_date) >= today,
                  );
                  return !hasRenewedSamePlan;
                });

                if (expiredMemberships.length === 0) {
                  return null;
                }

                return (
                  <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-white/10 p-6">
                    <h2 className="text-sm font-semibold text-gray-500 dark:text-white/40 uppercase tracking-wider mb-4">
                      Planes que necesitan renovación
                    </h2>
                    <div className="space-y-3">
                      {expiredMemberships
                        .sort(
                          (a: any, b: any) =>
                            new Date(b.end_date).getTime() -
                            new Date(a.end_date).getTime(),
                        )
                        .map((membership: any) => {
                          const endDate = parseLocalDate(membership.end_date);

                          return (
                            <div
                              key={membership.id}
                              className="p-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10"
                            >
                              <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-slate-100 dark:bg-slate-500/20">
                                  <Dumbbell className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center justify-between mb-1">
                                    <p className="text-sm font-medium text-[#164151] dark:text-white">
                                      {membership.plan?.name || 'Plan'}
                                    </p>
                                    <div className="flex items-center gap-2">
                                      {(() => {
                                        // Solo mostrar "Inactivo" si el usuario está marcado como inactivo en la BD
                                        if (userData.is_inactive) {
                                          return (
                                            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400">
                                              Inactivo
                                            </span>
                                          );
                                        }

                                        // Si no está inactivo, siempre mostrar "Renovar"
                                        return (
                                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400">
                                            Renovar
                                          </span>
                                        );
                                      })()}
                                      {!isSelf &&
                                        membership.status !== 'cancelled' && (
                                          <button
                                            onClick={() =>
                                              openCancelMembershipModal(
                                                membership,
                                              )
                                            }
                                            disabled={
                                              cancellingMembershipId ===
                                              membership.id
                                            }
                                            className="p-1 rounded-lg text-red-500 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors disabled:opacity-50"
                                            title="Cancelar membresía"
                                          >
                                            {cancellingMembershipId ===
                                            membership.id ? (
                                              <div className="w-4 h-4 border-2 border-red-300 border-t-red-500 rounded-full animate-spin" />
                                            ) : (
                                              <X className="w-4 h-4" />
                                            )}
                                          </button>
                                        )}
                                    </div>
                                  </div>
                                  <p className="text-xs text-gray-500 dark:text-white/50">
                                    Venció:{' '}
                                    {parseLocalDate(
                                      membership.end_date,
                                    ).toLocaleDateString('es-ES', {
                                      day: '2-digit',
                                      month: 'long',
                                      year: 'numeric',
                                    })}
                                  </p>
                                  {membership.payment?.invoice_number && (
                                    <p className="text-xs font-medium text-[#164151] dark:text-white mt-1">
                                      Factura: #
                                      {membership.payment.invoice_number}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-white/10 space-y-2">
                                {/* Botón Invitar a renovar (WhatsApp) - solo admin */}
                                {!isSelf &&
                                (userData.whatsapp || userData.phone) ? (
                                  (() => {
                                    const planName =
                                      membership.plan?.name || 'tu plan';
                                    const endDateFormatted = parseLocalDate(
                                      membership.end_date,
                                    ).toLocaleDateString('es-ES', {
                                      day: '2-digit',
                                      month: 'long',
                                      year: 'numeric',
                                    });

                                    const handleRenew = () => {
                                      const clientName =
                                        userData.name ||
                                        userData.full_name ||
                                        'Cliente';
                                      const whatsappNumber = (
                                        userData.whatsapp ||
                                        userData.phone ||
                                        ''
                                      ).replace(/\D/g, '');

                                      if (!whatsappNumber) return;

                                      const message = encodeURIComponent(
                                        `Hola ${clientName}, tu plan "${planName}" finalizó el ${endDateFormatted}. ¿Deseas renovar tu membresía para continuar?`,
                                      );

                                      const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${message}`;
                                      window.open(whatsappUrl, '_blank');
                                    };

                                    return (
                                      <button
                                        onClick={handleRenew}
                                        className="w-full px-4 py-2 rounded-lg bg-[#85ea10]/20 dark:bg-[#85ea10]/30 text-[#164151] dark:text-[#85ea10] hover:bg-[#85ea10]/30 dark:hover:bg-[#85ea10]/40 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                                      >
                                        <MessageSquare className="w-4 h-4" />
                                        Invitar a renovar
                                      </button>
                                    );
                                  })()
                                ) : (
                                  <p className="text-xs text-gray-400 dark:text-white/40 text-center">
                                    No hay número de contacto disponible
                                  </p>
                                )}

                                {/* Botón Registrar Pago - solo admin */}
                                {!isSelf &&
                                  (() => {
                                    // Obtener el client_info_id correcto
                                    let clientInfoId: string | null = null;

                                    if (userData.isUnregisteredClient) {
                                      // Cliente físico sin registro online
                                      clientInfoId = userData.id;
                                    } else {
                                      // Usuario registrado: usar client_info_id de la membresía o del userData
                                      clientInfoId =
                                        membership.client_info_id ||
                                        userData.client_info_id ||
                                        userData.gym_memberships?.[0]
                                          ?.client_info_id ||
                                        null;
                                    }

                                    const planId = membership.plan?.id || null;

                                    if (!clientInfoId) {
                                      return (
                                        <p className="text-xs text-gray-400 dark:text-white/40 text-center">
                                          No se puede registrar pago: falta
                                          información del cliente
                                        </p>
                                      );
                                    }

                                    const handleRegisterPayment = () => {
                                      router.push(
                                        `/admin?tab=gym-payments&clientId=${clientInfoId}${planId ? `&planId=${planId}` : ''}`,
                                      );
                                    };

                                    return (
                                      <button
                                        onClick={handleRegisterPayment}
                                        className="w-full px-4 py-2 rounded-lg bg-[#164151] dark:bg-white text-white dark:text-[#164151] hover:bg-[#1a4d5f] dark:hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 text-sm font-semibold"
                                      >
                                        <CreditCard className="w-4 h-4" />
                                        Registrar Pago
                                      </button>
                                    );
                                  })()}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                );
              })()}

              {/* Historial de Facturación - siempre visible */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-white/10 p-6">
                <h2 className="text-sm font-semibold text-gray-500 dark:text-white/40 uppercase tracking-wider mb-4">
                  Historial de Facturación
                </h2>
                <div className="space-y-3">
                  {!userData.gym_memberships ||
                  userData.gym_memberships.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-white/50 py-4">
                      No tienes facturas registradas.
                    </p>
                  ) : (
                    userData.gym_memberships
                      .sort(
                        (a: any, b: any) =>
                          new Date(b.end_date).getTime() -
                          new Date(a.end_date).getTime(),
                      )
                      .map((membership: any) => {
                        // Verificar dinámicamente si está vencida
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const endDate = parseLocalDate(membership.end_date);
                        const isExpired = endDate < today;
                        const isActive =
                          !isExpired && membership.status === 'active';

                        return (
                          <div
                            key={membership.id}
                            className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-sm font-medium text-[#164151] dark:text-white">
                                {membership.plan?.name || 'Plan'}
                              </p>
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                  isActive
                                    ? 'bg-[#85ea10]/20 text-[#164151] dark:bg-[#85ea10]/30 dark:text-[#85ea10]'
                                    : isExpired
                                      ? 'bg-slate-100 dark:bg-slate-500/20 text-slate-700 dark:text-slate-400'
                                      : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-white/60'
                                }`}
                              >
                                {isActive
                                  ? 'Al día'
                                  : isExpired
                                    ? 'Finalizada'
                                    : membership.status === 'cancelled'
                                      ? 'Cancelada'
                                      : membership.status === 'courtesy'
                                        ? 'Cortesía'
                                        : membership.status}
                              </span>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs text-gray-500 dark:text-white/50">
                                {isExpired ? 'Venció' : 'Vence'}:{' '}
                                {parseLocalDate(
                                  membership.end_date,
                                ).toLocaleDateString('es-ES', {
                                  day: '2-digit',
                                  month: 'long',
                                  year: 'numeric',
                                })}
                              </p>
                              {membership.payment?.invoice_number ? (
                                <p className="text-xs font-medium text-[#164151] dark:text-white">
                                  Factura: #{membership.payment.invoice_number}
                                </p>
                              ) : null}
                            </div>
                          </div>
                        );
                      })
                  )}
                </div>
              </div>

              {/* Cursos */}
              {userData.course_purchases &&
                userData.course_purchases.length > 0 && (
                  <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-white/10 p-6">
                    <h2 className="text-sm font-semibold text-gray-500 dark:text-white/40 uppercase tracking-wider mb-4">
                      Historial de Cursos
                    </h2>
                    <div className="space-y-3">
                      {userData.course_purchases.map((purchase: any) => (
                        <div
                          key={purchase.id}
                          className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10"
                        >
                          <p className="text-sm font-medium text-[#164151] dark:text-white">
                            {purchase.course?.title || 'Curso'}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-white/50">
                            {purchase.is_course_finished ? (
                              <span>Finalizado</span>
                            ) : purchase.is_active ? (
                              <span className="text-[#85ea10]">Activo</span>
                            ) : (
                              <span>Completado</span>
                            )}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Confirmación de Eliminación */}
      {!isSelf && showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-white/10 w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#164151] dark:text-white">
                  Eliminar Usuario
                </h3>
                <p className="text-sm text-gray-500 dark:text-white/50">
                  Esta acción no se puede deshacer
                </p>
              </div>
            </div>

            <p className="text-[#164151] dark:text-white/80 mb-4">
              ¿Estás seguro de que deseas eliminar a{' '}
              <strong>
                {userData?.name || userData?.full_name || 'este usuario'}
              </strong>
              ?
            </p>

            {userData?.hasActiveGymMembership && (
              <div className="mb-4 p-3 bg-orange-100 dark:bg-orange-500/20 rounded-lg border border-orange-200 dark:border-orange-500/30">
                <p className="text-sm text-orange-700 dark:text-orange-400 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Este usuario tiene membresías activas. No se puede eliminar.
                </p>
              </div>
            )}

            {deleteError && (
              <div className="mb-4 p-3 bg-red-100 dark:bg-red-500/20 rounded-lg border border-red-200 dark:border-red-500/30">
                <p className="text-sm text-red-700 dark:text-red-400">
                  {deleteError}
                </p>
              </div>
            )}

            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteError('');
                }}
                className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-[#164151] dark:text-white font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting || userData?.hasActiveGymMembership}
                className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-semibold transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Eliminando...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Eliminar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Cancelar Membresía */}
      {!isSelf && showCancelMembershipModal && membershipToCancel && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-white/10 w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-500/20 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#164151] dark:text-white">
                  Cancelar Membresía
                </h3>
                <p className="text-sm text-gray-500 dark:text-white/50">
                  Esta acción no se puede deshacer
                </p>
              </div>
            </div>

            <p className="text-[#164151] dark:text-white/80 mb-4">
              ¿Estás seguro de que deseas cancelar el plan{' '}
              <strong>{membershipToCancel.plan?.name || 'seleccionado'}</strong>
              ?
            </p>

            <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-lg mb-4">
              <p className="text-sm text-gray-600 dark:text-white/60">
                <strong>Vencimiento:</strong>{' '}
                {parseLocalDate(membershipToCancel.end_date).toLocaleDateString(
                  'es-ES',
                  {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  },
                )}
              </p>
            </div>

            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={() => {
                  setShowCancelMembershipModal(false);
                  setMembershipToCancel(null);
                }}
                className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-[#164151] dark:text-white font-medium transition-colors"
              >
                No, mantener
              </button>
              <button
                onClick={handleCancelMembership}
                disabled={cancellingMembershipId === membershipToCancel.id}
                className="px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-semibold transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cancellingMembershipId === membershipToCancel.id ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Cancelando...
                  </>
                ) : (
                  <>
                    <X className="w-4 h-4" />
                    Sí, cancelar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
