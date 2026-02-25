import { supabase } from '@/lib/supabase';

export async function setRecoverySession(
  access_token: string,
  refresh_token: string,
) {
  return supabase.auth.setSession({
    access_token,
    refresh_token,
  });
}
