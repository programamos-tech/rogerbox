import { type NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getUser } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { user } = await getUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;

    const { data: post, error: fetchError } = await supabaseAdmin
      .from('feed_posts')
      .select('id, author_id')
      .eq('id', id)
      .single();

    if (fetchError || !post) {
      return NextResponse.json(
        { error: 'Post no encontrado' },
        { status: 404 },
      );
    }

    if (post.author_id !== user.id) {
      return NextResponse.json(
        { error: 'Solo puedes eliminar tus propios posts' },
        { status: 403 },
      );
    }

    await supabaseAdmin.from('feed_posts').delete().eq('id', id);

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json(
      { error: 'Error interno al eliminar post' },
      { status: 500 },
    );
  }
}
