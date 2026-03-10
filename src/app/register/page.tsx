'use client';

import {
  CheckCircle,
  Eye,
  EyeOff,
  Lock,
  Mail,
  User as UserIcon,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import QuickLoading from '@/components/QuickLoading';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [acceptPolicies, setAcceptPolicies] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const { signInWithGoogle, signUpWithEmail, isAuthenticated } =
    useSupabaseAuth();

  const motivationalQuotes = [
    'Cada repetición te acerca a tu meta',
    'Tu cuerpo puede hacerlo, tu mente debe creerlo',
    'La disciplina es el puente entre metas y logros',
  ];

  // Animación de frases
  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentQuoteIndex(
          (prevIndex) => (prevIndex + 1) % motivationalQuotes.length,
        );
        setIsAnimating(false);
      }, 1500);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Redirigir si ya está autenticado
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/onboarding');
    }
  }, [isAuthenticated, router]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

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

    if (!acceptPolicies) {
      newErrors.policies =
        'Debes aceptar la política de privacidad y los términos de uso';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    const { error } = await signInWithGoogle();

    if (error) {
      setErrors({
        general: 'Error al registrarse con Google. Intenta de nuevo.',
      });
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

    const { error } = await signUpWithEmail(
      formData.email,
      formData.password,
      formData.name,
    );

    if (error) {
      if (error.message.includes('User already registered')) {
        setErrors({
          general: 'Ya estás registrado con ese correo, inicia sesión.',
        });
      } else if (error.message.includes('Invalid email')) {
        setErrors({ general: 'El email no es válido. Verifica el formato.' });
      } else if (error.message.includes('Password should be at least')) {
        setErrors({
          general: 'La contraseña debe tener al menos 6 caracteres.',
        });
      } else {
        setErrors({
          general:
            error.message || 'Error al crear la cuenta. Inténtalo de nuevo.',
        });
      }

      setIsLoading(false);
      return;
    }

    // La redirección se maneja en el useEffect de isAuthenticated
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
    if (errors.general) {
      setErrors((prev) => ({ ...prev, general: '' }));
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
        {/* Left Side - imagen de entrenamiento con overlay y un solo logo */}
        <div className="hidden lg:flex lg:w-1/2 min-h-screen relative items-center justify-center overflow-hidden">
          <Image
            src="/images/curso1.jpeg"
            alt=""
            fill
            className="object-cover object-[50%_35%]"
            priority
            sizes="50vw"
          />
          <div className="absolute inset-0 bg-[#0a1628]/80" />
          <div className="relative z-10 text-center px-10 max-w-md">
            <h1 className="text-4xl font-black tracking-tight uppercase mb-6 text-white [text-shadow:none]">
              <span className="text-white">ROGER</span>
              <span className="text-[#85ea10]">BOX</span>
            </h1>
            <div className="relative h-14 mb-6 overflow-hidden">
              <div
                key={currentQuoteIndex}
                className={`absolute inset-0 flex items-center justify-center text-sm font-normal text-white/85 leading-relaxed ${
                  isAnimating ? 'animate-fade-out' : 'animate-fade-in'
                }`}
              >
                "{motivationalQuotes[currentQuoteIndex]}"
              </div>
            </div>
            <div className="flex justify-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce" />
              <div className="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce delay-200" />
              <div className="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce delay-400" />
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="w-full lg:w-1/2 bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            {/* Form Container */}
            <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-2xl">
              {/* Header - un solo logo en la izquierda; aquí solo título */}
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Crea tu cuenta
                </h2>
                <p className="text-gray-600 dark:text-gray-400 text-base">
                  Comienza tu transformación con HIIT
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
                      onChange={(e) =>
                        handleInputChange('name', e.target.value)
                      }
                      className={`w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-black/60 border rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-all ${
                        errors.name
                          ? 'border-red-500 focus:ring-red-500'
                          : 'border-gray-200 dark:border-white/30 focus:ring-2 focus:ring-white/20 focus:border-white/50'
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
                      onChange={(e) =>
                        handleInputChange('email', e.target.value)
                      }
                      className={`w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-black/60 border rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-all ${
                        errors.email
                          ? 'border-red-500 focus:ring-red-500'
                          : 'border-gray-200 dark:border-white/30 focus:ring-2 focus:ring-white/20 focus:border-white/50'
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
                      onChange={(e) =>
                        handleInputChange('password', e.target.value)
                      }
                      className={`w-full pl-12 pr-12 py-4 bg-gray-50 dark:bg-black/60 border rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-all ${
                        errors.password
                          ? 'border-red-500 focus:ring-red-500'
                          : 'border-gray-200 dark:border-white/30 focus:ring-2 focus:ring-white/20 focus:border-white/50'
                      }`}
                      placeholder="Mínimo 6 caracteres"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
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
                      onChange={(e) =>
                        handleInputChange('confirmPassword', e.target.value)
                      }
                      className={`w-full pl-12 pr-12 py-4 bg-gray-50 dark:bg-black/60 border rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-all ${
                        errors.confirmPassword
                          ? 'border-red-500 focus:ring-red-500'
                          : 'border-gray-200 dark:border-white/30 focus:ring-2 focus:ring-white/20 focus:border-white/50'
                      }`}
                      placeholder="Repite tu contraseña"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-red-400 text-sm mt-1 flex items-center">
                      <span className="w-1 h-1 bg-red-400 rounded-full mr-2"></span>
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>

                {/* Políticas y términos */}
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="accept-policies"
                    checked={acceptPolicies}
                    onChange={(e) => setAcceptPolicies(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded border-gray-300 dark:border-white/40 bg-gray-50 dark:bg-black/60 accent-[#85ea10] focus:ring-2 focus:ring-[#85ea10]/30 focus:ring-offset-0"
                  />
                  <label
                    htmlFor="accept-policies"
                    className="text-sm text-gray-700 dark:text-white/90 cursor-pointer"
                  >
                    Acepto la{' '}
                    <Link
                      href="/privacidad"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-900 dark:text-white font-medium underline underline-offset-2 hover:opacity-80"
                    >
                      política de privacidad de datos
                    </Link>{' '}
                    y los{' '}
                    <Link
                      href="/terminos"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-900 dark:text-white font-medium underline underline-offset-2 hover:opacity-80"
                    >
                      términos de uso
                    </Link>
                  </label>
                </div>
                {errors.policies && (
                  <p className="text-red-400 text-sm flex items-center -mt-2">
                    <span className="w-1 h-1 bg-red-400 rounded-full mr-2"></span>
                    {errors.policies}
                  </p>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-white hover:bg-gray-100 dark:bg-white/95 dark:hover:bg-white text-gray-900 font-semibold py-4 rounded-lg border border-gray-200 dark:border-white/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3 shadow-sm"
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

              {/* Login Link - si ya tienes cuenta */}
              <div className="text-center mt-6">
                <p className="text-gray-600 dark:text-white/80 text-sm">
                  ¿Ya tienes cuenta?{' '}
                  <button
                    type="button"
                    onClick={() =>
                      router.push(
                        `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`,
                      )
                    }
                    className="text-gray-900 dark:text-white/80 hover:text-gray-700 dark:hover:text-white font-medium underline underline-offset-2 transition-colors"
                  >
                    Inicia sesión
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
