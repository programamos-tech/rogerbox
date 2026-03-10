import type { FeedComment, FeedPost } from '../types';

const getAuthHeaders = (): Record<string, string> => {
  if (typeof window === 'undefined') return {};
  // Session is cookie-based; fetch will send cookies with credentials
  return { 'Content-Type': 'application/json' };
};

export async function fetchPosts(): Promise<FeedPost[]> {
  const res = await fetch('/api/feed/posts', {
    credentials: 'include',
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Error al cargar el feed');
  return res.json();
}

export async function createPost(
  content: string,
  imageUrls: string[] = [],
): Promise<FeedPost> {
  const res = await fetch('/api/feed/posts', {
    method: 'POST',
    credentials: 'include',
    headers: getAuthHeaders(),
    body: JSON.stringify({ content, image_urls: imageUrls }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Error al publicar');
  }
  return res.json();
}

export async function deletePost(postId: string): Promise<void> {
  const res = await fetch(`/api/feed/posts/${postId}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Error al eliminar el post');
}

export async function toggleLike(postId: string): Promise<{ liked: boolean }> {
  const res = await fetch(`/api/feed/posts/${postId}/like`, {
    method: 'POST',
    credentials: 'include',
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Error al actualizar like');
  return res.json();
}

export async function fetchComments(postId: string): Promise<FeedComment[]> {
  const res = await fetch(`/api/feed/posts/${postId}/comments`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Error al cargar comentarios');
  return res.json();
}

export async function addComment(
  postId: string,
  content: string,
): Promise<FeedComment> {
  const res = await fetch(`/api/feed/posts/${postId}/comments`, {
    method: 'POST',
    credentials: 'include',
    headers: getAuthHeaders(),
    body: JSON.stringify({ content }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Error al comentar');
  }
  return res.json();
}

export async function toggleCommentLike(
  commentId: string,
): Promise<{ liked: boolean }> {
  const res = await fetch(`/api/feed/comments/${commentId}/like`, {
    method: 'POST',
    credentials: 'include',
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Error al actualizar like del comentario');
  return res.json();
}

export async function recordPostView(postId: string): Promise<void> {
  const res = await fetch(`/api/feed/posts/${postId}/view`, {
    method: 'POST',
    credentials: 'include',
    headers: getAuthHeaders(),
  });
  if (!res.ok) return;
}
