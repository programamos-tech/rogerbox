import { createBrowserClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

// Fallbacks seguros para entorno local Supabase (dev services corriendo en 127.0.0.1:54321)
const localSupabaseUrl = 'http://127.0.0.1:54321';
// Clave pública por defecto de Supabase local (solo para desarrollo)
const localAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
  'eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.' +
  'CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || localSupabaseUrl;
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || localAnonKey;
// Preferir la clave segura (no pública); fallback solo si está definida la pública
// Para Supabase local, usar la service_role key por defecto
const localServiceKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY ||
  (supabaseUrl === localSupabaseUrl
    ? localServiceKey
    : 'service-key-placeholder');

// Verificar que las variables estén cargadas
// En producción, las variables son obligatorias
// Solo validar en tiempo de ejecución, no durante el build
// Durante el build, Next.js puede estar usando .env.production con localhost
// Permitir localhost si estamos en desarrollo local
const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build';
const isVercelProduction =
  process.env.VERCEL && process.env.VERCEL_ENV === 'production';

if (
  process.env.NODE_ENV === 'production' &&
  !isBuildPhase &&
  isVercelProduction
) {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    throw new Error(
      '❌ Missing required Supabase environment variables in production: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set',
    );
  }
  if (
    !process.env.SUPABASE_SERVICE_ROLE_KEY &&
    !process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY
  ) {
    throw new Error(
      '❌ Missing required Supabase service role key in production: SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY must be set',
    );
  }
  // Solo bloquear localhost en producción real (Vercel), no en desarrollo local
  if (supabaseUrl.includes('127.0.0.1') || supabaseUrl.includes('localhost')) {
    throw new Error(
      '❌ Invalid Supabase URL in production: Cannot use localhost. Set NEXT_PUBLIC_SUPABASE_URL to your production Supabase project URL',
    );
  }
} else {
  // En desarrollo, solo advertir
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    !(
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY
    )
  ) {
  }
}

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

// Cliente con SERVICE_ROLE_KEY para operaciones de escritura
// IMPORTANTE: Usar auth: { persistSession: false } para evitar conflictos con sesiones
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

// Log para debugging en desarrollo
if (process.env.NODE_ENV === 'development') {
}

// Tipos para TypeScript
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string;
          email: string;
          weight: number;
          height: number;
          gender: 'male' | 'female' | 'other';
          goals: string[];
          target_weight: number | null;
          membership_status: 'inactive' | 'active' | 'expired';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          email: string;
          weight: number;
          height: number;
          gender: 'male' | 'female' | 'other';
          goals: string[];
          target_weight?: number | null;
          membership_status?: 'inactive' | 'active' | 'expired';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          weight?: number;
          height?: number;
          gender?: 'male' | 'female' | 'other';
          goals?: string[];
          target_weight?: number | null;
          membership_status?: 'inactive' | 'active' | 'expired';
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};
