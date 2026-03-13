'use client';

import { useState, useEffect, useCallback } from 'react';
import styles from './page.module.css';

// ── SVG Icons ──────────────────────────────────────────────────────────────

function IconUsers() { return <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>; }
function IconMail() { return <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>; }
function IconBell() { return <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>; }
function IconLock() { return <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>; }
function IconAlert() { return <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>; }

// ── Types ──────────────────────────────────────────────────────────────────

interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  picture: string | null;
  role: 'ADMIN' | 'EDITOR' | 'VIEWER';
  authType: 'google' | 'password' | 'invited';
  lastLoginAt: string | null;
  createdAt: string;
}

interface AllowedEmail {
  id: string;
  email: string;
  addedBy: string | null;
  createdAt: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function initials(user: AdminUser): string {
  if (user.name) return user.name.slice(0, 2).toUpperCase();
  return user.email.slice(0, 2).toUpperCase();
}

function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Intl.DateTimeFormat('fr-CH', { dateStyle: 'medium' }).format(new Date(iso));
  } catch {
    return '—';
  }
}

// ── Component ──────────────────────────────────────────────────────────────

export default function AdminPage() {
  // ── Data ─────────────────────────────────────────────────────────────────
  const [users,         setUsers]         = useState<AdminUser[]>([]);
  const [allowedEmails, setAllowedEmails] = useState<AllowedEmail[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState<string | null>(null);

  // ── Inline delete confirmation ────────────────────────────────────────────
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // ── Invite form ───────────────────────────────────────────────────────────
  const [inviteEmail,   setInviteEmail]   = useState('');
  const [inviteRole,    setInviteRole]    = useState<'VIEWER' | 'EDITOR' | 'ADMIN'>('VIEWER');
  const [inviteLink,    setInviteLink]    = useState<string | null>(null);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError,   setInviteError]   = useState<string | null>(null);
  const [copied,        setCopied]        = useState(false);

  // ── Push form ─────────────────────────────────────────────────────────────
  const [pushTitle,   setPushTitle]   = useState('');
  const [pushBody,    setPushBody]    = useState('');
  const [pushResult,  setPushResult]  = useState<{ ok: boolean; msg: string } | null>(null);
  const [pushLoading, setPushLoading] = useState(false);

  // ── Add email form ────────────────────────────────────────────────────────
  const [newEmail,       setNewEmail]       = useState('');
  const [addEmailLoading, setAddEmailLoading] = useState(false);
  const [addEmailError,   setAddEmailError]   = useState<string | null>(null);

  // ── Load ──────────────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/users', { credentials: 'include' });
      if (!res.ok) {
        setError(res.status === 403 ? 'Accès réservé aux administrateurs.' : 'Erreur lors du chargement.');
        return;
      }
      const data = await res.json();
      setUsers(data.users ?? []);
      setAllowedEmails(data.allowedEmails ?? []);
    } catch {
      setError('Erreur réseau.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Role change ───────────────────────────────────────────────────────────

  async function changeRole(userId: string, role: string) {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: role as AdminUser['role'] } : u));
    try {
      await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
    } catch {
      fetchData(); // revert on error
    }
  }

  // ── Delete user ───────────────────────────────────────────────────────────

  async function deleteUser(userId: string) {
    setDeleteConfirm(null);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE', credentials: 'include' });
      if (res.ok) setUsers(prev => prev.filter(u => u.id !== userId));
    } catch { /* silent */ }
  }

  // ── Invite ────────────────────────────────────────────────────────────────

  async function createInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail) return;
    setInviteLoading(true);
    setInviteError(null);
    setInviteLink(null);
    try {
      const res = await fetch('/api/admin/users?scope=invites', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      const data = await res.json();
      if (!res.ok) { setInviteError(data.error ?? 'Erreur lors de la création.'); return; }
      setInviteLink(data.link);
      setInviteEmail('');
    } catch {
      setInviteError('Erreur réseau.');
    } finally {
      setInviteLoading(false);
    }
  }

  function copyLink() {
    if (!inviteLink) return;
    navigator.clipboard.writeText(inviteLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => { /* clipboard unavailable */ });
  }

  // ── Push notification ─────────────────────────────────────────────────────

  async function sendPush(e: React.FormEvent) {
    e.preventDefault();
    if (!pushTitle || !pushBody) return;
    setPushLoading(true);
    setPushResult(null);
    try {
      const res = await fetch('/api/push?action=send', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: pushTitle, body: pushBody }),
      });
      const data = await res.json();
      if (!res.ok) { setPushResult({ ok: false, msg: data.error ?? 'Erreur lors de l\'envoi.' }); return; }
      setPushResult({ ok: true, msg: `Envoyé à ${data.sent} abonné(s).` });
      setPushTitle('');
      setPushBody('');
    } catch {
      setPushResult({ ok: false, msg: 'Erreur réseau.' });
    } finally {
      setPushLoading(false);
    }
  }

  // ── Add allowed email ─────────────────────────────────────────────────────

  async function addEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!newEmail) return;
    setAddEmailLoading(true);
    setAddEmailError(null);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newEmail }),
      });
      const data = await res.json();
      if (!res.ok) { setAddEmailError(data.error ?? 'Erreur.'); return; }
      setAllowedEmails(prev => [...prev, data.allowedEmail]);
      setNewEmail('');
    } catch {
      setAddEmailError('Erreur réseau.');
    } finally {
      setAddEmailLoading(false);
    }
  }

  async function removeEmail(email: string) {
    try {
      const res = await fetch(`/api/admin/users?email=${encodeURIComponent(email)}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) setAllowedEmails(prev => prev.filter(e => e.email !== email));
    } catch { /* silent */ }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className={styles.loadingState}>
        <div className={styles.spinner} />
        Chargement…
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorState}>
        <IconAlert /> {error}
      </div>
    );
  }

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Administration</h1>
        <p className={styles.pageSubtitle}>Gestion des utilisateurs, accès et notifications</p>
      </div>

      <p className={styles.desc}>
        Gérez les utilisateurs, les accès Google OAuth, les invitations et les notifications push.
      </p>

      {/* ── Users table ── */}
      <div className={styles.card}>
        <div className={styles.cardTitle}><IconUsers /> Utilisateurs</div>
        <div className={styles.cardDesc}>Modifiez les rôles ou supprimez des comptes.</div>
        {users.length === 0 ? (
          <div className={styles.emptyState}>Aucun utilisateur trouvé.</div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Utilisateur</th>
                  <th>Rôle</th>
                  <th>Auth</th>
                  <th>Dernière connexion</th>
                  <th>Inscrit le</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div className={styles.identity}>
                        {u.picture
                          ? <img src={u.picture} alt="" className={styles.avatar} referrerPolicy="no-referrer" />
                          : <div className={styles.avatarInitials}>{initials(u)}</div>
                        }
                        <div>
                          <div className={styles.userName}>{u.name ?? '—'}</div>
                          <div className={styles.userEmail}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <select
                        className={styles.roleSelect}
                        value={u.role}
                        onChange={e => changeRole(u.id, e.target.value)}
                        aria-label={`Rôle de ${u.name ?? u.email}`}
                      >
                        <option value="VIEWER">Viewer</option>
                        <option value="EDITOR">Editor</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                    </td>
                    <td>
                      <span className={`${styles.authBadge} ${
                        u.authType === 'google'   ? styles.authGoogle   :
                        u.authType === 'password' ? styles.authPassword :
                                                    styles.authInvited
                      }`}>
                        {u.authType === 'google' ? 'Google' : u.authType === 'password' ? 'Mot de passe' : 'Invitation'}
                      </span>
                    </td>
                    <td className={styles.dateCell}>{fmtDate(u.lastLoginAt)}</td>
                    <td className={styles.dateCell}>{fmtDate(u.createdAt)}</td>
                    <td>
                      {deleteConfirm === u.id ? (
                        <div className={styles.confirmCell}>
                          <button className={styles.btnConfirm} onClick={() => deleteUser(u.id)}>Confirmer</button>
                          <button className={styles.btnCancel}  onClick={() => setDeleteConfirm(null)}>Annuler</button>
                        </div>
                      ) : (
                        <button className={styles.btnDanger} onClick={() => setDeleteConfirm(u.id)}>Supprimer</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Invite + Push (2-column) ── */}
      <div className={styles.twoCol}>

        {/* Invite */}
        <div className={styles.card} style={{ margin: 0 }}>
          <div className={styles.cardTitle}><IconMail /> Inviter un utilisateur</div>
          <div className={styles.cardDesc}>
            Générez un lien d&apos;invitation valable 48h. L&apos;utilisateur choisit son mot de passe.
          </div>
          <form onSubmit={createInvite}>
            <div className={styles.formRow}>
              <input
                type="email"
                className={styles.input}
                placeholder="email@example.com"
                aria-label="Adresse email de l'invité"
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                required
              />
              <select
                className={styles.select}
                value={inviteRole}
                onChange={e => setInviteRole(e.target.value as 'VIEWER' | 'EDITOR' | 'ADMIN')}
                aria-label="Rôle de l'invité"
              >
                <option value="VIEWER">Viewer</option>
                <option value="EDITOR">Editor</option>
                <option value="ADMIN">Admin</option>
              </select>
              <button type="submit" className={styles.btnPrimary} disabled={inviteLoading}>
                {inviteLoading ? '…' : 'Générer'}
              </button>
            </div>
          </form>

          {inviteError && (
            <div className={styles.errorState} style={{ marginTop: '.6rem', padding: '.5rem .8rem' }}>
              {inviteError}
            </div>
          )}

          {inviteLink && (
            <div className={styles.linkBox}>
              <div className={styles.linkLabel}>Lien d&apos;invitation :</div>
              <div className={styles.linkRow}>
                <span className={styles.linkText}>{inviteLink}</span>
                <button
                  type="button"
                  className={`${styles.btnCopy} ${copied ? styles.btnCopied : ''}`}
                  onClick={copyLink}
                >
                  {copied ? 'Copié' : 'Copier'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Push notifications */}
        <div className={styles.card} style={{ margin: 0 }}>
          <div className={styles.cardTitle}><IconBell /> Notifications push</div>
          <div className={styles.cardDesc}>
            Envoyez une notification instantanée à tous les abonnés.
          </div>
          <form onSubmit={sendPush}>
            <div className={styles.formRow} style={{ marginBottom: '.5rem' }}>
              <input
                type="text"
                className={styles.input}
                placeholder="Titre"
                aria-label="Titre de la notification"
                value={pushTitle}
                onChange={e => setPushTitle(e.target.value)}
                required
              />
            </div>
            <div className={styles.formRow}>
              <input
                type="text"
                className={styles.input}
                placeholder="Message"
                aria-label="Message de la notification"
                value={pushBody}
                onChange={e => setPushBody(e.target.value)}
                required
              />
              <button type="submit" className={styles.btnPrimary} disabled={pushLoading}>
                {pushLoading ? '…' : 'Envoyer'}
              </button>
            </div>
          </form>

          {pushResult && (
            <div className={`${styles.pushResult} ${pushResult.ok ? styles.pushOk : styles.pushErr}`}>
              {pushResult.msg}
            </div>
          )}
        </div>

      </div>

      {/* ── Whitelist emails ── */}
      <div className={styles.card}>
        <div className={styles.cardTitle}><IconLock /> Whitelist emails — Google OAuth</div>
        <div className={styles.cardDesc}>
          Adresses email autorisées à se connecter via Google OAuth.
        </div>

        {allowedEmails.length === 0 ? (
          <div className={styles.emptyState}>Aucune adresse autorisée.</div>
        ) : (
          <ul className={styles.emailList}>
            {allowedEmails.map(e => (
              <li key={e.id} className={styles.emailItem}>
                <div>
                  <span className={styles.emailAddr}>{e.email}</span>
                  {e.addedBy && (
                    <span className={styles.emailMeta}>{' '}· ajouté par {e.addedBy}</span>
                  )}
                </div>
                <button
                  type="button"
                  className={styles.btnSmallDanger}
                  onClick={() => removeEmail(e.email)}
                >
                  Retirer
                </button>
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={addEmail}>
          <div className={styles.formRow}>
            <input
              type="email"
              className={styles.input}
              placeholder="nouvel.email@example.com"
              aria-label="Nouvelle adresse email à autoriser"
              value={newEmail}
              onChange={e => setNewEmail(e.target.value)}
              required
            />
            <button type="submit" className={styles.btnPrimary} disabled={addEmailLoading}>
              {addEmailLoading ? '…' : 'Ajouter'}
            </button>
          </div>
          {addEmailError && (
            <div className={styles.errorState} style={{ marginTop: '.5rem', padding: '.4rem .8rem' }}>
              {addEmailError}
            </div>
          )}
        </form>
      </div>

    </div>
  );
}
