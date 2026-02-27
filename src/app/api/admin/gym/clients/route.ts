import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase';
import { insertLog, STORE_ID_FISICA } from '@/lib/logs-service';
import { GymClientInfoInsert, GymClientInfoUpdate } from '@/types/gym';

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

// GET - Listar todos los clientes
export async function GET(request: NextRequest) {
  try {
    const { user } = await getUser();
    
    if (!isAdminUser(user)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const registeredOnly = searchParams.get('registered_only') === 'true';
    const unregisteredOnly = searchParams.get('unregistered_only') === 'true';
    const search = searchParams.get('search');

    let query = supabaseAdmin
      .from('gym_client_info')
      .select('*')
      .order('created_at', { ascending: false });

    if (registeredOnly) {
      query = query.not('user_id', 'is', null);
    }

    if (unregisteredOnly) {
      query = query.is('user_id', null);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,document_id.ilike.%${search}%,whatsapp.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching gym clients:', error);
      return NextResponse.json({ error: 'Error al obtener clientes' }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error in GET /api/admin/gym/clients:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// POST - Crear nuevo cliente
export async function POST(request: NextRequest) {
  try {
    const { user } = await getUser();
    
    if (!isAdminUser(user)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body: GymClientInfoInsert = await request.json();
    const { document_id, name, email, whatsapp, birth_date, weight, medical_restrictions } = body;

    // Validaciones
    if (!document_id || !name || !whatsapp) {
      return NextResponse.json(
        { error: 'Cédula, nombre y WhatsApp son requeridos' },
        { status: 400 }
      );
    }

    // Validar que el WhatsApp tenga al menos 10 dígitos
    const digitsOnly = whatsapp.replace(/\D/g, '');
    if (digitsOnly.length < 10) {
      return NextResponse.json(
        { error: 'El WhatsApp debe tener al menos 10 dígitos' },
        { status: 400 }
      );
    }

    // Verificar si ya existe un cliente con esa cédula
    const { data: existing } = await supabaseAdmin
      .from('gym_client_info')
      .select('id')
      .eq('document_id', document_id.trim())
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Ya existe un cliente con esta cédula' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('gym_client_info')
      .insert({
        document_id: document_id.trim(),
        name: name.trim(),
        email: email?.trim() || null,
        whatsapp: whatsapp.trim(),
        birth_date: birth_date || null,
        weight: weight || null,
        medical_restrictions: medical_restrictions?.trim() || null,
        store_id: STORE_ID_FISICA,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating gym client:', error);
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Ya existe un cliente con esta cédula' },
          { status: 400 }
        );
      }
      return NextResponse.json({ error: 'Error al crear cliente' }, { status: 500 });
    }

    // Log de actividad (andres.st · Sede Física)
    await insertLog({
      user_id: user?.id ?? null,
      action: 'client_create',
      module: 'gym',
      details: { client_info_id: data.id, name: data.name, description: `Nuevo cliente: ${data.name}` },
      store_id: STORE_ID_FISICA,
    });

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/admin/gym/clients:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
