'use client';

import Hls from 'hls.js';
import { Play, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import WompiCheckout from '@/modules/payments/checkout/WompiCheckout';
import { processCheckoutIntent } from '../actions/checkout.actions';

const PLACEHOLDER_IMAGE = '/images/course-placeholder.jpg';

interface CourseVideoProps {
  courseId: string;
  courseTitle: string;
  originalPrice: number;
  discountPercentage?: number;
  courseImage?: string;
  muxPlaybackId: string;
  initialEnrolled: boolean;
}

export default function CourseVideo({
  courseId,
  courseTitle,
  originalPrice,
  discountPercentage = 0,
  courseImage = '',
  muxPlaybackId,
  initialEnrolled,
}: CourseVideoProps) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [showVideoLogo, setShowVideoLogo] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPaymentWidget, setShowPaymentWidget] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(initialEnrolled);
  const [videoStarted, setVideoStarted] = useState(false);

  const finalPrice =
    discountPercentage > 0
      ? Math.round(originalPrice * (1 - discountPercentage / 100))
      : originalPrice;
  const posterUrl = courseImage || PLACEHOLDER_IMAGE;

  const playbackId = muxPlaybackId?.trim() || '8wRPxlLcp01JrCKhEsyq00BPSrah1qkRY01aOvr01p4suEU';
  const videoUrl = `https://stream.mux.com/${playbackId}.m3u8`;

  const initVideo = useCallback(() => {
    const video = videoRef.current;
    if (!video || !videoStarted) return;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = videoUrl;
      video.load();
      video.play().catch(() => {});
      return;
    }

    if (Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true, lowLatencyMode: false });
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              try {
                hls.startLoad();
              } catch {
                hls.destroy();
              }
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              try {
                hls.recoverMediaError();
              } catch {
                hls.destroy();
              }
              break;
            default:
              hls.destroy();
              break;
          }
        }
      });
      hls.loadSource(videoUrl);
      hls.attachMedia(video);
      hlsRef.current = hls;
      video.play().catch(() => {});
    }
  }, [videoStarted, videoUrl]);

  useEffect(() => {
    if (videoStarted && playbackId) {
      const t = setTimeout(initVideo, 100);
      return () => clearTimeout(t);
    }
  }, [videoStarted, playbackId, initVideo]);

  useEffect(() => {
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, []);

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

        <div className="relative w-full aspect-video bg-gray-900 rounded-xl overflow-hidden">
          {!videoStarted ? (
            <>
              {/* Imagen del curso como portada */}
              <img
                src={posterUrl}
                alt={courseTitle}
                className="absolute inset-0 w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  if (!target.src.endsWith(PLACEHOLDER_IMAGE)) {
                    target.src = PLACEHOLDER_IMAGE;
                  }
                }}
              />
              {/* Botón de play para iniciar el video */}
              <button
                type="button"
                onClick={() => setVideoStarted(true)}
                className="absolute inset-0 flex items-center justify-center z-10 group"
                aria-label="Reproducir video"
              >
                <span className="w-20 h-20 sm:w-24 sm:h-24 bg-black/70 hover:bg-black/90 rounded-full flex items-center justify-center shadow-2xl transition-all duration-200 group-hover:scale-110 border-2 border-white/30">
                  <Play className="w-8 h-8 sm:w-10 sm:h-10 text-white ml-1 fill-white" />
                </span>
              </button>
            </>
          ) : (
            <video
              ref={videoRef}
              className="w-full h-full bg-black"
              controls
              playsInline
              preload="auto"
            />
          )}
        </div>
      </div>

      {showPaymentWidget && (
        <WompiCheckout
          course={{
            id: courseId,
            title: courseTitle,
            price: finalPrice,
            original_price: discountPercentage > 0 ? originalPrice : undefined,
            discount_percentage:
              discountPercentage > 0 ? discountPercentage : undefined,
          }}
          onSuccess={handlePaymentSuccess}
          onClose={() => setShowPaymentWidget(false)}
        />
      )}
    </>
  );
}
