'use client';

import {
  BookOpen,
  Calendar,
  Clock,
  Edit,
  Plus,
  Sparkles,
  Trash2,
  User,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import type { NutritionalBlog } from '@/types';
import DeleteBlogModal from './DeleteBlogModal';

const inputClass =
  'w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-white/35 transition-colors focus:border-[#85ea10]/35 focus:outline-none focus:ring-1 focus:ring-[#85ea10]/20';

const labelClass = 'mb-1.5 block text-xs font-medium uppercase tracking-wide text-white/55';

export default function BlogManagement() {
  const [blogs, setBlogs] = useState<NutritionalBlog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBlog, setEditingBlog] = useState<NutritionalBlog | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [blogToDelete, setBlogToDelete] = useState<NutritionalBlog | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    reading_time: 3,
    excerpt: '',
    content: '',
    featured_image_url: '',
    is_published: false,
  });

  useEffect(() => {
    fetchBlogs();
  }, []);

  useEffect(() => {
    if (!showForm) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowForm(false);
        resetForm();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showForm]);

  const fetchBlogs = async () => {
    try {
      const response = await fetch('/api/blogs/admin');
      const data = await response.json();
      setBlogs(data.blogs || []);
    } catch {
      setBlogs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingBlog ? `/api/blogs/${editingBlog.id}` : '/api/blogs';
      const method = editingBlog ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchBlogs();
        resetForm();
        setShowForm(false);
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch {
      alert('Error al guardar el blog');
    }
  };

  const handleEdit = (blog: NutritionalBlog) => {
    setEditingBlog(blog);
    setFormData({
      title: blog.title,
      author: blog.author,
      reading_time: blog.reading_time,
      excerpt: blog.excerpt,
      content: blog.content,
      featured_image_url: blog.featured_image_url || '',
      is_published: blog.is_published,
    });
    setShowForm(true);
  };

  const handleDeleteClick = (blog: NutritionalBlog) => {
    setBlogToDelete(blog);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!blogToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/blogs/${blogToDelete.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchBlogs();
        setShowDeleteModal(false);
        setBlogToDelete(null);
      } else {
        alert('Error al eliminar el blog');
      }
    } catch {
      alert('Error al eliminar el blog');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setBlogToDelete(null);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      author: '',
      reading_time: 3,
      excerpt: '',
      content: '',
      featured_image_url: '',
      is_published: false,
    });
    setEditingBlog(null);
  };

  const closeModal = () => {
    setShowForm(false);
    resetForm();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-[240px] items-center justify-center">
        <div
          className="h-9 w-9 animate-spin rounded-full border-2 border-white/15 border-t-white/70"
          aria-hidden
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Cabecera */}
      <div className="flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#85ea10]/90">
            Contenido
          </p>
          <h2 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
            Blog nutricional
          </h2>
          <p className="mt-1 max-w-lg text-sm text-white/45">
            Artículos para el feed, el dashboard y la sección de tips.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-[#164151] shadow-sm transition hover:bg-white/95 active:scale-[0.99]"
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} />
          Nuevo artículo
        </button>
      </div>

      {/* Modal crear / editar */}
      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-4">
          <button
            type="button"
            aria-label="Cerrar"
            className="absolute inset-0 bg-[#0a1620]/80 backdrop-blur-sm"
            onClick={closeModal}
          />
          <div
            className="relative z-10 flex max-h-[min(92vh,900px)] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl border border-white/10 bg-[#111c26] shadow-2xl sm:rounded-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="blog-form-title"
          >
            <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4 sm:px-6">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#85ea10]/85">
                  {editingBlog ? 'Editar' : 'Nuevo'}
                </p>
                <h3
                  id="blog-form-title"
                  className="mt-0.5 text-lg font-semibold text-white"
                >
                  {editingBlog ? 'Editar artículo' : 'Crear artículo'}
                </h3>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg p-2 text-white/45 transition hover:bg-white/5 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="flex flex-1 flex-col overflow-y-auto px-5 py-5 sm:px-6"
            >
              <div className="space-y-4 pb-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className={labelClass}>Título *</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                      className={inputClass}
                      required
                      placeholder="Ej. Hidratación en entrenamiento"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Autor *</label>
                    <input
                      type="text"
                      value={formData.author}
                      onChange={(e) =>
                        setFormData({ ...formData, author: e.target.value })
                      }
                      className={inputClass}
                      required
                      placeholder="Nombre visible"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className={labelClass}>
                      Tiempo de lectura (min) *
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={formData.reading_time}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          reading_time:
                            parseInt(e.target.value, 10) || 1,
                        })
                      }
                      className={inputClass}
                      required
                    />
                  </div>
                  <div>
                    <label className={labelClass}>
                      URL imagen destacada
                    </label>
                    <input
                      type="url"
                      value={formData.featured_image_url}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          featured_image_url: e.target.value,
                        })
                      }
                      className={inputClass}
                      placeholder="https://…"
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Resumen *</label>
                  <textarea
                    value={formData.excerpt}
                    onChange={(e) =>
                      setFormData({ ...formData, excerpt: e.target.value })
                    }
                    rows={3}
                    className={`${inputClass} resize-y min-h-[88px]`}
                    placeholder="Breve descripción que verán en el listado…"
                    required
                  />
                </div>

                <div>
                  <label className={labelClass}>Contenido *</label>
                  <textarea
                    value={formData.content}
                    onChange={(e) =>
                      setFormData({ ...formData, content: e.target.value })
                    }
                    rows={10}
                    className={`${inputClass} resize-y min-h-[200px]`}
                    placeholder="Texto completo del artículo…"
                    required
                  />
                </div>

                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 transition hover:bg-white/[0.04]">
                  <input
                    type="checkbox"
                    checked={formData.is_published}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        is_published: e.target.checked,
                      })
                    }
                    className="h-4 w-4 rounded border-white/20 bg-white/5 text-[#85ea10] focus:ring-[#85ea10]/40"
                  />
                  <span className="text-sm text-white/80">
                    Publicar al guardar
                  </span>
                </label>
              </div>

              <div className="sticky bottom-0 mt-auto flex flex-col-reverse gap-2 border-t border-white/10 bg-[#111c26] pt-4 sm:flex-row sm:justify-end sm:gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-transparent px-5 py-2.5 text-sm font-medium text-white/85 transition hover:bg-white/5"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-xl bg-white px-6 py-2.5 text-sm font-semibold text-[#164151] shadow-sm transition hover:bg-white/95 active:scale-[0.99]"
                >
                  {editingBlog ? 'Guardar cambios' : 'Crear artículo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lista vacía */}
      {blogs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-6 py-14 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
            <Sparkles className="h-7 w-7 text-white/40" />
          </div>
          <h3 className="text-base font-semibold text-white">
            Aún no hay artículos
          </h3>
          <p className="mx-auto mt-2 max-w-sm text-sm text-white/45">
            Crea el primero para mostrarlo en el feed y en la app.
          </p>
          <button
            type="button"
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-[#164151] shadow-sm transition hover:bg-white/95"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            Crear artículo
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-3">
          {blogs.map((blog) => (
            <article
              key={blog.id}
              className="group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition hover:border-white/18 hover:bg-white/[0.05]"
            >
              <div className="relative aspect-[16/10] bg-white/5">
                {blog.featured_image_url ? (
                  <img
                    src={blog.featured_image_url}
                    alt=""
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                    onError={(e) => {
                      e.currentTarget.src = '/images/course-placeholder.jpg';
                    }}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-white/[0.04] to-transparent">
                    <BookOpen className="h-12 w-12 text-white/20" />
                  </div>
                )}
                <div className="absolute right-3 top-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${
                      blog.is_published
                        ? 'bg-white text-[#164151]'
                        : 'border border-white/20 bg-black/40 text-white/90 backdrop-blur-sm'
                    }`}
                  >
                    {blog.is_published ? 'Publicado' : 'Borrador'}
                  </span>
                </div>
              </div>

              <div className="flex flex-1 flex-col p-5">
                <h3 className="line-clamp-2 text-base font-semibold leading-snug text-white">
                  {blog.title}
                </h3>
                <p className="mt-2 line-clamp-2 text-sm text-white/50">
                  {blog.excerpt}
                </p>

                <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
                    <p className="mb-0.5 flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-white/40">
                      <User className="h-3 w-3" />
                      Autor
                    </p>
                    <p className="truncate font-medium text-white/90">
                      {blog.author}
                    </p>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
                    <p className="mb-0.5 flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-white/40">
                      <Clock className="h-3 w-3" />
                      Lectura
                    </p>
                    <p className="font-medium text-white/90">
                      {blog.reading_time} min
                    </p>
                  </div>
                  <div className="col-span-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
                    <p className="mb-0.5 flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-white/40">
                      <Calendar className="h-3 w-3" />
                      Creado
                    </p>
                    <p className="font-medium text-white/90">
                      {formatDate(blog.created_at)}
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleEdit(blog)}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-white/20 bg-white/[0.06] py-2.5 text-xs font-semibold text-white transition hover:bg-white/[0.12]"
                  >
                    <Edit className="h-3.5 w-3.5" />
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteClick(blog)}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-red-500/25 bg-red-500/[0.08] py-2.5 text-xs font-semibold text-red-300 transition hover:bg-red-500/15"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Eliminar
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <DeleteBlogModal
        isOpen={showDeleteModal}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        blogTitle={blogToDelete?.title || ''}
        isLoading={isDeleting}
      />
    </div>
  );
}
