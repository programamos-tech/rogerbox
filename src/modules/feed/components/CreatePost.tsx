'use client';

import { ImagePlus, Loader2, Send, X } from 'lucide-react';
import { useRef, useState } from 'react';

interface CreatePostProps {
  onSuccess: () => void;
  onError: (message: string) => void;
  isSubmitting: boolean;
  onSubmit: (content: string, imageUrls: string[]) => Promise<void>;
}

export default function CreatePost({
  onSuccess,
  onError,
  isSubmitting,
  onSubmit,
}: CreatePostProps) {
  const [content, setContent] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', 'feed-images');
      formData.append('folder', 'posts');
      const res = await fetch('/api/storage/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al subir');
      if (data.url) setImageUrls((prev) => [...prev, data.url]);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Error al subir la imagen');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const removeImage = (url: string) => {
    setImageUrls((prev) => prev.filter((u) => u !== url));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed && imageUrls.length === 0) {
      onError('Escribe algo o sube una imagen');
      return;
    }
    try {
      await onSubmit(trimmed || ' ', imageUrls);
      setContent('');
      setImageUrls([]);
      onSuccess();
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Error al publicar');
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-gray-800/80 shadow-sm overflow-hidden"
    >
      <div className="px-4 sm:px-5 py-3">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Comparte tus logros, rutinas y momentos con la comunidad RogerBox."
          className="w-full min-h-[52px] py-1 border-0 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-0 text-[15px] leading-relaxed"
          maxLength={2000}
          disabled={isSubmitting}
          rows={2}
        />
        {imageUrls.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {imageUrls.map((url) => (
              <div
                key={url}
                className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200/80 dark:border-white/10"
              >
                <img
                  src={url}
                  alt="Post"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeImage(url)}
                  className="absolute top-1 right-1 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-black/80 transition-colors"
                  aria-label="Quitar imagen"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="px-4 sm:px-5 py-2.5 border-t border-gray-100 dark:border-white/5 flex items-center justify-between gap-3 bg-gray-50/50 dark:bg-gray-900/30">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageSelect}
          disabled={uploading || isSubmitting}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || isSubmitting}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-gray-500 dark:text-gray-400 hover:text-[#85ea10] hover:bg-[#85ea10]/10 transition-colors disabled:opacity-50"
        >
          {uploading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <ImagePlus className="w-5 h-5" />
          )}
          <span className="text-sm font-medium">Foto</span>
        </button>
        <button
          type="submit"
          disabled={
            isSubmitting ||
            (!content.trim() && imageUrls.length === 0) ||
            uploading
          }
          className="flex items-center gap-2 bg-[#85ea10] hover:bg-[#7dd30f] disabled:opacity-50 text-gray-900 font-semibold px-4 py-2.5 rounded-xl transition-colors disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          Publicar
        </button>
      </div>
    </form>
  );
}
