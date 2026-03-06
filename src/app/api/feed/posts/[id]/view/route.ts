import { type NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getUser } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await getUser();
    const { id } = await params;

    const { data: row } = await supabaseAdmin
      .from('feed_posts')
      .select('view_count')
      .eq('id', id)
      .single();

    const nextCount = (Number(row?.view_count) || 0) + 1;
    await supabaseAdmin
      .from('feed_posts')
      .update({ view_count: nextCount })
      .eq('id', id);

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: 'Error al registrar vista' },
      { status: 500 },
    );
  }
}
