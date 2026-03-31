import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:55621';
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
});

async function createInactiveUser() {
  try {
    console.log('🔍 Creando usuario inactivo de prueba...');

    // Crear cliente de prueba
    const testDocumentId = '8888888888';
    const { data: existingClient, error: findError } = await supabaseAdmin
      .from('gym_client_info')
      .select('id, name, document_id')
      .eq('document_id', testDocumentId)
      .maybeSingle();

    let clientId;

    if (existingClient) {
      console.log('✅ Cliente de prueba ya existe:', existingClient.name);
      clientId = existingClient.id;

      // Eliminar membresías existentes
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
          name: 'Usuario Inactivo Prueba',
          document_id: testDocumentId,
          whatsapp: '3008888888',
          email: 'inactivo@test.com',
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

    // Obtener un plan disponible
    console.log('\n🔍 Buscando plan disponible...');
    const { data: plans, error: plansError } = await supabaseAdmin
      .from('gym_plans')
      .select('id, name, price, duration_days')
      .eq('is_active', true)
      .limit(1)
      .single();

    if (plansError || !plans) {
      console.error('❌ Error obteniendo plan o no hay planes activos');
      return;
    }

    console.log(`✅ Plan encontrado: ${plans.name}`);

    // Calcular fechas
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // El usuario pagó hace 6 meses (180 días)
    // Su plan duró 1 mes (30 días), entonces venció hace ~5 meses (150 días)
    // Pero el usuario dejó de ir hace 2 meses (60 días)
    // Para simplificar: el plan venció hace ~6 meses (180 días)

    const planStartDate = new Date(today);
    planStartDate.setDate(planStartDate.getDate() - 180 - plans.duration_days); // Hace 6 meses + duración del plan

    const planEndDate = new Date(today);
    planEndDate.setDate(planEndDate.getDate() - 180); // Venció hace 6 meses (180 días)

    console.log('\n📅 Fechas calculadas:');
    console.log(`Plan: ${plans.name}`);
    console.log(`  Inicio: ${planStartDate.toISOString().split('T')[0]}`);
    console.log(
      `  Fin: ${planEndDate.toISOString().split('T')[0]} (vencido hace ${Math.floor((today.getTime() - planEndDate.getTime()) / (1000 * 60 * 60 * 24))} días)`,
    );

    // Crear membresía vencida hace 6 meses
    console.log('\n📝 Creando membresía vencida...');
    const { data: membership, error: membershipError } = await supabaseAdmin
      .from('gym_memberships')
      .insert({
        client_info_id: clientId,
        plan_id: plans.id,
        start_date: planStartDate.toISOString().split('T')[0],
        end_date: planEndDate.toISOString().split('T')[0],
        status: 'expired',
        created_at: planStartDate.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (membershipError) {
      console.error('❌ Error creando membresía:', membershipError);
      return;
    }

    console.log('✅ Membresía creada:', membership.id);

    // Crear pago asociado
    console.log('\n💰 Creando pago asociado...');
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from('gym_payments')
      .insert({
        membership_id: membership.id,
        client_info_id: clientId,
        plan_id: plans.id,
        amount: plans.price,
        payment_method: 'cash',
        payment_date: planStartDate.toISOString().split('T')[0],
        period_start: planStartDate.toISOString().split('T')[0],
        period_end: planEndDate.toISOString().split('T')[0],
        invoice_number: null, // Se generará automáticamente
        created_at: planStartDate.toISOString(),
      })
      .select()
      .single();

    if (paymentError) {
      console.error('❌ Error creando pago:', paymentError);
    } else {
      console.log('✅ Pago creado:', payment.id);
    }

    // Actualizar invoice_number si es necesario
    console.log('\n🔢 Actualizando números de factura...');
    const { data: allPayments, error: paymentsError } = await supabaseAdmin
      .from('gym_payments')
      .select('id, created_at, invoice_number')
      .order('created_at', { ascending: true });

    if (!paymentsError && allPayments) {
      let invoiceCounter = 1;
      for (const p of allPayments) {
        if (!p.invoice_number) {
          const invoiceNumber = invoiceCounter.toString().padStart(3, '0');
          await supabaseAdmin
            .from('gym_payments')
            .update({ invoice_number: invoiceNumber })
            .eq('id', p.id);
          invoiceCounter++;
        } else {
          const num = parseInt(p.invoice_number);
          if (!isNaN(num) && num >= invoiceCounter) {
            invoiceCounter = num + 1;
          }
        }
      }
      console.log('✅ Números de factura actualizados');
    }

    const daysSinceExpired = Math.floor(
      (today.getTime() - planEndDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    console.log('\n✨ Usuario inactivo creado exitosamente!');
    console.log('\n📊 Resumen:');
    console.log(`Cliente: Usuario Inactivo Prueba (${testDocumentId})`);
    console.log(`Plan: ${plans.name}`);
    console.log(
      `Fecha de vencimiento: ${planEndDate.toISOString().split('T')[0]}`,
    );
    console.log(`Días vencidos: ${daysSinceExpired} días`);
    console.log(
      `Estado esperado: ${daysSinceExpired > 30 ? 'Inactivo (rojo) ⚠️' : 'Renovar (naranja)'}`,
    );
    console.log(
      `\n💡 Puedes buscar este cliente en la tabla de usuarios con el documento: ${testDocumentId}`,
    );
  } catch (error) {
    console.error('❌ Error en la creación:', error);
  }
}

createInactiveUser();
