'use client';

import {
  Calendar,
  ChevronRight,
  Play,
  ShoppingCart,
  Star,
  Users,
  Utensils,
} from 'lucide-react';
import { useState } from 'react';
import type { NutritionalPlan } from '@/types';

interface NutritionalPlansProps {
  plans: NutritionalPlan[];
  onPurchase: (planId: string) => void;
}

export default function NutritionalPlans({
  plans,
  onPurchase,
}: NutritionalPlansProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPlan, setSelectedPlan] = useState<NutritionalPlan | null>(
    null,
  );

  const categories = [
    { id: 'all', name: 'Todos', icon: '🍽️' },
    { id: 'weight_loss', name: 'Bajar de Peso', icon: '⚖️' },
    { id: 'muscle_gain', name: 'Ganar Músculo', icon: '💪' },
    { id: 'maintenance', name: 'Mantenimiento', icon: '🔄' },
    { id: 'detox', name: 'Detox', icon: '🌿' },
  ];

  const filteredPlans =
    selectedCategory === 'all'
      ? plans
      : plans.filter((plan) => plan.category === selectedCategory);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (selectedPlan) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        {/* Background Overlay */}
        <div className="fixed inset-0 bg-gradient-to-r from-[#164151]/80 via-[#29839c]/70 to-[#164151]/60 backdrop-blur-sm z-0"></div>

        {/* Content */}
        <div className="relative z-10 min-h-screen p-4">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <button
                onClick={() => setSelectedPlan(null)}
                className="flex items-center text-white/80 hover:text-white transition-colors"
              >
                <ChevronRight className="w-5 h-5 mr-2 rotate-180" />
                Volver a los planes
              </button>
              <div className="text-[#85ea10] font-bold text-lg">ROGERBOX</div>
            </div>

            {/* Plan Details */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Video Section */}
              <div className="lg:col-span-2">
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 mb-6">
                  <h1 className="text-3xl font-black text-white mb-4">
                    {selectedPlan.title}
                  </h1>
                  <p className="text-white/80 mb-6">
                    {selectedPlan.description}
                  </p>

                  {/* Video */}
                  <div className="relative aspect-video rounded-xl overflow-hidden mb-6">
                    <iframe
                      src={selectedPlan.videoUrl}
                      className="w-full h-full"
                      allowFullScreen
                      title={selectedPlan.title}
                    />
                  </div>

                  {/* Plan Info */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-white/5 rounded-xl">
                      <Calendar className="w-6 h-6 text-[#85ea10] mx-auto mb-2" />
                      <div className="text-white font-bold">
                        {selectedPlan.duration} días
                      </div>
                      <div className="text-white/60 text-sm">Duración</div>
                    </div>
                    <div className="text-center p-4 bg-white/5 rounded-xl">
                      <Star className="w-6 h-6 text-[#85ea10] mx-auto mb-2" />
                      <div className="text-white font-bold">
                        {selectedPlan.level}
                      </div>
                      <div className="text-white/60 text-sm">Nivel</div>
                    </div>
                    <div className="text-center p-4 bg-white/5 rounded-xl">
                      <Users className="w-6 h-6 text-[#85ea10] mx-auto mb-2" />
                      <div className="text-white font-bold">
                        {selectedPlan.purchaseCount}
                      </div>
                      <div className="text-white/60 text-sm">Compras</div>
                    </div>
                    <div className="text-center p-4 bg-white/5 rounded-xl">
                      <Utensils className="w-6 h-6 text-[#85ea10] mx-auto mb-2" />
                      <div className="text-white font-bold">
                        {selectedPlan.menu.length}
                      </div>
                      <div className="text-white/60 text-sm">Días de menú</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Purchase Section */}
              <div className="lg:col-span-1">
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 sticky top-8">
                  <div className="text-center mb-6">
                    <div className="text-4xl font-black text-[#85ea10] mb-2">
                      {formatPrice(selectedPlan.price)}
                    </div>
                    <div className="text-white/60">Pago único</div>
                  </div>

                  <button
                    onClick={() => onPurchase(selectedPlan.id)}
                    className="w-full bg-[#85ea10] hover:bg-[#85ea10]/80 text-black font-bold py-4 px-6 rounded-xl transition-colors duration-300 flex items-center justify-center"
                  >
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    Comprar Plan
                  </button>

                  {/* Nutritional Info */}
                  <div className="mt-6 p-4 bg-white/5 rounded-xl">
                    <h3 className="text-white font-bold mb-4">
                      Información Nutricional Diaria
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-white/80">Calorías:</span>
                        <span className="text-white font-bold">
                          {selectedPlan.nutritionalInfo.totalCalories}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/80">Proteínas:</span>
                        <span className="text-white font-bold">
                          {selectedPlan.nutritionalInfo.protein}g
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/80">Carbohidratos:</span>
                        <span className="text-white font-bold">
                          {selectedPlan.nutritionalInfo.carbs}g
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/80">Grasas:</span>
                        <span className="text-white font-bold">
                          {selectedPlan.nutritionalInfo.fat}g
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Menu Preview */}
            {selectedPlan.menu.length > 0 && (
              <div className="mt-8 bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                <h2 className="text-2xl font-bold text-white mb-6">
                  Vista Previa del Menú
                </h2>
                <div className="space-y-6">
                  {selectedPlan.menu.slice(0, 3).map((day, index) => (
                    <div key={index} className="bg-white/5 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-white">
                          Día {day.day}
                        </h3>
                        <div className="text-[#85ea10] font-bold">
                          {day.totalCalories} cal
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {day.meals.map((meal, mealIndex) => (
                          <div
                            key={mealIndex}
                            className="bg-white/5 rounded-lg p-3"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-bold text-white">
                                {meal.name}
                              </h4>
                              <span className="text-[#85ea10] text-sm">
                                {meal.time}
                              </span>
                            </div>
                            <div className="text-white/60 text-sm mb-2">
                              {meal.calories} calorías
                            </div>
                            <div className="space-y-1">
                              {meal.foods.slice(0, 2).map((food, foodIndex) => (
                                <div
                                  key={foodIndex}
                                  className="text-white/80 text-sm"
                                >
                                  • {food.name} ({food.quantity})
                                </div>
                              ))}
                              {meal.foods.length > 2 && (
                                <div className="text-white/60 text-sm">
                                  +{meal.foods.length - 2} más...
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      {/* Background Overlay */}
      <div className="fixed inset-0 bg-gradient-to-r from-[#164151]/80 via-[#29839c]/70 to-[#164151]/60 backdrop-blur-sm z-0"></div>

      {/* Content */}
      <div className="relative z-10 min-h-screen p-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-black text-white mb-4">
              PLANES <span className="text-[#85ea10]">NUTRICIONALES</span>
            </h1>
            <p className="text-xl text-white/80 max-w-2xl mx-auto">
              Planes nutricionales diseñados por Roger Barreto para maximizar
              tus resultados
            </p>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-6 py-3 rounded-full border-2 transition-all duration-300 ${
                  selectedCategory === category.id
                    ? 'border-[#85ea10] bg-[#85ea10]/10 text-[#85ea10]'
                    : 'border-white/30 text-white hover:border-white/50'
                }`}
              >
                <span className="mr-2">{category.icon}</span>
                {category.name}
              </button>
            ))}
          </div>

          {/* Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPlans.map((plan) => (
              <div
                key={plan.id}
                className="bg-white/5 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/10 hover:border-[#85ea10]/50 transition-all duration-300 group"
              >
                {/* Plan Image */}
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={plan.thumbnailUrl}
                    alt={plan.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 bg-[#85ea10]/20 text-[#85ea10] rounded-full text-sm font-medium">
                      {categories.find((c) => c.id === plan.category)?.name}
                    </span>
                  </div>
                  <div className="absolute top-4 right-4">
                    <span className="px-3 py-1 bg-black/40 text-white rounded-full text-sm">
                      {plan.level}
                    </span>
                  </div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <button
                      onClick={() => setSelectedPlan(plan)}
                      className="w-full bg-[#85ea10] hover:bg-[#85ea10]/80 text-black font-bold py-2 px-4 rounded-lg transition-colors duration-300 flex items-center justify-center"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Ver Detalles
                    </button>
                  </div>
                </div>

                {/* Plan Content */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-white mb-3 group-hover:text-[#85ea10] transition-colors">
                    {plan.title}
                  </h3>

                  <p className="text-white/70 mb-4 line-clamp-3">
                    {plan.description}
                  </p>

                  {/* Plan Meta */}
                  <div className="flex items-center justify-between text-sm text-white/60 mb-4">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {plan.duration} días
                    </div>
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-1" />
                      {plan.purchaseCount} compras
                    </div>
                  </div>

                  {/* Price and Purchase */}
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-black text-[#85ea10]">
                      {formatPrice(plan.price)}
                    </div>
                    <button
                      onClick={() => onPurchase(plan.id)}
                      className="bg-white/10 hover:bg-[#85ea10] hover:text-black text-white px-4 py-2 rounded-lg transition-all duration-300 flex items-center"
                    >
                      <ShoppingCart className="w-4 h-4 mr-1" />
                      Comprar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {filteredPlans.length === 0 && (
            <div className="text-center py-16">
              <Utensils className="w-16 h-16 text-white/40 mx-auto mb-4" />
              <h3 className="text-xl text-white/60 mb-2">
                No hay planes disponibles
              </h3>
              <p className="text-white/40">
                Próximamente más planes nutricionales
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
