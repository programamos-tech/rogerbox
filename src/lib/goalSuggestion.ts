// Algoritmo inteligente para sugerir metas basadas en el perfil del usuario

export interface GoalSuggestion {
  title: string;
  description: string;
  targetWeight: number;
  currentWeight: number; // Add current weight
  weightLossGoal: number; // Add weight loss goal
  deadline: string;
  motivation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedDuration: string;
  recommendedCourse: string;
  recommendedCourseImage: string; // Add course image
  keyPoints: string[];
}

export interface UserProfile {
  name: string;
  height: number;
  weight: number;
  gender: string;
  goals: string[];
  birthYear?: number;
  dietaryHabits?: string[];
}

export function generateGoalSuggestion(profile: UserProfile): GoalSuggestion {
  const currentBMI = profile.weight / (profile.height / 100) ** 2;
  const age = profile.birthYear
    ? new Date().getFullYear() - profile.birthYear
    : 30;

  // Determinar categoría de peso según OMS
  let weightCategory = '';
  let bmiMessage = '';
  let recommendedWeightLoss = 0;

  if (currentBMI >= 30) {
    weightCategory = 'obesidad';
    bmiMessage = 'Según la OMS, tienes obesidad (IMC ≥ 30)';
    // Meta realista: 5-10% del peso actual como primer objetivo
    recommendedWeightLoss = Math.round(profile.weight * 0.08); // 8% del peso actual
  } else if (currentBMI >= 25) {
    weightCategory = 'sobrepeso';
    bmiMessage = 'Según la OMS, tienes sobrepeso (IMC 25-29.9)';
    // Meta realista: 5-10% del peso actual
    recommendedWeightLoss = Math.round(profile.weight * 0.07); // 7% del peso actual
  } else if (currentBMI >= 18.5) {
    weightCategory = 'peso_normal';
    bmiMessage =
      'Según la OMS, tu peso está en el rango normal (IMC 18.5-24.9)';
    recommendedWeightLoss = 0;
  } else {
    weightCategory = 'bajo_peso';
    bmiMessage = 'Según la OMS, tienes bajo peso (IMC < 18.5)';
    recommendedWeightLoss = 0;
  }

  // Calcular peso objetivo basado en recomendaciones médicas realistas
  let targetWeight = profile.weight;
  let difficulty: 'easy' | 'medium' | 'hard' = 'medium';
  let estimatedDuration = '3 meses';
  let recommendedCourse = '';
  let recommendedCourseImage = '';
  let keyPoints: string[] = [];

  // Solo sugerir pérdida de peso si hay sobrepeso/obesidad
  if (recommendedWeightLoss > 0) {
    targetWeight = profile.weight - recommendedWeightLoss;

    if (currentBMI >= 30) {
      // Obesidad - enfoque gradual
      difficulty = 'hard';
      recommendedCourse = 'CARDIO HIIT 40 MIN ¡BAJA DE PESO!';
      recommendedCourseImage = '/images/courses/course-1.jpg';
      estimatedDuration = '24 semanas';
      keyPoints = [
        'Pérdida gradual de 0.5-1 kg por semana',
        'Rutinas HIIT adaptadas a tu nivel',
        'Control calórico moderado',
        'Seguimiento semanal de progreso',
      ];
    } else if (currentBMI >= 25) {
      // Sobrepeso - enfoque moderado
      difficulty = 'medium';
      recommendedCourse = 'RUTINA HIIT ¡ENTRENA 12 MINUTOS EN VACACIONES!';
      recommendedCourseImage = '/images/courses/course-1.jpg';
      estimatedDuration = '16 semanas';
      keyPoints = [
        'Pérdida gradual de 0.3-0.7 kg por semana',
        'Entrenamientos HIIT 3-4 veces por semana',
        'Déficit calórico moderado',
        'Medición mensual de progreso',
      ];
    }
  } else if (profile.goals.includes('lose_weight') && currentBMI < 25) {
    // Si quiere bajar peso pero está en rango normal, sugerir tonificación
    targetWeight = profile.weight;
    difficulty = 'easy';
    recommendedCourse = 'FULL BODY EXPRESS ¡ENTRENA 12 MINUTOS EN VACACIONES!';
    recommendedCourseImage = '/images/courses/course-1.jpg';
    estimatedDuration = '8 semanas';
    keyPoints = [
      'Rutinas de tonificación',
      'Mantenimiento calórico',
      'Ejercicios de resistencia',
      'Enfoque en composición corporal',
    ];
  }
  // Lógica para ganar músculo
  else if (profile.goals.includes('gain_muscle')) {
    targetWeight = Math.round(24 * (profile.height / 100) ** 2);
    difficulty = 'hard';
    recommendedCourse = 'FULL BODY EXPRESS ¡ENTRENA 12 MINUTOS EN VACACIONES!';
    recommendedCourseImage = '/images/courses/course-1.jpg';
    estimatedDuration = '24 semanas';
    keyPoints = [
      'Entrenamiento de fuerza progresivo',
      'Superávit calórico controlado',
      'Proteína alta (1.6-2.2g/kg)',
      'Descanso adecuado entre sesiones',
    ];
  }
  // Lógica para tonificar
  else if (profile.goals.includes('tone')) {
    targetWeight = Math.round(22 * (profile.height / 100) ** 2);
    difficulty = 'medium';
    recommendedCourse = 'RUTINA HIIT ¡ENTRENA 12 MINUTOS EN VACACIONES!';
    recommendedCourseImage = '/images/courses/course-1.jpg';
    estimatedDuration = '12 semanas';
    keyPoints = [
      'Rutinas HIIT de tonificación',
      'Ejercicios con peso corporal',
      'Mantenimiento calórico',
      'Enfoque en definición muscular',
    ];
  }
  // Lógica para resistencia
  else if (profile.goals.includes('endurance')) {
    targetWeight = Math.round(21 * (profile.height / 100) ** 2);
    difficulty = 'medium';
    recommendedCourse = 'CARDIO HIIT 40 MIN ¡BAJA DE PESO!';
    recommendedCourseImage = '/images/courses/course-1.jpg';
    estimatedDuration = '8 semanas';
    keyPoints = [
      'Cardio progresivo',
      'Entrenamientos de intervalos',
      'Hidratación óptima',
      'Seguimiento de frecuencia cardíaca',
    ];
  }
  // Lógica para flexibilidad
  else if (profile.goals.includes('flexibility')) {
    targetWeight = profile.weight; // Mantener peso
    difficulty = 'easy';
    recommendedCourse = 'FULL BODY EXPRESS ¡ENTRENA 12 MINUTOS EN VACACIONES!';
    recommendedCourseImage = '/images/courses/course-1.jpg';
    estimatedDuration = '4 semanas';
    keyPoints = [
      'Rutinas de yoga y estiramiento',
      'Movilidad articular',
      'Respiración consciente',
      'Flexibilidad progresiva',
    ];
  }
  // Lógica para fuerza
  else if (profile.goals.includes('strength')) {
    targetWeight = Math.round(23 * (profile.height / 100) ** 2);
    difficulty = 'hard';
    recommendedCourse = 'FULL BODY EXPRESS ¡ENTRENA 12 MINUTOS EN VACACIONES!';
    recommendedCourseImage = '/images/courses/course-1.jpg';
    estimatedDuration = '16 semanas';
    keyPoints = [
      'Levantamiento de pesas progresivo',
      'Técnica perfecta',
      'Proteína alta',
      'Progresión lineal',
    ];
  }
  // Meta por defecto si no hay objetivos específicos
  else {
    if (currentBMI > 25) {
      targetWeight = Math.round(23 * (profile.height / 100) ** 2);
      difficulty = 'medium';
      recommendedCourse = 'RUTINA HIIT ¡ENTRENA 12 MINUTOS EN VACACIONES!';
      recommendedCourseImage = '/images/courses/course-1.jpg';
      estimatedDuration = '12 semanas';
      keyPoints = [
        'Rutinas HIIT equilibradas',
        'Alimentación balanceada',
        'Ejercicio regular',
        'Seguimiento de progreso',
      ];
    } else {
      targetWeight = profile.weight;
      difficulty = 'easy';
      recommendedCourse =
        'FULL BODY EXPRESS ¡ENTRENA 12 MINUTOS EN VACACIONES!';
      recommendedCourseImage = '/images/courses/course-1.jpg';
      estimatedDuration = '8 semanas';
      keyPoints = [
        'Mantenimiento de peso saludable',
        'Ejercicio regular',
        'Alimentación balanceada',
        'Bienestar general',
      ];
    }
  }

  // Calcular diferencia de peso
  const weightDifference = targetWeight - profile.weight;
  const isWeightLoss = weightDifference < 0;
  const isWeightGain = weightDifference > 0;

  // Generar título personalizado con información de la OMS
  let title = '';
  if (recommendedWeightLoss > 0) {
    title = `${bmiMessage}. ¿Te gustaría bajar ${recommendedWeightLoss} kg?`;
  } else if (isWeightGain) {
    title = `¿Te interesa ganar ${weightDifference} kg de músculo?`;
  } else {
    title = `${bmiMessage}. ¿Quieres mejorar tu composición corporal?`;
  }

  // Generar descripción personalizada con enfoque médico
  let description = '';
  if (recommendedWeightLoss > 0) {
    description = `Te sugerimos una meta realista de ${recommendedWeightLoss} kg menos (${Math.round((recommendedWeightLoss / profile.weight) * 100)}% de tu peso actual). Esta es una meta segura y alcanzable según las recomendaciones médicas. ¿Te parece bien?`;
  } else if (profile.goals.includes('gain_muscle')) {
    description = `Para ganar músculo de forma saludable, podrías considerar aumentar ${weightDifference} kg con entrenamiento de fuerza. ¿Te interesa?`;
  } else if (profile.goals.includes('tone')) {
    description = `Para tonificar tu cuerpo, podrías mantener tu peso actual mientras mejoras tu composición corporal. ¿Te gusta esta idea?`;
  } else {
    description = `Podríamos ayudarte a mejorar tu composición corporal con un plan personalizado. ¿Te parece una buena meta?`;
  }

  // Generar motivación personalizada con enfoque en beneficios reales
  let motivation = '';
  if (recommendedWeightLoss > 0) {
    motivation = `Con esta meta realista de ${recommendedWeightLoss} kg menos, notarás mejoras en tu energía, movilidad y confianza. Es un objetivo alcanzable que te motivará a seguir adelante.`;
  } else if (isWeightGain) {
    motivation = `Con ${weightDifference} kg más de músculo te verías más fuerte y atlético.`;
  } else {
    motivation = `Mejorar tu composición corporal te dará más energía, fuerza y confianza en ti mismo.`;
  }

  // Calcular fecha límite
  const deadline = new Date();
  if (estimatedDuration.includes('1-2')) {
    deadline.setMonth(deadline.getMonth() + 2);
  } else if (estimatedDuration.includes('2-3')) {
    deadline.setMonth(deadline.getMonth() + 3);
  } else if (estimatedDuration.includes('3-4')) {
    deadline.setMonth(deadline.getMonth() + 4);
  } else if (estimatedDuration.includes('4-6')) {
    deadline.setMonth(deadline.getMonth() + 6);
  } else if (estimatedDuration.includes('6-8')) {
    deadline.setMonth(deadline.getMonth() + 8);
  } else if (estimatedDuration.includes('6-12')) {
    deadline.setMonth(deadline.getMonth() + 12);
  } else {
    deadline.setMonth(deadline.getMonth() + 3);
  }

  return {
    title,
    description,
    targetWeight,
    currentWeight: profile.weight, // Add current weight
    weightLossGoal: recommendedWeightLoss, // Add weight loss goal
    deadline: deadline.toISOString().split('T')[0],
    motivation,
    difficulty,
    estimatedDuration,
    recommendedCourse,
    recommendedCourseImage, // Add course image
    keyPoints,
  };
}

