import { type NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import type { WompiWebhookData } from '@/lib/wompi';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const _signature = request.headers.get('x-wompi-signature') || '';

    // En sandbox, no verificamos la firma por ahora
    // if (!wompiService.verifyWebhookSignature(body, signature)) {
    //   console.error('❌ Invalid webhook signature');
    //   return NextResponse.json(
    //     { error: 'Invalid signature' },
    //     { status: 401 }
    //   );
    // }

    const webhookData: WompiWebhookData = JSON.parse(body);

    // Validar estructura del webhook
    if (!webhookData.data || !webhookData.data.transaction) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid webhook structure',
        },
        { status: 400 },
      );
    }

    const { transaction } = webhookData.data;

    // Buscar la orden por referencia (usando admin para bypass RLS)
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('wompi_reference', transaction.reference)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Crear o actualizar transacción en wompi_transactions (UPSERT usando admin)
    const { error: transactionError } = await supabaseAdmin
      .from('wompi_transactions')
      .upsert(
        {
          wompi_transaction_id: transaction.id,
          order_id: order.id,
          wompi_reference: transaction.reference,
          status: transaction.status,
          status_message: transaction.status_message,
          amount_in_cents: transaction.amount_in_cents,
          currency: transaction.currency || 'COP',
          payment_method_type: transaction.payment_method_type,
          payment_source_id: transaction.payment_source_id,
          customer_email: transaction.customer_email || order.customer_email,
          customer_name: order.customer_name,
          raw_webhook_data: webhookData,
          finalized_at: transaction.finalized_at
            ? new Date(transaction.finalized_at)
            : null,
          webhook_received_at: new Date(),
        },
        {
          onConflict: 'wompi_transaction_id', // Si ya existe, actualizar
        },
      );

    if (transactionError) {
    } else {
    }

    // Procesar según el estado de la transacción
    switch (transaction.status) {
      case 'APPROVED':
        await handleApprovedPayment(order, transaction);
        break;

      case 'DECLINED':
      case 'VOIDED':
        await handleDeclinedPayment(order, transaction);
        break;

      case 'ERROR':
        await handleErrorPayment(order, transaction);
        break;

      default:
    }
    return NextResponse.json(
      {
        success: true,
        message: 'Webhook processed successfully',
      },
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
  } catch (error) {
    // Responder con 200 para evitar reintentos de Wompi
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      {
        status: 200, // Cambiar a 200 para evitar reintentos
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
  }
}

async function handleApprovedPayment(order: any, transaction: any) {
  try {
    // Actualizar estado de la orden (usando admin para bypass RLS)
    const { error: orderUpdateError } = await supabaseAdmin
      .from('orders')
      .update({
        status: 'approved',
        payment_method: transaction.payment_method_type,
        updated_at: new Date(),
      })
      .eq('id', order.id);

    if (orderUpdateError) {
      return;
    }

    // Verificar si ya existe una compra activa (usando admin para bypass RLS)
    const { data: existingPurchase } = await supabaseAdmin
      .from('course_purchases')
      .select('id')
      .eq('user_id', order.user_id)
      .eq('course_id', order.course_id)
      .eq('is_active', true)
      .maybeSingle();

    if (existingPurchase) {
      return;
    }

    // Crear compra del curso (usando admin para bypass RLS)
    const { error: purchaseError } = await supabaseAdmin
      .from('course_purchases')
      .insert({
        user_id: order.user_id,
        course_id: order.course_id,
        order_id: order.id,
        purchase_price: order.amount,
        is_active: true,
        access_granted_at: new Date(),
      });

    if (purchaseError) {
      return;
    }

    // Actualizar contador de estudiantes del curso (usando admin)
    const { error: courseUpdateError } = await supabaseAdmin.rpc(
      'increment_course_students',
      {
        course_id: order.course_id,
      },
    );

    if (courseUpdateError) {
    }
  } catch (_error) {}
}

async function handleDeclinedPayment(order: any, _transaction: any) {
  try {
    const { error } = await supabaseAdmin
      .from('orders')
      .update({
        status: 'declined',
        updated_at: new Date(),
      })
      .eq('id', order.id);

    if (error) {
    }
  } catch (_error) {}
}

async function handleErrorPayment(order: any, _transaction: any) {
  try {
    const { error } = await supabaseAdmin
      .from('orders')
      .update({
        status: 'error',
        updated_at: new Date(),
      })
      .eq('id', order.id);

    if (error) {
    }
  } catch (_error) {}
}
