'use server';

import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase';
import { createClient } from '@/lib/supabase-server';
import { wompiService } from './wompiService';

interface BuyerData {
  firstName: string;
  lastName: string;
  documentId: string;
  documentType?: 'CC' | 'NIT' | 'CE' | 'PP';
  address: string;
}

interface CreateOrderActionParams {
  courseId: string;
  amount: number;
  customerEmail: string;
  customerName: string;
  buyerData: BuyerData;
}

export async function getWompiPublicKeyAction() {
  return process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY || null;
}

export async function createWompiOrderAction({
  courseId,
  amount,
  customerEmail,
  customerName,
  buyerData,
}: CreateOrderActionParams) {
  console.log('tsest');
  try {
    console.log('create');
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    const userId = user?.id;

    if (!userId || authError) {
      return {
        success: false,
        error: 'Debe iniciar sesión para realizar una compra',
      };
    }

    if (amount <= 0) {
      return { success: false, error: 'Monto inválido' };
    }

    // Validar curso
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id, price') // en la version real se usaría course.price para validar monto
      .eq('id', courseId)
      .eq('is_published', true)
      .single();

    if (courseError || !course) {
      return { success: false, error: 'Curso no encontrado o no publicado' };
    }

    // Actualizar perfil
    if (buyerData) {
      const { firstName, lastName, documentId, address, documentType } =
        buyerData;

      if (!firstName || !lastName || !documentId || !address) {
        return {
          success: false,
          error: 'Faltan datos obligatorios del comprador.',
        };
      }

      await supabase
        .from('profiles')
        .update({
          name: `${firstName} ${lastName}`.trim(),
          document_id: documentId,
          document_type: documentType || 'CC',
          address,
          email: customerEmail,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);
    }

    // Generar Referencia
    const reference = wompiService.generateOrderReference();

    // Crear la orden en Supabase (usamos supabaseAdmin para saltar RLS ya que es un proceso interno seguro)
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        user_id: userId,
        course_id: courseId,
        amount,
        currency: 'COP',
        status: 'pending',
        wompi_reference: reference,
        customer_email: customerEmail,
        customer_name: customerName,
        expires_at: new Date(Date.now() + 30 * 60 * 1000), // expira en 30 mins
      })
      .select()
      .single();

    if (orderError || !order) {
      console.error('SUPABASE ORDER ERROR:', orderError);
      return { success: false, error: 'Error al registrar la orden.' };
    }

    // Lógica Mock
    const isMockMode =
      process.env.NODE_ENV === 'development' &&
      process.env.NEXT_PUBLIC_MOCK_PAYMENTS === 'true';

    console.log({ isMockMode });

    if (isMockMode) {
      const mockTransactionId = `mock-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

      await supabaseAdmin
        .from('orders')
        .update({
          status: 'approved',
          wompi_transaction_id: mockTransactionId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', order.id);

      await supabaseAdmin.from('course_purchases').insert({
        user_id: userId,
        course_id: courseId,
        order_id: order.id,
        purchase_price: amount,
        is_active: true,
        access_granted_at: new Date().toISOString(),
      });

      return {
        success: true,
        mock: true,
        orderId: order.id,
        reference,
        transactionId: mockTransactionId,
      };
    }

    // Generar Firma para Frontend Wompi Widget
    // Generar Firma para Wompi Widget (FORMA OFICIAL)

    const amountInCents = Math.round(amount * 100);
    const currency = 'COP';

    const integritySecret = process.env.WOMPI_INTEGRITY_SECRET;
    console.log({ integritySecret });
    if (!integritySecret) {
      console.log('ingresa');
      return { success: false, error: 'WOMPI_INTEGRITY_SECRET no configurado' };
    }

    // 🔥 ORDEN EXACTO EXIGIDO POR WOMPI
    const signatureString = `${reference}${amountInCents}${currency}${integritySecret}`;

    console.log('1');
    const signature = crypto
      .createHash('sha256')
      .update(signatureString)
      .digest('hex');

    console.log('SIGNATURE TYPE:', typeof signature);
    console.log('SIGNATURE VALUE:', signature);
    console.log('logs', {
      reference,
      signature,
      amountInCents,
      currency,
      integritySecret,
      signatureString,
    });

    return {
      success: true,
      orderId: order.id,
      mock: false,
      reference,
      signature,
      amountInCents,
      currency,
      publicKey: process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Error interno del servidor',
    };
  }
}
