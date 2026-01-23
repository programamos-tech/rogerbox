import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase';
import { GymPlanUpdate } from '@/types/gym';

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

// GET - Obtener un plan por ID
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
      .from('gym_plans')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Plan no encontrado' }, { status: 404 });
      }
      console.error('Error fetching gym plan:', error);
      return NextResponse.json({ error: 'Error al obtener plan' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in GET /api/admin/gym/plans/[id]:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// PUT - Actualizar un plan
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
    const body: GymPlanUpdate = await request.json();
    const { name, description, price, duration_days, is_active } = body;

    // Validaciones
    if (price !== undefined && price <= 0) {
      return NextResponse.json(
        { error: 'El precio debe ser mayor a 0' },
        { status: 400 }
      );
    }

    if (duration_days !== undefined && duration_days <= 0) {
      return NextResponse.json(
        { error: 'La duración debe ser mayor a 0 días' },
        { status: 400 }
      );
    }

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (price !== undefined) updateData.price = price;
    if (duration_days !== undefined) updateData.duration_days = duration_days;
    if (is_active !== undefined) updateData.is_active = is_active;

    const { data, error } = await supabaseAdmin
      .from('gym_plans')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Plan no encontrado' }, { status: 404 });
      }
      console.error('Error updating gym plan:', error);
      return NextResponse.json({ error: 'Error al actualizar plan' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in PUT /api/admin/gym/plans/[id]:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// DELETE - Eliminar un plan (soft delete: desactivar)
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

    // Verificar si hay membresías activas usando este plan
    const { data: activeMemberships, error: checkError } = await supabaseAdmin
      .from('gym_memberships')
      .select('id')
      .eq('plan_id', id)
      .eq('status', 'active')
      .limit(1);

    if (checkError) {
      console.error('Error checking memberships:', checkError);
      return NextResponse.json({ error: 'Error al verificar membresías' }, { status: 500 });
    }

    if (activeMemberships && activeMemberships.length > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar un plan con membresías activas. Desactívalo en su lugar.' },
        { status: 400 }
      );
    }

    // Soft delete: desactivar el plan
    const { data, error } = await supabaseAdmin
      .from('gym_plans')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Plan no encontrado' }, { status: 404 });
      }
      console.error('Error deleting gym plan:', error);
      return NextResponse.json({ error: 'Error al eliminar plan' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Plan desactivado exitosamente', data });
  } catch (error) {
    console.error('Error in DELETE /api/admin/gym/plans/[id]:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
