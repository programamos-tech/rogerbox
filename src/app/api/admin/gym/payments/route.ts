import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase';
import { GymPaymentInsert } from '@/types/gym';

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

// GET - Listar todos los pagos
export async function GET(request: NextRequest) {
  try {
    const { user } = await getUser();
    
    if (!isAdminUser(user)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get('payment_id');
    const membershipId = searchParams.get('membership_id');
    const clientInfoId = searchParams.get('client_info_id');
    const userId = searchParams.get('user_id');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    let query = supabaseAdmin
      .from('gym_payments')
      .select(`
        *,
        membership:gym_memberships(*),
        client_info:gym_client_info(*),
        plan:gym_plans(*)
      `)
      .order('payment_date', { ascending: false });

    // Si se busca por payment_id, devolver solo ese pago
    if (paymentId) {
      query = query.eq('id', paymentId);
      const { data, error } = await query.single();

      if (error) {
        console.error('Error fetching gym payment:', error);
        return NextResponse.json({ error: 'Error al obtener pago' }, { status: 500 });
      }

      return NextResponse.json({ payment: data });
    }

    if (membershipId) {
      query = query.eq('membership_id', membershipId);
    }

    if (clientInfoId) {
      query = query.eq('client_info_id', clientInfoId);
    }

    if (userId) {
      query = query.eq('user_id', userId);
    }

    if (startDate) {
      query = query.gte('payment_date', startDate);
    }

    if (endDate) {
      query = query.lte('payment_date', endDate);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching gym payments:', error);
      return NextResponse.json({ error: 'Error al obtener pagos' }, { status: 500 });
    }

    return NextResponse.json({ payments: data || [] });
  } catch (error) {
    console.error('Error in GET /api/admin/gym/payments:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// POST - Registrar nuevo pago
export async function POST(request: NextRequest) {
  try {
    const { user } = await getUser();
    
    if (!isAdminUser(user)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body: GymPaymentInsert = await request.json();
    const {
      membership_id,
      client_info_id,
      plan_id,
      amount,
      payment_method,
      payment_date,
      period_start,
      period_end,
      invoice_required,
      invoice_number,
      notes,
      user_id,
    } = body;

    // Validaciones
    if (!membership_id || !client_info_id || !plan_id || !amount || !payment_method || !payment_date || !period_start || !period_end) {
      return NextResponse.json(
        { error: 'Todos los campos requeridos deben estar presentes' },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: 'El monto debe ser mayor a 0' },
        { status: 400 }
      );
    }

    // Verificar que la membresía existe
    const { data: membership, error: membershipError } = await supabaseAdmin
      .from('gym_memberships')
      .select('id, client_info_id, user_id')
      .eq('id', membership_id)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json({ error: 'Membresía no encontrada' }, { status: 404 });
    }

    // Verificar que el cliente coincide
    if (membership.client_info_id !== client_info_id) {
      return NextResponse.json(
        { error: 'El cliente no coincide con la membresía' },
        { status: 400 }
      );
    }

    // Usar user_id de la membresía si existe, o el proporcionado
    const finalUserId = user_id || membership.user_id || null;

    // Generar invoice_number automáticamente si no se proporciona
    let finalInvoiceNumber = invoice_number;
    if (!finalInvoiceNumber) {
      // Contar todos los pagos existentes para generar el siguiente número secuencial
      const { count, error: countError } = await supabaseAdmin
        .from('gym_payments')
        .select('*', { count: 'exact', head: true });
      
      if (!countError && count !== null) {
        // Generar número secuencial: #0001, #0002, etc.
        finalInvoiceNumber = (count + 1).toString().padStart(4, '0');
      } else {
        // Si hay error al contar, usar timestamp como fallback
        finalInvoiceNumber = Date.now().toString().slice(-4);
      }
    }

    const { data, error } = await supabaseAdmin
      .from('gym_payments')
      .insert({
        membership_id,
        user_id: finalUserId,
        client_info_id,
        plan_id,
        amount,
        payment_method,
        payment_date,
        period_start,
        period_end,
        invoice_required: invoice_required || false,
        invoice_number: finalInvoiceNumber,
        invoice_pdf_url: null, // Se generará después si es necesario
        notes: notes || null,
        created_by: user?.id,
      })
      .select(`
        *,
        membership:gym_memberships(*),
        client_info:gym_client_info(*),
        plan:gym_plans(*)
      `)
      .single();

    if (error) {
      console.error('Error creating gym payment:', error);
      return NextResponse.json({ error: 'Error al registrar pago' }, { status: 500 });
    }

    // Actualizar la membresía a 'active' si estaba en otro estado
    if (membership.status !== 'active') {
      await supabaseAdmin
        .from('gym_memberships')
        .update({ status: 'active', updated_at: new Date().toISOString() })
        .eq('id', membership_id);
    }

    // Crear orden en la tabla orders para tracking de ventas
    await supabaseAdmin
      .from('orders')
      .insert({
        user_id: finalUserId,
        gym_plan_id: plan_id,
        order_type: 'gym_plan',
        amount,
        currency: 'COP',
        status: 'approved',
        payment_method,
        customer_email: data.client_info?.email || null,
        customer_name: data.client_info?.name || '',
        created_at: new Date().toISOString(),
      });

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/admin/gym/payments:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
