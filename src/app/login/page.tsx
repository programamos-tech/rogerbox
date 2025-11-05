'use client';

import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { Mail, Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import QuickLoading from '@/components/QuickLoading';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
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

    if (!formData.email) {
      newErrors.email = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'El email no es válido';
    }

    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida';
    } else if (formData.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
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
    setErrors({});

    try {
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false
      });

      if (result?.error) {
        if (result.error === 'CredentialsSignin') {
          setErrors({ general: 'Email o contraseña incorrectos' });
        } else {
          setErrors({ general: 'Error al iniciar sesión. Inténtalo de nuevo.' });
        }
      } else {
        // Redirigir al callbackUrl o dashboard
        router.push(callbackUrl);
      }
    } catch (error) {
      console.error('Error during login:', error);
      setErrors({ general: 'Error inesperado. Inténtalo de nuevo.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  if (isLoading) {
    return <QuickLoading message="Iniciando sesión..." duration={1000} />;
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Animation */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#85ea10] min-h-screen items-center justify-center relative overflow-hidden">
        <div className="text-center z-10">
          <h1 className="text-6xl font-black text-white tracking-tight mb-8 uppercase">
            <span className="text-gray-900 font-black">ROGER</span><span className="text-white font-black">BOX</span>
          </h1>
          
          <div className="text-white text-lg max-w-md mx-auto mb-8">
            <div 
              className={`transition-all duration-1500 ${
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
                INICIA SESIÓN EN <span className="text-gray-900 dark:text-white font-black">ROGER</span><span className="text-[#85ea10] font-black">BOX</span>
              </h1>
              <p className="text-gray-600 dark:text-white text-lg">
                Accede a tu cuenta y continúa tu transformación
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
                    placeholder="Tu contraseña"
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

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#85ea10] hover:bg-[#7dd30f] text-black font-bold py-4 px-6 rounded-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black"></div>
                    <span>Iniciando sesión...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    <span>INICIAR SESIÓN</span>
                  </>
                )}
              </button>
            </form>

            {/* Additional Links */}
            <div className="mt-8 text-center space-y-4">
              <Link 
                href="/forgot-password" 
                className="text-[#85ea10] hover:text-[#7dd30f] text-sm font-medium transition-colors"
              >
                ¿Olvidaste tu contraseña?
              </Link>
              
              <div className="text-gray-600 dark:text-white/70 text-sm">
                ¿No tienes cuenta?{' '}
                <Link 
                  href={`/register?callbackUrl=${encodeURIComponent(callbackUrl)}`}
                  className="text-[#85ea10] hover:text-[#7dd30f] font-medium transition-colors"
                >
                  Regístrate aquí
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeOut {
          from {
            opacity: 1;
            transform: translateY(0);
          }
          to {
            opacity: 0;
            transform: translateY(-20px);
          }
        }
        
        .animate-fade-in {
          animation: fadeIn 1.5s ease-out;
        }
        
        .animate-fade-out {
          animation: fadeOut 1.5s ease-out;
        }
      `}</style>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<QuickLoading />}>
      <LoginForm />
    </Suspense>
  );
}
