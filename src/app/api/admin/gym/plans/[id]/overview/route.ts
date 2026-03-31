import { type NextRequest, NextResponse } from 'next/server';
import { parseLocalDate } from '@/lib/dateUtils';
import { supabaseAdmin } from '@/lib/supabase';
import { getUser } from '@/lib/supabase-server';
import {
  getGymAdminToday,
  partitionGymMembershipsLikeOverview,
} from '@/shared/utils/gym-membership-admin.util';

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

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { user } = await getUser();

    if (!isAdminUser(user)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id: planId } = await params;

    const { data: plan, error: planError } = await supabaseAdmin
      .from('gym_plans')
      .select('*')
      .eq('id', planId)
      .single();

    if (planError) {
      if (planError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Plan no encontrado' },
          { status: 404 },
        );
      }
      return NextResponse.json(
        { error: 'Error al obtener plan' },
        { status: 500 },
      );
    }

    const { data: rows, error: memError } = await supabaseAdmin
      .from('gym_memberships')
      .select(
        `
        id,
        user_id,
        client_info_id,
        plan_id,
        start_date,
        end_date,
        status,
        created_at,
        updated_at,
        client_info:gym_client_info (
          id,
          name,
          document_id,
          email,
          whatsapp,
          is_inactive,
          user_id
        )
      `,
      )
      .eq('plan_id', planId)
      .order('end_date', { ascending: false });

    if (memError) {
      return NextResponse.json(
        { error: 'Error al obtener membresías' },
        { status: 500 },
      );
    }

    type ClientRow = {
      id: string;
      name: string;
      document_id: string;
      email?: string | null;
      whatsapp?: string | null;
      is_inactive?: boolean | null;
      user_id?: string | null;
    };

    type MemRow = {
      id: string;
      user_id: string | null;
      client_info_id: string;
      plan_id: string;
      start_date: string;
      end_date: string;
      status: string;
      created_at: string;
      updated_at: string;
      client_info: ClientRow | ClientRow[] | null;
    };

    const raw = (rows || []) as MemRow[];

    const memberships = raw.map((m) => {
      const ci = m.client_info;
      const client_info = Array.isArray(ci) ? ci[0] ?? null : ci;
      return { ...m, client_info };
    });

    const today = getGymAdminToday();
    const {
      cancelled,
      active,
      expired,
    } = partitionGymMembershipsLikeOverview(memberships, today);

    active.sort(
      (a, b) =>
        parseLocalDate(a.end_date).getTime() -
        parseLocalDate(b.end_date).getTime(),
    );
    expired.sort(
      (a, b) =>
        parseLocalDate(b.end_date).getTime() -
        parseLocalDate(a.end_date).getTime(),
    );
    cancelled.sort(
      (a, b) =>
        parseLocalDate(b.end_date).getTime() -
        parseLocalDate(a.end_date).getTime(),
    );

    const inactiveByClient = new Map<
      string,
      {
        client_info: NonNullable<(typeof memberships)[0]['client_info']>;
        last_end_date: string;
        membership_id: string;
      }
    >();

    for (const m of memberships) {
      const c = m.client_info;
      if (!c?.is_inactive) continue;
      const prev = inactiveByClient.get(c.id);
      const endMs = new Date(m.end_date).getTime();
      if (
        !prev ||
        new Date(prev.last_end_date).getTime() < endMs
      ) {
        inactiveByClient.set(c.id, {
          client_info: c,
          last_end_date: m.end_date,
          membership_id: m.id,
        });
      }
    }

    const inactive_clients = Array.from(inactiveByClient.values()).sort(
      (a, b) => a.client_info.name.localeCompare(b.client_info.name, 'es'),
    );

    const uniqueClientIds = new Set(
      memberships.map((m) => m.client_info_id).filter(Boolean),
    );

    return NextResponse.json({
      plan,
      counts: {
        active_now: active.length,
        expired: expired.length,
        cancelled: cancelled.length,
        inactive_marked: inactive_clients.length,
        total_memberships: memberships.length,
        unique_clients_ever: uniqueClientIds.size,
      },
      active_memberships: active,
      expired_memberships: expired,
      cancelled_memberships: cancelled,
      inactive_clients,
    });
  } catch {
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}
