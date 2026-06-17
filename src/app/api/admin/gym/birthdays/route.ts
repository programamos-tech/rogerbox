import { type NextRequest, NextResponse } from 'next/server';
import { getTodayYmdColombia } from '@/lib/dateUtils';
import { supabaseAdmin } from '@/lib/supabase';
import { getUser } from '@/lib/supabase-server';
import { filterBirthdayClients } from '@/shared/utils/birthday.util';

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

/** GET — Cumpleaños de clientes en un rango (por defecto: hoy, Colombia). */
export async function GET(request: NextRequest) {
  try {
    const { user } = await getUser();
    if (!isAdminUser(user)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const today = getTodayYmdColombia();
    const startDate = searchParams.get('start') || searchParams.get('date') || today;
    const endDate = searchParams.get('end') || searchParams.get('date') || today;

    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(startDate) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(endDate)
    ) {
      return NextResponse.json(
        { error: 'Fechas inválidas (use YYYY-MM-DD)' },
        { status: 400 },
      );
    }

    const { data: clients, error } = await supabaseAdmin
      .from('gym_client_info')
      .select('id, name, document_id, email, whatsapp, birth_date')
      .not('birth_date', 'is', null)
      .order('name', { ascending: true });

    if (error) {
      return NextResponse.json(
        { error: 'Error al obtener clientes' },
        { status: 500 },
      );
    }

    const birthdays = filterBirthdayClients(
      clients || [],
      startDate,
      endDate,
      endDate,
    );

    return NextResponse.json({
      startDate,
      endDate,
      count: birthdays.length,
      clients: birthdays,
    });
  } catch {
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}
