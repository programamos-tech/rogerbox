'use client';

import { AlertCircle, ArrowLeft, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isValidToken, setIsValidToken] = useState(false);

  useEffect(() => {
    // Verificar si hay un token válido en la URL
    const accessToken = searchParams.get('access_token');
    const refreshToken = searchParams.get('refresh_token');

    if (accessToken && refreshToken) {
      setIsValidToken(true);
    } else {
      setError(
        'Enlace inválido o expirado. Por favor, solicita un nuevo enlace de recuperación.',
      );
    }
  }, [searchParams]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password) {
      setError('La contraseña es requerida');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setIsResetting(true);
    setError('');

    try {
      // Importar supabase dinámicamente
      const { supabase } = await import('@/lib/supabase');

      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        setError(
          'Error al actualizar la contraseña. Por favor, intenta nuevamente.',
        );
        return;
      }

      setSuccess(true);
    } catch (_error) {
      setError('Error inesperado. Por favor, intenta nuevamente.');
    } finally {
      setIsResetting(false);
    }
  };

  const handleBackToLogin = () => {
    router.push('/');
  };

  if (!isValidToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <div className="fixed inset-0 bg-gradient-to-r from-[#164151]/80 via-[#29839c]/70 to-[#164151]/60 backdrop-blur-sm z-0"></div>

        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="w-full max-w-md p-8">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-black text-white mb-4">
                ENLACE INVÁLIDO
              </h1>
              <p className="text-lg text-white/80 mb-6">
                Este enlace no es válido o ha expirado
              </p>
            </div>

            <div className="mb-6 p-4 bg-red-500/10 border border-red-400/30 rounded-xl backdrop-blur-sm">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-red-200 text-sm">{error}</p>
              </div>
            </div>

            <button
              onClick={handleBackToLogin}
              className="w-full bg-[#85ea10] hover:bg-[#7dd30f] text-black font-black py-4 rounded-xl transition-all duration-300 transform hover:scale-105 text-xl flex items-center justify-center space-x-3"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Volver al Login</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <div className="fixed inset-0 bg-gradient-to-r from-[#164151]/80 via-[#29839c]/70 to-[#164151]/60 backdrop-blur-sm z-0"></div>

      <div className="relative z-10">
        {/* Header */}
        <header className="bg-transparent">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-20">
              {/* Logo */}
              <div className="flex items-center space-x-3">
                <h1 className="text-3xl font-bold text-white">
                  ROGER
                  <span className="text-[#85ea10]">BOX</span>
                </h1>
              </div>

              {/* Back Button */}
              <button
                onClick={handleBackToLogin}
                className="flex items-center space-x-2 text-white/60 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Volver al Login</span>
              </button>
            </div>
          </div>
        </header>

        {/* Reset Password Section */}
        <section className="relative min-h-screen flex items-center">
          <div className="relative z-10 w-full">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-center items-center min-h-screen py-20">
                {/* Reset Password Form Container */}
                <div className="w-full max-w-md">
                  <div className="text-center mb-8">
                    <h1 className="text-4xl font-black text-white mb-4">
                      NUEVA CONTRASEÑA
                    </h1>
                    <p className="text-lg text-white/80 mb-6">
                      Ingresa tu nueva contraseña
                    </p>
                  </div>

                  {/* Success Message */}
                  {success && (
                    <div className="mb-6 p-4 bg-green-500/10 border border-green-400/30 rounded-xl backdrop-blur-sm">
                      <div className="flex items-start space-x-3">
                        <div className="w-5 h-5 bg-green-400 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <CheckCircle className="w-3 h-3 text-green-900" />
                        </div>
                        <div className="flex-1">
                          <p className="text-green-200 text-sm leading-relaxed">
                            ¡Contraseña actualizada exitosamente! Ya puedes
                            iniciar sesión con tu nueva contraseña.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Error Message */}
                  {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-400/30 rounded-xl backdrop-blur-sm">
                      <div className="flex items-start space-x-3">
                        <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                        <p className="text-red-200 text-sm">{error}</p>
                      </div>
                    </div>
                  )}

                  {/* Reset Password Form */}
                  {!success ? (
                    <form onSubmit={handleResetPassword} className="space-y-6">
                      <div>
                        <label className="block text-white font-bold text-sm mb-2">
                          NUEVA CONTRASEÑA
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-4 pr-12 bg-black/60 border border-white/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#85ea10] focus:border-[#85ea10] transition-all"
                            placeholder="Mínimo 6 caracteres"
                            disabled={isResetting}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                            disabled={isResetting}
                          >
                            {showPassword ? (
                              <EyeOff className="w-5 h-5" />
                            ) : (
                              <Eye className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-white font-bold text-sm mb-2">
                          CONFIRMAR CONTRASEÑA
                        </label>
                        <div className="relative">
                          <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full px-4 py-4 pr-12 bg-black/60 border border-white/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#85ea10] focus:border-[#85ea10] transition-all"
                            placeholder="Repite tu nueva contraseña"
                            disabled={isResetting}
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setShowConfirmPassword(!showConfirmPassword)
                            }
                            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                            disabled={isResetting}
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="w-5 h-5" />
                            ) : (
                              <Eye className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isResetting}
                        className="w-full bg-[#85ea10] hover:bg-[#7dd30f] disabled:bg-gray-600 text-black font-black py-4 rounded-xl transition-all duration-300 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed text-xl flex items-center justify-center space-x-3"
                      >
                        {isResetting ? (
                          <>
                            <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                            <span>ACTUALIZANDO...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-5 h-5" />
                            <span>ACTUALIZAR CONTRASEÑA</span>
                          </>
                        )}
                      </button>
                    </form>
                  ) : (
                    <div className="text-center">
                      <button
                        onClick={handleBackToLogin}
                        className="w-full bg-[#85ea10] hover:bg-[#7dd30f] text-black font-black py-4 rounded-xl transition-all duration-300 transform hover:scale-105 text-xl flex items-center justify-center space-x-3"
                      >
                        <CheckCircle className="w-5 h-5" />
                        <span>IR AL LOGIN</span>
                      </button>
                    </div>
                  )}

                  {/* Trust Indicators */}
                  <div className="mt-6 text-center">
                    <p className="text-white/60 text-sm">
                      Tu contraseña debe tener al menos 6 caracteres
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black text-white flex items-center justify-center">
          Cargando...
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
