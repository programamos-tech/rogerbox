'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export function useRecoverySession() {
  const [valid, setValid] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkSession() {
      const { data } = await supabase.auth.getSession();

      const session = data.session;

      if (!session) {
        setValid(false);
        return;
      }

      const isRecovery =
        session.user?.aud === 'authenticated' && session.user?.recovery_sent_at;

      setValid(!!isRecovery);
    }

    checkSession();
  }, []);

  return valid;
}
