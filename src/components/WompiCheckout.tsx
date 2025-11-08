'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { CreditCard, Loader2, X } from 'lucide-react';

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

export default function WompiCheckout({ course, onSuccess, onError, onClose }: WompiCheckoutProps) {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [widgetReady, setWidgetReady] = useState(false);
  const [wompiPublicKey, setWompiPublicKey] = useState<string>('');

  // Obtener la public key del servidor
  useEffect(() => {
    const fetchWompiConfig = async () => {
      try {
        const response = await fetch('/api/payments/config');
        const data = await response.json();
        
        if (data.publicKey) {
          setWompiPublicKey(data.publicKey);
          console.log('✅ Wompi public key cargada');
        } else {
          console.error('❌ No se pudo obtener la public key de Wompi');
          onError?.('Error de configuración del sistema de pagos');
        }
      } catch (error) {
        console.error('❌ Error obteniendo config de Wompi:', error);
        onError?.('Error al cargar la configuración de pagos');
      }
    };

    fetchWompiConfig();
  }, [onError]);

  // Verificar si el widget está disponible
  useEffect(() => {
    const checkWidget = () => {
      if (typeof window !== 'undefined' && window.WidgetCheckout) {
        setWidgetReady(true);
      } else {
        setTimeout(checkWidget, 100);
      }
    };
    checkWidget();
  }, []);

  // Pre-cargar datos del usuario si existe sesión
  useEffect(() => {
    if (session?.user) {
      setCustomerEmail(session.user.email || '');
      setCustomerName(session.user.name || '');
    }
  }, [session]);

  const handlePayment = async () => {
    if (!customerEmail || !customerName) {
      onError?.('Por favor ingresa tu nombre y correo');
      return;
    }

    if (!widgetReady) {
      onError?.('El widget de pago aún no está listo. Intenta nuevamente.');
      return;
    }

    if (!wompiPublicKey) {
      onError?.('Error de configuración. Public key no disponible.');
      return;
    }

    setIsLoading(true);

    try {
      // 1. Crear la orden en el backend
      console.log('📦 Creando orden...');
      const orderResponse = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseId: course.id,
          amount: course.price,
          originalPrice: course.original_price,
          discountAmount: course.original_price ? course.original_price - course.price : 0,
          customerEmail,
          customerName,
        }),
      });

      if (!orderResponse.ok) {
        const errorData = await orderResponse.json();
        throw new Error(errorData.error || 'Error al crear la orden');
      }

      const { orderId, reference, signature } = await orderResponse.json();
      console.log('✅ Orden creada:', { orderId, reference });

      // 2. Configurar el Widget de Wompi
      const amountInCents = Math.round(course.price * 100);
      
      console.log('🎨 Abriendo Widget de Wompi...');
      console.log('💰 Monto:', amountInCents, 'centavos');
      console.log('📝 Referencia:', reference);
      console.log('🔐 Firma:', signature?.substring(0, 20) + '...');
      console.log('🔑 Public Key:', wompiPublicKey.substring(0, 20) + '...');

      const checkout = new window.WidgetCheckout({
        currency: 'COP',
        amountInCents: amountInCents,
        reference: reference,
        publicKey: wompiPublicKey,
        redirectUrl: `${window.location.origin}/payment/result?order_id=${orderId}&reference=${reference}`,
        signature: signature ? {
          integrity: signature
        } : undefined,
        customerData: {
          email: customerEmail,
          fullName: customerName,
        },
      });

      // 3. Abrir el widget
      checkout.open((result: any) => {
        console.log('📊 Resultado del Widget:', result);
        
        setIsLoading(false);

        // Manejar diferentes estados de transacción
        if (result.transaction?.status === 'APPROVED') {
          console.log('✅ Pago aprobado inmediatamente!');
          // Llamar callback de éxito si existe
          onSuccess?.();
          // Redirigir directamente al dashboard del estudiante
          window.location.href = `${window.location.origin}/student`;
        } else if (result.transaction?.status === 'PENDING') {
          console.log('⏳ Pago pendiente de confirmación (PSE/Nequi)');
          // Redirigir a página de resultado para mostrar estado pendiente
          window.location.href = `${window.location.origin}/payment/result?order_id=${orderId}&reference=${reference}&id=${result.transaction.id}`;
        } else if (result.transaction?.status === 'DECLINED') {
          console.log('❌ Pago rechazado');
          alert('El pago fue rechazado. Por favor intenta nuevamente, te redirigiremos al dashboard.');
          window.location.href = `${window.location.origin}/dashboard`;
        } else if (result.transaction?.status === 'ERROR') {
          console.log('⚠️ Error en el pago');
          alert('Hubo un error procesando el pago. Intenta nuevamente, te redirigiremos al dashboard.');
          window.location.href = `${window.location.origin}/dashboard`;
        } else {
          console.log('ℹ️ Estado desconocido:', result.transaction?.status);
          // Por seguridad, redirigir a resultado con el orderId
          window.location.href = `${window.location.origin}/payment/result?order_id=${orderId}&reference=${reference}`;
        }
      });

    } catch (error) {
      console.error('❌ Error en el checkout:', error);
      setIsLoading(false);
      onError?.(error instanceof Error ? error.message : 'Error al procesar el pago');
    }
  };

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
                -${(course.original_price - course.price).toLocaleString('es-CO')} COP
              </span>
            </div>
            <div className="border-t border-gray-300 dark:border-gray-600 pt-2 mt-2">
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-gray-900 dark:text-white">Total</span>
                <span className="text-2xl font-bold text-[#85ea10]">
                  ${course.price.toLocaleString('es-CO')} COP
                </span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Formulario de datos */}
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Nombre completo
          </label>
          <input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Juan Pérez"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#85ea10] dark:bg-gray-700 dark:text-white"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Correo electrónico
          </label>
          <input
            type="email"
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
            placeholder="tu@email.com"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#85ea10] dark:bg-gray-700 dark:text-white"
            required
          />
        </div>
      </div>

      {/* Botón de pago */}
      <button
        onClick={handlePayment}
        disabled={isLoading || !widgetReady || !wompiPublicKey || !customerEmail || !customerName}
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
        ) : (
          <>
            <CreditCard className="w-5 h-5 mr-2" />
            Completar Pago
          </>
        )}
      </button>

      {/* Información de seguridad */}
      <div className="mt-6 text-center">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          🔒 Pago 100% seguro procesado por <strong>Wompi</strong>
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Tus datos están protegidos con encriptación SSL
        </p>
      </div>
      </div>
    </div>
  );
}
