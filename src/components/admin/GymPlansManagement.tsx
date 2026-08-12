'use client';

import {
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  Dumbbell,
  Edit,
  Eye,
  Filter,
  Plus,
  Save,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from 'react';
import {
  adminFormModalStyles as modal,
  gymPlansListStyles as styles,
} from '@/modules/gym-admin/styles';
import {
  GYM_DURATION_PRESETS,
  formatGymPlanDuration,
  isGymDurationPresetSelected,
  toDurationDays,
} from '@/modules/gym-admin/utils/gym-plan-duration.util';
import type { GymPlan } from '@/types/gym';
import ConfirmDialog from './ConfirmDialog';

type SortKey = 'name' | 'price' | 'duration' | 'clients';
type SortDir = 'asc' | 'desc';

function SortIcon({
  active,
  direction,
}: {
  active: boolean;
  direction: SortDir;
}) {
  if (!active) {
    return <ArrowUpDown className="w-3.5 h-3.5 opacity-40" />;
  }
  return direction === 'asc' ? (
    <ChevronUp className="w-3.5 h-3.5" />
  ) : (
    <ChevronDown className="w-3.5 h-3.5" />
  );
}

export interface GymPlansManagementRef {
  openCreateModal: () => void;
}

const GymPlansManagement = forwardRef<GymPlansManagementRef>((props, ref) => {
  const [plans, setPlans] = useState<GymPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState<GymPlan | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    duration_days: '30',
    is_active: true,
  });
  const [displayPrice, setDisplayPrice] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<GymPlan | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [showEditWarning, setShowEditWarning] = useState(false);
  const [pendingEditData, setPendingEditData] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>(
    'active',
  );
  const [sortKey, setSortKey] = useState<SortKey>('clients');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const router = useRouter();

  // Función para formatear precio con separador de miles
  const formatPrice = (value: string) => {
    // Remover todo lo que no sea número
    const numbers = value.replace(/\D/g, '');
    if (!numbers) return '';
    // Formatear con separador de miles
    return numbers.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  // Función para convertir precio formateado a número
  const parsePrice = (formattedValue: string) => {
    return formattedValue.replace(/\./g, '');
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/gym/plans');
      if (!response.ok) throw new Error('Error al cargar planes');
      const data = await response.json();
      setPlans(data);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      price: parseFloat(parsePrice(formData.price)),
      duration_days: parseInt(formData.duration_days),
      is_active: formData.is_active,
    };

    // Si estamos editando un plan, verificar si se cambió precio o duración
    if (editingPlan) {
      const priceChanged = payload.price !== editingPlan.price;
      const durationChanged =
        payload.duration_days !== editingPlan.duration_days;

      if (priceChanged || durationChanged) {
        // Guardar los datos pendientes y mostrar advertencia
        setPendingEditData(payload);
        setShowEditWarning(true);
        return;
      }
    }

    // Si no hay cambios en precio/duración o es un plan nuevo, proceder directamente
    await savePlan(payload);
  };

  const savePlan = async (payload: any) => {
    try {
      let response;
      if (editingPlan) {
        response = await fetch(`/api/admin/gym/plans/${editingPlan.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        response = await fetch('/api/admin/gym/plans', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al guardar plan');
      }

      setShowForm(false);
      setEditingPlan(null);
      setShowEditWarning(false);
      setPendingEditData(null);
      resetForm();
      loadPlans();
    } catch (error: any) {
      alert(error.message || 'Error al guardar plan');
    }
  };

  const handleEditWarningConfirm = () => {
    if (pendingEditData) {
      savePlan(pendingEditData);
    }
  };

  const handleEditWarningCancel = () => {
    setShowEditWarning(false);
    setPendingEditData(null);
  };

  const handleEdit = (plan: GymPlan) => {
    setEditingPlan(plan);
    const priceStr = plan.price.toString();
    setFormData({
      name: plan.name,
      description: plan.description || '',
      price: priceStr,
      duration_days: plan.duration_days.toString(),
      is_active: plan.is_active,
    });
    setDisplayPrice(formatPrice(priceStr));
    setShowForm(true);
  };

  const handleDeleteClick = async (plan: GymPlan) => {
    setPlanToDelete(plan);
    setDeleteError(null);
    setIsDeleting(true);

    // Verificar primero si hay usuarios activos antes de mostrar el modal
    try {
      const checkResponse = await fetch(
        `/api/admin/gym/memberships?plan_id=${plan.id}`,
      );

      if (checkResponse.ok) {
        const data = await checkResponse.json();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Verificar si hay membresías activas y vigentes
        const activeMemberships = data.filter((m: any) => {
          const endDate = new Date(m.end_date);
          endDate.setHours(0, 0, 0, 0);
          return m.status === 'active' && endDate >= today;
        });

        if (activeMemberships.length > 0) {
          setDeleteError(
            `No se puede eliminar este plan porque tiene ${activeMemberships.length} ${activeMemberships.length === 1 ? 'usuario activo' : 'usuarios activos'}. Debe esperar a que todas las membresías venzan o desactivar el plan en su lugar.`,
          );
        }
      }
    } catch (error: any) {
      // Si hay error al verificar, permitir intentar eliminar (el backend lo validará)
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(true);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!planToDelete) return;

    // Si hay un error mostrado (usuarios activos), solo cerrar el modal
    if (deleteError) {
      handleDeleteCancel();
      return;
    }

    // Si llegamos aquí, no hay error, proceder con la eliminación
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/admin/gym/plans/${planToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al eliminar plan');
      }

      // Éxito: cerrar modal y recargar planes
      setShowDeleteModal(false);
      setPlanToDelete(null);
      loadPlans();
    } catch (error: any) {
      setDeleteError(error.message || 'Error al eliminar plan');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setPlanToDelete(null);
    setDeleteError(null);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      duration_days: '30',
      is_active: true,
    });
    setDisplayPrice('');
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingPlan(null);
    resetForm();
  };

  // Exponer función para abrir modal desde el padre (debe estar después de todas las definiciones de funciones)
  useImperativeHandle(ref, () => ({
    openCreateModal: () => {
      setEditingPlan(null);
      resetForm();
      setDisplayPrice('');
      setShowForm(true);
    },
  }));

  const filteredPlans = useMemo(() => {
    return plans.filter((plan) => {
      const q = searchTerm.trim().toLowerCase();
      const matchesSearch =
        !q ||
        plan.name.toLowerCase().includes(q) ||
        (plan.description || '').toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'active'
            ? plan.is_active
            : !plan.is_active;

      return matchesSearch && matchesStatus;
    });
  }, [plans, searchTerm, statusFilter]);

  const sortedPlans = useMemo(() => {
    const list = [...filteredPlans];
    const dir = sortDir === 'asc' ? 1 : -1;
    list.sort((a, b) => {
      if (sortKey === 'price') {
        return (Number(a.price) - Number(b.price)) * dir;
      }
      if (sortKey === 'duration') {
        return (a.duration_days - b.duration_days) * dir;
      }
      if (sortKey === 'clients') {
        return ((a.active_users_count || 0) - (b.active_users_count || 0)) * dir;
      }
      return a.name.localeCompare(b.name, 'es') * dir;
    });
    return list;
  }, [filteredPlans, sortKey, sortDir]);

  const totalActiveClients = useMemo(
    () =>
      filteredPlans.reduce((sum, plan) => sum + (plan.active_users_count || 0), 0),
    [filteredPlans],
  );

  const handleSort = useCallback((key: SortKey) => {
    if (sortKey === key) {
      setSortDir((current) => (current === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortKey(key);
    setSortDir(key === 'name' ? 'asc' : 'desc');
  }, [sortKey]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-[#85ea10] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Form Modal */}
      {showForm && (
        <div className={modal.overlay}>
          <div className={modal.panel}>
            <div className={modal.header}>
              <h3 className={modal.title}>
                {editingPlan ? 'Editar Plan' : 'Nuevo Plan'}
              </h3>
              <button
                type="button"
                onClick={handleCancel}
                className={modal.closeBtn}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className={modal.body}>
              <div>
                <label className={modal.label}>Nombre del Plan *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className={modal.input}
                  placeholder="Ej: Mensual, Trimestral, Anual"
                />
              </div>

              <div>
                <label className={modal.label}>Descripción</label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className={`${modal.input} resize-none`}
                  rows={3}
                  placeholder="Descripción opcional del plan"
                />
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label className={modal.label}>Precio (COP) *</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-[#164151] dark:text-white">
                      $
                    </span>
                    <input
                      type="text"
                      required
                      value={displayPrice || formatPrice(formData.price) || ''}
                      onChange={(e) => {
                        const formatted = formatPrice(e.target.value);
                        setDisplayPrice(formatted);
                        setFormData({
                          ...formData,
                          price: parsePrice(formatted),
                        });
                      }}
                      className={`${modal.input} pl-8`}
                      placeholder="0"
                    />
                  </div>
                </div>

                <div>
                  <label className={modal.label}>Duración *</label>
                  <div className={styles.durationGrid}>
                    {GYM_DURATION_PRESETS.map((preset) => {
                      const selected = isGymDurationPresetSelected(
                        Number(formData.duration_days) || 30,
                        preset.unit,
                        preset.value,
                      );
                      return (
                        <button
                          key={preset.key}
                          type="button"
                          onClick={() =>
                            setFormData({
                              ...formData,
                              duration_days: String(
                                toDurationDays(preset.unit, preset.value),
                              ),
                            })
                          }
                          className={`${styles.durationChip} ${
                            selected
                              ? styles.durationChipOn
                              : styles.durationChipOff
                          }`}
                        >
                          {preset.label}
                        </button>
                      );
                    })}
                  </div>
                  <p className={modal.helper}>
                    El mes cierra el mismo día (19 ago → 19 sept). Semanas y
                    días son corridos.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) =>
                    setFormData({ ...formData, is_active: e.target.checked })
                  }
                  className="h-4 w-4 cursor-pointer rounded border-gray-300 text-[#85ea10] focus:ring-[#85ea10]"
                />
                <label
                  htmlFor="is_active"
                  className="cursor-pointer text-sm font-medium text-[#164151] dark:text-white"
                >
                  Plan activo
                </label>
              </div>

              <div className={modal.footer}>
                <button
                  type="button"
                  onClick={handleCancel}
                  className={modal.btnCancel}
                >
                  Cancelar
                </button>
                <button type="submit" className={modal.btnPrimary}>
                  <Save className="h-4 w-4" />
                  {editingPlan ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Search and filters */}
      {plans.length > 0 && (
        <div className="bg-white dark:bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-white/10 p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar plan por nombre o descripción..."
                className="w-full pl-10 pr-3 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-[#164151] dark:text-white placeholder-gray-400 dark:placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#85ea10]/50"
              />
            </div>
            <div className="sm:w-56 relative">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(
                    e.target.value as 'all' | 'active' | 'inactive',
                  )
                }
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-[#164151] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#85ea10]/50 appearance-none cursor-pointer"
              >
                <option value="all">Todos los planes</option>
                <option value="active">Activos</option>
                <option value="inactive">Inactivos</option>
              </select>
            </div>
            <button
              onClick={() => {
                setEditingPlan(null);
                resetForm();
                setDisplayPrice('');
                setShowForm(true);
              }}
              className="sm:w-auto h-[42px] px-4 rounded-xl bg-[#164151] text-white hover:bg-[#1a4d5f] font-semibold text-sm inline-flex items-center justify-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nuevo plan
            </button>
          </div>
        </div>
      )}

      {/* Plans List */}
      {plans.length === 0 ? (
        <div className="bg-white dark:bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-white/10 p-12 text-center">
          <Dumbbell className="w-12 h-12 text-gray-300 dark:text-white/20 mx-auto mb-4" />
          <p className="text-[#164151] dark:text-white font-medium mb-2">
            No hay planes creados
          </p>
          <p className="text-sm text-[#164151]/60 dark:text-white/60">
            Crea tu primer plan para comenzar
          </p>
        </div>
      ) : filteredPlans.length === 0 ? (
        <div className="bg-white dark:bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-white/10 p-12 text-center">
          <p className="text-[#164151] dark:text-white font-medium mb-2">
            No hay planes para los filtros seleccionados
          </p>
          <p className="text-sm text-[#164151]/60 dark:text-white/60">
            Ajusta la búsqueda o cambia el filtro de estado.
          </p>
        </div>
      ) : (
        <div className={styles.tableShell}>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={`${styles.th} ${styles.thLeft}`}>
                    <button
                      type="button"
                      onClick={() => handleSort('name')}
                      className={styles.sortButton}
                    >
                      Plan
                      <SortIcon active={sortKey === 'name'} direction={sortDir} />
                    </button>
                  </th>
                  <th className={`${styles.th} ${styles.thLeft}`}>Estado</th>
                  <th className={`${styles.th} ${styles.thRight}`}>
                    <button
                      type="button"
                      onClick={() => handleSort('price')}
                      className={`${styles.sortButton} ml-auto`}
                    >
                      Precio
                      <SortIcon active={sortKey === 'price'} direction={sortDir} />
                    </button>
                  </th>
                  <th className={`${styles.th} ${styles.thRight}`}>
                    <button
                      type="button"
                      onClick={() => handleSort('duration')}
                      className={`${styles.sortButton} ml-auto`}
                    >
                      Duración
                      <SortIcon
                        active={sortKey === 'duration'}
                        direction={sortDir}
                      />
                    </button>
                  </th>
                  <th className={`${styles.th} ${styles.thRight}`}>
                    <button
                      type="button"
                      onClick={() => handleSort('clients')}
                      className={`${styles.sortButton} ml-auto`}
                    >
                      Clientes
                      <SortIcon
                        active={sortKey === 'clients'}
                        direction={sortDir}
                      />
                    </button>
                  </th>
                  <th className={`${styles.th} ${styles.thRight}`}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {sortedPlans.map((plan) => {
                  const activeTotal = plan.active_users_count || 0;
                  const detailHref = `/admin/gym-plans/${plan.id}`;
                  return (
                    <tr
                      key={plan.id}
                      className={`${styles.row} ${!plan.is_active ? 'opacity-60' : ''}`}
                      onClick={() => router.push(detailHref)}
                    >
                      <td className={styles.td}>
                        <Link
                          href={detailHref}
                          className={styles.planName}
                          onClick={(event) => event.stopPropagation()}
                        >
                          {plan.name}
                        </Link>
                        {plan.description ? (
                          <p className={styles.planDesc}>{plan.description}</p>
                        ) : null}
                      </td>
                      <td className={styles.td}>
                        <span
                          className={
                            plan.is_active
                              ? styles.badgeActive
                              : styles.badgeInactive
                          }
                        >
                          {plan.is_active ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className={`${styles.td} text-right`}>
                        <span className={styles.price}>
                          $
                          {parseFloat(plan.price.toString()).toLocaleString(
                            'es-CO',
                          )}
                        </span>
                        <span className={styles.priceCurrency}>COP</span>
                      </td>
                      <td
                        className={`${styles.td} text-right tabular-nums whitespace-nowrap`}
                      >
                        {formatGymPlanDuration(plan.duration_days)}
                      </td>
                      <td className={`${styles.td} text-right`}>
                        <span
                          className={
                            activeTotal > 0
                              ? styles.clientCount
                              : styles.clientCountEmpty
                          }
                        >
                          {activeTotal}
                        </span>
                      </td>
                      <td className={`${styles.td} text-right`}>
                        <div className="inline-flex items-center justify-end gap-0.5">
                          <Link
                            href={detailHref}
                            onClick={(event) => event.stopPropagation()}
                            className={styles.actionBtn}
                            title="Ver detalle"
                            aria-label={`Ver detalle de ${plan.name}`}
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleEdit(plan);
                            }}
                            className={styles.actionBtn}
                            title="Editar"
                            aria-label={`Editar ${plan.name}`}
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleDeleteClick(plan);
                            }}
                            className={styles.actionDanger}
                            title="Eliminar"
                            aria-label={`Eliminar ${plan.name}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className={styles.footer}>
            <p className={styles.footerText}>
              {filteredPlans.length}{' '}
              {filteredPlans.length === 1 ? 'plan' : 'planes'}
              <span className="mx-2 text-gray-300 dark:text-white/20">·</span>
              {totalActiveClients}{' '}
              {totalActiveClients === 1 ? 'cliente activo' : 'clientes activos'}
            </p>
          </div>
        </div>
      )}

      {/* Modal de confirmación de eliminación */}
      <ConfirmDialog
        isOpen={showDeleteModal}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title={deleteError ? 'No se puede eliminar' : 'Eliminar Plan'}
        message={
          deleteError
            ? deleteError
            : planToDelete
              ? `¿Estás seguro de eliminar el plan "${planToDelete.name}"? Esta acción no se puede deshacer.`
              : ''
        }
        type={deleteError ? 'danger' : 'warning'}
        confirmText={deleteError ? 'Entendido' : 'Eliminar'}
        cancelText={deleteError ? undefined : 'Cancelar'}
        isLoading={isDeleting}
      />

      {/* Modal de advertencia al editar precio/duración */}
      <ConfirmDialog
        isOpen={showEditWarning}
        onClose={handleEditWarningCancel}
        onConfirm={handleEditWarningConfirm}
        title="Confirmar Cambios en el Plan"
        message={
          editingPlan && pendingEditData
            ? `Estás a punto de modificar el ${pendingEditData.price !== editingPlan.price && pendingEditData.duration_days !== editingPlan.duration_days ? 'precio y la duración' : pendingEditData.price !== editingPlan.price ? 'precio' : 'duración'} del plan "${editingPlan.name}".

⚠️ Importante: Los cambios que realices solo aplicarán a las nuevas facturas y membresías generadas a partir de este momento. Las facturas y membresías ya creadas con el precio y duración anteriores NO se modificarán.

¿Deseas continuar con los cambios?`
            : ''
        }
        type="info"
        confirmText="Sí, continuar"
        cancelText="Cancelar"
        isLoading={false}
      />
    </div>
  );
});

GymPlansManagement.displayName = 'GymPlansManagement';

export default GymPlansManagement;
