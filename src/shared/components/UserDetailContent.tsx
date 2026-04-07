'use client';

import {
  AlertTriangle,
  Ban,
  BookOpen,
  Calendar,
  CheckCircle,
  CreditCard,
  DollarSign,
  Edit,
  FileText,
  FileWarning,
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
  User,
  Users,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { isPlaceholderGymWhatsapp } from '@/lib/gymClientDisplay';
import {
  formatDateOnlyLocal,
  periodEndFromStart,
} from '@/lib/dateUtils';
import { DatePickerField } from '@/shared/components/DatePickerField';
import { GymSeededAvatar } from '@/shared/components/GymSeededAvatar';
import { pickLatestExpiredMembershipPerPlan } from '@/shared/utils/gym-membership-admin.util';
/** Nombre en ficha admin: full_name y name de perfil (y sede física) antes que first/last sueltos. */
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

const COURSE_IMAGE_PLACEHOLDER = '/images/course-placeholder.jpg';

/** URL absoluta, ruta local o placeholder; evita valores sueltos que rompan <img>. */
function resolveCourseImageSrc(
  course: { preview_image?: string | null; thumbnail_url?: string | null } | null,
): string {
  const raw = [course?.preview_image, course?.thumbnail_url]
    .map((s) => (typeof s === 'string' ? s.trim() : ''))
    .find(Boolean);
  if (!raw) return COURSE_IMAGE_PLACEHOLDER;
  if (raw.startsWith('//')) return `https:${raw}`;
  if (
    raw.startsWith('https://') ||
    raw.startsWith('http://') ||
    raw.startsWith('/')
  ) {
    return raw;
  }
  return COURSE_IMAGE_PLACEHOLDER;
}

function MembershipInvoiceLink({
  payment,
}: {
  payment?: {
    id?: string;
    invoice_number?: string | number;
  } | null;
}) {
  if (!payment?.invoice_number) return null;
  const label = `Factura #${payment.invoice_number}`;
  if (payment.id) {
    return (
      <Link
        href={`/admin/payments/${payment.id}`}
        className="group mt-2 inline-flex items-center gap-1.5 rounded-md border border-transparent bg-transparent px-1.5 py-0.5 text-xs font-medium text-gray-600 transition-all hover:border-gray-200/80 hover:bg-gray-50/60 hover:text-[#164151] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20 dark:text-white/70 dark:hover:border-white/15 dark:hover:bg-white/5 dark:hover:text-white"
      >
        <FileText className="h-3.5 w-3.5 opacity-70 transition-opacity group-hover:opacity-100" />
        {label}
      </Link>
    );
  }
  return (
    <p className="mt-2 text-xs font-medium text-[#164151] dark:text-white">
      {label}
    </p>
  );
}

function resolveMembershipPlanData(membership: any): { id: string | null; name: string } {
  const rawPlan = membership?.plan;
  if (Array.isArray(rawPlan)) {
    const first = rawPlan[0] || {};
    return {
      id: first?.id ? String(first.id) : null,
      name: first?.name || 'Plan',
    };
  }
  return {
    id: rawPlan?.id ? String(rawPlan.id) : null,
    name: rawPlan?.name || 'Plan',
  };
}

function MembershipPlanName({
  membership,
  canOpenDetail,
}: {
  membership: any;
  canOpenDetail: boolean;
}) {
  const plan = resolveMembershipPlanData(membership);
  if (!canOpenDetail || !plan.id) {
    return <span>{plan.name}</span>;
  }
  return (
    <Link
      href={`/admin/gym-plans/${plan.id}`}
      className="inline-flex items-center gap-1.5 rounded-sm underline decoration-white/15 underline-offset-3 transition-colors hover:text-[#85ea10] hover:decoration-[#85ea10]/55"
      title="Ver detalle del plan"
    >
      <span>{plan.name}</span>
      <FileText className="h-3.5 w-3.5 opacity-75" />
    </Link>
  );
}

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
    <div className="mb-6 pb-8 border-b border-gray-200/70 dark:border-white/[0.07]">
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

const MS_PER_DAY = 86400000;

function getMembershipPeriodProgress(
  startStr: string,
  endStr: string,
  todayRef: Date,
): {
  pct: number;
  daysLeft: number;
  daysToStart: number;
  totalDays: number;
  notStarted: boolean;
  endingSoon: boolean;
} {
  const start = parseLocalDate(startStr);
  start.setHours(0, 0, 0, 0);
  const end = parseLocalDate(endStr);
  end.setHours(0, 0, 0, 0);
  const now = new Date(todayRef);
  now.setHours(0, 0, 0, 0);

  const totalMs = end.getTime() - start.getTime();
  const totalDays = Math.max(1, Math.round(totalMs / MS_PER_DAY));

  if (now < start) {
    const daysToStart = Math.ceil(
      (start.getTime() - now.getTime()) / MS_PER_DAY,
    );
    const daysLeft = Math.ceil(
      (end.getTime() - now.getTime()) / MS_PER_DAY,
    );
    return {
      pct: 0,
      daysLeft,
      daysToStart,
      totalDays,
      notStarted: true,
      endingSoon: false,
    };
  }

  if (now > end) {
    return {
      pct: 100,
      daysLeft: 0,
      daysToStart: 0,
      totalDays,
      notStarted: false,
      endingSoon: false,
    };
  }

  const elapsedMs = now.getTime() - start.getTime();
  const pct =
    totalMs > 0
      ? Math.min(100, Math.max(0, (elapsedMs / totalMs) * 100))
      : 100;
  const daysLeft = Math.ceil((end.getTime() - now.getTime()) / MS_PER_DAY);

  return {
    pct,
    daysLeft,
    daysToStart: 0,
    totalDays,
    notStarted: false,
    endingSoon: daysLeft <= 7 && daysLeft >= 0,
  };
}

function getCourseLessonProgressPct(
  completed: number,
  total: number,
): { pct: number; label: string } {
  const safeTotal = Math.max(0, total);
  const safeCompleted = Math.max(0, completed);
  if (safeTotal <= 0) {
    return { pct: 0, label: 'Sin lecciones en el curso' };
  }
  const pct = Math.min(
    100,
    Math.round((safeCompleted / safeTotal) * 100),
  );
  const label = `${safeCompleted} de ${safeTotal} lecciones`;
  return { pct, label };
}

/** Cupo de acceso al curso: desde access_granted hasta inicio + (duration_days - 1) días (misma regla que el webhook). */
function getCourseAccessPeriodProgress(
  accessGrantedAtIso: string | null | undefined,
  durationDays: number,
  todayRef: Date,
): (ReturnType<typeof getMembershipPeriodProgress> & {
  accessEndDateStr: string;
  accessDurationDays: number;
}) | null {
  const accessDurationDays = Math.max(1, Number(durationDays) || 30);
  if (!accessGrantedAtIso) return null;
  const startStr = String(accessGrantedAtIso).slice(0, 10);
  const accessEndDateStr = periodEndFromStart(
    parseLocalDate(startStr),
    accessDurationDays,
  );
  return {
    ...getMembershipPeriodProgress(startStr, accessEndDateStr, todayRef),
    accessEndDateStr,
    accessDurationDays,
  };
}

function formatMembershipDayLabel(d: Date) {
  return d.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

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
        <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

          {/* Ficha estilo comprobante (admin) */}
          {!isSelf &&
            (() => {
              const memberships = userData.gym_memberships || [];
              const totalMemberships = memberships.filter(
                (m: any) => m.status !== 'cancelled',
              ).length;
              const totalPaid = memberships.reduce((sum: number, m: any) => {
                return sum + (m.payment?.amount || 0);
              }, 0);

              const displayName = resolveAdminClientDisplayName(userData);

              const avatarSeed = String(
                userData.client_info_id ||
                  userData.gym_client_id ||
                  userData.gym_memberships?.[0]?.client_info_id ||
                  userData.id ||
                  'client',
              );

              const displayAvatarUrl =
                userData.avatar_url && String(userData.avatar_url).trim()
                  ? `${String(userData.avatar_url)}${String(userData.avatar_url).includes('?') ? '&' : '?'}v=${userData.updated_at || ''}`
                  : null;

              const userTypeLabel =
                userData.userType === 'both'
                  ? 'Físico + Online'
                  : userData.userType === 'physical'
                    ? 'Sede física'
                    : userData.userType === 'online'
                      ? 'Sede en línea'
                      : 'Sin productos';

              const waRaw = userData.phone || userData.whatsapp;
              const waHero =
                waRaw && isPlaceholderGymWhatsapp(String(waRaw))
                  ? null
                  : waRaw
                    ? String(waRaw)
                    : null;
              const waPending =
                waRaw && isPlaceholderGymWhatsapp(String(waRaw));

                      return (
                <div className="mb-2 space-y-4">
                  <div
                    className="relative overflow-hidden text-[#164151] dark:text-white"
                    role="article"
                    aria-label="Resumen del cliente"
                  >
                    <div className="relative z-10">
                      <div className="border-b border-gray-200/80 pb-6 dark:border-white/[0.08]">
                        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between lg:gap-10">
                          <div className="flex min-w-0 flex-1 items-start gap-4 sm:gap-5">
                            {displayAvatarUrl ? (
                              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full ring-2 ring-gray-200/80 shadow-sm dark:ring-white/12 sm:h-[88px] sm:w-[88px]">
                                <img
                                  src={displayAvatarUrl}
                                  alt=""
                                  className="h-full w-full object-cover"
                                />
                              </div>
                            ) : (
                              <GymSeededAvatar
                                seed={avatarSeed}
                                size={88}
                                className="shrink-0 rounded-full ring-2 ring-gray-200/80 shadow-sm dark:ring-white/12"
                                alt=""
                              />
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-white/40">
                                Quién compró
                              </p>
                              <p className="text-2xl font-bold leading-tight tracking-tight text-[#164151] dark:text-white sm:text-3xl break-words">
                                {displayName}
                              </p>
                              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-600 dark:text-white/60">
                                {userData.document_id ? (
                                  <span className="tabular-nums">
                                    Doc. {userData.document_id}
                                  </span>
                                ) : null}
                                {userData.email ? (
                                  <span className="break-all">
                                    {userData.email}
                                  </span>
                                ) : null}
                                {waHero ? (
                                  <span className="tabular-nums">
                                    WhatsApp {waHero}
                                  </span>
                                ) : null}
                                {waPending ? (
                                  <span className="text-xs italic text-gray-500 dark:text-white/45">
                                    WhatsApp pendiente
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          </div>

                          <div className="grid w-full grid-cols-2 gap-x-6 gap-y-4 border-t border-gray-200/60 pt-5 sm:grid-cols-4 lg:w-auto lg:min-w-0 lg:max-w-xl lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0 dark:border-white/[0.08]">
                            <div className="min-w-0">
                              <div className="mb-1 flex items-center gap-1.5">
                                <Users className="h-3.5 w-3.5 shrink-0 text-[#85ea10]" />
                                <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-white/45">
                                  Tipo
                                </span>
                              </div>
                              <p className="text-sm font-semibold leading-snug text-[#164151] dark:text-white">
                                {userTypeLabel}
                              </p>
                            </div>
                            <div className="min-w-0">
                              <div className="mb-1 flex items-center gap-1.5">
                                <FileText className="h-3.5 w-3.5 shrink-0 text-[#85ea10]" />
                                <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-white/45">
                                  Membresías
                                </span>
                              </div>
                              <p className="text-sm font-semibold tabular-nums text-[#164151] dark:text-white">
                                {totalMemberships}
                              </p>
                            </div>
                            <div className="min-w-0">
                              <div className="mb-1 flex items-center gap-1.5">
                                <DollarSign className="h-3.5 w-3.5 shrink-0 text-[#85ea10]" />
                                <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-white/45">
                                  Total abonado
                                </span>
                              </div>
                              <p className="text-sm font-semibold tabular-nums text-[#164151] dark:text-white">
                                ${totalPaid.toLocaleString('es-CO')}
                              </p>
                            </div>
                            <div className="min-w-0">
                              <div className="mb-1 flex items-center gap-1.5">
                                <CheckCircle className="h-3.5 w-3.5 shrink-0 text-[#85ea10]" />
                                <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-white/45">
                                  Estado
                                </span>
                              </div>
                              <p className="mt-0.5">
                                {userData.is_inactive ? (
                                  <span className="inline-flex items-center rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-semibold text-amber-800 dark:text-amber-300">
                                    Inactivo
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center rounded-full bg-[#85ea10]/15 px-2 py-0.5 text-xs font-semibold text-[#85ea10]">
                                    Activo
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

          <div
            className={`grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-y-10 ${userData.is_inactive ? 'opacity-75' : ''}`}
          >
            {/* Información personal y fitness — al final (menos prioridad); en móvil va debajo del comercial por order */}
            <div className="order-2 space-y-4 md:space-y-6 lg:order-2 lg:col-span-12 lg:row-start-2 w-full min-w-0 pt-8 lg:pt-10">
              {/* Inactivar / Activar — solo si aplica (info de estado ya está en la ficha superior) */}
              {!isSelf &&
                (() => {
                        const clientInfoId = userData.isUnregisteredClient
                          ? userData.id
                          : userData.client_info_id ||
                            userData.gym_memberships?.[0]?.client_info_id ||
                            null;

                        if (!clientInfoId) return null;

                        const isInactive = userData.is_inactive || false;
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

                  let action: React.ReactNode = null;

                        if (
                          hasOnlyExpiredMemberships &&
                          hasExpiredMoreThan30Days &&
                          !isInactive
                        ) {
                          const handleInactivate = async () => {
                            if (
                              !confirm(
                                `¿Estás seguro de inactivar a ${(() => {
                                  const dn = resolveAdminClientDisplayName(userData);
                                  return dn !== 'Sin nombre' ? dn : 'este usuario';
                                })()}?`,
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

                              await loadUserData();
                            } catch (error) {
                              alert('Error al inactivar el usuario');
                            }
                          };

                    action = (
                            <button
                        type="button"
                              onClick={handleInactivate}
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-100 px-4 py-2.5 text-sm font-semibold text-red-700 transition-colors hover:bg-red-200 dark:bg-red-500/20 dark:text-red-400 dark:hover:bg-red-500/30"
                              title="Inactivar usuario (30 días sin pagar)"
                            >
                        <Ban className="h-5 w-5" />
                              Inactivar Usuario
                            </button>
                          );
                  } else if (isInactive) {
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

                              await loadUserData();
                            } catch (error) {
                              alert('Error al activar el usuario');
                            }
                          };

                    action = (
                            <button
                        type="button"
                              onClick={handleActivate}
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-100 px-4 py-2.5 text-sm font-semibold text-green-700 transition-colors hover:bg-green-200 dark:bg-green-500/20 dark:text-green-400 dark:hover:bg-green-500/30"
                              title="Activar usuario"
                            >
                        <CheckCircle className="h-5 w-5" />
                              Activar Usuario
                            </button>
                          );
                        }

                  if (!action) return null;

                  return (
                    <div className="pb-8 border-b border-gray-200/60 dark:border-white/[0.06]">
                      <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-white/40">
                        Acciones
                      </h2>
                      {action}
                    </div>
                  );
                })()}

              {/* Datos de contacto — solo admin (sin encabezado de sección) */}
              {!isSelf && (
                <div className="pb-8 border-b border-gray-200/60 dark:border-white/[0.06]">
                  {saveError && (
                    <div className="mb-4 p-3 bg-red-50 dark:bg-red-500/20 border border-red-200 dark:border-red-500/30 rounded-lg">
                      <p className="text-sm text-red-600 dark:text-red-400">
                        {saveError}
                      </p>
                    </div>
                  )}
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {isEditing && (
                      <>
                        <div className="flex items-center gap-3 py-2">
                          <User className="h-5 w-5 shrink-0 text-gray-400" />
                          <div className="min-w-0 flex-1">
                            <p className="mb-1 text-xs text-gray-500 dark:text-white/40">
                          Nombre completo
                        </p>
                          <input
                            type="text"
                            value={editForm.name || ''}
                            onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  name: e.target.value,
                                })
                              }
                              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-[#164151] focus:outline-none focus:ring-2 focus:ring-[#85ea10]/50 dark:border-white/20 dark:bg-gray-800 dark:text-white"
                            />
                      </div>
                    </div>

                        <div className="flex items-center gap-3 py-2">
                          <Mail className="h-5 w-5 shrink-0 text-gray-400" />
                          <div className="min-w-0 flex-1">
                            <p className="mb-1 text-xs text-gray-500 dark:text-white/40">
                          Email
                        </p>
                          <input
                            type="email"
                            value={editForm.email || ''}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                email: e.target.value,
                              })
                            }
                              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-[#164151] focus:outline-none focus:ring-2 focus:ring-[#85ea10]/50 dark:border-white/20 dark:bg-gray-800 dark:text-white"
                          />
                      </div>
                    </div>

                        <div className="flex items-center gap-3 py-2">
                          <Phone className="h-5 w-5 shrink-0 text-gray-400" />
                          <div className="min-w-0 flex-1">
                            <p className="mb-1 text-xs text-gray-500 dark:text-white/40">
                          Teléfono / WhatsApp
                        </p>
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
                              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-[#164151] focus:outline-none focus:ring-2 focus:ring-[#85ea10]/50 dark:border-white/20 dark:bg-gray-800 dark:text-white"
                            />
                      </div>
                    </div>

                        <div className="flex items-center gap-3 py-2">
                          <CreditCard className="h-5 w-5 shrink-0 text-gray-400" />
                          <div className="min-w-0 flex-1">
                            <p className="mb-1 text-xs text-gray-500 dark:text-white/40">
                          Documento
                        </p>
                          <div className="flex gap-2">
                            <select
                              value={editForm.document_type || 'CC'}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  document_type: e.target.value,
                                })
                              }
                                className="rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm text-[#164151] focus:outline-none focus:ring-2 focus:ring-[#85ea10]/50 dark:border-white/20 dark:bg-gray-800 dark:text-white"
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
                                className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-[#164151] focus:outline-none focus:ring-2 focus:ring-[#85ea10]/50 disabled:cursor-not-allowed disabled:bg-gray-100 dark:border-white/20 dark:bg-gray-800 dark:text-white dark:disabled:bg-gray-800"
                            />
                          </div>
                      </div>
                    </div>
                      </>
                    )}

                    {userData.address && !isEditing && (
                      <div className="flex items-center gap-3 py-3">
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
                        <div className="flex items-center gap-3 py-3">
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
                        <div className="flex items-center gap-3 py-3">
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
                        <div className="flex items-center gap-3 py-3">
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
                      <div className="flex items-center gap-3 py-3">
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

                  </div>
                </div>
              )}

              {/* Información fitness — solo en Mi cuenta (no en vista admin) */}
              {isSelf && (
              <div className="pb-8 border-b border-gray-200/60 dark:border-white/[0.06]">
                <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-white/40">
                  Información fitness
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">
                  <div className="flex items-center gap-3 py-3">
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

                  <div className="flex items-center gap-3 py-3">
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

                  <div className="flex items-center gap-3 py-3">
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

                  <div className="flex items-center gap-3 py-3">
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

                  <div className="flex items-start gap-3 py-3 md:col-span-2">
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
                      <div className="flex items-start gap-3 py-3 md:col-span-2">
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

                  {/* Estadísticas de actividad: dos columnas simétricas + línea central */}
                  {!isEditing && (
                    <div className="grid grid-cols-2 md:col-span-2 pt-4 mt-1 divide-x divide-gray-200/70 dark:divide-white/[0.08] border-t border-gray-200/50 dark:border-white/[0.06]">
                      <div className="flex min-h-[4.5rem] flex-col items-center justify-center gap-1.5 px-3 py-2 sm:px-4">
                        <p className="text-2xl font-bold tabular-nums leading-none text-[#164151] dark:text-white">
                          {userData.streak_days ?? 0}
                        </p>
                        <p className="text-center text-xs leading-tight text-gray-500 dark:text-white/40">
                          Días de racha
                        </p>
                      </div>
                      <div className="flex min-h-[4.5rem] flex-col items-center justify-center gap-1.5 px-3 py-2 sm:px-4">
                        <p className="text-2xl font-bold tabular-nums leading-none text-[#164151] dark:text-white">
                          {userData.weight_progress_percentage ?? 0}%
                        </p>
                        <p className="text-center text-xs leading-tight text-gray-500 dark:text-white/40">
                          Progreso peso
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              )}
            </div>

            {/* Resumen comercial + historiales — ancho completo; dos columnas internas en lg */}
            <div className="order-1 space-y-6 lg:order-1 lg:col-span-12 lg:row-start-1 w-full min-w-0">
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-6 xl:gap-8 lg:items-start">
                <div className="min-w-0 space-y-6 lg:space-y-8 lg:border-r lg:border-gray-200/60 lg:pr-6 xl:pr-8 dark:lg:border-white/[0.08]">
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
                  <div className="pb-8 sm:pb-10 border-b border-gray-200/60 dark:border-white/[0.06]">
                    {!isSelf && (
                      <h2 className="mb-4 text-xs font-semibold uppercase tracking-normal text-gray-500 dark:text-white/40">
                        Resumen comercial
                      </h2>
                    )}
                    <div className="space-y-6">
                      {!hasActiveProducts ? (
                        <p className="py-6 text-sm text-gray-500 dark:text-white/50">
                          Sin membresías de gimnasio ni cursos en línea activos.
                        </p>
                      ) : (
                        <>
                          {/* Planes sede física — card único con barra de progreso */}
                          {activeMemberships.length > 0 && (
                            <div className="overflow-hidden rounded-xl border border-gray-200/80 bg-gray-50/50 dark:border-white/[0.08] dark:bg-white/[0.02]">
                              <div className="divide-y divide-gray-200/70 dark:divide-white/[0.08]">
                                {activeMemberships
                                  .sort(
                                    (a: any, b: any) =>
                                      new Date(a.start_date).getTime() -
                                      new Date(b.start_date).getTime(),
                                  )
                                  .map((membership: any) => {
                                    const startDate = parseLocalDate(
                                      membership.start_date,
                                    );
                                    const isScheduled = startDate > today;
                                    const period = getMembershipPeriodProgress(
                                      membership.start_date,
                                      membership.end_date,
                                      today,
                                    );
                                    const neverInvoiced =
                                      (userData as { hasAnyInvoiceEver?: boolean })
                                        .hasAnyInvoiceEver === false;

                                    return (
                                      <div
                                        key={membership.id}
                                        className="px-4 py-6 sm:px-5"
                                      >
                                  <div className="min-w-0">
                                      <div className="flex flex-wrap items-start justify-between gap-2">
                                        <div className="min-w-0">
                                          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-white/40">
                                            Plan sede física
                                          </p>
                                          <p className="text-base font-semibold leading-snug text-[#164151] dark:text-white">
                                            <MembershipPlanName
                                              membership={membership}
                                              canOpenDetail={!isSelf}
                                            />
                                          </p>
                                        </div>
                                        <div className="flex shrink-0 items-center gap-2">
                                          {neverInvoiced ? (
                                            <span className="inline-flex items-center gap-1 rounded-md border border-amber-400/50 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-950 dark:border-amber-500/35 dark:bg-amber-500/15 dark:text-amber-100 max-w-[14rem] sm:max-w-none sm:text-[11px]">
                                              <FileWarning className="h-3.5 w-3.5 shrink-0" />
                                              {isScheduled
                                                ? 'Próximo · sin facturas'
                                                : 'Plan vigente · sin facturas'}
                                            </span>
                                          ) : isScheduled ? (
                                            <span className="inline-flex items-center gap-1 rounded-md border border-cyan-500/40 bg-transparent px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-cyan-800 dark:border-cyan-500/35 dark:text-cyan-400">
                                              <Calendar className="h-3.5 w-3.5 shrink-0" />
                                              Próximo
                                          </span>
                                          ) : (
                                            <span className="inline-flex items-center gap-1 rounded-md border border-gray-200/90 bg-gray-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-gray-700 dark:border-white/15 dark:bg-white/[0.06] dark:text-white/85">
                                              <CheckCircle className="h-3.5 w-3.5 shrink-0 text-[#85ea10]" />
                                              Al día
                                            </span>
                                          )}
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
                                              className="p-1.5 rounded-lg text-[#164151]/45 transition-colors hover:bg-[#164151]/10 hover:text-[#164151] disabled:opacity-50 dark:text-white/40 dark:hover:bg-white/10 dark:hover:text-white"
                                              title="Cancelar membresía"
                                            >
                                              {cancellingMembershipId ===
                                              membership.id ? (
                                                <div className="w-4 h-4 border-2 border-[#164151]/30 border-t-[#85ea10] rounded-full animate-spin dark:border-white/20" />
                                              ) : (
                                                <X className="h-4 w-4" strokeWidth={2} />
                                              )}
                                            </button>
                                          )}
                                        </div>
                                      </div>

                                      {/* Período: inicio — barra de progreso — fin */}
                                      <div className="mt-5">
                                        {!isSelf &&
                                        editingStartDateMembershipId ===
                                          membership.id ? (
                                          <div className="flex flex-wrap items-center gap-2">
                                            <span className="text-xs text-gray-500 dark:text-white/50 shrink-0">
                                              Inicia:
                                            </span>
                                            <DatePickerField
                                              id={`membership-start-${membership.id}`}
                                              value={newStartDate}
                                              onChange={(iso) =>
                                                setNewStartDate(iso)
                                              }
                                              disabled={isUpdatingStartDate}
                                              aria-label="Fecha de inicio del plan"
                                              className="min-w-[160px] max-w-[220px] flex-1"
                                              triggerClassName="py-1.5 min-h-[34px] text-xs rounded-lg border-gray-300 dark:border-white/20 bg-white dark:bg-gray-800/90"
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
                                              onClick={handleCancelEditStartDate}
                                              disabled={isUpdatingStartDate}
                                              className="px-2 py-1 text-xs bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-white/20 transition-colors disabled:opacity-50"
                                              title="Cancelar"
                                            >
                                              ✕
                                            </button>
                                          </div>
                                        ) : (
                                          <>
                                            <div className="flex flex-wrap items-start justify-between gap-3 sm:gap-4">
                                              <div className="flex min-w-0 flex-1 flex-col items-center text-center sm:max-w-[38%] sm:items-start sm:text-left">
                                                <span
                                                  className="mb-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-[#85ea10] ring-2 ring-[#85ea10]/30"
                                                  title="Inicio del período"
                                                />
                                                <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-white/45">
                                                  Inicio
                                                </span>
                                                <span className="mt-0.5 text-xs font-medium leading-snug text-[#164151] dark:text-white">
                                                  {formatMembershipDayLabel(
                                                    parseLocalDate(
                                                      membership.start_date,
                                                    ),
                                                  )}
                                                </span>
                                                {!isSelf && (
                                                  <button
                                                    type="button"
                                                    onClick={() =>
                                                      handleStartEditStartDate(
                                                        membership,
                                                      )
                                                    }
                                                    className="mt-2 inline-flex items-center gap-1 rounded-md border border-gray-200/80 px-2 py-1 text-[10px] font-medium text-gray-600 transition-colors hover:bg-gray-100 dark:border-white/15 dark:text-white/70 dark:hover:bg-white/10"
                                                    title="Editar fecha de inicio"
                                                  >
                                                    <Edit className="h-3 w-3" />
                                                    Editar
                                                  </button>
                                                )}
                                              </div>

                                              <div className="min-w-0 flex-1 px-1 pt-1 sm:px-2">
                                                <div
                                                  className={`relative h-2.5 w-full overflow-hidden rounded-full bg-gray-200/90 dark:bg-white/10 ${
                                                    period.endingSoon &&
                                                    !period.notStarted
                                                      ? 'ring-1 ring-amber-500/50'
                                                      : ''
                                                  }`}
                                                  role="progressbar"
                                                  aria-valuenow={Math.round(
                                                    period.pct,
                                                  )}
                                                  aria-valuemin={0}
                                                  aria-valuemax={100}
                                                  aria-label="Progreso del período del plan"
                                                >
                                                  <div
                                                    className={`h-full rounded-full transition-[width] duration-300 ${
                                                      period.notStarted
                                                        ? 'w-0 bg-cyan-500/40'
                                                        : period.endingSoon
                                                          ? 'bg-gradient-to-r from-[#85ea10] to-amber-500'
                                                          : 'bg-[#85ea10]'
                                                    }`}
                                                    style={{
                                                      width: `${period.notStarted ? 0 : period.pct}%`,
                                                    }}
                                                  />
                                                </div>
                                                <div className="mt-2 space-y-0.5 text-center">
                                                  {period.notStarted ? (
                                                    <p className="text-[11px] text-cyan-600 dark:text-cyan-400">
                                                      Comienza en{' '}
                                                      {period.daysToStart}{' '}
                                                      {period.daysToStart === 1
                                                        ? 'día'
                                                        : 'días'}
                                                    </p>
                                                  ) : period.endingSoon ? (
                                                    <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                                                      Quedan {period.daysLeft}{' '}
                                                      {period.daysLeft === 1
                                                        ? 'día'
                                                        : 'días'}{' '}
                                                      — el plan se acaba pronto
                                                    </p>
                                                  ) : (
                                                    <p className="text-[11px] text-gray-500 dark:text-white/45">
                                                      {Math.round(period.pct)}%
                                                      del período transcurrido ·{' '}
                                                      {period.daysLeft}{' '}
                                                      {period.daysLeft === 1
                                                        ? 'día restante'
                                                        : 'días restantes'}
                                                    </p>
                                                  )}
                                                </div>
                                              </div>

                                              <div className="flex min-w-0 flex-1 flex-col items-center text-center sm:max-w-[38%] sm:items-end sm:text-right">
                                                <span
                                                  className="mb-1.5 h-2.5 w-2.5 shrink-0 rounded-full border-2 border-[#85ea10] bg-gradient-to-b from-[#85ea10] to-[#6bc40a] shadow-sm dark:border-[#85ea10]"
                                                  title="Fin del período"
                                                />
                                                <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-white/45">
                                                  Vence
                                                </span>
                                                <span
                                                  className={`mt-0.5 text-xs font-medium leading-snug ${
                                                    isScheduled
                                                      ? 'text-cyan-600 dark:text-cyan-400'
                                                      : 'text-[#164151] dark:text-white'
                                                  }`}
                                                >
                                                  {formatMembershipDayLabel(
                                                    parseLocalDate(
                                                      membership.end_date,
                                                    ),
                                                  )}
                                                </span>
                                              </div>
                                            </div>
                                          </>
                                        )}
                                      </div>

                                      <div className="mt-4">
                                        <MembershipInvoiceLink
                                          payment={membership.payment}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                    );
                                  })}
                              </div>
                            </div>
                          )}

                          {/* Cursos activos */}
                          {hasActiveCourses && (
                            <div className="space-y-0 pt-6">
                              <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-white/40 pb-4">
                                Cursos en línea activos
                              </p>
                              <div className="divide-y divide-gray-200/70 dark:divide-white/[0.08]">
                              {userData.activeCoursePurchases.map(
                                (purchase: any) => {
                                  const course = Array.isArray(
                                    purchase.course,
                                  )
                                    ? purchase.course[0]
                                    : purchase.course;
                                  const courseTitle = course?.title || 'Curso';
                                  const courseThumb = resolveCourseImageSrc(
                                    course,
                                  );
                                  const lessonProgress = getCourseLessonProgressPct(
                                    Number(purchase.completed_lessons) || 0,
                                    Number(purchase.total_lessons) || 0,
                                  );
                                  const durationFromCourse =
                                    Number(course?.duration_days) > 0
                                      ? Number(course.duration_days)
                                      : 30;
                                  const accessPeriod =
                                    getCourseAccessPeriodProgress(
                                      purchase.access_granted_at,
                                      durationFromCourse,
                                      today,
                                    );
                                  return (
                                  <div
                                    key={purchase.id}
                                    className="flex items-start gap-4 py-6 first:pt-0"
                                  >
                                    <div
                                      className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-[#164151] ring-1 ring-white/15 shadow-inner"
                                    >
                                      {/* <img> + onError: mismo patrón que el dashboard; next/image falla si el host no está en remotePatterns */}
                                      <img
                                        src={courseThumb}
                                        alt=""
                                        className="h-full w-full object-cover"
                                        loading="lazy"
                                        decoding="async"
                                        onError={(e) => {
                                          const el = e.currentTarget;
                                          if (
                                            !el.src.endsWith(
                                              'course-placeholder.jpg',
                                            )
                                          ) {
                                            el.src = COURSE_IMAGE_PLACEHOLDER;
                                          }
                                        }}
                                      />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-white/40">
                                        Curso en línea
                                      </p>
                                      <p className="text-base font-semibold text-[#164151] dark:text-white">
                                        {courseTitle}
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
                                      {accessPeriod && (
                                        <div className="mt-3 min-w-0">
                                          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-white/45">
                                            Tiempo de acceso al curso (
                                            {accessPeriod.accessDurationDays}{' '}
                                            {accessPeriod.accessDurationDays ===
                                            1
                                              ? 'día'
                                              : 'días'}
                                            )
                                          </p>
                                          <div
                                            className="relative h-2.5 w-full overflow-hidden rounded-full bg-gray-200/90 dark:bg-white/10"
                                            role="progressbar"
                                            aria-valuenow={Math.round(
                                              accessPeriod.pct,
                                            )}
                                            aria-valuemin={0}
                                            aria-valuemax={100}
                                            aria-label="Progreso del período de acceso al curso"
                                          >
                                            <div
                                              className={`h-full rounded-full transition-[width] duration-300 ${
                                                accessPeriod.notStarted
                                                  ? 'w-0 bg-cyan-500/40'
                                                  : accessPeriod.endingSoon
                                                    ? 'bg-gradient-to-r from-[#85ea10] to-amber-500'
                                                    : 'bg-[#85ea10]'
                                              }`}
                                              style={{
                                                width: `${accessPeriod.notStarted ? 0 : accessPeriod.pct}%`,
                                              }}
                                            />
                                          </div>
                                          <p className="mt-1.5 text-[11px] leading-snug text-gray-500 dark:text-white/45">
                                            {accessPeriod.notStarted ? (
                                              <>
                                                El acceso comienza en{' '}
                                                {accessPeriod.daysToStart}{' '}
                                                {accessPeriod.daysToStart === 1
                                                  ? 'día'
                                                  : 'días'}
                                                .
                                              </>
                                            ) : accessPeriod.pct >= 100 ? (
                                              <>
                                                Período de acceso terminado (
                                                vencía el{' '}
                                                {formatDateOnlyLocal(
                                                  accessPeriod.accessEndDateStr,
                                                  {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric',
                                                  },
                                                  'es-CO',
                                                )}
                                                ).
                                              </>
                                            ) : (
                                              <>
                                                {Math.round(accessPeriod.pct)}
                                                % del cupo transcurrido ·
                                                vence el{' '}
                                                {formatDateOnlyLocal(
                                                  accessPeriod.accessEndDateStr,
                                                  {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric',
                                                  },
                                                  'es-CO',
                                                )}{' '}
                                                · quedan{' '}
                                                {accessPeriod.daysLeft}{' '}
                                                {accessPeriod.daysLeft === 1
                                                  ? 'día'
                                                  : 'días'}
                                              </>
                                            )}
                                          </p>
                                        </div>
                                      )}
                                      <div className="mt-3 min-w-0">
                                        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-white/45">
                                          Lecciones completadas
                                        </p>
                                        <p className="mb-2 text-[10px] leading-snug text-gray-500/90 dark:text-white/35">
                                          Cada día que pasa desde el acceso
                                          cuenta una lección (Colombia), sin
                                          depender de que el alumno abra la
                                          clase.
                                        </p>
                                        <div
                                          className="relative h-2.5 w-full overflow-hidden rounded-full bg-gray-200/90 dark:bg-white/10"
                                          role="progressbar"
                                          aria-valuenow={Math.round(
                                            lessonProgress.pct,
                                          )}
                                          aria-valuemin={0}
                                          aria-valuemax={100}
                                          aria-label="Progreso por días calendario desde el acceso"
                                        >
                                          <div
                                            className="h-full rounded-full bg-cyan-500/70 dark:bg-cyan-500/50 transition-[width] duration-300"
                                            style={{
                                              width: `${lessonProgress.pct}%`,
                                            }}
                                          />
                                        </div>
                                        <div className="mt-1.5 flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5 text-[11px] text-gray-500 dark:text-white/45">
                                          <span>{lessonProgress.label}</span>
                                          <span className="tabular-nums font-medium text-[#164151] dark:text-white/80">
                                            {lessonProgress.pct}%
                                          </span>
                                        </div>
                                      </div>
                                      {isSelf && (
                                        <a
                                          href="/student"
                                          className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-white/75 underline-offset-2 hover:text-[#85ea10] hover:underline"
                                        >
                                          Ver clases →
                                        </a>
                                      )}
                                    </div>
                                  </div>
                                  );
                                },
                              )}
                              </div>
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
                const expiredMembershipsRaw = (
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

                const expiredMemberships =
                  pickLatestExpiredMembershipPerPlan(expiredMembershipsRaw);

                if (expiredMemberships.length === 0) {
                  return null;
                }

                return (
                  <div className="pb-8 border-b border-gray-200/60 dark:border-white/[0.06]">
                    <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-white/40">
                      Planes que necesitan renovación
                    </h2>
                    <div className="divide-y divide-gray-200/70 dark:divide-white/[0.08]">
                      {expiredMemberships.map((membership: any) => {
                          const endDate = parseLocalDate(membership.end_date);

                          return (
                            <div
                              key={membership.id}
                              className="py-6 first:pt-0"
                            >
                              <div className="min-w-0">
                                  <div className="flex flex-wrap items-start justify-between gap-2">
                                    <div className="min-w-0">
                                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-white/40">
                                        Plan sede física
                                      </p>
                                      <p className="text-base font-semibold text-[#164151] dark:text-white">
                                        <MembershipPlanName
                                          membership={membership}
                                          canOpenDetail={!isSelf}
                                        />
                                      </p>
                                    </div>
                                    <div className="flex shrink-0 items-center gap-2">
                                      {(() => {
                                        // Solo mostrar "Inactivo" si el usuario está marcado como inactivo en la BD
                                        if (userData.is_inactive) {
                                          return (
                                            <span className="inline-flex items-center gap-1 rounded-md border border-red-500/40 bg-red-500/5 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-red-700 dark:border-red-500/35 dark:text-red-400">
                                              Inactivo
                                            </span>
                                          );
                                        }

                                        // Si no está inactivo, siempre mostrar "Renovar"
                                        return (
                                          <span className="inline-flex items-center gap-1 rounded-md border border-orange-500/45 bg-orange-500/[0.07] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-orange-800 dark:border-orange-500/40 dark:text-orange-400">
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
                                            className="p-1.5 rounded-lg text-[#164151]/45 transition-colors hover:bg-[#164151]/10 hover:text-[#164151] disabled:opacity-50 dark:text-white/40 dark:hover:bg-white/10 dark:hover:text-white"
                                            title="Cancelar membresía"
                                          >
                                            {cancellingMembershipId ===
                                            membership.id ? (
                                              <div className="w-4 h-4 border-2 border-[#164151]/30 border-t-[#85ea10] rounded-full animate-spin dark:border-white/20" />
                                            ) : (
                                              <X className="h-4 w-4" strokeWidth={2} />
                                            )}
                                          </button>
                                        )}
                                    </div>
                                  </div>
                                  <p className="mt-3 text-xs text-gray-500 dark:text-white/50">
                                    Inició:{' '}
                                    {parseLocalDate(
                                      membership.start_date,
                                    ).toLocaleDateString('es-ES', {
                                      day: '2-digit',
                                      month: 'long',
                                      year: 'numeric',
                                    })}
                                  </p>
                                  <p className="mt-1 text-xs text-gray-500 dark:text-white/50">
                                    Venció:{' '}
                                    {parseLocalDate(
                                      membership.end_date,
                                    ).toLocaleDateString('es-ES', {
                                      day: '2-digit',
                                      month: 'long',
                                      year: 'numeric',
                                    })}
                                  </p>
                                  <MembershipInvoiceLink
                                    payment={membership.payment}
                                  />
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
                                      const resolved =
                                        resolveAdminClientDisplayName(userData);
                                      const clientName =
                                        resolved !== 'Sin nombre'
                                          ? resolved
                                          : 'Cliente';
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
                                        className="w-full px-4 py-2 rounded-lg border border-white/15 bg-white/5 text-[#164151] transition-colors hover:bg-white/10 flex items-center justify-center gap-2 text-sm font-medium dark:text-white/90 dark:hover:bg-white/10"
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

                </div>
                <div className="min-w-0 space-y-6 lg:space-y-8">
              {/* Historial de facturación: listado de facturas asociadas a períodos ya cerrados */}
              <div className="pb-8 border-b border-gray-200/60 dark:border-white/[0.06] lg:pb-0 lg:border-b-0">
                <h2 className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-white/40">
                  Historial de facturación
                </h2>
                <p className="mb-4 text-[10px] leading-snug text-gray-500 dark:text-white/35">
                  Facturas registradas por período cerrado (vencido o cancelado).
                </p>
                <div className="divide-y divide-gray-200/70 dark:divide-white/[0.08]">
                  {!userData.gym_memberships ||
                  userData.gym_memberships.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-white/50 py-4">
                      No hay facturas en el historial.
                    </p>
                  ) : (
                    (() => {
                      const todayHist = new Date();
                      todayHist.setHours(0, 0, 0, 0);
                      const finishedMemberships = (
                        userData.gym_memberships as any[]
                      )
                        .filter((m: any) => {
                          if (m.status === 'cancelled') return true;
                          return parseLocalDate(m.end_date) < todayHist;
                        })
                        .sort(
                          (a: any, b: any) =>
                            new Date(b.end_date).getTime() -
                            new Date(a.end_date).getTime(),
                        );

                      if (finishedMemberships.length === 0) {
                        return (
                          <p className="text-sm text-gray-500 dark:text-white/50 py-4">
                            No hay facturas en el historial.
                          </p>
                        );
                      }

                      return finishedMemberships.map((membership: any) => {
                        const endDate = parseLocalDate(membership.end_date);
                        const isCancelled =
                          membership.status === 'cancelled';

                        return (
                          <div
                            key={membership.id}
                            className="py-5 first:pt-0"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                              <p className="text-sm font-medium text-[#164151] dark:text-white">
                                <MembershipPlanName
                                  membership={membership}
                                  canOpenDetail={!isSelf}
                                />
                              </p>
                              {isCancelled && (
                                <span className="inline-flex shrink-0 items-center gap-1 rounded-md border border-gray-300/80 bg-gray-100/80 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-gray-600 dark:border-white/15 dark:bg-white/10 dark:text-white/60">
                                  Cancelada
                                </span>
                              )}
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs text-gray-500 dark:text-white/50">
                                Inicio de período:{' '}
                                {parseLocalDate(
                                  membership.start_date,
                                ).toLocaleDateString('es-ES', {
                                  day: '2-digit',
                                  month: 'long',
                                  year: 'numeric',
                                })}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-white/50">
                                Fin de período:{' '}
                                {endDate.toLocaleDateString('es-ES', {
                                  day: '2-digit',
                                  month: 'long',
                                  year: 'numeric',
                                })}
                              </p>
                              <MembershipInvoiceLink
                                payment={membership.payment}
                              />
                            </div>
                          </div>
                        );
                      });
                    })()
                  )}
                </div>
              </div>

              {/* Cursos */}
              {userData.course_purchases &&
                userData.course_purchases.length > 0 && (
                  <div className="pb-8 border-b border-gray-200/60 dark:border-white/[0.06] last:border-b-0 lg:pb-0 lg:border-b-0">
                    <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-white/40">
                      Historial de cursos
                    </h2>
                    <div className="divide-y divide-gray-200/70 dark:divide-white/[0.08]">
                      {userData.course_purchases.map((purchase: any) => {
                        const course = Array.isArray(purchase.course)
                          ? purchase.course[0]
                          : purchase.course;
                        const courseThumb = resolveCourseImageSrc(course);
                        return (
                          <div
                            key={purchase.id}
                            className="flex items-start gap-4 py-5 first:pt-0"
                          >
                            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-[#164151] ring-1 ring-white/15 shadow-inner">
                              <img
                                src={courseThumb}
                                alt=""
                                className="h-full w-full object-cover"
                                loading="lazy"
                                decoding="async"
                                onError={(e) => {
                                  const el = e.currentTarget;
                                  if (
                                    !el.src.endsWith(
                                      'course-placeholder.jpg',
                                    )
                                  ) {
                                    el.src = COURSE_IMAGE_PLACEHOLDER;
                                  }
                                }}
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-[#164151] dark:text-white">
                                {course?.title || 'Curso'}
                              </p>
                              <p className="mt-0.5 text-xs text-gray-500 dark:text-white/50">
                                {purchase.is_course_finished ? (
                                  <span>Finalizado</span>
                                ) : purchase.is_active ? (
                                  <span className="text-[#85ea10]">Activo</span>
                                ) : (
                                  <span>Completado</span>
                                )}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                </div>
              </div>
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
                {(() => {
                  const dn = resolveAdminClientDisplayName(userData);
                  return dn !== 'Sin nombre' ? dn : 'este usuario';
                })()}
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
