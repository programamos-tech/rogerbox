'use client';

import {
  Calendar,
  Filter,
  Plus,
  Save,
  Search,
  Trash2,
  Wallet,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { DatePickerField } from '@/shared/components/DatePickerField';
import type { GymExpense, GymExpensePaymentMethod } from '@/types/gym';

const PAYMENT_METHOD_LABEL: Record<GymExpensePaymentMethod, string> = {
  cash: 'Efectivo',
  transfer: 'Transferencia',
  mixed: 'Mixto',
};

function todayYmd() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`;
}

function formatCopThousands(value: string) {
  const digits = value.replace(/\D/g, '');
  if (!digits) return '';
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function parseFormattedAmount(value: string) {
  const digits = value.replace(/\D/g, '');
  return digits ? Number(digits) : 0;
}

export default function GymExpensesManagement() {
  const [expenses, setExpenses] = useState<GymExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [monthFilter, setMonthFilter] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    concept: '',
    category: '',
    amount: '',
    expense_date: todayYmd(),
    payment_method: 'cash' as GymExpensePaymentMethod,
    notes: '',
  });
  const [customCategory, setCustomCategory] = useState('');

  const loadExpenses = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        search,
        category: categoryFilter,
        ...(monthFilter ? { month: monthFilter } : {}),
      });
      const response = await fetch(`/api/admin/gym/expenses?${params}`);
      if (!response.ok) throw new Error('Error al cargar egresos');
      const data = await response.json();
      setExpenses(data || []);
    } catch {
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => {
      loadExpenses();
    }, search ? 250 : 0);
    return () => clearTimeout(t);
  }, [search, categoryFilter, monthFilter]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    expenses.forEach((e) => set.add(e.category));
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'es'));
  }, [expenses]);

  const totalAmount = useMemo(
    () => expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0),
    [expenses],
  );

  const resetForm = () => {
    setFormData({
      concept: '',
      category: '',
      amount: '',
      expense_date: todayYmd(),
      payment_method: 'cash',
      notes: '',
    });
    setCustomCategory('');
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const finalCategory =
      formData.category === '__custom__'
        ? customCategory.trim()
        : formData.category.trim();

    if (!formData.concept.trim() || !finalCategory) {
      setError('Concepto y categoría son obligatorios');
      return;
    }
    const parsedAmount = parseFormattedAmount(formData.amount);
    if (!formData.amount || parsedAmount <= 0) {
      setError('El monto debe ser mayor a 0');
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch('/api/admin/gym/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          concept: formData.concept,
          category: finalCategory,
          amount: parsedAmount,
          expense_date: formData.expense_date,
          payment_method: formData.payment_method,
          notes: formData.notes || null,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Error al registrar egreso');
      }
      resetForm();
      setShowForm(false);
      loadExpenses();
    } catch (err: any) {
      setError(err.message || 'Error al registrar egreso');
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteExpense = async (id: string) => {
    if (!confirm('¿Eliminar este egreso?')) return;
    const response = await fetch(`/api/admin/gym/expenses/${id}`, {
      method: 'DELETE',
    });
    if (response.ok) {
      loadExpenses();
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="bg-white dark:bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-white/10 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por concepto o categoría..."
              className="w-full pl-10 pr-3 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-[#164151] dark:text-white placeholder-gray-400 dark:placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#85ea10]/50"
            />
          </div>
          <div className="sm:w-52 relative">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-[#164151] dark:text-white appearance-none"
            >
              <option value="all">Todas categorías</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:w-44 relative">
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="month"
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="w-full pl-10 pr-3 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-[#164151] dark:text-white"
            />
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="h-[42px] px-4 rounded-xl bg-[#164151] text-white hover:bg-[#1a4d5f] font-semibold text-sm inline-flex items-center justify-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nuevo egreso
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-white/10 p-4">
        <p className="text-sm text-[#164151]/70 dark:text-white/60">Egresos totales</p>
        <p className="text-2xl font-bold text-[#164151] dark:text-white">
          ${totalAmount.toLocaleString('es-CO')}
        </p>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-white/10 w-full max-w-2xl">
            <div className="p-5 border-b border-gray-200 dark:border-white/10 flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#164151] dark:text-white">
                Registrar egreso
              </h3>
              <button
                onClick={() => setShowForm(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/10"
              >
                <X className="w-4 h-4 text-[#164151]/80 dark:text-white/70" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {error ? (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {error}
                </div>
              ) : null}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  value={formData.concept}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, concept: e.target.value }))
                  }
                  placeholder="Concepto del egreso"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-[#164151]"
                />
                <div className="space-y-2">
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, category: e.target.value }))
                    }
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-[#164151]"
                  >
                    <option value="">Tipo de egreso</option>
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                    <option value="__custom__">Otro (escribir manual)</option>
                  </select>
                  {formData.category === '__custom__' && (
                    <input
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      placeholder="Escribe el tipo de egreso"
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-[#164151]"
                    />
                  )}
                </div>
                <div className="relative">
                  <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        amount: formatCopThousands(e.target.value),
                      }))
                    }
                    placeholder="Monto"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-[#164151]"
                  />
                </div>
                <DatePickerField
                  value={formData.expense_date}
                  onChange={(iso) =>
                    setFormData((prev) => ({ ...prev, expense_date: iso }))
                  }
                  aria-label="Fecha del egreso"
                />
                <select
                  value={formData.payment_method}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      payment_method: e.target.value as GymExpensePaymentMethod,
                    }))
                  }
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-[#164151]"
                >
                  <option value="cash">Efectivo</option>
                  <option value="transfer">Transferencia</option>
                  <option value="mixed">Mixto</option>
                </select>
                <input
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  placeholder="Notas (opcional)"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-[#164151]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2.5 rounded-lg border border-gray-200 text-[#164151]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2.5 rounded-lg bg-[#164151] text-white font-semibold inline-flex items-center gap-2 disabled:opacity-60"
                >
                  <Save className="w-4 h-4" />
                  {isSubmitting ? 'Guardando...' : 'Guardar egreso'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-[#85ea10] border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : expenses.length === 0 ? (
        <div className="bg-white dark:bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-white/10 p-12 text-center">
          <Wallet className="w-14 h-14 text-gray-300 dark:text-white/20 mx-auto mb-3" />
          <p className="text-[#164151] dark:text-white font-medium">
            No hay egresos registrados
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead>
                <tr className="border-b border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-transparent">
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-white/40">
                    Fecha
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-white/40">
                    Concepto
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-white/40">
                    Categoría
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-white/40">
                    Método
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-white/40">
                    Monto
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-white/40">
                    Acción
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {expenses.map((expense) => (
                  <tr key={expense.id}>
                    <td className="px-4 py-3 text-sm text-[#164151] dark:text-white">
                      {expense.expense_date}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold text-[#164151] dark:text-white">
                        {expense.concept}
                      </p>
                      {expense.notes ? (
                        <p className="text-xs text-[#164151]/60 dark:text-white/50 mt-0.5">
                          {expense.notes}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-sm text-[#164151] dark:text-white">
                      {expense.category}
                    </td>
                    <td className="px-4 py-3 text-sm text-[#164151] dark:text-white">
                      {PAYMENT_METHOD_LABEL[expense.payment_method]}
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-[#164151] dark:text-white">
                      ${Number(expense.amount).toLocaleString('es-CO')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => deleteExpense(expense.id)}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-red-500/12 text-red-700 hover:bg-red-500/20 border border-red-500/25"
                        title="Eliminar egreso"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

