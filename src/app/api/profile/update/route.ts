import { type NextRequest, NextResponse } from 'next/server';
import { STORE_ID_FISICA } from '@/lib/logs-service';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    // Obtener el token de autorización del header
    const authHeader = request.headers.get('authorization');

    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'No autorizado - falta token' },
        { status: 401 },
      );
    }

    const token = authHeader.replace('Bearer ', '');

    // Verificar el token con supabaseAdmin
    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user?.id) {
      return NextResponse.json(
        { error: 'No autorizado - token inválido' },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { profile } = body;

    if (!profile) {
      return NextResponse.json(
        { error: 'Datos del perfil requeridos' },
        { status: 400 },
      );
    }

    const userId = user.id;
    const userEmail = (user?.email ?? '').trim().toLowerCase();
    let linkedExistingClient = false;
    let cedulaLinkedToAnotherAccount = false;
    let cedulaAssociatedWithOtherEmail = false;

    // Verificar si el perfil existe
    const { data: existingProfile, error: selectError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle();

    if (selectError) {
      return NextResponse.json(
        { error: 'Error al verificar el perfil' },
        { status: 500 },
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
        goals: Array.isArray(profile.goals)
          ? JSON.stringify(profile.goals)
          : profile.goals || '[]',
        updated_at: new Date().toISOString(),
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
        return NextResponse.json(
          { error: error.message || 'Error al actualizar el perfil' },
          { status: 500 },
        );
      }

      result = data;

      // VINCULACIÓN AUTOMÁTICA: Cédula es fuente de verdad. Solo vincular si mismo correo/persona.
      if (profile.document_id) {
        try {
          const { data: gymClient, error: clientError } = await supabaseAdmin
            .from('gym_client_info')
            .select('id, user_id, email')
            .eq('document_id', profile.document_id.trim())
            .maybeSingle();

          if (clientError) {
          } else if (gymClient?.user_id) {
            // Cédula ya vinculada a otra cuenta: no vincular (fuente de verdad)
            cedulaLinkedToAnotherAccount = true;
          } else if (gymClient) {
            const clientEmail = (gymClient.email ?? '').trim().toLowerCase();
            if (clientEmail && userEmail && clientEmail !== userEmail) {
              // Cédula en RogerBox físico con otro correo: no vincular
              cedulaAssociatedWithOtherEmail = true;
            } else {
              const { error: linkError } = await supabaseAdmin
                .from('gym_client_info')
                .update({
                  user_id: userId,
                  updated_at: new Date().toISOString(),
                })
                .eq('id', gymClient.id);

              if (!linkError) {
                linkedExistingClient = true;
                await supabaseAdmin
                  .from('gym_memberships')
                  .update({
                    user_id: userId,
                    updated_at: new Date().toISOString(),
                  })
                  .eq('client_info_id', gymClient.id)
                  .is('user_id', null);
                await supabaseAdmin
                  .from('gym_payments')
                  .update({
                    user_id: userId,
                    updated_at: new Date().toISOString(),
                  })
                  .eq('client_info_id', gymClient.id)
                  .is('user_id', null);
              }
            }
          } else {
            // Cédula nueva: crear cliente en gym_client_info para que aparezca en Clientes (admin)
            const doc = profile.document_id.trim();
            const clientName = (
              profile.name ||
              user?.user_metadata?.name ||
              user?.email?.split('@')[0] ||
              'Usuario'
            ).trim();
            await supabaseAdmin.from('gym_client_info').insert({
              document_id: doc,
              name: clientName,
              email: user?.email?.trim() || null,
              whatsapp: '0000000000',
              user_id: userId,
              store_id: STORE_ID_FISICA,
            });
          }
        } catch (linkError) {}
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
        goals: Array.isArray(profile.goals)
          ? JSON.stringify(profile.goals)
          : profile.goals || '[]',
        membership_status: 'inactive',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
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
        return NextResponse.json(
          { error: error.message || 'Error al crear el perfil' },
          { status: 500 },
        );
      }

      result = data;

      // VINCULACIÓN AUTOMÁTICA: Cédula es fuente de verdad. Solo vincular si mismo correo/persona.
      if (profile.document_id) {
        try {
          const { data: gymClient, error: clientError } = await supabaseAdmin
            .from('gym_client_info')
            .select('id, user_id, email')
            .eq('document_id', profile.document_id.trim())
            .maybeSingle();

          if (clientError) {
          } else if (gymClient?.user_id) {
            cedulaLinkedToAnotherAccount = true;
          } else if (gymClient) {
            const clientEmail = (gymClient.email ?? '').trim().toLowerCase();
            if (clientEmail && userEmail && clientEmail !== userEmail) {
              cedulaAssociatedWithOtherEmail = true;
            } else {
              const { error: linkError } = await supabaseAdmin
                .from('gym_client_info')
                .update({
                  user_id: userId,
                  updated_at: new Date().toISOString(),
                })
                .eq('id', gymClient.id);

              if (!linkError) {
                linkedExistingClient = true;
                await supabaseAdmin
                  .from('gym_memberships')
                  .update({
                    user_id: userId,
                    updated_at: new Date().toISOString(),
                  })
                  .eq('client_info_id', gymClient.id)
                  .is('user_id', null);
                await supabaseAdmin
                  .from('gym_payments')
                  .update({
                    user_id: userId,
                    updated_at: new Date().toISOString(),
                  })
                  .eq('client_info_id', gymClient.id)
                  .is('user_id', null);
              }
            }
          } else {
            // Cédula nueva: crear cliente en gym_client_info para que aparezca en Clientes (admin)
            const doc = profile.document_id.trim();
            const clientName = (
              profile.name ||
              user?.user_metadata?.name ||
              user?.email?.split('@')[0] ||
              'Usuario'
            ).trim();
            await supabaseAdmin.from('gym_client_info').insert({
              document_id: doc,
              name: clientName,
              email: user?.email?.trim() || null,
              whatsapp: '0000000000',
              user_id: userId,
              store_id: STORE_ID_FISICA,
            });
          }
        } catch (linkError) {}
      }
    }

    // Intentar crear registro inicial de peso (opcional, no crítico)
    try {
      const today = new Date().toISOString().split('T')[0];
      await supabaseAdmin.from('weight_records').insert({
        user_id: userId,
        weight: profile.weight,
        record_date: today,
        notes: 'Peso inicial del onboarding',
      });
    } catch (weightError: any) {
      // Error silencioso - no crítico
      if (process.env.NODE_ENV === 'development') {
      }
    }

    return NextResponse.json({
      success: true,
      data: result,
      linkedExistingClient,
      cedulaLinkedToAnotherAccount,
      cedulaAssociatedWithOtherEmail,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error inesperado al actualizar el perfil' },
      { status: 500 },
    );
  }
}
