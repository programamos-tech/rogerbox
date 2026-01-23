import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getSession } from '@/lib/supabase-server';

function normalizeEmail(val?: string | null) {
  return (val || '').trim().toLowerCase();
}

function isAdminUser(user: { id?: string; email?: string; user_metadata?: any } | null) {
  if (!user) return false;
  const envId = (process.env.NEXT_PUBLIC_ADMIN_USER_ID || '').trim();
  const envEmail = normalizeEmail(process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'rogerbox@admin.com');
  const matchId = !!envId && user.id === envId;
  const matchEmail = normalizeEmail(user.email) === envEmail;
  const matchRole = user.user_metadata?.role === 'admin';
  return Boolean(matchId || matchEmail || matchRole);
}

export async function GET(request: Request) {
  // Solo permitir en desarrollo o para admins
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  try {
    const { session } = await getSession();
    
    // En producción, solo admins pueden acceder
    if (process.env.NODE_ENV === 'production' && (!session?.user || !isAdminUser(session.user))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const complement_id = searchParams.get('complement_id');
    const user_id = searchParams.get('user_id');

    if (!complement_id || !user_id) {
      return NextResponse.json({ error: 'complement_id and user_id are required' }, { status: 400 });
    }

    console.log('🔍 Debug: Buscando interacciones para:', { complement_id, user_id });

    const { data, error } = await supabase
      .from('user_complement_interactions')
      .select('*')
      .eq('user_id', user_id)
      .eq('complement_id', complement_id);

    if (error) {
      console.error('❌ Error en debug:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('✅ Debug: Interacciones encontradas:', data);

    return NextResponse.json({ 
      interactions: data,
      debug: true 
    });
  } catch (error) {
    console.error('❌ Error en debug API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
