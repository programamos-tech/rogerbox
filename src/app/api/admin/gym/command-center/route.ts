import { NextResponse } from 'next/server';
import {
  getMembershipPeriodProgress,
  getTodayYmdColombia,
  parseLocalDate,
} from '@/lib/dateUtils';
import { supabaseAdmin } from '@/lib/supabase';
import { getUser } from '@/lib/supabase-server';
import type { GymCommandCenterResponse } from '@/modules/gym-admin/types';
import { filterBirthdayClients } from '@/shared/utils/birthday.util';

const QUEUE_LIMIT = 8;
const PAGE_SIZE = 1000;
const ENDING_SOON_DAYS = 7;

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

function ymdAdd(ymd: string, days: number): string {
  const d = parseLocalDate(ymd);
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function toYmd(value: string | null | undefined): string {
  return String(value || '').slice(0, 10);
}

function dayOnly(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function unwrap<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function clientHref(userId: string | null | undefined, clientInfoId: string) {
  return `/admin/users/${userId || clientInfoId}`;
}

function colombiaYmdFromIso(iso: string | null | undefined): string {
  if (!iso) return '';
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(iso));
}

type ClientInfoRow = {
  id: string;
  name?: string | null;
  document_id?: string | null;
  whatsapp?: string | null;
  user_id?: string | null;
  is_inactive?: boolean | null;
  birth_date?: string | null;
};

type PlanRow = { id?: string; name?: string | null };

type MembershipRow = {
  id: string;
  client_info_id: string;
  plan_id: string;
  start_date: string;
  end_date: string;
  status: string;
  client_info: ClientInfoRow | null;
  plan: PlanRow | null;
};

type PaymentRow = {
  amount: number | null;
  payment_method?: string | null;
  payment_date?: string | null;
};

type OrderRow = { amount: number | null; created_at?: string | null };

type ExpenseRow = { amount: number | null; expense_date?: string | null };

async function fetchPaged<T>(
  query: (
    from: number,
    to: number,
  ) => PromiseLike<{
    data: T[] | null;
    error: { message?: string } | null;
  }>,
): Promise<T[]> {
  const out: T[] = [];
  let from = 0;
  for (;;) {
    const { data, error } = await query(from, from + PAGE_SIZE - 1);
    if (error) {
      throw new Error(error.message || 'Error al paginar datos');
    }
    const rows = data || [];
    out.push(...rows);
    if (rows.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }
  return out;
}

async function fetchByIds<T extends { id?: string }>(
  table: 'gym_client_info' | 'gym_plans',
  columns: string,
  ids: string[],
): Promise<T[]> {
  const unique = [...new Set(ids.filter(Boolean))];
  const out: T[] = [];
  for (let i = 0; i < unique.length; i += PAGE_SIZE) {
    const chunk = unique.slice(i, i + PAGE_SIZE);
    const { data, error } = await supabaseAdmin
      .from(table)
      .select(columns)
      .in('id', chunk);
    if (error) {
      throw new Error(error.message || `Error al obtener ${table}`);
    }
    out.push(...((data || []) as unknown as T[]));
  }
  return out;
}

async function fetchAllMemberships(): Promise<MembershipRow[]> {
  const raw = await fetchPaged<{
    id: string;
    client_info_id: string;
    plan_id: string;
    start_date: string;
    end_date: string;
    status: string;
  }>((from, to) =>
    supabaseAdmin
      .from('gym_memberships')
      .select('id, client_info_id, plan_id, start_date, end_date, status')
      .neq('status', 'cancelled')
      .order('id', { ascending: true })
      .range(from, to),
  );

  const clients = await fetchByIds<ClientInfoRow>(
    'gym_client_info',
    'id, name, document_id, whatsapp, user_id, is_inactive, birth_date',
    raw.map((m) => m.client_info_id),
  );
  const plans = await fetchByIds<PlanRow>(
    'gym_plans',
    'id, name',
    raw.map((m) => m.plan_id),
  );
  const clientById = new Map(clients.map((c) => [c.id, c]));
  const planById = new Map(plans.map((p) => [String(p.id || ''), p]));

  return raw.map((m) => ({
    ...m,
    client_info: clientById.get(m.client_info_id) || null,
    plan: planById.get(m.plan_id) || null,
  }));
}

function sumByDate(
  rows: { amount: number | null; date: string }[],
  ymd: string,
) {
  return rows
    .filter((r) => r.date === ymd)
    .reduce((sum, r) => sum + Number(r.amount || 0), 0);
}

export async function GET() {
  try {
    const { user } = await getUser();
    if (!isAdminUser(user)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const today = getTodayYmdColombia();
    const yesterday = ymdAdd(today, -1);
    const ago30 = ymdAdd(today, -30);
    const todayRef = dayOnly(parseLocalDate(today));
    const ago30Ref = dayOnly(parseLocalDate(ago30));
    const tomorrow = ymdAdd(today, 1);
    const startIso = `${yesterday}T00:00:00.000-05:00`;
    const endIso = `${today}T23:59:59.999-05:00`;

    const [memberships, paymentsRes, expensesRes, ordersRes, birthdaysRes] =
      await Promise.all([
        fetchAllMemberships(),
        supabaseAdmin
          .from('gym_payments')
          .select('amount, payment_method, payment_date')
          .or('status.eq.active,status.is.null')
          .gte('payment_date', yesterday)
          .lt('payment_date', tomorrow),
        supabaseAdmin
          .from('gym_expenses')
          .select('amount, expense_date')
          .gte('expense_date', yesterday)
          .lt('expense_date', tomorrow),
        supabaseAdmin
          .from('orders')
          .select('amount, created_at')
          .eq('status', 'approved')
          .not('course_id', 'is', null)
          .gte('created_at', startIso)
          .lte('created_at', endIso),
        supabaseAdmin
          .from('gym_client_info')
          .select('id, name, document_id, whatsapp, user_id, birth_date')
          .not('birth_date', 'is', null)
          .order('name', { ascending: true }),
      ]);

    const payments = (
      paymentsRes.error ? [] : paymentsRes.data || []
    ) as PaymentRow[];
    const expenses = (
      expensesRes.error ? [] : expensesRes.data || []
    ) as ExpenseRow[];
    const orders = (ordersRes.error ? [] : ordersRes.data || []) as OrderRow[];
    const birthdayRows = birthdaysRes.error ? [] : birthdaysRes.data || [];

    type ClientBucket = {
      client_info_id: string;
      name: string;
      document_id: string;
      whatsapp: string | null;
      user_id: string | null;
      is_inactive: boolean;
      current: MembershipRow[];
      expired: MembershipRow[];
      scheduled: MembershipRow[];
      wasActive30d: boolean;
    };

    const byClient = new Map<string, ClientBucket>();

    for (const raw of memberships) {
      const client = unwrap(raw.client_info);
      const clientInfoId = String(raw.client_info_id || client?.id || '');
      if (!clientInfoId) continue;

      let bucket = byClient.get(clientInfoId);
      if (!bucket) {
        bucket = {
          client_info_id: clientInfoId,
          name: client?.name || 'Sin nombre',
          document_id: client?.document_id || '',
          whatsapp: client?.whatsapp || null,
          user_id: client?.user_id || null,
          is_inactive: Boolean(client?.is_inactive),
          current: [],
          expired: [],
          scheduled: [],
          wasActive30d: false,
        };
        byClient.set(clientInfoId, bucket);
      }

      const start = dayOnly(parseLocalDate(raw.start_date));
      const end = dayOnly(parseLocalDate(raw.end_date));
      const liveStatus = raw.status === 'active' || raw.status === 'courtesy';

      if (liveStatus && start <= todayRef && end >= todayRef) {
        bucket.current.push(raw);
      } else if (liveStatus && start > todayRef) {
        bucket.scheduled.push(raw);
      } else if (end < todayRef) {
        bucket.expired.push(raw);
      }

      if (start <= ago30Ref && end >= ago30Ref) {
        bucket.wasActive30d = true;
      }
    }

    const collectAll: GymCommandCenterResponse['queue']['collect'] = [];
    const renewAll: GymCommandCenterResponse['queue']['renew'] = [];
    const advancesAll: GymCommandCenterResponse['queue']['advances'] = [];
    const scheduledIds: string[] = [];

    let activeCount = 0;
    let endingSoonCount = 0;
    let expiredCount = 0;
    let active30d = 0;

    const latestEnd = (rows: MembershipRow[]) =>
      [...rows].sort(
        (a, b) =>
          parseLocalDate(b.end_date).getTime() -
          parseLocalDate(a.end_date).getTime(),
      )[0];

    const soonestEnd = (rows: MembershipRow[]) =>
      [...rows].sort(
        (a, b) =>
          parseLocalDate(a.end_date).getTime() -
          parseLocalDate(b.end_date).getTime(),
      )[0];

    const soonestStart = (rows: MembershipRow[]) =>
      [...rows].sort(
        (a, b) =>
          parseLocalDate(a.start_date).getTime() -
          parseLocalDate(b.start_date).getTime(),
      )[0];

    for (const bucket of byClient.values()) {
      if (bucket.wasActive30d) active30d += 1;

      const href = clientHref(bucket.user_id, bucket.client_info_id);
      const hasScheduled = bucket.scheduled.length > 0;

      if (bucket.current.length > 0) {
        activeCount += 1;
        const current = soonestEnd(bucket.current);
        const period = getMembershipPeriodProgress(
          current.start_date,
          current.end_date,
          todayRef,
        );
        if (period.endingSoon && !hasScheduled) {
          endingSoonCount += 1;
          const plan = unwrap(current.plan);
          renewAll.push({
            client_info_id: bucket.client_info_id,
            href,
            name: bucket.name,
            document_id: bucket.document_id,
            plan_name: plan?.name || 'Plan',
            date: toYmd(current.end_date),
            days: period.daysLeft,
            whatsapp: bucket.whatsapp,
          });
        }
      } else if (
        !bucket.is_inactive &&
        bucket.expired.length > 0 &&
        !hasScheduled
      ) {
        expiredCount += 1;
        const expired = latestEnd(bucket.expired);
        const end = dayOnly(parseLocalDate(expired.end_date));
        const daysOverdue = Math.max(
          1,
          Math.floor((todayRef.getTime() - end.getTime()) / 86400000),
        );
        const plan = unwrap(expired.plan);
        collectAll.push({
          client_info_id: bucket.client_info_id,
          href,
          name: bucket.name,
          document_id: bucket.document_id,
          plan_name: plan?.name || 'Plan',
          date: toYmd(expired.end_date),
          days: daysOverdue,
          whatsapp: bucket.whatsapp,
        });
      }

      if (hasScheduled) {
        const next = soonestStart(bucket.scheduled);
        scheduledIds.push(next.id);
        const plan = unwrap(next.plan);
        advancesAll.push({
          client_info_id: bucket.client_info_id,
          href,
          name: bucket.name,
          document_id: bucket.document_id,
          plan_name: plan?.name || 'Plan',
          date: toYmd(next.start_date),
          days: Math.max(
            0,
            Math.floor(
              (dayOnly(parseLocalDate(next.start_date)).getTime() -
                todayRef.getTime()) /
                86400000,
            ),
          ),
          whatsapp: bucket.whatsapp,
          amount: null,
        });
      }
    }

    if (scheduledIds.length > 0) {
      const { data: advancePayments } = await supabaseAdmin
        .from('gym_payments')
        .select('membership_id, amount, status')
        .in('membership_id', scheduledIds)
        .or('status.eq.active,status.is.null');

      const amountByMembership = new Map<string, number>();
      for (const row of advancePayments || []) {
        const id = String(
          (row as { membership_id?: string }).membership_id || '',
        );
        if (!id) continue;
        amountByMembership.set(
          id,
          (amountByMembership.get(id) || 0) +
            Number((row as { amount?: number }).amount || 0),
        );
      }

      const idByClient = new Map<string, string>();
      for (const bucket of byClient.values()) {
        if (bucket.scheduled.length === 0) continue;
        idByClient.set(
          bucket.client_info_id,
          soonestStart(bucket.scheduled).id,
        );
      }
      for (const item of advancesAll) {
        const membershipId = idByClient.get(item.client_info_id);
        if (!membershipId) continue;
        const amount = amountByMembership.get(membershipId);
        if (amount != null) item.amount = amount;
      }
    }

    collectAll.sort((a, b) => a.days - b.days);
    renewAll.sort((a, b) => a.days - b.days);
    advancesAll.sort((a, b) => a.days - b.days);

    const paymentDated = payments.map((p) => ({
      amount: Number(p.amount || 0),
      method: p.payment_method || '',
      date: toYmd(p.payment_date),
    }));
    const todayPayments = paymentDated.filter((p) => p.date === today);
    const incomeToday = todayPayments.reduce((s, p) => s + p.amount, 0);
    const cashToday = todayPayments
      .filter((p) => p.method === 'cash')
      .reduce((s, p) => s + p.amount, 0);
    const transferToday = todayPayments
      .filter((p) => p.method === 'transfer')
      .reduce((s, p) => s + p.amount, 0);
    const mixedToday = todayPayments
      .filter((p) => p.method === 'mixed')
      .reduce((s, p) => s + p.amount, 0);
    const incomeYesterday = sumByDate(
      paymentDated.map((p) => ({ amount: p.amount, date: p.date })),
      yesterday,
    );

    const expenseDated = expenses.map((e) => ({
      amount: Number(e.amount || 0),
      date: toYmd(e.expense_date),
    }));
    const expensesToday = sumByDate(expenseDated, today);
    const expensesYesterday = sumByDate(expenseDated, yesterday);

    const todayOrders = orders.filter(
      (o) => colombiaYmdFromIso(o.created_at) === today,
    );
    const onlineIncome = todayOrders.reduce(
      (s, o) => s + Number(o.amount || 0),
      0,
    );

    const netToday = incomeToday - expensesToday;
    const netYesterday = incomeYesterday - expensesYesterday;
    let vsYesterdayPct: number | null = null;
    if (netYesterday !== 0) {
      vsYesterdayPct =
        ((netToday - netYesterday) / Math.abs(netYesterday)) * 100;
    } else if (netToday !== 0) {
      vsYesterdayPct = 100;
    }

    const birthdayClients = filterBirthdayClients(
      birthdayRows,
      today,
      today,
      today,
    ).map((c) => ({
      client_info_id: c.id,
      href: clientHref((c as { user_id?: string | null }).user_id, c.id),
      name: c.name,
      document_id: c.document_id || '',
      age: c.age,
      whatsapp: c.whatsapp || null,
    }));

    const payload: GymCommandCenterResponse = {
      today,
      kpis: {
        active: { count: activeCount, vs30d: activeCount - active30d },
        endingSoon: { count: endingSoonCount, days: ENDING_SOON_DAYS },
        expired: { count: expiredCount },
        netToday: {
          amount: netToday,
          income: incomeToday,
          expenses: expensesToday,
          vsYesterdayPct,
        },
      },
      cash: {
        income: incomeToday,
        cash: cashToday,
        transfer: transferToday,
        mixed: mixedToday,
        expenses: expensesToday,
        net: netToday,
        invoiceCount: todayPayments.length,
        onlineIncome,
        onlineCount: todayOrders.length,
      },
      queue: {
        collect: collectAll.slice(0, QUEUE_LIMIT),
        renew: renewAll.slice(0, QUEUE_LIMIT),
        advances: advancesAll.slice(0, QUEUE_LIMIT),
        birthdays: birthdayClients,
        totals: {
          collect: collectAll.length,
          renew: renewAll.length,
          advances: advancesAll.length,
          birthdays: birthdayClients.length,
        },
      },
    };

    return NextResponse.json(payload);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Error interno del servidor';
    console.error('[command-center]', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
