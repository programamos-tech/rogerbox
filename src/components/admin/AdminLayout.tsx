'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  BarChart3,
  Bell,
  BookOpen,
  ChevronLeft,
  CreditCard,
  Dumbbell,
  FileText,
  Home,
  Image,
  Menu,
  Play,
  Settings,
  ShoppingCart,
  User,
  Users,
} from 'lucide-react';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';

const menuSections = [
  {
    title: 'Principal',
    items: [{ id: 'overview', label: 'Dashboard', icon: BarChart3, description: 'Resumen general' }],
  },
  {
    title: 'Sede Física',
    items: [
      { id: 'users', label: 'Usuarios', icon: Users, description: 'Gestiona usuarios y clientes físicos' },
      { id: 'gym-plans', label: 'Planes', icon: Dumbbell, description: 'Gestionar planes del gimnasio' },
      { id: 'gym-payments', label: 'Pagos', icon: CreditCard, description: 'Facturar planes a clientes físicos' },
    ],
  },
  {
    title: 'Sede en Línea',
    items: [
      { id: 'sales', label: 'Ventas', icon: ShoppingCart, description: 'Historial de compras' },
      { id: 'courses', label: 'Cursos', icon: BookOpen, description: 'Gestionar cursos' },
      { id: 'complements', label: 'Complementos', icon: Play, description: 'Videos semanales' },
      { id: 'banners', label: 'Banners', icon: Image, description: 'Banners del dashboard' },
      { id: 'blogs', label: 'Blogs', icon: FileText, description: 'Artículos nutricionales' },
    ],
  },
  {
    title: 'Sistema',
    items: [
      { id: 'settings', label: 'Configuración', icon: Settings, description: 'Ajustes de la plataforma' },
    ],
  },
];

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
  description?: string;
  /** id del ítem del menú a marcar como activo (ej: 'courses', 'users') */
  activeTab: string;
  /** Contenido opcional a la derecha del header (ej. botón Volver) */
  headerRight?: React.ReactNode;
}

export default function AdminLayout({
  children,
  title,
  description,
  activeTab,
  headerRight,
}: AdminLayoutProps) {
  const router = useRouter();
  const { user: authUser, profile } = useSupabaseAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 flex">
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside
        className={`
          fixed md:static inset-y-0 left-0 z-50
          ${sidebarCollapsed ? 'w-16' : 'w-56'}
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-white/10
          flex flex-col
          transition-all duration-300 ease-in-out
        `}
      >
        <div
          className={`
            h-16 flex items-center border-b border-gray-200 dark:border-white/10 px-4
            ${sidebarCollapsed ? 'justify-center' : 'justify-between'}
          `}
        >
          {!sidebarCollapsed && (
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-[#164151] dark:text-white font-black text-xl tracking-tight">
                  ROGER<span className="text-[#85ea10]">BOX</span>
                </h1>
                <span className="text-[10px] text-gray-500 dark:text-white/40 uppercase tracking-widest font-semibold">
                  Admin Panel
                </span>
              </div>
            </div>
          )}
          {sidebarCollapsed && (
            <div className="w-10 h-10 bg-gray-200 dark:bg-white/10 rounded-lg flex items-center justify-center">
              <span className="text-[#164151] dark:text-white font-bold text-sm">R</span>
            </div>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden md:flex w-8 h-8 items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500 dark:text-white/60 hover:text-[#164151] dark:hover:text-white transition-colors"
          >
            <ChevronLeft className={`w-4 h-4 transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3">
          {menuSections.map((section, sectionIndex) => (
            <div key={section.title} className={sectionIndex > 0 ? 'mt-6' : ''}>
              {!sidebarCollapsed && (
                <h3 className="px-3 mb-3 text-xs font-black text-[#164151]/60 dark:text-white/50 uppercase tracking-widest">
                  {section.title}
                </h3>
              )}
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = item.id === activeTab;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        router.push(item.id === 'overview' ? '/admin' : `/admin?tab=${item.id}`);
                        setMobileMenuOpen(false);
                      }}
                      className={`
                        w-full flex items-center gap-3 px-4 py-2.5 rounded-lg
                        transition-all duration-200 group
                        ${isActive
                          ? 'bg-[#85ea10]/20 dark:bg-[#85ea10]/20 text-[#164151] dark:text-white'
                          : 'text-[#164151]/80 dark:text-white/60 hover:text-[#164151] dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5'
                        }
                        ${sidebarCollapsed ? 'justify-center' : ''}
                      `}
                      title={sidebarCollapsed ? item.label : undefined}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      {!sidebarCollapsed && (
                        <div className="flex-1 text-left min-w-0">
                          <span className="text-xs font-semibold tracking-tight truncate">
                            {item.label}
                          </span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div
          className={`
            border-t border-gray-200 dark:border-white/10 p-4
            ${sidebarCollapsed ? 'flex justify-center' : ''}
          `}
        >
          {!sidebarCollapsed ? (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-200 dark:bg-white/10 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-3.5 h-3.5 text-[#164151]/70 dark:text-white/70" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-[#164151] dark:text-white truncate">
                  {authUser?.user_metadata?.name || profile?.name || 'Admin'}
                </p>
                <p className="text-[10px] font-medium text-gray-500 dark:text-white/50 truncate">Admin</p>
              </div>
              <button
                onClick={() => router.push('/dashboard')}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-[#164151]/80 dark:text-white/60 hover:text-[#164151] dark:hover:text-white transition-colors flex-shrink-0"
                title="Ir al Dashboard"
              >
                <Home className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => router.push('/dashboard')}
              className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-[#164151]/80 dark:text-white/60 hover:text-[#164151] dark:hover:text-white transition-colors"
              title="Ir al Dashboard"
            >
              <Home className="w-4 h-4" />
            </button>
          )}
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <header className="h-16 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-white/20 flex items-center justify-between px-4 md:px-6 lg:px-8 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-[#164151]/80 dark:text-white/60"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-xl font-black text-[#164151] dark:text-white uppercase tracking-tight">
                {title}
              </h1>
              {description && (
                <p className="text-xs text-[#164151]/80 dark:text-white/60 hidden sm:block font-medium">
                  {description}
                </p>
              )}
            </div>
          </div>
          {headerRight && (
            <div className="flex items-center gap-2 sm:gap-3">
              {headerRight}
            </div>
          )}
        </header>

        <div className="flex-1 overflow-y-auto">
          <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
