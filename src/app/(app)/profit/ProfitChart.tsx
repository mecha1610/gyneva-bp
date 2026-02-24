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
import { Bar, Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Tooltip, Legend, Filler);

function fmt(v: number) {
  if (Math.abs(v) >= 1_000_000) return 'CHF ' + (v / 1_000_000).toFixed(1) + 'M';
  if (Math.abs(v) >= 1_000) return 'CHF ' + Math.round(v / 1_000) + 'k';
  return 'CHF ' + Math.round(v);
}

// ── Annual bar chart ──────────────────────────────────────────────────────

interface BarProps {
  perY1: number; perY2: number; perY3: number;
  adjY1: number; adjY2: number; adjY3: number;
  medY1: number; medY2: number; medY3: number;
}

export function ProfitBarChart({ perY1, perY2, perY3, adjY1, adjY2, adjY3, medY1, medY2, medY3 }: BarProps) {
  const data = {
    labels: ['Année 1', 'Année 2', 'Année 3'],
    datasets: [
      {
        label: 'Résultat brut / associé',
        data: [perY1, perY2, perY3],
        backgroundColor: 'rgba(26,74,122,.8)',
        borderRadius: 6,
        barPercentage: 0.55,
      },
      {
        label: 'Après charges manquantes',
        data: [adjY1, adjY2, adjY3],
        backgroundColor: 'rgba(16,185,129,.8)',
        borderRadius: 6,
        barPercentage: 0.55,
      },
      {
        label: 'Revenu médecin total (+ rétro.)',
        data: [medY1, medY2, medY3],
        backgroundColor: 'rgba(245,158,11,.8)',
        borderRadius: 6,
        barPercentage: 0.55,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' as const, labels: { usePointStyle: true, padding: 14, font: { size: 11 } } },
      tooltip: {
        callbacks: {
          label: (ctx: { dataset: { label?: string }; parsed: { y: number | null } }) =>
            ` ${ctx.dataset.label}: ${fmt(ctx.parsed.y ?? 0)}`,
        },
      },
    },
    scales: {
      x: { grid: { display: false } },
      y: {
        grid: { color: 'rgba(0,0,0,.04)' },
        ticks: { callback: (v: string | number) => fmt(Number(v)), font: { size: 10 } },
      },
    },
  };

  return <Bar data={data} options={options} />;
}

// ── Cumulative profit line chart ──────────────────────────────────────────

interface CumulProps {
  result:         number[];
  nbAssoc:        number;
  monthlyCharges: number;
  investPerAssoc: number;
}

export function ProfitCumulChart({ result, nbAssoc, monthlyCharges, investPerAssoc }: CumulProps) {
  const cumData: number[] = [];
  let cum = 0;
  for (let m = 0; m < 36; m++) {
    cum += (result[m] ?? 0) / nbAssoc - monthlyCharges;
    cumData.push(cum);
  }

  const labels = Array.from({ length: 36 }, (_, i) => `M${i + 1}`);

  const data = {
    labels,
    datasets: [
      {
        label: 'Profit cumulé / associé',
        data: cumData,
        borderColor: '#10b981',
        backgroundColor: 'rgba(16,185,129,.08)',
        fill: true,
        tension: 0.3,
        pointRadius: 0,
        borderWidth: 2.5,
      },
      {
        label: 'Investissement CAPEX / associé',
        data: Array(36).fill(investPerAssoc),
        borderColor: '#ef4444',
        borderWidth: 1.5,
        borderDash: [6, 4],
        pointRadius: 0,
        fill: false,
        tension: 0,
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
