'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { setRecoverySession } from '@auth/resetPassword/services/recovery-session.service.';

export function useRecoverySession() {
  const params = useSearchParams();
  const [valid, setValid] = useState<boolean | null>(null);

  useEffect(() => {
    function getTokens() {
      let access = params.get('access_token');
      let refresh = params.get('refresh_token');

      if (!access || !refresh) {
        const hash = window.location.hash;

        if (hash) {
          const hashParams = new URLSearchParams(hash.substring(1));
          access = hashParams.get('access_token');
          refresh = hashParams.get('refresh_token');
        }
      }

      return { access, refresh };
    }

    async function init() {
      const { access, refresh } = getTokens();

      if (!access || !refresh) {
        setValid(false);
        return;
      }

      await setRecoverySession(access, refresh);

      window.history.replaceState({}, document.title, window.location.pathname);

      setValid(true);
    }

    init();
  }, [params]);

  return valid;
}
