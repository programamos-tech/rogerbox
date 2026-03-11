'use client';

import { Share2 } from 'lucide-react';
import { useState } from 'react';
import { createPost } from '@/modules/feed/services/feed.service';

const MESSAGE_TEMPLATE = (courseTitle: string) =>
  `¡He finalizado el curso ${courseTitle}! 🎉`;

interface ShareCourseToFeedButtonProps {
  courseTitle: string | null | undefined;
  courseImageUrl?: string | null;
  onSuccess: (postId: string) => void;
  className?: string;
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md';
}

export function ShareCourseToFeedButton({
  courseTitle,
  courseImageUrl,
  onSuccess,
  className = '',
  variant = 'primary',
  size = 'md',
}: ShareCourseToFeedButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    const title = (courseTitle || 'Rogerbox').trim();
    if (!title) return;
    setError(null);
    setLoading(true);
    try {
      const imageUrls = courseImageUrl?.trim() ? [courseImageUrl.trim()] : [];
      const post = await createPost(MESSAGE_TEMPLATE(title), imageUrls);
      onSuccess(post.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al publicar');
    } finally {
      setLoading(false);
    }
  };

  const baseClass =
    'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-colors disabled:opacity-60 disabled:pointer-events-none';
  const variantClass =
    variant === 'primary'
      ? 'bg-[#85ea10] hover:bg-[#7dd30f] text-black'
      : 'bg-gray-900 hover:bg-gray-800 text-white border border-gray-600';
  const sizeClass = size === 'sm' ? 'py-2 px-4 text-xs' : 'py-2.5 px-4 text-sm';

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className={`${baseClass} ${variantClass} ${sizeClass} ${className}`}
      >
        <Share2 className="w-4 h-4 shrink-0" />
        {loading ? 'Publicando...' : 'Compartir en el feed'}
      </button>
      {error && (
        <p className="text-xs text-red-500 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
