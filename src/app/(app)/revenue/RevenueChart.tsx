'use client';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import type { RevProfile } from '@/stores/useSimStore';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const PROFILE_COLORS: Record<RevProfile, string> = {
  assoc:   '#0f2b46',
  indep:   '#1a4a7a',
  interne: '#5dade2',
  sage:    '#aed6f1',
};

const PROFILE_LABELS: Record<RevProfile, string> = {
  assoc:   'Associés',
  indep:   'Indépendants',
  interne: 'Internes',
  sage:    'Sage-femme',
};

interface Props {
  caAssoc:   number[];
  caIndep:   number[];
  caInterne: number[];
  caSage:    number[];
  activeYear: 'all' | '1' | '2' | '3';
  activeProfiles: Set<RevProfile>;
}

function fmt(v: number) {
  if (Math.abs(v) >= 1_000_000) return 'CHF ' + (v / 1_000_000).toFixed(1) + 'M';
  if (Math.abs(v) >= 1_000) return 'CHF ' + Math.round(v / 1_000) + 'k';
  return 'CHF ' + Math.round(v);
}

const PROFILES: RevProfile[] = ['assoc', 'indep', 'interne', 'sage'];
export default function RevenueChart({ caAssoc, caIndep, caInterne, caSage, activeYear, activeProfiles }: Props) {
  const dataMap: Record<RevProfile, number[]> = {
    assoc:   caAssoc,
    indep:   caIndep,
    interne: caInterne,
    sage:    caSage,
  };

  const startM = activeYear === 'all' ? 0 : (Number(activeYear) - 1) * 12;
  const endM   = activeYear === 'all' ? 36 : Number(activeYear) * 12;

  const labels = Array.from({ length: endM - startM }, (_, i) => `M${startM + i + 1}`);

  const datasets = PROFILES
    .filter(p => activeProfiles.has(p))
    .map(p => ({
      label: PROFILE_LABELS[p],
      data: dataMap[p].slice(startM, endM),
      backgroundColor: PROFILE_COLORS[p],
      borderRadius: 1,
      stack: 'stack',
    }));

  const data = { labels, datasets };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' as const, labels: { usePointStyle: true, padding: 12, font: { size: 11 } } },
      tooltip: {
        callbacks: {
          label: (ctx: { dataset: { label?: string }; parsed: { y: number | null } }) =>
            ` ${ctx.dataset.label}: ${fmt(ctx.parsed.y ?? 0)}`,
        },
      },
    },
    scales: {
      x: { stacked: true, grid: { display: false }, ticks: { font: { size: 10 }, maxTicksLimit: 12 } },
      y: {
        stacked: true,
        grid: { color: 'rgba(0,0,0,.04)' },
        ticks: { callback: (v: string | number) => fmt(Number(v)), font: { size: 10 } },
      },
    },
  };

  return <Bar data={data} options={options} />;
}