// Función para obtener el color de dificultad
export function getDifficultyColor(
  difficulty: 'easy' | 'medium' | 'hard',
): string {
  switch (difficulty) {
    case 'easy':
      return 'text-green-600 bg-green-50 border-green-200';
    case 'medium':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'hard':
      return 'text-red-600 bg-red-50 border-red-200';
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200';
  }
}

// Función para obtener el emoji de dificultad
export function getDifficultyEmoji(
  difficulty: 'easy' | 'medium' | 'hard',
): string {
  switch (difficulty) {
    case 'easy':
      return '😊';
    case 'medium':
      return '💪';
    case 'hard':
      return '🔥';
    default:
      return '🎯';
  }
}

// Función para obtener el color del IMC
export function getBMIColor(bmi: number): {
  background: string;
  border: string;
  accent: string;
  text: string;
} {
  if (bmi >= 30) {
    // Obesidad - Rojo
    return {
      background:
        'from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20',
      border: 'border-red-200 dark:border-red-800',
      accent: 'text-red-600',
      text: 'text-red-600',
    };
  } else if (bmi >= 25) {
    // Sobrepeso - Amarillo
    return {
      background:
        'from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20',
      border: 'border-yellow-200 dark:border-yellow-800',
      accent: 'text-yellow-600',
      text: 'text-yellow-600',
    };
  } else {
    // Peso normal - Azul
    return {
      background:
        'from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20',
      border: 'border-blue-200 dark:border-blue-800',
      accent: 'text-blue-600',
      text: 'text-blue-600',
    };
  }
}
