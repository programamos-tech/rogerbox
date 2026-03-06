'use client';

import {
  ChevronDown,
  ChevronUp,
  MessageCircle,
  PenLine,
  RefreshCw,
  X,
} from 'lucide-react';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { queryKeys } from '@/lib/query-keys';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import CreatePost from './components/CreatePost';
import PostCard from './components/PostCard';
import {
  createPost,
  deletePost,
  fetchPosts,
} from './services/feed.service';
import type { FeedPost } from './types';

export default function FeedPage() {
  const { user } = useSupabaseAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [toast, setToast] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const [showRefreshingUI, setShowRefreshingUI] = useState(false);

  const {
    data: posts = [],
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: [...queryKeys.all, 'feed-posts'],
    queryFn: async () => {
      const data = await fetchPosts();
      return data;
    },
  });

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: [...queryKeys.all, 'feed-posts'] });
    setShowCreateModal(false);
  };

  const handleLikeToggle = (postId: string, liked: boolean) => {
    queryClient.setQueryData<FeedPost[]>(
      [...queryKeys.all, 'feed-posts'],
      (old) =>
        (old || []).map((p) =>
          p.id === postId
            ? {
                ...p,
                user_has_liked: liked,
                like_count: p.like_count + (liked ? 1 : -1),
              }
            : p,
        ),
    );
  };

  const handleDelete = async (postId: string) => {
    try {
      await deletePost(postId);
      queryClient.setQueryData<FeedPost[]>(
        [...queryKeys.all, 'feed-posts'],
        (old) => (old || []).filter((p) => p.id !== postId),
      );
    } catch {
      setToast('No se pudo eliminar el post');
    }
  };

  const handleCommentAdded = (postId: string) => {
    queryClient.setQueryData<FeedPost[]>(
      [...queryKeys.all, 'feed-posts'],
      (old) =>
        (old || []).map((p) =>
          p.id === postId ? { ...p, comment_count: p.comment_count + 1 } : p,
        ),
    );
  };

  const handleViewRecorded = (postId: string) => {
    queryClient.setQueryData<FeedPost[]>(
      [...queryKeys.all, 'feed-posts'],
      (old) =>
        (old || []).map((p) =>
          p.id === postId
            ? { ...p, view_count: (p.view_count ?? 0) + 1 }
            : p,
        ),
    );
  };

  const searchParams = useSearchParams();
  const postIdFromUrl = searchParams.get('post') ?? null;
  const commentIdFromUrl = searchParams.get('comment') ?? null;

  // Scroll al post cuando se abre desde notificación (#post-xxx o ?post=xxx)
  // Luego limpia la URL a /feed#post-xxx para que recargar y notificaciones funcionen bien
  useEffect(() => {
    if (isLoading || posts.length === 0) return;
    const hash = typeof window !== 'undefined' ? window.location.hash : '';
    const postId =
      postIdFromUrl || (hash.startsWith('#post-') ? hash.slice(6) : null);
    if (!postId) return;
    const el = document.getElementById(`post-${postId}`);
    if (el) {
      const t = setTimeout(() => {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
      const hasQueryParams = Boolean(postIdFromUrl || commentIdFromUrl);
      const cleanUrlTimeout = setTimeout(() => {
        if (hasQueryParams) {
          router.replace(`/feed#post-${postId}`, { scroll: false });
        }
      }, 1800);
      return () => {
        clearTimeout(t);
        clearTimeout(cleanUrlTimeout);
      };
    }
  }, [isLoading, posts.length, postIdFromUrl, commentIdFromUrl]);

  // Mantener el indicador de actualización visible al menos un momento (evitar parpadeo tipo error)
  useEffect(() => {
    if (!isRefetching && showRefreshingUI) {
      const t = setTimeout(() => setShowRefreshingUI(false), 900);
      return () => clearTimeout(t);
    }
  }, [isRefetching, showRefreshingUI]);

  // Mostrar botón "volver arriba" cuando el usuario ha hecho scroll
  useEffect(() => {
    const onScroll = () => {
      setShowScrollToTop(typeof window !== 'undefined' && window.scrollY > 400);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleRefresh = () => {
    setShowRefreshingUI(true);
    refetch();
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleScrollDown = () => {
    if (typeof window !== 'undefined') {
      window.scrollBy({ top: window.innerHeight * 0.85, behavior: 'smooth' });
    }
  };

  const handleScrollToTop = () => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmitPost = async (content: string, imageUrls: string[]) => {
    setIsSubmitting(true);
    try {
      await createPost(content, imageUrls);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6 pb-28 relative">
      {/* Indicador de actualización (barra + mensaje). Se muestra un mínimo ~0.9s para no parecer error */}
      {(isRefetching || showRefreshingUI) && (
        <div className="sticky top-0 z-20 -mx-4 -mt-6 px-4 pt-2 pb-2 sm:-mx-6 sm:px-6 bg-[#85ea10]/10 dark:bg-[#85ea10]/15 border-b border-[#85ea10]/30 rounded-b-xl">
          <div className="flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 text-[#85ea10] animate-spin shrink-0" />
            <span className="text-sm font-medium text-[#85ea10]">
              Actualizando feed...
            </span>
          </div>
          <div className="mt-2 h-0.5 w-full overflow-hidden rounded-full bg-gray-200/80 dark:bg-gray-700">
            <div className="feed-refresh-progress h-full rounded-full bg-[#85ea10]" />
          </div>
        </div>
      )}

      {toast && (
        <div
          className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-sm flex items-center justify-between gap-3"
          role="alert"
        >
          <span>{toast}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="shrink-0 font-medium hover:underline"
          >
            Cerrar
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-5">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-56 rounded-2xl bg-gray-200/80 dark:bg-white/5 animate-pulse"
            />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white/50 dark:bg-white/5 p-10 text-center">
          <MessageCircle className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="font-medium text-gray-700 dark:text-gray-300">
            Aún no hay publicaciones
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Sé el primero en compartir algo con la comunidad
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUserId={user?.id ?? null}
              onLikeToggle={handleLikeToggle}
              onDelete={handleDelete}
              onCommentAdded={handleCommentAdded}
              onViewRecorded={handleViewRecorded}
              openCommentsAndScrollToComment={
                postIdFromUrl === post.id ? commentIdFromUrl ?? undefined : undefined
              }
            />
          ))}
        </div>
      )}

      {/* Botón flotante: scroll hacia abajo / volver arriba (un solo botón según posición) */}
      <div className="fixed bottom-20 left-4 sm:left-6 z-30">
        <button
          type="button"
          onClick={showScrollToTop ? handleScrollToTop : handleScrollDown}
          className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white dark:bg-gray-800 shadow-md border border-gray-200/80 dark:border-white/10 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-[#85ea10]/30 transition-all active:scale-95 data-[at-top]:text-[#85ea10]"
          aria-label={showScrollToTop ? 'Volver arriba' : 'Scroll hacia abajo'}
          data-at-top={showScrollToTop ? undefined : ''}
        >
          {showScrollToTop ? (
            <ChevronUp className="w-5 h-5 sm:w-6 sm:h-6 text-[#85ea10]" />
          ) : (
            <ChevronDown className="w-5 h-5 sm:w-6 sm:h-6" />
          )}
        </button>
      </div>

      {/* Botones flotantes: actualizar y publicar (lado a lado) */}
      <div className="fixed bottom-20 right-4 sm:right-6 z-30 flex items-center gap-2">
        <button
          type="button"
          onClick={handleRefresh}
          disabled={isRefetching || isLoading}
          className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white dark:bg-gray-800 shadow-md border border-gray-200/80 dark:border-white/10 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-[#85ea10]/30 transition-all active:scale-95 disabled:opacity-50"
          aria-label="Actualizar feed"
        >
          <RefreshCw
            className={`w-5 h-5 sm:w-5 sm:h-5 ${isRefetching ? 'animate-spin' : ''}`}
          />
        </button>
        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="w-12 h-12 rounded-full bg-white dark:bg-gray-800 shadow-md border border-gray-200/80 dark:border-white/10 flex items-center justify-center text-[#85ea10] hover:bg-[#85ea10]/10 hover:border-[#85ea10]/30 transition-all active:scale-95"
          aria-label="Publicar"
        >
          <PenLine className="w-5 h-5" />
        </button>
      </div>

      {/* Modal: input para publicar */}
      {showCreateModal && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowCreateModal(false)}
            aria-hidden
          />
          <div
            className="fixed inset-x-0 bottom-0 z-50 max-h-[90vh] overflow-y-auto rounded-t-3xl bg-white dark:bg-gray-900 shadow-2xl sm:inset-auto sm:left-1/2 sm:top-1/2 sm:bottom-auto sm:-translate-x-1/2 sm:-translate-y-1/2 sm:max-w-lg sm:w-full sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900 z-10">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Nueva publicación
              </h2>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400"
                aria-label="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <CreatePost
                onSuccess={handleSuccess}
                onError={setToast}
                isSubmitting={isSubmitting}
                onSubmit={handleSubmitPost}
              />
            </div>
          </div>
        </>
      )}
    </main>
  );
}
