import { type NextRequest, NextResponse } from 'next/server';
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

/**
 * GET /api/admin/orders/wompi-ids?ids=uuid1,uuid2,...
 * Devuelve { [orderId]: wompi_transaction_id } para enriquecer ventas en el admin.
 */
export async function GET(request: NextRequest) {
  try {
    const { user } = await getUser();
    if (!isAdminUser(user)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const idsParam = searchParams.get('ids');
    if (!idsParam) {
      return NextResponse.json({ ids: {} });
    }

    const orderIds = idsParam
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);
    if (orderIds.length === 0) {
      return NextResponse.json({ ids: {} });
    }

    const { data: rows, error } = await supabaseAdmin
      .from('wompi_transactions')
      .select('order_id, wompi_transaction_id')
      .in('order_id', orderIds);

    if (error) {
      console.error('[admin/orders/wompi-ids]', error.message);
      return NextResponse.json({ ids: {} });
    }

    const ids: Record<string, string> = {};
    rows?.forEach((r: { order_id: string; wompi_transaction_id: string }) => {
      if (r.order_id && r.wompi_transaction_id) {
        ids[r.order_id] = r.wompi_transaction_id;
      }
    });

    return NextResponse.json({ ids });
  } catch (e) {
    console.error('[admin/orders/wompi-ids]', e);
    return NextResponse.json({ ids: {} });
  }
}
