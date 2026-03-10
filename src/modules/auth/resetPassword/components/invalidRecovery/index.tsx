'use client';

import RecoveryWrapper from '@auth/resetPassword/components/wrapper';
import { useRouter } from 'next/navigation';
import { className as styles } from './styles';

export default function InvalidRecoveryLink() {
  const router = useRouter();

  return (
    <RecoveryWrapper>
      <h1 className={styles.title}>Enlace inválido o expirado</h1>

      <p className={styles.description}>
        Este enlace ya no es válido o ha expirado. Solicita uno nuevo para
        restablecer tu contraseña.
      </p>

      <button
        onClick={() => router.push('/forgot-password')}
        className={styles.secondaryButton}
      >
        Solicitar nuevo enlace
      </button>

      <button onClick={() => router.push('/login')} className={styles.button}>
        Volver al login
      </button>
    </RecoveryWrapper>
  );
}
