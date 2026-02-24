'use client';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Tooltip, Legend, Filler);

function fmt(v: number) {
  if (Math.abs(v) >= 1_000_000) return 'CHF ' + (v / 1_000_000).toFixed(1) + 'M';
  if (Math.abs(v) >= 1_000) return 'CHF ' + Math.round(v / 1_000) + 'k';
  return 'CHF ' + Math.round(v);
}

// ── Scenario line chart ────────────────────────────────────────────────────

interface ScenarioProps {
  baseline:   number[];   // planData.cashflow
  tresoCash1m: number[];  // 1-month delay
  tresoCash3m: number[];  // 3-month delay (worst)
  tresoFact:  number[];   // factoring
  activeYear: 'all' | '1' | '2' | '3';
}

export function ScenarioChart({ baseline, tresoCash1m, tresoCash3m, tresoFact, activeYear }: ScenarioProps) {
  const startM = activeYear === 'all' ? 0  : (Number(activeYear) - 1) * 12;
  const endM   = activeYear === 'all' ? 36 : Number(activeYear) * 12;

  const labels = Array.from({ length: endM - startM }, (_, i) => `M${startM + i + 1}`);

  const slice = (arr: number[]) => arr.slice(startM, endM);

  const data = {
    labels,
    datasets: [
      {
        label: 'Affacturage',
        data: slice(tresoFact),
        borderColor: '#0f2b46',
        backgroundColor: 'transparent',
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.3,
      },
      {
        label: 'LAMal 1 mois',
        data: slice(tresoCash1m),
        borderColor: '#2563eb',
        backgroundColor: 'transparent',
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.3,
        borderDash: [4, 3],
      },
      {
        label: 'Baseline',
        data: slice(baseline),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16,185,129,.07)',
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.3,
        fill: true,
      },
      {
        label: 'LAMal 3 mois (pire cas)',
        data: slice(tresoCash3m),
        borderColor: '#ef4444',
        backgroundColor: 'transparent',
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.3,
        borderDash: [6, 3],
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index' as const, intersect: false },
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
      x: { grid: { display: false }, ticks: { font: { size: 10 }, maxTicksLimit: 12 } },
      y: {
        grid: { color: 'rgba(0,0,0,.04)' },
        ticks: { callback: (v: string | number) => fmt(Number(v)), font: { size: 10 } },
      },
    },
  };

  return <Line data={data} options={options} />;
}

// ── Monthly net bar chart ──────────────────────────────────────────────────

interface NetProps {
  ca:    number[];
  admin: number[];
  opex:  number[];
  lab:   number[];
  activeYear: 'all' | '1' | '2' | '3';
}

export function MonthlyNetChart({ ca, admin, opex, lab, activeYear }: NetProps) {
  const startM = activeYear === 'all' ? 0  : (Number(activeYear) - 1) * 12;
  const endM   = activeYear === 'all' ? 36 : Number(activeYear) * 12;

  const labels = Array.from({ length: endM - startM }, (_, i) => `M${startM + i + 1}`);

  const netValues = Array.from({ length: endM - startM }, (_, i) => {
    const m = startM + i;
    return (ca[m] ?? 0) + (admin[m] ?? 0) + (opex[m] ?? 0) - Math.abs(lab[m] ?? 0);
  });

  const colors = netValues.map(v => v >= 0 ? 'rgba(16,185,129,.75)' : 'rgba(239,68,68,.7)');

  const data = {
    labels,
    datasets: [
      {
        label: 'Flux net mensuel',
        data: netValues,
        backgroundColor: colors,
        borderRadius: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: { parsed: { y: number | null } }) =>
            ` Flux net: ${fmt(ctx.parsed.y ?? 0)}`,
        },
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 10 }, maxTicksLimit: 12 } },
      y: {
        grid: { color: 'rgba(0,0,0,.04)' },
        ticks: { callback: (v: string | number) => fmt(Number(v)), font: { size: 10 } },
      },
    },
  };

  return <Bar data={data} options={options} />;
}
