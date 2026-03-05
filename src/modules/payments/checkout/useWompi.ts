'use client';

import { useEffect, useState } from 'react';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { supabase } from '@/lib/supabase-browser';
import { createWompiOrderAction, getWompiPublicKeyAction } from '../actions';

export interface BuyerData {
  firstName: string;
  lastName: string;
  email: string;
  documentId: string;
  documentType: 'CC' | 'NIT' | 'CE' | 'PP';
  address: string;
}

interface UseWompiProps {
  course: {
    id: string;
    title: string;
    price: number;
    original_price?: number;
    discount_percentage?: number;
  };
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function useWompi({ course, onSuccess, onError }: UseWompiProps) {
  const { user } = useSupabaseAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [widgetReady, setWidgetReady] = useState(false);
  const [wompiPublicKey, setWompiPublicKey] = useState<string>('');

  const [buyerData, setBuyerData] = useState<BuyerData>({
    firstName: '',
    lastName: '',
    email: '',
    documentId: '',
    documentType: 'CC',
    address: '',
  });

  // Obtener clave pública Wompi
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const key = await getWompiPublicKeyAction();
        if (key) {
          setWompiPublicKey(key);
        } else {
          onError?.('Error de configuración del sistema de pagos');
        }
      } catch (error) {
        onError?.('Error al cargar la configuración de pagos');
      }
    };
    fetchConfig();
  }, [onError]);

  // Verificar Widget
  useEffect(() => {
    let attempts = 0;
    const maxAttempts = 100;

    const checkWidget = () => {
      attempts++;
      if (
        typeof window !== 'undefined' &&
        typeof (window as any).WidgetCheckout === 'function'
      ) {
        setWidgetReady(true);
        return;
      }
      if (attempts < maxAttempts) {
        setTimeout(checkWidget, 100);
      } else {
        onError?.('El widget de pago no se cargó correctamente.');
      }
    };

    setTimeout(checkWidget, 200);
  }, [onError]);

  // Precargar Perfil
  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.id) {
        setIsLoadingProfile(false);
        return;
      }

      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('name, email, document_id, document_type, address')
          .eq('id', user.id)
          .maybeSingle();

        if (error || !profile) {
          setBuyerData((prev) => ({ ...prev, email: user?.email || '' }));
          return;
        }

        let firstName = '';
        let lastName = '';
        if (profile.name) {
          const parts = profile.name.trim().split(' ');
          if (parts.length >= 2) {
            firstName = parts.slice(0, Math.ceil(parts.length / 2)).join(' ');
            lastName = parts.slice(Math.ceil(parts.length / 2)).join(' ');
          } else {
            firstName = profile.name;
          }
        }

        setBuyerData({
          firstName,
          lastName,
          email: profile.email || user?.email || '',
          documentId: profile.document_id || '',
          documentType:
            (profile.document_type as 'CC' | 'NIT' | 'CE' | 'PP') || 'CC',
          address: profile.address || '',
        });
      } catch (error) {
        setBuyerData((prev) => ({ ...prev, email: user?.email || '' }));
      } finally {
        setIsLoadingProfile(false);
      }
    };

    loadProfile();
  }, [user]);

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
    if (!isFormValid()) {
      onError?.('Por favor completa todos los campos obligatorios');
      return;
    }

    if (!widgetReady || !wompiPublicKey) {
      onError?.(
        'El widget de pago o la clave pública no están listos. Verifica tus variables de entorno y recarga la página.',
      );
      return;
    }

    setIsLoading(true);

    try {
      const fullName = `${buyerData.firstName.trim()} ${buyerData.lastName.trim()}`;

      const orderResult = await createWompiOrderAction({
        courseId: course.id,
        amount: course.price, // pesos
        customerEmail: buyerData.email,
        customerName: fullName,
        buyerData,
      });

      if (!orderResult.success) {
        throw new Error(orderResult.error);
      }

      const {
        reference,
        amountInCents,
        publicKey,
        signature,
        currency,
        orderId,
      } = orderResult;

      console.log(
        { orderResult },
        {
          currency,
          amountInCents, // 🔥 number correcto
          reference,
          publicKey,
          signature: { integrity: signature }, // 🔥 EXACTAMENTE así
          redirectUrl: `${window.location.origin}/payment/result?order_id=${orderId}&reference=${reference}`,
          customerData: {
            email: buyerData.email,
            fullName,
            legalId: buyerData.documentId,
            legalIdType: buyerData.documentType,
          },
        },
      );

      const redirectUrl = new URL(
        `${process.env.NEXT_PUBLIC_WOMPI_REDIRECT_URL}/payment/result`,
      );

      redirectUrl.searchParams.append('order_id', orderId);
      redirectUrl.searchParams.append('reference', String(reference));

      const checkout = new (window as any).WidgetCheckout({
        currency: currency,
        amountInCents: amountInCents,
        reference: reference,
        publicKey: publicKey,
        signature: { integrity: signature },

        redirectUrl: redirectUrl.toString(),

        customerData: {
          email: String(buyerData.email),
          fullName: String(fullName),
          legalId: String(buyerData.documentId),
          legalIdType: String(buyerData.documentType),
        },
      });

      checkout.open((result: any) => {
        setIsLoading(false);

        const status = result?.transaction?.status;
        const transactionId = result?.transaction?.id;

        window.location.href =
          `${window.location.origin}/payment/result` +
          `?order_id=${orderId}` +
          `&reference=${reference}` +
          `&id=${transactionId}` +
          `&status=${status}`;
      });
    } catch (error) {
      setIsLoading(false);
      onError?.(
        error instanceof Error ? error.message : 'Error procesando el pago',
      );
    }
  };

  return {
    buyerData,
    setBuyerData,
    isLoading,
    isLoadingProfile,
    widgetReady,
    wompiPublicKey,
    isFormValid,
    handlePayment,
  };
}
