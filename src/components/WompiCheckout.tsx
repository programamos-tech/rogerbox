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
import { useEffect, useState } from 'react';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { supabase } from '@/lib/supabase-browser';

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

interface BuyerData {
  firstName: string;
  lastName: string;
  email: string;
  documentId: string;
  documentType: 'CC' | 'NIT' | 'CE' | 'PP';
  address: string;
}

export default function WompiCheckout({
  course,
  onSuccess,
  onError,
  onClose,
}: WompiCheckoutProps) {
  const { user } = useSupabaseAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [widgetReady, setWidgetReady] = useState(false);
  const [wompiPublicKey, setWompiPublicKey] = useState<string>('');

  // Datos del comprador
  const [buyerData, setBuyerData] = useState<BuyerData>({
    firstName: '',
    lastName: '',
    email: '',
    documentId: '',
    documentType: 'CC',
    address: '',
  });

  // Obtener la public key del servidor
  useEffect(() => {
    const fetchWompiConfig = async () => {
      try {
        const response = await fetch('/api/payments/config');
        const data = await response.json();

        if (data.publicKey) {
          setWompiPublicKey(data.publicKey);
        } else {
          onError?.('Error de configuración del sistema de pagos');
        }
      } catch (error) {
        onError?.('Error al cargar la configuración de pagos');
      }
    };

    fetchWompiConfig();
  }, [onError]);

  // Verificar si el widget está disponible
  useEffect(() => {
    let attempts = 0;
    const maxAttempts = 100; // 10 segundos máximo (aumentado para dar más tiempo)

    const checkWidget = () => {
      attempts++;
      if (attempts % 10 === 0) {
      }

      if (
        typeof window !== 'undefined' &&
        typeof window.WidgetCheckout === 'function'
      ) {
        // Verificar que se puede instanciar (sin crear realmente una instancia)
        try {
          // Solo verificar que es una función, no crear instancia aún
          if (typeof window.WidgetCheckout === 'function') {
            setWidgetReady(true);
            return;
          }
        } catch (e) {}
      }

      if (attempts < maxAttempts) {
        setTimeout(checkWidget, 100);
      } else {
        const wompiScripts = Array.from(document.scripts)
          .map((s) => s.src)
          .filter((src) => src.includes('wompi'));
        if (wompiScripts.length === 0) {
          onError?.(
            'El widget de pago no se cargó correctamente. Por favor recarga la página.',
          );
        }
      }
    };

    // Esperar un momento antes de empezar a verificar (dar tiempo al script para cargar)
    setTimeout(checkWidget, 200);
  }, [onError]);

  // Pre-cargar datos del usuario si existe sesión
  useEffect(() => {
    const loadUserProfile = async () => {
      if (!user?.id) {
        setIsLoadingProfile(false);
        return;
      }

      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('name, email, document_id, document_type, address')
          .eq('id', user.id)
          .maybeSingle(); // Usar maybeSingle() en lugar de single() para evitar error cuando no existe

        if (error) {
          // Pre-cargar al menos el email del usuario de auth
          setBuyerData((prev) => ({
            ...prev,
            email: user?.email || '',
          }));
        } else if (profile) {
          // Dividir el nombre completo en nombre y apellido
          let firstName = '';
          let lastName = '';

          if (profile.name) {
            const nameParts = profile.name.trim().split(' ');
            if (nameParts.length >= 2) {
              firstName = nameParts
                .slice(0, Math.ceil(nameParts.length / 2))
                .join(' ');
              lastName = nameParts
                .slice(Math.ceil(nameParts.length / 2))
                .join(' ');
            } else {
              firstName = profile.name;
            }
          }

          setBuyerData({
            firstName: firstName,
            lastName: lastName,
            email: profile.email || user?.email || '',
            documentId: profile.document_id || '',
            documentType:
              (profile.document_type as 'CC' | 'NIT' | 'CE' | 'PP') || 'CC',
            address: profile.address || '',
          });
        } else {
          // Si no existe el perfil, solo pre-cargar el email
          setBuyerData((prev) => ({
            ...prev,
            email: user?.email || '',
          }));
        }
      } catch (error) {
        // Pre-cargar al menos el email del usuario de auth
        setBuyerData((prev) => ({
          ...prev,
          email: user?.email || '',
        }));
      } finally {
        setIsLoadingProfile(false);
      }
    };

    loadUserProfile();
  }, [user]);

  // Validar campos obligatorios
  const isFormValid = () => {
    return (
      buyerData.firstName.trim() !== '' &&
      buyerData.lastName.trim() !== '' &&
      buyerData.email.trim() !== '' &&
      buyerData.documentId.trim() !== '' &&
      buyerData.address.trim() !== ''
    );
  };

  const handlePayment = async () => {
    // Verificar si estamos en modo mock (solo en desarrollo local)
    // El modo mock solo está permitido en desarrollo
    const isMockMode =
      process.env.NODE_ENV !== 'production' &&
      process.env.NEXT_PUBLIC_MOCK_PAYMENTS === 'true';

    if (isMockMode) {
    } else {
    }

    if (!isFormValid()) {
      onError?.('Por favor completa todos los campos obligatorios');
      return;
    }

    // En modo mock, no necesitamos verificar widget ni public key
    if (!isMockMode) {
      if (!widgetReady) {
        onError?.('El widget de pago aún no está listo. Intenta nuevamente.');
        return;
      }

      if (!wompiPublicKey) {
        onError?.('Error de configuración. Public key no disponible.');
        return;
      }
    }

    setIsLoading(true);

    try {
      // Construir nombre completo para el widget
      const fullName = `${buyerData.firstName.trim()} ${buyerData.lastName.trim()}`;

      // 1. Crear la orden en el backend (también guarda datos del comprador)
      const orderResponse = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseId: course.id,
          amount: course.price,
          originalPrice: course.original_price,
          discountAmount: course.original_price
            ? course.original_price - course.price
            : 0,
          customerEmail: buyerData.email,
          customerName: fullName,
          // Datos adicionales del comprador
          buyerData: {
            firstName: buyerData.firstName.trim(),
            lastName: buyerData.lastName.trim(),
            documentId: buyerData.documentId.trim(),
            documentType: buyerData.documentType,
            address: buyerData.address.trim(),
          },
        }),
      });

      if (!orderResponse.ok) {
        const errorData = await orderResponse.json();
        throw new Error(errorData.error || 'Error al crear la orden');
      }

      const orderData = await orderResponse.json();
      const { orderId, reference, signature } = orderData;

      // Verificar si estamos en modo mock (solo en desarrollo)
      const isMockMode =
        process.env.NODE_ENV !== 'production' &&
        process.env.NEXT_PUBLIC_MOCK_PAYMENTS === 'true';

      // MODO MOCK: Simular pago exitoso sin llamar a Wompi
      if (isMockMode) {
        // Simular un pequeño delay para que parezca real y dar tiempo a que se complete la actualización en el backend
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Simular respuesta exitosa de Wompi
        const mockTransactionId = `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Dar un momento adicional para asegurar que la actualización se haya propagado
        await new Promise((resolve) => setTimeout(resolve, 500));

        setIsLoading(false);

        // Llamar callback de éxito
        onSuccess?.();

        // Redirigir a página de resultado como si fuera un pago real
        window.location.href = `${window.location.origin}/payment/result?order_id=${orderId}&reference=${reference}&id=${mockTransactionId}`;
        return;
      }

      // MODO REAL: Continuar con Wompi
      // 2. Configurar el Widget de Wompi
      const amountInCents = Math.round(course.price * 100);

      // Verificar que window.WidgetCheckout existe
      if (typeof window.WidgetCheckout !== 'function') {
        throw new Error(
          'El widget de Wompi no está disponible. Por favor recarga la página.',
        );
      }

      const widgetConfig = {
        currency: 'COP',
        amountInCents: amountInCents,
        reference: reference,
        publicKey: wompiPublicKey,
        redirectUrl: `${window.location.origin}/payment/result?order_id=${orderId}&reference=${reference}`,
        customerData: {
          email: buyerData.email,
          fullName: fullName,
        },
      };

      // Solo agregar signature si existe
      if (signature) {
        (widgetConfig as any).signature = {
          integrity: signature,
        };
      }

      // Validar que la URL de redirección sea válida
      try {
        const redirectUrlObj = new URL(widgetConfig.redirectUrl);
      } catch (urlError) {
        throw new Error('URL de redirección inválida');
      }

      const checkout = new window.WidgetCheckout(widgetConfig);

      // 3. Abrir el widget
      // Esperar un momento para asegurar que el widget esté completamente inicializado
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Agregar listeners para errores de red (puede ayudar a diagnosticar el 403)
      const errorListener = (event: ErrorEvent) => {
        const target = event.target as HTMLElement;
        const isWompiError =
          (event.message && event.message.includes('wompi')) ||
          (target &&
            (target.tagName === 'SCRIPT' || target.tagName === 'IFRAME') &&
            (target.getAttribute('src')?.includes('wompi') ||
              target.getAttribute('src')?.includes('checkout.wompi')));

        if (isWompiError) {
          // Si es un error 403, mostrar mensaje útil
          if (
            event.message?.includes('403') ||
            event.message?.includes('Forbidden')
          ) {
            setIsLoading(false);
            onError?.(
              'Error 403: Wompi rechazó la solicitud. Verifica la configuración.',
            );
          }
        }
      };

      // Listener para errores de recursos (scripts, iframes, etc.)
      window.addEventListener('error', errorListener, true);

      // También escuchar errores de fetch/XMLHttpRequest
      const originalFetch = window.fetch;
      window.fetch = async (...args) => {
        try {
          const response = await originalFetch(...args);
          if (
            !response.ok &&
            response.status === 403 &&
            args[0]?.toString().includes('wompi')
          ) {
            setIsLoading(false);
            onError?.(
              'Error 403: Wompi rechazó la solicitud. Verifica la configuración.',
            );
          }
          return response;
        } catch (error) {
          throw error;
        }
      };

      // Intentar abrir el widget
      try {
        // Verificar que el método open existe y es una función
        if (typeof checkout.open !== 'function') {
          throw new Error(
            'El método open() no está disponible en el widget de Wompi',
          );
        }

        // Timeout para detectar si el widget no se abre
        const openTimeout = setTimeout(() => {
          // Verificar si hay errores de red relacionados con Wompi
          const wompiErrors = [];
          window.addEventListener(
            'error',
            (e) => {
              if (e.message && e.message.includes('wompi')) {
                wompiErrors.push(e);
              }
            },
            { once: true },
          );

          setIsLoading(false);
          onError?.(
            'El widget de Wompi no se abrió. Verifica la configuración o contacta al soporte.',
          );
        }, 5000);

        // Llamar a open() con el callback
        checkout.open((result: any) => {
          clearTimeout(openTimeout);
          // Restaurar fetch original y remover listeners cuando se complete
          window.fetch = originalFetch;
          window.removeEventListener('error', errorListener, true);
          setIsLoading(false);

          // Manejar diferentes estados de transacción
          if (result?.transaction?.status === 'APPROVED') {
            // Llamar callback de éxito si existe
            onSuccess?.();
            // Redirigir a página de resultado que luego redirigirá automáticamente al dashboard
            // Esto asegura que el usuario vea el mensaje de éxito y la compra se registre correctamente
            window.location.href = `${window.location.origin}/payment/result?order_id=${orderId}&reference=${reference}&id=${result.transaction.id}`;
          } else if (result?.transaction?.status === 'PENDING') {
            // Redirigir a página de resultado para mostrar estado pendiente
            window.location.href = `${window.location.origin}/payment/result?order_id=${orderId}&reference=${reference}&id=${result.transaction.id}`;
          } else if (result?.transaction?.status === 'DECLINED') {
            // Redirigir a página de resultado para mostrar estado rechazado
            window.location.href = `${window.location.origin}/payment/result?order_id=${orderId}&reference=${reference}&id=${result.transaction.id}`;
          } else if (result?.transaction?.status === 'ERROR') {
            // Redirigir a página de resultado para mostrar error
            window.location.href = `${window.location.origin}/payment/result?order_id=${orderId}&reference=${reference}&id=${result.transaction.id}`;
          } else if (result?.error) {
            setIsLoading(false);
            onError?.(result.error.message || 'Error al procesar el pago');
          } else {
            // Por seguridad, redirigir a resultado con el orderId
            window.location.href = `${window.location.origin}/payment/result?order_id=${orderId}&reference=${reference}`;
          }
        });

        // Restaurar fetch y remover listeners después de un tiempo si no hay respuesta
        setTimeout(() => {
          window.fetch = originalFetch;
          window.removeEventListener('error', errorListener, true);
        }, 30000);
      } catch (openError) {
        // Restaurar fetch y remover listeners en caso de error
        window.fetch = originalFetch;
        window.removeEventListener('error', errorListener, true);

        // Manejar errores
        const errorMessage =
          openError instanceof Error ? openError.message : String(openError);
        if (
          errorMessage.includes('403') ||
          errorMessage.includes('Forbidden')
        ) {
          onError?.(
            'Error 403: Wompi rechazó la solicitud. Verifica la configuración.',
          );
        } else {
          onError?.(errorMessage || 'Error al abrir el widget de pago');
        }

        setIsLoading(false);
      }
    } catch (error) {
      setIsLoading(false);
      onError?.(
        error instanceof Error ? error.message : 'Error al procesar el pago',
      );
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative z-[101] bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl max-w-xl w-full mx-4 max-h-[90vh] overflow-y-auto">
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
            isLoading ||
            !widgetReady ||
            !wompiPublicKey ||
            !isFormValid() ||
            isLoadingProfile
          }
          className="w-full bg-[#85ea10] hover:bg-[#7dd30f] text-black font-bold py-4 px-6 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Procesando...
            </>
          ) : !widgetReady ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Cargando widget...
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
