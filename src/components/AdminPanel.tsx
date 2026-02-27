'use client';

import { useState, useEffect } from 'react';
import { appStore } from '@/lib/store';
import { User, Video, Class, AdminStats, ClassAttendance } from '@/types';
import { Users, CreditCard, Calendar, CheckCircle, Plus, BarChart3, Eye, Trash2 } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { es } from 'date-fns/locale';

export default function AdminPanel() {
  const [users, setUsers] = useState<User[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [classAttendances, setClassAttendances] = useState<ClassAttendance[]>([]);
  const [showAddVideo, setShowAddVideo] = useState(false);
  const [newVideo, setNewVideo] = useState({
    title: '',
    description: '',
    thumbnailUrl: '',
    videoUrl: '',
    level: 'Beginner' as 'Beginner' | 'Intermediate' | 'Advanced',
    duration: 30,
    price: 1000,
  });

  useEffect(() => {
    const unsubscribe = appStore.subscribe(() => {
      const state = appStore.getState();
      setUsers(state.users);
      setVideos(state.videos);
      setClasses(state.classes);
      setStats(appStore.getAdminStats());
      setClassAttendances(appStore.getClassAttendances(selectedDate));
    });

    const state = appStore.getState();
    setUsers(state.users);
    setVideos(state.videos);
    setClasses(state.classes);
    setStats(appStore.getAdminStats());
    setClassAttendances(appStore.getClassAttendances(selectedDate));

    return () => {
      unsubscribe();
    };
  }, [selectedDate]);

  const handleAddVideo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVideo.title || !newVideo.description || !newVideo.thumbnailUrl || !newVideo.videoUrl) {
      alert('Por favor completa todos los campos');
      return;
    }

    appStore.addVideo(newVideo);
    setNewVideo({
      title: '',
      description: '',
      thumbnailUrl: '',
      videoUrl: '',
      level: 'Beginner',
      duration: 30,
      price: 1000,
    });
    setShowAddVideo(false);
    alert('Video agregado exitosamente');
  };

  const getActiveMemberships = () => {
    return users.filter(user => user.membership?.isActive);
  };

  const getInactiveMemberships = () => {
    return users.filter(user => !user.membership?.isActive);
  };

  const getWeeklyReservations = () => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    return users
      .flatMap(u => u.reservations)
      .filter(r => r.createdAt >= weekStart && r.createdAt <= weekEnd);
  };

  const getWeeklyAttendances = () => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    return users
      .flatMap(u => u.attendances)
      .filter(a => a.confirmedAt >= weekStart && a.confirmedAt <= weekEnd);
  };

  return (
    <div className="space-y-6">
        {/* Admin Header */}
        <div className="bg-black/40 backdrop-blur-md rounded-2xl p-6 border border-white/20">
          <h2 className="text-3xl font-black text-white flex items-center space-x-3 mb-4">
            <BarChart3 className="w-8 h-8 text-[#85ea10]" />
            <span>PANEL DE ADMINISTRACIÓN</span>
          </h2>
          <p className="text-white text-lg font-medium">
            Gestión completa de usuarios, clases, videos y estadísticas de RogerBox.
          </p>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-black/40 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-[#85ea10] rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-black" />
                </div>
                <div>
                  <p className="text-white text-sm font-medium">USUARIOS TOTALES</p>
                  <p className="text-2xl font-black text-white">{stats.totalUsers}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-black/40 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-[#85ea10] rounded-full flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-black" />
                </div>
                <div>
                  <p className="text-white text-sm font-medium">MEMBRESÍAS ACTIVAS</p>
                  <p className="text-2xl font-black text-white">{stats.activeMemberships}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-black/40 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-[#85ea10] rounded-full flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-black" />
                </div>
                <div>
                  <p className="text-white text-sm font-medium">RESERVAS ESTA SEMANA</p>
                  <p className="text-2xl font-black text-white">{stats.weeklyReservations}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-black/40 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-[#85ea10] rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-black" />
                </div>
                <div>
                  <p className="text-white text-sm font-medium">ASISTENCIAS ESTA SEMANA</p>
                  <p className="text-2xl font-black text-white">{stats.weeklyAttendances}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Membership Management */}
        <div className="bg-black/40 backdrop-blur-md rounded-2xl p-6 border border-white/20">
          <h3 className="text-2xl font-black text-white mb-6">GESTIÓN DE MEMBRESÍAS</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-lg font-bold text-[#85ea10] mb-4 flex items-center space-x-2">
                <CheckCircle className="w-6 h-6" />
                <span>MEMBRESÍAS ACTIVAS ({getActiveMemberships().length})</span>
              </h4>
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {getActiveMemberships().map((user) => (
                  <div key={user.id} className="bg-[#85ea10]/20 border border-[#85ea10] rounded-lg p-4">
                    <div className="font-bold text-white text-lg">{user.name}</div>
                    <div className="text-sm text-[#85ea10] font-medium">
                      {user.weight}kg • Activa desde {user.membership?.startDate.toLocaleDateString('es-CO')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="text-lg font-bold text-red-400 mb-4 flex items-center space-x-2">
                <CreditCard className="w-6 h-6" />
                <span>SIN MEMBRESÍA ({getInactiveMemberships().length})</span>
              </h4>
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {getInactiveMemberships().map((user) => (
                  <div key={user.id} className="bg-red-500/20 border border-red-400 rounded-lg p-4">
                    <div className="font-bold text-white text-lg">{user.name}</div>
                    <div className="text-sm text-red-400 font-medium">
                      {user.weight}kg • Sin membresía activa
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Class Attendance for Selected Date */}
        <div className="bg-black/40 backdrop-blur-md rounded-2xl p-6 border border-white/20">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-black text-white">ASISTENCIA POR DÍA</h3>
            <div className="flex items-center space-x-3">
              <input
                type="date"
                value={format(selectedDate, 'yyyy-MM-dd')}
                onChange={(e) => setSelectedDate(new Date(e.target.value))}
                className="px-4 py-2 bg-black/60 border border-white/30 rounded-lg text-white placeholder-gray-400"
              />
              <button
                onClick={() => setSelectedDate(addDays(selectedDate, -1))}
                className="p-3 bg-[#85ea10] hover:bg-[#7dd30f] text-black rounded-lg transition-colors font-bold"
              >
                ←
              </button>
              <button
                onClick={() => setSelectedDate(addDays(selectedDate, 1))}
                className="p-3 bg-[#85ea10] hover:bg-[#7dd30f] text-black rounded-lg transition-colors font-bold"
              >
                →
              </button>
            </div>
          </div>
        
          <div className="space-y-4">
            {classAttendances.length === 0 ? (
              <p className="text-white text-center py-8 text-lg">No hay clases programadas para esta fecha</p>
            ) : (
              classAttendances.map((attendance) => (
                <div key={attendance.classId} className="bg-black/60 rounded-lg p-6 border border-white/20">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-white font-bold text-xl">{attendance.className}</h4>
                    <div className="text-[#85ea10] font-bold text-lg">
                      {attendance.classTime}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-white font-medium text-lg">
                      Asistieron: {attendance.attendedCount} / {attendance.totalCapacity}
                    </div>
                    <div className="text-white font-medium text-lg">
                      {format(attendance.classDate, 'EEEE, d \'de\' MMMM', { locale: es })}
                    </div>
                  </div>
                  
                  {attendance.attendees.length > 0 && (
                    <div className="mt-4">
                      <p className="text-white font-bold text-lg mb-3">Asistentes:</p>
                      <div className="flex flex-wrap gap-3">
                        {attendance.attendees.map((attendee, index) => (
                          <span key={index} className="bg-[#85ea10] text-black px-4 py-2 rounded-lg font-bold">
                            {attendee}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Video Management */}
        <div className="bg-black/40 backdrop-blur-md rounded-2xl p-6 border border-white/20">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-black text-white">GESTIÓN DE VIDEOS</h3>
            <button
              onClick={() => setShowAddVideo(true)}
              className="flex items-center space-x-3 bg-[#85ea10] hover:bg-[#7dd30f] text-black px-6 py-3 rounded-lg transition-colors font-bold"
            >
              <Plus className="w-5 h-5" />
              <span>AGREGAR VIDEO</span>
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map((video) => (
              <div key={video.id} className="bg-black/60 rounded-lg p-6 border border-white/20">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-white font-bold text-lg line-clamp-1">{video.title}</h4>
                  <span className="text-[#85ea10] font-bold text-sm">{video.purchaseCount} compras</span>
                </div>
                <p className="text-white text-sm mb-4 line-clamp-2">{video.description}</p>
                <div className="flex items-center justify-between text-sm text-white font-medium">
                  <span>{video.duration}min</span>
                  <span>${video.price.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Add Video Modal */}
        {showAddVideo && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
            <div className="bg-black/90 backdrop-blur-md rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/20">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-black text-white">AGREGAR NUEVO VIDEO</h3>
                <button
                  onClick={() => setShowAddVideo(false)}
                  className="text-white hover:text-[#85ea10] text-3xl font-bold"
                >
                  ×
                </button>
              </div>
            
              <form onSubmit={handleAddVideo} className="space-y-6">
                <div>
                  <label className="block text-lg font-bold text-white mb-3">
                    TÍTULO DEL VIDEO
                  </label>
                  <input
                    type="text"
                    value={newVideo.title}
                    onChange={(e) => setNewVideo({...newVideo, title: e.target.value})}
                    className="w-full px-4 py-3 bg-black/60 border border-white/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#85ea10]"
                    placeholder="Ej: HIIT Cardio Blast"
                    required
                  />
                </div>
              
                <div>
                  <label className="block text-lg font-bold text-white mb-3">
                    DESCRIPCIÓN
                  </label>
                  <textarea
                    value={newVideo.description}
                    onChange={(e) => setNewVideo({...newVideo, description: e.target.value})}
                    className="w-full px-4 py-3 bg-black/60 border border-white/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#85ea10]"
                    placeholder="Descripción del video..."
                    rows={3}
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-lg font-bold text-white mb-3">
                      NIVEL
                    </label>
                    <select
                      value={newVideo.level}
                      onChange={(e) => setNewVideo({...newVideo, level: e.target.value as 'Beginner' | 'Intermediate' | 'Advanced'})}
                      className="w-full px-4 py-3 bg-black/60 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#85ea10]"
                    >
                      <option value="Beginner">Principiante</option>
                      <option value="Intermediate">Intermedio</option>
                      <option value="Advanced">Avanzado</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-lg font-bold text-white mb-3">
                      DURACIÓN (MINUTOS)
                    </label>
                    <input
                      type="number"
                      value={newVideo.duration}
                      onChange={(e) => setNewVideo({...newVideo, duration: parseInt(e.target.value)})}
                      className="w-full px-4 py-3 bg-black/60 border border-white/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#85ea10]"
                      min="1"
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-lg font-bold text-white mb-3">
                      PRECIO (COP)
                    </label>
                    <input
                      type="number"
                      value={newVideo.price}
                      onChange={(e) => setNewVideo({...newVideo, price: parseInt(e.target.value)})}
                      className="w-full px-4 py-3 bg-black/60 border border-white/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#85ea10]"
                      min="1"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-lg font-bold text-white mb-3">
                      URL DE LA PORTADA
                    </label>
                    <input
                      type="url"
                      value={newVideo.thumbnailUrl}
                      onChange={(e) => setNewVideo({...newVideo, thumbnailUrl: e.target.value})}
                      className="w-full px-4 py-3 bg-black/60 border border-white/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#85ea10]"
                      placeholder="https://example.com/image.jpg"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-lg font-bold text-white mb-3">
                    URL DEL VIDEO (EMBED)
                  </label>
                  <input
                    type="url"
                    value={newVideo.videoUrl}
                    onChange={(e) => setNewVideo({...newVideo, videoUrl: e.target.value})}
                    className="w-full px-4 py-3 bg-black/60 border border-white/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#85ea10]"
                    placeholder="https://www.youtube.com/embed/VIDEO_ID"
                    required
                  />
                </div>
                
                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={() => setShowAddVideo(false)}
                    className="flex-1 py-3 px-6 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors font-bold"
                  >
                    CANCELAR
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 px-6 bg-[#85ea10] hover:bg-[#7dd30f] text-black rounded-lg transition-colors font-bold"
                  >
                    AGREGAR VIDEO
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
    </div>
  );
}
