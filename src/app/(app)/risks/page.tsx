'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { useSimStore } from '@/stores/useSimStore';
import { computeSimulation } from '@lib/simulation';
import styles from './page.module.css';

const StressChart       = dynamic(() => import('./RiskCharts').then(m => ({ default: m.StressChart })),       { ssr: false });
const ChargesDonutChart = dynamic(() => import('./RiskCharts').then(m => ({ default: m.ChargesDonutChart })), { ssr: false });

// ── Static data ────────────────────────────────────────────────────────────

interface Risk {
  id: string;
  label: string;
  prob: number;   // 1-5
  impact: number; // 1-5
}

const INITIAL_RISKS: Risk[] = [
  { id: 'r1', label: "Faible taux d'occupation Y1",  prob: 3, impact: 5 },
  { id: 'r2', label: 'Retards paiements LAMal',       prob: 3, impact: 4 },
  { id: 'r3', label: 'Turnover praticiens',            prob: 3, impact: 4 },
  { id: 'r4', label: 'Concurrence accrue',             prob: 3, impact: 3 },
  { id: 'r5', label: 'Dépassement CAPEX',              prob: 3, impact: 2 },
  { id: 'r6', label: 'Pandémie / fermeture',           prob: 1, impact: 5 },
  { id: 'r7', label: 'Hausse coûts fixes',             prob: 3, impact: 3 },
];

interface Charge {
  label: string;
  min: number;
  max: number;
  criticite: 'critique' | 'important' | 'moyen';
}

const CHARGES_DATA: Charge[] = [
  { label: 'Équipement médical supplémentaire', min: 30_000, max: 80_000, criticite: 'critique'  },
  { label: 'Rénovations imprévues',              min: 20_000, max: 60_000, criticite: 'critique'  },
  { label: "Recrutement d'urgence",              min: 15_000, max: 40_000, criticite: 'important' },
  { label: 'Formation du personnel',             min:  8_000, max: 20_000, criticite: 'important' },
  { label: 'Informatique / logiciels',           min: 12_000, max: 35_000, criticite: 'important' },
  { label: 'Assurances complémentaires',         min:  5_000, max: 15_000, criticite: 'moyen'     },
  { label: 'Litiges / aspects juridiques',       min: 10_000, max: 50_000, criticite: 'critique'  },
  { label: 'Matériel consommable',               min:  5_000, max: 12_000, criticite: 'moyen'     },
];

// ── Helpers ────────────────────────────────────────────────────────────────

function fmt(v: number): string {
  if (Math.abs(v) >= 1_000_000) return 'CHF ' + (v / 1_000_000).toFixed(1) + 'M';
  if (Math.abs(v) >= 1_000) return 'CHF ' + Math.round(v / 1_000) + 'k';
  return 'CHF ' + Math.round(v);
}

function cycle(v: number): number {
  return v >= 5 ? 1 : v + 1;
}

// ── Component ──────────────────────────────────────────────────────────────

