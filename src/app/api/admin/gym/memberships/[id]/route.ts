import { type NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getUser } from '@/lib/supabase-server';
import type { GymMembershipUpdate } from '@/types/gym';

function normalizeEmail(val?: string | null) {
  return (val || '').trim().toLowerCase();
}

function isAdminUser(
  user: { id?: string; email?: string; user_metadata?: any } | null,
) {
  if (!user) return false;
  const envId = (process.env.NEXT_PUBLIC_ADMIN_USER_ID || '').trim();
  const envEmail = normalizeEmail(
    process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'rogerbox@admin.com',
  );
  const matchId = !!envId && user.id === envId;
  const matchEmail = normalizeEmail(user.email) === envEmail;
  const matchRole = user.user_metadata?.role === 'admin';
  return Boolean(matchId || matchEmail || matchRole);
}

// GET - Obtener una membresía por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
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
        return NextResponse.json(
          { error: 'Membresía no encontrada' },
          { status: 404 },
        );
      }
      return NextResponse.json(
        { error: 'Error al obtener membresía' },
        { status: 500 },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}

// PUT - Actualizar una membresía
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { user } = await getUser();

    if (!isAdminUser(user)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;
    const body: GymMembershipUpdate = await request.json();
    const { plan_id, start_date, end_date, status, user_id } = body;

    // Asegurar que YYYY-MM-DD se guarde como mediodía UTC para no cambiar de día en zonas detrás de UTC
    const toNoonUTC = (d: string) => {
      if (!d || d.length < 10) return d;
      const dateOnly = d.slice(0, 10);
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateOnly))
        return `${dateOnly}T12:00:00.000Z`;
      return d;
    };

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    // Si se actualiza la fecha de inicio, recalcular la fecha de vencimiento según la duración del plan
    if (start_date !== undefined) {
      const startDateStr = String(start_date).slice(0, 10);
      if (/^\d{4}-\d{2}-\d{2}$/.test(startDateStr)) {
        const { data: current } = await supabaseAdmin
          .from('gym_memberships')
          .select('plan_id')
          .eq('id', id)
          .single();
        const planIdToUse = plan_id ?? current?.plan_id;
        if (planIdToUse) {
          const { data: plan } = await supabaseAdmin
            .from('gym_plans')
            .select('duration_days')
            .eq('id', planIdToUse)
            .single();
          const durationDays = plan?.duration_days ?? 30;
          const [y, m, d] = startDateStr.split('-').map(Number);
          const endDateLocal = new Date(y, m - 1, d);
          endDateLocal.setDate(endDateLocal.getDate() + durationDays - 1);
          const endDateStr = `${endDateLocal.getFullYear()}-${String(endDateLocal.getMonth() + 1).padStart(2, '0')}-${String(endDateLocal.getDate()).padStart(2, '0')}`;
          updateData.start_date = toNoonUTC(startDateStr);
          updateData.end_date = toNoonUTC(endDateStr);
        } else {
          updateData.start_date = toNoonUTC(startDateStr);
        }
      } else {
        updateData.start_date = toNoonUTC(String(start_date));
      }
    }

    if (plan_id !== undefined) updateData.plan_id = plan_id;
    if (end_date !== undefined && start_date === undefined)
      updateData.end_date = toNoonUTC(String(end_date));
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
        return NextResponse.json(
          { error: 'Membresía no encontrada' },
          { status: 404 },
        );
      }
      return NextResponse.json(
        { error: 'Error al actualizar membresía' },
        { status: 500 },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}

// DELETE - Cancelar una membresía
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
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
        return NextResponse.json(
          { error: 'Membresía no encontrada' },
          { status: 404 },
        );
      }
      return NextResponse.json(
        { error: 'Error al cancelar membresía' },
        { status: 500 },
      );
    }

    return NextResponse.json({
      message: 'Membresía cancelada exitosamente',
      data,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}
