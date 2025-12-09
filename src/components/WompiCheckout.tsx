'use client';

import { useState, useEffect } from 'react';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { CreditCard, Loader2, X, User, Mail, MapPin, FileText, Shield } from 'lucide-react';
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

export default function WompiCheckout({ course, onSuccess, onError, onClose }: WompiCheckoutProps) {
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
        console.log('🔧 Obteniendo configuración de Wompi...');
        const response = await fetch('/api/payments/config');
        const data = await response.json();

        console.log('📡 Respuesta del servidor:', data);

        if (data.publicKey) {
          setWompiPublicKey(data.publicKey);
          console.log('✅ Wompi public key cargada:', data.publicKey.substring(0, 20) + '...');
          console.log('🌍 Entorno:', data.environment);
        } else {
          console.error('❌ No se pudo obtener la public key de Wompi');
          console.error('📦 Data recibida:', data);
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
    let attempts = 0;
    const maxAttempts = 100; // 10 segundos máximo (aumentado para dar más tiempo)

    const checkWidget = () => {
      attempts++;
      if (attempts % 10 === 0) {
        console.log(`🔍 Verificando widget (intento ${attempts}/${maxAttempts})...`);
      }

      if (typeof window !== 'undefined' && typeof window.WidgetCheckout === 'function') {
        console.log('✅ Widget de Wompi encontrado y listo!');
        console.log('📦 window.WidgetCheckout:', window.WidgetCheckout);
        console.log('🔍 Verificando que sea una función constructora...');
        
        // Verificar que se puede instanciar (sin crear realmente una instancia)
        try {
          // Solo verificar que es una función, no crear instancia aún
          if (typeof window.WidgetCheckout === 'function') {
            setWidgetReady(true);
            return;
          }
        } catch (e) {
          console.warn('⚠️ Error verificando widget:', e);
        }
      }
      
      if (attempts < maxAttempts) {
        setTimeout(checkWidget, 100);
      } else {
        console.error('❌ Widget de Wompi no se cargó después de 10 segundos');
        console.error('💡 Verifica que el script de Wompi se esté cargando desde https://checkout.wompi.co/widget.js');
        const wompiScripts = Array.from(document.scripts).map(s => s.src).filter(src => src.includes('wompi'));
        console.error('🔍 Scripts cargados:', wompiScripts);
        if (wompiScripts.length === 0) {
          console.error('❌ No se encontró el script de Wompi. Intenta recargar la página.');
          onError?.('El widget de pago no se cargó correctamente. Por favor recarga la página.');
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
          console.warn('⚠️ Error cargando perfil:', error);
          // Pre-cargar al menos el email del usuario de auth
          setBuyerData(prev => ({
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
              firstName = nameParts.slice(0, Math.ceil(nameParts.length / 2)).join(' ');
              lastName = nameParts.slice(Math.ceil(nameParts.length / 2)).join(' ');
            } else {
              firstName = profile.name;
            }
          }

          setBuyerData({
            firstName: firstName,
            lastName: lastName,
            email: profile.email || user?.email || '',
            documentId: profile.document_id || '',
            documentType: (profile.document_type as 'CC' | 'NIT' | 'CE' | 'PP') || 'CC',
            address: profile.address || '',
          });
        } else {
          // Si no existe el perfil, solo pre-cargar el email
          setBuyerData(prev => ({
            ...prev,
            email: user?.email || '',
          }));
        }
      } catch (error) {
        console.error('❌ Error cargando perfil:', error);
        // Pre-cargar al menos el email del usuario de auth
        setBuyerData(prev => ({
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
    console.log('🔵 handlePayment iniciado');
    console.log('📋 Validación de formulario:', isFormValid());
    console.log('🎨 Widget listo:', widgetReady);
    console.log('🔑 Public key disponible:', !!wompiPublicKey);
    console.log('🪟 window.WidgetCheckout:', typeof window.WidgetCheckout);

    if (!isFormValid()) {
      console.error('❌ Formulario inválido');
      onError?.('Por favor completa todos los campos obligatorios');
      return;
    }

    if (!widgetReady) {
      console.error('❌ Widget no está listo');
      onError?.('El widget de pago aún no está listo. Intenta nuevamente.');
      return;
    }

    if (!wompiPublicKey) {
      console.error('❌ Public key no disponible');
      onError?.('Error de configuración. Public key no disponible.');
      return;
    }

    setIsLoading(true);

    try {
      // Construir nombre completo para el widget
      const fullName = `${buyerData.firstName.trim()} ${buyerData.lastName.trim()}`;

      // 1. Crear la orden en el backend (también guarda datos del comprador)
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
      console.log('✅ Orden creada:', orderData);

      const { orderId, reference, signature } = orderData;

      // 2. Configurar el Widget de Wompi
      const amountInCents = Math.round(course.price * 100);

      console.log('🎨 Preparando Widget de Wompi...');
      console.log('💰 Monto:', amountInCents, 'centavos');
      console.log('📝 Referencia:', reference);
      console.log('🔐 Firma:', signature?.substring(0, 20) + '...');
      console.log('🔑 Public Key:', wompiPublicKey.substring(0, 20) + '...');
      console.log('👤 Cliente:', buyerData.email, fullName);
      console.log('🔗 Redirect URL:', `${window.location.origin}/payment/result?order_id=${orderId}&reference=${reference}`);

      // Verificar que window.WidgetCheckout existe
      if (typeof window.WidgetCheckout !== 'function') {
        throw new Error('El widget de Wompi no está disponible. Por favor recarga la página.');
      }

      console.log('🚀 Creando instancia del widget...');

      // Usar NEXT_PUBLIC_BASE_URL si está configurado (para ngrok), sino usar window.location.origin
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin;

      const widgetConfig = {
        currency: 'COP',
        amountInCents: amountInCents,
        reference: reference,
        publicKey: wompiPublicKey,
        redirectUrl: `${baseUrl}/payment/result?order_id=${orderId}&reference=${reference}`,
        customerData: {
          email: buyerData.email,
          fullName: fullName,
        },
      };

      // Solo agregar signature si existe
      if (signature) {
        (widgetConfig as any).signature = {
          integrity: signature
        };
      }

      console.log('📦 Configuración del widget:', JSON.stringify(widgetConfig, null, 2));
      console.log('🌐 Base URL:', baseUrl);
      console.log('🔍 Verificando URL de redirección...');
      
      // Validar que la URL de redirección sea válida
      try {
        const redirectUrlObj = new URL(widgetConfig.redirectUrl);
        console.log('✅ URL de redirección válida:', redirectUrlObj.href);
      } catch (urlError) {
        console.error('❌ URL de redirección inválida:', widgetConfig.redirectUrl);
        throw new Error('URL de redirección inválida');
      }

      const checkout = new window.WidgetCheckout(widgetConfig);

      console.log('✅ Widget instanciado correctamente');
      console.log('📂 Checkout object:', checkout);
      console.log('📂 Tipo de checkout.open:', typeof checkout.open);
      console.log('📂 Métodos disponibles:', Object.keys(checkout));

      // 3. Abrir el widget
      console.log('🎭 Abriendo modal del widget...');

      // Esperar un momento para asegurar que el widget esté completamente inicializado
      await new Promise(resolve => setTimeout(resolve, 200));

      // Agregar listeners para errores de red (puede ayudar a diagnosticar el 403)
      const errorListener = (event: ErrorEvent) => {
        const target = event.target as HTMLElement;
        const isWompiError = 
          (event.message && event.message.includes('wompi')) ||
          (target && (target.tagName === 'SCRIPT' || target.tagName === 'IFRAME') && 
           (target.getAttribute('src')?.includes('wompi') || target.getAttribute('src')?.includes('checkout.wompi')));
        
        if (isWompiError) {
          console.error('🚨 Error relacionado con Wompi:', event);
          console.error('🚨 Error target:', target);
          console.error('🚨 Error message:', event.message);
          
          // Si es un error 403 y estamos en localhost, mostrar mensaje útil
          if (event.message?.includes('403') || event.message?.includes('Forbidden')) {
            if (baseUrl.includes('127.0.0.1') || baseUrl.includes('localhost')) {
              console.error('❌ Wompi está bloqueando localhost (Error 403)');
              console.error('💡 Solución: Usa ngrok para desarrollo local');
              setIsLoading(false);
              onError?.('Wompi bloquea localhost. Configura ngrok y NEXT_PUBLIC_BASE_URL. Ver consola para instrucciones.');
            }
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
          if (!response.ok && response.status === 403 && args[0]?.toString().includes('wompi')) {
            console.error('🚨 Error 403 en fetch a Wompi:', args[0]);
            if (baseUrl.includes('127.0.0.1') || baseUrl.includes('localhost')) {
              setIsLoading(false);
              onError?.('Wompi bloquea localhost. Configura ngrok y NEXT_PUBLIC_BASE_URL.');
            }
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
          throw new Error('El método open() no está disponible en el widget de Wompi');
        }

        console.log('🔓 Llamando a checkout.open()...');
        
        // Timeout para detectar si el widget no se abre
        const openTimeout = setTimeout(() => {
          console.warn('⚠️ El widget no se ha abierto después de 5 segundos');
          console.warn('💡 Esto puede indicar un problema con la configuración o que Wompi está bloqueando la solicitud');
          
          // Verificar si hay errores de red relacionados con Wompi
          const wompiErrors = [];
          window.addEventListener('error', (e) => {
            if (e.message && e.message.includes('wompi')) {
              wompiErrors.push(e);
            }
          }, { once: true });
          
          // Si estamos en localhost sin ngrok, mostrar mensaje útil
          if (baseUrl.includes('127.0.0.1') || baseUrl.includes('localhost')) {
            console.error('❌ Wompi está bloqueando localhost. Soluciones:');
            console.error('1. Usa ngrok: ngrok http 3001');
            console.error('2. Configura NEXT_PUBLIC_BASE_URL con la URL de ngrok');
            console.error('3. O contacta a Wompi para habilitar localhost en modo test');
            
            setIsLoading(false);
            onError?.('Wompi no permite localhost. Por favor usa ngrok o contacta al soporte. Ver consola para más detalles.');
          }
        }, 5000);
        
        // Llamar a open() con el callback
        checkout.open((result: any) => {
          clearTimeout(openTimeout);
          // Restaurar fetch original y remover listeners cuando se complete
          window.fetch = originalFetch;
          window.removeEventListener('error', errorListener, true);
          console.log('📊 Resultado del Widget:', result);
          
          setIsLoading(false);

          // Manejar diferentes estados de transacción
          if (result?.transaction?.status === 'APPROVED') {
            console.log('✅ Pago aprobado inmediatamente!');
            // Llamar callback de éxito si existe
            onSuccess?.();
            // Redirigir a página de resultado que luego redirigirá automáticamente al dashboard
            // Esto asegura que el usuario vea el mensaje de éxito y la compra se registre correctamente
            window.location.href = `${baseUrl}/payment/result?order_id=${orderId}&reference=${reference}&id=${result.transaction.id}`;
          } else if (result?.transaction?.status === 'PENDING') {
            console.log('⏳ Pago pendiente de confirmación (PSE/Nequi)');
            // Redirigir a página de resultado para mostrar estado pendiente
            window.location.href = `${baseUrl}/payment/result?order_id=${orderId}&reference=${reference}&id=${result.transaction.id}`;
          } else if (result?.transaction?.status === 'DECLINED') {
            console.log('❌ Pago rechazado');
            // Redirigir a página de resultado para mostrar estado rechazado
            window.location.href = `${baseUrl}/payment/result?order_id=${orderId}&reference=${reference}&id=${result.transaction.id}`;
          } else if (result?.transaction?.status === 'ERROR') {
            console.log('⚠️ Error en el pago');
            // Redirigir a página de resultado para mostrar error
            window.location.href = `${baseUrl}/payment/result?order_id=${orderId}&reference=${reference}&id=${result.transaction.id}`;
          } else if (result?.error) {
            console.error('❌ Error del widget:', result.error);
            setIsLoading(false);
            onError?.(result.error.message || 'Error al procesar el pago');
          } else {
            console.log('ℹ️ Estado desconocido:', result?.transaction?.status);
            // Por seguridad, redirigir a resultado con el orderId
            window.location.href = `${baseUrl}/payment/result?order_id=${orderId}&reference=${reference}`;
          }
        });

        console.log('✅ checkout.open() llamado exitosamente');
        console.log('⏳ Esperando respuesta del widget...');
        
        // Restaurar fetch y remover listeners después de un tiempo si no hay respuesta
        setTimeout(() => {
          window.fetch = originalFetch;
          window.removeEventListener('error', errorListener, true);
        }, 30000);
      } catch (openError) {
        // Restaurar fetch y remover listeners en caso de error
        window.fetch = originalFetch;
        window.removeEventListener('error', errorListener, true);
        console.error('❌ Error al abrir el widget:', openError);
        console.error('❌ Error details:', {
          message: openError instanceof Error ? openError.message : 'Unknown error',
          stack: openError instanceof Error ? openError.stack : undefined,
          checkout: checkout,
          config: widgetConfig,
          publicKey: wompiPublicKey.substring(0, 20) + '...',
          redirectUrl: widgetConfig.redirectUrl
        });
        
        // Si el error está relacionado con localhost, dar instrucciones
        const errorMessage = openError instanceof Error ? openError.message : String(openError);
        if (errorMessage.includes('403') || errorMessage.includes('Forbidden')) {
          if (baseUrl.includes('127.0.0.1') || baseUrl.includes('localhost')) {
            console.error('🔧 Solución: Usa ngrok para exponer tu servidor local');
            console.error('   1. Instala ngrok: npm install -g ngrok');
            console.error('   2. Ejecuta: ngrok http 3001');
            console.error('   3. Configura NEXT_PUBLIC_BASE_URL con la URL de ngrok (ej: https://abc123.ngrok.io)');
            onError?.('Wompi bloquea localhost. Configura ngrok y NEXT_PUBLIC_BASE_URL. Ver consola.');
          } else {
            onError?.('Error 403: Wompi rechazó la solicitud. Verifica la configuración.');
          }
        } else {
          onError?.(errorMessage || 'Error al abrir el widget de pago');
        }
        
        setIsLoading(false);
      }

    } catch (error) {
      console.error('❌ Error en el checkout:', error);
      console.error('❌ Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
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

      {/* Formulario de datos del comprador */}
      <div className="space-y-4 mb-6">
        {isLoadingProfile ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin text-[#85ea10] mr-2" />
            <span className="text-gray-600 dark:text-gray-400">Cargando datos...</span>
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
                    onChange={(e) => setBuyerData({ ...buyerData, firstName: e.target.value })}
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
                    onChange={(e) => setBuyerData({ ...buyerData, lastName: e.target.value })}
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
                  onChange={(e) => setBuyerData({ ...buyerData, documentType: e.target.value as 'CC' | 'NIT' | 'CE' | 'PP' })}
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
                  Número de Documento <span className="text-[#85ea10]">*</span>
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={buyerData.documentId}
                    onChange={(e) => setBuyerData({ ...buyerData, documentId: e.target.value.replace(/[^0-9-]/g, '') })}
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
                  onChange={(e) => setBuyerData({ ...buyerData, email: e.target.value })}
                  placeholder="tu@email.com"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#85ea10] dark:bg-gray-700 dark:text-white text-sm"
                  required
                />
              </div>
            </div>

            {/* Dirección */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Dirección de residencia <span className="text-[#85ea10]">*</span>
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={buyerData.address}
                  onChange={(e) => setBuyerData({ ...buyerData, address: e.target.value })}
                  placeholder="Calle 123 # 45-67, Barrio, Ciudad"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#85ea10] dark:bg-gray-700 dark:text-white text-sm"
                  required
                />
              </div>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400">
              <span className="text-[#85ea10]">*</span> Campos obligatorios. Esta información se usará para tu factura.
            </p>
          </>
        )}
      </div>

      {/* Botón de pago */}
      <button
        onClick={handlePayment}
        disabled={isLoading || !widgetReady || !wompiPublicKey || !isFormValid() || isLoadingProfile}
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
          <Shield className="w-3 h-3 text-[#85ea10]" /> Pago 100% seguro procesado por <strong>Wompi</strong>
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Tus datos están protegidos con encriptación SSL
        </p>
      </div>
      </div>
    </div>
  );
}
