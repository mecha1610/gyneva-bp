'use client';

import dynamic from 'next/dynamic';
import { useSimStore } from '@/stores/useSimStore';
import { computeDerived } from '@lib/compute';
import styles from './page.module.css';

// Lazy-load the chart to avoid SSR issues with Chart.js canvas
const OverviewChart = dynamic(() => import('./OverviewChart'), { ssr: false });

// ── Helpers ────────────────────────────────────────────────────────────────

function fmt(v: number): string {
  if (Math.abs(v) >= 1_000_000)
    return 'CHF ' + (v / 1_000_000).toFixed(1) + 'M';
  if (Math.abs(v) >= 1_000)
    return 'CHF ' + Math.round(v / 1_000) + 'k';
  return 'CHF ' + Math.round(v);
}

function sum(arr: number[], s: number, e: number) {
  return arr.slice(s, e).reduce((a, b) => a + b, 0);
}

// ── Component ──────────────────────────────────────────────────────────────

export default function OverviewPage() {
  const planData = useSimStore(s => s.planData);
  const D = computeDerived(planData);

  // ── Computed metrics ────────────────────────────────────────────────────
  const margin3    = D.caY3 > 0 ? Math.round(D.resY3 / D.caY3 * 100) : 0;
  const caGrowth   = D.caY1 > 0 ? Math.round((D.caY3 - D.caY1) / D.caY1 * 100) : 0;
  const bfrWorst   = D.bfrWorst;
  const cumRes3    = D.resY1 + D.resY2 + D.resY3;
  const roiVal     = planData.capex > 0 ? cumRes3 / planData.capex : 0;
  const roi        = planData.capex > 0 ? roiVal.toFixed(1) + 'x' : 'N/A';

  let payback = 36;
  let cumR = 0;
  for (let m = 0; m < 36; m++) {
    cumR += planData.result[m];
    if (cumR > 0 && planData.result[m] > 0) { payback = m + 1; break; }
  }

  // ── Verdict score ────────────────────────────────────────────────────────
  let score = 0;
  score += margin3 >= 20 ? 3 : margin3 >= 10 ? 2 : margin3 >= 5 ? 1 : 0;
  score += payback <= 12 ? 3 : payback <= 18 ? 2 : payback <= 24 ? 1 : 0;
  score += bfrWorst >= -50_000 ? 3 : bfrWorst >= -150_000 ? 2 : 1;
  score += roiVal >= 3 ? 3 : roiVal >= 1.5 ? 2 : roiVal >= 1 ? 1 : 0;

  const verdictClass =
    score >= 10 ? styles.verdictGreen :
    score >= 6  ? styles.verdictOrange :
                  styles.verdictRed;

  const verdictIcon  = score >= 10 ? '✅' : score >= 6 ? '⚠️' : '❌';
  const verdictText  =
    score >= 10
      ? `Projet solide — marge Y3 ${margin3}%, payback ${payback} mois, trésorerie finale ${fmt(planData.cashflow[35])}.`
      : score >= 6
      ? `Projet viable mais sous surveillance — marge ${margin3}%, BFR min ${fmt(bfrWorst)}.`
      : `Vigilance requise — marge Y3 ${margin3}%, BFR ${fmt(bfrWorst)}.`;

  // ── KPI color helpers ────────────────────────────────────────────────────
  const resClass  = margin3 >= 20 ? styles.kpiGreen : margin3 >= 10 ? styles.kpiOrange : styles.kpiRed;
  const bfrClass  = bfrWorst >= -50_000 ? styles.kpiGreen : bfrWorst >= -150_000 ? styles.kpiOrange : styles.kpiRed;
  const pbkClass  = payback <= 12 ? styles.kpiGreen : payback <= 18 ? styles.kpiBlue : styles.kpiOrange;

  const resValClass = margin3 >= 20 ? styles.kpiValueGreen : margin3 >= 10 ? styles.kpiValueOrange : styles.kpiValueRed;
  const bfrValClass = bfrWorst >= -50_000 ? styles.kpiValueGreen : bfrWorst >= -150_000 ? styles.kpiValueOrange : styles.kpiValueRed;

  // ── Year timeline ────────────────────────────────────────────────────────
  const years = [
    { n: 1, s: 0, e: 12, phase: 'Démarrage',  phaseClass: styles.phaseStart,  cardClass: styles.yearY1 },
    { n: 2, s: 12, e: 24, phase: 'Croissance', phaseClass: styles.phaseGrow,   cardClass: styles.yearY2 },
    { n: 3, s: 24, e: 36, phase: 'Croisière',  phaseClass: styles.phaseCruise, cardClass: styles.yearY3 },
  ];

  // ── Summary grid ─────────────────────────────────────────────────────────
  const bfrTag    = bfrWorst >= -50_000 ? { t: 'Maîtrisé', c: styles.tagGreen }
                  : bfrWorst >= -150_000 ? { t: 'Attention', c: styles.tagOrange }
                  : { t: 'Risque élevé', c: styles.tagRed };
  const bfrValCls = bfrWorst >= -50_000 ? styles.summaryValueGreen
                  : bfrWorst >= -150_000 ? styles.summaryValueOrange
                  : styles.summaryValueRed;

  const fteEnd   = planData.fteTotal[35] || 0;
  const fteStart = planData.fteTotal[0]  || 1;
  const fteGrowth = Math.round((fteEnd - fteStart) / fteStart * 100);

  const roiTag   = roiVal >= 3 ? { t: 'Excellent', c: styles.tagGreen }
                 : roiVal >= 1 ? { t: 'Correct', c: styles.tagOrange }
                 : { t: 'Insuffisant', c: styles.tagRed };
  const roiValCls = roiVal >= 2 ? styles.summaryValueGreen
                  : roiVal >= 1 ? styles.summaryValueOrange
                  : styles.summaryValueRed;

  return (
    <div>
      {/* Verdict */}
      <div className={`${styles.verdict} ${verdictClass}`}>
        <div className={styles.ic}>{verdictIcon}</div>
        <div dangerouslySetInnerHTML={{ __html: `<strong>Vue d'ensemble.</strong> ${verdictText}` }} />
      </div>

      {/* KPI grid */}
      <div className={styles.kpiGrid}>
        <div className={`${styles.kpi} ${styles.kpiBlue}`}>
          <div className={styles.kpiLabel}>Investissement total</div>
          <div className={styles.kpiValue}>{fmt(planData.capex)}</div>
          <div className={styles.kpiSub}>CAPEX + équipements</div>
        </div>
        <div className={`${styles.kpi} ${styles.kpiGreen}`}>
          <div className={styles.kpiLabel}>CA Année 3</div>
          <div className={styles.kpiValue}>{fmt(D.caY3)}</div>
          <div className={styles.kpiSub}>
            {caGrowth > 0 ? `+${caGrowth}% vs Année 1` : 'Croissance'}
          </div>
        </div>
        <div className={`${styles.kpi} ${resClass}`}>
          <div className={styles.kpiLabel}>Résultat net Année 3</div>
          <div className={`${styles.kpiValue} ${resValClass}`}>{fmt(D.resY3)}</div>
          <div className={styles.kpiSub}>Marge {margin3}%</div>
        </div>
        <div className={`${styles.kpi} ${resClass}`}>
          <div className={styles.kpiLabel}>Marge nette Y3</div>
          <div className={`${styles.kpiValue} ${resValClass}`}>{margin3}%</div>
          <div className={styles.kpiSub}>Résultat / CA</div>
        </div>
        <div className={`${styles.kpi} ${pbkClass}`}>
          <div className={styles.kpiLabel}>Retour sur investissement</div>
          <div className={styles.kpiValue}>{payback} mois</div>
          <div className={styles.kpiSub}>Payback period</div>
        </div>
        <div className={`${styles.kpi} ${bfrClass}`}>
          <div className={styles.kpiLabel}>BFR minimum</div>
          <div className={`${styles.kpiValue} ${bfrValClass}`}>{fmt(bfrWorst)}</div>
          <div className={styles.kpiSub}>
            {bfrWorst >= 0 ? 'Trésorerie positive' : 'Besoin en fonds de roulement'}
          </div>
        </div>
      </div>

      {/* Year timeline */}
      <div className={styles.yearTimeline}>
        {years.map(y => {
          const ca  = sum(planData.ca, y.s, y.e);
          const res = sum(planData.result, y.s, y.e);
          const m   = ca > 0 ? Math.round(res / ca * 100) : 0;
          const fte = planData.fteTotal[y.e - 1] || 0;
          return (
            <div key={y.n} className={`${styles.yearCard} ${y.cardClass}`}>
              <div className={styles.yearCardTitle}>
                Année {y.n}
                <span className={`${styles.phase} ${y.phaseClass}`}>{y.phase}</span>
              </div>
              <div className={styles.yearMetric}>
                <span className={styles.yearMetricLabel}>CA</span>
                <span className={styles.yearMetricValue}>{fmt(ca)}</span>
              </div>
              <div className={styles.yearMetric}>
                <span className={styles.yearMetricLabel}>Résultat net</span>
                <span className={styles.yearMetricValue}>{(res >= 0 ? '+' : '') + fmt(res)}</span>
              </div>
              <div className={styles.yearMetric}>
                <span className={styles.yearMetricLabel}>Marge nette</span>
                <span className={styles.yearMetricValue}>{m}%</span>
              </div>
              <div className={styles.yearMetric}>
                <span className={styles.yearMetricLabel}>Équipe ETP</span>
                <span className={styles.yearMetricValue}>{fte}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Overview chart */}
      <div className={styles.card}>
        <div className={styles.cardTitle}>📈 Évolution sur 3 ans</div>
        <div className={styles.chartBox}>
          <OverviewChart
            caY1={D.caY1} caY2={D.caY2} caY3={D.caY3}
            resY1={D.resY1} resY2={D.resY2} resY3={D.resY3}
            treso={[planData.cashflow[11], planData.cashflow[23], planData.cashflow[35]]}
          />
        </div>
      </div>

      {/* Summary grid */}
      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <div className={styles.summaryIc}>💰</div>
          <div className={styles.summaryTitle}>Trésorerie</div>
          <div className={`${styles.summaryValue} ${bfrValCls}`}>{fmt(bfrWorst)}</div>
          <div className={styles.summarySub}>Besoin min en fonds de roulement</div>
          <span className={`${styles.summaryTag} ${bfrTag.c}`}>{bfrTag.t}</span>
        </div>
        <div className={styles.summaryCard}>
          <div className={styles.summaryIc}>👥</div>
          <div className={styles.summaryTitle}>Équipe</div>
          <div className={styles.summaryValue}>{fteEnd} ETP</div>
          <div className={styles.summarySub}>{fteGrowth > 0 ? '+' : ''}{fteGrowth}% sur 3 ans</div>
          <span className={`${styles.summaryTag} ${fteEnd >= 14 ? styles.tagGreen : fteEnd >= 8 ? styles.tagOrange : styles.tagRed}`}>
            {fteEnd} collaborateurs
          </span>
        </div>
        <div className={styles.summaryCard}>
          <div className={styles.summaryIc}>⚠️</div>
          <div className={styles.summaryTitle}>Risques</div>
          <div className={styles.summaryValue}>—/100</div>
          <div className={styles.summarySub}>Score composite</div>
          <span className={`${styles.summaryTag} ${styles.tagOrange}`}>Voir Risques</span>
        </div>
        <div className={styles.summaryCard}>
          <div className={styles.summaryIc}>📈</div>
          <div className={styles.summaryTitle}>ROI associés</div>
          <div className={`${styles.summaryValue} ${roiValCls}`}>{roi}</div>
          <div className={styles.summarySub}>ROI cumulé 3 ans</div>
          <span className={`${styles.summaryTag} ${roiTag.c}`}>{roiTag.t}</span>
        </div>
      </div>

      {/* Assumptions */}
      <div className={styles.card}>
        <div className={styles.cardTitle}>⚙️ Hypothèses clés du modèle</div>
        <div className={styles.exp}>
          Le modèle repose sur les standards TARMED pour la gynécologie à Genève.
          Chaque hypothèse est modifiable via le <strong>Simulateur</strong> ou dans le fichier Excel.
        </div>
        <div className={styles.pills}>
          <span className={styles.pill}><b>{planData.consultDay}</b> consult./jour</span>
          <span className={styles.pill}><b>CHF {planData.fee}</b> /consultation</span>
          <span className={styles.pill}><b>{planData.daysYear}</b> jours/an</span>
          <span className={styles.pill}><b>60/40</b> partage associés</span>
          <span className={styles.pill}><b>CAPEX</b> {fmt(planData.capex)}</span>
        </div>
      </div>
    </div>
  );
}
