#!/usr/bin/env node

/**
 * Script para verificar las categorías de cursos
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function checkCategories() {
  console.log('🔍 Verificando categorías de cursos...\n')

  try {
    const { data: categories, error, count } = await supabase
      .from('course_categories')
      .select('*', { count: 'exact' })
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('❌ Error obteniendo categorías:', error)
      process.exit(1)
    }

    console.log(`📊 Total de categorías: ${count}\n`)

    if (categories && categories.length > 0) {
      console.log('✅ Categorías creadas:\n')
      categories.forEach(cat => {
        console.log(`   ${cat.sort_order}. ${cat.name}`)
        console.log(`      📝 ${cat.description}`)
        console.log(`      🎨 Icono: ${cat.icon}, Color: ${cat.color}`)
        console.log(`      🔧 Activa: ${cat.is_active ? 'Sí' : 'No'}`)
        console.log('')
      })
    } else {
      console.log('⚠️  No se encontraron categorías')
    }

  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

checkCategories()
