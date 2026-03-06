'use client';

import {
  Bot,
  Eye,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Send,
  Trash2,
  User,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { FeedComment, FeedPost } from '../types';
import {
  addComment,
  fetchComments,
  recordPostView,
  toggleCommentLike,
  toggleLike,
} from '../services/feed.service';

interface PostCardProps {
  post: FeedPost;
  currentUserId: string | null;
  onLikeToggle: (postId: string, liked: boolean) => void;
  onDelete: (postId: string) => void;
  onCommentAdded?: (postId: string) => void;
  onViewRecorded?: (postId: string) => void;
  /** Si viene de notificación de comentario, abrir comentarios y hacer scroll a este id */
  openCommentsAndScrollToComment?: string;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return 'Ahora';
  if (diffMins < 60) return `Hace ${diffMins} min`;
  if (diffHours < 24) return `Hace ${diffHours} h`;
  if (diffDays < 7) return `Hace ${diffDays} días`;
  return d.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

function getPostShareUrl(postId: string): string {
  if (typeof window === 'undefined') return '';
  return `${window.location.origin}/feed#post-${postId}`;
}

/** Renderiza el contenido del post resaltando menciones @usuario como etiqueta */
function renderContentWithMentions(content: string) {
  const parts = content.split(/(@[\w.]+)/g);
  return parts.map((part, i) =>
    part.startsWith('@') ? (
      <span
        key={i}
        className="font-semibold text-sky-600 dark:text-sky-400"
      >
        {part}
      </span>
    ) : (
      part
    ),
  );
}

async function handleSharePost(postId: string) {
  const url = getPostShareUrl(postId);
  if (!url) return;
  try {
    if (navigator.share) {
      await navigator.share({
        title: 'RogerBox',
        text: 'Mira esta publicación en RogerBox',
        url,
      });
    } else {
      await navigator.clipboard.writeText(url);
    }
  } catch {
    try {
      await navigator.clipboard.writeText(url);
    } catch {}
  }
}

export default function PostCard({
  post,
  currentUserId,
  onLikeToggle,
  onDelete,
  onCommentAdded,
  onViewRecorded,
  openCommentsAndScrollToComment,
}: PostCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<FeedComment[]>([]);
  const [commentLoading, setCommentLoading] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [sendingComment, setSendingComment] = useState(false);
  const [liking, setLiking] = useState(false);
  const [likingCommentId, setLikingCommentId] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const viewRecordedRef = useRef(false);

  const isOwnPost = currentUserId && post.author_id === currentUserId;
  const nameLower = post.author_name?.toLowerCase() ?? '';
  const isRogerBot =
    !post.author_id &&
    (nameLower.includes('rogerbox') || nameLower.includes('rogerbot'));
  const viewCount = Number(post.view_count) ?? 0;

  // Registrar vista cuando el post sea visible en pantalla (una vez por carga)
  useEffect(() => {
    if (viewRecordedRef.current) return;
    const el = document.getElementById(`post-${post.id}`);
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting) return;
        if (viewRecordedRef.current) return;
        viewRecordedRef.current = true;
        recordPostView(post.id).then(() => onViewRecorded?.(post.id));
      },
      { threshold: 0.3, rootMargin: '0px' },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [post.id, onViewRecorded]);

  const loadComments = async () => {
    const willOpen = !showComments;
    if (willOpen && comments.length === 0) {
      setCommentLoading(true);
      try {
        const data = await fetchComments(post.id);
        setComments(data);
      } catch {
        setComments([]);
      } finally {
        setCommentLoading(false);
      }
    }
    setShowComments(willOpen);
  };

  // Abrir comentarios y hacer scroll al comentario cuando se viene de notificación
  useEffect(() => {
    if (!openCommentsAndScrollToComment) return;
    setShowComments(true);
    if (comments.length === 0) {
      setCommentLoading(true);
      fetchComments(post.id)
        .then((data) => {
          setComments(data);
        })
        .catch(() => setComments([]))
        .finally(() => setCommentLoading(false));
    }
  }, [openCommentsAndScrollToComment, post.id]);

  useEffect(() => {
    if (
      !openCommentsAndScrollToComment ||
      !showComments ||
      comments.length === 0
    )
      return;
    const hasComment = comments.some(
      (c) => c.id === openCommentsAndScrollToComment,
    );
    if (hasComment) {
      const t = setTimeout(() => {
        document
          .getElementById(`comment-${openCommentsAndScrollToComment}`)
          ?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 150);
      return () => clearTimeout(t);
    }
  }, [openCommentsAndScrollToComment, showComments, comments]);

  const handleLike = async () => {
    if (liking) return;
    setLiking(true);
    try {
      const { liked } = await toggleLike(post.id);
      onLikeToggle(post.id, liked);
    } finally {
      setLiking(false);
    }
  };

  const handleCommentLike = async (commentId: string) => {
    if (likingCommentId) return;
    setLikingCommentId(commentId);
    try {
      const { liked } = await toggleCommentLike(commentId);
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId
            ? {
                ...c,
                user_has_liked: liked,
                like_count: c.like_count + (liked ? 1 : -1),
              }
            : c,
        ),
      );
    } finally {
      setLikingCommentId(null);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = commentText.trim();
    if (!trimmed || sendingComment) return;
    setSendingComment(true);
    try {
      const newComment = await addComment(post.id, trimmed);
      setComments((prev) => [...prev, newComment]);
      setCommentText('');
      onCommentAdded?.(post.id);
    } finally {
      setSendingComment(false);
    }
  };

  return (
    <article
      id={`post-${post.id}`}
      className={
        isRogerBot
          ? 'rounded-2xl border border-sky-500/30 dark:border-sky-400/25 bg-sky-50/60 dark:bg-sky-950/25 shadow-sm overflow-hidden ring-1 ring-sky-500/10 dark:ring-sky-400/10'
          : 'rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-gray-800/80 shadow-sm overflow-hidden'
      }
    >
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={
                isRogerBot
                  ? 'w-10 h-10 rounded-full bg-sky-500/25 dark:bg-sky-400/20 flex items-center justify-center flex-shrink-0'
                  : 'w-10 h-10 rounded-full bg-[#85ea10]/20 flex items-center justify-center flex-shrink-0'
              }
            >
              {isRogerBot ? (
                <Bot className="w-5 h-5 text-sky-600 dark:text-sky-400" />
              ) : (
                <User className="w-5 h-5 text-[#85ea10]" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0">
                <span className="font-semibold text-gray-900 dark:text-white">
                  {isRogerBot
                    ? 'ROGERBOT'
                    : post.author_username
                      ? `@${post.author_username}`
                      : post.author_name}
                </span>
                {isRogerBot && (
                  <span className="rounded-md bg-sky-500/20 dark:bg-sky-400/15 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-sky-700 dark:text-sky-300">
                    Bot
                  </span>
                )}
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  · {formatDate(post.created_at)}
                </span>
              </div>
            </div>
          </div>
          {isOwnPost && (
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700/80 text-gray-500 dark:text-gray-400 transition-colors"
                aria-label="Opciones"
              >
                <MoreHorizontal className="w-5 h-5" />
              </button>
              {showMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowMenu(false)}
                    aria-hidden
                  />
                  <div className="absolute right-0 top-full mt-1 py-1 rounded-xl bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-white/10 shadow-lg z-20 min-w-[140px]">
                    <button
                      type="button"
                      onClick={() => {
                        setShowMenu(false);
                        onDelete(post.id);
                      }}
                      className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Eliminar
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
        <p
          className={
            isRogerBot
              ? 'mt-4 text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words text-[15px] leading-relaxed'
              : 'mt-4 text-gray-900 dark:text-white whitespace-pre-wrap break-words text-[15px] leading-relaxed'
          }
        >
          {renderContentWithMentions(post.content)}
        </p>
        {post.image_urls?.length > 0 && (
          <div className="mt-4 space-y-2 -mx-4 sm:-mx-5 md:-mx-5 lg:-mx-5">
            {post.image_urls.map((url) => (
              <a
                key={url}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full overflow-hidden rounded-xl sm:rounded-xl md:rounded-2xl lg:rounded-2xl"
              >
                <img
                  src={url}
                  alt="Post"
                  className="w-full h-auto max-h-[70vh] object-contain object-center rounded-xl sm:rounded-xl md:rounded-2xl lg:rounded-2xl"
                />
              </a>
            ))}
          </div>
        )}
      </div>

      <div className="px-4 sm:px-5 py-3 border-t border-gray-100 dark:border-white/5 flex items-center gap-3">
        <button
          type="button"
          onClick={handleLike}
          disabled={liking}
          className={`flex items-center gap-1.5 transition-colors ${
            post.user_has_liked
              ? 'text-red-500'
              : 'text-gray-500 dark:text-gray-400 hover:text-red-500'
          }`}
        >
          <Heart
            className="w-5 h-5"
            fill={post.user_has_liked ? 'currentColor' : 'none'}
          />
          <span className="text-sm font-medium">{post.like_count}</span>
        </button>
        <button
          type="button"
          onClick={loadComments}
          className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 hover:text-[#85ea10] transition-colors"
        >
          <MessageCircle className="w-5 h-5" />
          <span className="text-sm font-medium">{post.comment_count}</span>
        </button>
        <span className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 text-sm">
          <Eye className="w-5 h-5" />
          <span className="font-medium">{viewCount}</span>
        </span>
        <button
          type="button"
          onClick={() => handleSharePost(post.id)}
          className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 hover:text-[#85ea10] transition-colors"
          aria-label="Recompartir"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>

      {showComments && (
        <div className="border-t border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-gray-900/30">
          <div className="px-4 sm:px-5 py-3">
            {commentLoading ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 py-2">
                Cargando comentarios...
              </p>
            ) : (
              <ul className="space-y-3 max-h-64 overflow-y-auto">
                {comments.map((c) => (
                  <li
                    key={c.id}
                    id={`comment-${c.id}`}
                    className="flex items-start gap-3 text-sm"
                  >
                    <div className="w-8 h-8 rounded-full bg-[#85ea10]/15 flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-[#85ea10]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {c.author_name}
                        </span>
                        {c.author_username && (
                          <span className="text-xs text-[#85ea10]">
                            @{c.author_username}
                          </span>
                        )}
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          {formatDate(c.created_at)}
                        </span>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 mt-0.5">
                        {c.content}
                      </p>
                      <div className="mt-1.5 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleCommentLike(c.id)}
                          disabled={likingCommentId === c.id}
                          className={`flex items-center gap-1 transition-colors ${
                            c.user_has_liked
                              ? 'text-red-500'
                              : 'text-gray-400 hover:text-red-500'
                          }`}
                        >
                          <Heart
                            className="w-4 h-4"
                            fill={c.user_has_liked ? 'currentColor' : 'none'}
                          />
                          <span className="text-xs font-medium">
                            {c.like_count}
                          </span>
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="px-4 sm:px-5 py-3 border-t border-gray-100 dark:border-white/5 bg-gray-50/30 dark:bg-gray-900/20">
            <form
              onSubmit={handleSubmitComment}
              className="flex gap-2"
            >
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Escribe un comentario..."
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#85ea10]/40 focus:border-[#85ea10]/50 transition-shadow"
                maxLength={500}
                disabled={sendingComment}
              />
              <button
                type="submit"
                disabled={!commentText.trim() || sendingComment}
                className="p-2.5 rounded-xl bg-[#85ea10] hover:bg-[#7dd30f] text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
                aria-label="Enviar comentario"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </article>
  );
}
