'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/stores/useAppStore';
import { useSimStore } from '@/stores/useSimStore';
import { DEFAULT_BUSINESS_PLAN_DATA } from '@lib/constants';
import styles from './Topbar.module.css';

const IconMoon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
);

const IconSun = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="5"/>
    <line x1="12" y1="1" x2="12" y2="3"/>
    <line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/>
    <line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
);

const IconUpload = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="16 16 12 12 8 16"/>
    <line x1="12" y1="12" x2="12" y2="21"/>
    <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
  </svg>
);

const IconClock = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
);

const IconDownload = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="8 17 12 21 16 17"/>
    <line x1="12" y1="12" x2="12" y2="21"/>
    <path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.83"/>
  </svg>
);

const IconChevronDown = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);

interface Props {
  userName?: string;
  userPicture?: string;
}

export default function Topbar({ userName, userPicture }: Props) {
  const router = useRouter();
  const [actionsOpen, setActionsOpen] = useState(false);
  const [planDropOpen, setPlanDropOpen] = useState(false);
  const menuRef    = useRef<HTMLDivElement>(null);
  const planRef    = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const theme         = useAppStore(s => s.theme);
  const setTheme      = useAppStore(s => s.setTheme);
  const allPlans      = useAppStore(s => s.allPlans);
  const currentPlanId = useAppStore(s => s.currentPlanId);
  const setCurrentPlanId = useAppStore(s => s.setCurrentPlanId);
  const importStatus  = useAppStore(s => s.importStatus);
  const importFileName = useAppStore(s => s.importFileName);
  const setImportStatus = useAppStore(s => s.setImportStatus);
  const loadPlanData  = useSimStore(s => s.loadPlanData);

  const currentPlan = allPlans.find(p => p.id === currentPlanId) ?? allPlans[0];

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActionsOpen(false);
      }
      if (planRef.current && !planRef.current.contains(e.target as Node)) {
        setPlanDropOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function toggleTheme() {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next === 'dark' ? 'dark' : '');
  }

  async function handleLogout() {
    await fetch('/api/auth?action=logout', { method: 'POST' });
    router.replace('/login');
  }

  const handleSwitchPlan = useCallback(async (planId: string) => {
    setPlanDropOpen(false);
    const plan = allPlans.find(p => p.id === planId);
    if (!plan) return;
    setCurrentPlanId(planId);
    loadPlanData({
      ...plan.data,
      consultDay: plan.consultDay,
      fee: plan.fee,
      daysYear: plan.daysYear,
      revSpec: plan.revSpec,
      capex: plan.capex,
    });
  }, [allPlans, setCurrentPlanId, loadPlanData]);

  async function handleFileImport(file: File) {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = btoa(String.fromCharCode(...new Uint8Array(e.target?.result as ArrayBuffer)));
      try {
        const res = await fetch('/api/import/excel', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ file: base64, filename: file.name }),
        });
        if (res.ok) {
          const json = await res.json();
          loadPlanData({ ...DEFAULT_BUSINESS_PLAN_DATA, ...json.data });
          setImportStatus('live', file.name);
        }
      } catch (e) {
        console.error('Excel import failed', e);
      }
    };
    reader.readAsArrayBuffer(file);
  }

  const isLive = importStatus === 'live';

  return (
    <header className={styles.topbar}>
      {/* Plan switcher */}
      <div className={styles.planWrap} ref={planRef}>
        <button
          className={styles.planBtn}
          onClick={() => setPlanDropOpen(o => !o)}
          aria-expanded={planDropOpen}
        >
          <span
            className={`${styles.statusDot} ${isLive ? styles.live : styles.staticDot}`}
          />
          <span className={styles.planName}>
            {isLive ? (importFileName ?? 'Importé') : (currentPlan?.name ?? 'Plan initial')}
          </span>
          <IconChevronDown />
        </button>
        {planDropOpen && allPlans.length > 0 && (
          <div className={styles.planDropdown}>
            {allPlans.map(p => (
              <button
                key={p.id}
                className={`${styles.planItem} ${p.id === currentPlanId ? styles.activePlan : ''}`}
                onClick={() => handleSwitchPlan(p.id)}
              >
                {p.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className={styles.spacer} />

      {/* Theme toggle */}
      <button
        className={styles.iconBtn}
        onClick={toggleTheme}
        title="Basculer thème"
        aria-label="Basculer thème clair/sombre"
      >
        {theme === 'light' ? <IconMoon /> : <IconSun />}
      </button>

      {/* Actions dropdown */}
      <div className={styles.actionsWrap} ref={menuRef}>
        <button
          className={styles.actionsBtn}
          onClick={() => setActionsOpen(o => !o)}
          aria-expanded={actionsOpen}
        >
          Actions <IconChevronDown />
        </button>
        {actionsOpen && (
          <div className={styles.actionsMenu} role="menu">
            <button role="menuitem" onClick={() => { fileInputRef.current?.click(); setActionsOpen(false); }}>
              <IconUpload /> Importer Excel
            </button>
            <button role="menuitem" onClick={() => setActionsOpen(false)}>
              <IconClock /> Historique des versions
            </button>
            <hr className={styles.menuDivider} />
            <button
              role="menuitem"
              className={styles.menuItemPrimary}
              onClick={() => setActionsOpen(false)}
              title="Export PDF (fonctionnalité à venir)"
            >
              <IconDownload /> Export PDF
            </button>
          </div>
        )}
      </div>

      {/* Hidden file input for Excel import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        style={{ display: 'none' }}
        onChange={e => {
          const f = e.target.files?.[0];
          if (f) handleFileImport(f);
          e.target.value = '';
        }}
      />

      {/* User avatar / logout */}
      <div className={styles.userArea}>
        {userPicture ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={userPicture} alt={userName ?? 'User'} className={styles.avatar} />
        ) : (
          <div className={styles.avatarPlaceholder}>
            {(userName ?? 'U')[0].toUpperCase()}
          </div>
        )}
        {userName && (
          <span className={styles.userName}>{userName}</span>
        )}
        <button className={styles.logoutBtn} onClick={handleLogout}>
          Déconnexion
        </button>
      </div>
    </header>
  );
}
