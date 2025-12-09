'use client';

import { useState, useEffect } from 'react';
import { NutritionalBlog } from '@/types';
import { Plus, Edit, Trash2, Eye, EyeOff, Calendar, User, Clock, BookOpen } from 'lucide-react';
import DeleteBlogModal from './DeleteBlogModal';

export default function BlogManagement() {
  const [blogs, setBlogs] = useState<NutritionalBlog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBlog, setEditingBlog] = useState<NutritionalBlog | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [blogToDelete, setBlogToDelete] = useState<NutritionalBlog | null>(null);
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

  // Cargar blogs
  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    try {
      const response = await fetch('/api/blogs/admin');
      const data = await response.json();
      setBlogs(data.blogs || []);
    } catch (error) {
      console.error('Error fetching blogs:', error);
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
    } catch (error) {
      console.error('Error saving blog:', error);
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
    } catch (error) {
      console.error('Error deleting blog:', error);
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
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#85ea10]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">
          Gestión de Blogs Nutricionales
        </h2>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="bg-[#85ea10] hover:bg-[#7dd30f] text-black font-black px-5 py-2.5 rounded-xl transition-all duration-200 flex items-center gap-2 text-sm uppercase tracking-tight shadow-lg hover:shadow-xl"
        >
          <Plus className="w-4 h-4" />
          Nuevo Blog
        </button>
      </div>

      {/* Formulario */}
      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
          <h3 className="text-lg font-semibold mb-4">
            {editingBlog ? 'Editar Blog' : 'Crear Nuevo Blog'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Título *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#85ea10] bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Autor *
                </label>
                <input
                  type="text"
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#85ea10] bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tiempo de lectura (minutos) *
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.reading_time}
                  onChange={(e) => setFormData({ ...formData, reading_time: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#85ea10] bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  URL de imagen destacada
                </label>
                <input
                  type="url"
                  value={formData.featured_image_url}
                  onChange={(e) => setFormData({ ...formData, featured_image_url: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#85ea10] bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Resumen *
              </label>
              <textarea
                value={formData.excerpt}
                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#85ea10] bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Breve descripción del blog..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Contenido *
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={8}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#85ea10] bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Contenido completo del blog..."
                required
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_published"
                checked={formData.is_published}
                onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                className="h-4 w-4 text-[#85ea10] focus:ring-[#85ea10] border-gray-300 rounded"
              />
              <label htmlFor="is_published" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                Publicar inmediatamente
              </label>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="bg-[#85ea10] text-white px-6 py-2 rounded-lg hover:bg-[#6bc20a] transition-colors"
              >
                {editingBlog ? 'Actualizar' : 'Crear'} Blog
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Grid de blogs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {blogs.map((blog) => (
          <div key={blog.id} className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg rounded-2xl border border-gray-200 dark:border-white/20 hover:border-[#85ea10]/50 transition-all group shadow-lg hover:shadow-xl overflow-hidden">
            {/* Imagen del blog */}
            <div className="relative w-full aspect-video bg-gray-200 dark:bg-gray-800 overflow-hidden">
              {blog.featured_image_url ? (
                <img
                  src={blog.featured_image_url}
                  alt={blog.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    e.currentTarget.src = '/images/course-placeholder.jpg';
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-900">
                  <BookOpen className="w-16 h-16 text-gray-400 dark:text-gray-600" />
                </div>
              )}
              {/* Badge de estado sobre la imagen */}
              <div className="absolute top-3 right-3">
                <span
                  className={`px-3 py-1 text-xs font-black rounded-full ${
                    blog.is_published
                      ? 'bg-[#85ea10] text-black'
                      : 'bg-gray-800/80 dark:bg-white/20 text-white dark:text-white/90 backdrop-blur-sm'
                  }`}
                >
                  {blog.is_published ? 'Publicado' : 'Borrador'}
                </span>
              </div>
            </div>

            {/* Contenido */}
            <div className="p-5">
              <h3 className="text-base font-black text-gray-900 dark:text-white line-clamp-2 mb-2 uppercase tracking-tight">
                {blog.title}
              </h3>

              <p className="text-xs font-medium text-gray-600 dark:text-white/60 line-clamp-2 mb-4">{blog.excerpt}</p>

              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="bg-[#85ea10]/10 rounded-lg px-3 py-2 border border-[#85ea10]/20">
                  <p className="text-[10px] font-bold text-gray-600 dark:text-white/60 uppercase tracking-wide mb-0.5">Autor</p>
                  <p className="text-sm font-black text-gray-900 dark:text-white line-clamp-1">
                    {blog.author}
                  </p>
                </div>
                <div className="bg-[#85ea10]/10 rounded-lg px-3 py-2 border border-[#85ea10]/20">
                  <p className="text-[10px] font-bold text-gray-600 dark:text-white/60 uppercase tracking-wide mb-0.5">Lectura</p>
                  <p className="text-sm font-black text-gray-900 dark:text-white">{blog.reading_time} min</p>
                </div>
                <div className="bg-[#85ea10]/10 rounded-lg px-3 py-2 border border-[#85ea10]/20 col-span-2">
                  <p className="text-[10px] font-bold text-gray-600 dark:text-white/60 uppercase tracking-wide mb-0.5">Fecha</p>
                  <p className="text-sm font-black text-gray-900 dark:text-white">{formatDate(blog.created_at)}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(blog)}
                  className="flex-1 bg-[#85ea10]/10 hover:bg-[#85ea10]/20 border border-[#85ea10]/30 text-[#85ea10] px-3 py-2.5 rounded-lg text-xs font-black transition-colors flex items-center justify-center gap-1.5 uppercase tracking-tight"
                >
                  <Edit className="w-3.5 h-3.5" />
                  Editar
                </button>
                <button
                  onClick={() => handleDeleteClick(blog)}
                  className="flex-1 bg-red-100 dark:bg-red-500/20 hover:bg-red-200 dark:hover:bg-red-500/30 border border-red-300 dark:border-red-500/30 text-red-600 dark:text-red-400 px-3 py-2.5 rounded-lg text-xs font-black transition-colors flex items-center justify-center gap-1.5 uppercase tracking-tight"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Delete Confirmation Modal */}
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