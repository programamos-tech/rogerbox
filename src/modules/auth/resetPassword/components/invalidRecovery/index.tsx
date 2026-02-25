'use client';

import { useRouter } from 'next/navigation';
import { className as styles } from './styles';

export default function InvalidRecoveryLink() {
  const router = useRouter();

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Enlace inválido o expirado</h1>

      <button onClick={() => router.push('/login')} className={styles.button}>
        Volver al login
      </button>
    </div>
  );
}
