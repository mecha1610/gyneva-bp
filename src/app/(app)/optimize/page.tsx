'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { useSimStore } from '@/stores/useSimStore';
import { FACT_COST } from '@lib/constants';
import styles from './page.module.css';
import PageHeader from '@/components/PageHeader';

const OptimizeChart = dynamic(
  () => import('./OptimizeChart').then(m => ({ default: m.OptimizeChart })),
  { ssr: false, loading: () => <div className={styles.chartSkeleton} /> },
);

// ── SVG Icons ──────────────────────────────────────────────────────────────

function IconLightbulb() { return <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="9" y1="18" x2="15" y2="18"/><line x1="10" y1="22" x2="14" y2="22"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/></svg>; }
function IconAlert() { return <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>; }
function IconX() { return <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>; }
function IconTrending() { return <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>; }
function IconLightbulbSm() { return <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="9" y1="18" x2="15" y2="18"/><line x1="10" y1="22" x2="14" y2="22"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/></svg>; }
function IconAlertSm() { return <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>; }

// ── cashflow scenario engine (mirrors computeOptScenario in index.html) ────

function computeOptScenario(
  ca: number[], admin: number[], opex: number[], lab: number[],
  cashPct: number, delay: number, factoring: boolean,
): number[] {
  const arr: number[] = [];
  let cum = 0;
  for (let m = 0; m < 36; m++) {
    let cashIn = ca[m] * cashPct;
    if (factoring) {
      cashIn += ca[m] * (1 - cashPct) * (1 - FACT_COST);
    } else if (m >= delay) {
      cashIn += ca[m - delay] * (1 - cashPct);
    }
    cum += cashIn + admin[m] + opex[m] + lab[m];
    arr.push(cum);
  }
  return arr;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function fmt(v: number): string {
  if (Math.abs(v) >= 1_000_000) return 'CHF ' + (v / 1_000_000).toFixed(1) + 'M';
  if (Math.abs(v) >= 1_000) return 'CHF ' + Math.round(v / 1_000) + 'k';
  return 'CHF ' + Math.round(v);
}

function sliderGradient(val: number, min: number, max: number) {
  const pct = ((val - min) / (max - min)) * 100;
  return `linear-gradient(to right, var(--pl) ${pct}%, var(--brd2) ${pct}%)`;
}

// ── Component ──────────────────────────────────────────────────────────────

export default function OptimizePage() {
  const planData = useSimStore(s => s.planData);
  const inputs   = useSimStore(s => s.inputs);

  // Local controls — independent from simulator
  const [factoring, setFactoring] = useState(inputs.factoring);
  const [cashPct,   setCashPct]   = useState(inputs.cashPct);           // 0-30
  const [delay,     setDelay]     = useState<0 | 1 | 3>(
    ([0, 1, 3].includes(inputs.delay) ? inputs.delay : 1) as 0 | 1 | 3,
  );

  const { ca, admin, opex, lab, result } = planData;
  const cp = cashPct / 100;

  // ── 4 fixed comparison scenarios ─────────────────────────────────────────

  const worstData    = computeOptScenario(ca, admin, opex, lab, 0,  3, false);
  const cashOnlyData = computeOptScenario(ca, admin, opex, lab, cp, 3, false);
  const cash1mData   = computeOptScenario(ca, admin, opex, lab, cp, 1, false);
  const factData     = computeOptScenario(ca, admin, opex, lab, cp, 0, true);

  // Current config BFR
  const currentData = factoring
    ? factData
    : computeOptScenario(ca, admin, opex, lab, cp, delay, false);

  const bfrWorst   = Math.min(...worstData);
  const bfrCurrent = Math.min(...currentData);
  const bfrFact    = Math.min(...factData);
  const saved      = Math.abs(bfrWorst) - Math.abs(bfrCurrent);

  const caY3           = ca.slice(24, 36).reduce((a, b) => a + b, 0);
  const resY3          = result.slice(24, 36).reduce((a, b) => a + b, 0);
  const factCostAnnual = factoring ? caY3 * (1 - cp) * FACT_COST : 0;

  // Which fixed scenario best matches the current config
  const matchIdx = factoring ? 3 : delay === 3 ? (cashPct > 0 ? 1 : 0) : delay === 1 ? 2 : -1;

  // ── Verdict ───────────────────────────────────────────────────────────────

  const verdictColor: 'Green' | 'Orange' | 'Red' =
    (factoring && cashPct >= 10) || factoring ? 'Green' :
    cashPct >= 10                             ? 'Orange' :
    delay >= 3                                ? 'Red'    : 'Orange';

  const VerdictIcon = verdictColor === 'Green' ? IconLightbulb : verdictColor === 'Orange' ? IconAlert : IconX;
  const verdictText =
    factoring && cashPct >= 10
      ? `Configuration optimale — factoring actif + ${cashPct}% cash. BFR réduit de ${fmt(Math.abs(saved))}.`
      : factoring
      ? `Factoring actif — encaissement immédiat des créances LAMal. Trésorerie sécurisée.`
      : cashPct >= 10
      ? `${cashPct}% paiements cash — bonne pratique, mais le factoring réduirait encore le BFR de ${fmt(Math.abs(bfrCurrent) - Math.abs(bfrFact))}.`
      : `Risque ${delay >= 3 ? 'élevé' : 'modéré'} — délai LAMal ${delay} mois sans factoring. BFR actuel ${fmt(bfrCurrent)}.`;

  // ── Recommendation ────────────────────────────────────────────────────────

  const recoPositive = factoring;
  const recoText = factoring
    ? (() => {
        const roi = factCostAnnual > 0 ? Math.round((saved / factCostAnnual) * 10) / 10 : 0;
        return `Coût factoring estimé ~${fmt(factCostAnnual)}/an. BFR économisé ${fmt(Math.abs(saved))}${roi > 0 ? ` — ROI ${roi}x` : ''}.`;
      })()
    : `BFR actuel ${fmt(bfrCurrent)} → avec factoring : ${fmt(bfrFact)}. Économie potentielle ${fmt(Math.max(0, Math.abs(bfrCurrent) - Math.abs(bfrFact)))}.`;

  // ── 4 scenario cards data ─────────────────────────────────────────────────

  const scenarioCards = [
    {
      title:   'Pire cas',
      sub:     'LAMal 3m · pas de cash · pas de factoring',
      data:    worstData,
      color:   '#d63031',
      idx:     0,
    },
    {
      title:   `Cash ${cashPct}% + LAMal 3m`,
      sub:     'Paiements cash partiels uniquement',
      data:    cashOnlyData,
      color:   '#e17055',
      idx:     1,
    },
    {
      title:   `Cash ${cashPct}% + LAMal 1m`,
      sub:     'Délai réduit à 1 mois',
      data:    cash1mData,
      color:   '#fdcb6e',
      idx:     2,
    },
    {
      title:   `Cash ${cashPct}% + Factoring`,
      sub:     'Encaissement immédiat des créances',
      data:    factData,
      color:   '#00b894',
      idx:     3,
    },
  ];

  function bfrTag(bfr: number) {
    if (bfr < -150_000) return { cls: styles.scTagRed,    label: 'Risque élevé'  };
    if (bfr <  -50_000) return { cls: styles.scTagOrange, label: 'Modéré'        };
    return                     { cls: styles.scTagGreen,  label: 'Sécurisé'      };
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div>

      <PageHeader title="Optimisation trésorerie" subtitle="Comparaison des scénarios de recouvrement LAMal sur 36 mois" />

      {/* Verdict */}
      <div className={`${styles.verdict} ${styles[`verdict${verdictColor}`]}`}>
        <div className={styles.ic}><VerdictIcon /></div>
        <div className={styles.verdictBody}><strong>Optimisation trésorerie.</strong>{' '}{verdictText}</div>
      </div>

      {/* Controls */}
      <div className={styles.controls}>
        <div className={styles.ctrlItem}>
          <span>Factoring</span>
          <label className={styles.toggle}>
            <input
              type="checkbox"
              checked={factoring}
              onChange={e => setFactoring(e.target.checked)}
              aria-label="Activer le factoring"
            />
            <span className={styles.toggleSlider} />
          </label>
          <span className={styles.ctrlVal}>{factoring ? 'ON' : 'OFF'}</span>
        </div>

        <div className={styles.ctrlItem}>
          <span>Cash OI/ONU</span>
          <input
            type="range"
            className={styles.slider}
            min={0} max={30} step={1}
            value={cashPct}
            style={{ background: sliderGradient(cashPct, 0, 30) }}
            onChange={e => setCashPct(Number(e.target.value))}
            aria-label="Pourcentage de paiements cash OI/ONU"
          />
          <span className={styles.ctrlVal}>{cashPct}%</span>
        </div>

        <div className={styles.ctrlItem}>
          <span>Délai LAMal</span>
          <select
            className={styles.select}
            value={delay}
            onChange={e => setDelay(Number(e.target.value) as 0 | 1 | 3)}
            aria-label="Délai de recouvrement LAMal"
          >
            <option value={0}>Sans délai</option>
            <option value={1}>1 mois</option>
            <option value={3}>3 mois</option>
          </select>
        </div>
      </div>

      {/* KPI grid */}
      <div className={styles.kpiGrid}>
        <div className={`${styles.kpi} ${styles.kpiRed}`}>
          <div className={styles.kpiLabel}>BFR pire cas</div>
          <div className={`${styles.kpiValue} ${styles.kpiValueRed}`} title={fmt(bfrWorst)}>{fmt(bfrWorst)}</div>
          <div className={styles.kpiSub}>Sans aucune optimisation</div>
        </div>
        <div className={`${styles.kpi} ${bfrCurrent < -150_000 ? styles.kpiRed : bfrCurrent < -50_000 ? styles.kpiNeutral : styles.kpiGreen}`}>
          <div className={styles.kpiLabel}>BFR config actuelle</div>
          <div className={`${styles.kpiValue} ${bfrCurrent < -50_000 ? styles.kpiValueRed : styles.kpiValueGreen}`} title={fmt(bfrCurrent)}>{fmt(bfrCurrent)}</div>
          <div className={styles.kpiSub}>
            {factoring
              ? `Factoring + ${cashPct}% cash`
              : `${cashPct}% cash · délai ${delay}m`}
          </div>
        </div>
        <div className={`${styles.kpi} ${styles.kpiBlue}`}>
          <div className={styles.kpiLabel}>BFR économisé</div>
          <div className={`${styles.kpiValue} ${styles.kpiValueBlue}`} title={fmt(saved)}>
            {saved >= 0 ? '+' : ''}{fmt(saved)}
          </div>
          <div className={styles.kpiSub}>
            {bfrWorst !== 0 ? `${Math.round((saved / Math.abs(bfrWorst)) * 100)}% de réduction` : '—'}
          </div>
        </div>
        <div className={`${styles.kpi} ${styles.kpiNeutral}`}>
          <div className={styles.kpiLabel}>Coût factoring</div>
          <div className={styles.kpiValue}>
            {factoring ? `~${fmt(factCostAnnual)}/an` : '—'}
          </div>
          <div className={styles.kpiSub}>
            {factoring && resY3 > 0
              ? `${Math.round((factCostAnnual / resY3) * 100)}% du résultat net Y3`
              : 'Factoring désactivé'}
          </div>
        </div>
      </div>

      {/* Recommendation */}
      <div className={`${styles.reco} ${recoPositive ? styles.recoPositive : styles.recoWarning}`}>
        <div className={styles.recoIc}>{recoPositive ? <IconLightbulbSm /> : <IconAlertSm />}</div>
        <div>{recoText}</div>
      </div>

      {/* 4-scenario comparison grid */}
      <div className={styles.compareGrid}>
        {scenarioCards.map(sc => {
          const bfr    = Math.min(...sc.data);
          const critM  = sc.data.indexOf(bfr) + 1;
          const tag    = bfrTag(bfr);
          const active = sc.idx === matchIdx;
          return (
            <div key={sc.idx} className={`${styles.scCard} ${active ? styles.scActive : ''}`}>
              <div className={styles.scTitle} style={{ color: sc.color }}>{sc.title}</div>
              <div className={styles.scDetail}>{sc.sub}</div>
              <div className={`${styles.scBfr} ${bfr < 0 ? styles.scBfrNeg : styles.scBfrPos}`}>
                {fmt(bfr)}
              </div>
              <div className={styles.scDetail}>BFR min au M{critM}</div>
              <span className={`${styles.scTag} ${tag.cls}`}>{tag.label}</span>
              {active && (
                <span className={styles.scActiveBadge}>← Config actuelle</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Cashflow comparison chart */}
      <div className={styles.card}>
        <div className={styles.cardTitle}><IconTrending /> Impact sur la trésorerie (36 mois)</div>
        <div className={styles.chartBox}>
          <OptimizeChart
            worstData={worstData}
            cashOnlyData={cashOnlyData}
            cash1mData={cash1mData}
            factData={factData}
            matchIdx={matchIdx}
            cashPct={cashPct}
          />
        </div>
      </div>

    </div>
  );
}
