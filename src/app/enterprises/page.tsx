'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Building2, Users, Shield, Award, Clock, CheckCircle, Star, Phone, Mail, MapPin, ChevronRight, Zap, Target, Heart, TrendingUp } from 'lucide-react';
import Footer from '@/components/Footer';

export default function EnterprisesPage() {
  const router = useRouter();

  const benefits = [
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Cumplimiento Legal",
      description: "Cumple con las normativas colombianas de bienestar laboral y pausas activas obligatorias.",
      features: ["Ley 1562 de 2012", "Decreto 1072 de 2015", "Resolución 2404 de 2019"]
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Licencias Corporativas",
      description: "Acceso ilimitado para todos tus empleados con planes escalables según el tamaño de tu empresa.",
      features: ["1-50 empleados", "51-200 empleados", "200+ empleados"]
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: "ROI Medible",
      description: "Reduce el ausentismo laboral y mejora la productividad con métricas detalladas de bienestar.",
      features: ["Reducción 40% ausentismo", "Aumento 25% productividad", "Reportes mensuales"]
    },
    {
      icon: <Heart className="w-8 h-8" />,
      title: "Bienestar Integral",
      description: "Programas completos que incluyen fitness, nutrición y salud mental para tus empleados.",
      features: ["Entrenamientos HIIT", "Consultas nutricionales", "Talleres de mentalidad"]
    }
  ];

  const plans = [
    {
      name: "Básico",
      employees: "1-50 empleados",
      price: "$50.000",
      period: "por empleado/mes",
      features: [
        "Acceso completo a la plataforma",
        "Cursos de pausas activas",
        "Reportes básicos de participación",
        "Soporte por email",
        "Dashboard de administración"
      ],
      popular: false
    },
    {
      name: "Profesional",
      employees: "51-200 empleados",
      price: "$40.000",
      period: "por empleado/mes",
      features: [
        "Todo lo del plan Básico",
        "Entrenamientos personalizados",
        "Consultas nutricionales grupales",
        "Reportes avanzados y analytics",
        "Soporte prioritario",
        "Integración con RRHH"
      ],
      popular: true
    },
    {
      name: "Enterprise",
      employees: "200+ empleados",
      price: "Personalizado",
      period: "consulta con ventas",
      features: [
        "Todo lo del plan Profesional",
        "Entrenador dedicado",
        "Programas personalizados",
        "API de integración",
        "Soporte 24/7",
        "Consultoría de bienestar",
        "Eventos corporativos"
      ],
      popular: false
    }
  ];

  const testimonials = [
    {
      company: "Empresa Manufacturera",
      employees: "150 empleados",
      quote: "Implementamos RogerBox hace 6 meses y hemos visto una reducción del 35% en ausentismo por temas de salud.",
      author: "María González, Gerente de RRHH"
    },
    {
      company: "Centro de Servicios",
      employees: "80 empleados", 
      quote: "Nuestros empleados están más motivados y productivos. La plataforma es fácil de usar y muy completa.",
      author: "Carlos Mendoza, Director General"
    },
    {
      company: "Empresa Tecnológica",
      employees: "300 empleados",
      quote: "El ROI ha sido increíble. En 3 meses recuperamos la inversión solo con la reducción de licencias médicas.",
      author: "Ana Rodríguez, VP de Operaciones"
    }
  ];

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
              <a href="/about" className="text-gray-600 dark:text-white/80 hover:text-gray-900 dark:hover:text-white transition-colors">Qué es RogerBox</a>
              <a href="/enterprises" className="text-[#85ea10] font-semibold">Servicio para Empresas</a>
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
              <span className="text-[#85ea10]">Licencias Corporativas</span><br />
              para tu Empresa
            </h1>
            <p className="text-xl text-gray-600 dark:text-white/80 max-w-4xl mx-auto leading-relaxed mb-8">
              Cumple con las normativas colombianas de bienestar laboral mientras transformas la salud y productividad de tus empleados
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-[#85ea10] hover:bg-[#7dd30f] text-black font-bold px-8 py-4 rounded-xl text-lg transition-all duration-300 hover:scale-105 flex items-center justify-center space-x-2">
                <span>Solicitar Demo</span>
                <ChevronRight className="w-5 h-5" />
              </button>
              <button className="border-2 border-[#85ea10] text-[#85ea10] hover:bg-[#85ea10] hover:text-black font-bold px-8 py-4 rounded-xl text-lg transition-all duration-300">
                Ver Planes y Precios
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Legal Compliance Section */}
      <section className="py-20 bg-white dark:bg-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
              Cumplimiento <span className="text-[#85ea10]">Legal</span> en Colombia
            </h2>
            <p className="text-xl text-gray-600 dark:text-white/80 max-w-3xl mx-auto">
              Nuestra plataforma te ayuda a cumplir con las normativas colombianas de bienestar laboral
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl p-8 text-center">
              <div className="w-16 h-16 bg-[#85ea10] rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Shield className="w-8 h-8 text-black" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Ley 1562 de 2012</h3>
              <p className="text-gray-600 dark:text-white/80 mb-4">
                Sistema General de Riesgos Laborales - Promoción de la salud en el trabajo
              </p>
              <ul className="text-sm text-gray-500 dark:text-white/60 space-y-1">
                <li>• Pausas activas obligatorias</li>
                <li>• Programas de promoción de salud</li>
                <li>• Prevención de enfermedades laborales</li>
              </ul>
            </div>

            <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl p-8 text-center">
              <div className="w-16 h-16 bg-[#85ea10] rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Clock className="w-8 h-8 text-black" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Decreto 1072 de 2015</h3>
              <p className="text-gray-600 dark:text-white/80 mb-4">
                Reglamentación de pausas activas y programas de bienestar laboral
              </p>
              <ul className="text-sm text-gray-500 dark:text-white/60 space-y-1">
                <li>• 5 minutos cada 2 horas</li>
                <li>• Ejercicios de estiramiento</li>
                <li>• Registro de cumplimiento</li>
              </ul>
            </div>

            <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl p-8 text-center">
              <div className="w-16 h-16 bg-[#85ea10] rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Award className="w-8 h-8 text-black" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Resolución 2404 de 2019</h3>
              <p className="text-gray-600 dark:text-white/80 mb-4">
                Estándares mínimos del Sistema de Gestión de Seguridad y Salud en el Trabajo
              </p>
              <ul className="text-sm text-gray-500 dark:text-white/60 space-y-1">
                <li>• Evaluación de riesgos psicosociales</li>
                <li>• Programas de promoción de salud</li>
                <li>• Capacitación en bienestar</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
              Beneficios para tu <span className="text-[#85ea10]">Empresa</span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-white/80 max-w-3xl mx-auto">
              Transforma tu lugar de trabajo con una plataforma integral de bienestar
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg">
                <div className="flex items-start space-x-6">
                  <div className="w-16 h-16 bg-[#85ea10] rounded-2xl flex items-center justify-center flex-shrink-0">
                    {benefit.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                      {benefit.title}
                    </h3>
                    <p className="text-gray-600 dark:text-white/80 mb-4 leading-relaxed">
                      {benefit.description}
                    </p>
                    <ul className="space-y-2">
                      {benefit.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center space-x-2 text-sm text-gray-600 dark:text-white/80">
                          <CheckCircle className="w-4 h-4 text-[#85ea10] flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Plans */}
      <section className="py-20 bg-gray-100 dark:bg-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
              Planes de <span className="text-[#85ea10]">Licencias</span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-white/80 max-w-3xl mx-auto">
              Escoge el plan que mejor se adapte al tamaño de tu empresa
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <div key={index} className={`bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg relative ${plan.popular ? 'ring-2 ring-[#85ea10] scale-105' : ''}`}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-[#85ea10] text-black px-4 py-2 rounded-full text-sm font-bold">
                      MÁS POPULAR
                    </span>
                  </div>
                )}
                
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{plan.name}</h3>
                  <p className="text-gray-600 dark:text-white/80 mb-4">{plan.employees}</p>
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-gray-900 dark:text-white">{plan.price}</span>
                    <span className="text-gray-600 dark:text-white/80 ml-2">{plan.period}</span>
                  </div>
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-[#85ea10] flex-shrink-0" />
                      <span className="text-gray-600 dark:text-white/80">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 ${
                  plan.popular 
                    ? 'bg-[#85ea10] hover:bg-[#7dd30f] text-black hover:scale-105' 
                    : 'border-2 border-[#85ea10] text-[#85ea10] hover:bg-[#85ea10] hover:text-black'
                }`}>
                  {plan.name === 'Enterprise' ? 'Contactar Ventas' : 'Comenzar Ahora'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
              Casos de <span className="text-[#85ea10]">Éxito</span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-white/80 max-w-3xl mx-auto">
              Empresas que ya transformaron su cultura de bienestar
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg">
                <div className="flex items-center space-x-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <blockquote className="text-gray-600 dark:text-white/80 mb-6 leading-relaxed">
                  "{testimonial.quote}"
                </blockquote>
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <p className="font-semibold text-gray-900 dark:text-white">{testimonial.author}</p>
                  <p className="text-sm text-gray-500 dark:text-white/60">{testimonial.company} • {testimonial.employees}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-[#85ea10]/10 to-[#7dd30f]/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
              ¿Listo para Transformar tu Empresa?
            </h2>
            <p className="text-xl text-gray-600 dark:text-white/80 mb-8 max-w-3xl mx-auto">
              Agenda una demo personalizada y descubre cómo RogerBox puede mejorar el bienestar de tus empleados
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-[#85ea10] hover:bg-[#7dd30f] text-black font-bold px-8 py-4 rounded-xl text-lg transition-all duration-300 hover:scale-105 flex items-center justify-center space-x-2">
                <Phone className="w-5 h-5" />
                <span>Agendar Demo</span>
              </button>
              <button className="border-2 border-[#85ea10] text-[#85ea10] hover:bg-[#85ea10] hover:text-black font-bold px-8 py-4 rounded-xl text-lg transition-all duration-300 flex items-center justify-center space-x-2">
                <Mail className="w-5 h-5" />
                <span>Contactar Ventas</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Info */}
      <section className="py-20 bg-white dark:bg-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
                Información de <span className="text-[#85ea10]">Contacto</span>
              </h3>
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <Phone className="w-6 h-6 text-[#85ea10] mt-1" />
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Teléfono</h4>
                    <p className="text-gray-600 dark:text-white/80">+57 300 123 4567</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <Mail className="w-6 h-6 text-[#85ea10] mt-1" />
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Email</h4>
                    <p className="text-gray-600 dark:text-white/80">empresas@rogerbox.com</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <MapPin className="w-6 h-6 text-[#85ea10] mt-1" />
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Ubicación</h4>
                    <p className="text-gray-600 dark:text-white/80">Sincelejo, Sucre, Colombia</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl p-8">
              <h4 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Solicitar Información
              </h4>
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 dark:text-white font-semibold mb-2">
                      Nombre
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#85ea10] focus:border-transparent"
                      placeholder="Tu nombre"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 dark:text-white font-semibold mb-2">
                      Empresa
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#85ea10] focus:border-transparent"
                      placeholder="Nombre de la empresa"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-gray-700 dark:text-white font-semibold mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    className="w-full px-4 py-3 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#85ea10] focus:border-transparent"
                    placeholder="tu.email@empresa.com"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 dark:text-white font-semibold mb-2">
                    Número de empleados
                  </label>
                  <select className="w-full px-4 py-3 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#85ea10] focus:border-transparent">
                    <option>1-50 empleados</option>
                    <option>51-200 empleados</option>
                    <option>200+ empleados</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 dark:text-white font-semibold mb-2">
                    Mensaje
                  </label>
                  <textarea
                    rows={4}
                    className="w-full px-4 py-3 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#85ea10] focus:border-transparent"
                    placeholder="Cuéntanos sobre las necesidades de bienestar de tu empresa..."
                  ></textarea>
                </div>
                <button
                  type="submit"
                  className="w-full bg-[#85ea10] hover:bg-[#7dd30f] text-black font-bold py-4 rounded-xl transition-all duration-300 hover:scale-105"
                >
                  Enviar Solicitud
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
