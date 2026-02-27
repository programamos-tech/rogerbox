'use client';

import { useState, useEffect, useCallback } from 'react';
import { useStore } from '@/lib/store';
import { Users, Video, BookOpen, Utensils, BarChart3, Settings, Plus, Eye, Edit, Trash2, TrendingUp, DollarSign, Calendar, UserCheck } from 'lucide-react';
import CourseManagement from './admin/CourseManagement';
import NutritionalPlanManagement from './admin/NutritionalPlanManagement';
import BlogManagement from './admin/BlogManagement';

export default function AdminDashboard() {
  const { users, videos, nutritionalPlans, classes } = useStore();
  const [activeTab, setActiveTab] = useState('dashboard');

  // Ensure arrays are defined with fallbacks
  const safeUsers = users || [];
  const safeVideos = videos || [];
  const safeNutritionalPlans = nutritionalPlans || [];
  const safeClasses = classes || [];

  // Calculate stats manually to avoid hydration issues
  const stats = {
    totalUsers: safeUsers.length,
    activeMemberships: safeUsers.filter(u => u.membership?.isActive).length,
    weeklyReservations: 0, // Simplified to avoid date calculations
    weeklyAttendances: 0,  // Simplified to avoid date calculations
  };

  const tabs = [
    { id: 'dashboard', name: 'Dashboard', icon: BarChart3 },
    { id: 'users', name: 'Usuarios', icon: Users },
    { id: 'courses', name: 'Cursos', icon: Video },
    { id: 'nutritional-plans', name: 'Planes Nutricionales', icon: Utensils },
    { id: 'blogs', name: 'Blogs', icon: BookOpen },
    { id: 'settings', name: 'Configuración', icon: Settings },
  ];

  const renderDashboard = () => (
    <div className="space-y-8">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/60 text-sm">Total Usuarios</p>
              <p className="text-3xl font-bold text-white">{stats.totalUsers}</p>
            </div>
            <Users className="w-8 h-8 text-[#85ea10]" />
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/60 text-sm">Membresías Activas</p>
              <p className="text-3xl font-bold text-white">{stats.activeMemberships}</p>
            </div>
            <UserCheck className="w-8 h-8 text-[#85ea10]" />
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/60 text-sm">Reservas Esta Semana</p>
              <p className="text-3xl font-bold text-white">{stats.weeklyReservations}</p>
            </div>
            <Calendar className="w-8 h-8 text-[#85ea10]" />
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/60 text-sm">Asistencias Esta Semana</p>
              <p className="text-3xl font-bold text-white">{stats.weeklyAttendances}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-[#85ea10]" />
          </div>
        </div>
      </div>

      {/* Content Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white">Cursos</h3>
            <Video className="w-6 h-6 text-[#85ea10]" />
          </div>
          <p className="text-2xl font-bold text-white">{safeClasses.length}</p>
          <p className="text-white/60 text-sm">Cursos disponibles</p>
        </div>

        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white">Planes Nutricionales</h3>
            <Utensils className="w-6 h-6 text-[#85ea10]" />
          </div>
          <p className="text-2xl font-bold text-white">{safeNutritionalPlans.length}</p>
          <p className="text-white/60 text-sm">Planes disponibles</p>
        </div>

        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white">Blogs</h3>
            <BookOpen className="w-6 h-6 text-[#85ea10]" />
          </div>
          <p className="text-2xl font-bold text-white">0</p>
          <p className="text-white/60 text-sm">Artículos publicados</p>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
        <h3 className="text-xl font-bold text-white mb-6">Actividad Reciente</h3>
        <div className="space-y-4">
          {safeUsers.slice(0, 5).map((user) => (
            <div key={user.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-[#85ea10]/20 rounded-full flex items-center justify-center">
                  <Users className="w-5 h-5 text-[#85ea10]" />
                </div>
                <div>
                  <p className="text-white font-medium">{user.name}</p>
                  <p className="text-white/60 text-sm">
                    {user.membership?.isActive ? 'Membresía activa' : 'Sin membresía'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-white/60 text-sm">
                  {user.createdAt.toLocaleDateString('es-ES')}
                </p>
                <p className="text-[#85ea10] text-sm">
                  {(user.reservations || []).length} reservas
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Usuarios Registrados</h2>
        <div className="text-white/60">
          {safeUsers.length} usuarios total
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5">
              <tr>
                <th className="px-6 py-4 text-left text-white/80 font-medium">Usuario</th>
                <th className="px-6 py-4 text-left text-white/80 font-medium">Peso</th>
                <th className="px-6 py-4 text-left text-white/80 font-medium">Altura</th>
                <th className="px-6 py-4 text-left text-white/80 font-medium">Objetivos</th>
                <th className="px-6 py-4 text-left text-white/80 font-medium">Membresía</th>
                <th className="px-6 py-4 text-left text-white/80 font-medium">Registro</th>
                <th className="px-6 py-4 text-left text-white/80 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {safeUsers.map((user) => (
                <tr key={user.id} className="border-t border-white/10">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-[#85ea10]/20 rounded-full flex items-center justify-center">
                        <Users className="w-4 h-4 text-[#85ea10]" />
                      </div>
                      <div>
                        <p className="text-white font-medium">{user.name}</p>
                        <p className="text-white/60 text-sm">{user.gender}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-white">{user.weight} kg</td>
                  <td className="px-6 py-4 text-white">{user.height} cm</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {(user.goals || []).slice(0, 2).map((goal, index) => (
                        <span key={index} className="px-2 py-1 bg-[#85ea10]/20 text-[#85ea10] rounded-full text-xs">
                          {goal}
                        </span>
                      ))}
                      {(user.goals || []).length > 2 && (
                        <span className="px-2 py-1 bg-white/10 text-white/60 rounded-full text-xs">
                          +{(user.goals || []).length - 2}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      user.membership?.isActive 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {user.membership?.isActive ? 'Activa' : 'Inactiva'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-white/60 text-sm">
                    {user.createdAt.toLocaleDateString('es-ES')}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <button className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return renderDashboard();
      case 'users':
        return renderUsers();
      case 'courses':
        return (
          <CourseManagement
            courses={[]} // Mock data - would come from store
            onAddCourse={(course) => console.log('Add course:', course)}
            onEditCourse={(id, course) => console.log('Edit course:', id, course)}
            onDeleteCourse={(id) => console.log('Delete course:', id)}
          />
        );
      case 'nutritional-plans':
        return (
          <NutritionalPlanManagement
            plans={safeNutritionalPlans}
            onAddPlan={(plan) => console.log('Add plan:', plan)}
            onEditPlan={(id, plan) => console.log('Edit plan:', id, plan)}
            onDeletePlan={(id) => console.log('Delete plan:', id)}
          />
        );
      case 'blogs':
        return (
          <BlogManagement />
        );
      case 'settings':
        return <div className="text-white">Configuración - Próximamente</div>;
      default:
        return renderDashboard();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      {/* Background Overlay */}
      <div className="fixed inset-0 bg-gradient-to-r from-[#164151]/80 via-[#29839c]/70 to-[#164151]/60 backdrop-blur-sm z-0"></div>
      
      {/* Content */}
      <div className="relative z-10 min-h-screen">
        {/* Header */}
        <div className="bg-white/5 backdrop-blur-sm border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-[#85ea10] rounded-lg flex items-center justify-center">
                  <Settings className="w-6 h-6 text-black" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">Panel de Administración</h1>
                  <p className="text-white/60 text-sm">RogerBox - Gestión de Plataforma</p>
                </div>
              </div>
              <div className="text-white/60 text-sm">
                Bienvenido, Roger
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex space-x-8">
            {/* Sidebar */}
            <div className="w-64 flex-shrink-0">
              <nav className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                        activeTab === tab.id
                          ? 'bg-[#85ea10] text-black font-medium'
                          : 'text-white/80 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{tab.name}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Main Content */}
            <div className="flex-1">
              {renderContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
