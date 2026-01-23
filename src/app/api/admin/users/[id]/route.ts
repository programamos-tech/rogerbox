import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getSession } from '@/lib/supabase-server';

// GET - Obtener un usuario específico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session } = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;

    // Intentar obtener desde profiles
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (!profileError && profile) {
      return NextResponse.json({ user: profile, source: 'profile' });
    }

    // Si no está en profiles, buscar en gym_client_info
    const { data: client, error: clientError } = await supabaseAdmin
      .from('gym_client_info')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (!clientError && client) {
      return NextResponse.json({ user: client, source: 'gym_client_info' });
    }

    return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
  } catch (error: any) {
    console.error('Error in GET user:', error);
    return NextResponse.json(
      { error: 'Error al obtener usuario', details: error.message },
      { status: 500 }
    );
  }
}

// PUT - Actualizar un usuario
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session } = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Determinar si es un usuario registrado (profiles) o cliente físico (gym_client_info)
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('id', id)
      .maybeSingle();

    if (profile) {
      // Actualizar perfil de usuario registrado
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      if (body.name !== undefined) {
        updateData.name = body.name.trim();
        updateData.full_name = body.name.trim(); // Compatibilidad
      }
      if (body.email !== undefined) updateData.email = body.email?.trim() || null;
      if (body.phone !== undefined) updateData.phone = body.phone?.trim() || null;
      if (body.height !== undefined) updateData.height = body.height || null;
      if (body.weight !== undefined) updateData.weight = body.weight || null;
      if (body.current_weight !== undefined) updateData.current_weight = body.current_weight || null;
      if (body.gender !== undefined) updateData.gender = body.gender || null;
      if (body.target_weight !== undefined) updateData.target_weight = body.target_weight || null;
      if (body.goals !== undefined) {
        updateData.goals = Array.isArray(body.goals) 
          ? JSON.stringify(body.goals) 
          : (body.goals || '[]');
      }
      if (body.document_id !== undefined) updateData.document_id = body.document_id?.trim() || null;
      if (body.document_type !== undefined) updateData.document_type = body.document_type || null;
      if (body.address !== undefined) updateData.address = body.address?.trim() || null;
      if (body.city !== undefined) updateData.city = body.city?.trim() || null;
      if (body.birth_year !== undefined) updateData.birth_year = body.birth_year || null;

      const { data, error } = await supabaseAdmin
        .from('profiles')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating profile:', error);
        return NextResponse.json({ error: 'Error al actualizar usuario' }, { status: 500 });
      }

      // Si se actualizó document_id, intentar vincular con cliente físico
      if (body.document_id && data) {
        const { data: clientInfo } = await supabaseAdmin
          .from('gym_client_info')
          .select('id')
          .eq('document_id', body.document_id)
          .is('user_id', null)
          .maybeSingle();

        if (clientInfo) {
          await supabaseAdmin
            .from('gym_client_info')
            .update({ user_id: id })
            .eq('id', clientInfo.id);

          await supabaseAdmin
            .from('gym_memberships')
            .update({ user_id: id })
            .eq('client_info_id', clientInfo.id)
            .is('user_id', null);

          await supabaseAdmin
            .from('gym_payments')
            .update({ user_id: id })
            .eq('client_info_id', clientInfo.id)
            .is('user_id', null);
        }
      }

      return NextResponse.json(data);
    } else {
      // Actualizar cliente físico
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      if (body.name !== undefined) updateData.name = body.name.trim();
      if (body.email !== undefined) updateData.email = body.email?.trim() || null;
      if (body.whatsapp !== undefined) updateData.whatsapp = body.whatsapp.trim();
      if (body.birth_date !== undefined) updateData.birth_date = body.birth_date || null;
      if (body.weight !== undefined) updateData.weight = body.weight || null;
      if (body.medical_restrictions !== undefined) updateData.medical_restrictions = body.medical_restrictions?.trim() || null;

      const { data, error } = await supabaseAdmin
        .from('gym_client_info')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating gym client:', error);
        return NextResponse.json({ error: 'Error al actualizar cliente' }, { status: 500 });
      }

      return NextResponse.json(data);
    }
  } catch (error: any) {
    console.error('Error in PUT user:', error);
    return NextResponse.json(
      { error: 'Error al actualizar usuario', details: error.message },
      { status: 500 }
    );
  }
}
