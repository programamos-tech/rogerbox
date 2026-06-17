import { type NextRequest, NextResponse } from 'next/server';
import {
  getTodayYmdColombia,
  membershipEndDateFromStart,
  parseLocalDate,
} from '@/lib/dateUtils';
import { insertLog, STORE_ID_FISICA } from '@/lib/logs-service';
import { supabaseAdmin } from '@/lib/supabase';
import { getUser } from '@/lib/supabase-server';
import type { GymMembershipInsert } from '@/types/gym';

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

// GET - Listar todas las membresías
export async function GET(request: NextRequest) {
  try {
    const { user } = await getUser();

    if (!isAdminUser(user)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const clientInfoId = searchParams.get('client_info_id');
    const userId = searchParams.get('user_id');
    const planId = searchParams.get('plan_id');

    let query = supabaseAdmin
      .from('gym_memberships')
      .select(`
        *,
        client_info:gym_client_info(*),
        plan:gym_plans(*)
      `)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    if (clientInfoId) {
      query = query.eq('client_info_id', clientInfoId);
    }

    if (planId) {
      query = query.eq('plan_id', planId);
    }

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: 'Error al obtener membresías' },
        { status: 500 },
      );
    }

    return NextResponse.json(data || []);
  } catch (error) {
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}

// POST - Crear nueva membresía
export async function POST(request: NextRequest) {
  try {
    const { user } = await getUser();

    if (!isAdminUser(user)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body: GymMembershipInsert = await request.json();
    const { client_info_id, plan_id, start_date, end_date, status, user_id } =
      body;

    // Validaciones
    if (!client_info_id || !plan_id) {
      return NextResponse.json(
        { error: 'Cliente y plan son requeridos' },
        { status: 400 },
      );
    }

    // Verificar que el cliente existe
    const { data: client, error: clientError } = await supabaseAdmin
      .from('gym_client_info')
      .select('id, user_id')
      .eq('id', client_info_id)
      .single();

    if (clientError || !client) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 },
      );
    }

    // Verificar que el plan existe y está activo
    const { data: plan, error: planError } = await supabaseAdmin
      .from('gym_plans')
      .select('id, duration_days, is_active')
      .eq('id', plan_id)
      .single();

    if (planError || !plan) {
      return NextResponse.json(
        { error: 'Plan no encontrado' },
        { status: 404 },
      );
    }

    if (!plan.is_active) {
      return NextResponse.json(
        { error: 'El plan no está activo' },
        { status: 400 },
      );
    }

    // Usar user_id del cliente si existe, o el proporcionado
    const finalUserId = user_id || client.user_id || null;

    // Respetar las fechas que envía el formulario. El front es quien calcula el
    // período (incluido el pago anticipado, ya confirmado explícitamente por el
    // admin). Solo se calculan valores por defecto si faltan. Fechas locales
    // (Colombia) para evitar desfases por UTC.
    const today = parseLocalDate(getTodayYmdColombia());
    today.setHours(0, 0, 0, 0);

    let finalStartDate = start_date;
    let finalEndDate = end_date;

    if (!finalStartDate) {
      finalStartDate = getTodayYmdColombia();
    }
    if (!finalEndDate) {
      const startLocal = parseLocalDate(finalStartDate);
      finalEndDate = membershipEndDateFromStart(
        startLocal,
        plan.duration_days || 30,
      );
    }

    const { data, error } = await supabaseAdmin
      .from('gym_memberships')
      .insert({
        user_id: finalUserId,
        client_info_id,
        plan_id,
        start_date: finalStartDate,
        end_date: finalEndDate,
        status: status || 'active',
        created_by: user?.id,
        store_id: STORE_ID_FISICA,
      })
      .select(`
        *,
        client_info:gym_client_info(*),
        plan:gym_plans(*)
      `)
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Error al crear membresía' },
        { status: 500 },
      );
    }

    await insertLog({
      user_id: user?.id ?? finalUserId,
      action: 'membership_create',
      module: 'gym',
      details: {
        plan_id,
        client_info_id,
        description: 'Nueva membresía sede física',
      },
      store_id: STORE_ID_FISICA,
    });

    // Indicar si es pago anticipado (inicio futuro), con fecha local
    const startLocalForFlag = parseLocalDate(finalStartDate);
    startLocalForFlag.setHours(0, 0, 0, 0);
    const isAdvancePayment = startLocalForFlag > today;

    return NextResponse.json({ ...data, isAdvancePayment }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}
