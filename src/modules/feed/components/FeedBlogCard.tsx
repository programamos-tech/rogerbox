'use client';

import { BookOpen, ChevronRight, Clock, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { NutritionalBlog } from '@/types';

function formatBlogDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function FeedBlogCard({ blog }: { blog: NutritionalBlog }) {
  const router = useRouter();
  const when = blog.published_at || blog.created_at;

  return (
    <article
      className="rounded-2xl border border-[#85ea10]/25 bg-gradient-to-br from-[#85ea10]/[0.06] to-transparent dark:from-[#85ea10]/[0.08] p-4 sm:p-5 shadow-sm dark:shadow-none"
      id={`blog-${blog.id}`}
    >
      <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#85ea10]">
        <BookOpen className="h-4 w-4 shrink-0" />
        <span>Artículo nutricional</span>
        {when && (
          <span className="font-normal text-gray-500 dark:text-white/45">
            · {formatBlogDate(when)}
          </span>
        )}
      </div>

      <button
        type="button"
        onClick={() => router.push(`/blog/${blog.slug}`)}
        className="w-full text-left"
      >
        <div className="flex gap-4">
          {blog.featured_image_url ? (
            <div className="relative h-24 w-28 shrink-0 overflow-hidden rounded-xl sm:h-28 sm:w-36">
              <img
                src={blog.featured_image_url}
                alt=""
                className="h-full w-full object-cover"
                onError={(e) => {
                  const el = e.currentTarget;
                  if (!el.src.endsWith('course-placeholder.jpg')) {
                    el.src = '/images/course-placeholder.jpg';
                  }
                }}
              />
            </div>
          ) : null}
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-bold leading-snug text-gray-900 dark:text-white sm:text-lg">
              {blog.title}
            </h2>
            <p className="mt-1 line-clamp-2 text-sm text-gray-600 dark:text-white/65">
              {blog.excerpt}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-white/45">
              <span className="inline-flex items-center gap-1">
                <User className="h-3.5 w-3.5" />
                {blog.author}
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {blog.reading_time} min
              </span>
            </div>
            <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[#85ea10]">
              Leer artículo
              <ChevronRight className="h-4 w-4" />
            </span>
          </div>
        </div>
      </button>
    </article>
  );
}
