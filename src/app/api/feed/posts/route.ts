import { type NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getUser } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { user } = await getUser();

    const { data: posts, error: postsError } = await supabaseAdmin
      .from('feed_posts')
      .select('id, author_id, author_name, author_username, content, image_urls, created_at, view_count')
      .eq('is_published', true)
      .order('created_at', { ascending: false });

    if (postsError) {
      return NextResponse.json(
        { error: postsError.message || 'Error al cargar posts' },
        { status: 500 },
      );
    }

    const postIds = (posts || []).map((p) => p.id);
    if (postIds.length === 0) {
      return NextResponse.json(
        (posts || []).map((p) => ({
          ...p,
          view_count: Number(p.view_count) || 0,
          like_count: 0,
          comment_count: 0,
          user_has_liked: false,
        })),
      );
    }

    const [{ data: likes }, { data: comments }] = await Promise.all([
      supabaseAdmin
        .from('feed_post_likes')
        .select('post_id, user_id')
        .in('post_id', postIds),
      supabaseAdmin
        .from('feed_post_comments')
        .select('post_id')
        .in('post_id', postIds),
    ]);

    const likeCountByPost: Record<string, number> = {};
    const commentCountByPost: Record<string, number> = {};
    const userLikedPostIds = new Set<string>();

    (likes || []).forEach((l) => {
      likeCountByPost[l.post_id] = (likeCountByPost[l.post_id] || 0) + 1;
      if (user && l.user_id === user.id) userLikedPostIds.add(l.post_id);
    });
    (comments || []).forEach((c) => {
      commentCountByPost[c.post_id] =
        (commentCountByPost[c.post_id] || 0) + 1;
    });

    const result = (posts || []).map((p) => ({
      ...p,
      view_count: Number(p.view_count) || 0,
      like_count: likeCountByPost[p.id] || 0,
      comment_count: commentCountByPost[p.id] || 0,
      user_has_liked: userLikedPostIds.has(p.id),
    }));

    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: 'Error interno al listar posts' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user } = await getUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { content, image_urls } = body as {
      content?: string;
      image_urls?: string[];
    };

    const trimmedContent = (content ?? '').trim();
    if (!trimmedContent) {
      return NextResponse.json(
        { error: 'El contenido del post es requerido' },
        { status: 400 },
      );
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
    const authorUsername =
      profile?.username?.trim() || null;

    const { data: post, error } = await supabaseAdmin
      .from('feed_posts')
      .insert({
        author_id: user.id,
        author_name: authorName,
        author_username: authorUsername,
        content: trimmedContent,
        image_urls: Array.isArray(image_urls) ? image_urls : [],
        is_published: true,
        updated_at: new Date().toISOString(),
      })
      .select('id, author_id, author_name, author_username, content, image_urls, created_at')
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message || 'Error al crear post' },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ...post,
      author_username: authorUsername ?? undefined,
      view_count: 0,
      like_count: 0,
      comment_count: 0,
      user_has_liked: false,
    });
  } catch (e) {
    return NextResponse.json(
      { error: 'Error interno al crear post' },
      { status: 500 },
    );
  }
}
