import { createPrivateKey, createSign } from 'node:crypto';
import { supabaseAdmin } from '@/lib/supabase';
import {
  buildMuxHlsUrl,
  extractMuxPlaybackId,
} from '@/shared/utils/mux-playback-id.util';

type MuxPlaybackPolicy = 'public' | 'signed' | 'drm';

type MuxPlaybackObject = {
  type: 'asset' | 'live_stream';
  id: string;
};

type MuxPlaybackIdRecord = {
  id: string;
  policy: MuxPlaybackPolicy;
};

export type PlayableMuxPlayback = {
  playbackId: string;
  url: string;
  token: string | null;
  policy: MuxPlaybackPolicy | 'unknown';
};

const playbackCache = new Map<
  string,
  { value: PlayableMuxPlayback; expiresAt: number }
>();

function muxTokenId(): string {
  return (
    process.env.MUX_TOKEN_ID ||
    process.env.NEXT_PUBLIC_MUX_TOKEN_ID ||
    ''
  ).trim();
}

function muxTokenSecret(): string {
  return (
    process.env.MUX_TOKEN_SECRET ||
    process.env.MUX_SECRET_KEY ||
    ''
  ).trim();
}

function muxAuthHeader(): string | null {
  const id = muxTokenId();
  const secret = muxTokenSecret();
  if (!id || !secret) return null;
  return `Basic ${Buffer.from(`${id}:${secret}`).toString('base64')}`;
}

function base64Url(input: Buffer | string): string {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input);
  return buf
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function muxSigningKeyPem(): string | null {
  const raw = (
    process.env.MUX_SIGNING_PRIVATE_KEY ||
    process.env.MUX_SIGNING_KEY ||
    ''
  ).trim();
  if (!raw) return null;
  if (raw.includes('BEGIN')) {
    return raw.replace(/\\n/g, '\n');
  }
  try {
    return Buffer.from(raw, 'base64').toString('utf8');
  } catch {
    return null;
  }
}

function signMuxJwt(
  playbackId: string,
  audience: 'v' | 't' | 's',
): string | null {
  const keyId = (process.env.MUX_SIGNING_KEY_ID || '').trim();
  const pem = muxSigningKeyPem();
  if (!keyId || !pem) return null;

  const header = { alg: 'RS256', typ: 'JWT', kid: keyId };
  const payload = {
    sub: playbackId,
    aud: audience,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 6,
  };
  const data = `${base64Url(JSON.stringify(header))}.${base64Url(JSON.stringify(payload))}`;
  const signer = createSign('RSA-SHA256');
  signer.update(data);
  const signature = signer.sign(createPrivateKey(pem));
  return `${data}.${base64Url(signature)}`;
}

async function muxFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const authorization = muxAuthHeader();
  if (!authorization) {
    throw new Error(
      'Faltan credenciales de Mux (MUX_TOKEN_ID / MUX_SECRET_KEY)',
    );
  }

  const response = await fetch(`https://api.mux.com${path}`, {
    ...init,
    headers: {
      Authorization: authorization,
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(
      `Mux API ${response.status} ${path}${body ? `: ${body.slice(0, 300)}` : ''}`,
    );
  }

  return (await response.json()) as T;
}

async function persistPlaybackIdSwap(
  previousId: string,
  nextId: string,
): Promise<void> {
  if (previousId === nextId) return;

  await Promise.allSettled([
    supabaseAdmin
      .from('course_lessons')
      .update({ video_url: nextId })
      .eq('video_url', previousId),
    supabaseAdmin
      .from('courses')
      .update({ mux_playback_id: nextId })
      .eq('mux_playback_id', previousId),
    supabaseAdmin
      .from('weekly_complements')
      .update({ mux_playback_id: nextId })
      .eq('mux_playback_id', previousId),
  ]);
}

function playableFrom(
  playbackId: string,
  policy: MuxPlaybackPolicy | 'unknown',
  token: string | null = null,
): PlayableMuxPlayback {
  return {
    playbackId,
    policy,
    token,
    url: buildMuxHlsUrl(playbackId, token),
  };
}

async function ensurePublicPlaybackId(
  originalId: string,
  assetId: string,
): Promise<string> {
  const asset = await muxFetch<{
    data: { playback_ids?: MuxPlaybackIdRecord[] };
  }>(`/video/v1/assets/${assetId}`);

  const existingPublic = asset.data.playback_ids?.find(
    (item) => item.policy === 'public',
  );
  if (existingPublic?.id) {
    await persistPlaybackIdSwap(originalId, existingPublic.id);
    return existingPublic.id;
  }

  const created = await muxFetch<{ data: MuxPlaybackIdRecord }>(
    `/video/v1/assets/${assetId}/playback-ids`,
    {
      method: 'POST',
      body: JSON.stringify({ policy: 'public' }),
    },
  );

  if (!created.data?.id) {
    throw new Error('Mux no devolvió un playback ID público');
  }

  await persistPlaybackIdSwap(originalId, created.data.id);
  return created.data.id;
}

export async function ensurePlayableMuxPlayback(
  rawPlaybackId: string,
): Promise<PlayableMuxPlayback> {
  const playbackId = extractMuxPlaybackId(rawPlaybackId);
  if (!playbackId) {
    throw new Error('Playback ID de Mux inválido');
  }

  const cached = playbackCache.get(playbackId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  const cacheValue = (
    value: PlayableMuxPlayback,
    ttlMs: number,
    extraKey?: string,
  ) => {
    playbackCache.set(playbackId, { value, expiresAt: Date.now() + ttlMs });
    if (extraKey && extraKey !== playbackId) {
      playbackCache.set(extraKey, { value, expiresAt: Date.now() + ttlMs });
    }
    return value;
  };

  if (!muxAuthHeader()) {
    const token = signMuxJwt(playbackId, 'v');
    if (!token) {
      throw new Error(
        'Faltan credenciales de Mux (MUX_SECRET_KEY o MUX_SIGNING_KEY_ID)',
      );
    }
    return cacheValue(
      playableFrom(playbackId, 'signed', token),
      30 * 60 * 1000,
    );
  }

  const info = await muxFetch<{
    data: {
      id: string;
      policy: MuxPlaybackPolicy;
      object: MuxPlaybackObject;
    };
  }>(`/video/v1/playback-ids/${encodeURIComponent(playbackId)}`);

  const policy = info.data.policy;
  const object = info.data.object;

  if (policy === 'public') {
    return cacheValue(playableFrom(playbackId, 'public'), 30 * 60 * 1000);
  }

  const signedToken = signMuxJwt(playbackId, 'v');
  if (signedToken) {
    return cacheValue(
      playableFrom(playbackId, policy, signedToken),
      30 * 60 * 1000,
    );
  }

  if (object.type !== 'asset') {
    throw new Error(
      'Este video de Mux requiere un token firmado y no se puede abrir como público',
    );
  }

  const publicId = await ensurePublicPlaybackId(playbackId, object.id);
  return cacheValue(
    playableFrom(publicId, 'public'),
    6 * 60 * 60 * 1000,
    publicId,
  );
}
