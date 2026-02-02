import { NextResponse, NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getSession } from '@/lib/supabase-server';

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
    const status = searchParams.get('status') || 'all'; // all, active, renewal, no-products, inactive
    const offset = (page - 1) * limit;

    // Query principal: obtener clientes físicos con sus membresías más recientes
    let query = supabaseAdmin
      .from('gym_client_info')
      .select(`
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
          plan:gym_plans (name)
        )
      `, { count: 'exact' });

    // Aplicar búsqueda
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,document_id.ilike.%${search}%`);
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
      console.error('Error fetching clients:', clientsError);
      throw clientsError;
    }

    // Procesar clientes para agregar estados calculados
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let processedClients = (clients || []).map((client: any) => {
      const memberships = client.gym_memberships || [];
      
      // Encontrar membresía activa
      const activeMembership = memberships.find((m: any) => {
        const endDate = new Date(m.end_date);
        endDate.setHours(0, 0, 0, 0);
        return m.status !== 'cancelled' && endDate >= today;
      });

      // Verificar si todas las membresías están vencidas
      const hasExpiredOnly = memberships.length > 0 && !activeMembership && 
        memberships.every((m: any) => {
          const endDate = new Date(m.end_date);
          endDate.setHours(0, 0, 0, 0);
          return m.status !== 'cancelled' && endDate < today;
        });

      // Calcular fecha más reciente de membresía (para ordenamiento)
      // Prioridad: membresías activas primero, luego por fecha de vencimiento más reciente
      let latestMembershipDate: Date | null = null;
      let sortPriority = 3; // 0=activo, 1=por renovar, 2=sin productos recientes, 3=sin productos
      
      if (memberships.length > 0) {
        // Ordenar membresías por end_date descendente
        const sortedMemberships = [...memberships]
          .filter((m: any) => m.status !== 'cancelled')
          .sort((a: any, b: any) => new Date(b.end_date).getTime() - new Date(a.end_date).getTime());
        
        if (sortedMemberships.length > 0) {
          latestMembershipDate = new Date(sortedMemberships[0].end_date);
          
          if (activeMembership) {
            sortPriority = 0; // Activos primero
          } else {
            sortPriority = 1; // Por renovar segundo
          }
        }
      }

      return {
        id: client.id,
        name: client.name,
        email: client.email,
        phone: client.whatsapp,
        whatsapp: client.whatsapp,
        document_id: client.document_id,
        document_type: 'CC',
        birth_date: client.birth_date,
        weight: client.weight,
        created_at: client.created_at,
        is_inactive: client.is_inactive || false,
        medical_restrictions: client.medical_restrictions,
        user_id: client.user_id,
        isRegistered: !!client.user_id,
        isUnregisteredClient: !client.user_id,
        gym_memberships: memberships,
        hasActiveGymMembership: !!activeMembership,
        activeGymMembership: activeMembership || null,
        hasGymMembership: memberships.length > 0,
        hasExpiredOnly,
        hasOnlinePurchase: false,
        userType: 'physical',
        activeCoursePurchases: [],
        course_purchases: [],
        // Campos para ordenamiento
        latestMembershipDate,
        sortPriority,
      };
    });

    // Ordenar clientes por relevancia:
    // 1. Activos (membresía vigente) - por fecha de vencimiento más lejana
    // 2. Por renovar (membresía vencida recientemente) - por fecha más reciente
    // 3. Sin productos - por fecha de creación
    processedClients.sort((a, b) => {
      // Primero por prioridad (activos > renovar > sin productos)
      if (a.sortPriority !== b.sortPriority) {
        return a.sortPriority - b.sortPriority;
      }
      
      // Dentro de la misma prioridad, ordenar por fecha de membresía más reciente
      if (a.latestMembershipDate && b.latestMembershipDate) {
        return b.latestMembershipDate.getTime() - a.latestMembershipDate.getTime();
      }
      
      // Si uno tiene membresía y otro no, el que tiene va primero
      if (a.latestMembershipDate && !b.latestMembershipDate) return -1;
      if (!a.latestMembershipDate && b.latestMembershipDate) return 1;
      
      // Sin membresías, ordenar por fecha de creación
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    // Aplicar filtro de estado después de procesar
    if (status === 'active') {
      processedClients = processedClients.filter(c => c.hasActiveGymMembership);
    } else if (status === 'renewal') {
      processedClients = processedClients.filter(c => c.hasExpiredOnly && !c.is_inactive);
    } else if (status === 'no-products') {
      processedClients = processedClients.filter(c => !c.hasGymMembership);
    }

    // Calcular totales para los contadores
    const allClientsForCount = (clients || []).map((client: any) => {
      const memberships = client.gym_memberships || [];
      const activeMembership = memberships.find((m: any) => {
        const endDate = new Date(m.end_date);
        endDate.setHours(0, 0, 0, 0);
        return m.status !== 'cancelled' && endDate >= today;
      });
      const hasExpiredOnly = memberships.length > 0 && !activeMembership && 
        memberships.every((m: any) => {
          const endDate = new Date(m.end_date);
          endDate.setHours(0, 0, 0, 0);
          return m.status !== 'cancelled' && endDate < today;
        });
      return {
        hasActiveGymMembership: !!activeMembership,
        hasExpiredOnly,
        hasGymMembership: memberships.length > 0,
        is_inactive: client.is_inactive || false,
      };
    });

    const counts = {
      total: count || 0,
      active: allClientsForCount.filter(c => c.hasActiveGymMembership).length,
      renewal: allClientsForCount.filter(c => c.hasExpiredOnly && !c.is_inactive).length,
      noProducts: allClientsForCount.filter(c => !c.hasGymMembership).length,
      inactive: allClientsForCount.filter(c => c.is_inactive).length,
    };

    // Obtener estadísticas globales de pagos
    let stats = {
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
        stats.totalRevenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
        stats.lastPaymentDate = payments[0].payment_date;
        stats.averageTicket = Math.round(stats.totalRevenue / stats.totalMemberships);

        // Pagos de este mes
        const thisMonth = new Date();
        thisMonth.setDate(1);
        thisMonth.setHours(0, 0, 0, 0);
        
        const thisMonthPayments = payments.filter(p => new Date(p.payment_date) >= thisMonth);
        stats.thisMonthPayments = thisMonthPayments.length;
        stats.thisMonthRevenue = thisMonthPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
      }
    } catch (e) {
      console.warn('Error fetching payment stats:', e);
    }

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
    console.error('Error in users API:', error);
    return NextResponse.json(
      { error: 'Error al obtener usuarios', details: error.message },
      { status: 500 }
    );
  }
}
