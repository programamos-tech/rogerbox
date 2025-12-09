// Script para crear usuario administrador en RogerBox local
require('dotenv').config({ path: '.env.local' })

async function createAdminUser() {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  const SERVICE_ROLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error('❌ Error: Variables de entorno no encontradas')
    console.error('   Verifica que .env.local tenga NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }

  if (!SUPABASE_URL.includes('127.0.0.1')) {
    console.error('❌ Error: Este script solo funciona en desarrollo local')
    console.error('   NEXT_PUBLIC_SUPABASE_URL debe ser http://127.0.0.1:54321')
    process.exit(1)
  }

  console.log('\n🔐 Creando usuario administrador...\n')

  const adminData = {
    email: 'rogerbox@admin.com',
    password: 'admin123',
    email_confirm: true,
    user_metadata: {
      role: 'admin',
      name: 'RogerBox Admin'
    }
  }

  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify(adminData)
    })

    const result = await response.json()

    if (!response.ok) {
      if (result.msg?.includes('already registered')) {
        console.log('⚠️  El usuario ya existe en la base de datos')
        console.log('   Email: rogerbox@admin.com')
        console.log('   Password: admin123')
        console.log('\n✅ Puedes hacer login con estas credenciales\n')
        return
      }
      throw new Error(result.msg || result.message || 'Error desconocido')
    }

    console.log('✅ Usuario administrador creado exitosamente!\n')
    console.log('📧 Email:', adminData.email)
    console.log('🔑 Password:', adminData.password)
    console.log('👤 Rol: admin')
    console.log('\n🚀 Ya puedes hacer login en http://localhost:3001\n')

  } catch (error) {
    console.error('❌ Error al crear usuario:', error.message)
    console.error('\n💡 Alternativa: Crea el usuario manualmente en Supabase Studio:')
    console.error('   1. Abre http://127.0.0.1:54323')
    console.error('   2. Ve a Authentication > Users > Add User')
    console.error('   3. Email: rogerbox@admin.com')
    console.error('   4. Password: admin123')
    console.error('   5. User Metadata: {"role": "admin"}\n')
    process.exit(1)
  }
}

createAdminUser()
