import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getSession } from '@/lib/supabase-server';

export async function POST(request: Request) {
  try {
    const { session } = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { lesson_id, course_id, duration_watched } = await request.json();

    if (!lesson_id || !course_id) {
      return NextResponse.json({ error: 'lesson_id y course_id son requeridos' }, { status: 400 });
    }

    // Insertar o actualizar la completación
    const { data, error } = await supabaseAdmin
      .from('user_lesson_completions')
      .upsert({
        user_id: session.user.id,
        course_id,
        lesson_id,
        duration_watched: duration_watched || 0,
        completed_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,lesson_id'
      })
      .select()
      .single();

    if (error) {
      console.error('Error marking lesson complete:', error);
      throw error;
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error in lesson complete API:', error);
    return NextResponse.json({ error: 'Error al marcar lección como completada' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { session } = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const course_id = searchParams.get('course_id');

    let query = supabaseAdmin
      .from('user_lesson_completions')
      .select('*')
      .eq('user_id', session.user.id);

    if (course_id) {
      query = query.eq('course_id', course_id);
    }

    const { data, error } = await query.order('completed_at', { ascending: true });

    if (error) {
      console.error('Error fetching completions:', error);
      throw error;
    }

    return NextResponse.json({ completions: data || [] });
  } catch (error) {
    console.error('Error in lesson completions API:', error);
    return NextResponse.json({ error: 'Error al obtener completaciones' }, { status: 500 });
  }
}



