import { type NextRequest, NextResponse } from 'next/server';
import { getTodayYmdColombia, parseLocalDate } from '@/lib/dateUtils';
import { insertLog, STORE_ID_FISICA } from '@/lib/logs-service';
import { supabaseAdmin } from '@/lib/supabase';
import { getUser } from '@/lib/supabase-server';

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

// GET - membresías futuras (Próximo) con factura, pendientes de revisar
// Opcional: ?client_info_id= para el detalle de un cliente
export async function GET(request: NextRequest) {
  try {
    const { user } = await getUser();
    if (!isAdminUser(user)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const today = getTodayYmdColombia();
    const clientInfoId = (
      request.nextUrl.searchParams.get('client_info_id') || ''
    ).trim();

    let query = supabaseAdmin
      .from('gym_memberships')
      .select(
        `
        id,
        client_info_id,
        plan_id,
        start_date,
        end_date,
        status,
        client_info:gym_client_info ( id, name, document_id ),
        plan:gym_plans ( id, name ),
        payments:gym_payments (
          id,
          amount,
          credit_applied,
          invoice_number,
          payment_date,
          status
        )
      `,
      )
      .gt('start_date', today)
      .in('status', ['active', 'courtesy'])
      .order('start_date', { ascending: true });

    if (clientInfoId) {
      query = query.eq('client_info_id', clientInfoId);
    }

    const { data: rows, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: 'Error al listar anticipos' },
        { status: 500 },
      );
    }

    const items = (rows || []).map((m: any) => {
      const client = Array.isArray(m.client_info)
        ? m.client_info[0]
        : m.client_info;
      const plan = Array.isArray(m.plan) ? m.plan[0] : m.plan;
      const payments = Array.isArray(m.payments) ? m.payments : [];
      const activePayment =
        payments.find((p: any) => p.status !== 'voided') || payments[0] || null;

      return {
        membership_id: m.id,
        client_info_id: m.client_info_id,
        client_name: client?.name || 'Sin nombre',
        document_id: client?.document_id || '',
        plan_id: m.plan_id,
        plan_name: plan?.name || 'Plan',
        start_date: String(m.start_date).slice(0, 10),
        end_date: String(m.end_date).slice(0, 10),
        payment_id: activePayment?.id || null,
        payment_amount: activePayment
          ? Number(activePayment.amount || 0) +
            Number(activePayment.credit_applied || 0)
          : null,
        invoice_number: activePayment?.invoice_number || null,
        payment_date: activePayment?.payment_date
          ? String(activePayment.payment_date).slice(0, 10)
          : null,
      };
    });

    return NextResponse.json({ items });
  } catch {
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}

// POST - descartar una membresía futura que aún no ha empezado
export async function POST(request: NextRequest) {
  try {
    const { user } = await getUser();
    if (!isAdminUser(user)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const membershipId = String(body.membership_id || '').trim();

    if (!membershipId) {
      return NextResponse.json(
        { error: 'membership_id es requerido' },
        { status: 400 },
      );
    }

    const today = parseLocalDate(getTodayYmdColombia());
    today.setHours(0, 0, 0, 0);

    const { data: membership, error: memError } = await supabaseAdmin
      .from('gym_memberships')
      .select(
        `
        id,
        client_info_id,
        plan_id,
        start_date,
        end_date,
        status,
        client_info:gym_client_info ( name )
      `,
      )
      .eq('id', membershipId)
      .single();

    if (memError || !membership) {
      return NextResponse.json(
        { error: 'Membresía no encontrada' },
        { status: 404 },
      );
    }

    const start = parseLocalDate(String(membership.start_date).slice(0, 10));
    start.setHours(0, 0, 0, 0);
    if (start <= today) {
      return NextResponse.json(
        { error: 'Solo se pueden revisar membresías que aún no han empezado' },
        { status: 400 },
      );
    }

    if (membership.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Esta membresía ya está cancelada' },
        { status: 400 },
      );
    }

    const { data: payments } = await supabaseAdmin
      .from('gym_payments')
      .select('id, amount, status, invoice_number')
      .eq('membership_id', membershipId)
      .order('created_at', { ascending: false });

    const activePayment = (payments || []).find((p) => p.status !== 'voided');

    if (activePayment) {
      await supabaseAdmin
        .from('gym_payments')
        .update({
          status: 'voided',
          voided_reason: 'Anticipo descartado: membresía futura cancelada.',
          updated_at: new Date().toISOString(),
        })
        .eq('id', activePayment.id);
    }

    await supabaseAdmin
      .from('gym_memberships')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', membershipId);

    const clientName = Array.isArray(membership.client_info)
      ? membership.client_info[0]?.name
      : (membership.client_info as { name?: string } | null)?.name;

    await insertLog({
      user_id: user?.id,
      action: 'gym_advance_discard',
      module: 'payments',
      details: {
        membership_id: membershipId,
        client_info_id: membership.client_info_id,
        client_name: clientName || null,
        payment_id: activePayment?.id || null,
        amount: activePayment ? Number(activePayment.amount) : null,
        description: 'Anticipo descartado; membresía futura cancelada',
      },
      store_id: STORE_ID_FISICA,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}
