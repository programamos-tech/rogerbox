import { supabase } from '@/lib/supabase';

export async function updatePassword(password: string) {
  return supabase.auth.updateUser({ password });
}
