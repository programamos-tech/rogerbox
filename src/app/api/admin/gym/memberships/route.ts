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
    if (!client_info_id || !plan_id) {
      return NextResponse.json(
        { error: 'Cliente y plan son requeridos' },
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

    // Calcular fechas de inicio y fin
    let finalStartDate = start_date;
    let finalEndDate = end_date;

    // Buscar membresías activas o programadas del cliente (no canceladas)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { data: existingMemberships, error: existingError } = await supabaseAdmin
      .from('gym_memberships')
      .select('id, end_date, status')
      .eq('client_info_id', client_info_id)
      .neq('status', 'cancelled')
      .order('end_date', { ascending: false });

    if (!existingError && existingMemberships && existingMemberships.length > 0) {
      // Encontrar la membresía con la fecha de fin más lejana (activa o programada)
      const latestMembership = existingMemberships.find((m: any) => {
        const endDate = new Date(m.end_date);
        endDate.setHours(0, 0, 0, 0);
        return endDate >= today; // Solo considerar membresías no vencidas
      });

      if (latestMembership) {
        // Hay una membresía activa o programada, calcular fechas para pago anticipado
        const latestEndDate = new Date(latestMembership.end_date);
        latestEndDate.setHours(0, 0, 0, 0);

        // La nueva membresía empieza el día siguiente al fin de la última
        const newStartDate = new Date(latestEndDate);
        newStartDate.setDate(newStartDate.getDate() + 1);
        finalStartDate = newStartDate.toISOString().split('T')[0];

        // Calcular fecha de fin basada en la duración del plan
        const newEndDate = new Date(newStartDate);
        newEndDate.setDate(newEndDate.getDate() + (plan.duration_days || 30) - 1);
        finalEndDate = newEndDate.toISOString().split('T')[0];
      }
    }

    // Si no hay membresías activas, usar las fechas proporcionadas o calcular desde hoy
    if (!finalStartDate) {
      finalStartDate = today.toISOString().split('T')[0];
    }
    if (!finalEndDate) {
      const endDateCalc = new Date(finalStartDate);
      endDateCalc.setDate(endDateCalc.getDate() + (plan.duration_days || 30) - 1);
      finalEndDate = endDateCalc.toISOString().split('T')[0];
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

    // Indicar si es pago anticipado
    const isAdvancePayment = new Date(finalStartDate) > today;

    return NextResponse.json({ ...data, isAdvancePayment }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/admin/gym/memberships:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
