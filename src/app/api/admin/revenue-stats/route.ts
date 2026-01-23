import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getUser } from '@/lib/supabase-server';

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
  try {
    const { user } = await getUser();
    
    if (!isAdminUser(user)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const sede = searchParams.get('sede'); // 'fisica', 'online', 'ambas'

    // Validar fechas
    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'start_date y endDate son requeridos' }, { status: 400 });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // Incluir todo el día final

    const results: {
      sede: 'fisica' | 'online' | 'ambas';
      total: number;
      cash: number;
      transfer: number;
      mixed: number;
      count: number;
    }[] = [];

    // Obtener ingresos de sede física (gym_payments)
    if (sede === 'fisica' || sede === 'ambas' || !sede) {
      const { data: gymPayments, error: gymError } = await supabaseAdmin
        .from('gym_payments')
        .select('amount, payment_method, payment_date')
        .gte('payment_date', startDate)
        .lte('payment_date', endDate);

      if (gymError) {
        console.error('Error fetching gym payments:', gymError);
      } else {
        const payments = gymPayments || [];
        const total = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
        const cash = payments
          .filter(p => p.payment_method === 'cash')
          .reduce((sum, p) => sum + Number(p.amount || 0), 0);
        const transfer = payments
          .filter(p => p.payment_method === 'transfer')
          .reduce((sum, p) => sum + Number(p.amount || 0), 0);
        const mixed = payments
          .filter(p => p.payment_method === 'mixed')
          .reduce((sum, p) => sum + Number(p.amount || 0), 0);

        results.push({
          sede: 'fisica',
          total,
          cash,
          transfer,
          mixed,
          count: payments.length,
        });
      }
    }

    // Obtener ingresos de sede en línea (orders)
    if (sede === 'online' || sede === 'ambas' || !sede) {
      const { data: orders, error: ordersError } = await supabaseAdmin
        .from('orders')
        .select('amount, status, created_at')
        .eq('status', 'approved')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());

      if (ordersError) {
        console.error('Error fetching orders:', ordersError);
      } else {
        const approvedOrders = orders || [];
        const total = approvedOrders.reduce((sum, o) => sum + Number(o.amount || 0), 0);
        
        // Para orders online, todo se considera como "transfer" (pagos electrónicos)
        results.push({
          sede: 'online',
          total,
          cash: 0,
          transfer: total,
          mixed: 0,
          count: approvedOrders.length,
        });
      }
    }

    // Si se solicita "ambas" o no se especifica, agregar total combinado
    if (sede === 'ambas' || !sede) {
      const totalFisica = results.find(r => r.sede === 'fisica') || { total: 0, cash: 0, transfer: 0, mixed: 0, count: 0 };
      const totalOnline = results.find(r => r.sede === 'online') || { total: 0, cash: 0, transfer: 0, mixed: 0, count: 0 };
      
      // Solo agregar "ambas" si hay datos de ambas sedes o si se solicita explícitamente
      if (sede === 'ambas' || (totalFisica.count > 0 && totalOnline.count > 0) || (totalFisica.count === 0 && totalOnline.count === 0)) {
        results.push({
          sede: 'ambas',
          total: totalFisica.total + totalOnline.total,
          cash: totalFisica.cash,
          transfer: totalFisica.transfer + totalOnline.transfer,
          mixed: totalFisica.mixed,
          count: totalFisica.count + totalOnline.count,
        });
      }
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Error in GET /api/admin/revenue-stats:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
