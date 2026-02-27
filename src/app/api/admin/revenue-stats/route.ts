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
    const groupByDay = searchParams.get('group_by') === 'day';

    // Validar fechas
    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'start_date y endDate son requeridos' },
        { status: 400 },
      );
    }

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    type ResultItem = {
      sede: 'fisica' | 'online' | 'ambas';
      total: number;
      cash: number;
      transfer: number;
      mixed: number;
      count: number;
    };

    const buildResultsFromPayments = (
      gymPayments: { amount: number; payment_method?: string }[],
      orders: { amount: number }[],
    ): ResultItem[] => {
      const out: ResultItem[] = [];
      if (sede === 'fisica' || sede === 'ambas' || !sede) {
        const p = gymPayments || [];
        const total = p.reduce((s, x) => s + Number(x.amount || 0), 0);
        const cash = p
          .filter((x) => x.payment_method === 'cash')
          .reduce((s, x) => s + Number(x.amount || 0), 0);
        const transfer = p
          .filter((x) => x.payment_method === 'transfer')
          .reduce((s, x) => s + Number(x.amount || 0), 0);
        const mixed = p
          .filter((x) => x.payment_method === 'mixed')
          .reduce((s, x) => s + Number(x.amount || 0), 0);
        out.push({
          sede: 'fisica',
          total,
          cash,
          transfer,
          mixed,
          count: p.length,
        });
      }
      if (sede === 'online' || sede === 'ambas' || !sede) {
        const o = orders || [];
        const total = o.reduce((s, x) => s + Number(x.amount || 0), 0);
        out.push({
          sede: 'online',
          total,
          cash: 0,
          transfer: total,
          mixed: 0,
          count: o.length,
        });
      }
      if (sede === 'ambas' || !sede) {
        const tf = out.find((r) => r.sede === 'fisica') || {
          total: 0,
          cash: 0,
          transfer: 0,
          mixed: 0,
          count: 0,
        };
        const to = out.find((r) => r.sede === 'online') || {
          total: 0,
          cash: 0,
          transfer: 0,
          mixed: 0,
          count: 0,
        };
        out.push({
          sede: 'ambas',
          total: tf.total + to.total,
          cash: tf.cash,
          transfer: tf.transfer + to.transfer,
          mixed: tf.mixed,
          count: tf.count + to.count,
        });
      }
      return out;
    };

    if (groupByDay) {
      let gymPayments: {
        amount: number;
        payment_method?: string;
        payment_date?: string;
      }[] = [];
      let orders: { amount: number; created_at?: string }[] = [];
      if (sede === 'fisica' || sede === 'ambas' || !sede) {
        const { data } = await supabaseAdmin
          .from('gym_payments')
          .select('amount, payment_method, payment_date')
          .gte('payment_date', start.toISOString())
          .lte('payment_date', end.toISOString());
        gymPayments = data || [];
      }
      if (sede === 'online' || sede === 'ambas' || !sede) {
        const { data } = await supabaseAdmin
          .from('orders')
          .select('amount, created_at')
          .eq('status', 'approved')
          .gte('created_at', start.toISOString())
          .lte('created_at', end.toISOString());
        orders = data || [];
      }
      const toDateStr = (d: Date) =>
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const byDay: { date: string; results: ResultItem[] }[] = [];
      const cur = new Date(
        start.getFullYear(),
        start.getMonth(),
        start.getDate(),
      );
      const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());
      while (cur <= endDay) {
        const dateStr = toDateStr(cur);
        const dayStart = new Date(
          cur.getFullYear(),
          cur.getMonth(),
          cur.getDate(),
          0,
          0,
          0,
          0,
        ).getTime();
        const dayEnd = new Date(
          cur.getFullYear(),
          cur.getMonth(),
          cur.getDate(),
          23,
          59,
          59,
          999,
        ).getTime();
        const dayGym = gymPayments.filter((p) => {
          const t = p.payment_date ? new Date(p.payment_date).getTime() : 0;
          return t >= dayStart && t <= dayEnd;
        });
        const dayOrders = orders.filter((o) => {
          const t = o.created_at ? new Date(o.created_at).getTime() : 0;
          return t >= dayStart && t <= dayEnd;
        });
        byDay.push({
          date: dateStr,
          results: buildResultsFromPayments(dayGym, dayOrders),
        });
        cur.setDate(cur.getDate() + 1);
      }
      return NextResponse.json({ byDay });
    }

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
      // Para payment_date, usar el formato ISO completo para asegurar que incluya todo el día final
      // Si payment_date es DATE, esto funcionará igual. Si es TIMESTAMP, incluirá hasta las 23:59:59
      const { data: gymPayments, error: gymError } = await supabaseAdmin
        .from('gym_payments')
        .select('amount, payment_method, payment_date')
        .gte('payment_date', start.toISOString())
        .lte('payment_date', end.toISOString());

      if (gymError) {
      } else {
        const payments = gymPayments || [];
        const total = payments.reduce(
          (sum, p) => sum + Number(p.amount || 0),
          0,
        );
        const cash = payments
          .filter((p) => p.payment_method === 'cash')
          .reduce((sum, p) => sum + Number(p.amount || 0), 0);
        const transfer = payments
          .filter((p) => p.payment_method === 'transfer')
          .reduce((sum, p) => sum + Number(p.amount || 0), 0);
        const mixed = payments
          .filter((p) => p.payment_method === 'mixed')
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
      } else {
        const approvedOrders = orders || [];
        const total = approvedOrders.reduce(
          (sum, o) => sum + Number(o.amount || 0),
          0,
        );

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
      const totalFisica = results.find((r) => r.sede === 'fisica') || {
        total: 0,
        cash: 0,
        transfer: 0,
        mixed: 0,
        count: 0,
      };
      const totalOnline = results.find((r) => r.sede === 'online') || {
        total: 0,
        cash: 0,
        transfer: 0,
        mixed: 0,
        count: 0,
      };

      // Solo agregar "ambas" si hay datos de ambas sedes o si se solicita explícitamente
      if (
        sede === 'ambas' ||
        (totalFisica.count > 0 && totalOnline.count > 0) ||
        (totalFisica.count === 0 && totalOnline.count === 0)
      ) {
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
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}
