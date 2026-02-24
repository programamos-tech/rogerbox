import crypto from 'node:crypto';
import { type NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { createClient, getSession } from '@/lib/supabase-server';

interface BuyerData {
  firstName: string;
  lastName: string;
  documentId: string;
  documentType: string;
  address: string;
}

export async function POST(request: NextRequest) {
  try {
    // MANDATORY: Verificar autenticación - NO permitir compra como invitado
    const { session } = await getSession();

    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { error: 'Debe iniciar sesión para realizar una compra' },
        { status: 401 },
      );
    }

    // Crear cliente de Supabase con el contexto del usuario autenticado
    const supabase = await createClient();

    const body = await request.json();
    const {
      courseId,
      amount,
      originalPrice,
      discountAmount,
      customerEmail,
      customerName,
      buyerData,
    } = body;

    // Validar datos requeridos
    if (!courseId || !amount || !customerEmail || !customerName) {
      return NextResponse.json(
        { error: 'Datos requeridos faltantes' },
        { status: 400 },
      );
    }

    // Validar datos del comprador
    if (buyerData) {
      const { firstName, lastName, documentId, address } =
        buyerData as BuyerData;
      if (!firstName || !lastName || !documentId || !address) {
        return NextResponse.json(
          {
            error:
              'Datos del comprador incompletos. Todos los campos son obligatorios.',
          },
          { status: 400 },
        );
      }
    }

    // Verificar que el curso existe
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id, title, price')
      .eq('id', courseId)
      .eq('is_published', true)
      .single();

    if (courseError || !course) {
      return NextResponse.json(
        { error: 'Curso no encontrado' },
        { status: 404 },
      );
    }

    // Guardar/actualizar datos del comprador en el perfil
    if (buyerData) {
      const { firstName, lastName, documentId, documentType, address } =
        buyerData as BuyerData;

      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          name: `${firstName} ${lastName}`.trim(),
          document_id: documentId,
          document_type: documentType || 'CC',
          address: address,
          email: customerEmail,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (profileError) {
        // No fallamos la orden por esto, solo logueamos
      } else {
      }
    }

    // Generar referencia única
    const reference = `ROGER-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Crear orden en la base de datos (SIEMPRE con userId)
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: userId, // OBLIGATORIO: usuario autenticado
        course_id: courseId,
        amount: amount,
        currency: 'COP',
        status: 'pending',
        wompi_reference: reference,
        customer_email: customerEmail,
        customer_name: customerName,
        expires_at: new Date(Date.now() + 30 * 60 * 1000), // 30 minutos
      })
      .select()
      .single();

    if (orderError) {
      return NextResponse.json(
        {
          error: 'Error al crear la orden',
          details: orderError.message,
        },
        { status: 500 },
      );
    }

    // Generar firma de integridad para Wompi (solo si no estamos en modo mock)
    // El modo mock solo está permitido en desarrollo
    const nodeEnv = String(process.env.NODE_ENV || 'development');
    const isMockMode =
      nodeEnv !== 'production' &&
      nodeEnv !== 'prod' &&
      process.env.NEXT_PUBLIC_MOCK_PAYMENTS === 'true';
    const amountInCents = Math.round(amount * 100);
    let signature = '';

    if (!isMockMode) {
      const integrityKey = process.env.WOMPI_INTEGRITY_KEY;
      if (!integrityKey) {
        return NextResponse.json(
          { error: 'Configuración de pagos incompleta' },
          { status: 500 },
        );
      }

      const signatureString = `${reference}${amountInCents}COP${integrityKey}`;
      signature = crypto
        .createHash('sha256')
        .update(signatureString)
        .digest('hex');
    } else {
      signature = 'mock-signature';
    }

    // En modo mock, actualizar la orden como aprobada automáticamente
    if (isMockMode) {
      const mockTransactionId = `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Actualizar orden a approved usando admin para bypass RLS (como en el webhook)
      const { error: updateError } = await supabaseAdmin
        .from('orders')
        .update({
          status: 'approved',
          wompi_transaction_id: mockTransactionId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', order.id);

      if (updateError) {
        // No fallar la respuesta, pero loguear el error
      } else {
        // Verificar si ya existe una compra activa (como en el webhook)
        const { data: existingPurchase } = await supabaseAdmin
          .from('course_purchases')
          .select('id, user_id, course_id, is_active')
          .eq('user_id', userId)
          .eq('course_id', courseId)
          .eq('is_active', true)
          .maybeSingle();

        if (existingPurchase) {
        } else {
          const { data: createdPurchase, error: purchaseError } =
            await supabaseAdmin
              .from('course_purchases')
              .insert({
                user_id: userId,
                course_id: courseId,
                order_id: order.id,
                purchase_price: amount,
                is_active: true,
                access_granted_at: new Date().toISOString(),
              })
              .select('id, user_id, course_id, order_id, is_active, created_at')
              .single();

          if (purchaseError) {
          } else {
            // IMPORTANTE: Verificar que el user_id de la compra coincide con el de la sesión
            if (createdPurchase?.user_id !== session?.user?.id) {
            }
            const { data: verifyPurchase, error: verifyError } = await supabase
              .from('course_purchases')
              .select('id, user_id, course_id, is_active')
              .eq('id', createdPurchase.id)
              .single();

            if (verifyError) {
            } else {
            }

            // Verificar también con una consulta más amplia usando el cliente normal (con RLS)
            const { data: allUserPurchases, error: allError } = await supabase
              .from('course_purchases')
              .select('id, user_id, course_id, is_active')
              .eq('user_id', userId);

            // Verificar también con admin para comparar
            const { data: allUserPurchasesAdmin } = await supabaseAdmin
              .from('course_purchases')
              .select('id, user_id, course_id, is_active')
              .eq('user_id', userId);

            if (
              allUserPurchasesAdmin &&
              allUserPurchasesAdmin.length > 0 &&
              (!allUserPurchases || allUserPurchases.length === 0)
            ) {
            }
          }
        }
      }
    } else {
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
      reference: reference,
      signature: signature,
      amountInCents: amountInCents,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
