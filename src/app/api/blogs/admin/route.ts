import { type NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET - Obtener todos los blogs para el admin (incluyendo no publicados)
export async function GET(_request: NextRequest) {
  try {
    const { data: blogs, error } = await supabase
      .from('nutritional_blogs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: 'Error al obtener los blogs' },
        { status: 500 },
      );
    }

    return NextResponse.json({ blogs });
  } catch (_error) {
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}
