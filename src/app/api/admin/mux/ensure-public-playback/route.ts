import { NextResponse } from 'next/server';
import { ensurePlayableMuxPlayback } from '@/lib/mux-playback';
import { supabaseAdmin } from '@/lib/supabase';
import { getUser } from '@/lib/supabase-server';
import { extractMuxPlaybackId } from '@/shared/utils/mux-playback-id.util';

export const dynamic = 'force-dynamic';

function isAdminUser(
  user: {
    id?: string;
    email?: string;
    user_metadata?: Record<string, unknown>;
  } | null,
) {
  if (!user) return false;
  const envId = (process.env.NEXT_PUBLIC_ADMIN_USER_ID || '').trim();
  const envEmail = (process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'rogerbox@admin.com')
    .trim()
    .toLowerCase();
  const matchId = !!envId && user.id === envId;
  const matchEmail = (user.email || '').trim().toLowerCase() === envEmail;
  const matchRole = user.user_metadata?.role === 'admin';
  return Boolean(matchId || matchEmail || matchRole);
}

async function uniqueStoredPlaybackIds(): Promise<string[]> {
  const [lessons, courses, complements] = await Promise.all([
    supabaseAdmin.from('course_lessons').select('video_url'),
    supabaseAdmin.from('courses').select('mux_playback_id'),
    supabaseAdmin.from('weekly_complements').select('mux_playback_id'),
  ]);

  const ids = new Set<string>();
  for (const row of lessons.data || []) {
    const id = extractMuxPlaybackId(row.video_url);
    if (id) ids.add(id);
  }
  for (const row of courses.data || []) {
    const id = extractMuxPlaybackId(row.mux_playback_id);
    if (id) ids.add(id);
  }
  for (const row of complements.data || []) {
    const id = extractMuxPlaybackId(row.mux_playback_id);
    if (id) ids.add(id);
  }
  return [...ids];
}

export async function POST() {
  const { user, error } = await getUser();
  if (error || !user || !isAdminUser(user)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const playbackIds = await uniqueStoredPlaybackIds();
  const repaired: Array<{ from: string; to: string; policy: string }> = [];
  const failed: Array<{ playbackId: string; error: string }> = [];

  for (const playbackId of playbackIds) {
    try {
      const result = await ensurePlayableMuxPlayback(playbackId);
      repaired.push({
        from: playbackId,
        to: result.playbackId,
        policy: result.policy,
      });
    } catch (err) {
      failed.push({
        playbackId,
        error: err instanceof Error ? err.message : 'Error desconocido',
      });
    }
  }

  return NextResponse.json({
    total: playbackIds.length,
    repaired,
    failed,
  });
}
