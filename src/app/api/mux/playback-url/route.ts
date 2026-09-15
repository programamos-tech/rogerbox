import { type NextRequest, NextResponse } from 'next/server';
import { ensurePlayableMuxPlayback } from '@/lib/mux-playback';
import { supabaseAdmin } from '@/lib/supabase';
import { getSession } from '@/lib/supabase-server';
import { extractMuxPlaybackId } from '@/shared/utils/mux-playback-id.util';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function resolveRequestUser(request: NextRequest) {
  const { session } = await getSession();
  if (session?.user?.id) {
    return session.user;
  }

  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.replace('Bearer ', '');
  const {
    data: { user },
  } = await supabaseAdmin.auth.getUser(token);
  return user ?? null;
}

export async function GET(request: NextRequest) {
  try {
    const playbackId = extractMuxPlaybackId(
      request.nextUrl.searchParams.get('playbackId'),
    );
    if (!playbackId) {
      return NextResponse.json(
        { error: 'playbackId es requerido' },
        { status: 400 },
      );
    }

    const user = await resolveRequestUser(request);

    if (!user?.id) {
      const [{ data: course }, { data: complement }] = await Promise.all([
        supabaseAdmin
          .from('courses')
          .select('id')
          .eq('mux_playback_id', playbackId)
          .maybeSingle(),
        supabaseAdmin
          .from('weekly_complements')
          .select('id')
          .eq('mux_playback_id', playbackId)
          .eq('is_published', true)
          .maybeSingle(),
      ]);

      if (!course && !complement) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
      }
    }

    const playback = await ensurePlayableMuxPlayback(playbackId);
    return NextResponse.json({
      playbackId: playback.playbackId,
      url: playback.url,
      token: playback.token,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Error al autorizar el video';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
