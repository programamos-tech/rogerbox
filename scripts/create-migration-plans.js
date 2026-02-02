/**
 * Script para crear los planes migrados desde BigBoss
 * Ejecutar con: node scripts/create-migration-plans.js
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Falta NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const plans = [
  {
    name: "cupo ROGERBOX",
    description: "Plan principal RogerBox - Migrado desde BigBoss (541 registros históricos)",
    price: 145000,
    duration_days: 30,
    is_active: true
  },
  {
    name: "cupo ROGERBOX virtual",
    description: "Plan RogerBox Virtual - Migrado desde BigBoss (55 registros históricos)",
    price: 135000,
    duration_days: 30,
    is_active: true
  },
  {
    name: "ASESORIA VIP - COACHING",
    description: "Asesoría VIP de Coaching - Migrado desde BigBoss (12 registros históricos)",
    price: 150000,
    duration_days: 30,
    is_active: true
  },
  {
    name: "BOX 15 DIAS",
    description: "Plan de 15 días - Migrado desde BigBoss (5 registros históricos)",
    price: 85000,
    duration_days: 15,
    is_active: true
  },
  {
    name: "LINIMENTO",
    description: "Producto Linimento - Migrado desde BigBoss (2 registros históricos)",
    price: 55000,
    duration_days: 30,
    is_active: false
  },
  {
    name: "ASESORIA PLATA",
    description: "Asesoría Plata - Migrado desde BigBoss (2 registros históricos)",
    price: 50000,
    duration_days: 30,
    is_active: false
  },
  {
    name: "BANDA BOX",
    description: "Banda Box - Migrado desde BigBoss (1 registro histórico)",
    price: 60000,
    duration_days: 30,
    is_active: false
  }
];

async function createPlans() {
  console.log('🚀 Creando planes migrados desde BigBoss...\n');
  
  for (const plan of plans) {
    try {
      console.log(`📦 Creando: ${plan.name} ($${plan.price.toLocaleString()}, ${plan.duration_days} días)...`);
      
      // Verificar si ya existe
      const { data: existing } = await supabase
        .from('gym_plans')
        .select('id, name')
        .eq('name', plan.name)
        .maybeSingle();
      
      if (existing) {
        console.log(`   ⚠️  Ya existe con ID: ${existing.id}`);
        continue;
      }
      
      const { data, error } = await supabase
        .from('gym_plans')
        .insert(plan)
        .select()
        .single();
      
      if (error) {
        console.log(`   ❌ Error: ${error.message}`);
      } else {
        console.log(`   ✅ Creado con ID: ${data.id}`);
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }
  
  console.log('\n✅ Proceso completado.');
  console.log('\n📋 Resumen de planes:');
  console.log('   - Activos: cupo ROGERBOX, cupo ROGERBOX virtual, ASESORIA VIP, BOX 15 DIAS');
  console.log('   - Inactivos (históricos): LINIMENTO, ASESORIA PLATA, BANDA BOX');
}

createPlans();
