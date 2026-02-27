import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getSession } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debug API: Iniciando user-interactions');
    const { session } = await getSession();
    console.log('🔍 Debug API: Session:', session ? 'existe' : 'no existe');
    console.log('🔍 Debug API: User ID:', session?.user?.id);

    if (!session?.user?.id) {
      console.log('❌ Debug API: No hay sesión, devolviendo 401');
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

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Debug API: Error fetching user interactions:', error);
      return NextResponse.json({ error: 'Failed to fetch interactions' }, { status: 500 });
    }

    console.log('✅ Debug API: Interacciones encontradas:', data?.length || 0);

    return NextResponse.json({ interactions: data || [] });
  } catch (error) {
    console.error('Error in GET /api/user-interactions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
