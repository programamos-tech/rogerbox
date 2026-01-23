import { NextRequest, NextResponse } from 'next/server';
import { getSession, createClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase';
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

    // Generar firma de integridad para Wompi (solo si no estamos en modo mock)
    const isMockMode = process.env.NEXT_PUBLIC_MOCK_PAYMENTS === 'true';
    const amountInCents = Math.round(amount * 100);
    let signature = '';
    
    if (!isMockMode) {
      const integrityKey = process.env.WOMPI_INTEGRITY_KEY;
      if (!integrityKey) {
        console.error('❌ WOMPI_INTEGRITY_KEY no configurado');
        return NextResponse.json({ error: 'Configuración de pagos incompleta' }, { status: 500 });
      }

      const signatureString = `${reference}${amountInCents}COP${integrityKey}`;
      signature = crypto.createHash('sha256').update(signatureString).digest('hex');
    } else {
      console.log('🎭 Modo mock: omitiendo firma de Wompi');
      signature = 'mock-signature';
    }

    console.log('✅ Orden creada exitosamente');
    console.log('📝 Referencia:', reference);
    console.log('💰 Monto:', amount, 'COP');
    
    // En modo mock, actualizar la orden como aprobada automáticamente
    if (isMockMode) {
      console.log('🎭 Modo mock: Actualizando orden como aprobada automáticamente...');
      console.log('🔍 Modo mock: Datos de la orden:', {
        orderId: order.id,
        userId: userId,
        courseId: courseId,
        amount: amount,
        sessionUserId: session?.user?.id
      });
      
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
        console.error('❌ Error actualizando orden en modo mock:', updateError);
        // No fallar la respuesta, pero loguear el error
      } else {
        console.log('✅ Orden actualizada como aprobada en modo mock');
        
        // Verificar si ya existe una compra activa (como en el webhook)
        const { data: existingPurchase } = await supabaseAdmin
          .from('course_purchases')
          .select('id, user_id, course_id, is_active')
          .eq('user_id', userId)
          .eq('course_id', courseId)
          .eq('is_active', true)
          .maybeSingle();
        
        console.log('🔍 Modo mock: Verificando compra existente:', {
          hasExistingPurchase: !!existingPurchase,
          existingPurchase: existingPurchase
        });
        
        if (existingPurchase) {
          console.log('ℹ️ Compra ya existe para este usuario y curso:', existingPurchase.id);
        } else {
          // Crear la compra del curso inmediatamente (como lo haría el webhook)
          console.log('🔍 Modo mock: Creando compra con datos:', {
            user_id: userId,
            course_id: courseId,
            order_id: order.id,
            purchase_price: amount,
            is_active: true
          });
          
          const { data: createdPurchase, error: purchaseError } = await supabaseAdmin
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
            console.error('❌ Error creando compra en modo mock:', {
              message: purchaseError.message,
              code: purchaseError.code,
              details: purchaseError.details,
              hint: purchaseError.hint,
              attemptedUserId: userId,
              attemptedCourseId: courseId
            });
          } else {
            console.log('✅ Compra del curso creada en modo mock:', {
              purchaseId: createdPurchase?.id,
              userId: createdPurchase?.user_id,
              courseId: createdPurchase?.course_id,
              orderId: createdPurchase?.order_id,
              isActive: createdPurchase?.is_active,
              createdAt: createdPurchase?.created_at,
              sessionUserId: session?.user?.id,
              userIdMatches: createdPurchase?.user_id === session?.user?.id
            });
            
            // IMPORTANTE: Verificar que el user_id de la compra coincide con el de la sesión
            if (createdPurchase?.user_id !== session?.user?.id) {
              console.error('❌ ERROR CRÍTICO: El user_id de la compra NO coincide con el de la sesión!', {
                purchaseUserId: createdPurchase?.user_id,
                sessionUserId: session?.user?.id,
                userIdUsed: userId
              });
            }
            
            // Verificar que la compra se puede leer con el cliente normal (RLS)
            console.log('🔍 Modo mock: Verificando visibilidad RLS de la compra...');
            const { data: verifyPurchase, error: verifyError } = await supabase
              .from('course_purchases')
              .select('id, user_id, course_id, is_active')
              .eq('id', createdPurchase.id)
              .single();
            
            if (verifyError) {
              console.error('⚠️ Advertencia: No se pudo verificar la compra con cliente normal:', {
                message: verifyError.message,
                code: verifyError.code,
                details: verifyError.details,
                purchaseId: createdPurchase.id,
                sessionUserId: session?.user?.id
              });
            } else {
              console.log('✅ Verificación RLS: La compra es visible para el usuario:', {
                purchaseId: verifyPurchase?.id,
                userId: verifyPurchase?.user_id,
                sessionUserId: session?.user?.id,
                matchesSession: verifyPurchase?.user_id === session?.user?.id
              });
            }
            
            // Verificar también con una consulta más amplia usando el cliente normal (con RLS)
            const { data: allUserPurchases, error: allError } = await supabase
              .from('course_purchases')
              .select('id, user_id, course_id, is_active')
              .eq('user_id', userId);
            
            console.log('🔍 Modo mock: Todas las compras del usuario después de crear (con RLS):', {
              count: allUserPurchases?.length || 0,
              purchases: allUserPurchases,
              error: allError,
              sessionUserId: session?.user?.id,
              matchesSession: allUserPurchases?.some(p => p.user_id === session?.user?.id) || false
            });
            
            // Verificar también con admin para comparar
            const { data: allUserPurchasesAdmin } = await supabaseAdmin
              .from('course_purchases')
              .select('id, user_id, course_id, is_active')
              .eq('user_id', userId);
            
            console.log('🔍 Modo mock: Todas las compras del usuario (con admin, sin RLS):', {
              count: allUserPurchasesAdmin?.length || 0,
              purchases: allUserPurchasesAdmin
            });
            
            if (allUserPurchasesAdmin && allUserPurchasesAdmin.length > 0 && (!allUserPurchases || allUserPurchases.length === 0)) {
              console.error('⚠️ PROBLEMA DETECTADO: La compra existe en la BD pero no es visible con RLS');
              console.error('⚠️ Esto indica un problema con las políticas RLS o con el user_id');
            }
          }
        }
      }
    } else {
      console.log('🔐 Firma generada:', signature.substring(0, 20) + '...');
    }

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
