import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase';
import { GymMembershipUpdate } from '@/types/gym';

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

// GET - Obtener una membresía por ID
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
      .from('gym_memberships')
      .select(`
        *,
        client_info:gym_client_info(*),
        plan:gym_plans(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Membresía no encontrada' }, { status: 404 });
      }
      console.error('Error fetching gym membership:', error);
      return NextResponse.json({ error: 'Error al obtener membresía' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in GET /api/admin/gym/memberships/[id]:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// PUT - Actualizar una membresía
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
    const body: GymMembershipUpdate = await request.json();
    const { plan_id, start_date, end_date, status, user_id } = body;

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (plan_id !== undefined) updateData.plan_id = plan_id;
    if (start_date !== undefined) updateData.start_date = start_date;
    if (end_date !== undefined) updateData.end_date = end_date;
    if (status !== undefined) updateData.status = status;
    if (user_id !== undefined) updateData.user_id = user_id || null;

    const { data, error } = await supabaseAdmin
      .from('gym_memberships')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        client_info:gym_client_info(*),
        plan:gym_plans(*)
      `)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Membresía no encontrada' }, { status: 404 });
      }
      console.error('Error updating gym membership:', error);
      return NextResponse.json({ error: 'Error al actualizar membresía' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in PUT /api/admin/gym/memberships/[id]:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// DELETE - Cancelar una membresía
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

    // Cambiar status a 'cancelled' en lugar de eliminar
    const { data, error } = await supabaseAdmin
      .from('gym_memberships')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Membresía no encontrada' }, { status: 404 });
      }
      console.error('Error cancelling gym membership:', error);
      return NextResponse.json({ error: 'Error al cancelar membresía' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Membresía cancelada exitosamente', data });
  } catch (error) {
    console.error('Error in DELETE /api/admin/gym/memberships/[id]:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
