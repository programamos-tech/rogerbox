import { type NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getUser } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { user } = await getUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id: commentId } = await params;

    const { data: existing } = await supabaseAdmin
      .from('feed_comment_likes')
      .select('id')
      .eq('comment_id', commentId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existing) {
      await supabaseAdmin
        .from('feed_comment_likes')
        .delete()
        .eq('comment_id', commentId)
        .eq('user_id', user.id);
      return NextResponse.json({ liked: false });
    }

    await supabaseAdmin.from('feed_comment_likes').insert({
      comment_id: commentId,
      user_id: user.id,
    });

    // Notificar al autor del comentario (si es otro usuario)
    const { data: comment } = await supabaseAdmin
      .from('feed_post_comments')
      .select('user_id, post_id')
      .eq('id', commentId)
      .single();
    if (comment?.user_id && comment.user_id !== user.id) {
      const { data: actorProfile } = await supabaseAdmin
        .from('profiles')
        .select('name, username')
        .eq('id', user.id)
        .single();
      const actorName = actorProfile?.username?.trim()
        ? `@${actorProfile.username.trim()}`
        : actorProfile?.name?.trim() || 'Alguien';
      await supabaseAdmin.from('user_notifications').insert({
        user_id: comment.user_id,
        type: 'feed_comment_like',
        title: 'Like en tu comentario',
        message: `${actorName} le dio like a tu comentario`,
        link: `/feed?post=${comment.post_id}&comment=${commentId}`,
        post_id: comment.post_id,
        comment_id: commentId,
      });
    }

    return NextResponse.json({ liked: true });
  } catch (e) {
    return NextResponse.json(
      { error: 'Error al actualizar like del comentario' },
      { status: 500 },
    );
  }
}
