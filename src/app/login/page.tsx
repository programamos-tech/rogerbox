'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, LogIn } from 'lucide-react';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import QuickLoading from '@/components/QuickLoading';
import Image from 'next/image';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  const errorParam = searchParams.get('error');
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isLoading, setIsLoading] = useState(false);
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const { signInWithGoogle, signInWithEmail, isAuthenticated } = useSupabaseAuth();

  const motivationalQuotes = [
    "Tu única competencia eres tú mismo",
    "El dolor de hoy es la fuerza de mañana",
    "No cuentes los días, haz que los días cuenten"
  ];

  // Animación de frases
  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentQuoteIndex((prevIndex) => 
          (prevIndex + 1) % motivationalQuotes.length
        );
        setIsAnimating(false);
      }, 1500);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Redirigir si ya está autenticado
  useEffect(() => {
    if (isAuthenticated) {
      router.push(callbackUrl);
    }
  }, [isAuthenticated, callbackUrl, router]);

  // Mostrar error del callback si existe
  useEffect(() => {
    if (errorParam === 'callback_error') {
      setErrors({ general: 'Error al completar la autenticación. Intenta de nuevo.' });
    }
  }, [errorParam]);

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'El email no es válido';
    }

    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    const { error } = await signInWithGoogle();
    
    if (error) {
      setErrors({ general: 'Error al iniciar sesión con Google. Intenta de nuevo.' });
      setIsLoading(false);
    }
    // No quitamos isLoading aquí porque vamos a ser redirigidos
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    
    const { error } = await signInWithEmail(formData.email, formData.password);
    
    if (error) {
      console.error('Error en login:', error);
      console.error('Error details:', {
        message: error.message,
        status: 'status' in error ? error.status : undefined,
        name: error.name
      });
      
      if (error.message.includes('Invalid login credentials') || error.message.includes('Invalid credentials')) {
        setErrors({ general: 'Credenciales incorrectas. Verifica tu email y contraseña.' });
      } else if (error.message.includes('Email not confirmed')) {
        setErrors({ general: 'Por favor confirma tu email antes de iniciar sesión.' });
      } else {
        setErrors({ general: error.message || 'Error al iniciar sesión. Inténtalo de nuevo.' });
      }
      
      setIsLoading(false);
      return;
    }

    // La redirección se maneja en el useEffect de isAuthenticated
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    if (errors.general) {
      setErrors(prev => ({ ...prev, general: '' }));
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
                  BIENVENIDO A <span className="text-gray-900 dark:text-white font-black">ROGER</span><span className="text-[#85ea10] font-black">BOX</span>
                </h1>
                <p className="text-gray-600 dark:text-white text-lg">
                  Inicia sesión para continuar
                </p>
              </div>

              {/* Error General */}
              {errors.general && (
                <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <p className="text-red-600 dark:text-red-400 text-sm font-medium">
                    {errors.general}
                  </p>
                </div>
              )}

              {/* Google Sign In Button - DESACTIVADO TEMPORALMENTE */}
              {/*
              <button
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full mb-6 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 hover:border-[#85ea10] dark:hover:border-[#85ea10] text-gray-700 dark:text-white font-bold py-4 rounded-xl transition-all duration-300 flex items-center justify-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>Continuar con Google</span>
              </button>
              */}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
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

                {/* Forgot Password Link */}
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => router.push('/reset-password')}
                    className="text-[#85ea10] hover:text-[#7dd30f] text-sm font-medium transition-colors"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
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
                      <span>INICIANDO SESIÓN...</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="w-5 h-5" />
                      <span>INICIAR SESIÓN</span>
                    </>
                  )}
                </button>
              </form>

              {/* Register Link */}
              <div className="text-center mt-6">
                <p className="text-gray-600 dark:text-white">
                  ¿No tienes cuenta?{' '}
                  <button
                    onClick={() => router.push(`/register?callbackUrl=${encodeURIComponent(callbackUrl)}`)}
                    className="text-[#85ea10] hover:text-[#7dd30f] font-bold transition-colors"
                  >
                    Regístrate aquí
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

export default function LoginPage() {
  return (
    <Suspense fallback={<QuickLoading />}>
      <LoginForm />
    </Suspense>
  );
}
