'use client';

import { useRouter } from 'next/navigation';
import Footer from '@/components/Footer';

export default function PrivacidadPage() {
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
          Política de privacidad de datos
        </h1>
        <div className="prose prose-gray dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 space-y-4">
          <p>
            En ROGERBOX nos comprometemos a proteger tu información personal.
            Esta política describe cómo recopilamos, usamos y protegemos tus
            datos.
          </p>
          <p>
            <strong>Responsable:</strong> ROGERBOX. Puedes contactarnos para
            ejercer tus derechos de acceso, rectificación, supresión y
            portabilidad de tus datos.
          </p>
          <p>
            Aquí puedes detallar los datos que recopilas, la base legal, los
            plazos de conservación, las cesiones y el uso de cookies o análisis,
            según aplique a tu proyecto.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
