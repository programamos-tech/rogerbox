'use client';

import {
  ArrowLeft,
  BookOpen,
  Calendar,
  Clock,
  Facebook,
  Instagram,
  Linkedin,
  MessageCircle,
  Share2,
  User,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Footer from '@/components/Footer';
import type { NutritionalBlog } from '@/types';

export default function BlogPostPage() {
  const params = useParams();
  const router = useRouter();
  const [blog, setBlog] = useState<NutritionalBlog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showCopyModal, setShowCopyModal] = useState(false);

  useEffect(() => {
    if (params.slug) {
      fetchBlog();
    }
  }, [params.slug]);

  const fetchBlog = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/blogs');
      const data = await response.json();

      if (data.blogs) {
        const foundBlog = data.blogs.find(
          (b: NutritionalBlog) => b.slug === params.slug,
        );
        if (foundBlog) {
          setBlog(foundBlog);
        } else {
          setError('Blog no encontrado');
        }
      } else {
        setError('Error al cargar el blog');
      }
    } catch {
      setError('Error al cargar el blog');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareTitle = blog?.title || '';

  const shareToFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank', 'width=600,height=400');
  };

  const shareToInstagram = () => {
    window.open('https://www.instagram.com/', '_blank');
  };

  const shareToLinkedIn = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank', 'width=600,height=400');
  };

  const shareToWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(`${shareTitle} - ${shareUrl}`)}`;
    window.open(url, '_blank');
  };

  const btnPrimary =
    'inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-[#164151] shadow-sm transition hover:bg-white/95 active:scale-[0.99]';
  const btnGhost =
    'inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-white/15 dark:bg-transparent dark:text-white/85 dark:hover:bg-white/5';

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0a1620]">
        <div className="flex min-h-screen items-center justify-center">
          <div
            className="h-9 w-9 animate-spin rounded-full border-2 border-gray-200 border-t-[#164151] dark:border-white/15 dark:border-t-white/70"
            aria-hidden
          />
        </div>
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0a1620]">
        <div className="mx-auto max-w-lg px-4 py-20 text-center">
          <BookOpen className="mx-auto mb-4 h-14 w-14 text-gray-300 dark:text-white/25" />
          <h1 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
            Blog no encontrado
          </h1>
          <p className="mb-8 text-sm text-gray-500 dark:text-white/45">
            El artículo que buscas no existe o ya no está publicado.
          </p>
          <button type="button" onClick={() => router.push('/dashboard')} className={btnPrimary}>
            <ArrowLeft className="h-4 w-4" />
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0a1620]">
      {/* Barra superior */}
      <header className="border-b border-gray-200/80 dark:border-white/10">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <button
            type="button"
            onClick={() => router.push('/dashboard')}
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition hover:text-[#164151] dark:text-white/55 dark:hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">Volver</span>
          </button>
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#85ea10]/90">
            Nutrición
          </span>
        </div>
      </header>

      <article className="mx-auto max-w-3xl px-4 pb-16 pt-8 sm:px-6 sm:pt-10">
        {/* Imagen opcional */}
        {blog.featured_image_url ? (
          <div className="mb-8 overflow-hidden rounded-2xl border border-gray-200/80 dark:border-white/10">
            <img
              src={blog.featured_image_url}
              alt=""
              className="max-h-[min(52vh,420px)] w-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        ) : null}

        <h1 className="text-3xl font-semibold leading-tight tracking-tight text-gray-900 dark:text-white sm:text-4xl">
          {blog.title}
        </h1>

        <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-500 dark:text-white/45">
          <span className="inline-flex items-center gap-1.5">
            <User className="h-4 w-4 shrink-0 opacity-70" />
            {blog.author}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-4 w-4 shrink-0 opacity-70" />
            {blog.reading_time} min de lectura
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="h-4 w-4 shrink-0 opacity-70" />
            {formatDate(blog.published_at || blog.created_at)}
          </span>
        </div>

        {/* Resumen */}
        <div className="mt-8 rounded-xl border border-gray-200/90 bg-white/60 py-4 pl-5 pr-4 dark:border-white/10 dark:bg-white/[0.03]">
          <div className="border-l-2 border-[#85ea10]/50 pl-4">
            <p className="text-base leading-relaxed text-gray-700 dark:text-white/75">
              {blog.excerpt}
            </p>
          </div>
        </div>

        {/* Cuerpo */}
        <div className="prose prose-gray mt-10 max-w-none dark:prose-invert prose-p:text-gray-700 dark:prose-p:text-white/80 prose-headings:font-semibold prose-headings:text-gray-900 dark:prose-headings:text-white prose-a:text-[#164151] dark:prose-a:text-[#85ea10]/90">
          <div className="whitespace-pre-line text-lg leading-relaxed text-gray-800 dark:text-white/80">
            {blog.content}
          </div>
        </div>

        {/* Compartir */}
        <div className="mt-14 border-t border-gray-200/90 pt-10 dark:border-white/10">
          <p className="text-center text-sm text-gray-600 dark:text-white/50">
            ¿Te gustó este artículo? Compártelo.
          </p>
          <div className="mt-5 flex justify-center">
            <button
              type="button"
              onClick={() => setShowShareModal(true)}
              className={btnPrimary}
            >
              <Share2 className="h-4 w-4" />
              Compartir
            </button>
          </div>
        </div>

        <div className="mt-10 flex justify-center">
          <button
            type="button"
            onClick={() => router.push('/nutritional-blogs')}
            className={btnGhost}
          >
            <BookOpen className="h-4 w-4" />
            Más tips nutricionales
          </button>
        </div>
      </article>

      {/* Modal compartir */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Cerrar"
            className="absolute inset-0 bg-[#0a1620]/75 backdrop-blur-sm"
            onClick={() => setShowShareModal(false)}
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-gray-200/80 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#111c26]">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Compartir artículo
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-white/45">
              Elige dónde compartir
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  shareToFacebook();
                  setShowShareModal(false);
                }}
                className="flex flex-col items-center gap-2 rounded-xl border border-gray-200 py-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-white/10 dark:text-white/80 dark:hover:bg-white/5"
              >
                <Facebook className="h-7 w-7" />
                Facebook
              </button>
              <button
                type="button"
                onClick={() => {
                  shareToInstagram();
                  setShowShareModal(false);
                }}
                className="flex flex-col items-center gap-2 rounded-xl border border-gray-200 py-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-white/10 dark:text-white/80 dark:hover:bg-white/5"
              >
                <Instagram className="h-7 w-7" />
                Instagram
              </button>
              <button
                type="button"
                onClick={() => {
                  shareToLinkedIn();
                  setShowShareModal(false);
                }}
                className="flex flex-col items-center gap-2 rounded-xl border border-gray-200 py-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-white/10 dark:text-white/80 dark:hover:bg-white/5"
              >
                <Linkedin className="h-7 w-7" />
                LinkedIn
              </button>
              <button
                type="button"
                onClick={() => {
                  shareToWhatsApp();
                  setShowShareModal(false);
                }}
                className="flex flex-col items-center gap-2 rounded-xl border border-gray-200 py-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-white/10 dark:text-white/80 dark:hover:bg-white/5"
              >
                <MessageCircle className="h-7 w-7" />
                WhatsApp
              </button>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setShowShareModal(false)}
                className="flex-1 rounded-xl border border-gray-200 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-white/15 dark:text-white/80 dark:hover:bg-white/5"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={() => {
                  void navigator.clipboard.writeText(shareUrl);
                  setShowShareModal(false);
                  setShowCopyModal(true);
                }}
                className="flex-1 rounded-xl bg-white py-3 text-sm font-semibold text-[#164151] shadow-sm ring-1 ring-gray-200/80 transition hover:bg-gray-50 dark:bg-white dark:ring-white/20"
              >
                Copiar enlace
              </button>
            </div>
          </div>
        </div>
      )}

      {showCopyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Cerrar"
            className="absolute inset-0 bg-[#0a1620]/75 backdrop-blur-sm"
            onClick={() => setShowCopyModal(false)}
          />
          <div className="relative z-10 w-full max-w-sm rounded-2xl border border-gray-200/80 bg-white p-8 text-center shadow-2xl dark:border-white/10 dark:bg-[#111c26]">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-gray-200 dark:border-white/15">
              <svg
                className="h-6 w-6 text-[#164151] dark:text-[#85ea10]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Enlace copiado
            </h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-white/45">
              Pégalo donde quieras compartir el artículo.
            </p>
            <button
              type="button"
              onClick={() => setShowCopyModal(false)}
              className={`${btnPrimary} mt-6 w-full`}
            >
              Listo
            </button>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
