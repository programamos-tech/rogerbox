'use client';

import { Bell, ChevronDown, Dumbbell, LogOut, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { supabase } from '@/lib/supabase-browser';

export default function CourseHeader() {
  const router = useRouter();
  const { user } = useSupabaseAuth();

  const [userProfile, setUserProfile] = useState<any>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user?.id) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .maybeSingle();

          if (!error && data) {
            setUserProfile(data);
          }
        } catch (error) {}
      }
    };

    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showUserMenu && !target.closest('.user-menu-container')) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showUserMenu]);

  return (
    <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-white/20 sticky top-0 z-50">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center hover:opacity-80 transition-opacity"
          >
            <h1 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">
              ROGER<span className="text-[#85ea10]">BOX</span>
            </h1>
          </button>

          {/* Iconos de navegación */}
          <div className="flex items-center gap-2 sm:gap-3 user-menu-container">
            <button
              onClick={() => router.push('/dashboard')}
              className="w-7 h-7 sm:w-8 sm:h-8 bg-[#85ea10] rounded-full flex items-center justify-center hover:bg-[#7dd30f] transition-colors"
              title="Mi Gimnasio"
            >
              <Dumbbell className="w-4 h-4 sm:w-5 sm:h-5 text-black" />
            </button>

            <button
              className="w-7 h-7 sm:w-8 sm:h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              title="Notificaciones"
            >
              <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700 dark:text-gray-300" />
            </button>

            {user && (
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 text-gray-700 dark:text-white hover:text-[#85ea10] transition-colors"
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-[#85ea10] rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 sm:w-5 sm:h-5 text-black" />
                </div>
                <span className="hidden sm:block text-sm font-medium">
                  {userProfile?.name || 'RogerBox'}
                </span>
                <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4" />
              </button>
            )}

            {showUserMenu && user && (
              <div className="absolute right-4 top-14 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                <a
                  href="/profile"
                  className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <User className="w-4 h-4" />
                  <span>Mi Perfil</span>
                </a>
                <button
                  onClick={() => router.push('/signout')}
                  className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Cerrar sesión</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
