'use client';

import {
  CheckCircle,
  CheckCircle2,
  ChevronRight,
  Clock,
  Download,
  Sparkles,
  XCircle,
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import CourseStartDateModal from '@/components/CourseStartDateModal';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { useUserPurchases } from '@/hooks/useUserPurchases';
import { supabase } from '@/lib/supabase-browser';

interface OrderResult {
  id: string;
  status: string;
  amount: number;
  currency: string;
  course_title: string;
  course_image: string;
  created_at: string;
}

function PaymentResultContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useSupabaseAuth();
  const { refresh: refreshPurchases } = useUserPurchases();
  const [order, setOrder] = useState<OrderResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showStartDateModal, setShowStartDateModal] = useState(false);
  const [courseId, setCourseId] = useState<string | null>(null);
  const [purchaseId, setPurchaseId] = useState<string | null>(null);
  const [hasStartDate, setHasStartDate] = useState(false);
  const [buyerName, setBuyerName] = useState<string>('');
  const [buyerDocument, setBuyerDocument] = useState<string>('');

  const orderId = searchParams.get('order_id');
  const reference = searchParams.get('reference');
  const transactionId = searchParams.get('transaction_id');

  useEffect(() => {
    if (!orderId && !transactionId && !reference) {
      setError('ID de orden, referencia o transacción no encontrado');
      setLoading(false);
      return;
    }

    loadOrderResult();
  }, [orderId, transactionId, reference]);

  // Obtener información del comprador cuando la sesión esté disponible (solo si no se obtuvo de la orden)
  useEffect(() => {
    const fetchBuyerInfo = async () => {
      // Solo obtener del perfil si no tenemos nombre del comprador
      if (user?.id && !buyerName) {
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('name, document_id')
            .eq('id', user.id)
            .maybeSingle();

          if (profile) {
            if (!buyerName) {
              setBuyerName(profile.name || '');
            }
            if (!buyerDocument) {
              setBuyerDocument(profile.document_id || '');
            }
          }
        } catch (error) {}
      }
    };

    fetchBuyerInfo();
  }, [user, buyerName, buyerDocument]);

  const loadOrderResult = async () => {
    try {
      let query = supabase.from('orders').select(`
          id,
          status,
          amount,
          currency,
          created_at,
          course_id,
          customer_name,
          customer_email,
          user_id,
          courses!inner (
            title,
            preview_image
          )
        `);

      // Buscar por order_id, reference o transaction_id
      if (orderId) {
        query = query.eq('id', orderId);
      } else if (reference) {
        query = query.eq('wompi_reference', reference);
      } else if (transactionId) {
        query = query.eq('wompi_transaction_id', transactionId);
      }

      const { data, error } = await query.single();

      if (error) {
        setError('Error al cargar la información de la orden');
        return;
      }

      // Transformar los datos para que coincidan con la interfaz
      const courses = data.courses as any;
      const transformedData = {
        id: data.id,
        status: data.status,
        amount: data.amount,
        currency: data.currency,
        course_title: courses?.title || 'Curso no encontrado',
        course_image: courses?.preview_image || '',
        created_at: data.created_at,
      };

      setOrder(transformedData);
      setCourseId(data.course_id);

      let foundName = data.customer_name || '';
      let foundDocument = '';

      // Obtener nombre del cliente desde la orden primero
      if (data.customer_name) {
        foundName = data.customer_name;
      }

      // Obtener información completa del perfil del usuario (nombre y cédula)
      if (data.user_id) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('name, document_id')
          .eq('id', data.user_id)
          .maybeSingle();

        if (profileError) {
          // Solo loguear si hay información útil
          if (
            profileError?.message ||
            profileError?.code ||
            profileError?.details
          ) {
          }
        }

        if (profile) {
          // Si no hay nombre en la orden, usar el del perfil
          if (!foundName && profile.name) {
            foundName = profile.name;
          }
          // Siempre obtener la cédula del perfil
          if (profile.document_id) {
            foundDocument = profile.document_id;
          }
        } else {
        }
      }

      // Si aún no tenemos nombre, intentar obtenerlo del usuario actual
      if (!foundName && user?.id) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('name, document_id')
          .eq('id', user.id)
          .maybeSingle();

        if (profileError) {
        }

        if (profile) {
          if (!foundName && profile.name) {
            foundName = profile.name;
          }
          if (!foundDocument && profile.document_id) {
            foundDocument = profile.document_id;
          }
        }
      }

      // Actualizar el estado con los valores encontrados
      if (foundName) {
        setBuyerName(foundName);
      }
      if (foundDocument) {
        setBuyerDocument(foundDocument);
      }

      // Si el pago está aprobado, verificar si tiene fecha de inicio
      if (data.status === 'approved' && data.course_id) {
        // Esperar un momento para asegurar que la compra se haya creado (en modo mock)
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Buscar la compra del curso - primero por order_id, luego por user_id si no se encuentra
        let purchase = null;
        let purchaseError = null;

        // Intentar buscar por order_id y course_id
        const { data: purchaseByOrder, error: errorByOrder } = await supabase
          .from('course_purchases')
          .select(
            'id, start_date, created_at, order_id, course_id, user_id, is_active',
          )
          .eq('order_id', data.id)
          .eq('course_id', data.course_id)
          .maybeSingle();

        if (purchaseByOrder) {
          purchase = purchaseByOrder;
        } else if (errorByOrder && errorByOrder.code !== 'PGRST116') {
          purchaseError = errorByOrder;
        } else {
          // Si no se encuentra por order_id, intentar buscar por user_id y course_id
          const purchaseUserId = data.user_id || user?.id;
          if (purchaseUserId) {
            const { data: purchaseByUser, error: errorByUser } = await supabase
              .from('course_purchases')
              .select(
                'id, start_date, created_at, order_id, course_id, user_id, is_active',
              )
              .eq('user_id', purchaseUserId)
              .eq('course_id', data.course_id)
              .eq('is_active', true)
              .maybeSingle();

            if (purchaseByUser) {
              purchase = purchaseByUser;
            } else if (errorByUser && errorByUser.code !== 'PGRST116') {
              purchaseError = errorByUser;
            }
          }
        }

        // Si no hay compra, crearla inmediatamente (no esperar al webhook)
        if (!purchase) {
          if (purchaseError && purchaseError.code !== 'PGRST116') {
          } else {
            // Intentar crear la compra con el usuario actual si no hay user_id en la orden
            const purchaseUserId = data.user_id || user?.id;

            if (!purchaseUserId) {
              setError(
                'No se pudo identificar al usuario para crear la compra',
              );
              return;
            }

            const { data: newPurchase, error: createError } = await supabase
              .from('course_purchases')
              .insert({
                user_id: purchaseUserId,
                course_id: data.course_id,
                order_id: data.id,
                purchase_price: data.amount,
                is_active: true,
                access_granted_at: new Date().toISOString(),
              })
              .select('id, user_id, start_date, created_at')
              .single();

            if (createError) {
              setError(
                'No se pudo crear la compra del curso. Por favor, contacta al soporte.',
              );
            } else {
              // Verificar inmediatamente que la compra sea visible
              const { data: verifyPurchase, error: verifyError } =
                await supabase
                  .from('course_purchases')
                  .select('id, user_id, course_id, is_active')
                  .eq('id', newPurchase.id)
                  .single();

              if (verifyError) {
              } else {
              }

              // Guardar el purchaseId para pasarlo al modal
              setPurchaseId(newPurchase.id);
              // Refrescar las compras múltiples veces para asegurar que se actualicen
              refreshPurchases();
              setTimeout(() => {
                refreshPurchases();
              }, 500);
              setTimeout(() => {
                refreshPurchases();
              }, 1500);
              // Verificar si necesita fecha de inicio
              if (!newPurchase.start_date) {
                setShowStartDateModal(true);
                setHasStartDate(false);
              } else {
                setHasStartDate(true);
              }
            }
          }
        } else {
          // Ya existe la compra
          // Guardar el purchaseId para pasarlo al modal
          setPurchaseId(purchase.id);
          // Refrescar las compras para asegurar que estén actualizadas
          refreshPurchases();
          setTimeout(() => {
            refreshPurchases();
          }, 500);
          if (!purchase.start_date) {
            // No tiene fecha de inicio, mostrar modal
            setShowStartDateModal(true);
            setHasStartDate(false);
          } else {
            setHasStartDate(true);
          }
        }
      }

      // Si el pago está pendiente, verificar estado cada 3 segundos
      if (data.status === 'pending') {
        const intervalId = setInterval(async () => {
          const { data: updatedOrder } = await supabase
            .from('orders')
            .select('status')
            .eq('id', data.id)
            .single();

          if (updatedOrder && updatedOrder.status !== 'pending') {
            setOrder((prev) =>
              prev ? { ...prev, status: updatedOrder.status } : null,
            );
            clearInterval(intervalId);
          }
        }, 3000);

        // Limpiar intervalo después de 2 minutos
        setTimeout(() => clearInterval(intervalId), 120000);

        return () => clearInterval(intervalId);
      }
    } catch (err) {
      setError('Error interno del servidor');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-16 h-16 text-green-500" />;
      case 'declined':
        return <XCircle className="w-16 h-16 text-red-500" />;
      case 'pending':
        return <Clock className="w-16 h-16 text-yellow-500" />;
      default:
        return <XCircle className="w-16 h-16 text-gray-500" />;
    }
  };

  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'approved':
        return {
          title: '¡Pago Exitoso!',
          message:
            'Tu pago ha sido procesado correctamente y ya tienes acceso al curso.',
          color: 'text-green-600',
        };
      case 'declined':
        return {
          title: 'Pago Declinado',
          message:
            'Tu pago no pudo ser procesado. Por favor, intenta nuevamente.',
          color: 'text-red-600',
        };
      case 'pending':
        return {
          title: 'Pago Pendiente',
          message:
            'Tu pago está siendo procesado. Te notificaremos cuando esté listo.',
          color: 'text-yellow-600',
        };
      default:
        return {
          title: 'Estado Desconocido',
          message: 'No pudimos determinar el estado de tu pago.',
          color: 'text-gray-600',
        };
    }
  };

  const handleContinue = () => {
    if (order?.status === 'approved' && !hasStartDate) {
      // Si no tiene fecha de inicio, mostrar modal
      setShowStartDateModal(true);
    } else if (order?.status === 'approved') {
      // Redirigir al dashboard del estudiante después de pago exitoso
      router.push('/student');
    } else {
      router.push('/courses');
    }
  };

  // Redirección automática cuando el pago es aprobado y tiene fecha de inicio
  useEffect(() => {
    if (order?.status === 'approved' && hasStartDate && !showStartDateModal) {
      // Redirigir automáticamente después de 2 segundos para que el usuario vea el mensaje de éxito
      const timer = setTimeout(() => {
        router.push('/student');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [order?.status, hasStartDate, showStartDateModal, router]);

  const handleDownloadReceipt = () => {
    if (!order) return;

    // Crear contenido HTML para el comprobante
    const receiptContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Comprobante de Pago - RogerBox</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              max-width: 800px;
              margin: 0 auto;
              padding: 40px;
              color: #333;
            }
            .header {
              text-align: center;
              margin-bottom: 40px;
              border-bottom: 3px solid #85ea10;
              padding-bottom: 20px;
            }
            .logo {
              font-size: 36px;
              font-weight: 900 !important;
              color: #000;
              font-family: 'Arial Black', 'Arial Bold', Arial, sans-serif !important;
              letter-spacing: 0px;
              text-transform: uppercase;
              -webkit-font-smoothing: antialiased;
              -moz-osx-font-smoothing: grayscale;
            }
            .logo span {
              color: #85ea10;
              font-weight: 900 !important;
            }
            .title {
              font-size: 24px;
              font-weight: bold;
              color: #85ea10;
              margin-top: 20px;
            }
            .company-info {
              background: #f9fafb;
              padding: 20px;
              border-radius: 12px;
              margin: 30px 0;
              border-left: 4px solid #85ea10;
            }
            .company-info h3 {
              margin: 0 0 15px 0;
              color: #000;
              font-size: 18px;
            }
            .company-info p {
              margin: 5px 0;
              color: #666;
              font-size: 14px;
            }
            .details {
              background: #f9fafb;
              padding: 30px;
              border-radius: 12px;
              margin: 30px 0;
            }
            .detail-row {
              display: flex;
              justify-content: space-between;
              padding: 12px 0;
              border-bottom: 1px solid #e5e7eb;
            }
            .detail-row:last-child {
              border-bottom: none;
            }
            .detail-label {
              font-weight: 600;
              color: #666;
            }
            .detail-value {
              color: #000;
              text-align: right;
              max-width: 60%;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 2px solid #e5e7eb;
              text-align: center;
              color: #666;
              font-size: 12px;
            }
            .status-badge {
              display: inline-block;
              padding: 6px 12px;
              border-radius: 6px;
              font-weight: 600;
              background: #dcfce7;
              color: #166534;
            }
            @media print {
              body {
                padding: 20px;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo" style="font-weight: 900 !important; font-family: 'Arial Black', Arial, sans-serif !important; letter-spacing: 0px !important;">ROGER<span style="font-weight: 900 !important;">BOX</span></div>
            <div class="title">Comprobante de Pago</div>
          </div>

          <div class="company-info">
            <h3>Información de la Empresa</h3>
            <p><strong>NIT:</strong> 1102819763-9</p>
            <p><strong>Dirección:</strong> Cr 54 A #25-26, Edificio Mont Cervino, Local 1, Los Alpes</p>
            <p><strong>WhatsApp:</strong> 3005009487</p>
          </div>

          <div class="details">
            <div class="detail-row">
              <span class="detail-label">Número de Orden:</span>
              <span class="detail-value">${order.id.substring(0, 8).toUpperCase()}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Fecha de Pago:</span>
              <span class="detail-value">${new Date(
                order.created_at,
              ).toLocaleDateString('es-CO', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Estado:</span>
              <span class="detail-value">
                <span class="status-badge">${order.status === 'approved' ? 'Aprobado' : order.status === 'pending' ? 'Pendiente' : 'Declinado'}</span>
              </span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Comprador:</span>
              <span class="detail-value">${buyerName || 'No disponible'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Cédula:</span>
              <span class="detail-value">${buyerDocument || 'No disponible'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Curso:</span>
              <span class="detail-value">${order.course_title}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Monto Pagado:</span>
              <span class="detail-value" style="font-size: 18px; font-weight: bold; color: #85ea10;">
                $${order.amount.toLocaleString('es-CO')} ${order.currency}
              </span>
            </div>
          </div>

          <div class="footer">
            <p>Este es un comprobante de pago generado por RogerBox</p>
            <p>Para consultas, contacta a nuestro equipo de soporte</p>
            <p style="margin-top: 10px;">www.rogerbox.com</p>
          </div>
        </body>
      </html>
    `;

    // Crear un blob con el contenido HTML
    const blob = new Blob([receiptContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);

    // Crear un enlace temporal y hacer click para descargar
    const link = document.createElement('a');
    link.href = url;
    link.download = `comprobante-pago-${order.id.substring(0, 8)}-${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Limpiar el URL
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 shadow-2xl">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#85ea10] mx-auto"></div>
          <p className="text-gray-600 mt-4 text-center">
            Cargando resultado del pago...
          </p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-md w-full mx-4">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 text-center mb-4">
            Error
          </h1>
          <p className="text-gray-600 text-center mb-6">
            {error || 'No se pudo cargar la información del pago'}
          </p>
          <button
            onClick={() => router.push('/courses')}
            className="w-full bg-[#85ea10] text-black font-bold py-3 px-6 rounded-xl hover:bg-[#6bc20a] transition-colors"
          >
            Volver a Cursos
          </button>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusMessage(order.status);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-md w-full border border-gray-200">
        {/* Logo RogerBox */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight">
            ROGER<span className="text-[#85ea10]">BOX</span>
          </h1>
        </div>

        {/* Título y mensaje */}
        <div className="text-center mb-6">
          <h1
            className={`text-3xl font-bold mb-3 ${order.status === 'approved' ? 'text-[#85ea10]' : statusInfo.color}`}
          >
            {statusInfo.title}
          </h1>
          <p className="text-gray-600 text-lg">{statusInfo.message}</p>
          {order.status === 'approved' && (
            <div className="mt-4 p-3 bg-[#85ea10]/10 border-2 border-[#85ea10] rounded-lg flex items-center justify-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-[#85ea10] flex-shrink-0" />
              <p className="text-[#85ea10] font-bold text-sm">
                ¡Tu curso ya está disponible en tu dashboard!
              </p>
            </div>
          )}
        </div>

        {/* Información de la orden */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-3">
            Detalles de la Orden
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Curso:</span>
              <span className="font-medium text-gray-900 text-right max-w-xs flex items-start gap-1">
                <Sparkles className="w-4 h-4 text-[#85ea10] flex-shrink-0 mt-0.5" />
                {order.course_title}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Monto:</span>
              <span className="font-medium text-gray-900">
                ${order.amount.toLocaleString('es-CO')} {order.currency}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Estado:</span>
              <span
                className={`font-medium capitalize flex items-center gap-1 ${order.status === 'approved' ? 'text-[#85ea10]' : statusInfo.color}`}
              >
                {order.status === 'approved' ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Aprobado
                  </>
                ) : order.status === 'declined' ? (
                  <>
                    <XCircle className="w-4 h-4" />
                    Declinado
                  </>
                ) : order.status === 'pending' ? (
                  <>
                    <Clock className="w-4 h-4" />
                    Pendiente
                  </>
                ) : (
                  order.status
                )}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Fecha:</span>
              <span className="font-medium text-gray-900">
                {new Date(order.created_at).toLocaleDateString('es-CO')}
              </span>
            </div>
          </div>
        </div>

        {/* Botón de descargar comprobante */}
        {order.status === 'approved' && (
          <button
            onClick={handleDownloadReceipt}
            className="w-full mb-3 bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2 border border-gray-300"
          >
            <Download className="w-5 h-5" />
            Descargar Comprobante de Pago
          </button>
        )}

        {/* Botón de acción */}
        {order.status === 'approved' && !hasStartDate ? (
          <button
            onClick={() => setShowStartDateModal(true)}
            className="w-full bg-[#85ea10] text-black font-bold py-3 px-6 rounded-xl hover:bg-[#6bc20a] transition-colors flex items-center justify-center gap-2"
          >
            Seleccionar Fecha de Inicio
            <ChevronRight className="w-5 h-5" />
          </button>
        ) : (
          <button
            onClick={handleContinue}
            className="w-full bg-[#85ea10] text-black font-bold py-3 px-6 rounded-xl hover:bg-[#6bc20a] transition-colors flex items-center justify-center gap-2"
          >
            {order.status === 'approved' ? 'Ir al Dashboard' : 'Ver Cursos'}
            <ChevronRight className="w-5 h-5" />
          </button>
        )}

        {/* Información adicional para pagos pendientes */}
        {order.status === 'pending' && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800 text-sm text-center">
              <strong>Nota:</strong> Los pagos pendientes pueden tardar hasta 24
              horas en procesarse.
            </p>
          </div>
        )}
      </div>

      {/* Modal de selección de fecha de inicio */}
      {showStartDateModal && courseId && (purchaseId || orderId) && (
        <CourseStartDateModal
          courseId={courseId}
          orderId={orderId}
          purchaseId={purchaseId || undefined}
          onClose={() => {
            setShowStartDateModal(false);
            // Verificar si ahora tiene fecha de inicio y redirigir automáticamente
            setTimeout(() => {
              setHasStartDate(true);
              // Redirigir al dashboard después de seleccionar la fecha
              router.push('/student');
            }, 1000);
          }}
        />
      )}
    </div>
  );
}

// Componente de carga para Suspense
function PaymentResultLoading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl p-8 shadow-2xl">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#85ea10] mx-auto"></div>
        <p className="text-gray-600 mt-4 text-center">
          Cargando resultado del pago...
        </p>
      </div>
    </div>
  );
}

// Componente principal con Suspense
export default function PaymentResultPage() {
  return (
    <Suspense fallback={<PaymentResultLoading />}>
      <PaymentResultContent />
    </Suspense>
  );
}
