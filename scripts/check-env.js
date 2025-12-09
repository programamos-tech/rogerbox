// Script para verificar a qué base de datos estás apuntando - RogerBox
require('dotenv').config({ path: '.env.local' })

console.log('\n🔍 VERIFICACIÓN DE CONFIGURACIÓN - ROGERBOX\n')
console.log('================================')
console.log('📍 URL de Supabase:', process.env.NEXT_PUBLIC_SUPABASE_URL)
console.log('🔑 Anon Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 30) + '...')
console.log('================================\n')

if (process.env.NEXT_PUBLIC_SUPABASE_URL === 'http://127.0.0.1:54321') {
  console.log('✅ ESTÁS APUNTANDO A LOCAL (Docker)')
  console.log('   Los cambios NO afectarán producción\n')
} else if (process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('vzearvitzpwzscxhqfut')) {
  console.log('🚨 ESTÁS APUNTANDO A PRODUCCIÓN')
  console.log('   ¡CUIDADO! Los cambios afectarán usuarios reales\n')
} else {
  console.log('❓ URL desconocida\n')
}
