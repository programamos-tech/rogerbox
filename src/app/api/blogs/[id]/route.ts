import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET - Obtener un blog específico por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { data: blog, error } = await supabaseAdmin
      .from('nutritional_blogs')
      .select('*')
      .eq('id', id)
      .eq('is_published', true)
      .single();

    if (error) {
      console.error('Error fetching blog:', error);
      return NextResponse.json(
        { error: 'Blog no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ blog });
  } catch (error) {
    console.error('Error in GET /api/blogs/[id]:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar un blog (solo admin)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, author, reading_time, excerpt, content, featured_image_url, is_published } = body;

    // Validaciones básicas
    if (!title || !author || !reading_time || !excerpt || !content) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    // Generar slug automáticamente si el título cambió
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();

    const updateData: any = {
      title,
      slug,
      author,
      reading_time,
      excerpt,
      content,
      featured_image_url,
      is_published,
    };

    // Si se está publicando por primera vez, establecer published_at
    if (is_published) {
      const { data: existingBlog } = await supabaseAdmin
        .from('nutritional_blogs')
        .select('published_at')
        .eq('id', id)
        .single();

      if (!existingBlog?.published_at) {
        updateData.published_at = new Date().toISOString();
      }
    }

    const { data: blog, error } = await supabaseAdmin
      .from('nutritional_blogs')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating blog:', error);
      return NextResponse.json(
        { error: 'Error al actualizar el blog' },
        { status: 500 }
      );
    }

    return NextResponse.json({ blog });
  } catch (error) {
    console.error('Error in PUT /api/blogs/[id]:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar un blog (solo admin)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { error } = await supabaseAdmin
      .from('nutritional_blogs')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting blog:', error);
      return NextResponse.json(
        { error: 'Error al eliminar el blog' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Blog eliminado exitosamente' });
  } catch (error) {
    console.error('Error in DELETE /api/blogs/[id]:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
