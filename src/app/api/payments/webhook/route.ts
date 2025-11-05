import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { wompiService, WompiWebhookData } from '@/lib/wompi';

export async function POST(request: NextRequest) {
  try {
    console.log('🔔 Webhook received at:', new Date().toISOString());

    const body = await request.text();
    const signature = request.headers.get('x-wompi-signature') || '';

    console.log('🔔 Webhook received:', {
      body: body.substring(0, 200) + '...',
      signature: signature.substring(0, 20) + '...',
      contentType: request.headers.get('content-type'),
      userAgent: request.headers.get('user-agent'),
      allHeaders: Object.fromEntries(request.headers.entries())
    });

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
      console.error('❌ Invalid webhook structure:', webhookData);
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid webhook structure'
        },
        { status: 400 }
      );
    }

    const { transaction } = webhookData.data;

    console.log('🔔 Wompi webhook received:', {
      event: webhookData.event,
      transaction_id: transaction.id,
      status: transaction.status,
      reference: transaction.reference
    });

    // Buscar la orden por referencia
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('wompi_reference', transaction.reference)
      .single();

    if (orderError || !order) {
      console.error('❌ Order not found for reference:', transaction.reference);
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Crear o actualizar transacción en wompi_transactions (UPSERT)
    const { error: transactionError } = await supabase
      .from('wompi_transactions')
      .upsert({
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
        finalized_at: transaction.finalized_at ? new Date(transaction.finalized_at) : null,
        webhook_received_at: new Date()
      }, {
        onConflict: 'wompi_transaction_id' // Si ya existe, actualizar
      });

    if (transactionError) {
      console.error('❌ Error upserting transaction:', transactionError);
    } else {
      console.log('✅ Transaction saved to wompi_transactions');
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
        console.log('ℹ️ Transaction status not processed:', transaction.status);
    }

    console.log('✅ Webhook processed successfully');
    return NextResponse.json({
      success: true,
      message: 'Webhook processed successfully'
    }, {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('❌ Error processing webhook:', error);

    // Responder con 200 para evitar reintentos de Wompi
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      {
        status: 200, // Cambiar a 200 para evitar reintentos
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
}

async function handleApprovedPayment(order: any, transaction: any) {
  try {
    console.log('✅ Processing approved payment for order:', order.id);

    // Actualizar estado de la orden
    const { error: orderUpdateError } = await supabase
      .from('orders')
      .update({
        status: 'approved',
        payment_method: transaction.payment_method_type,
        updated_at: new Date()
      })
      .eq('id', order.id);

    if (orderUpdateError) {
      console.error('❌ Error updating order status:', orderUpdateError);
      return;
    }

    // Verificar si ya existe una compra activa
    const { data: existingPurchase } = await supabase
      .from('course_purchases')
      .select('id')
      .eq('user_id', order.user_id)
      .eq('course_id', order.course_id)
      .eq('is_active', true)
      .single();

    if (existingPurchase) {
      console.log('ℹ️ Purchase already exists for this user and course');
      return;
    }

    // Crear compra del curso
    const { error: purchaseError } = await supabase
      .from('course_purchases')
      .insert({
        user_id: order.user_id,
        course_id: order.course_id,
        order_id: order.id,
        purchase_price: order.amount,
        is_active: true,
        access_granted_at: new Date()
      });

    if (purchaseError) {
      console.error('❌ Error creating course purchase:', purchaseError);
      return;
    }

    // Actualizar contador de estudiantes del curso
    const { error: courseUpdateError } = await supabase.rpc('increment_course_students', {
      course_id: order.course_id
    });

    if (courseUpdateError) {
      console.error('❌ Error updating course students count:', courseUpdateError);
    }

    console.log('✅ Course purchase created successfully for user:', order.user_id);

  } catch (error) {
    console.error('❌ Error in handleApprovedPayment:', error);
  }
}

async function handleDeclinedPayment(order: any, transaction: any) {
  try {
    console.log('❌ Processing declined payment for order:', order.id);

    const { error } = await supabase
      .from('orders')
      .update({
        status: 'declined',
        updated_at: new Date()
      })
      .eq('id', order.id);

    if (error) {
      console.error('❌ Error updating declined order:', error);
    }

  } catch (error) {
    console.error('❌ Error in handleDeclinedPayment:', error);
  }
}

async function handleErrorPayment(order: any, transaction: any) {
  try {
    console.log('⚠️ Processing error payment for order:', order.id);

    const { error } = await supabase
      .from('orders')
      .update({
        status: 'error',
        updated_at: new Date()
      })
      .eq('id', order.id);

    if (error) {
      console.error('❌ Error updating error order:', error);
    }

  } catch (error) {
    console.error('❌ Error in handleErrorPayment:', error);
  }
}
