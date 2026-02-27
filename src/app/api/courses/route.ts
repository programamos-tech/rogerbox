import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/supabase-server';
import { supabase } from '@/lib/supabase';
import { generateUniqueSlug } from '@/lib/slugUtils';

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación con Supabase Auth
    const { session } = await getSession();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { 
      title, 
      short_description, 
      description, 
      price, 
      discount_percentage = 0,
      category, 
      level, 
      duration_days,
      preview_image,
      intro_video_url,
      calories_burned = 0
    } = body;

    // Validar datos requeridos
    if (!title || !price || !category || !level) {
      return NextResponse.json(
        { error: 'Datos requeridos faltantes' },
        { status: 400 }
      );
    }

    // Obtener slugs existentes para generar uno único
    const { data: existingCourses } = await supabase
      .from('courses')
      .select('slug');

    const existingSlugs = existingCourses?.map(course => course.slug) || [];
    
    // Generar slug único
    const slug = generateUniqueSlug(title, existingSlugs);

    // Calcular precios correctamente
    let finalPrice = price;
    let originalPrice = null;
    
    if (discount_percentage > 0) {
      // Si hay descuento, el precio ingresado es el precio original
      originalPrice = price;
      finalPrice = Math.round(price * (1 - discount_percentage / 100));
    }

    // Crear el curso
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .insert({
        title,
        short_description,
        description,
        price: finalPrice, // Precio final con descuento aplicado
        original_price: originalPrice, // Precio original sin descuento
        discount_percentage,
        category,
        level,
        duration_days,
        preview_image,
        intro_video_url,
        calories_burned,
        slug,
        is_published: false, // Por defecto no publicado
        created_by: session.user.id
      })
      .select()
      .single();

    if (courseError) {
      console.error('Error creating course:', courseError);
      return NextResponse.json(
        { error: 'Error al crear el curso' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      course: {
        id: course.id,
        title: course.title,
        slug: course.slug,
        price: course.price,
        is_published: course.is_published
      }
    });

  } catch (error) {
    console.error('Error in create course:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const published = searchParams.get('published');
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '10');

    let query = supabase
      .from('courses')
      .select('id, title, slug, short_description, price, discount_percentage, category, level, duration_days, preview_image, students_count, rating, is_published, created_at')
      .order('created_at', { ascending: false })
      .limit(limit);

    // Filtrar por estado de publicación
    if (published === 'true') {
      query = query.eq('is_published', true);
    } else if (published === 'false') {
      query = query.eq('is_published', false);
    }

    // Filtrar por categoría
    if (category) {
      query = query.eq('category', category);
    }

    const { data: courses, error } = await query;

    if (error) {
      console.error('Error fetching courses:', error);
      return NextResponse.json(
        { error: 'Error al obtener los cursos' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      courses: courses || []
    });

  } catch (error) {
    console.error('Error in get courses:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
