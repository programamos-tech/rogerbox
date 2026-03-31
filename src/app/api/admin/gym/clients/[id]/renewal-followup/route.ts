import { type NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getUser } from '@/lib/supabase-server';

function normalizeEmail(val?: string | null) {
  return (val || '').trim().toLowerCase();
}

function isAdminUser(
  user: {
    id?: string;
    email?: string;
    user_metadata?: Record<string, unknown>;
  } | null,
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

/** PATCH — Marcar o desmarcar seguimiento de renovación descartado para un plan concreto del cliente. */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { user } = await getUser();

    if (!isAdminUser(user)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const dismissed = body?.renewal_followup_dismissed;
    const planId =
      typeof body?.plan_id === 'string' ? body.plan_id.trim() : '';

    if (typeof dismissed !== 'boolean') {
      return NextResponse.json(
        { error: 'renewal_followup_dismissed debe ser un booleano' },
        { status: 400 },
      );
    }

    if (!planId) {
      return NextResponse.json(
        { error: 'plan_id es obligatorio' },
        { status: 400 },
      );
    }

    const { data: clientRow, error: clientErr } = await supabaseAdmin
      .from('gym_client_info')
      .select('id')
      .eq('id', id)
      .maybeSingle();

    if (clientErr || !clientRow) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 },
      );
    }

    if (dismissed) {
      const { error: upsertErr } = await supabaseAdmin
        .from('gym_renewal_followup_dismissals')
        .upsert(
          {
            client_info_id: id,
            plan_id: planId,
            dismissed_at: new Date().toISOString(),
          },
          { onConflict: 'client_info_id,plan_id' },
        );

      if (upsertErr) {
        return NextResponse.json(
          { error: 'Error al guardar seguimiento de renovación' },
          { status: 500 },
        );
      }
    } else {
      const { error: delErr } = await supabaseAdmin
        .from('gym_renewal_followup_dismissals')
        .delete()
        .eq('client_info_id', id)
        .eq('plan_id', planId);

      if (delErr) {
        return NextResponse.json(
          { error: 'Error al actualizar seguimiento de renovación' },
          { status: 500 },
        );
      }
    }

    await supabaseAdmin
      .from('gym_client_info')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', id);

    const { data: rows } = await supabaseAdmin
      .from('gym_renewal_followup_dismissals')
      .select('plan_id')
      .eq('client_info_id', id);

    return NextResponse.json({
      renewal_followup_dismissed_plan_ids: (rows || []).map((r) => r.plan_id),
    });
  } catch (_error) {
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}
