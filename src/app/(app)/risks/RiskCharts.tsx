'use client';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

function fmt(v: number) {
  if (Math.abs(v) >= 1_000_000) return 'CHF ' + (v / 1_000_000).toFixed(1) + 'M';
  if (Math.abs(v) >= 1_000) return 'CHF ' + Math.round(v / 1_000) + 'k';
  return 'CHF ' + Math.round(v);
}

// ── Stress scenario bar chart ──────────────────────────────────────────────

interface StressProps {
  baseCA: number;  baseRes: number;
  pessCA: number;  pessRes: number;
  optCA:  number;  optRes:  number;
}

export function StressChart({ baseCA, baseRes, pessCA, pessRes, optCA, optRes }: StressProps) {
  const data = {
    labels: ['CA Année 3', 'Résultat Année 3'],
    datasets: [
      {
        label: 'Optimiste',
        data: [optCA, optRes],
        backgroundColor: 'rgba(16,185,129,.8)',
        borderRadius: 4,
        barPercentage: 0.6,
      },
      {
        label: 'Base',
        data: [baseCA, baseRes],
        backgroundColor: 'rgba(37,99,235,.8)',
        borderRadius: 4,
        barPercentage: 0.6,
      },
      {
        label: 'Pessimiste',
        data: [pessCA, pessRes],
        backgroundColor: 'rgba(239,68,68,.8)',
        borderRadius: 4,
        barPercentage: 0.6,
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
      x: { grid: { display: false } },
      y: {
        grid: { color: 'rgba(0,0,0,.04)' },
        ticks: { callback: (v: string | number) => fmt(Number(v)), font: { size: 10 } },
      },
    },
  };

  return <Bar data={data} options={options} />;
}

// ── Charges donut chart ────────────────────────────────────────────────────

interface ChargesDonutProps {
  critiqueMid:  number;
  importantMid: number;
  moyenMid:     number;
}

export function ChargesDonutChart({ critiqueMid, importantMid, moyenMid }: ChargesDonutProps) {
  const data = {
    labels: ['Critique', 'Important', 'Moyen'],
    datasets: [
      {
        data: [critiqueMid, importantMid, moyenMid],
        backgroundColor: [
          'rgba(239,68,68,.8)',
          'rgba(245,158,11,.8)',
          'rgba(37,99,235,.8)',
        ],
        borderWidth: 0,
        hoverOffset: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'right' as const, labels: { usePointStyle: true, padding: 10, font: { size: 11 } } },
      tooltip: {
        callbacks: {
          label: (ctx: { label?: string; raw: unknown }) =>
            ` ${ctx.label ?? ''}: ${fmt(Number(ctx.raw))}`,
        },
      },
    },
    cutout: '60%',
  };

  return <Doughnut data={data} options={options} />;
}
