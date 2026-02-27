'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { NutritionalBlog } from '@/types';
import { ArrowLeft, Clock, User, Calendar, Share2, BookOpen, Facebook, Instagram, Linkedin, MessageCircle } from 'lucide-react';
import Footer from '@/components/Footer';

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
        const foundBlog = data.blogs.find((b: NutritionalBlog) => b.slug === params.slug);
        if (foundBlog) {
          setBlog(foundBlog);
        } else {
          setError('Blog no encontrado');
        }
      } else {
        setError('Error al cargar el blog');
      }
    } catch (error) {
      console.error('Error fetching blog:', error);
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
  const shareText = blog?.excerpt || '';

  const shareToFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank', 'width=600,height=400');
  };

  const shareToInstagram = () => {
    // Instagram no permite compartir directamente, pero podemos abrir Instagram
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

  const shareToTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTitle)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank', 'width=600,height=400');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#85ea10]"></div>
        </div>
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-16">
          <div className="text-center">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Blog no encontrado
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              El blog que buscas no existe o ha sido eliminado.
            </p>
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-[#85ea10] hover:bg-[#6bc20a] text-black font-bold py-3 px-6 rounded-lg transition-colors flex items-center gap-2 mx-auto"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver al Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">

      {/* Hero Section - Full Width */}
      <div className="relative h-96 md:h-[500px] bg-gradient-to-br from-[#85ea10]/20 to-[#6bc20a]/20 dark:from-gray-800 dark:to-gray-900">
        {blog.featured_image_url ? (
          <>
            <img
              src={blog.featured_image_url}
              alt={blog.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#85ea10]/10 to-[#6bc20a]/10"></div>
        )}
        
        {/* Title Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 leading-tight">
              {blog.title}
            </h1>
            
            <div className="flex flex-wrap items-center gap-6 text-white/90 mb-6">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5" />
                <span className="font-medium text-lg">{blog.author}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                <span className="text-lg">{blog.reading_time} min de lectura</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                <span className="text-lg">{formatDate(blog.published_at || blog.created_at)}</span>
              </div>
            </div>

            <div className="bg-[#85ea10]/20 backdrop-blur-sm border-l-4 border-[#85ea10] p-6 rounded-r-lg">
              <p className="text-white font-medium text-lg leading-relaxed">
                {blog.excerpt}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Full Width */}
      <main className="w-full">
        <div className="max-w-6xl mx-auto px-6 py-12">
          {/* Article Content */}
          <div className="prose prose-xl prose-gray dark:prose-invert max-w-none">
            <div className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line text-lg">
              {blog.content}
            </div>
          </div>

          {/* Share Section */}
          <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                ¿Te gustó este artículo? ¡Compártelo!
              </h3>
              
              <button
                onClick={() => setShowShareModal(true)}
                className="bg-[#85ea10] hover:bg-[#6bc20a] text-black font-bold py-3 px-8 rounded-lg transition-colors inline-flex items-center gap-2 text-lg shadow-lg hover:shadow-xl"
              >
                <Share2 className="w-5 h-5" />
                <span>Compartir</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Related Actions */}
      <div className="w-full bg-gray-50 dark:bg-gray-800 py-12">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-[#85ea10] hover:bg-[#6bc20a] text-black font-bold py-4 px-8 rounded-lg transition-colors inline-flex items-center gap-2 text-lg"
          >
            <ArrowLeft className="w-5 h-5" />
            Ver más Tips Nutricionales
          </button>
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Compartir artículo
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Elige dónde quieres compartir este contenido
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              {/* Facebook */}
              <button
                onClick={() => {
                  shareToFacebook();
                  setShowShareModal(false);
                }}
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-[#85ea10] hover:text-black text-gray-700 dark:text-gray-300 transition-colors"
              >
                <Facebook className="w-8 h-8" />
                <span className="font-medium">Facebook</span>
              </button>

              {/* Instagram */}
              <button
                onClick={() => {
                  shareToInstagram();
                  setShowShareModal(false);
                }}
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-[#85ea10] hover:text-black text-gray-700 dark:text-gray-300 transition-colors"
              >
                <Instagram className="w-8 h-8" />
                <span className="font-medium">Instagram</span>
              </button>

              {/* LinkedIn */}
              <button
                onClick={() => {
                  shareToLinkedIn();
                  setShowShareModal(false);
                }}
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-[#85ea10] hover:text-black text-gray-700 dark:text-gray-300 transition-colors"
              >
                <Linkedin className="w-8 h-8" />
                <span className="font-medium">LinkedIn</span>
              </button>

              {/* WhatsApp */}
              <button
                onClick={() => {
                  shareToWhatsApp();
                  setShowShareModal(false);
                }}
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-[#85ea10] hover:text-black text-gray-700 dark:text-gray-300 transition-colors"
              >
                <MessageCircle className="w-8 h-8" />
                <span className="font-medium">WhatsApp</span>
              </button>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowShareModal(false)}
                className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-medium py-3 px-4 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(shareUrl);
                  setShowShareModal(false);
                  setShowCopyModal(true);
                }}
                className="flex-1 bg-[#85ea10] hover:bg-[#6bc20a] text-black font-bold py-3 px-4 rounded-lg transition-colors"
              >
                Copiar Link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Copy Confirmation Modal */}
      {showCopyModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-sm w-full shadow-2xl text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-[#85ea10]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-[#85ea10]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                ¡Link copiado!
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                El enlace se ha copiado al portapapeles. Ya puedes compartirlo donde quieras.
              </p>
            </div>

            <button
              onClick={() => setShowCopyModal(false)}
              className="w-full bg-[#85ea10] hover:bg-[#6bc20a] text-black font-bold py-3 px-4 rounded-lg transition-colors"
            >
              Perfecto
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <Footer />
    </div>
  );
}
