import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase';
import { GymMembershipInsert } from '@/types/gym';

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
      console.error('Error fetching gym memberships:', error);
      return NextResponse.json({ error: 'Error al obtener membresías' }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error in GET /api/admin/gym/memberships:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
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
    const { client_info_id, plan_id, start_date, end_date, status, user_id } = body;

    // Validaciones
    if (!client_info_id || !plan_id || !start_date || !end_date) {
      return NextResponse.json(
        { error: 'Cliente, plan, fecha de inicio y fecha de fin son requeridos' },
        { status: 400 }
      );
    }

    // Verificar que el cliente existe
    const { data: client, error: clientError } = await supabaseAdmin
      .from('gym_client_info')
      .select('id, user_id')
      .eq('id', client_info_id)
      .single();

    if (clientError || !client) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
    }

    // Verificar que el plan existe y está activo
    const { data: plan, error: planError } = await supabaseAdmin
      .from('gym_plans')
      .select('id, duration_days, is_active')
      .eq('id', plan_id)
      .single();

    if (planError || !plan) {
      return NextResponse.json({ error: 'Plan no encontrado' }, { status: 404 });
    }

    if (!plan.is_active) {
      return NextResponse.json({ error: 'El plan no está activo' }, { status: 400 });
    }

    // Usar user_id del cliente si existe, o el proporcionado
    const finalUserId = user_id || client.user_id || null;

    const { data, error } = await supabaseAdmin
      .from('gym_memberships')
      .insert({
        user_id: finalUserId,
        client_info_id,
        plan_id,
        start_date,
        end_date,
        status: status || 'active',
        created_by: user?.id,
      })
      .select(`
        *,
        client_info:gym_client_info(*),
        plan:gym_plans(*)
      `)
      .single();

    if (error) {
      console.error('Error creating gym membership:', error);
      return NextResponse.json({ error: 'Error al crear membresía' }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/admin/gym/memberships:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
