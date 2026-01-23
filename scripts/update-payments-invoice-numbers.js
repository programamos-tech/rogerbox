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

async function updatePaymentsInvoiceNumbers() {
  try {
    console.log('🔍 Buscando pagos sin invoice_number...');
    
    // Obtener todos los pagos ordenados por fecha de creación
    const { data: payments, error: paymentsError } = await supabaseAdmin
      .from('gym_payments')
      .select('id, created_at, invoice_number')
      .order('created_at', { ascending: true });
    
    if (paymentsError) {
      console.error('❌ Error obteniendo pagos:', paymentsError);
      return;
    }
    
    if (!payments || payments.length === 0) {
      console.log('✅ No hay pagos para actualizar');
      return;
    }
    
    console.log(`📋 Encontrados ${payments.length} pago(s)`);
    
    // Filtrar pagos sin invoice_number
    const paymentsWithoutInvoice = payments.filter(p => !p.invoice_number);
    
    if (paymentsWithoutInvoice.length === 0) {
      console.log('✅ Todos los pagos ya tienen invoice_number');
      return;
    }
    
    console.log(`📝 Actualizando ${paymentsWithoutInvoice.length} pago(s) sin invoice_number...`);
    
    // Encontrar el número más alto de invoice_number existente
    const paymentsWithInvoice = payments.filter(p => p.invoice_number);
    let invoiceCounter = 1;
    
    if (paymentsWithInvoice.length > 0) {
      const maxInvoiceNumber = Math.max(
        ...paymentsWithInvoice
          .map(p => {
            const num = parseInt(p.invoice_number);
            return isNaN(num) ? 0 : num;
          })
      );
      invoiceCounter = maxInvoiceNumber + 1;
    }
    
    // Actualizar cada pago sin invoice_number con un número secuencial
    for (const payment of paymentsWithoutInvoice) {
      const invoiceNumber = invoiceCounter.toString().padStart(4, '0');
      
      const { error: updateError } = await supabaseAdmin
        .from('gym_payments')
        .update({ 
          invoice_number: invoiceNumber,
          updated_at: new Date().toISOString()
        })
        .eq('id', payment.id);
      
      if (updateError) {
        console.error(`❌ Error actualizando pago ${payment.id}:`, updateError);
      } else {
        console.log(`✅ Pago ${payment.id} actualizado con invoice_number: ${invoiceNumber}`);
      }
      
      invoiceCounter++;
    }
    
    console.log('\n✨ Actualización completada!');
    
  } catch (error) {
    console.error('❌ Error en la actualización:', error);
  }
}

updatePaymentsInvoiceNumbers();
