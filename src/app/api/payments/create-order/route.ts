import crypto from 'crypto';
import { type NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { createClient, getSession } from '@/lib/supabase-server';

interface BuyerData {
  firstName: string;
  lastName: string;
  documentId: string;
  documentType?: string;
  address: string;
}

export async function POST(request: NextRequest) {
  try {
    /* =====================================================
       1️⃣  Verificar autenticación obligatoria
    ====================================================== */
    const { session } = await getSession();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { error: 'Debe iniciar sesión para realizar una compra' },
        { status: 401 },
      );
    }

    const supabase = await createClient();

    /* =====================================================
       2️⃣  Obtener y validar body
    ====================================================== */
    const body = await request.json();

    const { courseId, amount, customerEmail, customerName, buyerData } = body;

    if (!courseId || !amount || !customerEmail || !customerName) {
      return NextResponse.json(
        { error: 'Datos requeridos faltantes' },
        { status: 400 },
      );
    }

    if (typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { error: 'El monto debe ser un número válido mayor a 0' },
        { status: 400 },
      );
    }

    /* =====================================================
       3️⃣  Verificar que el curso existe
    ====================================================== */
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id, title') // 🔥 NO validamos precio todavía
      .eq('id', courseId)
      .eq('is_published', true)
      .single();

    if (courseError || !course) {
      return NextResponse.json(
        { error: 'Curso no encontrado o no publicado' },
        { status: 404 },
      );
    }

    /* =====================================================
       ⚠️  PENDIENTE:
       Aquí deberías validar que:
       amount === course.price

       Ejemplo futuro:
       if (amount !== course.price) { ... }

       IMPORTANTE: Nunca confíes en el precio enviado desde el frontend.
       Siempre debe validarse contra la base de datos.
       if (amount !== course.price) {
          return NextResponse.json(
            { error: 'El monto no coincide con el precio actual del curso' },
            { status: 400 }
          );
        }
    ====================================================== */

    /* =====================================================
       4️⃣  Validar y actualizar datos del comprador
    ====================================================== */
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

      await supabase
        .from('profiles')
        .update({
          name: `${firstName} ${lastName}`.trim(),
          document_id: documentId,
          document_type: buyerData.documentType || 'CC',
          address,
          email: customerEmail,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);
    }

    /* =====================================================
       5️⃣  Generar referencia única
    ====================================================== */
    const reference = `ORDER-${Date.now()}-${crypto
      .randomBytes(4)
      .toString('hex')}`;

    /* =====================================================
       6️⃣  Crear orden en base de datos
    ====================================================== */
    const { data: order, error: orderError } = await supabase
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
        expires_at: new Date(Date.now() + 30 * 60 * 1000), // 30 min
      })
      .select()
      .single();

    /* =====================================================
    🔹 MOCK MODE (SOLO DESARROLLO)
    ===================================================== */

    const isMockMode =
      process.env.NODE_ENV === 'development' &&
      process.env.NEXT_PUBLIC_MOCK_PAYMENTS === 'true';

    if (isMockMode) {
      const mockTransactionId = `mock-${Date.now()}-${crypto
        .randomBytes(4)
        .toString('hex')}`;

      // Aprobar orden inmediatamente
      await supabaseAdmin
        .from('orders')
        .update({
          status: 'approved',
          wompi_transaction_id: mockTransactionId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', order.id);

      // Crear acceso al curso
      await supabaseAdmin.from('course_purchases').insert({
        user_id: userId,
        course_id: courseId,
        order_id: order.id,
        purchase_price: amount,
        is_active: true,
        access_granted_at: new Date().toISOString(),
      });

      return NextResponse.json({
        success: true,
        mock: true,
        orderId: order.id,
      });
    }

    /* =====================================================
    🔹 MOCK MODE (SOLO DESARROLLO)
    ===================================================== */

    if (orderError || !order) {
      return NextResponse.json(
        {
          error: 'Error al crear la orden',
          details: orderError?.message,
        },
        { status: 500 },
      );
    }

    /* =====================================================
       7️⃣  Generar firma para Wompi
    ====================================================== */
    const integrityKey = process.env.WOMPI_INTEGRITY_KEY;

    if (!integrityKey) {
      return NextResponse.json(
        { error: 'Configuración de pagos incompleta' },
        { status: 500 },
      );
    }

    const amountInCents = Math.round(amount * 100);

    const signatureString = `${reference}${amountInCents}COP${integrityKey}`;

    const signature = crypto
      .createHash('sha256')
      .update(signatureString)
      .digest('hex');

    /* =====================================================
       8️⃣  Respuesta final
    ====================================================== */
    return NextResponse.json({
      success: true,
      orderId: order.id,
      reference,
      signature,
      amountInCents,
      publicKey: process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY,
      environment: process.env.WOMPI_ENVIRONMENT || 'sandbox',
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
