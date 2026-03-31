'use client';

import { createAvatar } from '@dicebear/core';
import * as adventurer from '@dicebear/adventurer';
import { useMemo } from 'react';

/**
 * Avatar ilustrado determinista (estilo Adventurer de DiceBear): tono activo / outdoor.
 * Útil cuando no hay foto de perfil en contextos de gimnasio.
 */
export function GymSeededAvatar({
  seed,
  size = 40,
  className,
  alt,
}: {
  seed: string;
  size?: number;
  className?: string;
  alt?: string;
}) {
  const dataUri = useMemo(() => {
    const avatar = createAvatar(adventurer, {
      seed: seed.trim() || 'rogerbox',
      size,
    });
    return avatar.toDataUri();
  }, [seed, size]);

  return (
    <img
      src={dataUri}
      alt={alt ?? ''}
      width={size}
      height={size}
      className={className}
      draggable={false}
    />
  );
}
