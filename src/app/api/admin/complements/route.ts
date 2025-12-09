import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getSession } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const week = searchParams.get('week');
    const year = searchParams.get('year');

    if (!week || !year) {
      return NextResponse.json({ error: 'Semana y año son requeridos' }, { status: 400 });
    }

    const { data: complements, error } = await supabaseAdmin
      .from('weekly_complements')
      .select('*')
      .eq('week_number', parseInt(week))
      .eq('year', parseInt(year))
      .order('day_of_week', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ complements });
  } catch (error) {
    console.error('Error fetching complements:', error);
    return NextResponse.json({ error: 'Error al obtener complementos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { session } = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { week_number, year, day_of_week, title, description, mux_playback_id } = body;

    if (!week_number || !year || !day_of_week || !title || !mux_playback_id) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('weekly_complements')
      .insert({
        week_number,
        year,
        day_of_week,
        title,
        description,
        mux_playback_id,
        is_published: false,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ complement: data });
  } catch (error) {
    console.error('Error creating complement:', error);
    return NextResponse.json({ error: 'Error al crear complemento' }, { status: 500 });
  }
}



