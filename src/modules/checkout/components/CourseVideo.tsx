'use client';

import { Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import WompiCheckout from '@/modules/payments/checkout/WompiCheckout';
import { processCheckoutIntent } from '../actions/checkout.actions';

interface CourseVideoProps {
  courseId: string;
  courseTitle: string;
  coursePrice: number;
  muxPlaybackId: string;
  initialEnrolled: boolean;
}

export default function CourseVideo({
  courseId,
  courseTitle,
  coursePrice,
  muxPlaybackId,
  initialEnrolled,
}: CourseVideoProps) {
  const router = useRouter();
  const [showVideoLogo, setShowVideoLogo] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPaymentWidget, setShowPaymentWidget] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(initialEnrolled);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowVideoLogo(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

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
          alert(
            'Tu cuenta no tiene un email asociado. Por favor actualiza tu perfil.',
          );
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
    <>
      <div className="relative bg-gray-900 rounded-xl overflow-hidden shadow-lg">
        {/* Logo RogerBox - oculto cuando el modal de pago está abierto para que no se superponga */}
        {!showPaymentWidget && (
          <div
            className={`absolute top-3 right-3 z-[1] transition-all duration-500 ${showVideoLogo ? 'opacity-50' : 'opacity-0'}`}
          >
            <span className="text-white font-black text-sm tracking-tight">
              ROGER<span className="text-[#85ea10]">BOX</span>
            </span>
          </div>
        )}

        {/* Botón CTA flotante - oculto cuando el modal está abierto */}
        {!isEnrolled && !showPaymentWidget && (
          <button
            onClick={handlePurchase}
            disabled={isProcessing}
            className="absolute bottom-16 right-3 z-[1] flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-100 text-gray-900 text-sm font-bold rounded-full shadow-lg transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Zap className="w-4 h-4" />
            {isProcessing ? 'Procesando...' : '¡Lo quiero!'}
          </button>
        )}

        <div className="relative w-full aspect-video">
          <iframe
            src={`https://player.mux.com/${muxPlaybackId || '8wRPxlLcp01JrCKhEsyq00BPSrah1qkRY01aOvr01p4suEU'}?preload=auto`}
            style={{ width: '100%', height: '100%', border: 'none' }}
            allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            className="w-full h-full"
          />
        </div>
      </div>

      {showPaymentWidget && (
        <WompiCheckout
          course={{ id: courseId, title: courseTitle, price: coursePrice }}
          onSuccess={handlePaymentSuccess}
          onClose={() => setShowPaymentWidget(false)}
        />
      )}
    </>
  );
}
