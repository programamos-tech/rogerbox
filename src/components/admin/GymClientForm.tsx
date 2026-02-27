'use client';

import { useState } from 'react';
import { X, Save, User, CreditCard, Phone, Mail, Calendar, Scale, FileText } from 'lucide-react';
import { GymClientInfoInsert } from '@/types/gym';

interface GymClientFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  clientToEdit?: any;
}

export default function GymClientForm({ isOpen, onClose, onSuccess, clientToEdit }: GymClientFormProps) {
  const [formData, setFormData] = useState<GymClientInfoInsert>({
    document_id: clientToEdit?.document_id || '',
    name: clientToEdit?.name || '',
    email: clientToEdit?.email || '',
    whatsapp: clientToEdit?.whatsapp || '',
    birth_date: clientToEdit?.birth_date || '',
    weight: clientToEdit?.weight || undefined,
    medical_restrictions: clientToEdit?.medical_restrictions || '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validaciones
    if (!formData.document_id.trim()) {
      setError('La cédula es obligatoria');
      return;
    }
    if (!formData.name.trim()) {
      setError('El nombre es obligatorio');
      return;
    }
    if (!formData.whatsapp.trim()) {
      setError('El WhatsApp es obligatorio');
      return;
    }
    // Validar que el WhatsApp tenga al menos 10 dígitos
    const digitsOnly = formData.whatsapp.replace(/\D/g, '');
    if (digitsOnly.length < 10) {
      setError('El WhatsApp debe tener al menos 10 dígitos');
      return;
    }

    setIsLoading(true);

    try {
      const url = clientToEdit
        ? `/api/admin/gym/clients/${clientToEdit.id}`
        : '/api/admin/gym/clients';
      const method = clientToEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.error || 'Error al guardar cliente';
        console.error('Error guardando cliente:', errorMessage, data);
        throw new Error(errorMessage);
      }

      onSuccess();
      handleClose();
    } catch (err: any) {
      setError(err.message || 'Error al guardar cliente');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      document_id: '',
      name: '',
      email: '',
      whatsapp: '',
      birth_date: '',
      weight: undefined,
      medical_restrictions: '',
    });
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-white/10 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-white/10 flex items-center justify-between">
          <h3 className="text-lg font-bold text-[#164151] dark:text-white">
            {clientToEdit ? 'Editar Cliente' : 'Nuevo Cliente Físico'}
          </h3>
          <button
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-[#164151]/80 dark:text-white/60"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-600 dark:text-red-400 text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Campos Obligatorios */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-[#164151] dark:text-white uppercase tracking-wider">
              Campos Obligatorios
            </h4>

            {/* Cédula */}
            <div>
              <label className="block text-sm font-semibold text-[#164151] dark:text-white mb-2">
                Cédula *
              </label>
              <div className="relative">
                <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  required
                  value={formData.document_id}
                  onChange={(e) => setFormData({ ...formData, document_id: e.target.value.replace(/[^0-9-]/g, '') })}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-[#164151] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#85ea10]/50"
                  placeholder="1234567890"
                  disabled={!!clientToEdit}
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-white/40 mt-1">
                {clientToEdit ? 'La cédula no se puede modificar' : 'Se usará para vincular cuando se registre en RogerBox'}
              </p>
            </div>

            {/* Nombre */}
            <div>
              <label className="block text-sm font-semibold text-[#164151] dark:text-white mb-2">
                Nombre Completo *
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-[#164151] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#85ea10]/50"
                  placeholder="Juan Pérez"
                />
              </div>
            </div>

            {/* WhatsApp */}
            <div>
              <label className="block text-sm font-semibold text-[#164151] dark:text-white mb-2">
                WhatsApp *
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  required
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-[#164151] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#85ea10]/50"
                  placeholder="3001234567 (mínimo 10 dígitos)"
                />
              </div>
            </div>
          </div>

          {/* Campos Opcionales */}
          <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-white/10">
            <h4 className="text-sm font-semibold text-[#164151] dark:text-white uppercase tracking-wider">
              Campos Opcionales
            </h4>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-[#164151] dark:text-white mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-[#164151] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#85ea10]/50"
                  placeholder="correo@ejemplo.com"
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-white/40 mt-1">
                Para invitación a registrarse en RogerBox
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Fecha de Nacimiento */}
              <div>
                <label className="block text-sm font-semibold text-[#164151] dark:text-white mb-2">
                  Fecha de Nacimiento
                </label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="date"
                    value={formData.birth_date || ''}
                    onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-[#164151] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#85ea10]/50"
                  />
                </div>
              </div>

              {/* Peso */}
              <div>
                <label className="block text-sm font-semibold text-[#164151] dark:text-white mb-2">
                  Peso (kg)
                </label>
                <div className="relative">
                  <Scale className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.weight || ''}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value ? parseFloat(e.target.value) : undefined })}
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-[#164151] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#85ea10]/50"
                    placeholder="70.5"
                  />
                </div>
              </div>
            </div>

            {/* Restricciones Médicas */}
            <div>
              <label className="block text-sm font-semibold text-[#164151] dark:text-white mb-2">
                Restricciones/Historial Clínico
              </label>
              <div className="relative">
                <FileText className="absolute left-4 top-3 w-4 h-4 text-gray-400" />
                <textarea
                  value={formData.medical_restrictions || ''}
                  onChange={(e) => setFormData({ ...formData, medical_restrictions: e.target.value })}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-[#164151] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#85ea10]/50 resize-none"
                  rows={3}
                  placeholder="Lesiones, condiciones médicas, restricciones de ejercicio..."
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-white/10">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="px-5 py-2.5 rounded-lg border border-gray-200 dark:border-white/10 text-[#164151] dark:text-white hover:bg-gray-50 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2.5 rounded-lg bg-[#85ea10] text-black font-semibold hover:bg-[#85ea10]/90 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isLoading ? 'Guardando...' : clientToEdit ? 'Actualizar' : 'Crear Cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
