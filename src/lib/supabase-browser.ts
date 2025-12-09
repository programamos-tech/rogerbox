import { createBrowserClient } from '@supabase/ssr'

// Fallbacks seguros para entorno local Supabase (dev services corriendo en 127.0.0.1:54321)
const localSupabaseUrl = 'http://127.0.0.1:54321';
const localAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.'
  + 'eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.'
  + 'CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || localSupabaseUrl;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || localAnonKey;

// Cliente de navegador con SSR que maneja cookies correctamente
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)



