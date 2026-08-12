import { type NextRequest, NextResponse } from 'next/server';
import { insertLog, STORE_ID_FISICA } from '@/lib/logs-service';
import { supabaseAdmin } from '@/lib/supabase';
import { getUser } from '@/lib/supabase-server';
import type { GymCreditType } from '@/types/gym';

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

async function getBalance(clientInfoId: string): Promise<number> {
  const { data, error } = await supabaseAdmin
    .from('gym_client_credits')
    .select('amount')
    .eq('client_info_id', clientInfoId);

  if (error) throw error;
  return (data || []).reduce((sum, row) => sum + Number(row.amount || 0), 0);
}

// GET - saldo + movimientos de un cliente
export async function GET(request: NextRequest) {
  try {
    const { user } = await getUser();
    if (!isAdminUser(user)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const clientInfoId = new URL(request.url).searchParams.get(
      'client_info_id',
    );
    if (!clientInfoId) {
      return NextResponse.json(
        { error: 'client_info_id es requerido' },
        { status: 400 },
      );
    }

    const { data: movements, error } = await supabaseAdmin
      .from('gym_client_credits')
      .select('*')
      .eq('client_info_id', clientInfoId)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: 'Error al obtener saldo' },
        { status: 500 },
      );
    }

    const balance = (movements || []).reduce(
      (sum, row) => sum + Number(row.amount || 0),
      0,
    );

    return NextResponse.json({ balance, movements: movements || [] });
  } catch {
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}

// POST - abono (deposit), ajuste (adjust) o reembolso (refund)
export async function POST(request: NextRequest) {
  try {
    const { user } = await getUser();
    if (!isAdminUser(user)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const clientInfoId = String(body.client_info_id || '').trim();
    const type = String(body.type || 'deposit') as GymCreditType;
    const notes =
      typeof body.notes === 'string' ? body.notes.trim() : undefined;
    const rawAmount = Number(body.amount);

    if (!clientInfoId) {
      return NextResponse.json(
        { error: 'client_info_id es requerido' },
        { status: 400 },
      );
    }

    if (!['deposit', 'adjust', 'refund'].includes(type)) {
      return NextResponse.json(
        { error: 'Tipo de movimiento no válido' },
        { status: 400 },
      );
    }

    if (!Number.isFinite(rawAmount) || rawAmount === 0) {
      return NextResponse.json(
        { error: 'El monto debe ser distinto de 0' },
        { status: 400 },
      );
    }

    // deposit/refund: positivos; adjust puede ser +/-
    let amount = rawAmount;
    if (type === 'deposit' || type === 'refund') {
      amount = Math.abs(rawAmount);
    }

    if (type === 'adjust' && amount < 0) {
      const balance = await getBalance(clientInfoId);
      if (balance + amount < -0.001) {
        return NextResponse.json(
          { error: 'El ajuste dejaría el saldo en negativo' },
          { status: 400 },
        );
      }
    }

    const { data: client, error: clientError } = await supabaseAdmin
      .from('gym_client_info')
      .select('id, name')
      .eq('id', clientInfoId)
      .single();

    if (clientError || !client) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 },
      );
    }

    const { data, error } = await supabaseAdmin
      .from('gym_client_credits')
      .insert({
        client_info_id: clientInfoId,
        amount,
        type,
        notes: notes || null,
        store_id: STORE_ID_FISICA,
        created_by: user?.id,
      })
      .select('*')
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: 'Error al registrar movimiento de saldo' },
        { status: 500 },
      );
    }

    await insertLog({
      user_id: user?.id,
      action: 'gym_credit_create',
      module: 'payments',
      details: {
        credit_id: data.id,
        client_info_id: clientInfoId,
        client_name: client.name,
        amount,
        type,
        notes: notes || null,
        description: `Saldo gym (${type}): $${Number(amount).toLocaleString('es-CO')}`,
      },
      store_id: STORE_ID_FISICA,
    });

    const balance = await getBalance(clientInfoId);
    return NextResponse.json({ ...data, balance });
  } catch {
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}
