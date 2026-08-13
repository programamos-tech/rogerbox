import { NextResponse } from 'next/server';
import {
  getMembershipPeriodProgress,
  getTodayYmdColombia,
  parseLocalDate,
} from '@/lib/dateUtils';
import { supabaseAdmin } from '@/lib/supabase';
import { getUser } from '@/lib/supabase-server';
import type { GymCommandCenterResponse } from '@/modules/gym-admin/types';
import { COMMAND_CENTER_MAX_PERIOD_DAYS } from '@/modules/gym-admin/utils/command-center-period.util';
import { filterBirthdayClients } from '@/shared/utils/birthday.util';

const QUEUE_LIMIT = 80;
const PAGE_SIZE = 1000;
const ENDING_SOON_DAYS = 7;
const YMD_RE = /^\d{4}-\d{2}-\d{2}$/;

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

function isYmd(value: string): boolean {
  if (!YMD_RE.test(value)) return false;
  const parsed = parseLocalDate(value);
  return (
    parsed.getFullYear() === Number(value.slice(0, 4)) &&
    parsed.getMonth() + 1 === Number(value.slice(5, 7)) &&
    parsed.getDate() === Number(value.slice(8, 10))
  );
}

function daysInclusive(from: string, to: string): number {
  const start = parseLocalDate(from).getTime();
  const end = parseLocalDate(to).getTime();
  return Math.max(1, Math.round((end - start) / 86400000) + 1);
}

function parsePeriod(
  searchParams: URLSearchParams,
  today: string,
): { from: string; to: string } {
  let from = searchParams.get('from') || today;
  let to = searchParams.get('to') || today;
  if (!isYmd(from)) from = today;
  if (!isYmd(to)) to = today;
  if (from > to) {
    const swap = from;
    from = to;
    to = swap;
  }
  if (to > today) to = today;
  if (from > today) from = today;
  const days = daysInclusive(from, to);
  if (days > COMMAND_CENTER_MAX_PERIOD_DAYS) {
    from = ymdAdd(to, -(COMMAND_CENTER_MAX_PERIOD_DAYS - 1));
  }
  return { from, to };
}

function inRange(date: string, from: string, to: string) {
  return date >= from && date <= to;
}

function sumInRange(
  rows: { amount: number; date: string }[],
  from: string,
  to: string,
) {
  return rows
    .filter((row) => inRange(row.date, from, to))
    .reduce((sum, row) => sum + row.amount, 0);
}

