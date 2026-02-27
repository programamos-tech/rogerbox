'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Phone, Mail, MapPin, User, Building2, Heart, Zap, Target, MessageCircle, Calendar, Star, CheckCircle } from 'lucide-react';
import Footer from '@/components/Footer';

export default function ContactPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    service: '',
    message: '',
    budget: '',
    timeline: ''
  });

  const services = [
    {
      id: 'mentoria',
      title: 'Mentoría Personalizada',
      description: 'Sesiones 1:1 con Roger Barreto para transformación personal',
      icon: <User className="w-8 h-8" />,
      price: 'Desde $150.000/sesión',
      duration: '1-2 horas por sesión',
      features: [
        'Evaluación personalizada',
        'Plan de entrenamiento único',
        'Seguimiento nutricional',
        'Sesiones de motivación',
        'Acceso a contenido exclusivo'
      ]
    },
    {
      id: 'nutricion',
      title: 'Consultoría Nutricional',
      description: 'Planes alimentarios personalizados para tus objetivos',
      icon: <Heart className="w-8 h-8" />,
      price: 'Desde $100.000/consulta',
      duration: '45-60 minutos por consulta',
      features: [
        'Análisis de composición corporal',
        'Plan nutricional personalizado',
        'Recetas y menús semanales',
        'Seguimiento semanal',
        'Ajustes según progreso'
      ]
    },
    {
      id: 'empresa',
      title: 'Programa Corporativo',
      description: 'Solución completa de bienestar para tu empresa',
      icon: <Building2 className="w-8 h-8" />,
      price: 'Personalizado según tamaño',
      duration: '6-12 meses de duración',
      features: [
        'Evaluación de necesidades empresariales',
        'Programa de pausas activas',
        'Talleres de nutrición laboral',
        'Métricas de bienestar',
        'Cumplimiento legal garantizado'
      ]
    },
    {
      id: 'grupo',
      title: 'Entrenamientos Grupales',
      description: 'Sesiones HIIT grupales para equipos o comunidades',
      icon: <Zap className="w-8 h-8" />,
      price: 'Desde $50.000/persona',
      duration: '45-60 minutos por sesión',
      features: [
        'Grupos de 5-20 personas',
        'Entrenamientos en tu ubicación',
        'Equipamiento incluido',
        'Instructor certificado',
        'Seguimiento grupal'
      ]
    }
  ];

  const contactMethods = [
    {
      icon: <Phone className="w-6 h-6" />,
      title: 'WhatsApp',
      info: '+57 300 123 4567',
      description: 'Respuesta inmediata',
      action: 'Escribir por WhatsApp'
    },
    {
      icon: <Mail className="w-6 h-6" />,
      title: 'Email',
      info: 'contacto@rogerbox.com',
      description: 'Respuesta en 24 horas',
      action: 'Enviar email'
    },
    {
      icon: <MapPin className="w-6 h-6" />,
      title: 'Ubicación',
      info: 'Sincelejo, Sucre',
      description: 'Visitas con cita previa',
      action: 'Agendar visita'
    },
    {
      icon: <Calendar className="w-6 h-6" />,
      title: 'Cita Virtual',
      info: 'Google Meet / Zoom',
      description: 'Consulta desde cualquier lugar',
      action: 'Agendar cita virtual'
    }
  ];

  const testimonials = [
    {
      name: 'María González',
      service: 'Mentoría Personalizada',
      quote: 'Roger me ayudó a perder 15kg en 3 meses. Su enfoque personalizado y motivación constante fueron clave para mi transformación.',
      rating: 5
    },
    {
      name: 'Carlos Mendoza',
      service: 'Consultoría Nutricional',
      quote: 'El plan nutricional que me diseñó Roger cambió completamente mi relación con la comida. Ahora tengo energía todo el día.',
      rating: 5
    },
    {
      name: 'Ana Rodríguez',
      service: 'Programa Corporativo',
      quote: 'Implementamos el programa en nuestra empresa y los resultados han sido increíbles. Empleados más saludables y productivos.',
      rating: 5
    }
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Aquí iría la lógica para enviar el formulario
    console.log('Formulario enviado:', formData);
    alert('¡Gracias por tu mensaje! Te contactaremos pronto.');
  };

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
              <a href="/enterprises" className="text-gray-600 dark:text-white/80 hover:text-gray-900 dark:hover:text-white transition-colors">Servicio para Empresas</a>
              <a href="/contact" className="text-[#85ea10] font-semibold">Contacto</a>
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
              <span className="text-[#85ea10]">Contacta</span> con RogerBox
            </h1>
            <p className="text-xl text-gray-600 dark:text-white/80 max-w-4xl mx-auto leading-relaxed mb-8">
              Servicios personalizados de fitness, nutrición y mentoría. Transforma tu vida con la guía directa de Roger Barreto.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-[#85ea10] hover:bg-[#7dd30f] text-black font-bold px-8 py-4 rounded-xl text-lg transition-all duration-300 hover:scale-105 flex items-center justify-center space-x-2">
                <Phone className="w-5 h-5" />
                <span>Llamar Ahora</span>
              </button>
              <button className="border-2 border-[#85ea10] text-[#85ea10] hover:bg-[#85ea10] hover:text-black font-bold px-8 py-4 rounded-xl text-lg transition-all duration-300">
                Ver Servicios
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 bg-white dark:bg-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
              Servicios <span className="text-[#85ea10]">Personalizados</span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-white/80 max-w-3xl mx-auto">
              Elige el servicio que mejor se adapte a tus necesidades y objetivos
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {services.map((service) => (
              <div key={service.id} className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="flex items-start space-x-6">
                  <div className="w-16 h-16 bg-[#85ea10] rounded-2xl flex items-center justify-center flex-shrink-0">
                    {service.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      {service.title}
                    </h3>
                    <p className="text-gray-600 dark:text-white/80 mb-4 leading-relaxed">
                      {service.description}
                    </p>
                    <div className="flex items-center space-x-4 mb-4">
                      <span className="text-lg font-semibold text-[#85ea10]">{service.price}</span>
                      <span className="text-gray-500 dark:text-white/60">{service.duration}</span>
                    </div>
                    <ul className="space-y-2 mb-6">
                      {service.features.map((feature, index) => (
                        <li key={index} className="flex items-center space-x-2 text-sm text-gray-600 dark:text-white/80">
                          <CheckCircle className="w-4 h-4 text-[#85ea10] flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <button 
                      className="w-full bg-[#85ea10] hover:bg-[#7dd30f] text-black font-bold py-3 rounded-xl transition-all duration-300 hover:scale-105"
                    >
                      Solicitar Información
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
              Formas de <span className="text-[#85ea10]">Contacto</span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-white/80 max-w-3xl mx-auto">
              Elige la forma más conveniente para comunicarte con nosotros
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {contactMethods.map((method, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg text-center hover:shadow-xl transition-all duration-300">
                <div className="w-12 h-12 bg-[#85ea10] rounded-full flex items-center justify-center mx-auto mb-4">
                  {method.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {method.title}
                </h3>
                <p className="text-gray-600 dark:text-white/80 mb-2 font-medium">
                  {method.info}
                </p>
                <p className="text-sm text-gray-500 dark:text-white/60 mb-4">
                  {method.description}
                </p>
                <button className="w-full bg-gray-100 dark:bg-gray-700 hover:bg-[#85ea10] hover:text-black text-gray-700 dark:text-white font-semibold py-2 rounded-lg transition-all duration-300">
                  {method.action}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-20 bg-gray-100 dark:bg-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
                Solicita tu <span className="text-[#85ea10]">Consulta</span>
              </h2>
              <p className="text-lg text-gray-600 dark:text-white/80 mb-8 leading-relaxed">
                Completa el formulario y nos pondremos en contacto contigo en menos de 24 horas para personalizar tu experiencia con RogerBox.
              </p>
              
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-[#85ea10] rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <CheckCircle className="w-4 h-4 text-black" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Consulta Gratuita
                    </h3>
                    <p className="text-gray-600 dark:text-white/80">
                      Primera consulta de 30 minutos sin costo para evaluar tus necesidades
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-[#85ea10] rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Target className="w-4 h-4 text-black" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Plan Personalizado
                    </h3>
                    <p className="text-gray-600 dark:text-white/80">
                      Diseñamos un plan específico para tus objetivos y estilo de vida
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-[#85ea10] rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Heart className="w-4 h-4 text-black" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Seguimiento Continuo
                    </h3>
                    <p className="text-gray-600 dark:text-white/80">
                      Acompañamiento constante para asegurar tu éxito
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 dark:text-white font-semibold mb-2">
                      Nombre Completo *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#85ea10] focus:border-transparent"
                      placeholder="Tu nombre completo"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 dark:text-white font-semibold mb-2">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#85ea10] focus:border-transparent"
                      placeholder="+57 300 123 4567"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-gray-700 dark:text-white font-semibold mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#85ea10] focus:border-transparent"
                    placeholder="tu.email@ejemplo.com"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 dark:text-white font-semibold mb-2">
                    Empresa (opcional)
                  </label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => handleInputChange('company', e.target.value)}
                    className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#85ea10] focus:border-transparent"
                    placeholder="Nombre de tu empresa"
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 dark:text-white font-semibold mb-2">
                    Servicio de Interés *
                  </label>
                  <select
                    value={formData.service}
                    onChange={(e) => handleInputChange('service', e.target.value)}
                    className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#85ea10] focus:border-transparent"
                    required
                  >
                    <option value="">Selecciona un servicio</option>
                    <option value="mentoria">Mentoría Personalizada</option>
                    <option value="nutricion">Consultoría Nutricional</option>
                    <option value="empresa">Programa Corporativo</option>
                    <option value="grupo">Entrenamientos Grupales</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 dark:text-white font-semibold mb-2">
                      Presupuesto Aproximado
                    </label>
                    <select
                      value={formData.budget}
                      onChange={(e) => handleInputChange('budget', e.target.value)}
                      className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#85ea10] focus:border-transparent"
                    >
                      <option value="">Selecciona rango</option>
                      <option value="100-300">$100.000 - $300.000</option>
                      <option value="300-500">$300.000 - $500.000</option>
                      <option value="500-1000">$500.000 - $1.000.000</option>
                      <option value="1000+">$1.000.000+</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-700 dark:text-white font-semibold mb-2">
                      Tiempo Esperado
                    </label>
                    <select
                      value={formData.timeline}
                      onChange={(e) => handleInputChange('timeline', e.target.value)}
                      className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#85ea10] focus:border-transparent"
                    >
                      <option value="">Selecciona tiempo</option>
                      <option value="inmediato">Inmediato</option>
                      <option value="1-mes">En 1 mes</option>
                      <option value="3-meses">En 3 meses</option>
                      <option value="6-meses">En 6 meses</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-gray-700 dark:text-white font-semibold mb-2">
                    Cuéntanos sobre tus objetivos *
                  </label>
                  <textarea
                    rows={4}
                    value={formData.message}
                    onChange={(e) => handleInputChange('message', e.target.value)}
                    className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#85ea10] focus:border-transparent"
                    placeholder="Describe tus objetivos, experiencia previa, limitaciones, etc..."
                    required
                  ></textarea>
                </div>
                
                <button
                  type="submit"
                  className="w-full bg-[#85ea10] hover:bg-[#7dd30f] text-black font-bold py-4 rounded-xl transition-all duration-300 hover:scale-105 flex items-center justify-center space-x-2"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span>Enviar Solicitud</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
              Lo que dicen nuestros <span className="text-[#85ea10]">Clientes</span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-white/80 max-w-3xl mx-auto">
              Historias reales de transformación con nuestros servicios personalizados
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg">
                <div className="flex items-center space-x-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <blockquote className="text-gray-600 dark:text-white/80 mb-6 leading-relaxed">
                  "{testimonial.quote}"
                </blockquote>
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <p className="font-semibold text-gray-900 dark:text-white">{testimonial.name}</p>
                  <p className="text-sm text-[#85ea10]">{testimonial.service}</p>
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
              ¿Listo para tu Transformación?
            </h2>
            <p className="text-xl text-gray-600 dark:text-white/80 mb-8 max-w-3xl mx-auto">
              No esperes más. Tu mejor versión te está esperando. Contacta con RogerBox hoy mismo.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-[#85ea10] hover:bg-[#7dd30f] text-black font-bold px-8 py-4 rounded-xl text-lg transition-all duration-300 hover:scale-105 flex items-center justify-center space-x-2">
                <Phone className="w-5 h-5" />
                <span>Llamar Ahora</span>
              </button>
              <button className="border-2 border-[#85ea10] text-[#85ea10] hover:bg-[#85ea10] hover:text-black font-bold px-8 py-4 rounded-xl text-lg transition-all duration-300 flex items-center justify-center space-x-2">
                <Calendar className="w-5 h-5" />
                <span>Agendar Consulta</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-100/80 dark:bg-white/5 backdrop-blur-lg border-t border-gray-200 dark:border-white/20 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              ROGER<span className="text-[#85ea10]">BOX</span>
            </h3>
            <p className="text-gray-600 dark:text-white/60">
              Transforma tu vida, transforma tu futuro
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
