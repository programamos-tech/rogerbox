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

async function simulateOliverExpired() {
  try {
    console.log('🔍 Buscando a Oliver...');
    
    // Buscar a Oliver en gym_client_info
    const { data: clients, error: clientsError } = await supabaseAdmin
      .from('gym_client_info')
      .select('id, name, document_id')
      .ilike('name', '%Oliver%');
    
    if (clientsError) {
      console.error('❌ Error buscando clientes:', clientsError);
      return;
    }
    
    if (!clients || clients.length === 0) {
      console.log('❌ No se encontró a Oliver en gym_client_info');
      return;
    }
    
    console.log(`✅ Encontrados ${clients.length} cliente(s) con nombre Oliver:`, clients);
    
    // Buscar la membresía más reciente de Oliver
    const oliver = clients[0]; // Tomar el primero
    console.log(`\n🔍 Buscando membresías de ${oliver.name} (${oliver.document_id})...`);
    
    const { data: memberships, error: membershipsError } = await supabaseAdmin
      .from('gym_memberships')
      .select('id, end_date, status, plan:gym_plans(name)')
      .eq('client_info_id', oliver.id)
      .order('end_date', { ascending: false })
      .limit(1);
    
    if (membershipsError) {
      console.error('❌ Error buscando membresías:', membershipsError);
      return;
    }
    
    if (!memberships || memberships.length === 0) {
      console.log('❌ Oliver no tiene membresías registradas');
      return;
    }
    
    const latestMembership = memberships[0];
    console.log(`\n📋 Membresía encontrada:`, {
      id: latestMembership.id,
      plan: latestMembership.plan?.name,
      end_date_actual: latestMembership.end_date,
      status: latestMembership.status
    });
    
    // Calcular fecha de hace 3 días
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const threeDaysAgo = new Date(today);
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const newEndDate = threeDaysAgo.toISOString().split('T')[0];
    
    console.log(`\n📅 Actualizando end_date a hace 3 días: ${newEndDate}`);
    
    // Actualizar la membresía
    const { data: updated, error: updateError } = await supabaseAdmin
      .from('gym_memberships')
      .update({
        end_date: newEndDate,
        updated_at: new Date().toISOString()
      })
      .eq('id', latestMembership.id)
      .select()
      .single();
    
    if (updateError) {
      console.error('❌ Error actualizando membresía:', updateError);
      return;
    }
    
    console.log('✅ Membresía actualizada exitosamente!');
    console.log('📊 Datos actualizados:', {
      id: updated.id,
      end_date: updated.end_date,
      status: updated.status,
      días_vencidos: Math.floor((today.getTime() - new Date(updated.end_date).getTime()) / (1000 * 60 * 60 * 24))
    });
    
    console.log('\n✨ Simulación completada! Oliver ahora tiene 3 días vencidos.');
    
  } catch (error) {
    console.error('❌ Error en la simulación:', error);
  }
}

simulateOliverExpired();
