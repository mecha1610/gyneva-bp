'use client';

import dynamic from 'next/dynamic';
import { useSimStore } from '@/stores/useSimStore';
import { computeDerived } from '@lib/compute';
import styles from './page.module.css';
import PageHeader from '@/components/PageHeader';
import KpiSkeleton from '@/components/KpiSkeleton';

const ScenarioChart  = dynamic(() => import('./CashflowChart').then(m => ({ default: m.ScenarioChart })),  { ssr: false, loading: () => <div className={styles.chartSkeleton} /> });
const MonthlyNetChart = dynamic(() => import('./CashflowChart').then(m => ({ default: m.MonthlyNetChart })), { ssr: false, loading: () => <div className={styles.chartSkeleton} /> });

// ── SVG Icons ───────────────────────────────────────────────────────────────

function IconCheck() { return <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 11 4 16"/></svg>; }
function IconAlert() { return <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>; }
function IconX() { return <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>; }
function IconActivity() { return <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>; }

// ── Helpers ────────────────────────────────────────────────────────────────

function fmt(v: number): string {
  if (Math.abs(v) >= 1_000_000) return 'CHF ' + (v / 1_000_000).toFixed(1) + 'M';
  if (Math.abs(v) >= 1_000) return 'CHF ' + Math.round(v / 1_000) + 'k';
  return 'CHF ' + Math.round(v);
}

function bfrColor(v: number): string {
  return v >= -50_000 ? styles.kpiValueGreen : v >= -150_000 ? styles.kpiValueOrange : styles.kpiValueRed;
}

function scenarioBorderClass(bfr: number): string {
  return bfr >= -50_000 ? styles.scenarioCardGreen : bfr >= -150_000 ? styles.scenarioCardOrange : styles.scenarioCardRed;
}

// ── Component ──────────────────────────────────────────────────────────────

export default function CashflowPage() {
  const isHydrated    = useSimStore(s => s.isHydrated);
  const planData      = useSimStore(s => s.planData);
  const activeYear    = useSimStore(s => s.cfActiveYear);
  const setActiveYear = useSimStore(s => s.setActiveYear);
  const D             = computeDerived(planData);

  if (!isHydrated) {
    return (
      <div>
        <PageHeader title="Trésorerie & Cashflow" subtitle="Scénarios de liquidité sur 36 mois" />
        <KpiSkeleton count={4} gridClassName={styles.kpiGrid} />
      </div>
    );
  }

  // ── Period bounds ────────────────────────────────────────────────────────

  const startM = activeYear === 'all' ? 0  : (Number(activeYear) - 1) * 12;
  const endM   = activeYear === 'all' ? 36 : Number(activeYear) * 12;

  // ── Scenario arrays ──────────────────────────────────────────────────────

  const scenarios = [
    { key: 'baseline',   label: 'Baseline',         desc: 'Encaissements directs', color: '#10b981', arr: planData.cashflow },
    { key: 'cash1m',     label: 'LAMal 1 mois',     desc: '1 mois de délai',       color: '#2563eb', arr: D.tresoCash1m },
    { key: 'cash3m',     label: 'LAMal 3 mois',     desc: '3 mois de délai',       color: '#ef4444', arr: D.tresoCash3m },
    { key: 'factoring',  label: 'Affacturage',      desc: 'Frais 1,5 %',           color: '#0f2b46', arr: D.tresoFact },
  ];

  function scenarioBfr(arr: number[]) {
    return Math.min(...arr.slice(startM, endM));
  }

  function firstNegativeMonth(arr: number[]): string {
    const idx = arr.findIndex(v => v < 0);
    return idx < 0 ? 'Aucun' : `M${idx + 1}`;
  }

  function scenarioFinal(arr: number[]) {
    return arr[endM - 1] ?? 0;
  }

  // ── KPIs (use worst-case = tresoCash3m as reference) ─────────────────────

  const bfrWorst  = scenarioBfr(D.tresoCash3m);
  const tresoFin  = planData.cashflow[endM - 1] ?? 0;
  const critMonth = firstNegativeMonth(D.tresoCash3m);

  const caSlice     = planData.ca.slice(startM, endM).reduce((a, b) => a + b, 0);
  const costsSlice  = planData.admin.slice(startM, endM).reduce((a, b) => a + Math.abs(b), 0)
                    + planData.opex.slice(startM, endM).reduce((a, b) => a + Math.abs(b), 0)
                    + planData.lab.slice(startM, endM).reduce((a, b) => a + Math.abs(b), 0);
  const ratio = costsSlice > 0 ? (caSlice / costsSlice).toFixed(2) : 'N/A';

  // ── Verdict ──────────────────────────────────────────────────────────────

  const verdictColor = bfrWorst >= -50_000 ? 'Green' : bfrWorst >= -150_000 ? 'Orange' : 'Red';
  const VerdictIcon  = bfrWorst >= -50_000 ? IconCheck : bfrWorst >= -150_000 ? IconAlert : IconX;
  const verdictText  =
    bfrWorst >= -50_000
      ? `Trésorerie maîtrisée — BFR minimum ${fmt(bfrWorst)}, premier mois négatif : ${critMonth}.`
      : bfrWorst >= -150_000
      ? `Trésorerie sous surveillance — BFR minimum ${fmt(bfrWorst)} (scénario 3 mois). Prévoir financement court terme.`
      : `Tension de trésorerie élevée — BFR minimum ${fmt(bfrWorst)}. Affacturage ou ligne de crédit recommandés.`;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div>

      <PageHeader title="Trésorerie & Cashflow" subtitle="Scénarios de liquidité sur 36 mois" />

      {/* Verdict */}
      <div className={`${styles.verdict} ${styles[`verdict${verdictColor}`]}`}>
        <div className={styles.ic}><VerdictIcon /></div>
        <div className={styles.verdictBody}><strong>Analyse de trésorerie.</strong>{' '}{verdictText}</div>
      </div>

      {/* Year tabs */}
      <div className={styles.controls}>
        <div className={styles.yearBtns}>
          {(['all', '1', '2', '3'] as const).map(y => (
            <button
              key={y}
              className={`${styles.yearBtn} ${activeYear === y ? styles.yearBtnActive : ''}`}
              onClick={() => setActiveYear('cashflow', y)}
            >
              {y === 'all' ? 'Vue 3 ans' : `Année ${y}`}
            </button>
          ))}
        </div>
      </div>

      {/* KPI grid */}
      <div className={styles.kpiGrid}>
        <div className={`${styles.kpi} ${tresoFin >= 0 ? styles.kpiGreen : styles.kpiRed}`}>
          <div className={styles.kpiLabel}>Trésorerie finale</div>
          <div className={`${styles.kpiValue} ${tresoFin >= 0 ? styles.kpiValueGreen : styles.kpiValueRed}`} title={fmt(tresoFin)}>
            {fmt(tresoFin)}
          </div>
          <div className={styles.kpiSub}>Fin de période (baseline)</div>
        </div>
        <div className={`${styles.kpi} ${bfrWorst >= -50_000 ? styles.kpiGreen : bfrWorst >= -150_000 ? styles.kpiOrange : styles.kpiRed}`}>
          <div className={styles.kpiLabel}>BFR minimum</div>
          <div className={`${styles.kpiValue} ${bfrColor(bfrWorst)}`} title={fmt(bfrWorst)}>{fmt(bfrWorst)}</div>
          <div className={styles.kpiSub}>Pire scénario (LAMal 3 mois)</div>
        </div>
        <div className={`${styles.kpi} ${critMonth === 'Aucun' ? styles.kpiGreen : styles.kpiOrange}`}>
          <div className={styles.kpiLabel}>1er mois négatif</div>
          <div className={`${styles.kpiValue} ${critMonth === 'Aucun' ? styles.kpiValueGreen : styles.kpiValueOrange}`}>
            {critMonth}
          </div>
          <div className={styles.kpiSub}>Scénario LAMal 3 mois</div>
        </div>
        <div className={`${styles.kpi} ${styles.kpiBlue}`}>
          <div className={styles.kpiLabel}>Ratio encaiss. / décaiss.</div>
          <div className={styles.kpiValue}>{ratio}×</div>
          <div className={styles.kpiSub}>CA / charges totales</div>
        </div>
      </div>

      {/* Scenario cards */}
      <div className={styles.scenarioGrid}>
        {scenarios.map(sc => {
          const bfr   = scenarioBfr(sc.arr);
          const final = scenarioFinal(sc.arr);
          const neg   = firstNegativeMonth(sc.arr);
          return (
            <div key={sc.key} className={`${styles.scenarioCard} ${scenarioBorderClass(bfr)}`}>
              <div className={styles.scenarioName}>
                <span className={styles.scenarioDot} style={{ background: sc.color }} />
                {sc.label}
              </div>
              <div className={styles.scenarioRow}>
                <span className={styles.scenarioRowLabel}>BFR min</span>
                <span className={`${styles.scenarioRowValue} ${bfr >= -50_000 ? styles.scenarioRowValueGreen : styles.scenarioRowValueRed}`}>
                  {fmt(bfr)}
                </span>
              </div>
              <div className={styles.scenarioRow}>
                <span className={styles.scenarioRowLabel}>Tréso. finale</span>
                <span className={`${styles.scenarioRowValue} ${final >= 0 ? styles.scenarioRowValueGreen : styles.scenarioRowValueRed}`}>
                  {fmt(final)}
                </span>
              </div>
              <div className={styles.scenarioRow}>
                <span className={styles.scenarioRowLabel}>1er mois −</span>
                <span className={styles.scenarioRowValue}>{neg}</span>
              </div>
              <div className={styles.scenarioRow}>
                <span className={styles.scenarioRowLabel} style={{ fontStyle: 'italic' }}>{sc.desc}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Scenario line chart */}
      <div className={styles.card}>
        <div className={styles.cardTitle}>
          <IconActivity /> Trésorerie cumulée — comparaison scénarios
          {activeYear !== 'all' && ` · Année ${activeYear}`}
        </div>
        <div className={styles.chartBox}>
          <ScenarioChart
            baseline={planData.cashflow}
            tresoCash1m={D.tresoCash1m}
            tresoCash3m={D.tresoCash3m}
            tresoFact={D.tresoFact}
            activeYear={activeYear}
          />
        </div>
      </div>

      {/* Monthly net bar chart */}
      <div className={styles.card}>
        <div className={styles.cardTitle}>
          <IconActivity /> Flux net mensuel (CA − charges)
          {activeYear !== 'all' && ` · Année ${activeYear}`}
        </div>
        <div className={styles.chartBoxSm}>
          <MonthlyNetChart
            ca={planData.ca}
            admin={planData.admin}
            opex={planData.opex}
            lab={planData.lab}
            activeYear={activeYear}
          />
        </div>
      </div>

    </div>
  );
}
