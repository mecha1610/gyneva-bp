import Link from 'next/link';
import styles from './not-found.module.css';

export default function NotFound() {
  return (
    <div className={styles.screen}>
      <div className={styles.card}>
        <div className={styles.code}>404</div>
        <h1 className={styles.title}>Page introuvable</h1>
        <p className={styles.subtitle}>
          Cette page n&apos;existe pas ou vous n&apos;avez pas accès.
        </p>
        <Link href="/" className={styles.btn}>
          Retour au tableau de bord
        </Link>
      </div>
    </div>
  );
}
