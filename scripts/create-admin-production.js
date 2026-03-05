// Script para crear usuario administrador en Supabase PRODUCCIÓN
require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

async function createAdminUser() {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SERVICE_ROLE_KEY =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error('❌ Error: Variables de entorno no encontradas');
    console.error('   Verifica que tengas configurado:');
    console.error('   - NEXT_PUBLIC_SUPABASE_URL');
    console.error('   - SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  // Verificar que no sea localhost
  if (
    SUPABASE_URL.includes('127.0.0.1') ||
    SUPABASE_URL.includes('localhost')
  ) {
    console.error('❌ Error: Este script es para PRODUCCIÓN');
    console.error(
      '   Para desarrollo local, usa: node scripts/create-admin.js',
    );
    process.exit(1);
  }

  console.log('\n🔐 Creando usuario administrador en PRODUCCIÓN...\n');
  console.log('📍 Supabase URL:', SUPABASE_URL);

  const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const adminData = {
    email: 'rogerbox@admin.com',
    password: 'Admin123!@#', // Password más seguro para producción
    email_confirm: true,
    user_metadata: {
      role: 'admin',
      name: 'RogerBox Admin',
    },
  };

  try {
    // Crear usuario usando el cliente de Supabase
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: adminData.email,
      password: adminData.password,
      email_confirm: true,
      user_metadata: adminData.user_metadata,
    });

    if (error) {
      if (
        error.message?.includes('already registered') ||
        error.message?.includes('already exists')
      ) {
        console.log('⚠️  El usuario ya existe en la base de datos');
        console.log('\n📋 Para obtener el User ID:');
        console.log('   1. Ve a Supabase Dashboard → Authentication → Users');
        console.log('   2. Busca el usuario con email: rogerbox@admin.com');
        console.log(
          '   3. Copia el "User UID" (ese es tu NEXT_PUBLIC_ADMIN_USER_ID)',
        );
        console.log('\n📧 Email:', adminData.email);
        console.log('🔑 Password:', adminData.password);
        console.log(
          '\n✅ Usa este User UID como NEXT_PUBLIC_ADMIN_USER_ID en Vercel\n',
        );

        // Intentar obtener el ID del usuario existente
        const { data: users } = await supabaseAdmin.auth.admin.listUsers();
        const adminUser = users?.users?.find(
          (u) => u.email === adminData.email,
        );
        if (adminUser) {
          console.log('🆔 User ID encontrado:', adminUser.id);
          console.log('\n✅ Agrega esto a Vercel:');
          console.log(`   NEXT_PUBLIC_ADMIN_USER_ID=${adminUser.id}\n`);
        }
        return;
      }
      throw error;
    }

    if (data?.user) {
      console.log('✅ Usuario administrador creado exitosamente!\n');
      console.log('📧 Email:', adminData.email);
      console.log('🔑 Password:', adminData.password);
      console.log('👤 Rol: admin');
      console.log('🆔 User ID:', data.user.id);
      console.log('\n✅ Agrega esto a Vercel:');
      console.log(`   NEXT_PUBLIC_ADMIN_USER_ID=${data.user.id}\n`);
      console.log('🚀 Ya puedes hacer login en tu aplicación de producción\n');
    } else {
      throw new Error('No se recibió información del usuario creado');
    }
  } catch (error) {
    console.error('❌ Error al crear usuario:', error.message);
    console.error(
      '\n💡 Alternativa: Crea el usuario manualmente en Supabase Dashboard:',
    );
    console.error('   1. Ve a https://app.supabase.com');
    console.error('   2. Selecciona tu proyecto');
    console.error('   3. Ve a Authentication > Users > Add User');
    console.error('   4. Email: rogerbox@admin.com');
    console.error('   5. Password: Admin123!@#');
    console.error(
      '   6. User Metadata: {"role": "admin", "name": "RogerBox Admin"}',
    );
    console.error('   7. Marca "Auto Confirm User"');
    console.error(
      '   8. Copia el "User UID" y úsalo como NEXT_PUBLIC_ADMIN_USER_ID\n',
    );
    process.exit(1);
  }
}

createAdminUser();
