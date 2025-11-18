'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { NutritionalBlog } from '@/types';
import { Clock, User, Calendar, ArrowRight, BookOpen } from 'lucide-react';

export default function NutritionalBlogs() {
  const router = useRouter();
  const [blogs, setBlogs] = useState<NutritionalBlog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    try {
      const response = await fetch('/api/blogs');
      const data = await response.json();
      setBlogs(data.blogs || []);
    } catch (error) {
      console.error('Error fetching blogs:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleBlogClick = (blog: NutritionalBlog) => {
    router.push(`/blog/${blog.slug}`);
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#85ea10]"></div>
        </div>
      </div>
    );
  }

  if (blogs.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
        <div className="text-center py-8">
          <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Próximamente
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Estamos preparando contenido nutricional para ti
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <BookOpen className="w-5 h-5 text-[#85ea10]" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Tips Nutricionales
            </h2>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Consejos y recomendaciones de nuestros expertos
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-[#85ea10] font-medium">
          <BookOpen className="w-4 h-4 flex-shrink-0" />
          <span>{blogs.length} artículos</span>
        </div>
      </div>

      {/* Blog Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {blogs.slice(0, 6).map((blog) => (
          <div
            key={blog.id}
            className="group cursor-pointer"
            onClick={() => handleBlogClick(blog)}
          >
            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 hover:shadow-lg transition-all duration-300 group-hover:scale-105">
              {/* Imagen */}
              {blog.featured_image_url && (
                <div className="mb-4">
                  <img
                    src={blog.featured_image_url}
                    alt={blog.title}
                    className="w-full h-32 object-cover rounded-lg"
                    onError={(e) => {
                      e.currentTarget.src = '/images/course-placeholder.jpg';
                    }}
                  />
                </div>
              )}

              {/* Contenido */}
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2 group-hover:text-[#85ea10] transition-colors">
                  {blog.title}
                </h3>
                
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
                  {blog.excerpt}
                </p>

                {/* Meta información */}
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {blog.author}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {blog.reading_time} min
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(blog.published_at || blog.created_at)}
                  </div>
                </div>

                {/* Botón de leer más */}
                <div className="flex items-center justify-between pt-2">
                  <span className="text-sm text-[#85ea10] font-medium group-hover:text-[#6bc20a] transition-colors">
                    Leer más
                  </span>
                  <ArrowRight className="w-4 h-4 text-[#85ea10] group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}