import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});

async function createTestUserWithTwoPlans() {
  try {
    console.log('🔍 Buscando o creando cliente de prueba...');
    
    // Buscar si ya existe un cliente de prueba
    const testDocumentId = '9999999999';
    const { data: existingClient, error: findError } = await supabaseAdmin
      .from('gym_client_info')
      .select('id, name, document_id')
      .eq('document_id', testDocumentId)
      .maybeSingle();
    
    let clientId;
    
    if (existingClient) {
      console.log('✅ Cliente de prueba ya existe:', existingClient.name);
      clientId = existingClient.id;
      
      // Eliminar membresías existentes para empezar limpio
      const { error: deleteError } = await supabaseAdmin
        .from('gym_memberships')
        .delete()
        .eq('client_info_id', clientId);
      
      if (deleteError) {
        console.warn('⚠️ Error eliminando membresías anteriores:', deleteError);
      } else {
        console.log('🗑️ Membresías anteriores eliminadas');
      }
    } else {
      // Crear nuevo cliente de prueba
      const { data: newClient, error: createError } = await supabaseAdmin
        .from('gym_client_info')
        .insert({
          name: 'Usuario Prueba Dos Planes',
          document_id: testDocumentId,
          whatsapp: '3001234567',
          email: 'prueba2planes@test.com',
          created_at: new Date().toISOString(),
        })
        .select()
        .single();
      
      if (createError) {
        console.error('❌ Error creando cliente:', createError);
        return;
      }
      
      console.log('✅ Cliente de prueba creado:', newClient.name);
      clientId = newClient.id;
    }
    
    // Obtener planes disponibles
    console.log('\n🔍 Buscando planes disponibles...');
    const { data: plans, error: plansError } = await supabaseAdmin
      .from('gym_plans')
      .select('id, name, price, duration_days')
      .eq('is_active', true)
      .limit(2);
    
    if (plansError || !plans || plans.length < 2) {
      console.error('❌ Error obteniendo planes o no hay suficientes planes activos');
      console.log('💡 Necesitas tener al menos 2 planes activos en la base de datos');
      return;
    }
    
    console.log(`✅ Encontrados ${plans.length} planes:`, plans.map(p => p.name));
    
    const plan1 = plans[0];
    const plan2 = plans[1];
    
    // Calcular fechas
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Plan 1: Vencido hace 1 semana (7 días)
    const plan1StartDate = new Date(today);
    plan1StartDate.setDate(plan1StartDate.getDate() - plan1.duration_days - 7);
    const plan1EndDate = new Date(today);
    plan1EndDate.setDate(plan1EndDate.getDate() - 7); // Vencido hace 1 semana
    
    // Plan 2: Vence en 3 días
    const plan2StartDate = new Date(today);
    plan2StartDate.setDate(plan2StartDate.getDate() - plan2.duration_days + 3);
    const plan2EndDate = new Date(today);
    plan2EndDate.setDate(plan2EndDate.getDate() + 3); // Vence en 3 días
    
    console.log('\n📅 Fechas calculadas:');
    console.log(`Plan 1 (${plan1.name}):`);
    console.log(`  Inicio: ${plan1StartDate.toISOString().split('T')[0]}`);
    console.log(`  Fin: ${plan1EndDate.toISOString().split('T')[0]} (vencido hace 7 días)`);
    console.log(`Plan 2 (${plan2.name}):`);
    console.log(`  Inicio: ${plan2StartDate.toISOString().split('T')[0]}`);
    console.log(`  Fin: ${plan2EndDate.toISOString().split('T')[0]} (vence en 3 días)`);
    
    // Crear membresía 1 (vencida hace 1 semana)
    console.log('\n📝 Creando membresía 1 (vencida)...');
    const { data: membership1, error: membership1Error } = await supabaseAdmin
      .from('gym_memberships')
      .insert({
        client_info_id: clientId,
        plan_id: plan1.id,
        start_date: plan1StartDate.toISOString().split('T')[0],
        end_date: plan1EndDate.toISOString().split('T')[0],
        status: 'expired',
        created_at: plan1StartDate.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();
    
    if (membership1Error) {
      console.error('❌ Error creando membresía 1:', membership1Error);
      return;
    }
    
    console.log('✅ Membresía 1 creada:', membership1.id);
    
    // Crear membresía 2 (vence en 3 días)
    console.log('\n📝 Creando membresía 2 (vence en 3 días)...');
    const { data: membership2, error: membership2Error } = await supabaseAdmin
      .from('gym_memberships')
      .insert({
        client_info_id: clientId,
        plan_id: plan2.id,
        start_date: plan2StartDate.toISOString().split('T')[0],
        end_date: plan2EndDate.toISOString().split('T')[0],
        status: 'active',
        created_at: plan2StartDate.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();
    
    if (membership2Error) {
      console.error('❌ Error creando membresía 2:', membership2Error);
      return;
    }
    
    console.log('✅ Membresía 2 creada:', membership2.id);
    
    // Crear pagos asociados
    console.log('\n💰 Creando pagos asociados...');
    
    // Pago para membresía 1
    const { data: payment1, error: payment1Error } = await supabaseAdmin
      .from('gym_payments')
      .insert({
        membership_id: membership1.id,
        client_info_id: clientId,
        plan_id: plan1.id,
        amount: plan1.price,
        payment_method: 'cash',
        payment_date: plan1StartDate.toISOString().split('T')[0],
        period_start: plan1StartDate.toISOString().split('T')[0],
        period_end: plan1EndDate.toISOString().split('T')[0],
        invoice_number: null, // Se generará automáticamente
        created_at: plan1StartDate.toISOString(),
      })
      .select()
      .single();
    
    if (payment1Error) {
      console.error('❌ Error creando pago 1:', payment1Error);
    } else {
      console.log('✅ Pago 1 creado:', payment1.id);
    }
    
    // Pago para membresía 2
    const { data: payment2, error: payment2Error } = await supabaseAdmin
      .from('gym_payments')
      .insert({
        membership_id: membership2.id,
        client_info_id: clientId,
        plan_id: plan2.id,
        amount: plan2.price,
        payment_method: 'transfer',
        payment_date: plan2StartDate.toISOString().split('T')[0],
        period_start: plan2StartDate.toISOString().split('T')[0],
        period_end: plan2EndDate.toISOString().split('T')[0],
        invoice_number: null, // Se generará automáticamente
        created_at: plan2StartDate.toISOString(),
      })
      .select()
      .single();
    
    if (payment2Error) {
      console.error('❌ Error creando pago 2:', payment2Error);
    } else {
      console.log('✅ Pago 2 creado:', payment2.id);
    }
    
    // Actualizar invoice_numbers si es necesario
    console.log('\n🔢 Actualizando números de factura...');
    const { data: allPayments, error: paymentsError } = await supabaseAdmin
      .from('gym_payments')
      .select('id, created_at, invoice_number')
      .order('created_at', { ascending: true });
    
    if (!paymentsError && allPayments) {
      let invoiceCounter = 1;
      for (const payment of allPayments) {
        if (!payment.invoice_number) {
          const invoiceNumber = invoiceCounter.toString().padStart(3, '0');
          await supabaseAdmin
            .from('gym_payments')
            .update({ invoice_number: invoiceNumber })
            .eq('id', payment.id);
          invoiceCounter++;
        } else {
          const num = parseInt(payment.invoice_number);
          if (!isNaN(num) && num >= invoiceCounter) {
            invoiceCounter = num + 1;
          }
        }
      }
      console.log('✅ Números de factura actualizados');
    }
    
    console.log('\n✨ Usuario de prueba creado exitosamente!');
    console.log('\n📊 Resumen:');
    console.log(`Cliente: Usuario Prueba Dos Planes (${testDocumentId})`);
    console.log(`Plan 1: ${plan1.name} - Vencido hace 7 días`);
    console.log(`Plan 2: ${plan2.name} - Vence en 3 días`);
    console.log(`\n💡 Puedes buscar este cliente en la tabla de usuarios con el documento: ${testDocumentId}`);
    
  } catch (error) {
    console.error('❌ Error en la creación:', error);
  }
}

createTestUserWithTwoPlans();