export default function RisksPage() {
  const inputs = useSimStore(s => s.inputs);

  const [risks, setRisks]       = useState<Risk[]>(INITIAL_RISKS);
  const [sortByExp, setSortByExp] = useState(false);

  // ── Scenarios ─────────────────────────────────────────────────────────────

  const simBase = computeSimulation(inputs);

  const simPess = computeSimulation({
    ...inputs,
    consult: Math.max(8,   Math.round(inputs.consult * 0.75)),
    fee:     Math.max(120, Math.round(inputs.fee     * 0.75)),
    occup:   Math.max(30,  Math.round(inputs.occup   * 0.75)),
    start:   Math.min(12,  inputs.start + 2),
  });

  const simOpt = computeSimulation({
    ...inputs,
    consult: Math.min(24,  Math.round(inputs.consult * 1.25)),
    fee:     Math.min(350, Math.round(inputs.fee     * 1.25)),
    occup:   Math.min(100, Math.round(inputs.occup   * 1.25)),
    start:   Math.max(1,   inputs.start - 1),
  });

  // ── Sensitivity (individual -25% impact on resY3) ────────────────────────

  const sensConsult = Math.abs(simBase.resY3 - computeSimulation({ ...inputs, consult: Math.max(8,   Math.round(inputs.consult * 0.75)) }).resY3);
  const sensFee     = Math.abs(simBase.resY3 - computeSimulation({ ...inputs, fee:     Math.max(120, Math.round(inputs.fee     * 0.75)) }).resY3);
  const sensOccup   = Math.abs(simBase.resY3 - computeSimulation({ ...inputs, occup:   Math.max(30,  Math.round(inputs.occup   * 0.75)) }).resY3);
  const sensStart   = Math.abs(simBase.resY3 - computeSimulation({ ...inputs, start:   Math.min(12,  inputs.start + 2) }).resY3);
  const maxSens     = Math.max(sensConsult, sensFee, sensOccup, sensStart, 1);

  // ── Composite score ───────────────────────────────────────────────────────

  const caBase = simBase.caY3 > 0 ? simBase.caY3 : 1;
  const dCaPct  = Math.abs(simBase.caY3  - simPess.caY3)  / caBase;
  const dResPct = simBase.resY3 !== 0 ? Math.abs(simBase.resY3 - simPess.resY3) / Math.abs(simBase.resY3) : 1;
  const stressScore = Math.min(50, Math.round(((dCaPct + dResPct) / 2) * 50));

  const totalExposure = risks.reduce((acc, r) => acc + r.prob * r.impact, 0);
  const matrixScore   = Math.min(50, Math.round((totalExposure / (7 * 25)) * 50));

  const score = stressScore + matrixScore;

  // ── Verdict ───────────────────────────────────────────────────────────────

  const verdictColor =
    score >= 60 ? 'Red' :
    score >= 35 ? 'Orange' :
                  'Green';

  const verdictIcon = verdictColor === 'Green' ? '✅' : verdictColor === 'Orange' ? '⚠️' : '❌';
  const verdictText =
    score >= 60
      ? `Profil risqué — score ${score}/100. Plusieurs facteurs critiques à surveiller de près.`
      : score >= 35
      ? `Risques modérés — score ${score}/100. Sensibilité significative aux variables d'activité.`
      : `Profil conservateur — score ${score}/100. Exposition globale maîtrisée.`;

  // ── SVG gauge ─────────────────────────────────────────────────────────────

  const R         = 46;
  const cx        = 60;
  const cy        = 60;
  const halfCirc  = Math.PI * R;         // ≈ 144.51
  const fullCirc  = 2 * Math.PI * R;     // ≈ 289.03
  const fillLen   = (score / 100) * halfCirc;
  const gaugeColor =
    score >= 60 ? 'var(--danger)' :
    score >= 35 ? 'var(--warn)'   :
                  'var(--acc)';

  // ── Charges summary for donut ─────────────────────────────────────────────

  const mid = (c: Charge) => (c.min + c.max) / 2;
  const critiqueMid  = CHARGES_DATA.filter(c => c.criticite === 'critique').reduce((a, c) => a + mid(c), 0);
  const importantMid = CHARGES_DATA.filter(c => c.criticite === 'important').reduce((a, c) => a + mid(c), 0);
  const moyenMid     = CHARGES_DATA.filter(c => c.criticite === 'moyen').reduce((a, c) => a + mid(c), 0);
  const totalMin     = CHARGES_DATA.reduce((a, c) => a + c.min, 0);
  const totalMax     = CHARGES_DATA.reduce((a, c) => a + c.max, 0);

  // ── Risk matrix ───────────────────────────────────────────────────────────

  const displayRisks = sortByExp
    ? [...risks].sort((a, b) => b.prob * b.impact - a.prob * a.impact)
    : risks;

  const toggleProb   = (id: string) => setRisks(rs => rs.map(r => r.id === id ? { ...r, prob:   cycle(r.prob)   } : r));
  const toggleImpact = (id: string) => setRisks(rs => rs.map(r => r.id === id ? { ...r, impact: cycle(r.impact) } : r));

  function exposureClass(exp: number) {
    if (exp >= 13) return styles.expHigh;
    if (exp >= 7)  return styles.expMed;
    return styles.expLow;
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div>

      {/* Verdict */}
      <div className={`${styles.verdict} ${styles[`verdict${verdictColor}`]}`}>
        <div className={styles.verdictIc}>{verdictIcon}</div>
        <div><strong>Analyse des risques.</strong>{' '}{verdictText}</div>
      </div>

      {/* Gauge + Scenarios */}
      <div className={styles.topRow}>

        {/* Score gauge */}
        <div className={styles.gaugeCard}>
          <div className={styles.cardTitle} style={{ marginBottom: '.2rem' }}>🎯 Score global</div>
          <div className={styles.gaugeWrap}>
            <svg viewBox="0 0 120 68" className={styles.gaugeSvg}>
              <circle
                cx={cx} cy={cy} r={R}
                fill="none"
                stroke="var(--brd2)"
                strokeWidth={9}
                strokeDasharray={`${halfCirc} ${fullCirc}`}
                transform={`rotate(180, ${cx}, ${cy})`}
              />
              <circle
                cx={cx} cy={cy} r={R}
                fill="none"
                stroke={gaugeColor}
                strokeWidth={9}
                strokeLinecap="round"
                strokeDasharray={`${fillLen} ${fullCirc}`}
                transform={`rotate(180, ${cx}, ${cy})`}
              />
            </svg>
            <div className={styles.gaugeLabel}>
              <div className={styles.gaugeScore} style={{ color: gaugeColor }}>{score}</div>
              <div className={styles.gaugeSubtitle}>/ 100</div>
            </div>
          </div>
          <div className={styles.gaugeBreakdown}>
            <div className={styles.gbRow}><span>Score stress</span><span>{stressScore}/50</span></div>
            <div className={styles.gbRow}><span>Score matrice</span><span>{matrixScore}/50</span></div>
          </div>
        </div>

        {/* Scenario cards */}
        <div className={styles.scenarios}>
          {([
            { label: 'Pessimiste', sim: simPess, cls: styles.scenRed   },
            { label: 'Base',        sim: simBase, cls: styles.scenBlue  },
            { label: 'Optimiste',   sim: simOpt,  cls: styles.scenGreen },
          ] as const).map(sc => (
            <div key={sc.label} className={`${styles.scenCard} ${sc.cls}`}>
              <div className={styles.scenLabel}>{sc.label}</div>
              <div className={styles.scenRows}>
                <div className={styles.scenRow}>
                  <span>CA Y3</span>
                  <span>{fmt(sc.sim.caY3)}</span>
                </div>
                <div className={styles.scenRow}>
                  <span>Résultat Y3</span>
                  <span className={sc.sim.resY3 >= 0 ? styles.valGreen : styles.valRed}>{fmt(sc.sim.resY3)}</span>
                </div>
                <div className={styles.scenRow}>
                  <span>Trésorerie</span>
                  <span>{fmt(sc.sim.tresoFinal)}</span>
                </div>
                <div className={styles.scenRow}>
                  <span>BFR min</span>
                  <span>{fmt(sc.sim.bfrMin)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* Stress comparison chart */}
      <div className={styles.card}>
        <div className={styles.cardTitle}>📊 Comparaison scénarios — Année 3</div>
        <div className={styles.chartBox}>
          <StressChart
            baseCA={simBase.caY3}  baseRes={simBase.resY3}
            pessCA={simPess.caY3}  pessRes={simPess.resY3}
            optCA={simOpt.caY3}    optRes={simOpt.resY3}
          />
        </div>
      </div>

      {/* Sensitivity analysis */}
      <div className={styles.card}>
        <div className={styles.cardTitle}>📉 Sensibilité — Impact sur résultat Y3 (−25%)</div>
        <div className={styles.sensGrid}>
          {[
            { label: 'Consultations / jour', val: sensConsult },
            { label: 'Tarif / consultation',  val: sensFee     },
            { label: "Taux d'occupation",     val: sensOccup   },
            { label: 'Retard démarrage +2m',  val: sensStart   },
          ].map(s => (
            <div key={s.label} className={styles.sensRow}>
              <div className={styles.sensLabel}>{s.label}</div>
              <div className={styles.sensBarWrap}>
                <div className={styles.sensBar} style={{ width: `${(s.val / maxSens) * 100}%` }} />
              </div>
              <div className={styles.sensVal}>{fmt(s.val)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Risk matrix */}
      <div className={styles.card}>
        <div className={styles.cardTitle}>
          <span>🔲 Matrice des risques</span>
          <button className={styles.sortBtn} onClick={() => setSortByExp(s => !s)}>
            {sortByExp ? 'Ordre original' : 'Trier par exposition'}
          </button>
        </div>
        <div className={styles.matrixTable}>
          <div className={styles.matrixHeader}>
            <span>Risque</span>
            <span>Probabilité</span>
            <span>Impact</span>
            <span>Exposition</span>
          </div>
          {displayRisks.map(r => {
            const exp = r.prob * r.impact;
            return (
              <div key={r.id} className={styles.matrixRow}>
                <span className={styles.riskLabel}>{r.label}</span>
                <button
                  className={`${styles.riskBtn} ${styles.riskProb}`}
                  onClick={() => toggleProb(r.id)}
                  title="Cliquer pour modifier"
                >
                  {Array.from({ length: 5 }, (_, i) => (
                    <span key={i} className={i < r.prob ? styles.dotFill : styles.dotEmpty} />
                  ))}
                  <span className={styles.btnVal}>{r.prob}/5</span>
                </button>
                <button
                  className={`${styles.riskBtn} ${styles.riskImpact}`}
                  onClick={() => toggleImpact(r.id)}
                  title="Cliquer pour modifier"
                >
                  {Array.from({ length: 5 }, (_, i) => (
                    <span key={i} className={i < r.impact ? styles.dotFill : styles.dotEmpty} />
                  ))}
                  <span className={styles.btnVal}>{r.impact}/5</span>
                </button>
                <span className={`${styles.expBadge} ${exposureClass(exp)}`}>{exp}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Unbudgeted charges + donut */}
      <div className={styles.breakdown}>
        <div className={styles.chargesCard}>
          <div className={styles.breakdownHeader}>⚠️ Charges imprévues potentielles</div>
          <div className={styles.chargesBody}>
            <div className={styles.chargesHeader}>
              <span>Poste</span>
              <span>Min</span>
              <span>Max</span>
              <span>Criticité</span>
            </div>
            {CHARGES_DATA.map((c, i) => (
              <div key={i} className={styles.chargesRow}>
                <span className={styles.chLabel}>{c.label}</span>
                <span className={styles.chVal}>{fmt(c.min)}</span>
                <span className={styles.chVal}>{fmt(c.max)}</span>
                <span className={`${styles.critBadge} ${styles[`crit${c.criticite}`]}`}>{c.criticite}</span>
              </div>
            ))}
            <div className={styles.chargesTotal}>
              <span>Total estimé</span>
              <span>{fmt(totalMin)}</span>
              <span>{fmt(totalMax)}</span>
              <span />
            </div>
          </div>
        </div>

        <div className={styles.donutCard}>
          <div className={styles.breakdownHeader}>📊 Répartition par criticité</div>
          <div className={styles.donutBody}>
            <div className={styles.chartBoxSm}>
              <ChargesDonutChart
                critiqueMid={critiqueMid}
                importantMid={importantMid}
                moyenMid={moyenMid}
              />
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
