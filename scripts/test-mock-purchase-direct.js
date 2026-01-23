/**
 * Script para probar creación directa de compra mock (simulando el endpoint)
 * Uso: node scripts/test-mock-purchase-direct.js
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});

async function testMockPurchaseDirect() {
  console.log('🧪 Probando creación directa de compra mock...\n');
  
  try {
    // 1. Obtener un curso real
    console.log('📚 Obteniendo curso disponible...');
    const { data: courses, error: coursesError } = await supabaseAdmin
      .from('courses')
      .select('id, title, price')
      .eq('is_published', true)
      .limit(1);
    
    if (coursesError || !courses || courses.length === 0) {
      console.error('❌ No se encontró ningún curso:', coursesError);
      return;
    }
    
    const course = courses[0];
    console.log('✅ Curso encontrado:', {
      id: course.id,
      title: course.title,
      price: course.price
    });
    
    // 2. Obtener un usuario de prueba (o crear uno)
    console.log('\n👤 Obteniendo usuario de prueba...');
    const { data: users, error: usersError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, name')
      .limit(1);
    
    if (usersError || !users || users.length === 0) {
      console.error('❌ No se encontró ningún usuario:', usersError);
      console.log('💡 Necesitas crear un usuario primero o usar uno existente');
      return;
    }
    
    const user = users[0];
    console.log('✅ Usuario encontrado:', {
      id: user.id,
      email: user.email,
      name: user.name
    });
    
    // 3. Crear una orden
    console.log('\n📦 Creando orden...');
    const reference = `ROGER-TEST-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const amount = course.price || 50000;
    
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        user_id: user.id,
        course_id: course.id,
        amount: amount,
        currency: 'COP',
        status: 'pending',
        wompi_reference: reference,
        customer_email: user.email,
        customer_name: user.name || 'Test User',
        expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      })
      .select()
      .single();
    
    if (orderError || !order) {
      console.error('❌ Error creando orden:', orderError);
      return;
    }
    
    console.log('✅ Orden creada:', {
      id: order.id,
      reference: order.wompi_reference,
      amount: order.amount,
      status: order.status
    });
    
    // 4. Simular modo mock: actualizar orden como aprobada
    console.log('\n🎭 Modo mock: Actualizando orden como aprobada...');
    const mockTransactionId = `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const { error: updateError } = await supabaseAdmin
      .from('orders')
      .update({
        status: 'approved',
        wompi_transaction_id: mockTransactionId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', order.id);
    
    if (updateError) {
      console.error('❌ Error actualizando orden:', updateError);
      return;
    }
    
    console.log('✅ Orden actualizada como aprobada');
    
    // 5. Verificar si ya existe una compra
    console.log('\n🔍 Verificando compra existente...');
    const { data: existingPurchase } = await supabaseAdmin
      .from('course_purchases')
      .select('id, user_id, course_id, is_active')
      .eq('user_id', user.id)
      .eq('course_id', course.id)
      .eq('is_active', true)
      .maybeSingle();
    
    if (existingPurchase) {
      console.log('ℹ️ Compra ya existe:', existingPurchase.id);
      console.log('\n✅ Test completado - La compra ya existía');
      return;
    }
    
    // 6. Crear la compra
    console.log('\n💳 Creando compra del curso...');
    const { data: createdPurchase, error: purchaseError } = await supabaseAdmin
      .from('course_purchases')
      .insert({
        user_id: user.id,
        course_id: course.id,
        order_id: order.id,
        purchase_price: amount,
        is_active: true,
        access_granted_at: new Date().toISOString(),
      })
      .select('id, user_id, course_id, order_id, is_active, created_at')
      .single();
    
    if (purchaseError) {
      console.error('❌ Error creando compra:', purchaseError);
      return;
    }
    
    console.log('✅ Compra creada exitosamente:', {
      purchaseId: createdPurchase.id,
      userId: createdPurchase.user_id,
      courseId: createdPurchase.course_id,
      orderId: createdPurchase.order_id,
      isActive: createdPurchase.is_active,
      createdAt: createdPurchase.created_at
    });
    
    // 7. Verificar que la compra es visible con RLS (usando cliente normal)
    console.log('\n🔍 Verificando visibilidad RLS...');
    const supabaseAnon = createClient(
      supabaseUrl,
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
    );
    
    // Nota: Esto fallará porque no hay sesión, pero es para verificar la estructura
    const { data: purchasesWithRLS, error: rlsError } = await supabaseAnon
      .from('course_purchases')
      .select('id, user_id, course_id, is_active')
      .eq('user_id', user.id);
    
    console.log('Compras visibles con RLS (sin sesión):', {
      count: purchasesWithRLS?.length || 0,
      error: rlsError ? rlsError.message : null
    });
    
    // 8. Verificar con admin para comparar
    const { data: purchasesWithAdmin } = await supabaseAdmin
      .from('course_purchases')
      .select('id, user_id, course_id, is_active')
      .eq('user_id', user.id);
    
    console.log('Compras visibles con admin:', {
      count: purchasesWithAdmin?.length || 0
    });
    
    if (purchasesWithAdmin && purchasesWithAdmin.length > 0 && (!purchasesWithRLS || purchasesWithRLS.length === 0)) {
      console.log('\n⚠️ PROBLEMA DETECTADO: La compra existe pero no es visible con RLS');
      console.log('Esto indica un problema con las políticas RLS o con el user_id');
    } else {
      console.log('\n✅ La compra es visible correctamente');
    }
    
    console.log('\n✅ Test completado exitosamente!');
    console.log('\n📋 Resumen:');
    console.log(`   - Orden ID: ${order.id}`);
    console.log(`   - Compra ID: ${createdPurchase.id}`);
    console.log(`   - Usuario ID: ${user.id}`);
    console.log(`   - Curso ID: ${course.id}`);
    console.log(`   - Monto: $${amount} COP`);
    
  } catch (error) {
    console.error('\n❌ Error en el test:', error);
  }
}

// Ejecutar
testMockPurchaseDirect();

