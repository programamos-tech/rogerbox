'use client';

import { useState } from 'react';
import { useResetPassword } from '../../hooks/useSetPAssword';
import PasswordField from '../passwordField';
import { className as styles } from './styles';

function ResetPasswordForm() {
  const { reset, loading, error, success } = useResetPassword();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  if (success) {
    return (
      <div className={styles.successContainer}>
        Contraseña actualizada correctamente.
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        reset(password, confirm);
      }}
      className={styles.form}
    >
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
  );
}

export default ResetPasswordForm;
