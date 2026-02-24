'use client';

import dynamic from 'next/dynamic';
import { useSimStore } from '@/stores/useSimStore';
import type { RevProfile } from '@/stores/useSimStore';
import { computeDerived } from '@lib/compute';
import styles from './page.module.css';

const RevenueChart = dynamic(() => import('./RevenueChart'), { ssr: false });

// ── Helpers ────────────────────────────────────────────────────────────────

function fmt(v: number): string {
  if (Math.abs(v) >= 1_000_000) return 'CHF ' + (v / 1_000_000).toFixed(1) + 'M';
  if (Math.abs(v) >= 1_000) return 'CHF ' + Math.round(v / 1_000) + 'k';
  return 'CHF ' + Math.round(v);
}

function sum(arr: number[], s: number, e: number) {
  return arr.slice(s, e).reduce((a, b) => a + b, 0);
}

// ── Profile config ─────────────────────────────────────────────────────────

const PROFILES: { key: RevProfile; label: string; color: string; share: string }[] = [
  { key: 'assoc',   label: 'Associés',      color: '#0f2b46', share: '60% médecin / 40% GynEva' },
  { key: 'indep',   label: 'Indépendants',  color: '#1a4a7a', share: '60% médecin / 40% GynEva' },
  { key: 'interne', label: 'Internes',      color: '#5dade2', share: 'CA pour GynEva (salarié)' },
  { key: 'sage',    label: 'Sage-femme',    color: '#aed6f1', share: 'Contribution nette' },
];

const DATA_KEYS: Record<RevProfile, 'caAssoc' | 'caIndep' | 'caInterne' | 'caSage'> = {
  assoc:   'caAssoc',
  indep:   'caIndep',
  interne: 'caInterne',
  sage:    'caSage',
};

const FTE_KEYS: Record<RevProfile, 'fteAssoc' | 'fteIndep' | 'fteInterne' | null> = {
  assoc:   'fteAssoc',
  indep:   'fteIndep',
  interne: 'fteInterne',
  sage:    null,
};

// ── Component ──────────────────────────────────────────────────────────────

