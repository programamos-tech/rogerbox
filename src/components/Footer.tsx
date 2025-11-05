'use client';

import { useRouter } from 'next/navigation';
import { Mail, Phone, MapPin, Lock } from 'lucide-react';

export default function Footer() {
  const router = useRouter();

  return (
    <footer className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 w-full">
      <div className="w-full px-4 md:px-6 lg:px-12 py-6 md:py-8">
        {/* Main Footer Content - Vertical en mobile, horizontal en desktop */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-8 lg:gap-12 mb-6 md:mb-6">
          {/* Brand Section - Column 1 */}
          <div className="text-center md:text-left w-full flex flex-col items-center md:items-start">
            <button
              onClick={() => router.push('/')}
              className="flex items-center justify-center md:justify-start space-x-2 hover:opacity-80 transition-opacity mb-3 md:mb-2"
            >
              <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white uppercase tracking-tight">
                <span className="font-black">ROGER<span className="text-[#85ea10]">BOX</span></span>
              </h3>
            </button>
            <p className="text-gray-600 dark:text-white/70 mb-4 md:mb-4 text-sm md:text-sm leading-relaxed">
              Cambia tu mente, transforma tu cuerpo
            </p>
            
            {/* Contact Info */}
            <div className="space-y-2 md:space-y-2 text-sm md:text-sm text-gray-500 dark:text-white/60 flex flex-col items-center md:items-start">
              <div className="flex items-center justify-center md:justify-start space-x-2">
                <Mail className="w-4 h-4 flex-shrink-0" />
                <span>contacto@rogerbox.com</span>
              </div>
              <div className="flex items-center justify-center md:justify-start space-x-2">
                <Phone className="w-4 h-4 flex-shrink-0" />
                <span>3005009487</span>
              </div>
              <div className="flex items-center justify-center md:justify-start space-x-2">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                <span>Sincelejo, Colombia</span>
              </div>
            </div>
          </div>

          {/* Quick Links - Column 2 */}
            <div className="text-center md:text-left">
            <h4 className="text-base md:text-base font-semibold text-gray-900 dark:text-white mb-3 md:mb-3">
                Enlaces Rápidos
              </h4>
            <div className="space-y-2 md:space-y-2 text-sm md:text-sm">
                <a href="/courses" className="block text-gray-500 dark:text-white/60 hover:text-[#85ea10] transition-colors">
                  Cursos
                </a>
                <a href="/nutritional-plans" className="block text-gray-500 dark:text-white/60 hover:text-[#85ea10] transition-colors">
                  Planes Nutricionales
                </a>
                <a href="/about" className="block text-gray-500 dark:text-white/60 hover:text-[#85ea10] transition-colors">
                  Qué es RogerBox
                </a>
                <a href="/contact" className="block text-gray-500 dark:text-white/60 hover:text-[#85ea10] transition-colors">
                  Contacto
                </a>
              </div>
            </div>

          {/* Social Media - Column 3 */}
            <div className="text-center md:text-left">
            <h4 className="text-base md:text-base font-semibold text-gray-900 dark:text-white mb-3 md:mb-3">
                Síguenos
              </h4>
            <div className="flex flex-col gap-2 md:gap-2">
                <a
                  href="https://instagram.com/rogerbox"
                  target="_blank"
                  rel="noopener noreferrer"
                className="flex items-center justify-center md:justify-start gap-2 text-gray-600 dark:text-gray-400 hover:text-[#85ea10] dark:hover:text-[#85ea10] transition-colors duration-300"
                >
                <svg className="w-4 h-4 md:w-4 md:h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                  </svg>
                  <span className="text-sm md:text-sm font-medium">Instagram</span>
                </a>
                
                <a
                  href="https://youtube.com/@rogerbox"
                  target="_blank"
                  rel="noopener noreferrer"
                className="flex items-center justify-center md:justify-start gap-2 text-gray-600 dark:text-gray-400 hover:text-[#85ea10] dark:hover:text-[#85ea10] transition-colors duration-300"
                >
                <svg className="w-4 h-4 md:w-4 md:h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/>
                    <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/>
                  </svg>
                  <span className="text-sm md:text-sm font-medium">YouTube</span>
                </a>
                
                <a
                  href="https://tiktok.com/@rogerbox"
                  target="_blank"
                  rel="noopener noreferrer"
                className="flex items-center justify-center md:justify-start gap-2 text-gray-600 dark:text-gray-400 hover:text-[#85ea10] dark:hover:text-[#85ea10] transition-colors duration-300"
                >
                <svg className="w-4 h-4 md:w-4 md:h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                  </svg>
                  <span className="text-sm md:text-sm font-medium">TikTok</span>
                </a>
                
                <a
                  href="https://linkedin.com/company/rogerbox"
                  target="_blank"
                  rel="noopener noreferrer"
                className="flex items-center justify-center md:justify-start gap-2 text-gray-600 dark:text-gray-400 hover:text-[#85ea10] dark:hover:text-[#85ea10] transition-colors duration-300"
                >
                <svg className="w-4 h-4 md:w-4 md:h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
                    <rect width="4" height="12" x="2" y="9"/>
                    <circle cx="4" cy="4" r="2"/>
                  </svg>
                  <span className="text-sm md:text-sm font-medium">LinkedIn</span>
                </a>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4 md:pt-4">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 md:gap-0">
            {/* Copyright - Left */}
            <div className="text-center md:text-left">
              <p className="text-xs md:text-sm text-gray-500 dark:text-white/60 leading-relaxed">
                © 2025 RogerBox. Todos los derechos reservados.
              </p>
              <p className="text-xs md:text-sm text-gray-500 dark:text-white/60 mt-1">
                Plataforma de fitness y bienestar integral
              </p>
            </div>
            
            {/* Legal Links - Center */}
            <div className="flex flex-wrap justify-center md:justify-center gap-x-4 gap-y-2 md:gap-x-6 text-xs md:text-sm text-gray-500 dark:text-white/60">
              <a href="/terms" className="hover:text-[#85ea10] transition-colors whitespace-nowrap">Términos</a>
              <a href="/privacy" className="hover:text-[#85ea10] transition-colors whitespace-nowrap">Privacidad</a>
              <a href="/cookies" className="hover:text-[#85ea10] transition-colors whitespace-nowrap">Cookies</a>
              <a href="/contact" className="hover:text-[#85ea10] transition-colors whitespace-nowrap">Contacto</a>
            </div>
            
            {/* Secure Payments - Right */}
            <div className="flex items-center justify-center md:justify-end gap-2 text-xs md:text-sm text-gray-500 dark:text-white/60">
              <Lock className="w-4 h-4 flex-shrink-0" />
              <span>Pagos seguros</span>
              <span className="text-gray-400 dark:text-white/40">•</span>
              <span>Powered by <span className="font-semibold">Wompi</span></span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
