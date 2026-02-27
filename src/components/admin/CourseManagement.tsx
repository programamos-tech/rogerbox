'use client';

import { useState } from 'react';
import { Plus, Edit, Trash2, Eye, Play, Clock, Users, Star } from 'lucide-react';

interface Course {
  id: string;
  title: string;
  instructor: string;
  category: string;
  duration: string;
  level: 'Principiante' | 'Intermedio' | 'Avanzado';
  rating: number;
  students: number;
  price: number;
  thumbnail: string;
  description: string;
  lessons: number;
  isRecommended?: boolean;
}

interface CourseManagementProps {
  courses: Course[];
  onAddCourse: (course: Omit<Course, 'id'>) => void;
  onEditCourse: (id: string, course: Partial<Course>) => void;
  onDeleteCourse: (id: string) => void;
}

export default function CourseManagement({ courses, onAddCourse, onEditCourse, onDeleteCourse }: CourseManagementProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [newCourse, setNewCourse] = useState({
    title: '',
    instructor: 'Roger Barreto',
    category: 'lose_weight',
    duration: '30 min',
    level: 'Principiante' as 'Principiante' | 'Intermedio' | 'Avanzado',
    rating: 0,
    students: 0,
    price: 0,
    thumbnail: '',
    description: '',
    lessons: 0,
  });

  const categories = [
    { id: 'lose_weight', name: 'Bajar de Peso', icon: '🔥' },
    { id: 'tone', name: 'Tonificar', icon: '💪' },
    { id: 'gain_muscle', name: 'Ganar Músculo', icon: '🏋️' },
    { id: 'endurance', name: 'Resistencia', icon: '🏃' },
    { id: 'flexibility', name: 'Flexibilidad', icon: '🧘' },
    { id: 'strength', name: 'Fuerza', icon: '⚡' }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCourse) {
      onEditCourse(editingCourse.id, newCourse);
    } else {
      onAddCourse(newCourse);
    }
    setShowAddModal(false);
    setEditingCourse(null);
    setNewCourse({
      title: '',
      instructor: 'Roger Barreto',
      category: 'lose_weight',
      duration: '30 min',
      level: 'Principiante',
      rating: 0,
      students: 0,
      price: 0,
      thumbnail: '',
      description: '',
      lessons: 0,
    });
  };

  const handleEdit = (course: Course) => {
    setEditingCourse(course);
    setNewCourse({
      title: course.title,
      instructor: course.instructor,
      category: course.category,
      duration: course.duration,
      level: course.level,
      rating: course.rating,
      students: course.students,
      price: course.price,
      thumbnail: course.thumbnail,
      description: course.description,
      lessons: course.lessons,
    });
    setShowAddModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Gestión de Cursos</h2>
          <p className="text-white/60">Crea y administra los cursos de entrenamiento</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-[#85ea10] hover:bg-[#7dd30f] text-black font-bold px-6 py-3 rounded-xl transition-colors flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Nuevo Curso</span>
        </button>
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <div key={course.id} className="bg-white/5 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/10 hover:border-[#85ea10]/50 transition-all duration-300 group">
            {/* Thumbnail */}
            <div className="relative h-48 bg-gradient-to-br from-[#164151] to-[#29839c] flex items-center justify-center">
              <Play className="w-16 h-16 text-white/80" />
              <div className="absolute top-4 left-4">
                <span className="px-3 py-1 bg-[#85ea10]/20 text-[#85ea10] rounded-full text-sm font-medium">
                  {categories.find(c => c.id === course.category)?.name}
                </span>
              </div>
              <div className="absolute top-4 right-4">
                <span className="px-3 py-1 bg-black/40 text-white rounded-full text-sm">
                  {course.level}
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-[#85ea10] transition-colors">
                {course.title}
              </h3>
              
              <p className="text-white/70 mb-4 line-clamp-2">
                {course.description}
              </p>

              {/* Course Meta */}
              <div className="flex items-center justify-between text-sm text-white/60 mb-4">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    {course.duration}
                  </div>
                  <div className="flex items-center">
                    <Users className="w-4 h-4 mr-1" />
                    {course.students}
                  </div>
                  <div className="flex items-center">
                    <Star className="w-4 h-4 mr-1" />
                    {course.rating}
                  </div>
                </div>
                <span>{course.lessons} clases</span>
              </div>

              {/* Price and Actions */}
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold text-[#85ea10]">
                  ${course.price.toLocaleString()}
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleEdit(course)}
                    className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDeleteCourse(course.id)}
                    className="p-2 text-white/60 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 w-full max-w-2xl border border-white/20">
            <h3 className="text-xl font-bold text-white mb-6">
              {editingCourse ? 'Editar Curso' : 'Nuevo Curso'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">Título</label>
                  <input
                    type="text"
                    value={newCourse.title}
                    onChange={(e) => setNewCourse({...newCourse, title: e.target.value})}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#85ea10]"
                    placeholder="Nombre del curso"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">Instructor</label>
                  <input
                    type="text"
                    value={newCourse.instructor}
                    onChange={(e) => setNewCourse({...newCourse, instructor: e.target.value})}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#85ea10]"
                    placeholder="Nombre del instructor"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">Categoría</label>
                  <select
                    value={newCourse.category}
                    onChange={(e) => setNewCourse({...newCourse, category: e.target.value})}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#85ea10]"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id} className="bg-gray-800">
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">Duración</label>
                  <input
                    type="text"
                    value={newCourse.duration}
                    onChange={(e) => setNewCourse({...newCourse, duration: e.target.value})}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#85ea10]"
                    placeholder="30 min"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">Nivel</label>
                  <select
                    value={newCourse.level}
                    onChange={(e) => setNewCourse({...newCourse, level: e.target.value as any})}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#85ea10]"
                  >
                    <option value="Principiante" className="bg-gray-800">Principiante</option>
                    <option value="Intermedio" className="bg-gray-800">Intermedio</option>
                    <option value="Avanzado" className="bg-gray-800">Avanzado</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">Precio (COP)</label>
                  <input
                    type="number"
                    value={newCourse.price}
                    onChange={(e) => setNewCourse({...newCourse, price: parseInt(e.target.value)})}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#85ea10]"
                    placeholder="0"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">Estudiantes</label>
                  <input
                    type="number"
                    value={newCourse.students}
                    onChange={(e) => setNewCourse({...newCourse, students: parseInt(e.target.value)})}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#85ea10]"
                    placeholder="0"
                  />
                </div>
                
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">Clases</label>
                  <input
                    type="number"
                    value={newCourse.lessons}
                    onChange={(e) => setNewCourse({...newCourse, lessons: parseInt(e.target.value)})}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#85ea10]"
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">Descripción</label>
                <textarea
                  value={newCourse.description}
                  onChange={(e) => setNewCourse({...newCourse, description: e.target.value})}
                  rows={3}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#85ea10]"
                  placeholder="Descripción del curso"
                  required
                />
              </div>

              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">URL de Thumbnail</label>
                <input
                  type="url"
                  value={newCourse.thumbnail}
                  onChange={(e) => setNewCourse({...newCourse, thumbnail: e.target.value})}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#85ea10]"
                  placeholder="https://ejemplo.com/imagen.jpg"
                />
              </div>

              <div className="flex items-center justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-6 py-3 text-white/80 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-[#85ea10] hover:bg-[#7dd30f] text-black font-bold px-6 py-3 rounded-xl transition-colors"
                >
                  {editingCourse ? 'Actualizar' : 'Crear'} Curso
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
