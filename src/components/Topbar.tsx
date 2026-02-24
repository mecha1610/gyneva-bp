'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/stores/useAppStore';
import { useSimStore } from '@/stores/useSimStore';
import { DEFAULT_BUSINESS_PLAN_DATA } from '@lib/constants';
import styles from './Topbar.module.css';

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
        >
          <span
            className={`${styles.statusDot} ${isLive ? styles.live : styles.staticDot}`}
          />
          <span className={styles.planName}>
            {isLive ? (importFileName ?? 'Importé') : (currentPlan?.name ?? 'Plan initial')}
          </span>
          {' ▾'}
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
        {theme === 'light' ? '🌙' : '☀️'}
      </button>

      {/* Actions dropdown */}
      <div className={styles.actionsWrap} ref={menuRef}>
        <button
          className={styles.actionsBtn}
          onClick={() => setActionsOpen(o => !o)}
          aria-expanded={actionsOpen}
        >
          Actions ▾
        </button>
        {actionsOpen && (
          <div className={styles.actionsMenu} role="menu">
            <button role="menuitem" onClick={() => { fileInputRef.current?.click(); setActionsOpen(false); }}>
              📄 Importer Excel
            </button>
            <button role="menuitem" onClick={() => setActionsOpen(false)}>
              🕘 Versions
            </button>
            <button role="menuitem" onClick={() => setActionsOpen(false)}>
              📈 Comparer
            </button>
            <hr className={styles.menuDivider} />
            <button
              role="menuitem"
              className={styles.menuItemPrimary}
              onClick={() => setActionsOpen(false)}
            >
              🖨 Export PDF
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
        <button className={styles.logoutBtn} onClick={handleLogout}>
          Déconnexion
        </button>
      </div>
    </header>
  );
}
