'use client';

import {
  CreditCard,
  FileText,
  Mail,
  Phone,
  Save,
  Scale,
  User,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { adminFormModalStyles as modal } from '@/modules/gym-admin/styles';
import { DatePickerField } from '@/shared/components/DatePickerField';
import type { GymClientInfoInsert } from '@/types/gym';

interface GymClientFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  clientToEdit?: any;
}

export default function GymClientForm({
  isOpen,
  onClose,
  onSuccess,
  clientToEdit,
}: GymClientFormProps) {
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

    if (!formData.document_id.trim()) {
      setError('La cédula es obligatoria');
      return;
    }
    const docDigits = formData.document_id.replace(/\D/g, '');
    if (docDigits.length < 7 || docDigits.length > 12) {
      setError('La cédula debe tener entre 7 y 12 dígitos');
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
        throw new Error(data.error || 'Error al guardar cliente');
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
    <div className={modal.overlay}>
      <div className={modal.panel}>
        <div className={modal.header}>
          <h3 className={modal.title}>
            {clientToEdit ? 'Editar Cliente' : 'Nuevo Cliente Físico'}
          </h3>
          <button
            type="button"
            onClick={handleClose}
            className={modal.closeBtn}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={modal.body}>
          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
              <p className="text-sm font-medium text-red-600 dark:text-red-400">
                {error}
              </p>
            </div>
          ) : null}

          <div className="space-y-4">
            <h4 className={modal.sectionTitle}>Campos obligatorios</h4>

            <div>
              <label className={modal.label}>Cédula *</label>
              <div className="relative">
                <CreditCard className={modal.inputIcon} />
                <input
                  type="text"
                  required
                  value={formData.document_id}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      document_id: e.target.value.replace(/[^0-9-]/g, ''),
                    })
                  }
                  className={modal.inputWithIcon}
                  placeholder="1234567890"
                  disabled={!!clientToEdit}
                />
              </div>
              <p className={modal.helper}>
                {clientToEdit
                  ? 'La cédula no se puede modificar'
                  : 'Se usará para vincular cuando se registre en RogerBox'}
              </p>
            </div>

            <div>
              <label className={modal.label}>Nombre completo *</label>
              <div className="relative">
                <User className={modal.inputIcon} />
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className={modal.inputWithIcon}
                  placeholder="Juan Pérez"
                />
              </div>
            </div>

            <div>
              <label className={modal.label}>WhatsApp *</label>
              <div className="relative">
                <Phone className={modal.inputIcon} />
                <input
                  type="text"
                  required
                  value={formData.whatsapp}
                  onChange={(e) =>
                    setFormData({ ...formData, whatsapp: e.target.value })
                  }
                  className={modal.inputWithIcon}
                  placeholder="3001234567 (mínimo 10 dígitos)"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4 border-t border-gray-200 pt-5 dark:border-white/10">
            <h4 className={modal.sectionTitle}>Campos opcionales</h4>

            <div>
              <label className={modal.label}>Email</label>
              <div className="relative">
                <Mail className={modal.inputIcon} />
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className={modal.inputWithIcon}
                  placeholder="correo@ejemplo.com"
                />
              </div>
              <p className={modal.helper}>
                Para invitación a registrarse en RogerBox
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={modal.label}>Fecha de nacimiento</label>
                <DatePickerField
                  id="gym-client-birth-date"
                  value={formData.birth_date || ''}
                  onChange={(iso) =>
                    setFormData({ ...formData, birth_date: iso })
                  }
                  aria-label="Fecha de nacimiento"
                  className="w-full"
                  triggerClassName="py-2.5 text-sm bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 focus:ring-2 focus:ring-[#85ea10]/50"
                />
              </div>

              <div>
                <label className={modal.label}>Peso (kg)</label>
                <div className="relative">
                  <Scale className={modal.inputIcon} />
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.weight || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        weight: e.target.value
                          ? parseFloat(e.target.value)
                          : undefined,
                      })
                    }
                    className={modal.inputWithIcon}
                    placeholder="70.5"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className={modal.label}>
                Restricciones / historial clínico
              </label>
              <div className="relative">
                <FileText className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
                <textarea
                  value={formData.medical_restrictions || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      medical_restrictions: e.target.value,
                    })
                  }
                  className={`${modal.inputWithIcon} resize-none`}
                  rows={3}
                  placeholder="Lesiones, condiciones médicas, restricciones de ejercicio..."
                />
              </div>
            </div>
          </div>

          <div className={modal.footer}>
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className={modal.btnCancel}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className={modal.btnPrimary}
            >
              <Save className="h-4 w-4" />
              {isLoading
                ? 'Guardando...'
                : clientToEdit
                  ? 'Actualizar'
                  : 'Crear cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
