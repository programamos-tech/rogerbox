'use client';

import {
  Bell,
  BookOpen,
  Bug,
  Heart,
  Home,
  MessageCircle,
  PartyPopper,
  Rss,
  Scale,
  Settings,
  User,
  X,
} from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useIsAdmin } from '@/hooks/auth/useIsAdmin';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { useUserPurchases } from '@/hooks/useUserPurchases';
import { ThemeToggle } from '@/shared/components/ThemeToggle';

const FEED_LAST_VISIT_KEY = 'rogerbox_feed_last_visit_at';

export interface NavbarNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  action: () => void;
  actionText: string;
}

interface DashboardNavbarProps {
  notifications?: NavbarNotification[];
}

export default function DashboardNavbar({
  notifications = [],
}: DashboardNavbarProps) {
  const { user, profile } = useSupabaseAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isAdmin = useIsAdmin();
  const { hasActivePurchases } = useUserPurchases();
  const [showNotifications, setShowNotifications] = useState(false);
  const [feedNewCount, setFeedNewCount] = useState(0);
  const [showBugModal, setShowBugModal] = useState(false);
  const [bugDescription, setBugDescription] = useState('');

  const fetchFeedNewCount = useCallback(() => {
    if (pathname === '/feed') return;
    const since =
      typeof window !== 'undefined'
        ? localStorage.getItem(FEED_LAST_VISIT_KEY)
        : null;
    if (!since) return;
    fetch(`/api/feed/new-count?since=${encodeURIComponent(since)}`)
      .then((res) => res.json())
      .then((data) => setFeedNewCount(Math.max(0, Number(data?.count) ?? 0)))
      .catch(() => setFeedNewCount(0));
  }, [pathname]);

  useEffect(() => {
    fetchFeedNewCount();
  }, [fetchFeedNewCount]);

  useEffect(() => {
    const onFocus = () => fetchFeedNewCount();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [fetchFeedNewCount]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (
        showNotifications &&
        !target.closest('[data-notifications-dropdown]')
      ) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications]);

  const getNavLinkClass = (path: string) => {
    const isDashboard = path === '/dashboard';
    const isActive = isDashboard
      ? pathname === '/dashboard' || pathname.startsWith('/course/')
      : pathname === path || pathname.startsWith(path + '/');
    const base =
      'flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2 rounded-lg text-sm font-medium transition-colors';
    if (isActive) {
      return `${base} text-[#85ea10] bg-[#85ea10]/10 dark:bg-[#85ea10]/20`;
    }
    return `${base} text-gray-600 dark:text-gray-300 hover:text-[#85ea10] hover:bg-white/5 dark:hover:bg-white/5`;
  };

  return (
    <header className="bg-white/80 dark:bg-[#0a1628]/95 backdrop-blur-lg sticky top-0 z-50">
      <div className="max-w-full mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="flex items-center justify-between h-11 sm:h-14 md:h-16">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center hover:opacity-80 transition-opacity flex-shrink-0"
          >
            <h1 className="text-base sm:text-xl md:text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">
              ROGER<span className="text-[#85ea10]">BOX</span>
            </h1>
          </button>

          <nav className="flex items-center gap-0.5 sm:gap-1 md:gap-2 flex-1 justify-end">
            <button
              type="button"
              onClick={() => setShowBugModal(true)}
              className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2 rounded-lg text-sm font-medium transition-colors text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 hover:bg-white/5 dark:hover:bg-white/5"
              title="Reportar tu error aquí"
              aria-label="Reportar tu error aquí"
            >
              <Bug className="w-4 h-4 sm:w-4 sm:h-4 flex-shrink-0" />
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className={getNavLinkClass('/dashboard')}
              title="Inicio"
            >
              <Home className="w-4 h-4 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="hidden sm:inline">Inicio</span>
            </button>
            <button
              onClick={() => router.push('/feed')}
              className={`${getNavLinkClass('/feed')} relative`}
              title={
                feedNewCount > 0
                  ? `${feedNewCount} publicaciones nuevas`
                  : 'Feed'
              }
            >
              <Rss className="w-4 h-4 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="hidden sm:inline">Feed</span>
              {feedNewCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-[#85ea10] text-[#164151] text-xs font-bold">
                  {feedNewCount > 99 ? '99+' : feedNewCount}
                </span>
              )}
            </button>
            {hasActivePurchases && (
              <button
                onClick={() => router.push('/student')}
                className={getNavLinkClass('/student')}
                title="Clases"
              >
                <BookOpen className="w-4 h-4 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="hidden sm:inline">Clases</span>
              </button>
            )}
            <ThemeToggle variant="nav" />
            <div className="relative" data-notifications-dropdown>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className={`${getNavLinkClass('/notifications')} relative`}
                title="Notificaciones"
              >
                <Bell className="w-4 h-4 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="hidden sm:inline">Notificaciones</span>
                {notifications.length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 sm:top-1.5 sm:right-1.5 sm:w-2.5 sm:h-2.5 bg-red-500 rounded-full" />
                )}
              </button>
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50 overflow-hidden">
                  <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <Bell className="w-4 h-4 text-[#85ea10]" />
                      Notificaciones
                    </h3>
                  </div>
                  {notifications.length === 0 ? (
                    <div className="px-4 py-6 text-center">
                      <Bell className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        No tienes notificaciones
                      </p>
                    </div>
                  ) : (
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.map((notif) => {
                        const Icon =
                          notif.type === 'feed_welcome'
                            ? PartyPopper
                            : notif.type === 'feed_post_like' ||
                                notif.type === 'feed_comment_like'
                              ? Heart
                              : notif.type === 'feed_comment'
                                ? MessageCircle
                                : notif.type === 'weight'
                                  ? Scale
                                  : Bell;
                        return (
                          <div
                            key={notif.id}
                            className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700 last:border-0"
                          >
                            <div className="flex items-start gap-3">
                              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                                <Icon className="h-4 w-4" />
                              </span>
                              <div className="flex-1">
                                <p className="font-semibold text-gray-900 dark:text-white text-sm">
                                  {notif.title}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                  {notif.message}
                                </p>
                                <button
                                  onClick={() => {
                                    notif.action();
                                    setShowNotifications(false);
                                  }}
                                  className="mt-2 text-xs font-semibold text-[#85ea10] hover:text-[#7dd30f] transition-colors"
                                >
                                  {notif.actionText} →
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
            <button
              onClick={() => router.push('/profile')}
              className={getNavLinkClass('/profile')}
              title="Mi cuenta"
            >
              <User className="w-4 h-4 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="hidden sm:inline">Mi cuenta</span>
            </button>
            {isAdmin && (
              <button
                onClick={() => router.push('/admin')}
                className={getNavLinkClass('/admin')}
                title="Panel Administrativo"
              >
                <Settings className="w-4 h-4 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="hidden sm:inline">Admin</span>
              </button>
            )}
          </nav>
        </div>
      </div>

      {/* Modal reportar error: renderizado en body para que quede centrado en viewport */}
      {showBugModal &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 sm:p-6 overflow-y-auto"
            onClick={() => {
              setShowBugModal(false);
              setBugDescription('');
            }}
            aria-hidden
          >
            <div
              className="relative w-full max-w-md max-h-[calc(100vh-2rem)] overflow-y-auto rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xl p-4 sm:p-5 shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Bug className="w-5 h-5 text-[#85ea10]" />
                  Reportar un error
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setShowBugModal(false);
                    setBugDescription('');
                  }}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
                  aria-label="Cerrar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nombre
                  </label>
                  <div className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 text-sm">
                    {(profile as { name?: string })?.name ?? '—'}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Cédula
                  </label>
                  <div className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 text-sm">
                    {(profile as { document_id?: string })?.document_id ?? '—'}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Describe el error que encontraste
                  </label>
                  <textarea
                    value={bugDescription}
                    onChange={(e) => setBugDescription(e.target.value)}
                    placeholder="Ej: No me carga el video de la clase del lunes..."
                    className="w-full min-h-[100px] px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#85ea10]/50 focus:border-[#85ea10] resize-y text-sm"
                    maxLength={500}
                  />
                </div>
                <div className="flex justify-end gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setShowBugModal(false);
                      setBugDescription('');
                    }}
                    className="px-5 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 hover:border-gray-300 dark:hover:border-gray-500 font-semibold transition-colors"
                  >
                    Cancelar
                  </button>
                  <a
                    href={
                      'https://wa.me/573002061711?text=' +
                      encodeURIComponent(
                        `Hola RogerBox, reporto un error:\n\nNombre: ${(profile as { name?: string; document_id?: string })?.name ?? 'No indicado'}\nCédula: ${(profile as { document_id?: string })?.document_id ?? 'No indicada'}\n\nDescripción: ${bugDescription.trim() || '(sin descripción)'}`,
                      )
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#85ea10] hover:bg-[#7dd30f] text-black font-semibold transition-colors shadow-sm"
                    onClick={() => {
                      setShowBugModal(false);
                      setBugDescription('');
                    }}
                  >
                    <MessageCircle className="w-4 h-4" />
                    Enviar por WhatsApp
                  </a>
                </div>
              </form>
            </div>
          </div>,
          document.body,
        )}
    </header>
  );
}