export default function RevenuePage() {
  const planData       = useSimStore(s => s.planData);
  const activeYear     = useSimStore(s => s.revActiveYear);
  const activeProfiles = useSimStore(s => s.revActiveProfiles);
  const setActiveYear  = useSimStore(s => s.setActiveYear);
  const toggleProfile  = useSimStore(s => s.toggleRevProfile);
  const D              = computeDerived(planData);

  // ── Year range ───────────────────────────────────────────────────────────

  const startM = activeYear === 'all' ? 0  : (Number(activeYear) - 1) * 12;
  const endM   = activeYear === 'all' ? 36 : Number(activeYear) * 12;

  // ── Active CA arrays (filtered by profiles) ──────────────────────────────

  function profileCA(profile: RevProfile, s = startM, e = endM) {
    return sum(planData[DATA_KEYS[profile]], s, e);
  }

  const totalCA = PROFILES
    .filter(p => activeProfiles.has(p.key))
    .reduce((acc, p) => acc + profileCA(p.key), 0);

  // ── KPIs ─────────────────────────────────────────────────────────────────

  const caY1 = sum(planData.ca, 0, 12);
  const caY2 = sum(planData.ca, 12, 24);
  const caY3 = sum(planData.ca, 24, 36);

  const growthY1Y3 = caY1 > 0 ? Math.round((caY3 - caY1) / caY1 * 100) : 0;
  const growthYoY  = activeYear === '2'
    ? (caY1 > 0 ? Math.round((caY2 - caY1) / caY1 * 100) : 0)
    : activeYear === '3'
    ? (caY2 > 0 ? Math.round((caY3 - caY2) / caY2 * 100) : 0)
    : growthY1Y3;

  // Diversification: profiles with > 5% of total Y3 CA
  const activeCount = PROFILES.filter(p => {
    const ca = profileCA(p.key, 24, 36);
    return ca > caY3 * 0.05;
  }).length;

  // ── Verdict score ────────────────────────────────────────────────────────

  let score = 0;
  score += growthY1Y3 >= 100 ? 3 : growthY1Y3 >= 50 ? 2 : growthY1Y3 >= 0 ? 1 : 0;
  score += activeCount >= 4 ? 3 : activeCount >= 3 ? 2 : activeCount >= 2 ? 1 : 0;
  score += caY3 >= 3_000_000 ? 3 : caY3 >= 2_000_000 ? 2 : caY3 >= 1_000_000 ? 1 : 0;
  score += (caY3 - caY2) > 0 ? 3 : (caY3 - caY2) === 0 ? 1 : 0;

  const verdictColor = score >= 9 ? 'Green' : score >= 5 ? 'Orange' : 'Red';
  const verdictIcon  = score >= 9 ? '💰' : score >= 5 ? '⚠️' : '❌';
  const verdictText  =
    score >= 9
      ? `Revenus solides — CA Y3 ${fmt(caY3)}, croissance ${growthY1Y3}% sur 3 ans, ${activeCount} sources actives.`
      : score >= 5
      ? `Revenus corrects — CA Y3 ${fmt(caY3)}, diversification à renforcer (${activeCount}/4 sources).`
      : `Revenus insuffisants — CA Y3 ${fmt(caY3)}, croissance ${growthY1Y3}%.`;

  // ── Growth label ─────────────────────────────────────────────────────────

  const growthLabel = activeYear === '2' ? 'vs Année 1' : activeYear === '3' ? 'vs Année 2' : 'Y1 → Y3';
  const caLabel     = activeYear === 'all' ? 'CA total (3 ans)' : `CA Année ${activeYear}`;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div>

      {/* Verdict */}
      <div className={`${styles.verdict} ${styles[`verdict${verdictColor}`]}`}>
        <div className={styles.verdictIc}>{verdictIcon}</div>
        <div><strong>Analyse du chiffre d&apos;affaires.</strong>{' '}{verdictText}</div>
      </div>

      {/* Controls */}
      <div className={styles.controls}>
        {/* Year tabs */}
        <div className={styles.yearBtns}>
          {(['all', '1', '2', '3'] as const).map(y => (
            <button
              key={y}
              className={`${styles.yearBtn} ${activeYear === y ? styles.yearBtnActive : ''}`}
              onClick={() => setActiveYear('revenue', y)}
            >
              {y === 'all' ? 'Vue 3 ans' : `Année ${y}`}
            </button>
          ))}
        </div>

        {/* Profile filters */}
        <div className={styles.profileBar}>
          {PROFILES.map(p => {
            const active = activeProfiles.has(p.key);
            return (
              <button
                key={p.key}
                className={`${styles.profBtn} ${active ? styles.profBtnActive : ''}`}
                style={active ? { background: p.color, borderColor: p.color } : {}}
                onClick={() => toggleProfile(p.key)}
              >
                <span className={styles.profDot} style={{ background: active ? '#fff' : p.color }} />
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* KPI grid */}
      <div className={styles.kpiGrid}>
        <div className={`${styles.kpi} ${styles.kpiBlue}`}>
          <div className={styles.kpiLabel}>Potentiel / spécialiste</div>
          <div className={styles.kpiValue}>{fmt(planData.revSpec)}</div>
          <div className={styles.kpiSub}>CHF/an à 100 % d&apos;occupation</div>
        </div>
        <div className={styles.kpi}>
          <div className={styles.kpiLabel}>{caLabel}</div>
          <div className={styles.kpiValue}>{fmt(totalCA)}</div>
          <div className={styles.kpiSub}>
            {activeProfiles.size < 4 ? `${activeProfiles.size} profil(s) actif(s)` : 'Tous les profils'}
          </div>
        </div>
        <div className={styles.kpi}>
          <div className={styles.kpiLabel}>Croissance</div>
          <div className={styles.kpiValue} style={{ color: growthYoY >= 0 ? 'var(--acc)' : 'var(--danger)' }}>
            {growthYoY > 0 ? '+' : ''}{growthYoY}%
          </div>
          <div className={styles.kpiSub}>{growthLabel}</div>
        </div>
        <div className={`${styles.kpi} ${styles.kpiGreen}`}>
          <div className={styles.kpiLabel}>Diversification</div>
          <div className={styles.kpiValue}>{activeCount}/4</div>
          <div className={styles.kpiSub}>Sources &gt; 5 % du CA</div>
        </div>
      </div>

      {/* Stacked bar chart */}
      <div className={styles.card}>
        <div className={styles.cardTitle}>
          💰 CA mensuel par source
          {activeYear !== 'all' && ` — Année ${activeYear}`}
        </div>
        <div className={styles.chartBox}>
          <RevenueChart
            caAssoc={planData.caAssoc}
            caIndep={planData.caIndep}
            caInterne={planData.caInterne}
            caSage={planData.caSage}
            activeYear={activeYear}
            activeProfiles={activeProfiles}
          />
        </div>
      </div>

      {/* Per-profile detail cards */}
      <div className={styles.detailGrid}>
        {PROFILES.filter(p => activeProfiles.has(p.key)).map(p => {
          const fteKey = FTE_KEYS[p.key];
          const caP1 = profileCA(p.key, 0, 12);
          const caP2 = profileCA(p.key, 12, 24);
          const caP3 = profileCA(p.key, 24, 36);
          const fteEnd = fteKey ? (planData[fteKey][35] ?? 0) : '—';
          const pctOfTotal = caY3 > 0 ? Math.round(caP3 / caY3 * 100) : 0;

          return (
            <div key={p.key} className={styles.profCard}>
              <div className={styles.profCardHeader}>
                <span className={styles.profCardDot} style={{ background: p.color }} />
                <span className={styles.profCardName}>{p.label}</span>
                <span className={styles.profCardShare}>{pctOfTotal}% CA Y3</span>
              </div>
              <div className={styles.profCardBody}>
                <div className={styles.profRow}>
                  <span className={styles.profRowLabel}>CA Année 1</span>
                  <span className={styles.profRowValue}>{fmt(caP1)}</span>
                </div>
                <div className={styles.profRow}>
                  <span className={styles.profRowLabel}>CA Année 2</span>
                  <span className={styles.profRowValue}>{fmt(caP2)}</span>
                </div>
                <div className={styles.profRow}>
                  <span className={styles.profRowLabel}>CA Année 3</span>
                  <span className={styles.profRowValue}>{fmt(caP3)}</span>
                </div>
                {fteKey && (
                  <div className={styles.profRow}>
                    <span className={styles.profRowLabel}>ETP fin Y3</span>
                    <span className={styles.profRowValue}>{fteEnd}</span>
                  </div>
                )}
                <div className={styles.profRow}>
                  <span className={styles.profRowLabel}>Partage</span>
                  <span className={styles.profRowValue} style={{ fontSize: '.7rem', fontWeight: 500 }}>{p.share}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Revenue sharing model */}
      <div className={styles.modelCard}>
        <div className={styles.modelTitle}>💱 Modèle de partage du chiffre d&apos;affaires</div>
        <div className={styles.modelExp}>
          <strong>Associés :</strong> 60 % de leurs honoraires pour eux, 40 % pour GynEva.<br />
          <strong>Indépendants :</strong> 60 % pour eux, 40 % pour GynEva.<br />
          <strong>Internes :</strong> Salariés — GynEva perçoit le CA et paye le salaire (55 % du CA).<br />
          <strong>Sage-femme :</strong> Contribution nette via les prestations maternité (CHF 13 333/mois à pleine activité).
        </div>
      </div>

    </div>
  );
}
