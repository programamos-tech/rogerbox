'use client';

import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { User, Mail, Weight, Ruler, Target, Trophy, Calendar, Edit, ArrowLeft, X, Eye, EyeOff, Bookmark, Play, FileText, Heart, LogOut, ChevronDown, Utensils } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import QuickLoading from '@/components/QuickLoading';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  height: number;
  weight: number;
  gender: string;
  goals: string[];
  target_weight: number | null;
  goal_deadline: string | null;
  membership_status: string;
  current_weight?: number | null;
  weight_progress_percentage?: number | null;
  last_weight_update?: string | null;
  streak_days?: number | null;
  last_class_date?: string | null;
}

export default function ProfilePage() {
  const { user, profile, loading: authLoading } = useSupabaseAuth();
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPhysicalModal, setShowPhysicalModal] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [physicalForm, setPhysicalForm] = useState({
    weight: '',
    height: ''
  });
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [goalData, setGoalData] = useState({
    targetWeight: '',
    goalType: 'lose',
    deadline: ''
  });
  const [goalError, setGoalError] = useState('');
  const [goalLoading, setGoalLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  const [favorites, setFavorites] = useState<any>({
    complements: [],
    courses: [],
    blog: []
  });
  const [favoritesLoading, setFavoritesLoading] = useState(false);

  // Cargar favoritos del usuario
  const fetchFavorites = async () => {
    if (!user?.id) return;
    
    setFavoritesLoading(true);
    try {
      // Por ahora, simular cursos favoritos hasta que implementemos la funcionalidad
      const mockCourses = [
        {
          id: '1',
          title: 'Transformación Total 90 Días',
          description: 'Programa completo de transformación física en 90 días',
          category: 'Bajar de Peso',
          price: 89
        },
        {
          id: '2',
          title: 'HIIT Quema Grasa',
          description: 'Entrenamiento de alta intensidad para quemar grasa',
          category: 'HIIT',
          price: 69
        }
      ];
      
      setFavorites((prev: any) => ({
        ...prev,
        courses: mockCourses
      }));
    } catch (error) {
      console.error('Error cargando favoritos:', error);
    } finally {
      setFavoritesLoading(false);
    }
  };

  // Cargar perfil del usuario
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user?.id) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          if (error) {
            console.error('Error fetching profile:', error);
            return;
          }

          setUserProfile(data);
          setEditForm({
            name: data.name || '',
            email: data.email || '',
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
          });
        } catch (error) {
          console.error('Error:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    if (!!user) {
      fetchUserProfile();
      fetchFavorites();
    } else if (!loading && !user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  const handleEditProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditLoading(true);
    setEditError('');

    try {
      // Validar contraseñas si se están cambiando
      if (editForm.newPassword || editForm.confirmPassword) {
        if (editForm.newPassword !== editForm.confirmPassword) {
          setEditError('Las contraseñas no coinciden');
          setEditLoading(false);
          return;
        }
        if (editForm.newPassword.length < 6) {
          setEditError('La nueva contraseña debe tener al menos 6 caracteres');
          setEditLoading(false);
          return;
        }
      }

      // Actualizar perfil en Supabase
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          name: editForm.name,
          email: editForm.email,
          updated_at: new Date().toISOString()
        })
        .eq('id', user?.id);

      if (profileError) {
        setEditError('Error al actualizar el perfil');
        setEditLoading(false);
        return;
      }

      // Actualizar contraseña si se proporcionó
      if (editForm.newPassword) {
        const { error: passwordError } = await supabase.auth.updateUser({
          password: editForm.newPassword
        });

        if (passwordError) {
          setEditError('Error al actualizar la contraseña');
          setEditLoading(false);
          return;
        }
      }

      // Actualizar estado local
      setUserProfile(prev => prev ? {
        ...prev,
        name: editForm.name,
        email: editForm.email
      } : null);

      setShowEditModal(false);
      setEditForm({
        name: editForm.name,
        email: editForm.email,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });

      // Recargar la página para reflejar cambios
      window.location.reload();
    } catch (error) {
      console.error('Error updating profile:', error);
      setEditError('Error inesperado al actualizar el perfil');
    } finally {
      setEditLoading(false);
    }
  };

  const handlePhysicalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditLoading(true);
    setEditError('');

    try {
      // Validar datos
      if (!physicalForm.weight || !physicalForm.height) {
        setEditError('Por favor completa todos los campos');
        setEditLoading(false);
        return;
      }

      if (parseInt(physicalForm.weight) < 30 || parseInt(physicalForm.weight) > 300) {
        setEditError('El peso debe estar entre 30 y 300 kg');
        setEditLoading(false);
        return;
      }

      if (parseInt(physicalForm.height) < 100 || parseInt(physicalForm.height) > 250) {
        setEditError('La altura debe estar entre 100 y 250 cm');
        setEditLoading(false);
        return;
      }

      // Actualizar datos físicos en Supabase
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          weight: parseInt(physicalForm.weight),
          height: parseInt(physicalForm.height),
          updated_at: new Date().toISOString()
        })
        .eq('id', userProfile?.id);

      if (profileError) throw profileError;

      // Actualizar perfil local
      setUserProfile(prev => prev ? {
        ...prev,
        weight: parseInt(physicalForm.weight),
        height: parseInt(physicalForm.height)
      } : null);

      setShowPhysicalModal(false);
      setPhysicalForm({
        weight: '',
        height: ''
      });

      // Recargar la página para reflejar los cambios
      window.location.reload();
    } catch (error) {
      console.error('Error actualizando datos físicos:', error);
      setEditError('Error al actualizar los datos. Inténtalo de nuevo.');
    } finally {
      setEditLoading(false);
    }
  };

  const handleGoalSubmit = async () => {
    if (!goalData.targetWeight || !goalData.deadline) {
      setGoalError('Por favor completa todos los campos');
      return;
    }

    setGoalLoading(true);
    setGoalError('');

    try {
      if (!userProfile?.id) {
        throw new Error('No se encontró el ID del usuario');
      }

      const { data, error } = await supabase
        .from('profiles')
        .update({
          target_weight: parseInt(goalData.targetWeight),
          goal_deadline: goalData.deadline,
          updated_at: new Date().toISOString()
        })
        .eq('id', userProfile.id)
        .select();

      if (error) {
        console.error('Error de Supabase al actualizar:', error);
        throw new Error(`Error al actualizar la meta: ${error.message || 'Error desconocido'}`);
      }

      setUserProfile(prev => prev ? {
        ...prev,
        target_weight: parseInt(goalData.targetWeight),
        goal_deadline: goalData.deadline
      } : null);

      setShowGoalModal(false);
      setGoalData({ targetWeight: '', goalType: 'lose', deadline: '' });
      
      window.location.reload();
    } catch (error: any) {
      console.error('Error actualizando meta:', error);
      setGoalError(error.message || 'Error al actualizar la meta. Inténtalo de nuevo.');
    } finally {
      setGoalLoading(false);
    }
  };

  const goalLabels: { [key: string]: string } = {
    'lose_weight': 'Bajar de Peso',
    'tone': 'Tonificar',
    'gain_muscle': 'Ganar Músculo',
    'endurance': 'Resistencia',
    'hiit': 'HIIT',
    'strength': 'Fuerza'
  };

  if (loading || loading) {
    return <QuickLoading message="Cargando tu perfil..." duration={1500} />;
  }

  if (!loading && !user) {
    return null;
  }

  if (!userProfile) {
    return <QuickLoading message="Cargando tu perfil..." duration={1500} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
            >
              <h1 className="text-2xl font-black text-black">
                ROGER<span className="text-[#85ea10]">BOX</span>
              </h1>
            </button>

            {/* Back Button */}
            <button
              onClick={() => router.back()}
              className="flex items-center space-x-2 text-gray-600 dark:text-white/70 hover:text-[#85ea10] transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Volver</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 mb-8">
          <div className="flex items-center space-x-6">
            <div className="w-16 h-16 bg-[#85ea10] rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-black" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{userProfile.name}</h1>
              <p className="text-gray-600 dark:text-white/60 text-sm">{userProfile.email}</p>
            </div>
            <button
              onClick={() => setShowEditModal(true)}
              className="bg-[#85ea10] hover:bg-[#7dd30f] text-black font-bold px-6 py-3 rounded-lg transition-colors flex items-center space-x-2"
            >
              <Edit className="w-4 h-4" />
              <span>Editar Perfil</span>
            </button>
          </div>
        </div>

        {/* Information Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Personal Information */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <div className="flex items-center space-x-3 mb-4">
              <User className="w-5 h-5 text-[#85ea10]" />
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Información Personal</h2>
            </div>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Mail className="w-4 h-4 text-gray-600 dark:text-white/60" />
                <span className="text-gray-700 dark:text-white/80 text-sm break-all">{userProfile.email}</span>
              </div>
              <div className="flex items-center space-x-3">
                <Weight className="w-4 h-4 text-gray-600 dark:text-white/60" />
                <span className="text-gray-700 dark:text-white/80 text-sm">{userProfile.weight} kg</span>
              </div>
              <div className="flex items-center space-x-3">
                <Ruler className="w-4 h-4 text-gray-600 dark:text-white/60" />
                <span className="text-gray-700 dark:text-white/80 text-sm">{userProfile.height} cm</span>
              </div>
              <div className="pt-2">
                <button
                  onClick={() => {
                    setPhysicalForm({
                      weight: userProfile.weight.toString(),
                      height: userProfile.height.toString()
                    });
                    setShowPhysicalModal(true);
                  }}
                  className="flex items-center space-x-2 text-[#85ea10] hover:text-[#7dd30f] transition-colors text-sm font-medium"
                >
                  <Edit className="w-4 h-4" />
                  <span>Actualizar peso y altura</span>
                </button>
              </div>
            </div>
          </div>

          {/* Goals */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Trophy className="w-5 h-5 text-[#85ea10]" />
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Mis Metas</h2>
            </div>
            <button 
              onClick={() => setShowGoalModal(true)}
              className="text-xs bg-[#85ea10] text-black px-3 py-1 rounded-full font-medium hover:bg-[#7dd30f] transition-colors"
            >
              + Agregar Meta
            </button>
          </div>

          {/* Racha Destacada */}
          <div className="mb-6 p-4 bg-gradient-to-r from-[#85ea10]/10 to-[#85ea10]/5 rounded-xl border border-[#85ea10]/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-[#85ea10]/20 rounded-full flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-[#85ea10]" />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">Mi Racha de Clases</div>
                  <div className="text-xs text-gray-600 dark:text-white/60">
                    {userProfile.last_class_date ? 
                      `Última clase: ${new Date(userProfile.last_class_date).toLocaleDateString('es-ES')}` : 
                      'Aún no has tomado clases'
                    }
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-[#85ea10]">
                  {userProfile.streak_days || 0}
                </div>
                <div className="text-xs text-gray-600 dark:text-white/60">
                  {userProfile.streak_days && userProfile.streak_days > 0 ? 'días consecutivos' : 'días'}
                </div>
              </div>
            </div>
            
            {userProfile.streak_days && userProfile.streak_days > 0 && (
              <div className="mt-3 flex items-center space-x-2">
                <div className="w-2 h-2 bg-[#85ea10] rounded-full animate-pulse"></div>
                <span className="text-xs text-[#85ea10] font-medium">
                  ¡Sigue así! Mantén tu racha activa
                </span>
              </div>
            )}
            
            {(!userProfile.streak_days || userProfile.streak_days === 0) && (
              <div className="mt-3">
                <button className="text-[#85ea10] hover:text-[#7dd30f] text-sm font-medium transition-colors">
                  Comenzar mi primera clase →
                </button>
              </div>
            )}
          </div>
            
            {/* Meta de Peso */}
            <div className="space-y-3">
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Weight className="w-4 h-4 text-[#85ea10]" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Bajar de Peso</span>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-white/60">Activa</span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-gray-600 dark:text-white/60">Peso actual:</span>
                    <span className="text-gray-900 dark:text-white font-medium ml-1">
                      {userProfile.current_weight || userProfile.weight} kg
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-white/60">Meta:</span>
                    <span className="text-gray-900 dark:text-white font-medium ml-1">
                      {userProfile.target_weight || 'No definida'} kg
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-white/60">Progreso:</span>
                    <span className="text-[#85ea10] font-medium ml-1">
                      {userProfile.weight_progress_percentage || 0}%
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-white/60">Fecha límite:</span>
                    <span className="text-gray-900 dark:text-white font-medium ml-1">
                      {userProfile.goal_deadline ? 
                        new Date(userProfile.goal_deadline).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }) : 
                        'No definida'
                      }
                    </span>
                  </div>
                </div>
                <div className="mt-2">
                  <div className="w-full bg-gray-200 dark:bg-white/20 rounded-full h-2">
                    <div 
                      className="bg-[#85ea10] h-2 rounded-full transition-all duration-300" 
                      style={{width: `${userProfile.weight_progress_percentage || 0}%`}}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Meta de Tonificación - Solo mostrar si existe */}
              {userProfile.goals && userProfile.goals.includes('tone') && (
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Target className="w-4 h-4 text-[#85ea10]" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">Tonificar Músculos</span>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-white/60">Activa</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-gray-600 dark:text-white/60">Objetivo:</span>
                      <span className="text-gray-900 dark:text-white font-medium ml-1">Definir músculos</span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-white/60">Progreso:</span>
                      <span className="text-[#85ea10] font-medium ml-1">0%</span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-white/60">Fecha límite:</span>
                      <span className="text-gray-900 dark:text-white font-medium ml-1">
                        {userProfile.goal_deadline ? 
                          new Date(userProfile.goal_deadline).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }) : 
                          'No definida'
                        }
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-white/60">Racha:</span>
                      <span className="text-[#85ea10] font-medium ml-1">{userProfile.streak_days || 0} días</span>
                    </div>
                  </div>
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 dark:bg-white/20 rounded-full h-2">
                      <div className="bg-[#85ea10] h-2 rounded-full transition-all duration-300" style={{width: '0%'}}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>


          {/* Payment Management */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <div className="flex items-center space-x-3 mb-4">
              <Target className="w-5 h-5 text-[#85ea10]" />
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Gestión de Pagos</h2>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-700 dark:text-white/80 text-sm">Tarjeta Guardada</span>
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-500/20 text-green-600">
                  **** 1234
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700 dark:text-white/80 text-sm">Cursos Comprados</span>
                <span className="text-gray-900 dark:text-white text-sm font-medium">2 cursos</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700 dark:text-white/80 text-sm">Gasto Total</span>
                <span className="text-gray-900 dark:text-white text-sm font-medium">$158</span>
              </div>
              <button className="w-full mt-3 bg-[#85ea10] hover:bg-[#7dd30f] text-black font-bold px-4 py-2 rounded-lg transition-colors text-sm">
                Gestionar Pagos
              </button>
            </div>
          </div>
        </div>

        {/* My Content Section */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
          <div className="flex items-center space-x-3 mb-6">
            <Bookmark className="w-5 h-5 text-[#85ea10]" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Mi Contenido</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Cursos Comprados */}
            <div className="bg-white/5 rounded-xl p-4">
              <div className="flex items-center space-x-2 mb-3">
                <Play className="w-4 h-4 text-[#85ea10]" />
                <h3 className="font-semibold text-gray-900 dark:text-white">Cursos Comprados</h3>
              </div>
              {favoritesLoading ? (
                <div className="text-gray-600 dark:text-white/60 text-sm">Cargando...</div>
              ) : favorites.courses.length > 0 ? (
                <div className="space-y-2">
                  {favorites.courses.slice(0, 3).map((course: any, index: number) => (
                    <div key={index} className="bg-white/10 rounded-lg p-3">
                      <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                        {course.title || 'Curso sin nombre'}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-white/60 mb-1">
                        {course.description || 'Sin descripción'}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-[#85ea10]">
                          {course.category || 'Sin categoría'}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-white/60">
                          ${course.price}
                        </div>
                      </div>
                    </div>
                  ))}
                  {favorites.courses.length > 3 && (
                    <div className="text-xs text-gray-600 dark:text-white/60">
                      +{favorites.courses.length - 3} más
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-gray-600 dark:text-white/60 text-sm">No has comprado cursos aún</div>
              )}
            </div>

            {/* Blog Favoritos */}
            <div className="bg-white/5 rounded-xl p-4">
              <div className="flex items-center space-x-2 mb-3">
                <FileText className="w-4 h-4 text-[#85ea10]" />
                <h3 className="font-semibold text-gray-900 dark:text-white">Blog Favoritos</h3>
              </div>
              <div className="space-y-2">
                <div className="bg-white/10 rounded-lg p-3 opacity-60">
                  <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                    "5 Tips para Quemar Grasa"
                  </div>
                  <div className="text-xs text-gray-600 dark:text-white/60 mb-1">
                    Consejos prácticos para acelerar tu metabolismo
                  </div>
                  <div className="text-xs text-[#85ea10]">
                    Nutrición
                  </div>
                </div>
                <div className="text-xs text-gray-500 dark:text-white/40 text-center">
                  🔒 Funcionalidad Premium
                </div>
              </div>
            </div>

            {/* Plan Nutricional */}
            <div className="bg-white/5 rounded-xl p-4">
              <div className="flex items-center space-x-2 mb-3">
                <Utensils className="w-4 h-4 text-[#85ea10]" />
                <h3 className="font-semibold text-gray-900 dark:text-white">Plan Nutricional</h3>
              </div>
              <div className="space-y-3">
                <div className="bg-gradient-to-r from-[#85ea10]/20 to-[#85ea10]/10 rounded-lg p-3 border border-[#85ea10]/30">
                  <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                    Plan Personalizado
                  </div>
                  <div className="text-xs text-gray-600 dark:text-white/60 mb-2">
                    Diseñado específicamente para tus objetivos
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#85ea10] font-medium">$49/mes</span>
                    <button className="text-xs bg-[#85ea10] text-black px-3 py-1 rounded-full font-medium hover:bg-[#7dd30f] transition-colors">
                      Solicitar
                    </button>
                  </div>
                </div>
                <div className="text-xs text-gray-500 dark:text-white/40 text-center">
                  ✨ Disponible para ti
                </div>
              </div>
            </div>
          </div>

          {/* Sesión 1:1 con RogerBox */}
          <div className="mt-6 bg-gradient-to-r from-[#85ea10]/10 to-[#85ea10]/5 rounded-xl p-4 border border-[#85ea10]/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-[#85ea10] rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-black" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Sesión 1:1 con RogerBox</h3>
                  <p className="text-xs text-gray-600 dark:text-white/60">Mentoría personalizada con Roger Barreto</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-gray-900 dark:text-white">$150/sesión</div>
                <button className="mt-1 text-xs bg-[#85ea10] text-black px-4 py-2 rounded-full font-medium hover:bg-[#7dd30f] transition-colors">
                  Solicitar Sesión
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Editar Perfil</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleEditProfile} className="space-y-4">
              {editError && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  <p className="text-red-600 dark:text-red-400 text-sm">{editError}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
                  Nombre
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-white/20 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#85ea10]"
                  placeholder="Tu nombre"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-white/20 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#85ea10]"
                  placeholder="tu@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
                  Nueva Contraseña (opcional)
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.new ? 'text' : 'password'}
                    value={editForm.newPassword}
                    onChange={(e) => setEditForm(prev => ({ ...prev, newPassword: e.target.value }))}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-white/20 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#85ea10]"
                    placeholder="Nueva contraseña"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
                  Confirmar Nueva Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.confirm ? 'text' : 'password'}
                    value={editForm.confirmPassword}
                    onChange={(e) => setEditForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-white/20 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#85ea10]"
                    placeholder="Confirmar nueva contraseña"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-white/20 text-gray-700 dark:text-white rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="flex-1 bg-[#85ea10] hover:bg-[#7dd30f] disabled:bg-[#85ea10]/50 disabled:opacity-70 text-black font-bold px-4 py-2 rounded-lg transition-colors"
                >
                  {editLoading ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para actualizar datos físicos */}
      {showPhysicalModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Actualizar Datos Físicos
              </h2>
              <button
                onClick={() => setShowPhysicalModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handlePhysicalSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Peso (kg)
                </label>
                <input
                  type="number"
                  value={physicalForm.weight}
                  onChange={(e) => setPhysicalForm(prev => ({ ...prev, weight: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#85ea10] focus:border-[#85ea10] bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  placeholder="Ej: 70"
                  min="30"
                  max="300"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Altura (cm)
                </label>
                <input
                  type="number"
                  value={physicalForm.height}
                  onChange={(e) => setPhysicalForm(prev => ({ ...prev, height: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#85ea10] focus:border-[#85ea10] bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  placeholder="Ej: 175"
                  min="100"
                  max="250"
                />
              </div>

              {editError && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  <p className="text-red-600 dark:text-red-400 text-sm">{editError}</p>
                </div>
              )}

              <div className="flex space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowPhysicalModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={editLoading || !physicalForm.weight || !physicalForm.height}
                  className="flex-1 px-4 py-2 bg-[#85ea10] hover:bg-[#7dd30f] text-black font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editLoading ? 'Actualizando...' : 'Actualizar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para establecer meta */}
      {showGoalModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Establece tu Meta
              </h2>
              <button
                onClick={() => setShowGoalModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleGoalSubmit(); }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Peso Objetivo (kg)
                </label>
                <input
                  type="number"
                  value={goalData.targetWeight}
                  onChange={(e) => setGoalData(prev => ({ ...prev, targetWeight: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#85ea10] focus:border-[#85ea10] bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  placeholder="Ej: 65"
                  min="30"
                  max="300"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Fecha Límite
                </label>
                <input
                  type="date"
                  value={goalData.deadline}
                  onChange={(e) => setGoalData(prev => ({ ...prev, deadline: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#85ea10] focus:border-[#85ea10] bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              {goalError && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  <p className="text-red-600 dark:text-red-400 text-sm">{goalError}</p>
                </div>
              )}

              <div className="flex space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowGoalModal(false)}
                  disabled={goalLoading}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={goalLoading || !goalData.targetWeight || !goalData.deadline}
                  className="flex-1 px-4 py-2 bg-[#85ea10] hover:bg-[#7dd30f] text-black font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {goalLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2"></div>
                      Estableciendo...
                    </>
                  ) : (
                    'Establecer Meta'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
