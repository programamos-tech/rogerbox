'use client';

import {
  CreditCard,
  FileText,
  Loader2,
  Mail,
  MapPin,
  Shield,
  User,
  X,
} from 'lucide-react';
import { useWompi } from './useWompi';

interface WompiCheckoutProps {
  course: {
    id: string;
    title: string;
    price: number;
    original_price?: number;
    discount_percentage?: number;
  };
  onSuccess?: () => void;
  onError?: (error: string) => void;
  onClose?: () => void;
}

import { useState } from 'react';

export default function WompiCheckout({
  course,
  onSuccess,
  onError,
  onClose,
}: WompiCheckoutProps) {
  const [localError, setLocalError] = useState<string | null>(null);

  const {
    buyerData,
    setBuyerData,
    isLoading,
    isLoadingProfile,
    wompiPublicKey,
    isFormValid,
    handlePayment,
  } = useWompi({
    course,
    onSuccess,
    onError: (err) => {
      setLocalError(err);
      if (onError) onError(err);
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl max-w-xl w-full mx-4 max-h-[90vh] overflow-y-auto relative">
        {/* Close Button */}
        <button
          onClick={onClose || (() => {})}
          className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors shadow-sm"
          aria-label="Cerrar"
        >
          <X className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-[#85ea10] rounded-full flex items-center justify-center mx-auto mb-4">
            <CreditCard className="w-8 h-8 text-black" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Completar Pago
          </h2>
          <p className="text-gray-600 dark:text-gray-400">{course.title}</p>
        </div>

        {/* Precio */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
            {course.original_price && course.original_price > course.price ? (
              <span className="text-gray-500 line-through">
                ${course.original_price.toLocaleString('es-CO')} COP
              </span>
            ) : (
              <span className="text-gray-900 dark:text-white font-semibold">
                ${course.price.toLocaleString('es-CO')} COP
              </span>
            )}
          </div>

          {course.original_price && course.original_price > course.price && (
            <>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[#85ea10] font-semibold">
                  Descuento ({course.discount_percentage}%)
                </span>
                <span className="text-[#85ea10] font-semibold">
                  -$
                  {(course.original_price - course.price).toLocaleString(
                    'es-CO',
                  )}{' '}
                  COP
                </span>
              </div>
              <div className="border-t border-gray-300 dark:border-gray-600 pt-2 mt-2">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-gray-900 dark:text-white">
                    Total
                  </span>
                  <span className="text-2xl font-bold text-[#85ea10]">
                    ${course.price.toLocaleString('es-CO')} COP
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Local Error Display */}
        {localError && (
          <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-lg mb-6 text-sm font-medium border border-red-200 dark:border-red-800 flex items-start gap-2">
            <Shield className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{localError}</span>
          </div>
        )}

        {/* Formulario de datos del comprador */}
        <div className="space-y-4 mb-6">
          {isLoadingProfile ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-[#85ea10] mr-2" />
              <span className="text-gray-600 dark:text-gray-400">
                Cargando datos...
              </span>
            </div>
          ) : (
            <>
              {/* Nombres y Apellidos */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nombres <span className="text-[#85ea10]">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={buyerData.firstName}
                      onChange={(e) =>
                        setBuyerData({
                          ...buyerData,
                          firstName: e.target.value,
                        })
                      }
                      placeholder="Juan Carlos"
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#85ea10] dark:bg-gray-700 dark:text-white text-sm"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Apellidos <span className="text-[#85ea10]">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={buyerData.lastName}
                      onChange={(e) =>
                        setBuyerData({ ...buyerData, lastName: e.target.value })
                      }
                      placeholder="Pérez García"
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#85ea10] dark:bg-gray-700 dark:text-white text-sm"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Cédula/NIT */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tipo Doc <span className="text-[#85ea10]">*</span>
                  </label>
                  <select
                    value={buyerData.documentType}
                    onChange={(e) =>
                      setBuyerData({
                        ...buyerData,
                        documentType: e.target.value as
                          | 'CC'
                          | 'NIT'
                          | 'CE'
                          | 'PP',
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#85ea10] dark:bg-gray-700 dark:text-white text-sm"
                  >
                    <option value="CC">C.C.</option>
                    <option value="NIT">NIT</option>
                    <option value="CE">C.E.</option>
                    <option value="PP">Pasaporte</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Número de Documento{' '}
                    <span className="text-[#85ea10]">*</span>
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={buyerData.documentId}
                      onChange={(e) =>
                        setBuyerData({
                          ...buyerData,
                          documentId: e.target.value.replace(/[^0-9-]/g, ''),
                        })
                      }
                      placeholder="1234567890"
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#85ea10] dark:bg-gray-700 dark:text-white text-sm"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Correo electrónico */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Correo electrónico <span className="text-[#85ea10]">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={buyerData.email}
                    onChange={(e) =>
                      setBuyerData({ ...buyerData, email: e.target.value })
                    }
                    placeholder="tu@email.com"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#85ea10] dark:bg-gray-700 dark:text-white text-sm"
                    required
                  />
                </div>
              </div>

              {/* Dirección */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Dirección de residencia{' '}
                  <span className="text-[#85ea10]">*</span>
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={buyerData.address}
                    onChange={(e) =>
                      setBuyerData({ ...buyerData, address: e.target.value })
                    }
                    placeholder="Calle 123 # 45-67, Barrio, Ciudad"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#85ea10] dark:bg-gray-700 dark:text-white text-sm"
                    required
                  />
                </div>
              </div>

              <p className="text-xs text-gray-500 dark:text-gray-400">
                <span className="text-[#85ea10]">*</span> Campos obligatorios.
                Esta información se usará para tu factura.
              </p>
            </>
          )}
        </div>

        {/* Botón de pago */}
        <button
          onClick={handlePayment}
          disabled={
            isLoading || !wompiPublicKey || !isFormValid() || isLoadingProfile
          }
          className="w-full bg-[#85ea10] hover:bg-[#7dd30f] text-black font-bold py-4 px-6 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Procesando...
            </>
          ) : !wompiPublicKey ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Cargando configuración...
            </>
          ) : isLoadingProfile ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Cargando datos...
            </>
          ) : (
            <>
              <CreditCard className="w-5 h-5 mr-2" />
              Completar Pago
            </>
          )}
        </button>

        {/* Información de seguridad */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center justify-center gap-1">
            <Shield className="w-3 h-3 text-[#85ea10]" /> Pago 100% seguro
            procesado por <strong>Wompi</strong>
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Tus datos están protegidos con encriptación SSL
          </p>
        </div>
      </div>
    </div>
  );
}
