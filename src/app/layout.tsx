import type { Metadata } from 'next';
import { Geist, Geist_Mono, Inter } from 'next/font/google';
import Script from 'next/script';
import VersionFooter from '@/components/VersionFooter';
import { Providers } from './providers';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
});

export const metadata: Metadata = {
  title: 'RogerBox - Transforma tu cuerpo cambiando tu mente',
  description:
    'Plataforma de fitness y bienestar con entrenamientos HIIT, planes nutricionales y mentoría personalizada. ¡Comienza tu transformación hoy!',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
  openGraph: {
    title: 'RogerBox - Transforma tu cuerpo cambiando tu mente',
    description:
      'Entrenamientos HIIT, planes nutricionales y mentoría personalizada. Únete a RogerBox.',
    url: 'https://rogerbox.vercel.app',
    siteName: 'RogerBox',
    images: [
      {
        url: '/logo.png',
        width: 1200,
        height: 630,
        alt: 'RogerBox',
      },
    ],
    locale: 'es_ES',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RogerBox - Transforma tu cuerpo cambiando tu mente',
    description:
      'Entrenamientos HIIT, planes nutricionales y mentoría personalizada. Únete a RogerBox.',
    images: ['/logo.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <Script
          src="https://checkout.wompi.co/widget.js"
          strategy="afterInteractive"
        />
        {/* Script para verificar cuando Wompi se carga */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var checkWompi = setInterval(function() {
                  if (typeof window.WidgetCheckout !== 'undefined') {
                    clearInterval(checkWompi);
                  }
                }, 100);
                // Limpiar después de 10 segundos
                setTimeout(function() {
                  clearInterval(checkWompi);
                }, 10000);
              })();
            `,
          }}
        />
        {/* Aplica tema guardado (claro / oscuro / sistema) antes del paint */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var stored = localStorage.getItem('app-theme');
                  var mode = (stored === 'light' || stored === 'dark' || stored === 'system') ? stored : 'system';
                  var dark = mode === 'dark' || (mode !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches);
                  document.documentElement.classList.toggle('dark', dark);
                  document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} antialiased`}
      >
        <Providers>
          {children}
          <VersionFooter />
        </Providers>
      </body>
    </html>
  );
}
