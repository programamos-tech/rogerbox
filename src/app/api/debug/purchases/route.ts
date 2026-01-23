import { NextRequest, NextResponse } from 'next/server';
import { getSession, createClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase';

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

export async function GET(request: NextRequest) {
  // Solo permitir en desarrollo o para admins
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  try {
    const { session } = await getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // En producción, solo admins pueden acceder
    if (process.env.NODE_ENV === 'production' && !isAdminUser(session.user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const userId = session.user.id;
    const supabase = await createClient();

    // Buscar compras con cliente normal (RLS)
    const { data: purchasesWithRLS, error: rlsError } = await supabase
      .from('course_purchases')
      .select('id, user_id, course_id, order_id, is_active, created_at, start_date')
      .eq('user_id', userId);

    // Buscar compras con admin (sin RLS)
    const { data: purchasesWithAdmin, error: adminError } = await supabaseAdmin
      .from('course_purchases')
      .select('id, user_id, course_id, order_id, is_active, created_at, start_date')
      .eq('user_id', userId);

    // Buscar órdenes del usuario
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id, user_id, course_id, status, amount, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    return NextResponse.json({
      session: {
        userId: userId,
        email: session.user.email
      },
      purchases: {
        withRLS: {
          count: purchasesWithRLS?.length || 0,
          data: purchasesWithRLS,
          error: rlsError
        },
        withAdmin: {
          count: purchasesWithAdmin?.length || 0,
          data: purchasesWithAdmin,
          error: adminError
        },
        discrepancy: purchasesWithAdmin && purchasesWithRLS 
          ? purchasesWithAdmin.length !== purchasesWithRLS.length
          : false
      },
      orders: {
        count: orders?.length || 0,
        data: orders,
        error: ordersError
      }
    });
  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Error en debug', 
      details: error.message 
    }, { status: 500 });
  }
}

