'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { useSimStore, useSimResult } from '@/stores/useSimStore';
import { computeDerived } from '@lib/compute';
import type { SimulatorParams } from '@lib/types';
import styles from './page.module.css';
import PageHeader from '@/components/PageHeader';
import KpiSkeleton from '@/components/KpiSkeleton';

const SimulatorCharts = dynamic(() => import('./SimulatorCharts'), { ssr: false, loading: () => <div className={styles.chartSkeleton} /> });

// ── SVG icons ──────────────────────────────────────────────────────────────

function IconCheck() { return <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 11 4 16"/></svg>; }
function IconAlert() { return <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>; }
function IconX() { return <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>; }

// ── Helpers ────────────────────────────────────────────────────────────────

function fmt(v: number): string {
  if (Math.abs(v) >= 1_000_000) return 'CHF ' + (v / 1_000_000).toFixed(1) + 'M';
  if (Math.abs(v) >= 1_000) return 'CHF ' + Math.round(v / 1_000) + 'k';
  return 'CHF ' + Math.round(v);
}

// ── Sub-component: single slider row ──────────────────────────────────────

interface SliderRowProps {
  label: string;
  paramKey: keyof SimulatorParams;
  value: number;
  min: number;
  max: number;
  step?: number;
  display?: (v: number) => string;
  onChange: (key: keyof SimulatorParams, val: number) => void;
}

function SliderRow({ label, paramKey, value, min, max, step = 1, display, onChange }: SliderRowProps) {
  const displayVal = display ? display(value) : String(value);
  const progress = ((value - min) / (max - min)) * 100;
  const gradient = `linear-gradient(to right, var(--pl) ${progress}%, var(--brd2) ${progress}%)`;
  return (
    <div className={styles.sliderRow}>
      <div className={styles.sliderLabel}>
        <span className={styles.sliderName}>{label}</span>
        <span className={styles.sliderValue}>{displayVal}</span>
      </div>
      <input
        type="range"
        className={styles.slider}
        min={min}
        max={max}
        step={step}
        value={value}
        style={{ background: gradient }}
        aria-label={label}
        aria-valuetext={displayVal}
        onChange={e => onChange(paramKey, Number(e.target.value))}
      />
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export default function SimulatorPage() {
  const isHydrated  = useSimStore(s => s.isHydrated);
  const inputs      = useSimStore(s => s.inputs);
  const planData    = useSimStore(s => s.planData);
  const setParam    = useSimStore(s => s.setParam);
  const resetInputs = useSimStore(s => s.resetInputs);
  const sim = useSimResult();
  const D   = computeDerived(planData);

  if (!isHydrated) {
    return (
      <div className={styles.layout}>
        <aside className={styles.sliderPanel} aria-hidden="true" />
        <div className={styles.content}>
          <PageHeader title="Simulateur de scénarios" subtitle="Ajustez les paramètres pour projeter l'impact sur 36 mois" />
          <KpiSkeleton count={4} gridClassName={styles.kpiRow} />
        </div>
      </div>
    );
  }

  const [activeYear, setActiveYear] = useState<'all' | '1' | '2' | '3'>('all');
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    activite: true,
    equipe: true,
    demarrage: false,
    tresorerie: false,
    charges: false,
  });

  function toggleGroup(key: string) {
    setOpenGroups(g => ({ ...g, [key]: !g[key] }));
  }

  // ── Derived metrics ──────────────────────────────────────────────────────

  const margin3  = sim.caY3 > 0 ? Math.round(sim.resY3 / sim.caY3 * 100) : 0;
  const caGrowth = sim.caY1 > 0 ? Math.round((sim.caY3 - sim.caY1) / sim.caY1 * 100) : 0;

  let payback = 36;
  let cumR = 0;
  for (let m = 0; m < 36; m++) {
    cumR += sim.result[m];
    if (cumR > 0 && sim.result[m] > 0) { payback = m + 1; break; }
  }

  let score = 0;
  score += margin3 >= 20 ? 3 : margin3 >= 10 ? 2 : margin3 >= 5 ? 1 : 0;
  score += sim.bfrMin >= -50_000 ? 3 : sim.bfrMin >= -150_000 ? 2 : 1;
  score += caGrowth >= 50 ? 3 : caGrowth >= 20 ? 2 : caGrowth >= 0 ? 1 : 0;
  score += payback <= 12 ? 3 : payback <= 18 ? 2 : payback <= 24 ? 1 : 0;

  const verdictColor = score >= 9 ? 'Green' : score >= 5 ? 'Orange' : 'Red';
  const VerdictIcon  = score >= 9 ? IconCheck : score >= 5 ? IconAlert : IconX;
  const verdictText  =
    score >= 9
      ? `Scénario solide — marge Y3 ${margin3}%, BFR min ${fmt(sim.bfrMin)}, payback ${payback} mois.`
      : score >= 5
      ? `Scénario viable sous surveillance — marge ${margin3}%, BFR ${fmt(sim.bfrMin)}.`
      : `Vigilance requise — marge Y3 ${margin3}%, BFR ${fmt(sim.bfrMin)}.`;

  // ── KPI deltas vs plan ───────────────────────────────────────────────────

  const planCaY3  = D.caY3;
  const planResY3 = D.resY3;
  const planTreso = planData.cashflow[35] ?? 0;
  const planBfr   = D.bfrWorst;

  const dCa   = planCaY3 !== 0  ? (sim.caY3        - planCaY3)  / Math.abs(planCaY3)  * 100 : 0;
  const dRes  = planResY3 !== 0 ? (sim.resY3       - planResY3) / Math.abs(planResY3) * 100 : 0;
  const dTres = planTreso !== 0 ? (sim.tresoFinal  - planTreso) / Math.abs(planTreso) * 100 : 0;
  const dBfr  = planBfr   !== 0 ? (sim.bfrMin      - planBfr)  / Math.abs(planBfr)   * 100 : 0;

  function fmtDelta(d: number): string {
    return (d > 0 ? '+' : '') + Math.round(d) + '% vs plan';
  }
  function deltaStyle(d: number): string {
    return d > 0 ? styles.deltaUp : d < 0 ? styles.deltaDown : styles.deltaNone;
  }

  // ── Year helpers ─────────────────────────────────────────────────────────

  function yearSum(arr: number[], y: number) {
    const s = (y - 1) * 12;
    return arr.slice(s, s + 12).reduce((a, b) => a + b, 0);
  }

  const yearMeta = [
    { n: 1, label: 'Année 1', phase: 'Démarrage',  phaseClass: styles.phaseStart  },
    { n: 2, label: 'Année 2', phase: 'Croissance', phaseClass: styles.phaseGrow   },
    { n: 3, label: 'Année 3', phase: 'Croisière',  phaseClass: styles.phaseCruise },
  ];

  const selYear   = activeYear !== 'all' ? Number(activeYear) : 0;
  const selCA     = selYear ? yearSum(sim.ca, selYear) : 0;
  const selRes    = selYear ? yearSum(sim.result, selYear) : 0;
  const selMar    = selCA > 0 ? Math.round(selRes / selCA * 100) : 0;
  const selTreso  = selYear ? (sim.cashflow[selYear * 12 - 1] ?? 0) : sim.tresoFinal;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className={styles.layout}>

      {/* ── LEFT: Slider panel ── */}
      <aside className={styles.sliderPanel}>
        <div className={styles.sliderPanelHeader}>
          <span className={styles.sliderPanelTitle}>Paramètres</span>
          <button className={styles.resetBtn} onClick={resetInputs}>Réinitialiser</button>
        </div>

        {/* Activité */}
        <div className={styles.sliderGroup}>
          <button className={styles.groupHeader} onClick={() => toggleGroup('activite')}>
            Activité
            <span className={`${styles.groupChevron} ${openGroups.activite ? styles.groupChevronOpen : ''}`}>▼</span>
          </button>
          {openGroups.activite && (
            <div className={styles.groupBody}>
              <SliderRow label="Consultations / jour"   paramKey="consult" value={inputs.consult} min={8}   max={24}  onChange={setParam} />
              <SliderRow label="Honoraire / consult."   paramKey="fee"     value={inputs.fee}     min={120} max={350} step={5} display={v => `CHF ${v}`} onChange={setParam} />
              <SliderRow label="Jours travaillés / an"  paramKey="days"    value={inputs.days}    min={180} max={250} onChange={setParam} />
              <SliderRow label="Rétrocession GynEva"    paramKey="retro"   value={inputs.retro}   min={20}  max={60}  display={v => `${v}%`} onChange={setParam} />
            </div>
          )}
        </div>

        {/* Équipe */}
        <div className={styles.sliderGroup}>
          <button className={styles.groupHeader} onClick={() => toggleGroup('equipe')}>
            Équipe
            <span className={`${styles.groupChevron} ${openGroups.equipe ? styles.groupChevronOpen : ''}`}>▼</span>
          </button>
          {openGroups.equipe && (
            <div className={styles.groupBody}>
              <SliderRow label="Médecins associés" paramKey="assoc"   value={inputs.assoc}   min={1} max={4} onChange={setParam} />
              <SliderRow label="Médecins indép."   paramKey="indep"   value={inputs.indep}   min={0} max={6} onChange={setParam} />
              <SliderRow label="Médecins internes" paramKey="interne" value={inputs.interne} min={0} max={4} onChange={setParam} />
            </div>
          )}
        </div>

        {/* Démarrage */}
        <div className={styles.sliderGroup}>
          <button className={styles.groupHeader} onClick={() => toggleGroup('demarrage')}>
            Démarrage
            <span className={`${styles.groupChevron} ${openGroups.demarrage ? styles.groupChevronOpen : ''}`}>▼</span>
          </button>
          {openGroups.demarrage && (
            <div className={styles.groupBody}>
              <SliderRow label="Mois de démarrage"     paramKey="start" value={inputs.start} min={1}  max={12} display={v => `M${v}`}  onChange={setParam} />
              <SliderRow label="Taux d'occupation Y1"  paramKey="occup" value={inputs.occup} min={30} max={100} display={v => `${v}%`} onChange={setParam} />
            </div>
          )}
        </div>

        {/* Trésorerie */}
        <div className={styles.sliderGroup}>
          <button className={styles.groupHeader} onClick={() => toggleGroup('tresorerie')}>
            Trésorerie
            <span className={`${styles.groupChevron} ${openGroups.tresorerie ? styles.groupChevronOpen : ''}`}>▼</span>
          </button>
          {openGroups.tresorerie && (
            <div className={styles.groupBody}>
              <SliderRow label="Part patients cash" paramKey="cashPct" value={inputs.cashPct} min={0} max={30} display={v => `${v}%`} onChange={setParam} />
              <div className={styles.selectRow}>
                <label className={styles.selectLabel}>Délai LAMal</label>
                <select
                  className={styles.select}
                  value={inputs.delay}
                  onChange={e => setParam('delay', Number(e.target.value))}
                >
                  <option value={0}>0 mois (immédiat)</option>
                  <option value={1}>1 mois</option>
                  <option value={3}>3 mois</option>
                </select>
              </div>
              <div className={styles.toggleRow}>
                <span className={styles.toggleLabel}>Affacturage</span>
                <label className={styles.toggle}>
                  <input
                    type="checkbox"
                    checked={inputs.factoring}
                    onChange={e => setParam('factoring', e.target.checked)}
                  />
                  <span className={styles.toggleSlider} />
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Charges */}
        <div className={styles.sliderGroup}>
          <button className={styles.groupHeader} onClick={() => toggleGroup('charges')}>
            Charges
            <span className={`${styles.groupChevron} ${openGroups.charges ? styles.groupChevronOpen : ''}`}>▼</span>
          </button>
          {openGroups.charges && (
            <div className={styles.groupBody}>
              <SliderRow label="Charges imprévues / an" paramKey="extra" value={inputs.extra} min={0} max={400_000} step={10_000} display={fmt} onChange={setParam} />
              <SliderRow label="RC Professionnelle / an" paramKey="rc"   value={inputs.rc}    min={0} max={120_000} step={5_000}  display={fmt} onChange={setParam} />
            </div>
          )}
        </div>
      </aside>

      {/* ── RIGHT: Content ── */}
      <div className={styles.content}>

        <PageHeader title="Simulateur de scénarios" subtitle="Ajustez les paramètres pour projeter l'impact sur 36 mois" />

        {/* Verdict */}
        <div className={`${styles.verdict} ${styles[`verdict${verdictColor}`]}`}>
          <div className={styles.ic}><VerdictIcon /></div>
          <div className={styles.verdictBody}>
            <strong>Analyse du scénario.</strong>{' '}{verdictText}
          </div>
        </div>

        {/* Top KPIs */}
        <div className={styles.kpiRow}>
          {[
            { label: 'CA Année 3',        val: sim.caY3,        d: dCa,   better: sim.caY3 >= planCaY3 },
            { label: 'Résultat net Y3',   val: sim.resY3,       d: dRes,  better: sim.resY3 >= 0 },
            { label: 'Trésorerie finale', val: sim.tresoFinal,  d: dTres, better: sim.tresoFinal >= 0 },
            { label: 'BFR minimum',       val: sim.bfrMin,      d: dBfr,  better: sim.bfrMin >= -50_000 },
          ].map(k => (
            <div key={k.label} className={styles.kpiCard}>
              <div className={styles.kpiLabel}>{k.label}</div>
              <div className={`${styles.kpiValue} ${k.better ? styles.kpiValueGreen : styles.kpiValueRed}`}>
                {fmt(k.val)}
              </div>
              <div className={`${styles.kpiDelta} ${deltaStyle(k.d)}`}>
                {Math.abs(k.d) > 0.5 ? fmtDelta(k.d) : '= plan initial'}
              </div>
            </div>
          ))}
        </div>

        {/* Year navigator */}
        <div className={styles.yearNav}>
          <div className={styles.yearNavHeader}>
            <span className={styles.yearNavTitle}>Vue par année</span>
            <div className={styles.yearBtns}>
              {(['all', '1', '2', '3'] as const).map(y => (
                <button
                  key={y}
                  className={`${styles.yearBtn} ${activeYear === y ? styles.yearBtnActive : ''}`}
                  onClick={() => setActiveYear(y)}
                >
                  {y === 'all' ? 'Vue 3 ans' : `Année ${y}`}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.yearBody}>
            {activeYear === 'all' ? (
              /* All-year overview cards */
              <div className={styles.yearCards}>
                {yearMeta.map(ym => {
                  const ca  = yearSum(sim.ca, ym.n);
                  const res = yearSum(sim.result, ym.n);
                  const m   = ca > 0 ? Math.round(res / ca * 100) : 0;
                  const treso = sim.cashflow[ym.n * 12 - 1] ?? 0;
                  return (
                    <div key={ym.n} className={styles.yearCard}>
                      <div className={styles.yearCardHead}>
                        <span className={styles.yearCardTitle}>{ym.label}</span>
                        <span className={`${styles.yearPhase} ${ym.phaseClass}`}>{ym.phase}</span>
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
                        <span className={styles.yearMetricLabel}>Tréso. cumul.</span>
                        <span className={styles.yearMetricValue}>{fmt(treso)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Single-year detail */
              <div className={styles.yearDetail}>
                {[
                  {
                    label: `CA Année ${activeYear}`,
                    val: fmt(selCA),
                    sub: `${inputs.assoc + inputs.indep + inputs.interne} praticiens`,
                    tag: selCA > 0 ? 'Actif' : 'Inactif',
                    tagCls: selCA > 0 ? styles.tagGreen : styles.tagRed,
                  },
                  {
                    label: 'Résultat net',
                    val: (selRes >= 0 ? '+' : '') + fmt(selRes),
                    sub: `Marge nette ${selMar}%`,
                    tag: selMar >= 20 ? 'Excellent' : selMar >= 5 ? 'Correct' : 'Insuffisant',
                    tagCls: selMar >= 20 ? styles.tagGreen : selMar >= 5 ? styles.tagOrange : styles.tagRed,
                  },
                  {
                    label: `Tréso. fin A${activeYear}`,
                    val: fmt(selTreso),
                    sub: `BFR min : ${fmt(sim.bfrMin)}`,
                    tag: selTreso >= 0 ? 'Positive' : 'Négative',
                    tagCls: selTreso >= 0 ? styles.tagGreen : styles.tagRed,
                  },
                  {
                    label: 'Marge nette',
                    val: `${selMar}%`,
                    sub: 'Résultat / CA',
                    tag: selMar >= 20 ? 'Solide' : selMar >= 10 ? 'Moyen' : 'Faible',
                    tagCls: selMar >= 20 ? styles.tagGreen : selMar >= 10 ? styles.tagOrange : styles.tagRed,
                  },
                  {
                    label: 'Payback',
                    val: `${payback} mois`,
                    sub: 'Cumul résultat > 0',
                    tag: payback <= 12 ? 'Rapide' : payback <= 18 ? 'Moyen' : 'Long',
                    tagCls: payback <= 12 ? styles.tagGreen : payback <= 18 ? styles.tagOrange : styles.tagRed,
                  },
                  {
                    label: 'Par associé (Y3)',
                    val: fmt(sim.perAssoc),
                    sub: 'Résultat ajusté / assoc.',
                    tag: sim.perAssoc > 0 ? 'Rentable' : 'Déficitaire',
                    tagCls: sim.perAssoc > 0 ? styles.tagGreen : styles.tagRed,
                  },
                ].map(d => (
                  <div key={d.label} className={styles.detailCard}>
                    <div className={styles.detailLabel}>{d.label}</div>
                    <div className={styles.detailValue}>{d.val}</div>
                    <div className={styles.detailSub}>{d.sub}</div>
                    <span className={`${styles.sensitivityTag} ${d.tagCls}`}>{d.tag}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Charts */}
        <div className={styles.chartCard}>
          <div className={styles.chartCardTitle}>CA &amp; Résultat sur 3 ans</div>
          <div className={styles.chartBox}>
            <SimulatorCharts sim={sim} activeYear={activeYear} chartType="bar" />
          </div>
        </div>
        <div className={styles.chartCard}>
          <div className={styles.chartCardTitle}>
            Trésorerie cumulée {activeYear !== 'all' ? `— Année ${activeYear}` : '— 36 mois'}
          </div>
          <div className={styles.chartBox}>
            <SimulatorCharts sim={sim} activeYear={activeYear} chartType="cashflow" />
          </div>
        </div>

        {/* Compare panel — only when meaningfully different from plan */}
        {(Math.abs(dCa) > 1 || Math.abs(dRes) > 1 || Math.abs(dTres) > 1) && (
          <div className={styles.compareCard}>
            <div className={styles.compareHeader}>
              Comparaison scénario vs plan initial
            </div>
            <div className={styles.compareGrid}>
              {[
                { label: 'CA Année 3',          base: planCaY3,  simVal: sim.caY3,       isAmt: true },
                { label: 'Résultat net Y3',      base: planResY3, simVal: sim.resY3,      isAmt: true },
                { label: 'Trésorerie finale',    base: planTreso, simVal: sim.tresoFinal, isAmt: true },
                { label: 'BFR minimum',          base: planBfr,   simVal: sim.bfrMin,     isAmt: true },
                {
                  label: 'Marge nette Y3',
                  base: planCaY3 > 0 ? Math.round(planResY3 / planCaY3 * 100) : 0,
                  simVal: margin3,
                  isAmt: false,
                },
              ].map(row => (
                <div key={row.label} className={styles.compareRow}>
                  <div className={styles.compareMetric}>{row.label}</div>
                  <div className={styles.compareBase}>
                    {row.isAmt ? fmt(row.base) : `${row.base}%`}
                  </div>
                  <div className={`${styles.compareSim} ${row.simVal > row.base ? styles.compareUp : row.simVal < row.base ? styles.compareDown : ''}`}>
                    {row.isAmt ? fmt(row.simVal) : `${row.simVal}%`}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
