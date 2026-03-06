import { type NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getUser } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { user } = await getUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id: postId } = await params;

    const { data: comments, error } = await supabaseAdmin
      .from('feed_post_comments')
      .select('id, post_id, user_id, content, created_at')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (error) {
      return NextResponse.json(
        { error: error.message || 'Error al cargar comentarios' },
        { status: 500 },
      );
    }

    const commentIds = (comments || []).map((c) => c.id);
    const userIds = [...new Set((comments || []).map((c) => c.user_id))];

    const [
      { data: profiles },
      { data: commentLikes },
    ] = await Promise.all([
      supabaseAdmin
        .from('profiles')
        .select('id, name, username')
        .in('id', userIds),
      commentIds.length > 0
        ? supabaseAdmin
            .from('feed_comment_likes')
            .select('comment_id, user_id')
            .in('comment_id', commentIds)
        : { data: [] as { comment_id: string; user_id: string }[] },
    ]);

    const nameByUserId = (profiles || []).reduce(
      (acc, p) => {
        acc[p.id] = {
          name: p.name || 'Usuario',
          username: p.username?.trim() || null,
        };
        return acc;
      },
      {} as Record<string, { name: string; username: string | null }>,
    );

    const likeCountByComment: Record<string, number> = {};
    const userLikedCommentIds = new Set<string>();
    (commentLikes || []).forEach((l) => {
      likeCountByComment[l.comment_id] =
        (likeCountByComment[l.comment_id] || 0) + 1;
      if (user && l.user_id === user.id) userLikedCommentIds.add(l.comment_id);
    });

    const result = (comments || []).map((c) => {
      const profile = nameByUserId[c.user_id];
      return {
        ...c,
        author_name: profile?.name || 'Usuario',
        author_username: profile?.username ?? undefined,
        like_count: likeCountByComment[c.id] || 0,
        user_has_liked: userLikedCommentIds.has(c.id),
      };
    });

    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: 'Error interno al listar comentarios' },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { user } = await getUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id: postId } = await params;
    const body = await request.json();
    const content = (body?.content ?? '').trim();
    if (!content) {
      return NextResponse.json(
        { error: 'El comentario no puede estar vacío' },
        { status: 400 },
      );
    }

    const { data: comment, error } = await supabaseAdmin
      .from('feed_post_comments')
      .insert({
        post_id: postId,
        user_id: user.id,
        content,
      })
      .select('id, post_id, user_id, content, created_at')
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message || 'Error al publicar comentario' },
        { status: 500 },
      );
    }

    // Notificar al autor del post (si es otro usuario)
    const { data: post } = await supabaseAdmin
      .from('feed_posts')
      .select('author_id')
      .eq('id', postId)
      .single();
    if (post?.author_id && post.author_id !== user.id) {
      const { data: actorProfile } = await supabaseAdmin
        .from('profiles')
        .select('name, username')
        .eq('id', user.id)
        .single();
      const actorName =
        actorProfile?.username?.trim()
          ? `@${actorProfile.username.trim()}`
          : actorProfile?.name?.trim() || 'Alguien';
      await supabaseAdmin.from('user_notifications').insert({
        user_id: post.author_id,
        type: 'feed_comment',
        title: 'Nuevo comentario',
        message: `${actorName} comentó en tu publicación`,
        link: `/feed?post=${postId}&comment=${comment.id}`,
        post_id: postId,
        comment_id: comment.id,
      });
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('name, username')
      .eq('id', user.id)
      .single();

    const authorName =
      profile?.name?.trim() ||
      user.user_metadata?.name ||
      user.email?.split('@')[0] ||
      'Usuario';
    const authorUsername = profile?.username?.trim() || undefined;

    return NextResponse.json({
      ...comment,
      author_name: authorName,
      author_username: authorUsername,
      like_count: 0,
      user_has_liked: false,
    });
  } catch (e) {
    return NextResponse.json(
      { error: 'Error interno al comentar' },
      { status: 500 },
    );
  }
}
