import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase';
import { CollectionItem } from '@/types/gym';

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

// GET - Obtener lista de cobranza (deudores)
export async function GET(request: NextRequest) {
  try {
    const { user } = await getUser();
    
    if (!isAdminUser(user)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const daysOverdue = searchParams.get('days_overdue'); // Filtrar por días vencidos
    const status = searchParams.get('status') || 'expired'; // Por defecto solo vencidos

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    // Obtener TODOS los clientes físicos
    const { data: allClients, error: clientsError } = await supabaseAdmin
      .from('gym_client_info')
      .select('id, name, document_id, whatsapp, email');

    if (clientsError) {
      console.error('Error fetching clients:', clientsError);
      return NextResponse.json({ error: 'Error al obtener clientes' }, { status: 500 });
    }

    if (!allClients || allClients.length === 0) {
      return NextResponse.json([]);
    }

    // Obtener todas las membresías (activas y vencidas) de estos clientes
    const clientIds = allClients.map(c => c.id);
    let membershipsQuery = supabaseAdmin
      .from('gym_memberships')
      .select(`
        id,
        user_id,
        client_info_id,
        plan_id,
        start_date,
        end_date,
        status,
        plan:gym_plans(
          id,
          name,
          price
        )
      `)
      .in('client_info_id', clientIds)
      .order('end_date', { ascending: false });

    const { data: allMemberships, error: membershipsError } = await membershipsQuery;

    if (membershipsError) {
      console.error('Error fetching memberships:', membershipsError);
      return NextResponse.json({ error: 'Error al obtener membresías' }, { status: 500 });
    }

    // Obtener todos los pagos para calcular cuáles clientes están al día
    const { data: allPayments, error: paymentsError } = await supabaseAdmin
      .from('gym_payments')
      .select('membership_id, client_info_id, payment_date, period_start, period_end, amount')
      .in('client_info_id', clientIds)
      .order('payment_date', { ascending: false });

    if (paymentsError) {
      console.error('Error fetching payments:', paymentsError);
    }

    // Identificar clientes que NO están al día
    const clientsNotUpToDate: CollectionItem[] = [];

    for (const client of allClients) {
      // Buscar membresías activas del cliente
      const activeMemberships = (allMemberships || []).filter(
        m => m.client_info_id === client.id && m.status === 'active'
      );

      // Buscar la membresía activa más reciente
      const latestActiveMembership = activeMemberships.length > 0 
        ? activeMemberships.sort((a, b) => new Date(b.end_date).getTime() - new Date(a.end_date).getTime())[0]
        : null;

      // Buscar pagos del cliente
      const clientPayments = (allPayments || []).filter(p => p.client_info_id === client.id);

      // Determinar si el cliente está al día
      let isUpToDate = false;

      if (latestActiveMembership) {
        // Si tiene membresía activa, verificar que la fecha de fin sea >= hoy
        const endDate = new Date(latestActiveMembership.end_date);
        endDate.setHours(0, 0, 0, 0);
        
        if (endDate >= today) {
          // Verificar si hay pagos que cubran hasta hoy o más
          const coveringPayments = clientPayments.filter(p => {
            const periodEnd = new Date(p.period_end);
            periodEnd.setHours(0, 0, 0, 0);
            return periodEnd >= today;
          });

          isUpToDate = coveringPayments.length > 0 || endDate >= today;
        }
      } else {
        // No tiene membresía activa, verificar si tiene membresías vencidas
        const expiredMemberships = (allMemberships || []).filter(
          m => m.client_info_id === client.id && m.status === 'expired'
        );

        if (expiredMemberships.length > 0) {
          // Tiene membresías vencidas, no está al día
          isUpToDate = false;
        } else {
          // No tiene membresías, verificar si tiene pagos recientes
          const recentPayments = clientPayments.filter(p => {
            const periodEnd = new Date(p.period_end);
            periodEnd.setHours(0, 0, 0, 0);
            return periodEnd >= today;
          });
          isUpToDate = recentPayments.length > 0;
        }
      }

      // Solo agregar a cobranza si tiene al menos una membresía registrada
      const allClientMemberships = (allMemberships || []).filter(m => m.client_info_id === client.id);
      const hasAnyMembership = allClientMemberships.length > 0;
      
      // Si no está al día Y tiene al menos una membresía, agregarlo a la lista de cobranza
      if (!isUpToDate && hasAnyMembership) {
        // Buscar la membresía más reciente (activa o vencida) para mostrar información
        const latestMembership = allClientMemberships.length > 0
          ? allClientMemberships.sort((a, b) => new Date(b.end_date).getTime() - new Date(a.end_date).getTime())[0]
          : null;

        // Buscar último pago
        const lastPayment = clientPayments.length > 0 ? clientPayments[0] : null;

        let daysOverdue = 0;
        let membershipEndDate = todayStr;
        let planName = 'Sin plan';
        let planPrice = 0;

        if (latestMembership) {
          const endDate = new Date(latestMembership.end_date);
          endDate.setHours(0, 0, 0, 0);
          daysOverdue = Math.floor((today.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24));
          membershipEndDate = latestMembership.end_date;
          planName = latestMembership.plan?.name || 'Plan desconocido';
          planPrice = latestMembership.plan?.price || 0;
        } else if (lastPayment) {
          // Si no tiene membresía pero tiene pagos, calcular días desde el último período
          const periodEnd = new Date(lastPayment.period_end);
          periodEnd.setHours(0, 0, 0, 0);
          daysOverdue = Math.floor((today.getTime() - periodEnd.getTime()) / (1000 * 60 * 60 * 24));
          membershipEndDate = lastPayment.period_end;
        } else {
          // Cliente sin membresías ni pagos
          daysOverdue = 999; // Un número alto para indicar que nunca ha pagado
        }

        // Aplicar filtro de días si está especificado (se aplicará después)

        clientsNotUpToDate.push({
          membership_id: latestMembership?.id || '',
          client_info_id: client.id,
          user_id: latestMembership?.user_id || null,
          client_name: client.name || 'Sin nombre',
          document_id: client.document_id || '',
          whatsapp: client.whatsapp || '',
          email: client.email || null,
          plan_name: planName,
          plan_price: planPrice,
          membership_start_date: latestMembership?.start_date || todayStr,
          membership_end_date: membershipEndDate,
          days_overdue: daysOverdue,
          status: latestMembership?.status as 'active' | 'expired' | 'cancelled' | 'courtesy' || 'expired',
          last_payment_date: lastPayment?.payment_date || null,
          last_payment_amount: lastPayment?.amount || null,
        });
      }
    }

    // Aplicar filtro de días vencidos si está especificado
    let filteredResults = clientsNotUpToDate;
    if (daysOverdue && daysOverdue !== 'all') {
      const filterDaysNum = parseInt(daysOverdue);
      filteredResults = clientsNotUpToDate.filter(item => item.days_overdue <= filterDaysNum);
    }

    // Ordenar por días vencidos (mayor a menor)
    filteredResults.sort((a, b) => b.days_overdue - a.days_overdue);

    return NextResponse.json(filteredResults);
  } catch (error) {
    console.error('Error in GET /api/admin/gym/collections:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
