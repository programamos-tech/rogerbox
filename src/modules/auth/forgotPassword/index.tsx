'use client';

import RecoveryWrapper from '@auth/resetPassword/components/wrapper';
import { useForgotPassword } from './hooks/useForgotPassword';
import { className as styles } from './styles';

function ForgotPassword() {
  const { email, setEmail, message, loading, handleSend } = useForgotPassword();

  return (
    <RecoveryWrapper>
      <form onSubmit={handleSend} className={styles.form}>
        <h1 className={styles.title}>Recuperar contraseña</h1>

        <p className={styles.subtitle}>
          Ingresa tu correo y te enviaremos un enlace para restablecer tu
          contraseña.
        </p>

        <div className="space-y-2">
          <label className={styles.label}>Correo electrónico</label>

          <input
            type="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={styles.input}
            required
          />
        </div>

        <button type="submit" disabled={loading} className={styles.button}>
          {loading ? 'Enviando...' : 'Enviar enlace'}
        </button>

        {message && <p className={styles.message}>{message}</p>}

        <p className={styles.back}>
          ¿Recordaste tu contraseña?
          <a href="/login" className={styles.link}>
            Inicia sesión
          </a>
        </p>
      </form>
    </RecoveryWrapper>
  );
}

export default ForgotPassword;
