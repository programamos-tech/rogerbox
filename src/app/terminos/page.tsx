'use client';

import { useRouter } from 'next/navigation';
import Footer from '@/components/Footer';

export default function TerminosPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="border-b border-gray-200 dark:border-white/10 bg-white/80 dark:bg-gray-900/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <button
            onClick={() => router.back()}
            className="text-gray-600 dark:text-white/80 hover:text-gray-900 dark:hover:text-white text-sm font-medium"
          >
            ← Volver
          </button>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Términos de uso
        </h1>
        <div className="prose prose-gray dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 space-y-4">
          <p>
            Al usar ROGERBOX aceptas los siguientes términos. El servicio está
            destinado a usuarios que deseen acceder a contenido de entrenamiento
            HIIT en línea.
          </p>
          <p>
            <strong>Uso del servicio:</strong> Te comprometes a usar la
            plataforma de forma lícita, sin abusar del sistema ni vulnerar la
            seguridad o los derechos de otros usuarios.
          </p>
          <p>
            Aquí puedes añadir condiciones de suscripción, cancelación,
            propiedad intelectual, limitación de responsabilidad y ley
            aplicable, según corresponda a tu proyecto.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
