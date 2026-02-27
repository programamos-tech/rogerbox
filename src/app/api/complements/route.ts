import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const difficulty = searchParams.get('difficulty');
    const isNew = searchParams.get('is_new');

    let query = supabase
      .from('complements')
      .select(`
        *,
        complement_stats (
          total_views,
          total_favorites,
          average_rating,
          total_ratings
        )
      `)
      .eq('is_active', true);

    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    if (difficulty && difficulty !== 'all') {
      query = query.eq('difficulty', difficulty);
    }

    if (isNew === 'true') {
      query = query.eq('is_new', true);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching complements:', error);
      return NextResponse.json({ error: 'Failed to fetch complements' }, { status: 500 });
    }

    return NextResponse.json({ complements: data });
  } catch (error) {
    console.error('Error in GET /api/complements:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, video_url, thumbnail_url, duration, category, difficulty, is_new, recommended_for } = body;

    const { data, error } = await supabase
      .from('complements')
      .insert({
        title,
        description,
        video_url,
        thumbnail_url,
        duration,
        category,
        difficulty,
        is_new: is_new || false,
        recommended_for: recommended_for || []
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating complement:', error);
      return NextResponse.json({ error: 'Failed to create complement' }, { status: 500 });
    }

    // Crear entrada inicial en complement_stats
    await supabase
      .from('complement_stats')
      .insert({
        complement_id: data.id,
        total_views: 0,
        total_favorites: 0,
        average_rating: 0,
        total_ratings: 0
      });

    return NextResponse.json({ complement: data }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/complements:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
