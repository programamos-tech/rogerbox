import { type NextRequest, NextResponse } from 'next/server';
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

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { user } = await getUser();
    if (!isAdminUser(user)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { error: 'ID de egreso inválido' },
        { status: 400 },
      );
    }

    const { data: existing } = await supabaseAdmin
      .from('gym_expenses')
      .select('id, concept, amount')
      .eq('id', id)
      .maybeSingle();

    if (!existing) {
      return NextResponse.json(
        { error: 'Egreso no encontrado' },
        { status: 404 },
      );
    }

    const { error } = await supabaseAdmin.from('gym_expenses').delete().eq('id', id);
    if (error) {
      return NextResponse.json(
        { error: 'Error al eliminar egreso' },
        { status: 500 },
      );
    }

    await insertLog({
      user_id: user?.id || null,
      action: 'expense_delete',
      module: 'expenses',
      details: {
        expense_id: existing.id,
        concept: existing.concept,
        amount: existing.amount,
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

