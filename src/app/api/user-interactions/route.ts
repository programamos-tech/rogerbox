import { type NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getSession } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const { session } = await getSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'favorites', 'completed', 'rated'

    // Consulta simple sin JOIN (el complement_id puede ser de complements o weekly_complements)
    let query = supabaseAdmin
      .from('user_complement_interactions')
      .select('*')
      .eq('user_id', session.user.id);

    if (type === 'favorites') {
      query = query.eq('is_favorite', true);
    } else if (type === 'completed') {
      query = query.eq('is_completed', true);
    } else if (type === 'rated') {
      query = query.not('user_rating', 'is', null);
    }

    const { data, error } = await query.order('created_at', {
      ascending: false,
    });

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch interactions' },
        { status: 500 },
      );
    }

    return NextResponse.json({ interactions: data || [] });
  } catch (_error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
