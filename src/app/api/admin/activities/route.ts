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
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    const limit = Math.min(
      Math.max(parseInt(searchParams.get('limit') || '30', 10), 1),
      100,
    );
    const search = (searchParams.get('search') || '').trim();
    const moduleFilter = (searchParams.get('module') || '').trim();
    const actionFilter = (searchParams.get('action') || '').trim();
    const from = (searchParams.get('from') || '').trim();
    const to = (searchParams.get('to') || '').trim();

    let query = supabaseAdmin
      .from('logs')
      .select('id, user_id, action, module, details, store_id, created_at', {
        count: 'exact',
      })
      .order('created_at', { ascending: false });

    if (moduleFilter && moduleFilter !== 'all') {
      query = query.eq('module', moduleFilter);
    }
    if (actionFilter && actionFilter !== 'all') {
      query = query.eq('action', actionFilter);
    }
    if (from) {
      query = query.gte('created_at', `${from}T00:00:00.000Z`);
    }
    if (to) {
      query = query.lte('created_at', `${to}T23:59:59.999Z`);
    }
    if (search) {
      query = query.or(
        `action.ilike.%${search}%,module.ilike.%${search}%,details::text.ilike.%${search}%`,
      );
    }

    const fromIdx = (page - 1) * limit;
    const toIdx = fromIdx + limit - 1;
    const { data: logs, error, count } = await query.range(fromIdx, toIdx);

    if (error) {
      return NextResponse.json(
        { error: 'Error al cargar actividades' },
        { status: 500 },
      );
    }

    const rows = logs ?? [];
    const userIds = [
      ...new Set(
        rows.map((r: { user_id: string | null }) => r.user_id).filter(Boolean),
      ),
    ] as string[];

    let profileMap: Record<
      string,
      { name: string | null; email: string | null }
    > = {};
    if (userIds.length > 0) {
      const { data: profiles } = await supabaseAdmin
        .from('profiles')
        .select('id, name, email')
        .in('id', userIds);
      if (profiles) {
        profileMap = Object.fromEntries(
          profiles.map((p) => [p.id, { name: p.name, email: p.email }]),
        );
      }
    }

    const activities = rows.map((row: any) => ({
      ...row,
      user_name:
        (row.user_id && profileMap[row.user_id]?.name) || 'Sistema/Admin',
      user_email: (row.user_id && profileMap[row.user_id]?.email) || null,
    }));

    return NextResponse.json({
      activities,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.max(Math.ceil((count || 0) / limit), 1),
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}

