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

async function normalizeInvoiceNumbers() {
  try {
    console.log('🔍 Normalizando números de factura a formato de 3 dígitos...\n');
    
    // Obtener todos los pagos con invoice_number
    const { data: payments, error: paymentsError } = await supabaseAdmin
      .from('gym_payments')
      .select('id, invoice_number, created_at')
      .not('invoice_number', 'is', null)
      .order('created_at', { ascending: true });
    
    if (paymentsError) {
      console.error('❌ Error obteniendo pagos:', paymentsError);
      return;
    }
    
    if (!payments || payments.length === 0) {
      console.log('✅ No hay pagos con invoice_number para normalizar');
      return;
    }
    
    console.log(`📋 Encontrados ${payments.length} pago(s) con invoice_number\n`);
    
    let updatedCount = 0;
    let skippedCount = 0;
    
    // Normalizar cada invoice_number a 3 dígitos
    for (const payment of payments) {
      if (!payment.invoice_number) {
        skippedCount++;
        continue;
      }
      
      // Convertir a número y luego a string con 3 dígitos
      const num = parseInt(payment.invoice_number);
      
      if (isNaN(num)) {
        console.warn(`⚠️  Pago ${payment.id} tiene invoice_number inválido: ${payment.invoice_number}`);
        skippedCount++;
        continue;
      }
      
      const normalizedNumber = num.toString().padStart(3, '0');
      
      // Solo actualizar si el formato es diferente
      if (payment.invoice_number !== normalizedNumber) {
        const { error: updateError } = await supabaseAdmin
          .from('gym_payments')
          .update({ 
            invoice_number: normalizedNumber,
            updated_at: new Date().toISOString()
          })
          .eq('id', payment.id);
        
        if (updateError) {
          console.error(`❌ Error actualizando pago ${payment.id}:`, updateError);
        } else {
          console.log(`✅ ${payment.invoice_number} → ${normalizedNumber}`);
          updatedCount++;
        }
      } else {
        skippedCount++;
      }
    }
    
    console.log('\n✨ Normalización completada!');
    console.log(`📊 Resumen:`);
    console.log(`   - Actualizados: ${updatedCount}`);
    console.log(`   - Sin cambios: ${skippedCount}`);
    console.log(`   - Total: ${payments.length}`);
    
  } catch (error) {
    console.error('❌ Error en la normalización:', error);
  }
}

normalizeInvoiceNumbers();
