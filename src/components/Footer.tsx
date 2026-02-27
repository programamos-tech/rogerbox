'use client';

import { useRouter } from 'next/navigation';
import { Mail, Phone, MapPin, Lock } from 'lucide-react';

export default function Footer() {
  const router = useRouter();

  return (
    <footer className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 w-full">
      {/* Mobile Footer - Compacto y minimalista */}
      <div className="md:hidden px-4 py-4">
        <div className="flex flex-col items-center gap-3">
          {/* Logo */}
          <button onClick={() => router.push('/')} className="hover:opacity-80 transition-opacity">
            <span className="text-sm font-black text-gray-900 dark:text-white">
              ROGER<span className="text-[#85ea10]">BOX</span>
            </span>
          </button>
          
          {/* Social Icons - Solo iconos */}
          <div className="flex items-center gap-4">
            <a href="https://instagram.com/rogerbox" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#85ea10] transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
              </svg>
            </a>
            <a href="https://youtube.com/@rogerbox" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#85ea10] transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/>
                <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/>
              </svg>
            </a>
            <a href="https://tiktok.com/@rogerbox" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#85ea10] transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
              </svg>
            </a>
          </div>
          
          {/* Copyright y links */}
          <div className="flex items-center gap-3 text-[10px] text-gray-400">
            <span>© 2025 RogerBox</span>
            <span>•</span>
            <a href="/terms" className="hover:text-[#85ea10]">Términos</a>
            <span>•</span>
            <a href="/privacy" className="hover:text-[#85ea10]">Privacidad</a>
          </div>
        </div>
      </div>

      {/* Desktop Footer - Completo */}
      <div className="hidden md:block w-full px-6 lg:px-12 py-8">
        <div className="grid grid-cols-3 gap-8 lg:gap-12 mb-6">
          {/* Brand Section */}
          <div className="text-left">
            <button onClick={() => router.push('/')} className="hover:opacity-80 transition-opacity mb-2">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white uppercase tracking-tight">
                <span className="font-black">ROGER<span className="text-[#85ea10]">BOX</span></span>
              </h3>
            </button>
            <p className="text-gray-600 dark:text-white/70 mb-4 text-sm leading-relaxed">
              Cambia tu mente, transforma tu cuerpo
            </p>
            
            <div className="space-y-2 text-sm text-gray-500 dark:text-white/60">
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 flex-shrink-0" />
                <span>contacto@rogerbox.com</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4 flex-shrink-0" />
                <span>3005009487</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                <span>Sincelejo, Colombia</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="text-left">
            <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-3">
              Enlaces Rápidos
            </h4>
            <div className="space-y-2 text-sm">
              <a href="/courses" className="block text-gray-500 dark:text-white/60 hover:text-[#85ea10] transition-colors">Cursos</a>
              <a href="/nutritional-plans" className="block text-gray-500 dark:text-white/60 hover:text-[#85ea10] transition-colors">Planes Nutricionales</a>
              <a href="/about" className="block text-gray-500 dark:text-white/60 hover:text-[#85ea10] transition-colors">Qué es RogerBox</a>
              <a href="/contact" className="block text-gray-500 dark:text-white/60 hover:text-[#85ea10] transition-colors">Contacto</a>
            </div>
          </div>

          {/* Social Media */}
          <div className="text-left">
            <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-3">Síguenos</h4>
            <div className="flex flex-col gap-2">
              <a href="https://instagram.com/rogerbox" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-[#85ea10] transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                </svg>
                <span className="text-sm font-medium">Instagram</span>
              </a>
              <a href="https://youtube.com/@rogerbox" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-[#85ea10] transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/>
                  <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/>
                </svg>
                <span className="text-sm font-medium">YouTube</span>
              </a>
              <a href="https://tiktok.com/@rogerbox" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-[#85ea10] transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                </svg>
                <span className="text-sm font-medium">TikTok</span>
              </a>
              <a href="https://linkedin.com/company/rogerbox" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-[#85ea10] transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
                  <rect width="4" height="12" x="2" y="9"/>
                  <circle cx="4" cy="4" r="2"/>
                </svg>
                <span className="text-sm font-medium">LinkedIn</span>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500 dark:text-white/60">© 2025 RogerBox. Todos los derechos reservados.</p>
              <p className="text-sm text-gray-500 dark:text-white/60 mt-1">Plataforma de fitness y bienestar integral</p>
            </div>
            
            <div className="flex gap-6 text-sm text-gray-500 dark:text-white/60">
              <a href="/terms" className="hover:text-[#85ea10] transition-colors">Términos</a>
              <a href="/privacy" className="hover:text-[#85ea10] transition-colors">Privacidad</a>
              <a href="/cookies" className="hover:text-[#85ea10] transition-colors">Cookies</a>
              <a href="/contact" className="hover:text-[#85ea10] transition-colors">Contacto</a>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-white/60">
              <Lock className="w-4 h-4" />
              <span>Pagos seguros</span>
              <span className="text-gray-400">•</span>
              <span>Powered by <span className="font-semibold">Wompi</span></span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