function chartLabel(ymd: string, dayCount: number): string {
  const d = parseLocalDate(ymd);
  if (dayCount <= 8) {
    const raw = d.toLocaleDateString('es-CO', { weekday: 'short' });
    const cleaned = raw.replace(/\./g, '');
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }
  if (dayCount <= 31) return String(d.getDate());
  return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
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

async function fetchPagedSafe<T>(
  query: (
    from: number,
    to: number,
  ) => PromiseLike<{
    data: T[] | null;
    error: { message?: string } | null;
  }>,
): Promise<T[]> {
  try {
    return await fetchPaged(query);
  } catch {
    return [];
  }
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

export async function GET(request: Request) {
  try {
    const { user } = await getUser();
    if (!isAdminUser(user)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const today = getTodayYmdColombia();
    const { from, to } = parsePeriod(new URL(request.url).searchParams, today);
    const ago30 = ymdAdd(today, -30);
    const todayRef = dayOnly(parseLocalDate(today));
    const ago30Ref = dayOnly(parseLocalDate(ago30));
    const periodDays = daysInclusive(from, to);
    const prevTo = ymdAdd(from, -1);
    const prevFrom = ymdAdd(prevTo, -(periodDays - 1));
    const fetchUntil = ymdAdd(to, 1);
    const startIso = `${prevFrom}T00:00:00.000-05:00`;
    const endIso = `${to}T23:59:59.999-05:00`;

    const [memberships, payments, expenses, orders, birthdaysRes] =
      await Promise.all([
        fetchAllMemberships(),
        fetchPagedSafe<PaymentRow>((fromIdx, toIdx) =>
          supabaseAdmin
            .from('gym_payments')
            .select('amount, payment_method, payment_date')
            .or('status.eq.active,status.is.null')
            .gte('payment_date', prevFrom)
            .lt('payment_date', fetchUntil)
            .order('id', { ascending: true })
            .range(fromIdx, toIdx),
        ),
        fetchPagedSafe<ExpenseRow>((fromIdx, toIdx) =>
          supabaseAdmin
            .from('gym_expenses')
            .select('amount, expense_date')
            .gte('expense_date', prevFrom)
            .lt('expense_date', fetchUntil)
            .order('id', { ascending: true })
            .range(fromIdx, toIdx),
        ),
        fetchPagedSafe<OrderRow>((fromIdx, toIdx) =>
          supabaseAdmin
            .from('orders')
            .select('amount, created_at')
            .eq('status', 'approved')
            .not('course_id', 'is', null)
            .gte('created_at', startIso)
            .lte('created_at', endIso)
            .order('id', { ascending: true })
            .range(fromIdx, toIdx),
        ),
        supabaseAdmin
          .from('gym_client_info')
          .select('id, name, document_id, whatsapp, user_id, birth_date')
          .not('birth_date', 'is', null)
          .order('name', { ascending: true }),
      ]);

    const birthdayRows = (
      birthdaysRes.error ? [] : birthdaysRes.data || []
    ) as ClientInfoRow[];

    type ClientBucket = {
      client_info_id: string;
      name: string;
      document_id: string;
      whatsapp: string | null;
      avatar_url: string | null;
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
          avatar_url: null,
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
    const planMixMap = new Map<string, number>();

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
        const plan = unwrap(current.plan);
        const planName = plan?.name || 'Plan';
        planMixMap.set(planName, (planMixMap.get(planName) || 0) + 1);
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
            avatar_url: bucket.avatar_url,
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
          avatar_url: bucket.avatar_url,
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
          avatar_url: bucket.avatar_url,
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
    const periodPayments = paymentDated.filter((p) =>
      inRange(p.date, from, to),
    );
    const incomePeriod = periodPayments.reduce((s, p) => s + p.amount, 0);
    const cashPeriod = periodPayments
      .filter((p) => p.method === 'cash')
      .reduce((s, p) => s + p.amount, 0);
    const transferPeriod = periodPayments
      .filter((p) => p.method === 'transfer')
      .reduce((s, p) => s + p.amount, 0);
    const mixedPeriod = periodPayments
      .filter((p) => p.method === 'mixed')
      .reduce((s, p) => s + p.amount, 0);
    const incomePrev = sumInRange(paymentDated, prevFrom, prevTo);

    const expenseDated = expenses.map((e) => ({
      amount: Number(e.amount || 0),
      date: toYmd(e.expense_date),
    }));
    const expensesPeriod = sumInRange(expenseDated, from, to);
    const expensesPrev = sumInRange(expenseDated, prevFrom, prevTo);

    const periodOrders = orders.filter((o) =>
      inRange(colombiaYmdFromIso(o.created_at), from, to),
    );
    const onlineIncome = periodOrders.reduce(
      (s, o) => s + Number(o.amount || 0),
      0,
    );

    const netPeriod = incomePeriod - expensesPeriod;
    const netPrev = incomePrev - expensesPrev;
    let vsYesterdayPct: number | null = null;
    if (netPrev !== 0) {
      vsYesterdayPct = ((netPeriod - netPrev) / Math.abs(netPrev)) * 100;
    } else if (netPeriod !== 0) {
      vsYesterdayPct = 100;
    }

    const amountByDate = new Map<string, number>();
    for (const p of periodPayments) {
      amountByDate.set(p.date, (amountByDate.get(p.date) || 0) + p.amount);
    }
    const revenueWeek: { date: string; label: string; amount: number }[] = [];
    for (let i = 0; i < periodDays; i += 1) {
      const date = ymdAdd(from, i);
      revenueWeek.push({
        date,
        label: chartLabel(date, periodDays),
        amount: amountByDate.get(date) || 0,
      });
    }

    const sortedPlans = [...planMixMap.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
    const PLAN_MIX_TOP = 6;
    const planMix =
      sortedPlans.length <= PLAN_MIX_TOP
        ? sortedPlans
        : [
            ...sortedPlans.slice(0, PLAN_MIX_TOP),
            {
              name: 'Otros',
              count: sortedPlans
                .slice(PLAN_MIX_TOP)
                .reduce((sum, item) => sum + item.count, 0),
            },
          ];

    const birthdayClients = filterBirthdayClients(
      birthdayRows,
      from,
      to,
      to,
    ).map((c) => ({
      client_info_id: c.id,
      href: clientHref(c.user_id, c.id),
      name: c.name || 'Sin nombre',
      document_id: c.document_id || '',
      age: c.age,
      whatsapp: c.whatsapp || null,
      avatar_url: null as string | null,
    }));

    const visiblePeople = [
      ...collectAll.slice(0, QUEUE_LIMIT),
      ...renewAll.slice(0, QUEUE_LIMIT),
      ...advancesAll.slice(0, QUEUE_LIMIT),
      ...birthdayClients,
    ];
    const userIds = [
      ...new Set(
        visiblePeople
          .map((person) => byClient.get(person.client_info_id)?.user_id)
          .concat(birthdayRows.map((row) => row.user_id))
          .filter((id): id is string => Boolean(id)),
      ),
    ];
    if (userIds.length > 0) {
      try {
        const { data: profileRows } = await supabaseAdmin
          .from('profiles')
          .select('id, avatar_url')
          .in('id', userIds);
        const avatarByUserId = new Map<string, string>();
        for (const row of profileRows || []) {
          const url = String(
            (row as { avatar_url?: string | null }).avatar_url || '',
          ).trim();
          if (!url) continue;
          avatarByUserId.set(String((row as { id: string }).id), url);
        }
        const userIdByClient = new Map<string, string | null>();
        for (const bucket of byClient.values()) {
          userIdByClient.set(bucket.client_info_id, bucket.user_id);
        }
        for (const row of birthdayRows) {
          if (!userIdByClient.has(row.id)) {
            userIdByClient.set(row.id, row.user_id || null);
          }
        }
        for (const person of visiblePeople) {
          const uid = userIdByClient.get(person.client_info_id);
          if (!uid) continue;
          person.avatar_url = avatarByUserId.get(uid) || null;
        }
      } catch {
        // Sin foto de perfil el dashboard sigue con avatares ilustrados.
      }
    }

    const payload: GymCommandCenterResponse = {
      today,
      period: { from, to },
      kpis: {
        active: { count: activeCount, vs30d: activeCount - active30d },
        endingSoon: { count: endingSoonCount, days: ENDING_SOON_DAYS },
        expired: { count: expiredCount },
        netToday: {
          amount: netPeriod,
          income: incomePeriod,
          expenses: expensesPeriod,
          vsYesterdayPct,
        },
      },
      cash: {
        income: incomePeriod,
        cash: cashPeriod,
        transfer: transferPeriod,
        mixed: mixedPeriod,
        expenses: expensesPeriod,
        net: netPeriod,
        invoiceCount: periodPayments.length,
        onlineIncome,
        onlineCount: periodOrders.length,
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
      charts: {
        revenueWeek,
        planMix,
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
