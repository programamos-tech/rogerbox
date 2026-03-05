'use client';

import { CheckCircle, CreditCard, Shield, ShoppingCart } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import WompiCheckout from '@/modules/payments/checkout/WompiCheckout';
import { processCheckoutIntent } from '../actions/checkout.actions';

interface PurchaseCardProps {
  courseId: string;
  courseTitle: string;
  originalPrice: number;
  discountPercentage?: number;
  isInitialEnrolled: boolean;
}

export default function PurchaseCard({
  courseId,
  courseTitle,
  originalPrice,
  discountPercentage = 0,
  isInitialEnrolled,
}: PurchaseCardProps) {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPaymentWidget, setShowPaymentWidget] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(isInitialEnrolled);

  const finalPrice =
    discountPercentage > 0
      ? Math.round(originalPrice * (1 - discountPercentage / 100))
      : originalPrice;

  const handlePurchase = async () => {
    setIsProcessing(true);

    try {
      const result = await processCheckoutIntent(courseId);

      if (!result.success) {
        if (result.requireAuth) {
          const currentUrl = window.location.pathname;
          router.push(`/login?callbackUrl=${encodeURIComponent(currentUrl)}`);
          return;
        }

        if (result.missingEmail) {
          alert(result.error);
          return;
        }

        if (result.alreadyEnrolled) {
          alert(
            'Ya tienes acceso a este curso. Ve a tu dashboard para empezar a entrenar! 💪',
          );
          router.push('/dashboard');
          return;
        }
      }

      setShowPaymentWidget(true);
    } catch (error) {
      alert('Error procesando el intento de pago.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentSuccess = () => {
    setShowPaymentWidget(false);
    setIsEnrolled(true);
    router.push('/student');
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-lg border-2 border-[#85ea10]/20">
      {/* Cómo funciona - arriba */}
      <div className="mb-4 p-3 bg-[#85ea10]/10 rounded-lg border border-[#85ea10]/30">
        <p className="text-sm font-bold text-[#85ea10] mb-1">
          💪 ¿Cómo funciona?
        </p>
        <p className="text-xs text-gray-600 dark:text-gray-300">
          Al comprar, eliges cuándo empezar. Cada día se desbloquea una nueva
          clase. ¡Mantén la constancia!
        </p>
      </div>

      {/* Precios - horizontal */}
      <div className="mb-4">
        <div className="flex items-center justify-center gap-3">
          {discountPercentage > 0 && (
            <span className="text-lg text-gray-400 line-through">
              ${originalPrice?.toLocaleString('es-CO')}
            </span>
          )}
          <span className="text-3xl font-bold text-gray-900 dark:text-white">
            ${finalPrice?.toLocaleString('es-CO')}
          </span>
          {discountPercentage > 0 && (
            <span className="bg-[#85ea10] text-black text-xs font-bold px-2 py-0.5 rounded-full">
              -{discountPercentage}%
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 text-center">
          Pago único • Sin suscripciones
        </p>
      </div>

      <button
        onClick={handlePurchase}
        disabled={isEnrolled || isProcessing}
        className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${
          isEnrolled || isProcessing
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-[#85ea10] hover:bg-[#7dd30f] text-black shadow-lg hover:shadow-xl hover:scale-[1.02]'
        }`}
      >
        <ShoppingCart className="w-5 h-5" />
        {isProcessing
          ? 'Procesando...'
          : isEnrolled
            ? 'Ya tienes acceso'
            : '¡COMPRAR AHORA!'}
      </button>

      {/* Info de pago - horizontal */}
      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 flex flex-wrap items-center justify-center gap-3 text-xs text-gray-500 dark:text-gray-400">
        <span className="flex items-center gap-1">
          <Shield className="w-3 h-3 text-[#85ea10]" />
          Seguro
        </span>
        <span className="flex items-center gap-1">
          <CheckCircle className="w-3 h-3 text-[#85ea10]" />
          Inmediato
        </span>
        <span className="flex items-center gap-1">
          <CreditCard className="w-3 h-3 text-[#85ea10]" />
          Nequi/PSE
        </span>
      </div>

      {showPaymentWidget && (
        <WompiCheckout
          course={{ id: courseId, title: courseTitle, price: finalPrice }}
          onSuccess={handlePaymentSuccess}
          onClose={() => setShowPaymentWidget(false)}
        />
      )}
    </div>
  );
}
