'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Script from 'next/script';
import styles from './page.module.css';

declare global {
  interface Window {
    handleGoogleCredential?: (response: { credential: string }) => void;
  }
}

// Inner component that uses useSearchParams — wrapped in Suspense by the outer page
function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from') ?? '/overview';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSuccess = useCallback(() => {
    router.replace(from);
  }, [router, from]);

  const handleGoogleCredential = useCallback(async (response: { credential: string }) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth?action=google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: response.credential }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.message ?? 'Erreur Google Sign-In');
      } else {
        handleSuccess();
      }
    } catch {
      setError('Erreur réseau. Réessayez.');
    } finally {
      setLoading(false);
    }
  }, [handleSuccess]);

  // Expose callback for Google One Tap
  useEffect(() => {
    window.handleGoogleCredential = handleGoogleCredential;
    return () => { delete window.handleGoogleCredential; };
  }, [handleGoogleCredential]);

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth?action=login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.message ?? 'Email ou mot de passe incorrect');
      } else {
        handleSuccess();
      }
    } catch {
      setError('Erreur réseau. Réessayez.');
    } finally {
      setLoading(false);
    }
  }

  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? '';

  return (
    <>
      {/* Google Identity Services */}
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
      />

      {/* Google One Tap initialiser */}
      {googleClientId && (
        <div
          id="g_id_onload"
          data-client_id={googleClientId}
          data-callback="handleGoogleCredential"
          data-auto_prompt="false"
          style={{ display: 'none' }}
        />
      )}

      <div className={styles.screen}>
        <div className={styles.card}>
          {/* Logo */}
          <div className={styles.logoRow}>
            <div className={styles.logoDot} />
            <span className={styles.logoName}>GYNEVA</span>
          </div>
          <p className={styles.subtitle}>Business Plan Intelligence</p>

          {/* Google button */}
          {googleClientId && (
            <div className={styles.googleBtn}>
              <div
                className="g_id_signin"
                data-type="standard"
                data-shape="rectangular"
                data-theme="outline"
                data-text="signin_with"
                data-size="large"
                data-locale="fr"
                data-width="340"
              />
            </div>
          )}

          {/* Separator */}
          <div className={styles.or}>ou</div>

          {/* Password form */}
          <form className={styles.form} onSubmit={handlePasswordLogin}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
              disabled={loading}
            />
            <input
              type="password"
              placeholder="Mot de passe"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="current-password"
              disabled={loading}
            />
            <button type="submit" disabled={loading}>
              {loading ? 'Connexion…' : 'Se connecter'}
            </button>
          </form>

          <div className={styles.divider} />
          <p className={styles.accessInfo}>Accès réservé aux membres autorisés.</p>

          {error && <div className={styles.error}>{error}</div>}
        </div>
      </div>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
