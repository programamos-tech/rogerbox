import { type NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET - Obtener todos los blogs publicados (servidor; RLS no aplica con rol anónimo en route handler)
export async function GET(_request: NextRequest) {
  try {
    const { data: blogs, error } = await supabaseAdmin
      .from('nutritional_blogs')
      .select('*')
      .eq('is_published', true)
      .order('published_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: 'Error al obtener los blogs' },
        { status: 500 },
      );
    }

    return NextResponse.json({ blogs });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}

// POST - Crear un nuevo blog (solo admin)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      author,
      reading_time,
      excerpt,
      content,
      featured_image_url,
      is_published: bodyPublished,
    } = body;

    const is_published = Boolean(bodyPublished);

    // Validaciones básicas
    if (!title || !author || !reading_time || !excerpt || !content) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 },
      );
    }

    // Generar slug automáticamente
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();

    const { data: blog, error } = await supabaseAdmin
      .from('nutritional_blogs')
      .insert({
        title,
        slug,
        author,
        reading_time,
        excerpt,
        content,
        featured_image_url,
        is_published,
        published_at: is_published ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Error al crear el blog' },
        { status: 500 },
      );
    }

    return NextResponse.json({ blog }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}
