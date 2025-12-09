'use client';

import { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Image as ImageIcon, GripVertical, Eye, EyeOff, Link, X } from 'lucide-react';

interface Banner {
  id: string;
  title: string | null;
  image_url: string;
  link_url: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
}

export default function BannerManagement() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    link_url: '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      const response = await fetch('/api/admin/banners');
      const data = await response.json();
      setBanners(data.banners || []);
    } catch (error) {
      console.error('Error fetching banners:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      alert('Por favor selecciona una imagen');
      return;
    }

    setUploading(true);
    try {
      // Subir imagen a Supabase Storage
      const formDataUpload = new FormData();
      formDataUpload.append('file', selectedFile);
      formDataUpload.append('bucket', 'banners');
      formDataUpload.append('folder', 'dashboard');

      const uploadResponse = await fetch('/api/storage/upload', {
        method: 'POST',
        body: formDataUpload,
      });

      if (!uploadResponse.ok) {
        throw new Error('Error al subir imagen');
      }

      const { url: imageUrl } = await uploadResponse.json();

      // Crear banner en la base de datos
      const response = await fetch('/api/admin/banners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title || null,
          image_url: imageUrl,
          link_url: formData.link_url || null,
        }),
      });

      if (response.ok) {
        await fetchBanners();
        resetForm();
        setShowForm(false);
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error uploading banner:', error);
      alert('Error al subir el banner');
    } finally {
      setUploading(false);
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/banners/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentStatus }),
      });

      if (response.ok) {
        setBanners(prev =>
          prev.map(b => (b.id === id ? { ...b, is_active: !currentStatus } : b))
        );
      }
    } catch (error) {
      console.error('Error toggling banner:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este banner?')) return;

    try {
      const response = await fetch(`/api/admin/banners/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setBanners(prev => prev.filter(b => b.id !== id));
      }
    } catch (error) {
      console.error('Error deleting banner:', error);
    }
  };

  const resetForm = () => {
    setFormData({ title: '', link_url: '' });
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-12 h-12 border-4 border-[#85ea10]/30 border-t-[#85ea10] rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">
            Gestión de Banners
          </h2>
          <p className="text-xs text-gray-600 dark:text-white/60 mt-1">
            Banners que se muestran en el dashboard de usuarios
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-[#85ea10] hover:bg-[#7dd30f] text-black font-black px-5 py-2.5 rounded-xl transition-all duration-200 flex items-center gap-2 text-sm uppercase tracking-tight shadow-lg hover:shadow-xl"
        >
          <Plus className="w-4 h-4" />
          Nuevo Banner
        </button>
      </div>

      {/* Formulario de nuevo banner */}
      {showForm && (
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg rounded-2xl border border-gray-200 dark:border-white/20 p-6 shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">
              Subir Banner
            </h3>
            <button
              onClick={() => {
                setShowForm(false);
                resetForm();
              }}
              className="text-gray-500 hover:text-gray-700 dark:text-white/60 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleUpload} className="space-y-4">
            {/* Área de subida de imagen */}
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
                previewUrl
                  ? 'border-[#85ea10]'
                  : 'border-gray-300 dark:border-gray-600 hover:border-[#85ea10]'
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              {previewUrl ? (
                <div className="relative">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="max-h-48 mx-auto rounded-lg object-contain"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFile(null);
                      setPreviewUrl(null);
                    }}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Haz clic o arrastra una imagen
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    Recomendado: 1920x400px (PNG, JPG, WebP)
                  </p>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  Título (opcional)
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#85ea10] focus:border-[#85ea10]"
                  placeholder="Ej: Promoción de verano"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  URL de enlace (opcional)
                </label>
                <input
                  type="url"
                  value={formData.link_url}
                  onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#85ea10] focus:border-[#85ea10]"
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={uploading || !selectedFile}
                className="flex-1 bg-[#85ea10] hover:bg-[#7dd30f] disabled:bg-gray-400 text-black font-black py-3 rounded-xl transition-colors flex items-center justify-center gap-2 uppercase tracking-tight"
              >
                {uploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                    Subiendo...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Subir Banner
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-white font-bold rounded-xl transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Grid de banners */}
      {banners.length === 0 ? (
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg rounded-2xl border border-gray-200 dark:border-white/20 p-12 text-center shadow-lg">
          <div className="w-16 h-16 bg-[#85ea10]/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <ImageIcon className="w-8 h-8 text-[#85ea10]" />
          </div>
          <h3 className="text-lg font-black text-gray-900 dark:text-white mb-2 uppercase tracking-tight">
            No hay banners
          </h3>
          <p className="text-xs text-gray-600 dark:text-white/60">
            Sube tu primer banner para mostrarlo en el dashboard
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {banners.map((banner) => (
            <div
              key={banner.id}
              className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg rounded-2xl border border-gray-200 dark:border-white/20 hover:border-[#85ea10]/50 transition-all shadow-lg hover:shadow-xl overflow-hidden"
            >
              {/* Imagen del banner */}
              <div className="relative w-full aspect-[4/1] bg-gray-200 dark:bg-gray-800">
                <img
                  src={banner.image_url}
                  alt={banner.title || 'Banner'}
                  className="w-full h-full object-cover"
                />
                {/* Badge de estado */}
                <div className="absolute top-3 right-3">
                  <span
                    className={`px-3 py-1 text-xs font-black rounded-full ${
                      banner.is_active
                        ? 'bg-[#85ea10] text-black'
                        : 'bg-gray-800/80 text-white backdrop-blur-sm'
                    }`}
                  >
                    {banner.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              </div>

              {/* Info y acciones */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight truncate">
                      {banner.title || 'Sin título'}
                    </h3>
                    {banner.link_url && (
                      <p className="text-xs text-[#85ea10] truncate flex items-center gap-1 mt-1">
                        <Link className="w-3 h-3" />
                        {banner.link_url}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleToggleActive(banner.id, banner.is_active)}
                    className={`flex-1 px-3 py-2.5 rounded-lg text-xs font-black transition-colors flex items-center justify-center gap-1.5 uppercase tracking-tight ${
                      banner.is_active
                        ? 'bg-orange-100 dark:bg-orange-500/20 hover:bg-orange-200 dark:hover:bg-orange-500/30 border border-orange-300 dark:border-orange-500/30 text-orange-600 dark:text-orange-400'
                        : 'bg-[#85ea10]/10 hover:bg-[#85ea10]/20 border border-[#85ea10]/30 text-[#85ea10]'
                    }`}
                  >
                    {banner.is_active ? (
                      <>
                        <EyeOff className="w-3.5 h-3.5" />
                        Ocultar
                      </>
                    ) : (
                      <>
                        <Eye className="w-3.5 h-3.5" />
                        Mostrar
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(banner.id)}
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
      )}
    </div>
  );
}

