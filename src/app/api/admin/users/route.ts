import { type NextRequest, NextResponse } from 'next/server';
import {
  enrichCoursePurchaseFromCalendarDays,
  getTodayYmdForCourseEnrich,
} from '@/lib/enrichCoursePurchase';
import { getTodayYmdColombia, parseLocalDate } from '@/lib/dateUtils';
import { supabaseAdmin } from '@/lib/supabase';
import { getSession } from '@/lib/supabase-server';
import {
  getMixRenewalFilterCategory,
  partitionGymMembershipsLikeOverview,
} from '@/shared/utils/gym-membership-admin.util';

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const { session } = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Obtener parámetros de query
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all'; // all, active, renewal, no-products, inactive, mix-pending, mix-dismissed
    const userType = searchParams.get('userType') || 'all'; // all, physical, online, both
    const offset = (page - 1) * limit;

    // Query principal: obtener clientes físicos con sus membresías más recientes
    let query = supabaseAdmin.from('gym_client_info').select(
      `
        id,
        name,
        email,
        whatsapp,
        document_id,
        birth_date,
        weight,
        is_inactive,
        medical_restrictions,
        created_at,
        user_id,
        gym_memberships (
          id,
          status,
          start_date,
          end_date,
          plan_id,
          plan:gym_plans (name, id)
        )
      `,
      { count: 'exact' },
    );

    // Aplicar búsqueda
    if (search) {
      query = query.or(
        `name.ilike.%${search}%,email.ilike.%${search}%,document_id.ilike.%${search}%`,
      );
    }

    // Aplicar filtro de inactivos
    if (status === 'inactive') {
      query = query.eq('is_inactive', true);
    } else if (status !== 'all') {
      // No filtrar inactivos en el query, se filtrará después
      query = query.or('is_inactive.eq.false,is_inactive.is.null');
    }

    // Ordenar y paginar
    query = query.order('created_at', { ascending: false });

    // Ejecutar query
    const { data: clients, error: clientsError, count } = await query;

    if (clientsError) {
      throw clientsError;
    }

    const clientIds = (clients || []).map((c: { id: string }) => c.id);
    const dismissalsByClient = new Map<string, string[]>();
    if (clientIds.length > 0) {
      const { data: dismissRows } = await supabaseAdmin
        .from('gym_renewal_followup_dismissals')
        .select('client_info_id, plan_id')
        .in('client_info_id', clientIds);
      for (const row of dismissRows || []) {
        const cid = row.client_info_id as string;
        const arr = dismissalsByClient.get(cid) || [];
        arr.push(row.plan_id as string);
        dismissalsByClient.set(cid, arr);
      }
    }

    const profileUserIds = [
      ...new Set(
        (clients || [])
          .map((c: { user_id?: string | null }) => c.user_id)
          .filter(Boolean),
      ),
    ] as string[];
    const avatarByUserId = new Map<
      string,
      { avatar_url: string | null; updated_at: string | null }
    >();
    if (profileUserIds.length > 0) {
      const { data: profRows } = await supabaseAdmin
        .from('profiles')
        .select('id, avatar_url, updated_at')
        .in('id', profileUserIds);
      for (const p of profRows || []) {
        const row = p as {
          id: string;
          avatar_url?: string | null;
          updated_at?: string | null;
        };
        avatarByUserId.set(row.id, {
          avatar_url: row.avatar_url ?? null,
          updated_at: row.updated_at ?? null,
        });
      }
    }

    const profileUserIdsForPurchases = profileUserIds;
    const purchasesByUserId = new Map<string, any[]>();
    if (profileUserIdsForPurchases.length > 0) {
      const { data: purchaseRows } = await supabaseAdmin
        .from('course_purchases')
        .select(
          `
          id,
          user_id,
          course_id,
          is_active,
          purchase_price,
          access_granted_at,
          course:courses(title, preview_image, thumbnail_url, duration_days)
        `,
        )
        .in('user_id', profileUserIdsForPurchases);

      const courseIds = [
        ...new Set(
          (purchaseRows || [])
            .map((p: any) => p.course_id)
            .filter(Boolean),
        ),
      ] as string[];
      const totalLessonsByCourse: Record<string, number> = {};
      if (courseIds.length > 0) {
        const { data: lessonsRows } = await supabaseAdmin
          .from('course_lessons')
          .select('course_id')
          .in('course_id', courseIds);
        (lessonsRows || []).forEach((r: any) => {
          totalLessonsByCourse[r.course_id] =
            (totalLessonsByCourse[r.course_id] || 0) + 1;
        });
      }
      const todayYmd = getTodayYmdForCourseEnrich();
      for (const row of purchaseRows || []) {
        const p = row as any;
        const enriched = enrichCoursePurchaseFromCalendarDays(
          p,
          totalLessonsByCourse,
          todayYmd,
        );
        const uid = p.user_id as string;
        const arr = purchasesByUserId.get(uid) || [];
        arr.push(enriched);
        purchasesByUserId.set(uid, arr);
      }
    }

    // Procesar clientes para agregar estados calculados (fechas locales, misma regla que overview de plan)
    const today = parseLocalDate(getTodayYmdColombia());
    today.setHours(0, 0, 0, 0);

    let processedClients = (clients || []).map((client: any) => {
      const memberships = client.gym_memberships || [];
      const { active, expired } = partitionGymMembershipsLikeOverview(
        memberships,
        today,
      );
      const nonCancelledCount = memberships.filter(
        (m: any) => m.status !== 'cancelled',
      ).length;

      const activeSorted = [...active].sort(
        (a: any, b: any) =>
          parseLocalDate(a.end_date).getTime() -
          parseLocalDate(b.end_date).getTime(),
      );
      const activeMembership = activeSorted[0] ?? null;

      const hasExpiredOnly =
        nonCancelledCount > 0 &&
        active.length === 0 &&
        expired.length === nonCancelledCount;

      // Calcular fecha más reciente de membresía (para ordenamiento)
      // Prioridad: membresías activas primero, luego por fecha de vencimiento más reciente
      let latestMembershipDate: Date | null = null;
      let sortPriority = 3; // 0=activo, 1=por renovar, 2=sin productos recientes, 3=sin productos

      if (memberships.length > 0) {
        const sortedMemberships = [...memberships]
          .filter((m: any) => m.status !== 'cancelled')
          .sort(
            (a: any, b: any) =>
              parseLocalDate(b.end_date).getTime() -
              parseLocalDate(a.end_date).getTime(),
          );

        if (sortedMemberships.length > 0) {
          latestMembershipDate = parseLocalDate(sortedMemberships[0].end_date);

          if (active.length > 0) {
            sortPriority = 0; // Activos primero
          } else {
            sortPriority = 1; // Por renovar segundo
          }
        }
      }

      const profileAvatar = client.user_id
        ? avatarByUserId.get(client.user_id)
        : undefined;

      const coursePurchases = client.user_id
        ? purchasesByUserId.get(client.user_id) || []
        : [];
      const activeCoursePurchases =
        coursePurchases.filter(
          (p: any) => p.is_active && !p.is_course_finished,
        ) || [];
      const hasGymMembership = memberships.length > 0;
      const hasOnlinePurchase = coursePurchases.length > 0;
      const userType =
        hasGymMembership && hasOnlinePurchase
          ? 'both'
          : hasGymMembership
            ? 'physical'
            : hasOnlinePurchase
              ? 'online'
              : 'none';

      const dismissedIds = dismissalsByClient.get(client.id) ?? [];
      const mixRenewalCategory = getMixRenewalFilterCategory(
        memberships,
        activeCoursePurchases,
        dismissedIds,
        today,
      );
      // Prioridad visual en listado:
      // 0 = Renovar (vencido), 1 = Activo + Renovación pendiente, 2 = resto
      const listPriority =
        hasExpiredOnly && !client.is_inactive
          ? 0
          : mixRenewalCategory === 'pending'
            ? 1
            : 2;

      return {
        id: client.id,
        name: client.name,
        email: client.email,
        avatar_url: profileAvatar?.avatar_url ?? null,
        avatar_updated_at: profileAvatar?.updated_at ?? null,
        phone: client.whatsapp,
        whatsapp: client.whatsapp,
        document_id: client.document_id,
        document_type: 'CC',
        birth_date: client.birth_date,
        weight: client.weight,
        created_at: client.created_at,
        is_inactive: client.is_inactive || false,
        renewal_followup_dismissed_plan_ids: dismissedIds,
        medical_restrictions: client.medical_restrictions,
        user_id: client.user_id,
        isRegistered: !!client.user_id,
        isUnregisteredClient: !client.user_id,
        gym_memberships: memberships,
        hasActiveGymMembership: active.length > 0,
        activeGymMembership: activeMembership,
        hasGymMembership,
        hasExpiredOnly,
        hasOnlinePurchase,
        userType,
        activeCoursePurchases,
        course_purchases: coursePurchases,
        mixRenewalCategory,
        listPriority,
        // Campos para ordenamiento
        latestMembershipDate,
        sortPriority,
      };
    });

    // Ordenar mostrando primero los que requieren acción de renovación,
    // y dentro de cada grupo por más recientes (created_at desc).
    processedClients.sort(
      (a, b) =>
        a.listPriority - b.listPriority ||
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );

    const counts = {
      total: processedClients.length,
      active: processedClients.filter((c) => c.hasActiveGymMembership).length,
      renewal: processedClients.filter(
        (c) => c.hasExpiredOnly && !c.is_inactive,
      ).length,
      noProducts: processedClients.filter((c) => !c.hasGymMembership).length,
      inactive: processedClients.filter((c) => c.is_inactive).length,
      mixPending: processedClients.filter(
        (c) => c.mixRenewalCategory === 'pending',
      ).length,
      mixDismissed: processedClients.filter(
        (c) => c.mixRenewalCategory === 'dismissed',
      ).length,
    };

    // Aplicar filtro de estado después de procesar
    if (status === 'active') {
      processedClients = processedClients.filter(
        (c) => c.hasActiveGymMembership,
      );
    } else if (status === 'renewal') {
      processedClients = processedClients.filter(
        (c) => c.hasExpiredOnly && !c.is_inactive,
      );
    } else if (status === 'no-products') {
      processedClients = processedClients.filter((c) => !c.hasGymMembership);
    } else if (status === 'mix-pending') {
      processedClients = processedClients.filter(
        (c) => c.mixRenewalCategory === 'pending',
      );
    } else if (status === 'mix-dismissed') {
      processedClients = processedClients.filter(
        (c) => c.mixRenewalCategory === 'dismissed',
      );
    }

    if (userType !== 'all') {
      processedClients = processedClients.filter(
        (c) => c.userType === userType,
      );
    }

    // Obtener estadísticas globales de pagos
    const stats = {
      totalMemberships: 0,
      totalRevenue: 0,
      lastPaymentDate: null as string | null,
      averageTicket: 0,
      thisMonthPayments: 0,
      thisMonthRevenue: 0,
    };

    try {
      // Total de membresías y pagos
      const { data: payments } = await supabaseAdmin
        .from('gym_payments')
        .select('amount, payment_date')
        .order('payment_date', { ascending: false });

      if (payments && payments.length > 0) {
        stats.totalMemberships = payments.length;
        stats.totalRevenue = payments.reduce(
          (sum, p) => sum + (p.amount || 0),
          0,
        );
        stats.lastPaymentDate = payments[0].payment_date;
        stats.averageTicket = Math.round(
          stats.totalRevenue / stats.totalMemberships,
        );

        // Pagos de este mes
        const thisMonth = new Date();
        thisMonth.setDate(1);
        thisMonth.setHours(0, 0, 0, 0);

        const thisMonthPayments = payments.filter(
          (p) => new Date(p.payment_date) >= thisMonth,
        );
        stats.thisMonthPayments = thisMonthPayments.length;
        stats.thisMonthRevenue = thisMonthPayments.reduce(
          (sum, p) => sum + (p.amount || 0),
          0,
        );
      }
    } catch (e) {}

    // Aplicar paginación después de filtrar
    const paginatedClients = processedClients.slice(offset, offset + limit);
    const totalFiltered = processedClients.length;

    return NextResponse.json({
      users: paginatedClients,
      pagination: {
        page,
        limit,
        total: totalFiltered,
        totalPages: Math.ceil(totalFiltered / limit),
      },
      counts,
      stats,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Error al obtener usuarios', details: error.message },
      { status: 500 },
    );
  }
}
