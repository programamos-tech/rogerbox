import { type NextRequest, NextResponse } from 'next/server';
import { createClient, getSession } from '@/lib/supabase-server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: lessonId } = await params;
    if (!lessonId) {
      return NextResponse.json(
        { error: 'Lesson ID is required' },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    // Promedio y total de valoraciones (público)
    const { data: rows, error: aggError } = await supabase
      .from('lesson_ratings')
      .select('rating')
      .eq('lesson_id', lessonId);

    if (aggError) {
      return NextResponse.json(
        { error: 'Failed to load ratings' },
        { status: 500 },
      );
    }

    const total = rows?.length ?? 0;
    const average =
      total > 0
        ? Math.round(
            (rows!.reduce((sum, r) => sum + (r.rating ?? 0), 0) / total) * 10,
          ) / 10
        : 0;

    // Valoración del usuario actual (si está logueado)
    const { session } = await getSession();
    let userRating: number | null = null;
    if (session?.user?.id) {
      const { data: userRow } = await supabase
        .from('lesson_ratings')
        .select('rating')
        .eq('lesson_id', lessonId)
        .eq('user_id', session.user.id)
        .maybeSingle();
      userRating = userRow?.rating ?? null;
    }

    return NextResponse.json({
      average_rating: average,
      total_ratings: total,
      user_rating: userRating,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { session } = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: lessonId } = await params;
    if (!lessonId) {
      return NextResponse.json(
        { error: 'Lesson ID is required' },
        { status: 400 },
      );
    }

    const body = await request.json();
    const rating = typeof body.rating === 'number' ? body.rating : undefined;

    if (rating === undefined || rating === null) {
      return NextResponse.json(
        { error: 'Rating is required' },
        { status: 400 },
      );
    }
    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from('lesson_ratings')
      .upsert(
        {
          lesson_id: lessonId,
          user_id: session.user.id,
          rating,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'lesson_id,user_id' },
      )
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to update rating' },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      user_rating: data.rating,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
