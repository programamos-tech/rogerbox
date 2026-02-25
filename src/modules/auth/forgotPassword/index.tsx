'use client';

import { useForgotPassword } from './hooks/useForgotPassword';
import { className as styles } from './styles';

function ForgotPassword() {
  const { email, setEmail, message, loading, handleSend } = useForgotPassword();

  return (
    <form onSubmit={handleSend} className={styles.form}>
      <h1 className={styles.title}>Recuperar contraseña</h1>

      <input
        type="email"
        placeholder="tu@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className={styles.input}
        required
      />

      <button type="submit" disabled={loading} className={styles.button}>
        {loading ? 'Enviando...' : 'Enviar enlace'}
      </button>

      {message && <p className={styles.message}>{message}</p>}
    </form>
  );
}

export default ForgotPassword;
