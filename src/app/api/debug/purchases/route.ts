import { NextRequest, NextResponse } from 'next/server';
import { getSession, createClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { session } = await getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
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

