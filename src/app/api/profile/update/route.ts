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

