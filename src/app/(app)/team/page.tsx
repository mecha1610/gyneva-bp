'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { useSimStore } from '@/stores/useSimStore';
import styles from './page.module.css';

const EtpChart          = dynamic(() => import('./TeamChart').then(m => ({ default: m.EtpChart })),          { ssr: false });
const ProductivityChart = dynamic(() => import('./TeamChart').then(m => ({ default: m.ProductivityChart })), { ssr: false });

// ── Helpers ────────────────────────────────────────────────────────────────

function fmt(v: number): string {
  if (Math.abs(v) >= 1_000_000) return 'CHF ' + (v / 1_000_000).toFixed(1) + 'M';
  if (Math.abs(v) >= 1_000) return 'CHF ' + Math.round(v / 1_000) + 'k';
  return 'CHF ' + Math.round(v);
}

function avg(arr: number[], s: number, e: number): number {
  const sl = arr.slice(s, e).filter(v => v > 0);
  return sl.length ? sl.reduce((a, b) => a + b, 0) / sl.length : 0;
}

function sum(arr: number[], s: number, e: number): number {
  return arr.slice(s, e).reduce((a, b) => a + b, 0);
}

function firstNonZeroMonth(arr: number[], offset = 0): string {
  const idx = arr.findIndex(v => v > 0);
  return idx < 0 ? '—' : `M${offset + idx + 1}`;
}

// ── Profile config ─────────────────────────────────────────────────────────

const PROFILES = [
  { key: 'assoc'   as const, label: 'Associés',       color: '#0f2b46', fteKey: 'fteAssoc'   as const, caKey: 'caAssoc'   as const },
  { key: 'indep'   as const, label: 'Indépendants',   color: '#1a4a7a', fteKey: 'fteIndep'   as const, caKey: 'caIndep'   as const },
  { key: 'interne' as const, label: 'Internes',       color: '#5dade2', fteKey: 'fteInterne' as const, caKey: 'caInterne' as const },
  { key: 'admin'   as const, label: 'Administratifs', color: '#aed6f1', fteKey: 'fteAdmin'   as const, caKey: null },
] as const;

// ── Component ──────────────────────────────────────────────────────────────

