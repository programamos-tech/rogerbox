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

/**
 * PATCH - Anular un pago (status = 'voided'). Deja de contar en ingresos del dashboard.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { user } = await getUser();
    if (!isAdminUser(user)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const resolved = await params;
    const id = Array.isArray(resolved.id) ? resolved.id[0] : resolved.id;
    const rawId = typeof id === 'string' ? id.trim() : '';
    const body = await request.json().catch(() => ({}));
    const action = body.action === 'void' ? 'void' : null;
    const reason = typeof body.reason === 'string' ? body.reason.trim() : '';

    if (action !== 'void') {
      return NextResponse.json(
        {
          error:
            'Acción no válida. Use { "action": "void", "reason": "..." } para anular.',
        },
        { status: 400 },
      );
    }

    if (reason.length < 10) {
      return NextResponse.json(
        {
          error:
            'El motivo de anulación es obligatorio (mínimo 10 caracteres).',
        },
        { status: 400 },
      );
    }

    if (!rawId) {
      return NextResponse.json(
        { error: 'ID de pago no válido' },
        { status: 400 },
      );
    }

    const { data: payment, error: fetchError } = await supabaseAdmin
      .from('gym_payments')
      .select('id, status, amount, payment_method')
      .eq('id', rawId)
      .maybeSingle();

    if (fetchError) {
      const msg =
        process.env.NODE_ENV === 'development' && fetchError.message
          ? `Pago no encontrado: ${fetchError.message}`
          : 'Pago no encontrado';
      return NextResponse.json({ error: msg }, { status: 404 });
    }

    if (!payment) {
      return NextResponse.json(
        { error: 'Pago no encontrado' },
        { status: 404 },
      );
    }

    if (payment.status === 'voided') {
      return NextResponse.json(
        { error: 'Este pago ya está anulado' },
        { status: 400 },
      );
    }

    const { error: updateError } = await supabaseAdmin
      .from('gym_payments')
      .update({
        status: 'voided',
        voided_reason: reason,
        updated_at: new Date().toISOString(),
      })
      .eq('id', rawId);

    if (updateError) {
      return NextResponse.json(
        { error: 'Error al anular el pago' },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Pago anulado. Ya no se incluirá en totales de ingresos.',
    });
  } catch (_e) {
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}
