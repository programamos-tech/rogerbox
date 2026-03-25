import { type NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getSession } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const week = searchParams.get('week');
    const year = searchParams.get('year');

    if (!week || !year) {
      return NextResponse.json(
        { error: 'Semana y año son requeridos' },
        { status: 400 },
      );
    }

    const { data: complements, error } = await supabaseAdmin
      .from('weekly_complements')
      .select('*')
      .eq('week_number', parseInt(week, 10))
      .eq('year', parseInt(year, 10))
      .order('day_of_week', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ complements });
  } catch (_error) {
    return NextResponse.json(
      { error: 'Error al obtener retos' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { session } = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const {
      week_number,
      year,
      day_of_week,
      title,
      description,
      mux_playback_id,
    } = body;

    if (!week_number || !year || !day_of_week || !title || !mux_playback_id) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 },
      );
    }

    const { data, error } = await supabaseAdmin
      .from('weekly_complements')
      .insert({
        week_number: Number(week_number),
        year: Number(year),
        day_of_week: Number(day_of_week),
        title: String(title).trim(),
        description:
          description != null ? String(description).trim() || null : null,
        mux_playback_id: String(mux_playback_id).trim(),
        is_published: false,
      })
      .select()
      .single();

    if (error) {
      console.error('[admin/complements POST] Supabase error:', error);
      return NextResponse.json(
        { error: error.message || 'Error al crear reto' },
        { status: 500 },
      );
    }

    return NextResponse.json({ complement: data });
  } catch (err: unknown) {
    const message =
      err && typeof err === 'object' && 'message' in err
        ? String((err as { message: string }).message)
        : 'Error al crear reto';
    console.error('[admin/complements POST]', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
