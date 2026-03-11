'use client';

import {
  Activity,
  Calendar,
  ChevronLeft,
  ChevronRight,
  FileDigit,
  Ruler,
  Target,
  TrendingDown,
  TrendingUp,
  User,
  Weight,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface OnboardingProps {
  onComplete: (profile: UserProfile) => void;
  isUpdating?: boolean;
  userName?: string;
}

interface UserProfile {
  document_id: string;
  name: string;
  height: number;
  gender: 'male' | 'female' | 'other';
  weight: number;
  birthYear?: number;
  goals: string[];
  targetWeight?: number;
  dietaryHabits?: string[];
}

export default function Onboarding({
  onComplete,
  isUpdating = false,
  userName = 'Usuario',
}: OnboardingProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);

  // Normalizar nombre completo: mantener todo el nombre, capitalizar cada palabra
  const formatName = (fullName: string) => {
    if (!fullName || fullName.trim() === '') return 'Usuario';
    return fullName
      .trim()
      .split(/\s+/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const [profile, setProfile] = useState<UserProfile>({
    document_id: '',
    name: formatName(userName),
    height: 170,
    gender: 'male',
    weight: 70,
    birthYear: 1995,
    goals: [],
    dietaryHabits: [],
  });

  const [cedulaAlreadyLinked, setCedulaAlreadyLinked] = useState(false);
  const [cedulaLinkedEmailMasked, setCedulaLinkedEmailMasked] = useState<
    string | null
  >(null);
  const [cedulaCheckLoading, setCedulaCheckLoading] = useState(false);
  const [documentStepError, setDocumentStepError] = useState<string | null>(
    null,
  );

  const checkCedulaLinked = async () => {
    const doc = profile.document_id.trim().replace(/\D/g, '');
    if (doc.length < 9) {
      setCedulaAlreadyLinked(false);
      setCedulaLinkedEmailMasked(null);
      return;
    }
    setCedulaCheckLoading(true);
    setCedulaAlreadyLinked(false);
    setCedulaLinkedEmailMasked(null);
    try {
      const res = await fetch(
        `/api/profile/check-cedula?document_id=${encodeURIComponent(doc)}`,
      );
      const data = await res.json();
      if (data.alreadyLinked) {
        setCedulaAlreadyLinked(true);
        setCedulaLinkedEmailMasked(data.emailMasked || null);
      }
    } catch {
      setCedulaAlreadyLinked(false);
      setCedulaLinkedEmailMasked(null);
    } finally {
      setCedulaCheckLoading(false);
    }
  };

  // Enfocar el input de documento al entrar o volver al paso 0
  useEffect(() => {
    if (currentStep === 0) {
      const el = document.getElementById('document_id');
      if (el && el instanceof HTMLInputElement) el.focus();
    }
  }, [currentStep]);

  // Calcular IMC según OMS
  const calculateBMI = (weight: number, height: number): number => {
    return weight / (height / 100) ** 2;
  };

  // Obtener condición según IMC de la OMS
  const getBMICondition = (
    bmi: number,
  ): { category: string; description: string; color: string } => {
    if (bmi < 18.5) {
      return {
        category: 'Bajo peso',
        description: 'Tu IMC está por debajo del rango normal según la OMS',
        color: 'text-blue-600 dark:text-blue-400',
      };
    } else if (bmi >= 18.5 && bmi < 25) {
      return {
        category: 'Peso normal',
        description: 'Tu IMC está dentro del rango saludable según la OMS',
        color: 'text-green-600 dark:text-green-400',
      };
    } else if (bmi >= 25 && bmi < 30) {
      return {
        category: 'Sobrepeso',
        description: 'Tu IMC indica sobrepeso según la OMS',
        color: 'text-orange-600 dark:text-orange-400',
      };
    } else if (bmi >= 30 && bmi < 35) {
      return {
        category: 'Obesidad grado I',
        description: 'Tu IMC indica obesidad grado I según la OMS',
        color: 'text-red-600 dark:text-red-400',
      };
    } else if (bmi >= 35 && bmi < 40) {
      return {
        category: 'Obesidad grado II',
        description: 'Tu IMC indica obesidad grado II según la OMS',
        color: 'text-red-700 dark:text-red-500',
      };
    } else {
      return {
        category: 'Obesidad grado III',
        description: 'Tu IMC indica obesidad grado III según la OMS',
        color: 'text-red-800 dark:text-red-600',
      };
    }
  };

  // Calcular peso objetivo basado en IMC de la OMS
  const calculateTargetWeightFromBMI = (
    height: number,
    weight: number,
  ): { targetWeight: number; weightToLose: number; recommendation: string } => {
    const currentBMI = calculateBMI(weight, height);
    const condition = getBMICondition(currentBMI);

    // Si está en sobrepeso u obesidad, calcular peso para IMC de 22.5 (centro del rango normal)
    if (currentBMI >= 25) {
      const targetBMI = 22.5; // Centro del rango normal (18.5-24.9)
      const targetWeight = Math.round(targetBMI * (height / 100) ** 2);
      const weightToLose = weight - targetWeight;

      return {
        targetWeight,
        weightToLose,
        recommendation: `Para alcanzar un IMC saludable (22.5), tu peso objetivo es ${targetWeight} kg. Deberías bajar ${weightToLose} kg.`,
      };
    } else if (currentBMI >= 18.5 && currentBMI < 25) {
      // Si está en peso normal, mantener peso pero sugerir tonificar
      return {
        targetWeight: weight,
        weightToLose: 0,
        recommendation:
          'Tu peso está en el rango normal. Te recomendamos enfocarte en tonificar y ganar masa muscular.',
      };
    } else {
      // Si está bajo peso, sugerir ganar peso saludablemente
      const targetBMI = 21; // Centro del rango normal
      const targetWeight = Math.round(targetBMI * (height / 100) ** 2);
      const weightToGain = targetWeight - weight;

      return {
        targetWeight,
        weightToLose: -weightToGain,
        recommendation: `Para alcanzar un IMC saludable, tu peso objetivo es ${targetWeight} kg. Deberías ganar ${weightToGain} kg de forma saludable.`,
      };
    }
  };

  const steps = [
    {
      title: 'Ingresa tu documento de identidad',
      icon: (
        <FileDigit className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-[#85ea10] flex-shrink-0 mx-auto" />
      ),
      component: (
        <div className="space-y-4 sm:space-y-6">
          <div className="text-center">
            <input
              id="document_id"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              autoFocus
              value={profile.document_id}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                setProfile({ ...profile, document_id: value });
                setCedulaAlreadyLinked(false);
                setCedulaLinkedEmailMasked(null);
                setDocumentStepError(null);
              }}
              onBlur={checkCedulaLinked}
              className="w-full text-center text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 dark:text-white bg-transparent border-none focus:outline-none focus:ring-0 py-2 rounded-lg"
              maxLength={10}
              aria-label="Número de cédula"
            />
            <div className="w-full h-2 bg-gray-200 dark:bg-white/20 rounded-lg mt-1" />
            {documentStepError && (
              <p className="text-amber-600 dark:text-amber-400 text-xs sm:text-sm mt-2 font-medium">
                {documentStepError}
              </p>
            )}
            {cedulaCheckLoading && (
              <p className="text-gray-500 dark:text-white/50 text-xs sm:text-sm mt-2">
                Verificando...
              </p>
            )}
            {cedulaAlreadyLinked && (
              <div className="mt-2 px-2 space-y-1.5">
                <p className="text-amber-600 dark:text-amber-400 font-semibold text-xs sm:text-sm">
                  Esta cédula ya está vinculada a otra cuenta.
                  {cedulaLinkedEmailMasked ? (
                    <>
                      {' '}
                      Si es tuya, inicia sesión con{' '}
                      <span className="underline">
                        {cedulaLinkedEmailMasked}
                      </span>
                      .
                    </>
                  ) : (
                    ' Si es tuya, inicia sesión con la cuenta que usaste al registrarte.'
                  )}
                </p>
                <p className="text-gray-600 dark:text-white/70 text-xs">
                  Si no tienes acceso a esa cuenta, contacta a soporte{' '}
                  <a
                    href="https://wa.me/573002061711?text=Hola%20RogerBox.%20Reporto%3A%20Mi%20c%C3%A9dula%20ya%20est%C3%A1%20vinculada%20a%20otra%20cuenta%20y%20no%20tengo%20acceso."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline font-medium text-amber-600 dark:text-amber-400"
                  >
                    3002061711
                  </a>{' '}
                  de RogerBox.
                </p>
              </div>
            )}
            {!cedulaCheckLoading && !cedulaAlreadyLinked && (
              <p className="text-gray-600 dark:text-white/60 text-xs sm:text-sm mt-3">
                Con tu documento de identidad te vinculamos con ROGERBOX sede
                física si ya eres cliente
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      title: '¿Cuál es tu altura?',
      icon: (
        <Ruler className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-[#85ea10] flex-shrink-0 mx-auto" />
      ),
      component: (
        <div className="space-y-4 sm:space-y-6">
          <div className="text-center">
            <div className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 dark:text-white mb-3 sm:mb-4">
              {profile.height} cm
            </div>
            <input
              type="range"
              min="140"
              max="220"
              value={profile.height}
              onChange={(e) =>
                setProfile({ ...profile, height: parseInt(e.target.value) })
              }
              className="w-full h-2 bg-gray-200 dark:bg-white/20 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>
          <div className="flex justify-between text-gray-600 dark:text-white/60 text-xs sm:text-sm">
            <span>140 cm</span>
            <span>220 cm</span>
          </div>
        </div>
      ),
    },
    {
      title: '¿Cuál es tu sexo?',
      icon: (
        <User className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-[#85ea10] flex-shrink-0 mx-auto" />
      ),
      component: (
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          {[
            { value: 'male', label: 'Hombre', emoji: '👨🏽' },
            { value: 'female', label: 'Mujer', emoji: '👩🏽' },
            { value: 'other', label: 'Otro', emoji: '🧑🏽' },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() =>
                setProfile({ ...profile, gender: option.value as any })
              }
              className={`p-3 sm:p-5 lg:p-6 rounded-xl sm:rounded-2xl border-2 transition-all duration-300 ${
                profile.gender === option.value
                  ? 'border-[#85ea10] bg-[#85ea10]/10 text-[#85ea10]'
                  : 'border-gray-200 dark:border-white/30 text-gray-900 dark:text-white hover:border-[#85ea10]/50'
              }`}
            >
              <div className="text-2xl sm:text-3xl lg:text-4xl mb-1 sm:mb-2">
                {option.emoji}
              </div>
              <div className="font-bold text-xs sm:text-sm">{option.label}</div>
            </button>
          ))}
        </div>
      ),
    },
    {
      title: '¿Cuál es tu peso actual?',
      icon: (
        <Weight className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-[#85ea10] flex-shrink-0 mx-auto" />
      ),
      component: (
        <div className="space-y-4 sm:space-y-6">
          <div className="text-center">
            <div className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 dark:text-white mb-3 sm:mb-4">
              {profile.weight} kg
            </div>
            <input
              type="range"
              min="40"
              max="150"
              value={profile.weight}
              onChange={(e) =>
                setProfile({ ...profile, weight: parseInt(e.target.value) })
              }
              className="w-full h-2 bg-gray-200 dark:bg-white/20 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>
          <div className="flex justify-between text-gray-600 dark:text-white/60 text-xs sm:text-sm">
            <span>40 kg</span>
            <span>150 kg</span>
          </div>
          {profile.goals.length > 0 && (
            <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-[#85ea10]/10 border border-[#85ea10]/30 rounded-xl">
              <div className="text-center">
                <div className="text-xs sm:text-sm text-gray-600 dark:text-white/80 mb-1.5 sm:mb-2">
                  Tu meta de peso recomendada:
                </div>
                <div className="text-xl sm:text-2xl font-bold text-[#85ea10]">
                  {
                    calculateTargetWeightFromBMI(profile.height, profile.weight)
                      .targetWeight
                  }{' '}
                  kg
                </div>
                <div className="text-[11px] sm:text-xs text-gray-500 dark:text-white/60 mt-1">
                  Basado en tu IMC según la OMS
                </div>
              </div>
            </div>
          )}
        </div>
      ),
    },
    {
      title: '¿En qué año naciste?',
      icon: (
        <Calendar className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-[#85ea10] flex-shrink-0 mx-auto" />
      ),
      component: (
        <div className="space-y-4 sm:space-y-6">
          <div className="text-center">
            <div className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 dark:text-white mb-3 sm:mb-4">
              {profile.birthYear}
            </div>
            <input
              type="range"
              min="1950"
              max="2010"
              value={profile.birthYear}
              onChange={(e) =>
                setProfile({ ...profile, birthYear: parseInt(e.target.value) })
              }
              className="w-full h-2 bg-gray-200 dark:bg-white/20 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>
          <div className="flex justify-between text-gray-600 dark:text-white/60 text-xs sm:text-sm">
            <span>1950</span>
            <span>2010</span>
          </div>
          <div className="text-center text-xs sm:text-sm text-gray-500 dark:text-white/60">
            Edad:{' '}
            {profile.birthYear
              ? new Date().getFullYear() - profile.birthYear
              : 'No especificada'}{' '}
            años
          </div>
        </div>
      ),
    },
    {
      title: '¿Qué quieres lograr?',
      icon: (
        <Target className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-[#85ea10] flex-shrink-0 mx-auto" />
      ),
      component: (
        <div className="grid grid-cols-2 gap-2 sm:gap-4">
          {[
            { id: 'lose_weight', label: 'Bajar de peso', emoji: '🔥' },
            { id: 'tone', label: 'Tonificar', emoji: '💪' },
            { id: 'gain_muscle', label: 'Ganar músculo', emoji: '🏋️' },
            { id: 'endurance', label: 'Resistencia', emoji: '🏃' },
            { id: 'flexibility', label: 'Flexibilidad', emoji: '🧘' },
            { id: 'strength', label: 'Fuerza', emoji: '⚡' },
          ].map((goal) => (
            <button
              key={goal.id}
              onClick={() => {
                const newGoals = profile.goals.includes(goal.id)
                  ? profile.goals.filter((g) => g !== goal.id)
                  : [...profile.goals, goal.id];
                setProfile({ ...profile, goals: newGoals });
              }}
              className={`p-3 sm:p-4 rounded-lg sm:rounded-xl border-2 transition-all duration-300 ${
                profile.goals.includes(goal.id)
                  ? 'border-[#85ea10] bg-[#85ea10]/10 text-[#85ea10]'
                  : 'border-gray-200 dark:border-white/30 text-gray-900 dark:text-white hover:border-[#85ea10]/50'
              }`}
            >
              <div className="text-xl sm:text-2xl mb-1 sm:mb-2">
                {goal.emoji}
              </div>
              <div className="font-bold text-xs sm:text-sm">{goal.label}</div>
            </button>
          ))}
        </div>
      ),
    },
    {
      title: 'Tu meta de peso objetivo',
      icon: (
        <Target className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-[#85ea10] flex-shrink-0 mx-auto" />
      ),
      component: (() => {
        // Componente interno para manejar la actualización del estado
        const WeightGoalStepContent = () => {
          const currentBMI = calculateBMI(profile.weight, profile.height);
          const condition = getBMICondition(currentBMI);
          const targetData = calculateTargetWeightFromBMI(
            profile.height,
            profile.weight,
          );

          // Calcular posición del indicador en la barra de IMC
          const bmiRange = 40 - 15; // Rango total de IMC mostrado (15 a 40)
          const bmiPosition = ((currentBMI - 15) / bmiRange) * 100;
          const indicatorPosition = Math.min(Math.max(bmiPosition, 0), 100);

          // Actualizar el targetWeight en el perfil automáticamente usando useEffect
          useEffect(() => {
            const newTargetWeight = calculateTargetWeightFromBMI(
              profile.height,
              profile.weight,
            ).targetWeight;
            if (profile.targetWeight !== newTargetWeight) {
              setProfile((prev) => ({
                ...prev,
                targetWeight: newTargetWeight,
              }));
            }
          }, [profile.weight, profile.height, profile.targetWeight]);

          return (
            <div className="space-y-3 sm:space-y-4">
              {/* Información del IMC actual */}
              <div className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-xl p-3 sm:p-4 border border-gray-200 dark:border-white/20">
                <div className="text-center mb-3">
                  <div className="text-[11px] sm:text-xs text-gray-600 dark:text-white/60 mb-1">
                    Tu IMC actual
                  </div>
                  <div className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white mb-1">
                    {currentBMI.toFixed(1)}
                  </div>
                  <div
                    className={`text-sm sm:text-base font-bold ${condition.color} mb-1`}
                  >
                    {condition.category}
                  </div>
                  <div className="text-[11px] sm:text-xs text-gray-600 dark:text-white/70 leading-snug">
                    {condition.description}
                  </div>
                </div>

                {/* Barra de rango IMC */}
                <div className="mt-3">
                  <div className="flex justify-between text-[10px] sm:text-xs text-gray-500 dark:text-white/50 mb-1.5">
                    <span>Bajo peso</span>
                    <span>Normal</span>
                    <span>Sobrepeso</span>
                    <span>Obesidad</span>
                  </div>
                  <div className="relative h-3 bg-gray-200 dark:bg-white/20 rounded-full overflow-hidden">
                    {/* Rangos de color */}
                    <div className="absolute inset-0 flex">
                      <div className="flex-1 bg-blue-200 dark:bg-blue-900/30"></div>
                      <div className="flex-1 bg-green-200 dark:bg-green-900/30"></div>
                      <div className="flex-1 bg-orange-200 dark:bg-orange-900/30"></div>
                      <div className="flex-1 bg-red-200 dark:bg-red-900/30"></div>
                    </div>
                    {/* Indicador de posición actual */}
                    <div
                      className="absolute top-0 bottom-0 w-1 bg-gray-900 dark:bg-white z-10"
                      style={{
                        left: `${indicatorPosition}%`,
                      }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-[10px] sm:text-xs text-gray-500 dark:text-white/50 mt-0.5">
                    <span>15</span>
                    <span>18.5</span>
                    <span>25</span>
                    <span>30</span>
                    <span>40</span>
                  </div>
                </div>
              </div>

              {/* Meta de peso objetivo */}
              <div
                className={`rounded-xl p-3 sm:p-4 border-2 ${
                  currentBMI >= 25
                    ? 'border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-900/20'
                    : currentBMI < 18.5
                      ? 'border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20'
                }`}
              >
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2 flex-wrap gap-1">
                    {currentBMI >= 25 ? (
                      <TrendingDown className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600 dark:text-orange-400 flex-shrink-0" />
                    ) : currentBMI < 18.5 ? (
                      <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                    ) : (
                      <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400 flex-shrink-0" />
                    )}
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                      Tu meta objetivo
                    </h3>
                  </div>

                  <div className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white mb-1">
                    {targetData.targetWeight} kg
                  </div>

                  {targetData.weightToLose > 0 && (
                    <div className="text-sm sm:text-base text-orange-600 dark:text-orange-400 font-semibold mb-2">
                      Bajar {targetData.weightToLose} kg
                    </div>
                  )}

                  {targetData.weightToLose < 0 && (
                    <div className="text-sm sm:text-base text-blue-600 dark:text-blue-400 font-semibold mb-2">
                      Ganar {Math.abs(targetData.weightToLose)} kg
                    </div>
                  )}

                  {targetData.weightToLose === 0 && (
                    <div className="text-sm sm:text-base text-green-600 dark:text-green-400 font-semibold mb-2">
                      Mantener peso y tonificar
                    </div>
                  )}

                  <div className="text-[11px] sm:text-xs text-gray-700 dark:text-white/80 mt-2 p-2 bg-white/50 dark:bg-gray-800/50 rounded-lg leading-snug">
                    {targetData.recommendation}
                  </div>
                </div>
              </div>

              {/* Información adicional */}
              <div className="bg-[#85ea10]/10 border border-[#85ea10]/30 rounded-xl p-2.5 sm:p-3">
                <div className="text-[11px] sm:text-xs text-gray-700 dark:text-white/80 text-center leading-snug">
                  <span className="font-semibold text-[#85ea10]">💡 Nota:</span>{' '}
                  Esta meta se establecerá como tu objetivo principal en
                  ROGERBOX y se ajustará automáticamente según tu progreso.
                </div>
              </div>
            </div>
          );
        };

        return <WeightGoalStepContent />;
      })(),
    },
  ];

  const handleNext = async () => {
    // Paso 0: cédula obligatoria; verificar siempre al hacer clic en Siguiente (no solo onBlur)
    if (currentStep === 0) {
      const doc = profile.document_id.trim().replace(/\D/g, '');
      if (!doc) {
        setDocumentStepError('Por favor ingresa tu documento de identidad.');
        return;
      }
      if (doc.length < 9) {
        setDocumentStepError(
          'El documento debe tener al menos 9 dígitos. Máximo 10 dígitos.',
        );
        return;
      }
      if (doc.length > 10) {
        setDocumentStepError('El documento no puede tener más de 10 dígitos.');
        return;
      }
      setDocumentStepError(null);
      // Revalidar con la API al hacer Siguiente por si no hicieron blur
      if (!cedulaAlreadyLinked) {
        setCedulaCheckLoading(true);
        try {
          const res = await fetch(
            `/api/profile/check-cedula?document_id=${encodeURIComponent(doc)}`,
          );
          const data = await res.json();
          if (data.alreadyLinked) {
            setCedulaAlreadyLinked(true);
            setCedulaLinkedEmailMasked(data.emailMasked || null);
            setCedulaCheckLoading(false);
            return;
          }
        } catch {
          setCedulaCheckLoading(false);
          return;
        }
        setCedulaCheckLoading(false);
      }
      if (cedulaAlreadyLinked) {
        setDocumentStepError(
          'Esta cédula ya está vinculada a otra cuenta. Si es tuya, inicia sesión con esa cuenta. Si no tienes acceso, contacta a soporte 3002061711 de RogerBox.',
        );
        return;
      }
    }

    // Paso de objetivos: al menos uno seleccionado
    const goalsStepIndex = 5;
    if (currentStep === goalsStepIndex && profile.goals.length === 0) {
      alert('Por favor selecciona al menos un objetivo para continuar.');
      return;
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Validación final antes de completar
      if (profile.goals.length === 0) {
        alert('Por favor selecciona al menos un objetivo para finalizar.');
        return;
      }

      // Calcular peso objetivo basado en IMC de la OMS antes de completar
      const targetData = calculateTargetWeightFromBMI(
        profile.height,
        profile.weight,
      );
      const formattedName = formatName(userName);

      // Asegurar que el targetWeight y document_id estén en el perfil final
      const finalProfile = {
        ...profile,
        document_id: profile.document_id.trim(),
        targetWeight: targetData.targetWeight,
        name: formattedName,
      };

      onComplete(finalProfile);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Content */}
      <div className="min-h-screen flex items-center justify-center p-3 sm:p-4">
        <div className="max-w-2xl w-full min-w-0">
          {/* Header - tamaños responsive para móviles pequeños */}
          <div className="text-center mb-3 sm:mb-4">
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">
              ROGER<span className="text-[#85ea10]">BOX</span>
            </h1>
          </div>

          {/* Progress Bar */}
          <div className="mb-3 sm:mb-4">
            <div className="flex justify-between text-gray-600 dark:text-white/60 text-xs sm:text-sm mb-1.5 sm:mb-2">
              <span>
                Paso {currentStep + 1} de {steps.length}
              </span>
              <span>
                {Math.round(((currentStep + 1) / steps.length) * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-white/20 rounded-full h-1.5 sm:h-2">
              <div
                className="bg-[#85ea10] h-1.5 sm:h-2 rounded-full transition-all duration-500"
                style={{
                  width: `${((currentStep + 1) / steps.length) * 100}%`,
                }}
              ></div>
            </div>
          </div>

          {/* Current Step - padding y tamaños responsive */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 sm:p-6 border border-gray-200 dark:border-white/20 shadow-xl">
            <div className="text-center mb-3 sm:mb-4">
              {steps[currentStep].icon}
              <h2 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 dark:text-white mt-2 sm:mt-3">
                {steps[currentStep].title}
              </h2>
            </div>

            {steps[currentStep].component}

            {/* Aviso en paso de objetivos si no hay ninguno seleccionado */}
            {currentStep === 5 && profile.goals.length === 0 && (
              <p className="text-center text-sm text-amber-600 dark:text-amber-400 mt-3">
                Selecciona al menos un objetivo para continuar.
              </p>
            )}

            {/* Navigation - área táctil mínima 44px para tablet/móvil (touch-action evita delay y conflictos con slider) */}
            <div className="flex justify-between items-stretch gap-3 mt-6 sm:mt-8 touch-manipulation">
              <div className="flex items-center min-h-[48px]">
                {currentStep > 0 ? (
                  <button
                    type="button"
                    onClick={handlePrevious}
                    className="flex items-center justify-center space-x-1.5 sm:space-x-2 text-gray-600 dark:text-white/60 hover:text-gray-900 dark:hover:text-white active:opacity-80 transition-colors text-sm sm:text-base min-h-[48px] min-w-[120px] sm:min-w-[140px] py-2.5 px-4 rounded-xl touch-manipulation select-none border border-transparent hover:border-gray-300 dark:hover:border-white/20"
                    style={{ touchAction: 'manipulation' }}
                  >
                    <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                    <span>Anterior</span>
                  </button>
                ) : (
                  <span
                    className="min-w-[120px] sm:min-w-[140px] block"
                    aria-hidden
                  />
                )}
              </div>

              <button
                type="button"
                onClick={handleNext}
                disabled={
                  isUpdating ||
                  (currentStep === 0 && cedulaAlreadyLinked) ||
                  (currentStep === 5 && profile.goals.length === 0)
                }
                className="bg-[#85ea10] hover:bg-[#7dd30f] disabled:bg-[#85ea10]/70 disabled:cursor-not-allowed text-black font-bold text-sm sm:text-base px-5 sm:px-8 min-h-[48px] py-2.5 sm:py-3 rounded-xl transition-all duration-300 flex items-center justify-center space-x-1.5 sm:space-x-2 touch-manipulation select-none"
                style={{ touchAction: 'manipulation' }}
              >
                {isUpdating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-black"></div>
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <span>
                      {currentStep === steps.length - 1
                        ? 'Finalizar'
                        : 'Siguiente'}
                    </span>
                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
