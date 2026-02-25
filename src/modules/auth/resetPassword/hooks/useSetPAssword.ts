'use client';

import { useState, useTransition } from 'react';
import { updatePassword } from '@auth/resetPassword/services/update-password.service';
import { validatePassword } from '@auth/resetPassword/utils/passwordValidation';

export function useResetPassword() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function reset(password: string, confirm: string) {
    const validationError = validatePassword(password, confirm);

    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);

    startTransition(async () => {
      const { error } = await updatePassword(password);

      if (error) {
        setError('No se pudo actualizar la contraseña');
        return;
      }

      setSuccess(true);
    });
  }

  return {
    reset,
    loading: isPending,
    error,
    success,
  };
}