export default function TeamPage() {
  const planData      = useSimStore(s => s.planData);
  const activeYear    = useSimStore(s => s.teamActiveYear);
  const setActiveYear = useSimStore(s => s.setActiveYear);

  const [showProd, setShowProd] = useState(true);

  // ── Period bounds ────────────────────────────────────────────────────────

  const startM = activeYear === 'all' ? 0  : (Number(activeYear) - 1) * 12;
  const endM   = activeYear === 'all' ? 36 : Number(activeYear) * 12;

  // ── KPI values ───────────────────────────────────────────────────────────

  const fteEnd   = planData.fteTotal[endM - 1] ?? 0;
  const fteStart = planData.fteTotal[startM] ?? 0;

  const caTotal  = sum(planData.ca, startM, endM);
  const avgFte   = avg(planData.fteTotal, startM, endM);
  const caPerFte = avgFte > 0 ? Math.round(caTotal / avgFte) : 0;

  const avgAdmin = avg(planData.fteAdmin, startM, endM);
  const avgPrat  = avg(
    planData.fteAssoc.map((v, i) => v + planData.fteIndep[i] + planData.fteInterne[i]),
    startM, endM,
  );
  const ratioAdmin = avgPrat > 0 ? (avgAdmin / avgPrat).toFixed(2) : '—';

  const ftePctGrowth = fteStart > 0
    ? Math.round((fteEnd - fteStart) / fteStart * 100)
    : fteEnd > 0 ? 100 : 0;

  // ── Verdict ──────────────────────────────────────────────────────────────

  let verdictColor: 'Green' | 'Orange' | 'Red';
  let verdictText: string;

  if (activeYear === '1') {
    verdictColor = 'Orange';
    verdictText = `Démarrage — ${fteEnd} ETP en fin d'année 1. Phase de recrutement et montée en charge.`;
  } else if (activeYear === '2') {
    verdictColor = 'Green';
    verdictText = `Croissance — ${fteEnd} ETP en fin d'année 2, CA/ETP moyen ${fmt(caPerFte)}.`;
  } else if (activeYear === '3') {
    verdictColor = fteEnd >= 14 ? 'Green' : fteEnd >= 8 ? 'Orange' : 'Red';
    verdictText = `Croisière — ${fteEnd} ETP en fin d'année 3, productivité ${fmt(caPerFte)} CA/ETP.`;
  } else {
    verdictColor = fteEnd >= 14 ? 'Green' : fteEnd >= 8 ? 'Orange' : 'Red';
    verdictText =
      fteEnd >= 14
        ? `Équipe complète — ${fteEnd} ETP à terme, croissance ${ftePctGrowth > 0 ? '+' : ''}${ftePctGrowth}% sur 3 ans, CA/ETP ${fmt(caPerFte)}.`
        : fteEnd >= 8
        ? `Équipe en construction — ${fteEnd} ETP à terme. Renforcement prévu sur l'horizon.`
        : `Équipe réduite — ${fteEnd} ETP. Recrutement critique pour atteindre les objectifs de CA.`;
  }

  const verdictIcon = verdictColor === 'Green' ? '👥' : verdictColor === 'Orange' ? '⚠️' : '❌';

  // ── Total ETP at Y3 (for proportional bars) ───────────────────────────────

  const totalY3Fte = planData.fteTotal[35] ?? 1;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div>

      {/* Verdict */}
      <div className={`${styles.verdict} ${styles[`verdict${verdictColor}`]}`}>
        <div className={styles.verdictIc}>{verdictIcon}</div>
        <div><strong>Analyse de l&apos;équipe.</strong>{' '}{verdictText}</div>
      </div>

      {/* Controls */}
      <div className={styles.controls}>
        <div className={styles.yearBtns}>
          {(['all', '1', '2', '3'] as const).map(y => (
            <button
              key={y}
              className={`${styles.yearBtn} ${activeYear === y ? styles.yearBtnActive : ''}`}
              onClick={() => setActiveYear('team', y)}
            >
              {y === 'all' ? 'Vue 3 ans' : `Année ${y}`}
            </button>
          ))}
        </div>
        <div className={styles.toggleWrap}>
          Productivité
          <label className={styles.toggle}>
            <input type="checkbox" checked={showProd} onChange={e => setShowProd(e.target.checked)} />
            <span className={styles.toggleSlider} />
          </label>
        </div>
      </div>

      {/* KPI grid */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpi}>
          <div className={styles.kpiLabel}>ETP total</div>
          <div className={styles.kpiValue}>{fteEnd}</div>
          <div className={styles.kpiSub}>Fin de période</div>
        </div>
        <div className={`${styles.kpi} ${styles.kpiGreen}`}>
          <div className={styles.kpiLabel}>CA / ETP</div>
          <div className={`${styles.kpiValue} ${styles.kpiValueGreen}`}>{fmt(caPerFte)}</div>
          <div className={styles.kpiSub}>Productivité moyenne</div>
        </div>
        <div className={styles.kpi}>
          <div className={styles.kpiLabel}>Ratio admin / praticiens</div>
          <div className={styles.kpiValue}>{ratioAdmin}</div>
          <div className={styles.kpiSub}>Ratio overhead</div>
        </div>
        <div className={`${styles.kpi} ${styles.kpiBlue}`}>
          <div className={styles.kpiLabel}>Croissance ETP</div>
          <div className={styles.kpiValue}>
            {ftePctGrowth > 0 ? '+' : ''}{ftePctGrowth}%
          </div>
          <div className={styles.kpiSub}>Sur la période</div>
        </div>
      </div>

      {/* Profile cards */}
      <div className={styles.profileGrid}>
        {PROFILES.map(p => {
          const fteArr = planData[p.fteKey];
          const fteEndVal = fteArr[endM - 1] ?? 0;
          const fteY1 = fteArr[11] ?? 0;
          const fteY2 = fteArr[23] ?? 0;
          const fteY3 = fteArr[35] ?? 0;
          const startMonth = firstNonZeroMonth(fteArr);
          const pctOfTotal = totalY3Fte > 0 ? Math.round(fteY3 / totalY3Fte * 100) : 0;
          const caVal = p.caKey ? sum(planData[p.caKey], startM, endM) : null;

          return (
            <div key={p.key} className={styles.profileCard}>
              <div className={styles.profileCardHeader}>
                <span className={styles.profileDot} style={{ background: p.color }} />
                <span className={styles.profileName}>{p.label}</span>
                <span className={styles.profileFteEnd}>
                  {fteEndVal} <span className={styles.profileFteLabel}>ETP</span>
                </span>
              </div>
              <div className={styles.profileCardBody}>
                <div className={styles.profileRow}>
                  <span className={styles.profileRowLabel}>1er recrutement</span>
                  <span className={styles.profileRowValue}>{startMonth}</span>
                </div>
                <div className={styles.profileRow}>
                  <span className={styles.profileRowLabel}>ETP fin Y1</span>
                  <span className={styles.profileRowValue}>{fteY1}</span>
                </div>
                <div className={styles.profileRow}>
                  <span className={styles.profileRowLabel}>ETP fin Y2</span>
                  <span className={styles.profileRowValue}>{fteY2}</span>
                </div>
                <div className={styles.profileRow}>
                  <span className={styles.profileRowLabel}>ETP fin Y3</span>
                  <span className={styles.profileRowValue}>{fteY3}</span>
                </div>
                <div className={styles.profileRow}>
                  <span className={styles.profileRowLabel}>
                    {caVal !== null ? 'CA période' : 'Type'}
                  </span>
                  <span className={styles.profileRowValue} style={{ fontSize: '.72rem' }}>
                    {caVal !== null ? fmt(caVal) : '— (coût)'}
                  </span>
                </div>
                <div className={styles.profileBar}>
                  <div
                    className={styles.profileBarFill}
                    style={{ width: `${pctOfTotal}%`, background: p.color }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ETP stacked bar chart */}
      <div className={styles.card}>
        <div className={styles.cardTitle}>
          👤 Montée en charge de l&apos;équipe (ETP)
          {activeYear !== 'all' && ` — Année ${activeYear}`}
        </div>
        <div className={styles.chartBox}>
          <EtpChart
            fteAssoc={planData.fteAssoc}
            fteIndep={planData.fteIndep}
            fteInterne={planData.fteInterne}
            fteAdmin={planData.fteAdmin}
            activeYear={activeYear}
          />
        </div>
      </div>

      {/* Productivity chart (conditional) */}
      {showProd && (
        <div className={styles.card}>
          <div className={styles.cardTitle}>
            📈 Productivité — CA par ETP
            {activeYear !== 'all' && ` — Année ${activeYear}`}
          </div>
          <div className={styles.chartBoxSm}>
            <ProductivityChart
              ca={planData.ca}
              fteTotal={planData.fteTotal}
              activeYear={activeYear}
            />
          </div>
        </div>
      )}

    </div>
  );
}
