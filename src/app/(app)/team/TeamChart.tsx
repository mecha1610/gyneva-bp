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
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Tooltip, Legend);

type ActiveYear = 'all' | '1' | '2' | '3';

// ── Stacked ETP bar chart ─────────────────────────────────────────────────

interface EtpProps {
  fteAssoc:   number[];
  fteIndep:   number[];
  fteInterne: number[];
  fteAdmin:   number[];
  activeYear: ActiveYear;
}

export function EtpChart({ fteAssoc, fteIndep, fteInterne, fteAdmin, activeYear }: EtpProps) {
  const startM = activeYear === 'all' ? 0  : (Number(activeYear) - 1) * 12;
  const endM   = activeYear === 'all' ? 36 : Number(activeYear) * 12;
  const labels = Array.from({ length: endM - startM }, (_, i) => `M${startM + i + 1}`);
  const sl = (arr: number[]) => arr.slice(startM, endM);

  const data = {
    labels,
    datasets: [
      { label: 'Associés',       data: sl(fteAssoc),   backgroundColor: '#0f2b46', stack: 'fte', borderRadius: 1 },
      { label: 'Indépendants',   data: sl(fteIndep),   backgroundColor: '#1a4a7a', stack: 'fte', borderRadius: 1 },
      { label: 'Internes',       data: sl(fteInterne), backgroundColor: '#5dade2', stack: 'fte', borderRadius: 1 },
      { label: 'Administratifs', data: sl(fteAdmin),   backgroundColor: '#aed6f1', stack: 'fte', borderRadius: 1 },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' as const, labels: { usePointStyle: true, padding: 12, font: { size: 11 } } },
      tooltip: {
        callbacks: {
          label: (ctx: { dataset: { label?: string }; parsed: { y: number | null } }) =>
            ` ${ctx.dataset.label}: ${ctx.parsed.y ?? 0} ETP`,
        },
      },
    },
    scales: {
      x: { stacked: true, grid: { display: false }, ticks: { font: { size: 10 }, maxTicksLimit: 12 } },
      y: { stacked: true, grid: { color: 'rgba(0,0,0,.04)' }, ticks: { stepSize: 1, font: { size: 10 } } },
    },
  };

  return <Bar data={data} options={options} />;
}

// ── Productivity line chart (CA / ETP per month) ──────────────────────────

interface ProdProps {
  ca:       number[];
  fteTotal: number[];
  activeYear: ActiveYear;
}

export function ProductivityChart({ ca, fteTotal, activeYear }: ProdProps) {
  const startM = activeYear === 'all' ? 0  : (Number(activeYear) - 1) * 12;
  const endM   = activeYear === 'all' ? 36 : Number(activeYear) * 12;
  const labels = Array.from({ length: endM - startM }, (_, i) => `M${startM + i + 1}`);

  // CA per FTE per month (raw)
  const raw = Array.from({ length: endM - startM }, (_, i) => {
    const m = startM + i;
    const fte = fteTotal[m] ?? 0;
    return fte > 0 ? Math.round((ca[m] ?? 0) / fte) : 0;
  });

  // 3-month moving average
  const sma3 = raw.map((_, i) => {
    const slice = raw.slice(Math.max(0, i - 2), i + 1);
    return Math.round(slice.reduce((a, b) => a + b, 0) / slice.length);
  });

  function fmt(v: number) {
    if (v >= 1_000_000) return 'CHF ' + (v / 1_000_000).toFixed(1) + 'M';
    if (v >= 1_000) return 'CHF ' + Math.round(v / 1_000) + 'k';
    return 'CHF ' + v;
  }

  const data = {
    labels,
    datasets: [
      {
        label: 'CA / ETP',
        data: raw,
        borderColor: 'rgba(37,99,235,.3)',
        backgroundColor: 'transparent',
        borderWidth: 1,
        pointRadius: 0,
        tension: 0.2,
      },
      {
        label: 'Moy. mobile 3 mois',
        data: sma3,
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37,99,235,.07)',
        borderWidth: 2.5,
        pointRadius: 0,
        tension: 0.4,
        fill: true,
      },
    ],
  };

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
      x: { grid: { display: false }, ticks: { font: { size: 10 }, maxTicksLimit: 12 } },
      y: {
        grid: { color: 'rgba(0,0,0,.04)' },
        ticks: { callback: (v: string | number) => fmt(Number(v)), font: { size: 10 } },
      },
    },
  };

  return <Line data={data} options={options} />;
}
