import { createBrowserClient } from '@supabase/ssr'

// Fallbacks seguros para entorno local Supabase (dev services corriendo en 127.0.0.1:54321)
const localSupabaseUrl = 'http://127.0.0.1:54321';
const localAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.'
  + 'eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.'
  + 'CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

// En producción, las variables son obligatorias
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || (process.env.NODE_ENV === 'production' ? '' : localSupabaseUrl);
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || (process.env.NODE_ENV === 'production' ? '' : localAnonKey);

// Solo validar en tiempo de ejecución, no durante el build
// Durante el build, Next.js puede estar usando .env.production con localhost
// Solo validar en Vercel producción real, no en desarrollo local
const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build';
const isVercelProduction = process.env.VERCEL && process.env.VERCEL_ENV === 'production';

// Solo validar en Vercel producción real, permitir localhost en desarrollo local
if (isVercelProduction && !isBuildPhase) {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('❌ Missing required Supabase environment variables in production: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set');
  }
  // Solo bloquear localhost en producción real (Vercel)
  if (supabaseUrl.includes('127.0.0.1') || supabaseUrl.includes('localhost')) {
    throw new Error('❌ Invalid Supabase URL in production: Cannot use localhost. Set NEXT_PUBLIC_SUPABASE_URL to your production Supabase project URL');
  }
}

// Cliente de navegador con SSR que maneja cookies correctamente
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)



