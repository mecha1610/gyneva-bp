'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { useSimStore } from '@/stores/useSimStore';
import { computeDerived } from '@lib/compute';
import styles from './page.module.css';

const ProfitBarChart   = dynamic(() => import('./ProfitChart').then(m => ({ default: m.ProfitBarChart })),   { ssr: false, loading: () => <div className={styles.chartSkeleton} /> });
const ProfitCumulChart = dynamic(() => import('./ProfitChart').then(m => ({ default: m.ProfitCumulChart })), { ssr: false, loading: () => <div className={styles.chartSkeleton} /> });

// ── SVG Icons ──────────────────────────────────────────────────────────────

function IconCheck() { return <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 11 4 16"/></svg>; }
function IconAlert() { return <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>; }
function IconX() { return <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>; }
function IconBarChart() { return <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>; }
function IconTrending() { return <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>; }

// ── Helpers ────────────────────────────────────────────────────────────────

function fmt(v: number): string {
  if (Math.abs(v) >= 1_000_000) return 'CHF ' + (v / 1_000_000).toFixed(1) + 'M';
  if (Math.abs(v) >= 1_000) return 'CHF ' + Math.round(v / 1_000) + 'k';
  return 'CHF ' + Math.round(v);
}

function sign(v: number): string {
  return v >= 0 ? '+' : '';
}

// ── Component ──────────────────────────────────────────────────────────────

export default function ProfitPage() {
  const planData = useSimStore(s => s.planData);
  const inputs   = useSimStore(s => s.inputs);
  const D        = computeDerived(planData);

  // Local sliders (independent from simulator)
  const [nbAssoc, setNbAssoc]   = useState(inputs.assoc);
  const [charges, setCharges]   = useState(inputs.extra);

  // ── Core calculations ─────────────────────────────────────────────────────

  const investPerAssoc   = planData.capex / nbAssoc;
  const chargesPerAssoc  = charges / nbAssoc;
  const monthlyCharges   = charges / (12 * nbAssoc);

  const perY1 = D.resY1 / nbAssoc;
  const perY2 = D.resY2 / nbAssoc;
  const perY3 = D.resY3 / nbAssoc;

  const adjY1 = Math.max(0, perY1 - chargesPerAssoc);
  const adjY2 = perY2 - chargesPerAssoc;
  const adjY3 = perY3 - chargesPerAssoc;
  const cumAdj = adjY1 + adjY2 + adjY3;

  const roiCumul = investPerAssoc > 0 ? cumAdj / investPerAssoc : 0;

  // Payback: first month cumulative profit > 0
  let payback = 36;
  let cumProfit = 0;
  for (let m = 0; m < 36; m++) {
    cumProfit += (planData.result[m] ?? 0) / nbAssoc - monthlyCharges;
    if (cumProfit > 0) { payback = m + 1; break; }
  }

  // Médecin retrocession (doctor's own CA at retro rate)
  const retroRate   = inputs.retro / 100;
  const retroAnnual = (planData.revSpec ?? 923432) * retroRate;

  // Médecin total per year = adjusted + own retro
  const medY1 = adjY1 + retroAnnual;
  const medY2 = adjY2 + retroAnnual;
  const medY3 = adjY3 + retroAnnual;
  const medTotal = cumAdj + retroAnnual * 3;

  // ── Slider gradient ───────────────────────────────────────────────────────

  function sliderGradient(val: number, min: number, max: number) {
    const pct = ((val - min) / (max - min)) * 100;
    return `linear-gradient(to right, var(--pl) ${pct}%, var(--brd2) ${pct}%)`;
  }

  // ── Verdict ──────────────────────────────────────────────────────────────

  const roiClass =
    roiCumul >= 3 ? styles.kpiGreen :
    roiCumul >= 1 ? styles.kpiOrange :
                    styles.kpiRed;

  const roiValClass =
    roiCumul >= 3 ? styles.kpiValueGreen :
    roiCumul >= 1 ? styles.kpiValueOrange :
                    styles.kpiValueRed;

  const verdictColor =
    roiCumul >= 2 ? 'Green' :
    roiCumul >= 1 ? 'Orange' :
                    'Red';

  const VerdictIcon = verdictColor === 'Green' ? IconCheck : verdictColor === 'Orange' ? IconAlert : IconX;
  const verdictText =
    roiCumul >= 5
      ? `ROI excellent — ${roiCumul.toFixed(1)}x sur 3 ans. Investissement ${fmt(investPerAssoc)}/associé, retour cumulé ${fmt(cumAdj)}.`
      : roiCumul >= 2
      ? `ROI attractif — ${roiCumul.toFixed(1)}x sur 3 ans, retour cumulé ${fmt(cumAdj)}, payback ${payback} mois.`
      : roiCumul >= 1
      ? `ROI modéré — ${roiCumul.toFixed(1)}x. Rentabilité positive mais limitée. Vérifier les charges manquantes.`
      : `ROI insuffisant — ${roiCumul.toFixed(1)}x. Revoir le modèle financier ou réduire les charges imprévues.`;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div>

      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Rentabilité par associé</h1>
        <p className={styles.pageSubtitle}>ROI, payback et rémunération nette sur 3 ans</p>
      </div>

      {/* Verdict */}
      <div className={`${styles.verdict} ${styles[`verdict${verdictColor}`]}`}>
        <div className={styles.ic}><VerdictIcon /></div>
        <div className={styles.verdictBody}><strong>Analyse de rentabilité.</strong>{' '}{verdictText}</div>
      </div>

      {/* Sliders */}
      <div className={styles.controls}>
        <div className={styles.controlCard}>
          <div className={styles.controlLabel}>
            <span className={styles.controlName}>Nombre d&apos;associés</span>
            <span className={styles.controlValue}>{nbAssoc}</span>
          </div>
          <input
            type="range"
            className={styles.slider}
            min={1} max={4} step={1}
            value={nbAssoc}
            style={{ background: sliderGradient(nbAssoc, 1, 4) }}
            onChange={e => setNbAssoc(Number(e.target.value))}
          />
        </div>
        <div className={styles.controlCard}>
          <div className={styles.controlLabel}>
            <span className={styles.controlName}>Charges imprévues / an</span>
            <span className={styles.controlValue}>{fmt(charges)}</span>
          </div>
          <input
            type="range"
            className={styles.slider}
            min={0} max={400_000} step={10_000}
            value={charges}
            style={{ background: sliderGradient(charges, 0, 400_000) }}
            onChange={e => setCharges(Number(e.target.value))}
          />
        </div>
      </div>

      {/* KPI grid */}
      <div className={styles.kpiGrid}>
        <div className={`${styles.kpi} ${roiClass}`}>
          <div className={styles.kpiLabel}>ROI cumulé 3 ans</div>
          <div className={`${styles.kpiValue} ${roiValClass}`}>{roiCumul.toFixed(1)}x</div>
          <div className={styles.kpiSub}>{fmt(investPerAssoc)} → {fmt(cumAdj)}</div>
        </div>
        <div className={`${styles.kpi} ${payback <= 12 ? styles.kpiGreen : payback <= 24 ? styles.kpiOrange : styles.kpiRed}`}>
          <div className={styles.kpiLabel}>Payback</div>
          <div className={`${styles.kpiValue} ${payback <= 12 ? styles.kpiValueGreen : payback <= 24 ? styles.kpiValueOrange : styles.kpiValueRed}`}>
            {payback} mois
          </div>
          <div className={styles.kpiSub}>Récupération de l&apos;invest.</div>
        </div>
        <div className={`${styles.kpi} ${adjY3 >= 0 ? styles.kpiGreen : styles.kpiRed}`}>
          <div className={styles.kpiLabel}>Résultat / associé Y3</div>
          <div className={`${styles.kpiValue} ${adjY3 >= 0 ? styles.kpiValueGreen : styles.kpiValueRed}`}>
            {fmt(adjY3)}
          </div>
          <div className={styles.kpiSub}>Après {fmt(chargesPerAssoc)} charges</div>
        </div>
        <div className={`${styles.kpi} ${styles.kpiBlue}`}>
          <div className={styles.kpiLabel}>Investissement / associé</div>
          <div className={styles.kpiValue}>{fmt(investPerAssoc)}</div>
          <div className={styles.kpiSub}>Part du CAPEX ({fmt(planData.capex)})</div>
        </div>
      </div>

      {/* Year timeline */}
      <div className={styles.card}>
        <div className={styles.cardTitle}><IconBarChart /> Résultat net — Part par associé</div>
        <div className={styles.timeline}>
          {[
            { label: 'Année 1', res: D.resY1, per: perY1, adj: adjY1 },
            { label: 'Année 2', res: D.resY2, per: perY2, adj: adjY2 },
            { label: 'Année 3', res: D.resY3, per: perY3, adj: adjY3 },
          ].map(y => (
            <div key={y.label} className={styles.timelineYear}>
              <div className={styles.tlYearLabel}>{y.label}</div>
              <div className={styles.tlRow}>
                <span className={styles.tlLabel}>Résultat net total</span>
                <span className={`${styles.tlValue} ${y.res >= 0 ? styles.tlValueGreen : styles.tlValueRed}`}>
                  {sign(y.res)}{fmt(y.res)}
                </span>
              </div>
              <div className={styles.tlRow}>
                <span className={styles.tlLabel}>Part / associé</span>
                <span className={styles.tlValue}>{fmt(y.per)}</span>
              </div>
              <div className={styles.tlRow}>
                <span className={styles.tlLabel}>Après charges imprévues</span>
                <span className={`${styles.tlValue} ${y.adj >= 0 ? styles.tlValueGreen : styles.tlValueRed}`}>
                  {sign(y.adj)}{fmt(y.adj)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Breakdown: médecin vs non-médecin */}
      <div className={styles.breakdown}>
        <div className={styles.breakdownCard}>
          <div className={styles.breakdownHeader}>Associé médecin</div>
          <div className={styles.breakdownBody}>
            <div className={styles.bdRow}>
              <span className={styles.bdLabel}>Rétrocession propre CA ({inputs.retro}%)</span>
              <span className={styles.bdValue}>{fmt(retroAnnual)}/an</span>
            </div>
            <div className={styles.bdRow}>
              <span className={styles.bdLabel}>Part résultat ajusté Y1</span>
              <span className={styles.bdValue}>{fmt(adjY1)}</span>
            </div>
            <div className={styles.bdRow}>
              <span className={styles.bdLabel}>Part résultat ajusté Y2</span>
              <span className={styles.bdValue}>{fmt(adjY2)}</span>
            </div>
            <div className={styles.bdRow}>
              <span className={styles.bdLabel}>Part résultat ajusté Y3</span>
              <span className={styles.bdValue}>{fmt(adjY3)}</span>
            </div>
            <div className={styles.bdTotal}>
              <span className={styles.bdTotalLabel}>Total rétro + résultat (3 ans)</span>
              <span className={styles.bdTotalValue}>{fmt(medTotal)}</span>
            </div>
          </div>
        </div>

        <div className={styles.breakdownCard}>
          <div className={styles.breakdownHeader}>Associé non-médecin</div>
          <div className={styles.breakdownBody}>
            <div className={styles.bdRow}>
              <span className={styles.bdLabel}>Rétrocession propre CA</span>
              <span className={styles.bdValue}>— (non applicable)</span>
            </div>
            <div className={styles.bdRow}>
              <span className={styles.bdLabel}>Part résultat ajusté Y1</span>
              <span className={styles.bdValue}>{fmt(adjY1)}</span>
            </div>
            <div className={styles.bdRow}>
              <span className={styles.bdLabel}>Part résultat ajusté Y2</span>
              <span className={styles.bdValue}>{fmt(adjY2)}</span>
            </div>
            <div className={styles.bdRow}>
              <span className={styles.bdLabel}>Part résultat ajusté Y3</span>
              <span className={styles.bdValue}>{fmt(adjY3)}</span>
            </div>
            <div className={styles.bdTotal}>
              <span className={styles.bdTotalLabel}>Total résultat seul (3 ans)</span>
              <span className={styles.bdTotalValue}>{fmt(cumAdj)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bar chart */}
      <div className={styles.card}>
        <div className={styles.cardTitle}><IconBarChart /> Résultat par associé — vue annuelle</div>
        <div className={styles.chartBox}>
          <ProfitBarChart
            perY1={perY1} perY2={perY2} perY3={perY3}
            adjY1={adjY1} adjY2={adjY2} adjY3={adjY3}
            medY1={medY1} medY2={medY2} medY3={medY3}
          />
        </div>
      </div>

      {/* Cumulative line chart */}
      <div className={styles.card}>
        <div className={styles.cardTitle}><IconTrending /> Profit cumulé sur 36 mois</div>
        <div className={styles.chartBoxLg}>
          <ProfitCumulChart
            result={planData.result}
            nbAssoc={nbAssoc}
            monthlyCharges={monthlyCharges}
            investPerAssoc={investPerAssoc}
          />
        </div>
      </div>

    </div>
  );
}
