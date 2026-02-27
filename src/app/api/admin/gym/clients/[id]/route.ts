import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase';
import { GymClientInfoUpdate } from '@/types/gym';

function normalizeEmail(val?: string | null) {
  return (val || '').trim().toLowerCase();
}

function isAdminUser(user: { id?: string; email?: string; user_metadata?: any } | null) {
  if (!user) return false;
  const envId = (process.env.NEXT_PUBLIC_ADMIN_USER_ID || '').trim();
  const envEmail = normalizeEmail(process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'rogerbox@admin.com');
  const matchId = !!envId && user.id === envId;
  const matchEmail = normalizeEmail(user.email) === envEmail;
  const matchRole = user.user_metadata?.role === 'admin';
  return Boolean(matchId || matchEmail || matchRole);
}

// GET - Obtener un cliente por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await getUser();
    
    if (!isAdminUser(user)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;

    const { data, error } = await supabaseAdmin
      .from('gym_client_info')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
      }
      console.error('Error fetching gym client:', error);
      return NextResponse.json({ error: 'Error al obtener cliente' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in GET /api/admin/gym/clients/[id]:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// PUT - Actualizar un cliente
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await getUser();
    
    if (!isAdminUser(user)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;
    const body: GymClientInfoUpdate = await request.json();
    const { name, email, whatsapp, birth_date, weight, medical_restrictions, user_id } = body;

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (name !== undefined) updateData.name = name.trim();
    if (email !== undefined) updateData.email = email?.trim() || null;
    if (whatsapp !== undefined) updateData.whatsapp = whatsapp.trim();
    if (birth_date !== undefined) updateData.birth_date = birth_date || null;
    if (weight !== undefined) updateData.weight = weight || null;
    if (medical_restrictions !== undefined) updateData.medical_restrictions = medical_restrictions?.trim() || null;
    if (user_id !== undefined) updateData.user_id = user_id || null;

    const { data, error } = await supabaseAdmin
      .from('gym_client_info')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
      }
      console.error('Error updating gym client:', error);
      return NextResponse.json({ error: 'Error al actualizar cliente' }, { status: 500 });
    }

    // Si se vinculó un user_id, actualizar también las membresías y pagos relacionados
    if (user_id && data) {
      await supabaseAdmin
        .from('gym_memberships')
        .update({ user_id })
        .eq('client_info_id', id)
        .is('user_id', null);

      await supabaseAdmin
        .from('gym_payments')
        .update({ user_id })
        .eq('client_info_id', id)
        .is('user_id', null);
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in PUT /api/admin/gym/clients/[id]:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// DELETE - Eliminar un cliente (solo si no tiene membresías activas)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await getUser();
    
    if (!isAdminUser(user)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;

    // Verificar si hay membresías activas
    const { data: activeMemberships, error: checkError } = await supabaseAdmin
      .from('gym_memberships')
      .select('id')
      .eq('client_info_id', id)
      .eq('status', 'active')
      .limit(1);

    if (checkError) {
      console.error('Error checking memberships:', checkError);
      return NextResponse.json({ error: 'Error al verificar membresías' }, { status: 500 });
    }

    if (activeMemberships && activeMemberships.length > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar un cliente con membresías activas' },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from('gym_client_info')
      .delete()
      .eq('id', id);

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
      }
      console.error('Error deleting gym client:', error);
      return NextResponse.json({ error: 'Error al eliminar cliente' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Cliente eliminado exitosamente' });
  } catch (error) {
    console.error('Error in DELETE /api/admin/gym/clients/[id]:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
