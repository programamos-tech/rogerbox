'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { User as UserIcon, Mail, Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import QuickLoading from '@/components/QuickLoading';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isLoading, setIsLoading] = useState(false);
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const motivationalQuotes = [
    "Cada repetición te acerca a tu meta",
    "Tu cuerpo puede hacerlo, tu mente debe creerlo",
    "La disciplina es el puente entre metas y logros"
  ];

      // Animación de frases
      useEffect(() => {
        const interval = setInterval(() => {
          // Iniciar animación de salida
          setIsAnimating(true);
          
          // Después de 1.5s (duración de fadeOut), cambiar la frase
          setTimeout(() => {
            setCurrentQuoteIndex((prevIndex) => 
              (prevIndex + 1) % motivationalQuotes.length
            );
            setIsAnimating(false);
          }, 1500);
        }, 2000); // Cambia cada 2 segundos

        return () => clearInterval(interval);
      }, []);

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'El nombre debe tener al menos 2 caracteres';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'El email no es válido';
    }

    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida';
    } else if (formData.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirma tu contraseña';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    
    try {
      // Registrar usuario en Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
          }
        }
      });

      if (authError) {
        console.error('Error en registro:', authError);
        
        // Manejar diferentes tipos de errores
        if (authError.message.includes('User already registered')) {
          setErrors({ general: 'Ya estás registrado con ese correo, inicia sesión.' });
        } else if (authError.message.includes('Invalid email')) {
          setErrors({ general: 'El email no es válido. Verifica el formato.' });
        } else if (authError.message.includes('Password should be at least')) {
          setErrors({ general: 'La contraseña debe tener al menos 6 caracteres.' });
        } else {
          setErrors({ general: 'Error al crear la cuenta. Inténtalo de nuevo.' });
        }
        
        setIsLoading(false);
        return;
      }

      if (authData.user) {
        console.log('Usuario registrado exitosamente, iniciando sesión...');
        
        // Iniciar sesión automáticamente con NextAuth
        const result = await signIn('credentials', {
          email: formData.email,
          password: formData.password,
          redirect: false
        });

        if (result?.ok) {
          console.log('Sesión iniciada, redirigiendo...');
          // Si hay callbackUrl, ir directamente allí, sino al onboarding
          router.push(callbackUrl !== '/dashboard' ? callbackUrl : '/onboarding');
        } else {
          console.error('Error iniciando sesión:', result?.error);
          setErrors({ general: 'Usuario registrado pero error al iniciar sesión. Intenta iniciar sesión manualmente.' });
        }
      }
    } catch (error) {
      console.error('Error inesperado:', error);
      setErrors({ general: 'Error inesperado. Inténtalo de nuevo.' });
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Limpiar error cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <>
      <style jsx>{`
        @keyframes fadeIn {
          0% {
            opacity: 0;
            transform: translateY(20px);
          }
          30% {
            opacity: 0;
            transform: translateY(20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fadeOut {
          0% {
            opacity: 1;
            transform: translateY(0);
          }
          70% {
            opacity: 1;
            transform: translateY(0);
          }
          100% {
            opacity: 0;
            transform: translateY(-20px);
          }
        }
        .animate-fade-in {
          animation: fadeIn 1.5s ease-in-out;
        }
        .animate-fade-out {
          animation: fadeOut 1.5s ease-in-out;
        }
      `}</style>
      <div className="min-h-screen flex">
      {/* Left Side - Full Height Green */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#85ea10] items-center justify-center">
        <div className="text-center text-white">
            <h1 className="text-6xl font-black mb-8 tracking-tight uppercase">
              <span className="text-gray-900 font-black">ROGER</span><span className="text-white font-black">BOX</span>
            </h1>
               <div className="relative h-16 mb-8 overflow-hidden">
                 <div 
                   key={currentQuoteIndex}
                   className={`absolute inset-0 flex items-center justify-center text-xl font-medium opacity-90 ${
                     isAnimating ? 'animate-fade-out' : 'animate-fade-in'
                   }`}
                 >
                   "{motivationalQuotes[currentQuoteIndex]}"
                 </div>
               </div>
          <div className="flex justify-center space-x-2">
            <div className="w-3 h-3 bg-white rounded-full animate-bounce"></div>
            <div className="w-3 h-3 bg-white rounded-full animate-bounce delay-200"></div>
            <div className="w-3 h-3 bg-white rounded-full animate-bounce delay-400"></div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="w-full max-w-md">

          {/* Form Container */}
          <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-2xl">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2 uppercase tracking-tight">
                ÚNETE A <span className="text-gray-900 dark:text-white font-black">ROGER</span><span className="text-[#85ea10] font-black">BOX</span>
              </h1>
              <p className="text-gray-600 dark:text-white text-lg">
                Crea tu cuenta y comienza tu transformación
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
                   {/* Error General */}
                   {errors.general && (
                     <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                       <p className="text-red-600 dark:text-red-400 text-sm font-medium">
                         {errors.general}
                       </p>
                     </div>
                   )}

              {/* Name Field */}
              <div>
              <label className="block text-gray-900 dark:text-white font-bold text-sm mb-2">
                NOMBRE COMPLETO
              </label>
              <div className="relative">
                <UserIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-black/60 border rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-all ${
                    errors.name 
                      ? 'border-red-500 focus:ring-red-500' 
                      : 'border-gray-200 dark:border-white/30 focus:ring-[#85ea10] focus:border-[#85ea10]'
                  }`}
                  placeholder="Tu nombre completo"
                />
              </div>
              {errors.name && (
                <p className="text-red-400 text-sm mt-1 flex items-center">
                  <span className="w-1 h-1 bg-red-400 rounded-full mr-2"></span>
                  {errors.name}
                </p>
              )}
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-gray-900 dark:text-white font-bold text-sm mb-2">
                CORREO ELECTRÓNICO
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-black/60 border rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-all ${
                    errors.email 
                      ? 'border-red-500 focus:ring-red-500' 
                      : 'border-gray-200 dark:border-white/30 focus:ring-[#85ea10] focus:border-[#85ea10]'
                  }`}
                  placeholder="tu@email.com"
                />
              </div>
              {errors.email && (
                <p className="text-red-400 text-sm mt-1 flex items-center">
                  <span className="w-1 h-1 bg-red-400 rounded-full mr-2"></span>
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-gray-900 dark:text-white font-bold text-sm mb-2">
                CONTRASEÑA
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className={`w-full pl-12 pr-12 py-4 bg-gray-50 dark:bg-black/60 border rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-all ${
                    errors.password 
                      ? 'border-red-500 focus:ring-red-500' 
                      : 'border-gray-200 dark:border-white/30 focus:ring-[#85ea10] focus:border-[#85ea10]'
                  }`}
                  placeholder="Mínimo 6 caracteres"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-400 text-sm mt-1 flex items-center">
                  <span className="w-1 h-1 bg-red-400 rounded-full mr-2"></span>
                  {errors.password}
                </p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label className="block text-gray-900 dark:text-white font-bold text-sm mb-2">
                CONFIRMAR CONTRASEÑA
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  className={`w-full pl-12 pr-12 py-4 bg-gray-50 dark:bg-black/60 border rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-all ${
                    errors.confirmPassword 
                      ? 'border-red-500 focus:ring-red-500' 
                      : 'border-gray-200 dark:border-white/30 focus:ring-[#85ea10] focus:border-[#85ea10]'
                  }`}
                  placeholder="Repite tu contraseña"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-red-400 text-sm mt-1 flex items-center">
                  <span className="w-1 h-1 bg-red-400 rounded-full mr-2"></span>
                  {errors.confirmPassword}
                </p>
              )}
            </div>


            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#85ea10] hover:bg-[#7dd30f] disabled:bg-[#85ea10]/50 disabled:opacity-70 text-black font-black py-4 rounded-xl transition-all duration-300 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed flex items-center justify-center space-x-3"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                  <span>CREANDO CUENTA...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  <span>CREAR CUENTA</span>
                </>
              )}
            </button>
            </form>

            {/* Login Link */}
            <div className="text-center mt-6">
              <p className="text-gray-600 dark:text-white">
                ¿Ya tienes cuenta?{' '}
                <button
                  onClick={() => router.push(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`)}
                  className="text-[#85ea10] hover:text-[#7dd30f] font-bold transition-colors"
                >
                  Inicia sesión aquí
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
      </div>
    </>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<QuickLoading />}>
      <RegisterForm />
    </Suspense>
  );
}
