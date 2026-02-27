import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET - Obtener todos los blogs publicados
export async function GET(request: NextRequest) {
  try {
    const { data: blogs, error } = await supabase
      .from('nutritional_blogs')
      .select('*')
      .eq('is_published', true)
      .order('published_at', { ascending: false });

    if (error) {
      console.error('Error fetching blogs:', error);
      return NextResponse.json(
        { error: 'Error al obtener los blogs' },
        { status: 500 }
      );
    }

    return NextResponse.json({ blogs });
  } catch (error) {
    console.error('Error in GET /api/blogs:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST - Crear un nuevo blog (solo admin)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, author, reading_time, excerpt, content, featured_image_url } = body;

    // Validaciones básicas
    if (!title || !author || !reading_time || !excerpt || !content) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    // Generar slug automáticamente
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();

    const { data: blog, error } = await supabase
      .from('nutritional_blogs')
      .insert({
        title,
        slug,
        author,
        reading_time,
        excerpt,
        content,
        featured_image_url,
        is_published: false, // Por defecto no publicado
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating blog:', error);
      return NextResponse.json(
        { error: 'Error al crear el blog' },
        { status: 500 }
      );
    }

    return NextResponse.json({ blog }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/blogs:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
