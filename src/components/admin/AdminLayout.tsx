'use client';

import {
  BarChart3,
  Bell,
  BookOpen,
  ChevronLeft,
  CreditCard,
  Dumbbell,
  FileText,
  Image,
  Menu,
  Play,
  Plus,
  Search,
  Settings,
  ShoppingCart,
  Users,
  Zap,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { GymSeededAvatar } from '@/shared/components/GymSeededAvatar';

const menuSections = [
  {
    title: 'Principal',
    items: [
      {
        id: 'overview',
        label: 'Dashboard',
        icon: BarChart3,
        description: 'Resumen general',
      },
    ],
  },
  {
    title: 'Sede Física',
    items: [
      {
        id: 'users',
        label: 'Usuarios',
        icon: Users,
        description: 'Gestiona usuarios y clientes físicos',
      },
      {
        id: 'gym-plans',
        label: 'Planes',
        icon: Dumbbell,
        description: 'Gestionar planes del gimnasio',
      },
      {
        id: 'gym-payments',
        label: 'Pagos',
        icon: CreditCard,
        description: 'Facturar planes a clientes físicos',
      },
    ],
  },
  {
    title: 'Sede en Línea',
    items: [
      {
        id: 'sales',
        label: 'Ventas',
        icon: ShoppingCart,
        description: 'Historial de compras',
      },
      {
        id: 'courses',
        label: 'Cursos',
        icon: BookOpen,
        description: 'Gestionar cursos',
      },
      {
        id: 'complements',
        label: 'Retos semanales',
        icon: Play,
        description: 'Videos de retos por día',
      },
      {
        id: 'banners',
        label: 'Banners',
        icon: Image,
        description: 'Banners del dashboard',
      },
      {
        id: 'blogs',
        label: 'Blogs',
        icon: FileText,
        description: 'Artículos nutricionales',
      },
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-[#0a1628] dark:to-gray-900 flex">
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50 h-screen overflow-hidden
          ${sidebarCollapsed ? 'w-16' : 'w-56'}
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          bg-gradient-to-b from-[#020812] via-[#030d1a] to-[#020916] border-r border-[#0d253e]/65
          flex flex-col
          transition-all duration-300 ease-in-out
        `}
      >
        <div
          className={`
            h-16 flex items-center border-b border-[#0d253e]/65 px-4
            ${sidebarCollapsed ? 'justify-center' : 'justify-between'}
          `}
        >
          {!sidebarCollapsed && (
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-white font-black text-xl tracking-tight">
                  ROGER<span className="text-[#85ea10]">BOX</span>
                </h1>
                <span className="text-[10px] text-white/55 uppercase tracking-widest font-semibold">
                  BackOffice
                </span>
              </div>
            </div>
          )}
          {sidebarCollapsed && (
            <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">
                R
              </span>
            </div>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden md:flex w-8 h-8 items-center justify-center rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
          >
            <ChevronLeft
              className={`w-4 h-4 transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`}
            />
          </button>
        </div>

        <nav className="flex-1 py-4 px-3">
          {menuSections.map((section, sectionIndex) => (
            <div key={section.title} className={sectionIndex > 0 ? 'mt-6' : ''}>
              {!sidebarCollapsed && (
                <h3 className="px-3 mb-3 text-xs font-black text-white/45 uppercase tracking-widest">
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
                        router.push(
                          item.id === 'overview'
                            ? '/admin'
                            : `/admin?tab=${item.id}`,
                        );
                        setMobileMenuOpen(false);
                      }}
                      className={`
                        w-full flex items-center gap-3 px-4 py-2.5 rounded-lg
                        transition-all duration-200 group
                        ${
                          isActive
                            ? 'bg-[#85ea10]/20 text-white ring-1 ring-[#85ea10]/35'
                            : 'text-white/70 hover:text-white hover:bg-white/10'
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

      </aside>

      <main
        className={`flex-1 flex flex-col min-h-screen ${sidebarCollapsed ? 'md:ml-16' : 'md:ml-56'}`}
      >
        <header className="h-16 bg-white dark:bg-[#0b1422] border-b border-gray-200/80 dark:border-white/10 flex items-center gap-3 px-3 md:px-5 lg:px-6 sticky top-0 z-30">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-[#164151]/80 dark:text-white/80"
          >
            <Menu className="w-4 h-4" />
          </button>

          <div className="flex-1 max-w-3xl">
            <div className="h-10 rounded-full border border-gray-200 dark:border-white/10 bg-[#f8fafc] dark:bg-[#111b2b] flex items-center gap-2 px-4">
              <Search className="w-4 h-4 text-gray-400 dark:text-white/50" />
              <input
                type="text"
                placeholder="Buscar cliente por nombre, cédula o correo..."
                className="w-full bg-transparent border-0 outline-none text-sm text-[#164151] dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/45"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-2.5 ml-auto">
            <button
              onClick={() => router.push('/admin?tab=gym-payments&newInvoice=1')}
              className="w-8 h-8 rounded-full bg-[#1b1f24] text-white inline-flex items-center justify-center hover:bg-[#0f1115] transition-colors"
              title="Crear factura"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="h-8 px-3 rounded-full border border-gray-200 dark:border-white/12 bg-white dark:bg-[#111b2b] text-[#164151] dark:text-white text-[11px] font-semibold hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
              title="Ir a plataforma"
            >
              Ir a plataforma
            </button>
            {headerRight && <div className="hidden sm:flex">{headerRight}</div>}
            <button className="hidden sm:inline-flex w-8 h-8 rounded-full text-[#164151]/70 dark:text-white/70 hover:bg-gray-100 dark:hover:bg-white/10 items-center justify-center transition-colors">
              <Zap className="w-4 h-4" />
            </button>
            <button className="hidden sm:inline-flex w-8 h-8 rounded-full text-[#164151]/70 dark:text-white/70 hover:bg-gray-100 dark:hover:bg-white/10 items-center justify-center transition-colors">
              <Settings className="w-4 h-4" />
            </button>
            <button className="relative inline-flex w-8 h-8 rounded-full text-[#164151]/70 dark:text-white/70 hover:bg-gray-100 dark:hover:bg-white/10 items-center justify-center transition-colors">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
            </button>
            <div className="flex items-center gap-2 pl-2 md:pl-3 border-l border-gray-200 dark:border-white/10 ml-1">
              {(() => {
                const avatarUrl =
                  authUser?.user_metadata?.avatar_url ||
                  (profile as any)?.avatar_url ||
                  '';
                if (avatarUrl) {
                  return (
                    <img
                      src={avatarUrl}
                      alt="Avatar"
                      className="w-8 h-8 rounded-full object-cover ring-1 ring-gray-200/80"
                    />
                  );
                }
                return (
                  <GymSeededAvatar
                    seed={String(authUser?.id || profile?.id || 'admin')}
                    size={32}
                    className="w-8 h-8 rounded-full ring-1 ring-gray-200/80"
                    alt="Avatar del usuario"
                  />
                );
              })()}
              <div className="leading-tight">
                <p className="text-[12px] font-semibold text-[#164151] dark:text-white truncate max-w-[8rem]">
                  {authUser?.user_metadata?.name || profile?.name || title}
                </p>
                <p className="text-[10px] text-gray-500 dark:text-white/50">
                  {description || 'Admin'}
                </p>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1">
          <div className="w-full px-4 sm:px-6 lg:px-8 py-6">{children}</div>
        </div>
      </main>
    </div>
  );
}
