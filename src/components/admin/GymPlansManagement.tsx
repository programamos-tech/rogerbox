'use client';

import { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { Plus, Edit, Trash2, X, Save, DollarSign, Calendar, Dumbbell } from 'lucide-react';
import { GymPlan } from '@/types/gym';

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
    duration_days: '',
    is_active: true,
  });
  const [displayPrice, setDisplayPrice] = useState('');

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
      console.error('Error loading plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        price: parseFloat(parsePrice(formData.price)),
        duration_days: parseInt(formData.duration_days),
        is_active: formData.is_active,
      };

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
      resetForm();
      loadPlans();
    } catch (error: any) {
      alert(error.message || 'Error al guardar plan');
    }
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

  const handleDelete = async (plan: GymPlan) => {
    if (!confirm(`¿Estás seguro de eliminar el plan "${plan.name}"?`)) return;

    try {
      const response = await fetch(`/api/admin/gym/plans/${plan.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al eliminar plan');
      }

      loadPlans();
    } catch (error: any) {
      alert(error.message || 'Error al eliminar plan');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      duration_days: '',
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-[#85ea10] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-white/10 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-8 border-b border-gray-200 dark:border-white/10 flex items-center justify-between">
              <h3 className="text-2xl font-bold text-[#164151] dark:text-white">
                {editingPlan ? 'Editar Plan' : 'Nuevo Plan'}
              </h3>
              <button
                onClick={handleCancel}
                className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-[#164151]/80 dark:text-white/60 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-[#164151] dark:text-white mb-3">
                  Nombre del Plan *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-5 py-3.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-[#164151] dark:text-white placeholder-gray-400 dark:placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#85ea10]/50 focus:border-[#85ea10]/50 transition-all text-base"
                  placeholder="Ej: Mensual, Trimestral, Anual"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#164151] dark:text-white mb-3">
                  Descripción
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-5 py-3.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-[#164151] dark:text-white placeholder-gray-400 dark:placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#85ea10]/50 focus:border-[#85ea10]/50 resize-none transition-all text-base"
                  rows={4}
                  placeholder="Descripción opcional del plan"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-[#164151] dark:text-white mb-3">
                    Precio (COP) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-[#164151] dark:text-white font-medium text-base">
                      $
                    </span>
                    <input
                      type="text"
                      required
                      value={displayPrice || formatPrice(formData.price) || ''}
                      onChange={(e) => {
                        const formatted = formatPrice(e.target.value);
                        setDisplayPrice(formatted);
                        setFormData({ ...formData, price: parsePrice(formatted) });
                      }}
                      className="w-full pl-8 pr-5 py-3.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-[#164151] dark:text-white placeholder-gray-400 dark:placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#85ea10]/50 focus:border-[#85ea10]/50 transition-all text-base"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#164151] dark:text-white mb-3">
                    Duración (días) *
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      required
                      min="1"
                      value={formData.duration_days}
                      onChange={(e) => setFormData({ ...formData, duration_days: e.target.value })}
                      className="w-full pl-12 pr-5 py-3.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-[#164151] dark:text-white placeholder-gray-400 dark:placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#85ea10]/50 focus:border-[#85ea10]/50 transition-all text-base"
                      placeholder="30"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-300 text-[#85ea10] focus:ring-[#85ea10] cursor-pointer"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-[#164151] dark:text-white cursor-pointer">
                  Plan activo
                </label>
              </div>

              <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200 dark:border-white/10">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-6 py-3 rounded-lg bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-[#164151] dark:text-white font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-white/90 font-semibold transition-colors flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {editingPlan ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Plans List */}
      {plans.length === 0 ? (
        <div className="bg-white dark:bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-white/10 p-12 text-center">
          <Dumbbell className="w-12 h-12 text-gray-300 dark:text-white/20 mx-auto mb-4" />
          <p className="text-[#164151] dark:text-white font-medium mb-2">No hay planes creados</p>
          <p className="text-sm text-[#164151]/60 dark:text-white/60">Crea tu primer plan para comenzar</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`bg-white dark:bg-gray-900/50 backdrop-blur-sm rounded-2xl border ${
                plan.is_active
                  ? 'border-gray-200 dark:border-white/10'
                  : 'border-gray-300 dark:border-white/20 opacity-60'
              } p-6 shadow-sm dark:shadow-none`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-[#164151] dark:text-white mb-1">{plan.name}</h3>
                  {plan.description && (
                    <p className="text-sm text-[#164151]/60 dark:text-white/60 line-clamp-2">{plan.description}</p>
                  )}
                </div>
                {!plan.is_active && (
                  <span className="px-2 py-1 text-xs font-semibold bg-gray-200 dark:bg-white/10 text-gray-600 dark:text-white/60 rounded-full">
                    Inactivo
                  </span>
                )}
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#164151]/80 dark:text-white/60">Precio:</span>
                  <span className="text-lg font-bold text-[#164151] dark:text-white">
                    ${parseFloat(plan.price.toString()).toLocaleString('es-CO')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#164151]/80 dark:text-white/60">Duración:</span>
                  <span className="text-sm font-semibold text-[#164151] dark:text-white">
                    {plan.duration_days} días
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-4 border-t border-gray-200 dark:border-white/10">
                <button
                  onClick={() => handleEdit(plan)}
                  className="flex-1 px-3 py-2 rounded-lg bg-gray-100 dark:bg-white/10 text-[#164151] dark:text-white hover:bg-gray-200 dark:hover:bg-white/20 transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  <Edit className="w-3.5 h-3.5" />
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(plan)}
                  className="px-3 py-2 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

GymPlansManagement.displayName = 'GymPlansManagement';

export default GymPlansManagement;
