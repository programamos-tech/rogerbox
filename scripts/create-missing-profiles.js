#!/usr/bin/env node

/**
 * Script para crear perfiles faltantes para usuarios existentes
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});

async function createMissingProfiles() {
  console.log('🔍 Buscando usuarios sin perfil...');

  // 1. Obtener todos los usuarios
  const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();

  if (usersError) {
    console.error('❌ Error obteniendo usuarios:', usersError);
    return;
  }

  console.log(`📊 Total de usuarios: ${users.length}`);

  // 2. Obtener todos los perfiles
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id');

  if (profilesError) {
    console.error('❌ Error obteniendo perfiles:', profilesError);
    return;
  }

  const profileIds = new Set(profiles.map(p => p.id));
  console.log(`📊 Total de perfiles: ${profiles.length}`);

  // 3. Encontrar usuarios sin perfil
  const usersWithoutProfile = users.filter(user => !profileIds.has(user.id));

  if (usersWithoutProfile.length === 0) {
    console.log('✅ Todos los usuarios tienen perfil');
    return;
  }

  console.log(`⚠️ ${usersWithoutProfile.length} usuarios sin perfil`);

  // 4. Crear perfiles faltantes
  for (const user of usersWithoutProfile) {
    console.log(`📝 Creando perfil para: ${user.email}`);

    const { error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || user.email?.split('@')[0] || 'Usuario',
        membership_status: 'inactive',
      });

    if (insertError) {
      console.error(`❌ Error creando perfil para ${user.email}:`, insertError);
    } else {
      console.log(`✅ Perfil creado para ${user.email}`);
    }
  }

  console.log('🎉 Proceso completado');
}

createMissingProfiles().catch(console.error);
