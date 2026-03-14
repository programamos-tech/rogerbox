import { type NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getSession } from '@/lib/supabase-server';

/**
 * PATCH /api/student/purchase/start-date
 * Body: { purchaseId: string, startDate: string (YYYY-MM-DD) }
 * Actualiza la fecha de inicio de la compra del usuario (solo si la compra es suya).
 */
export async function PATCH(request: NextRequest) {
  try {
    const { session } = await getSession();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const purchaseId = body.purchaseId ?? body.purchase_id;
    const startDate = body.startDate ?? body.start_date;

    if (!purchaseId || typeof purchaseId !== 'string') {
      return NextResponse.json(
        { error: 'purchaseId es requerido' },
        { status: 400 },
      );
    }
    const dateStr =
      typeof startDate === 'string' && /^\d{4}-\d{2}-\d{2}/.test(startDate)
        ? startDate.slice(0, 10)
        : null;
    if (!dateStr) {
      return NextResponse.json(
        { error: 'startDate inválido (use YYYY-MM-DD)' },
        { status: 400 },
      );
    }

    const { data: purchase, error: fetchError } = await supabaseAdmin
      .from('course_purchases')
      .select('id, user_id, start_date_edit_count')
      .eq('id', purchaseId)
      .maybeSingle();

    if (fetchError || !purchase) {
      return NextResponse.json(
        { error: 'Compra no encontrada' },
        { status: 404 },
      );
    }
    if (purchase.user_id !== userId) {
      return NextResponse.json(
        { error: 'No tienes permiso para editar esta compra' },
        { status: 403 },
      );
    }

    const editCount = Number(purchase.start_date_edit_count) || 0;
    if (editCount >= 3) {
      return NextResponse.json(
        {
          error:
            'Has alcanzado el máximo de 3 cambios de fecha de inicio para este curso.',
        },
        { status: 403 },
      );
    }

    const { error: updateError } = await supabaseAdmin
      .from('course_purchases')
      .update({
        start_date: dateStr,
        start_date_edit_count: editCount + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', purchaseId);

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message || 'Error al guardar la fecha' },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true, startDate: dateStr });
  } catch (e) {
    return NextResponse.json(
      { error: 'Error inesperado al actualizar la fecha' },
      { status: 500 },
    );
  }
}
