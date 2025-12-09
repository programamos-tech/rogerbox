import { NextRequest, NextResponse } from 'next/server';
import { getSession, createClient } from '@/lib/supabase-server';
import { wompiService } from '@/lib/wompi';
import crypto from 'crypto';

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
      console.warn('⚠️ Intento de compra sin autenticación - RECHAZADO');
      return NextResponse.json({ error: 'Debe iniciar sesión para realizar una compra' }, { status: 401 });
    }

    // Crear cliente de Supabase con el contexto del usuario autenticado
    const supabase = await createClient();

    const body = await request.json();
    const { courseId, amount, originalPrice, discountAmount, customerEmail, customerName, buyerData } = body;

    // Validar datos requeridos
    if (!courseId || !amount || !customerEmail || !customerName) {
      return NextResponse.json({ error: 'Datos requeridos faltantes' }, { status: 400 });
    }

    // Validar datos del comprador
    if (buyerData) {
      const { firstName, lastName, documentId, address } = buyerData as BuyerData;
      if (!firstName || !lastName || !documentId || !address) {
        return NextResponse.json(
          { error: 'Datos del comprador incompletos. Todos los campos son obligatorios.' },
          { status: 400 }
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
      return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 });
    }

    // Guardar/actualizar datos del comprador en el perfil
    if (buyerData) {
      const { firstName, lastName, documentId, documentType, address } = buyerData as BuyerData;

      console.log('📝 Actualizando datos del comprador en perfil...');

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
        console.warn('⚠️ Error actualizando perfil (no crítico):', profileError);
        // No fallamos la orden por esto, solo logueamos
      } else {
        console.log('✅ Datos del comprador guardados en perfil');
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
      console.error('❌ Error creating order:', orderError);
      return NextResponse.json(
        {
          error: 'Error al crear la orden',
          details: orderError.message,
        },
        { status: 500 }
      );
    }

    // Generar firma de integridad para Wompi
    const integrityKey = process.env.WOMPI_INTEGRITY_KEY;
    if (!integrityKey) {
      console.error('❌ WOMPI_INTEGRITY_KEY no configurado');
      return NextResponse.json({ error: 'Configuración de pagos incompleta' }, { status: 500 });
    }

    const amountInCents = Math.round(amount * 100);
    const signatureString = `${reference}${amountInCents}COP${integrityKey}`;
    const signature = crypto.createHash('sha256').update(signatureString).digest('hex');

    console.log('✅ Orden creada exitosamente');
    console.log('📝 Referencia:', reference);
    console.log('💰 Monto:', amount, 'COP');
    console.log('🔐 Firma generada:', signature.substring(0, 20) + '...');

    return NextResponse.json({
      success: true,
      orderId: order.id,
      reference: reference,
      signature: signature,
      amountInCents: amountInCents,
    });
  } catch (error) {
    console.error('❌ Error in create-order:', error);
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
