#!/usr/bin/env node

/**
 * Script para verificar el estado de la base de datos de RogerBox
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

async function verifyDatabase() {
  console.log('🔍 Verificando estado de la base de datos...\n')

  try {
    // Verificar usuarios
    const { data: adminUsers } = await supabase.auth.admin.listUsers()
    console.log(`👤 Total de usuarios: ${adminUsers.users.length}`)
    adminUsers.users.forEach(user => {
      console.log(`   - ${user.email} (ID: ${user.id})`)
    })

    // Verificar perfiles
    const { data: profiles, count: profilesCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact' })

    console.log(`\n📋 Total de perfiles: ${profilesCount}`)
    if (profiles && profiles.length > 0) {
      profiles.forEach(profile => {
        console.log(`   - ${profile.name || 'Sin nombre'} (${profile.email}) - Status: ${profile.membership_status}`)
      })
    }

    // Verificar cursos
    const { count: coursesCount } = await supabase
      .from('courses')
      .select('*', { count: 'exact', head: true })

    console.log(`\n📚 Total de cursos: ${coursesCount || 0}`)

    // Verificar categorías
    const { count: categoriesCount } = await supabase
      .from('categories')
      .select('*', { count: 'exact', head: true })

    console.log(`🏷️  Total de categorías: ${categoriesCount || 0}`)

    // Verificar blogs
    const { count: blogsCount } = await supabase
      .from('nutritional_blogs')
      .select('*', { count: 'exact', head: true })

    console.log(`📝 Total de blogs: ${blogsCount || 0}`)

    // Verificar compras
    const { count: purchasesCount } = await supabase
      .from('course_purchases')
      .select('*', { count: 'exact', head: true })

    console.log(`💰 Total de compras: ${purchasesCount || 0}`)

    console.log('\n✅ Verificación completada')

  } catch (error) {
    console.error('❌ Error durante la verificación:', error)
  }
}

verifyDatabase()
