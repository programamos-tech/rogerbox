import { type NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { createClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id: postId } = await params;

    const { data: existing } = await supabase
      .from('feed_post_likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('feed_post_likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', user.id);
      return NextResponse.json({ liked: false });
    }

    await supabase.from('feed_post_likes').insert({
      post_id: postId,
      user_id: user.id,
    });

    // Notificar al autor del post (si es otro usuario)
    const { data: post } = await supabaseAdmin
      .from('feed_posts')
      .select('author_id')
      .eq('id', postId)
      .single();
    if (post?.author_id && post.author_id !== user.id) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('name, username')
        .eq('id', user.id)
        .single();
      const actorName = profile?.username?.trim()
        ? `@${profile.username.trim()}`
        : profile?.name?.trim() || 'Alguien';
      await supabaseAdmin.from('user_notifications').insert({
        user_id: post.author_id,
        type: 'feed_post_like',
        title: 'Nuevo like',
        message: `${actorName} le dio like a tu publicación`,
        link: `/feed#post-${postId}`,
        post_id: postId,
      });
    }

    return NextResponse.json({ liked: true });
  } catch (e) {
    return NextResponse.json(
      { error: 'Error interno al actualizar like' },
      { status: 500 },
    );
  }
}
