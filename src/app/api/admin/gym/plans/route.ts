import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase';
import { GymPlanInsert, GymPlanUpdate } from '@/types/gym';

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

// GET - Listar todos los planes
export async function GET(request: NextRequest) {
  try {
    const { user } = await getUser();
    
    if (!isAdminUser(user)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active_only') === 'true';

    let query = supabaseAdmin
      .from('gym_plans')
      .select('*')
      .order('created_at', { ascending: false });

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching gym plans:', error);
      return NextResponse.json({ error: 'Error al obtener planes' }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error in GET /api/admin/gym/plans:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// POST - Crear nuevo plan
export async function POST(request: NextRequest) {
  try {
    const { user } = await getUser();
    
    if (!isAdminUser(user)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body: GymPlanInsert = await request.json();
    const { name, description, price, duration_days, is_active } = body;

    // Validaciones
    if (!name || !price || !duration_days) {
      return NextResponse.json(
        { error: 'Nombre, precio y duración son requeridos' },
        { status: 400 }
      );
    }

    if (price <= 0) {
      return NextResponse.json(
        { error: 'El precio debe ser mayor a 0' },
        { status: 400 }
      );
    }

    if (duration_days <= 0) {
      return NextResponse.json(
        { error: 'La duración debe ser mayor a 0 días' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('gym_plans')
      .insert({
        name: name.trim(),
        description: description?.trim() || null,
        price,
        duration_days,
        is_active: is_active !== undefined ? is_active : true,
        created_by: user?.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating gym plan:', error);
      return NextResponse.json({ error: 'Error al crear plan' }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/admin/gym/plans:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
