import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { data, error } = await supabase
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
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (error) {
      console.error('Error fetching complement:', error);
      return NextResponse.json({ error: 'Complement not found' }, { status: 404 });
    }

    return NextResponse.json({ complement: data });
  } catch (error) {
    console.error('Error in GET /api/complements/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, description, video_url, thumbnail_url, duration, category, difficulty, is_new, recommended_for } = body;

    const { data, error } = await supabase
      .from('complements')
      .update({
        title,
        description,
        video_url,
        thumbnail_url,
        duration,
        category,
        difficulty,
        is_new: is_new || false,
        recommended_for: recommended_for || [],
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating complement:', error);
      return NextResponse.json({ error: 'Failed to update complement' }, { status: 500 });
    }

    return NextResponse.json({ complement: data });
  } catch (error) {
    console.error('Error in PUT /api/complements/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { error } = await supabase
      .from('complements')
      .update({ is_active: false })
      .eq('id', id);

    if (error) {
      console.error('Error deleting complement:', error);
      return NextResponse.json({ error: 'Failed to delete complement' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Complement deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE /api/complements/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
