#!/usr/bin/env node

/**
 * Script para limpiar completamente la base de datos de RogerBox
 * Elimina todos los datos EXCEPTO el usuario administrador rogerbox@programamos.com
 */

require('dotenv').config({ path: '.env.local' })
const fetch = require('node-fetch')

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY
const ADMIN_EMAIL = 'rogerbox@admin.com'

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Error: Faltan variables de entorno SUPABASE_URL o SERVICE_ROLE_KEY')
  process.exit(1)
}

async function executeSQL(sql) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
    },
    body: JSON.stringify({ query: sql })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`SQL Error: ${error}`)
  }

  return response.json()
}

async function cleanDatabase() {
  console.log('🧹 Iniciando limpieza de base de datos...\n')

  try {
    // 1. Obtener el ID del usuario admin
    console.log('📌 Buscando usuario administrador...')
    const { createClient } = require('@supabase/supabase-js')
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    const { data: adminUsers, error: adminError } = await supabase.auth.admin.listUsers()

    if (adminError) {
      console.error('❌ Error obteniendo usuarios:', adminError)
      process.exit(1)
    }

    const adminUser = adminUsers.users.find(u => u.email === ADMIN_EMAIL)

    if (!adminUser) {
      console.error(`❌ No se encontró el usuario ${ADMIN_EMAIL}`)
      console.log('   Usuarios existentes:', adminUsers.users.map(u => u.email))
      process.exit(1)
    }

    const adminId = adminUser.id
    console.log(`✅ Usuario admin encontrado: ${ADMIN_EMAIL} (${adminId})`)

    // 2. Eliminar todos los cursos, lecciones, módulos (en orden correcto por FK)
    console.log('\n📚 Eliminando cursos y contenido relacionado...')

    const { error: lessonsError } = await supabase
      .from('lessons')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all

    const { error: modulesError } = await supabase
      .from('course_modules')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')

    const { error: coursesError } = await supabase
      .from('courses')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')

    console.log('✅ Cursos eliminados')

    // 3. Eliminar categorías
    console.log('\n🏷️  Eliminando categorías...')
    const { error: categoriesError } = await supabase
      .from('categories')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')

    console.log('✅ Categorías eliminadas')

    // 4. Eliminar blogs nutricionales
    console.log('\n📝 Eliminando blogs nutricionales...')
    const { error: blogsError } = await supabase
      .from('nutritional_blogs')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')

    console.log('✅ Blogs eliminados')

    // 5. Eliminar compras, favoritos, y registros de peso
    console.log('\n💰 Eliminando transacciones y datos de usuario...')

    await supabase.from('course_purchases').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('user_favorites').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('weight_records').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('wompi_transactions').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('orders').delete().neq('id', '00000000-0000-0000-0000-000000000000')

    console.log('✅ Transacciones eliminadas')

    // 6. Eliminar todos los perfiles excepto el admin
    console.log('\n👤 Eliminando perfiles de usuarios (excepto admin)...')
    const { error: profilesError } = await supabase
      .from('profiles')
      .delete()
      .neq('id', adminId)

    console.log('✅ Perfiles eliminados')

    // 7. Actualizar perfil del admin con nombre "ROGERBOX"
    console.log('\n✏️  Actualizando perfil de administrador...')
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        name: 'ROGERBOX',
        membership_status: 'admin'
      })
      .eq('id', adminId)

    if (updateError) {
      console.warn('⚠️  Error actualizando perfil admin:', updateError)
    } else {
      console.log('✅ Perfil admin actualizado con nombre "ROGERBOX"')
    }

    // 8. Eliminar todos los usuarios de auth.users excepto el admin
    console.log('\n🔐 Eliminando usuarios de autenticación (excepto admin)...')

    for (const user of adminUsers.users) {
      if (user.id !== adminId) {
        const { error: deleteUserError } = await supabase.auth.admin.deleteUser(user.id)
        if (deleteUserError) {
          console.warn(`⚠️  Error eliminando usuario ${user.email}:`, deleteUserError.message)
        } else {
          console.log(`   ✓ Usuario eliminado: ${user.email}`)
        }
      }
    }

    console.log('\n✅ Base de datos limpiada exitosamente!')
    console.log('\n📊 Estado final:')
    console.log(`   👤 Usuario único: ${ADMIN_EMAIL}`)
    console.log(`   📛 Nombre: ROGERBOX`)
    console.log(`   🔑 Password: admin123`)
    console.log(`   📚 Cursos: 0`)
    console.log(`   🏷️  Categorías: 0`)
    console.log(`   📝 Blogs: 0`)
    console.log('\n🎉 ¡Listo para empezar desde cero!')

  } catch (error) {
    console.error('\n❌ Error durante la limpieza:', error)
    process.exit(1)
  }
}

cleanDatabase()
