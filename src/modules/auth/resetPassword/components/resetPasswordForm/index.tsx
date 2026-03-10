'use client';

import PasswordField from '@auth/resetPassword/components/passwordField';
import RecoveryWrapper from '@auth/resetPassword/components/wrapper';
import { useResetPassword } from '@auth/resetPassword/hooks/useSetPAssword';
import { useState } from 'react';
import { className as styles } from './styles';

function ResetPasswordForm() {
  const { reset, loading, error, success } = useResetPassword();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  if (success) {
    return (
      <RecoveryWrapper>
        <h1 className={styles.title}>Contraseña actualizada</h1>

        <p className={styles.successText}>
          Tu contraseña fue cambiada correctamente.
        </p>

        <a href="/" className={styles.submitButton}>
          Ir al inicio
        </a>
      </RecoveryWrapper>
    );
  }

  return (
    <RecoveryWrapper>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          reset(password, confirm);
        }}
        className={styles.form}
      >
        <h1 className={styles.title}>Crear nueva contraseña</h1>

        <PasswordField
          label="Nueva contraseña"
          value={password}
          onChange={setPassword}
          disabled={loading}
        />

        <PasswordField
          label="Confirmar contraseña"
          value={confirm}
          onChange={setConfirm}
          disabled={loading}
        />

        {error && <p className={styles.errorText}>{error}</p>}

        <button disabled={loading} className={styles.submitButton}>
          {loading ? 'Actualizando...' : 'Actualizar contraseña'}
        </button>
      </form>
    </RecoveryWrapper>
  );
}

export default ResetPasswordForm;
