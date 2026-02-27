'use client';

import { useState } from 'react';
import { Plus, Edit, Trash2, Eye, Utensils, Clock, Users, DollarSign } from 'lucide-react';
import { NutritionalPlan } from '@/types';

interface NutritionalPlanManagementProps {
  plans: NutritionalPlan[];
  onAddPlan: (plan: Omit<NutritionalPlan, 'id' | 'purchaseCount' | 'createdAt'>) => void;
  onEditPlan: (id: string, plan: Partial<NutritionalPlan>) => void;
  onDeletePlan: (id: string) => void;
}

export default function NutritionalPlanManagement({ plans, onAddPlan, onEditPlan, onDeletePlan }: NutritionalPlanManagementProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<NutritionalPlan | null>(null);
  const [newPlan, setNewPlan] = useState({
    title: '',
    description: '',
    duration: 30,
    price: 0,
    level: 'Beginner' as 'Beginner' | 'Intermediate' | 'Advanced',
    category: 'weight_loss' as 'weight_loss' | 'muscle_gain' | 'maintenance' | 'detox',
    videoUrl: '',
    thumbnailUrl: '',
    menu: [] as any[],
    nutritionalInfo: {
      totalCalories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
      sugar: 0,
      sodium: 0,
    },
  });

  const categories = [
    { id: 'weight_loss', name: 'Bajar de Peso', icon: '⚖️' },
    { id: 'muscle_gain', name: 'Ganar Músculo', icon: '💪' },
    { id: 'maintenance', name: 'Mantenimiento', icon: '🔄' },
    { id: 'detox', name: 'Detox', icon: '🌿' }
  ];

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(price);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPlan) {
      onEditPlan(editingPlan.id, newPlan);
    } else {
      onAddPlan(newPlan);
    }
    setShowAddModal(false);
    setEditingPlan(null);
    setNewPlan({
      title: '',
      description: '',
      duration: 30,
      price: 0,
      level: 'Beginner',
      category: 'weight_loss',
      videoUrl: '',
      thumbnailUrl: '',
      menu: [],
      nutritionalInfo: {
        totalCalories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0,
        sugar: 0,
        sodium: 0,
      },
    });
  };

  const handleEdit = (plan: NutritionalPlan) => {
    setEditingPlan(plan);
    setNewPlan({
      title: plan.title,
      description: plan.description,
      duration: plan.duration,
      price: plan.price,
      level: plan.level,
      category: plan.category,
      videoUrl: plan.videoUrl,
      thumbnailUrl: plan.thumbnailUrl,
      menu: plan.menu,
      nutritionalInfo: plan.nutritionalInfo,
    });
    setShowAddModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Gestión de Planes Nutricionales</h2>
          <p className="text-white/60">Crea y administra los planes nutricionales</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-[#85ea10] hover:bg-[#7dd30f] text-black font-bold px-6 py-3 rounded-xl transition-colors flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Nuevo Plan</span>
        </button>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div key={plan.id} className="bg-white/5 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/10 hover:border-[#85ea10]/50 transition-all duration-300 group">
            {/* Thumbnail */}
            <div className="relative h-48 bg-gradient-to-br from-green-600 to-green-800 flex items-center justify-center">
              <Utensils className="w-16 h-16 text-white/80" />
              <div className="absolute top-4 left-4">
                <span className="px-3 py-1 bg-[#85ea10]/20 text-[#85ea10] rounded-full text-sm font-medium">
                  {categories.find(c => c.id === plan.category)?.name}
                </span>
              </div>
              <div className="absolute top-4 right-4">
                <span className="px-3 py-1 bg-black/40 text-white rounded-full text-sm">
                  {plan.level}
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-[#85ea10] transition-colors">
                {plan.title}
              </h3>
              
              <p className="text-white/70 mb-4 line-clamp-2">
                {plan.description}
              </p>

              {/* Plan Meta */}
              <div className="flex items-center justify-between text-sm text-white/60 mb-4">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    {plan.duration} días
                  </div>
                  <div className="flex items-center">
                    <Users className="w-4 h-4 mr-1" />
                    {plan.purchaseCount}
                  </div>
                </div>
                <span>{plan.menu.length} días de menú</span>
              </div>

              {/* Nutritional Info */}
              <div className="mb-4 p-3 bg-white/5 rounded-lg">
                <div className="text-xs text-white/60 mb-2">Información Nutricional Diaria</div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-white/80">Calorías:</span>
                    <span className="text-white font-bold">{plan.nutritionalInfo.totalCalories}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/80">Proteínas:</span>
                    <span className="text-white font-bold">{plan.nutritionalInfo.protein}g</span>
                  </div>
                </div>
              </div>

              {/* Price and Actions */}
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold text-[#85ea10]">
                  {formatPrice(plan.price)}
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleEdit(plan)}
                    className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDeletePlan(plan.id)}
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
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 w-full max-w-4xl border border-white/20 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-white mb-6">
              {editingPlan ? 'Editar Plan Nutricional' : 'Nuevo Plan Nutricional'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">Título</label>
                  <input
                    type="text"
                    value={newPlan.title}
                    onChange={(e) => setNewPlan({...newPlan, title: e.target.value})}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#85ea10]"
                    placeholder="Nombre del plan"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">Categoría</label>
                  <select
                    value={newPlan.category}
                    onChange={(e) => setNewPlan({...newPlan, category: e.target.value as any})}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#85ea10]"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id} className="bg-gray-800">
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">Descripción</label>
                <textarea
                  value={newPlan.description}
                  onChange={(e) => setNewPlan({...newPlan, description: e.target.value})}
                  rows={3}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#85ea10]"
                  placeholder="Descripción del plan"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">Duración (días)</label>
                  <input
                    type="number"
                    value={newPlan.duration}
                    onChange={(e) => setNewPlan({...newPlan, duration: parseInt(e.target.value)})}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#85ea10]"
                    placeholder="30"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">Precio (COP)</label>
                  <input
                    type="number"
                    value={newPlan.price}
                    onChange={(e) => setNewPlan({...newPlan, price: parseInt(e.target.value)})}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#85ea10]"
                    placeholder="0"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">Nivel</label>
                  <select
                    value={newPlan.level}
                    onChange={(e) => setNewPlan({...newPlan, level: e.target.value as any})}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#85ea10]"
                  >
                    <option value="Beginner" className="bg-gray-800">Principiante</option>
                    <option value="Intermediate" className="bg-gray-800">Intermedio</option>
                    <option value="Advanced" className="bg-gray-800">Avanzado</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">Calorías Diarias</label>
                  <input
                    type="number"
                    value={newPlan.nutritionalInfo.totalCalories}
                    onChange={(e) => setNewPlan({
                      ...newPlan, 
                      nutritionalInfo: {...newPlan.nutritionalInfo, totalCalories: parseInt(e.target.value)}
                    })}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#85ea10]"
                    placeholder="1200"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">URL del Video</label>
                  <input
                    type="url"
                    value={newPlan.videoUrl}
                    onChange={(e) => setNewPlan({...newPlan, videoUrl: e.target.value})}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#85ea10]"
                    placeholder="https://youtube.com/embed/..."
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">URL de Thumbnail</label>
                  <input
                    type="url"
                    value={newPlan.thumbnailUrl}
                    onChange={(e) => setNewPlan({...newPlan, thumbnailUrl: e.target.value})}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#85ea10]"
                    placeholder="https://ejemplo.com/imagen.jpg"
                    required
                  />
                </div>
              </div>

              {/* Nutritional Info */}
              <div className="bg-white/5 rounded-xl p-4">
                <h4 className="text-lg font-bold text-white mb-4">Información Nutricional Diaria</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-white/80 text-sm font-medium mb-2">Proteínas (g)</label>
                    <input
                      type="number"
                      value={newPlan.nutritionalInfo.protein}
                      onChange={(e) => setNewPlan({
                        ...newPlan, 
                        nutritionalInfo: {...newPlan.nutritionalInfo, protein: parseInt(e.target.value)}
                      })}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#85ea10]"
                      placeholder="100"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-white/80 text-sm font-medium mb-2">Carbohidratos (g)</label>
                    <input
                      type="number"
                      value={newPlan.nutritionalInfo.carbs}
                      onChange={(e) => setNewPlan({
                        ...newPlan, 
                        nutritionalInfo: {...newPlan.nutritionalInfo, carbs: parseInt(e.target.value)}
                      })}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#85ea10]"
                      placeholder="80"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-white/80 text-sm font-medium mb-2">Grasas (g)</label>
                    <input
                      type="number"
                      value={newPlan.nutritionalInfo.fat}
                      onChange={(e) => setNewPlan({
                        ...newPlan, 
                        nutritionalInfo: {...newPlan.nutritionalInfo, fat: parseInt(e.target.value)}
                      })}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#85ea10]"
                      placeholder="35"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-white/80 text-sm font-medium mb-2">Fibra (g)</label>
                    <input
                      type="number"
                      value={newPlan.nutritionalInfo.fiber}
                      onChange={(e) => setNewPlan({
                        ...newPlan, 
                        nutritionalInfo: {...newPlan.nutritionalInfo, fiber: parseInt(e.target.value)}
                      })}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#85ea10]"
                      placeholder="25"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-white/80 text-sm font-medium mb-2">Azúcar (g)</label>
                    <input
                      type="number"
                      value={newPlan.nutritionalInfo.sugar}
                      onChange={(e) => setNewPlan({
                        ...newPlan, 
                        nutritionalInfo: {...newPlan.nutritionalInfo, sugar: parseInt(e.target.value)}
                      })}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#85ea10]"
                      placeholder="30"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-white/80 text-sm font-medium mb-2">Sodio (mg)</label>
                    <input
                      type="number"
                      value={newPlan.nutritionalInfo.sodium}
                      onChange={(e) => setNewPlan({
                        ...newPlan, 
                        nutritionalInfo: {...newPlan.nutritionalInfo, sodium: parseInt(e.target.value)}
                      })}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#85ea10]"
                      placeholder="1500"
                    />
                  </div>
                </div>
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
                  {editingPlan ? 'Actualizar' : 'Crear'} Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
