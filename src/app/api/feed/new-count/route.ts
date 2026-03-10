import { type NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getUser } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

/**
 * GET ?since=ISO
 * Devuelve cuántos posts nuevos hay desde esa fecha (para el badge del menú Feed).
 */
export async function GET(request: NextRequest) {
  try {
    await getUser();
    const { searchParams } = new URL(request.url);
    const since = searchParams.get('since');
    if (!since) {
      return NextResponse.json({ count: 0 });
    }
    const sinceDate = new Date(since);
    if (Number.isNaN(sinceDate.getTime())) {
      return NextResponse.json({ count: 0 });
    }

    const { count, error } = await supabaseAdmin
      .from('feed_posts')
      .select('id', { count: 'exact', head: true })
      .eq('is_published', true)
      .gt('created_at', sinceDate.toISOString());

    if (error) {
      return NextResponse.json({ count: 0 });
    }
    return NextResponse.json({ count: Math.max(0, count ?? 0) });
  } catch {
    return NextResponse.json({ count: 0 });
  }
}
