import { className as styles } from './styles';

function RecoveryWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.container}>
      <div className={styles.blurBackground} />
      <div className={styles.blurBackground2} />
      <div className={styles.section}>{children}</div>
    </div>
  );
}

export default RecoveryWrapper;
