'use client';

import {
  Bell,
  BookOpen,
  Heart,
  Home,
  MessageCircle,
  PartyPopper,
  Rss,
  Scale,
  Settings,
  User,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useIsAdmin } from '@/hooks/auth/useIsAdmin';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { useUserPurchases } from '@/hooks/useUserPurchases';

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
  const { user } = useSupabaseAuth();
  const router = useRouter();
  const isAdmin = useIsAdmin();
  const { hasActivePurchases } = useUserPurchases();
  const [showNotifications, setShowNotifications] = useState(false);

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

  const navLinkClass =
    'flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-[#85ea10] hover:bg-white/5 dark:hover:bg-white/5 transition-colors';

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
              onClick={() => router.push('/dashboard')}
              className={navLinkClass}
              title="Inicio"
            >
              <Home className="w-4 h-4 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="hidden sm:inline">Inicio</span>
            </button>
            <button
              onClick={() => router.push('/feed')}
              className={navLinkClass}
              title="Feed"
            >
              <Rss className="w-4 h-4 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="hidden sm:inline">Feed</span>
            </button>
            {hasActivePurchases && (
              <button
                onClick={() => router.push('/student')}
                className={navLinkClass}
                title="Clases"
              >
                <BookOpen className="w-4 h-4 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="hidden sm:inline">Clases</span>
              </button>
            )}
            <div className="relative" data-notifications-dropdown>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className={`${navLinkClass} relative`}
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
              className={navLinkClass}
              title="Mi cuenta"
            >
              <User className="w-4 h-4 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="hidden sm:inline">Mi cuenta</span>
            </button>
            {isAdmin && (
              <button
                onClick={() => router.push('/admin')}
                className={navLinkClass}
                title="Panel Administrativo"
              >
                <Settings className="w-4 h-4 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="hidden sm:inline">Admin</span>
              </button>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
