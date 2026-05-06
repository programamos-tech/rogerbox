import { type NextRequest, NextResponse } from 'next/server';
import { insertLog, STORE_ID_FISICA } from '@/lib/logs-service';
import { supabaseAdmin } from '@/lib/supabase';
import { getUser } from '@/lib/supabase-server';
import type { GymExpenseInsert } from '@/types/gym';

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

export async function GET(request: NextRequest) {
  try {
    const { user } = await getUser();
    if (!isAdminUser(user)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = (searchParams.get('search') || '').trim();
    const category = (searchParams.get('category') || 'all').trim();
    const month = (searchParams.get('month') || '').trim(); // YYYY-MM
    const from = (searchParams.get('from') || '').trim(); // YYYY-MM-DD
    const to = (searchParams.get('to') || '').trim(); // YYYY-MM-DD

    let query = supabaseAdmin
      .from('gym_expenses')
      .select('*')
      .eq('store_id', STORE_ID_FISICA)
      .order('expense_date', { ascending: false })
      .order('created_at', { ascending: false });

    if (category !== 'all') {
      query = query.eq('category', category);
    }

    if (month && /^\d{4}-\d{2}$/.test(month)) {
      const start = `${month}-01`;
      const [y, m] = month.split('-').map(Number);
      const nextMonthDate = new Date(y, m, 1);
      const end = `${nextMonthDate.getFullYear()}-${String(
        nextMonthDate.getMonth() + 1,
      ).padStart(2, '0')}-01`;
      query = query.gte('expense_date', start).lt('expense_date', end);
    }

    if (from && /^\d{4}-\d{2}-\d{2}$/.test(from)) {
      query = query.gte('expense_date', from);
    }
    if (to && /^\d{4}-\d{2}-\d{2}$/.test(to)) {
      query = query.lte('expense_date', to);
    }

    if (search) {
      query = query.or(
        `concept.ilike.%${search}%,category.ilike.%${search}%,notes.ilike.%${search}%`,
      );
    }

    const { data, error } = await query;
    if (error) {
      return NextResponse.json(
        { error: 'Error al obtener egresos' },
        { status: 500 },
      );
    }

    return NextResponse.json(data || []);
  } catch {
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user } = await getUser();
    if (!isAdminUser(user)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body: GymExpenseInsert = await request.json();
    const { concept, category, amount, expense_date, payment_method, notes } = body;

    if (!concept?.trim() || !category?.trim() || !expense_date || !payment_method) {
      return NextResponse.json(
        { error: 'Concepto, categoría, fecha y método son obligatorios' },
        { status: 400 },
      );
    }
    if (!amount || Number(amount) <= 0) {
      return NextResponse.json(
        { error: 'El monto del egreso debe ser mayor a 0' },
        { status: 400 },
      );
    }

    const { data, error } = await supabaseAdmin
      .from('gym_expenses')
      .insert({
        concept: concept.trim(),
        category: category.trim(),
        amount: Number(amount),
        expense_date,
        payment_method,
        notes: notes?.trim() || null,
        store_id: STORE_ID_FISICA,
        created_by: user?.id || null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Error al registrar egreso' },
        { status: 500 },
      );
    }

    await insertLog({
      user_id: user?.id || null,
      action: 'expense_create',
      module: 'expenses',
      details: {
        expense_id: data.id,
        concept: data.concept,
        category: data.category,
        amount: data.amount,
        expense_date: data.expense_date,
      },
      store_id: STORE_ID_FISICA,
    });

    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}

