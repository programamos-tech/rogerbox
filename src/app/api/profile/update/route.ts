import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    // Obtener el token de autorización del header
    const authHeader = request.headers.get('authorization');
    
    console.log('=== DEBUG API PROFILE UPDATE ===');
    console.log('Auth header:', authHeader ? 'present' : 'missing');
    
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('No authorization header found');
      return NextResponse.json(
        { error: 'No autorizado - falta token' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verificar el token con supabaseAdmin
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    console.log('User from token:', user ? user.id : 'null');
    console.log('User error:', userError);
    console.log('================================');
    
    if (userError || !user?.id) {
      console.error('Invalid token or user not found:', userError);
      return NextResponse.json(
        { error: 'No autorizado - token inválido' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { profile } = body;

    if (!profile) {
      return NextResponse.json(
        { error: 'Datos del perfil requeridos' },
        { status: 400 }
      );
    }

    const userId = user.id;
    console.log('Processing profile update for user:', userId);

    // Verificar si el perfil existe
    const { data: existingProfile, error: selectError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle();

    if (selectError) {
      console.error('Error verificando perfil existente:', selectError);
      return NextResponse.json(
        { error: 'Error al verificar el perfil' },
        { status: 500 }
      );
    }

    let result;
    if (existingProfile) {
      // Actualizar perfil existente
      const updateData: any = {
        name: profile.name || 'Usuario',
        full_name: profile.name || 'Usuario', // También actualizar full_name para compatibilidad
        height: profile.height,
        weight: profile.weight,
        gender: profile.gender,
        // Convertir goals array a JSON string si es necesario
        goals: Array.isArray(profile.goals) ? JSON.stringify(profile.goals) : (profile.goals || '[]'),
        updated_at: new Date().toISOString()
      };

      // Solo agregar campos si existen y están definidos en la tabla
      if (profile.targetWeight) {
        updateData.target_weight = profile.targetWeight;
      }

      // Agregar document_id si está presente
      if (profile.document_id) {
        updateData.document_id = profile.document_id;
      }
      if (profile.document_type) {
        updateData.document_type = profile.document_type;
      }

      const { data, error } = await supabaseAdmin
        .from('profiles')
        .update(updateData)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error actualizando perfil:', error);
        return NextResponse.json(
          { error: error.message || 'Error al actualizar el perfil' },
          { status: 500 }
        );
      }

      result = data;

      // VINCULACIÓN AUTOMÁTICA: Si se actualizó document_id, buscar cliente físico y vincular
      if (profile.document_id) {
        try {
          console.log('🔗 Buscando cliente físico con cédula:', profile.document_id);
          
          // Buscar cliente físico por cédula
          const { data: gymClient, error: clientError } = await supabaseAdmin
            .from('gym_client_info')
            .select('id, user_id')
            .eq('document_id', profile.document_id.trim())
            .maybeSingle();

          if (clientError) {
            console.error('Error buscando cliente físico:', clientError);
          } else if (gymClient && !gymClient.user_id) {
            // Cliente físico encontrado y no está vinculado
            console.log('✅ Cliente físico encontrado, vinculando...');
            
            // Vincular user_id en gym_client_info
            const { error: linkError } = await supabaseAdmin
              .from('gym_client_info')
              .update({ user_id: userId, updated_at: new Date().toISOString() })
              .eq('id', gymClient.id);

            if (linkError) {
              console.error('Error vinculando cliente físico:', linkError);
            } else {
              console.log('✅ Cliente físico vinculado exitosamente');
              
              // Actualizar user_id en membresías relacionadas
              await supabaseAdmin
                .from('gym_memberships')
                .update({ user_id: userId, updated_at: new Date().toISOString() })
                .eq('client_info_id', gymClient.id)
                .is('user_id', null);

              // Actualizar user_id en pagos relacionados
              await supabaseAdmin
                .from('gym_payments')
                .update({ user_id: userId, updated_at: new Date().toISOString() })
                .eq('client_info_id', gymClient.id)
                .is('user_id', null);

              console.log('✅ Membresías y pagos actualizados');
            }
          } else if (gymClient && gymClient.user_id) {
            console.log('ℹ️ Cliente físico ya está vinculado a otro usuario');
          } else {
            console.log('ℹ️ No se encontró cliente físico con esa cédula');
          }
        } catch (linkError) {
          // Error no crítico - solo loguear
          console.warn('⚠️ Error en vinculación automática (no crítico):', linkError);
        }
      }
    } else {
      // Crear nuevo perfil
      const insertData: any = {
        id: userId,
        name: profile.name || 'Usuario',
        full_name: profile.name || 'Usuario', // También guardar en full_name para compatibilidad
        email: user?.email || profile.email,
        height: profile.height,
        weight: profile.weight,
        gender: profile.gender,
        // Convertir goals array a JSON string si es necesario
        goals: Array.isArray(profile.goals) ? JSON.stringify(profile.goals) : (profile.goals || '[]'),
        membership_status: 'inactive',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Solo agregar campos si existen y están definidos en la tabla
      if (profile.targetWeight) {
        insertData.target_weight = profile.targetWeight;
      }
      if (profile.document_id) {
        insertData.document_id = profile.document_id;
      }
      if (profile.document_type) {
        insertData.document_type = profile.document_type;
      }

      const { data, error } = await supabaseAdmin
        .from('profiles')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('Error creando perfil:', error);
        return NextResponse.json(
          { error: error.message || 'Error al crear el perfil' },
          { status: 500 }
        );
      }

      result = data;

      // VINCULACIÓN AUTOMÁTICA: Si se creó perfil con document_id, buscar cliente físico y vincular
      if (profile.document_id) {
        try {
          console.log('🔗 Buscando cliente físico con cédula:', profile.document_id);
          
          // Buscar cliente físico por cédula
          const { data: gymClient, error: clientError } = await supabaseAdmin
            .from('gym_client_info')
            .select('id, user_id')
            .eq('document_id', profile.document_id.trim())
            .maybeSingle();

          if (clientError) {
            console.error('Error buscando cliente físico:', clientError);
          } else if (gymClient && !gymClient.user_id) {
            // Cliente físico encontrado y no está vinculado
            console.log('✅ Cliente físico encontrado, vinculando...');
            
            // Vincular user_id en gym_client_info
            const { error: linkError } = await supabaseAdmin
              .from('gym_client_info')
              .update({ user_id: userId, updated_at: new Date().toISOString() })
              .eq('id', gymClient.id);

            if (linkError) {
              console.error('Error vinculando cliente físico:', linkError);
            } else {
              console.log('✅ Cliente físico vinculado exitosamente');
              
              // Actualizar user_id en membresías relacionadas
              await supabaseAdmin
                .from('gym_memberships')
                .update({ user_id: userId, updated_at: new Date().toISOString() })
                .eq('client_info_id', gymClient.id)
                .is('user_id', null);

              // Actualizar user_id en pagos relacionados
              await supabaseAdmin
                .from('gym_payments')
                .update({ user_id: userId, updated_at: new Date().toISOString() })
                .eq('client_info_id', gymClient.id)
                .is('user_id', null);

              console.log('✅ Membresías y pagos actualizados');
            }
          } else if (gymClient && gymClient.user_id) {
            console.log('ℹ️ Cliente físico ya está vinculado a otro usuario');
          } else {
            console.log('ℹ️ No se encontró cliente físico con esa cédula');
          }
        } catch (linkError) {
          // Error no crítico - solo loguear
          console.warn('⚠️ Error en vinculación automática (no crítico):', linkError);
        }
      }
    }

    // Intentar crear registro inicial de peso (opcional, no crítico)
    try {
      const today = new Date().toISOString().split('T')[0];
      await supabaseAdmin
        .from('weight_records')
        .insert({
          user_id: userId,
          weight: profile.weight,
          record_date: today,
          notes: 'Peso inicial del onboarding'
        });
    } catch (weightError: any) {
      // Error silencioso - no crítico
      if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️ Error al guardar registro de peso (no crítico):', weightError?.message);
      }
    }

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('❌ Error inesperado actualizando perfil:', error);
    return NextResponse.json(
      { error: 'Error inesperado al actualizar el perfil' },
      { status: 500 }
    );
  }
}

