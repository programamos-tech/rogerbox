'use client';

import { useRouter } from 'next/navigation';
import { MapPin, Calendar } from 'lucide-react';
import Footer from '@/components/Footer';

export default function AboutPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-[#164151]/80 dark:via-[#29839c]/70 dark:to-[#29839c]/60">
      {/* Header */}
      <header className="bg-transparent border-b border-gray-200 dark:border-white/20 sticky top-0 z-50 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => router.push('/')}
                className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
              >
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  ROGER<span className="text-[#85ea10]">BOX</span>
                </h1>
              </button>
            </div>
            
            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <a href="/#cursos" className="text-gray-600 dark:text-white/80 hover:text-gray-900 dark:hover:text-white transition-colors">Cursos</a>
              <a href="/about" className="text-[#85ea10] font-semibold">Qué es RogerBox</a>
              <a href="/enterprises" className="text-gray-600 dark:text-white/80 hover:text-gray-900 dark:hover:text-white transition-colors">Servicio para Empresas</a>
              <a href="/contact" className="text-gray-600 dark:text-white/80 hover:text-gray-900 dark:hover:text-white transition-colors">Contacto</a>
            </nav>

            {/* Auth Buttons */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/login')}
                className="text-gray-600 dark:text-white/80 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Iniciar Sesión
              </button>
              <button
                onClick={() => router.push('/register')}
                className="bg-[#85ea10] hover:bg-[#7dd30f] text-black font-bold px-6 py-3 rounded-xl transition-all duration-300"
              >
                Registrarse
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              ¿Quién es <span className="text-[#85ea10]">RogerBox</span>?
            </h1>
            <p className="text-xl text-gray-600 dark:text-white/80 max-w-4xl mx-auto leading-relaxed">
              Una historia de pasión, dedicación y transformación que comenzó en Sincelejo y ha cambiado miles de vidas
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-20">
            {/* Content */}
            <div className="space-y-8">
              <div>
                <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
                  Nuestra Historia
                </h2>
                <p className="text-lg text-gray-600 dark:text-white/80 leading-relaxed mb-6">
                  RogerBox nació en <strong className="text-[#85ea10]">Sincelejo en 2019</strong> de la visión y pasión de 
                  <strong className="text-gray-900 dark:text-white"> Roger Barreto</strong>, un licenciado en Educación Física 
                  con más de una década de experiencia transformando vidas a través del fitness.
                </p>
                <p className="text-lg text-gray-600 dark:text-white/80 leading-relaxed">
                  Lo que comenzó como un sueño de ayudar a las personas a transformar sus cuerpos, se convirtió en un movimiento 
                  que ha impactado positivamente a más de 1000 personas en Colombia y más allá.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
                  <div className="flex items-center space-x-3 mb-4">
                    <MapPin className="w-6 h-6 text-[#85ea10]" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Ubicación</h3>
                  </div>
                  <p className="text-gray-600 dark:text-white/80">Sincelejo, Sucre</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
                  <div className="flex items-center space-x-3 mb-4">
                    <Calendar className="w-6 h-6 text-[#85ea10]" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Fundación</h3>
                  </div>
                  <p className="text-gray-600 dark:text-white/80">2019</p>
                </div>
              </div>
            </div>

            {/* Image/Visual */}
            <div className="relative">
              <div className="bg-gradient-to-br from-[#85ea10]/20 to-[#7dd30f]/20 rounded-3xl p-8 h-96 flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="w-32 h-32 bg-[#85ea10] rounded-full flex items-center justify-center mx-auto">
                    <span className="text-6xl">💪</span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Roger Barreto
                  </h3>
                  <p className="text-gray-600 dark:text-white/80">
                    Fundador y Director de RogerBox
                  </p>
                  <p className="text-sm text-gray-500 dark:text-white/60">
                    Licenciado en Educación Física
                  </p>
                </div>
              </div>
              
              {/* Floating elements */}
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-[#85ea10] rounded-full opacity-20"></div>
              <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-[#7dd30f] rounded-full opacity-30"></div>
            </div>
          </div>

          {/* Mission and Values */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
            <div className="text-center">
              <div className="w-16 h-16 bg-[#85ea10] rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl">🏠</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                La Casa de Alta Intensidad
              </h3>
              <p className="text-gray-600 dark:text-white/80 leading-relaxed">
                Roger creó un espacio único donde la alta intensidad se convierte en el camino hacia la transformación física y mental.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-[#85ea10] rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl">🔥</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Enfoque en Quema de Grasa
              </h3>
              <p className="text-gray-600 dark:text-white/80 leading-relaxed">
                Especializados en programas diseñados específicamente para bajar de peso y quemar grasa de manera efectiva y sostenible.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-[#85ea10] rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl">💪</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Transformación Integral
              </h3>
              <p className="text-gray-600 dark:text-white/80 leading-relaxed">
                No solo cambiamos cuerpos, transformamos mentes. Nuestra filosofía: 
                <strong className="text-[#85ea10]"> "Transforma tu cuerpo cambiando tu mente"</strong>.
              </p>
            </div>
          </div>

          {/* Impact Section */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-12 shadow-2xl mb-20">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
                Nuestro Impacto
              </h2>
              <p className="text-xl text-gray-600 dark:text-white/80 max-w-3xl mx-auto">
                Los números hablan por sí solos. Cada estadística representa una vida transformada.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="text-5xl font-bold text-[#85ea10] mb-2">5+</div>
                <div className="text-lg text-gray-600 dark:text-white/80">Años de experiencia</div>
              </div>
              <div className="text-center">
                <div className="text-5xl font-bold text-[#85ea10] mb-2">1000+</div>
                <div className="text-lg text-gray-600 dark:text-white/80">Vidas transformadas</div>
              </div>
              <div className="text-center">
                <div className="text-5xl font-bold text-[#85ea10] mb-2">50+</div>
                <div className="text-lg text-gray-600 dark:text-white/80">Cursos disponibles</div>
              </div>
              <div className="text-center">
                <div className="text-5xl font-bold text-[#85ea10] mb-2">98%</div>
                <div className="text-lg text-gray-600 dark:text-white/80">Satisfacción</div>
              </div>
            </div>
          </div>

          {/* Philosophy Section */}
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">
              Nuestra Filosofía
            </h2>
            <div className="max-w-4xl mx-auto">
              <blockquote className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-8 leading-relaxed">
                "Transforma tu cuerpo cambiando tu mente"
              </blockquote>
              <p className="text-lg text-gray-600 dark:text-white/80 leading-relaxed">
                Creemos que la verdadera transformación comienza desde adentro. No se trata solo de hacer ejercicio, 
                sino de cambiar la mentalidad, desarrollar disciplina y crear hábitos que perduren para toda la vida.
              </p>
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center bg-gradient-to-r from-[#85ea10]/10 to-[#7dd30f]/10 rounded-3xl p-12">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
              ¿Listo para tu Transformación?
            </h2>
            <p className="text-xl text-gray-600 dark:text-white/80 mb-8 max-w-2xl mx-auto">
              Únete a miles de personas que ya han transformado sus vidas con RogerBox
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => router.push('/')}
                className="bg-[#85ea10] hover:bg-[#7dd30f] text-black font-bold px-8 py-4 rounded-xl text-lg transition-all duration-300 hover:scale-105"
              >
                Ver Cursos Disponibles
              </button>
              <button
                onClick={() => router.push('/register')}
                className="border-2 border-[#85ea10] text-[#85ea10] hover:bg-[#85ea10] hover:text-black font-bold px-8 py-4 rounded-xl text-lg transition-all duration-300"
              >
                Comenzar Ahora
              </button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
