'use client';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, Tooltip, Legend, Filler);

function fmt(v: number) {
  if (Math.abs(v) >= 1_000_000) return 'CHF ' + (v / 1_000_000).toFixed(1) + 'M';
  if (Math.abs(v) >= 1_000) return 'CHF ' + Math.round(v / 1_000) + 'k';
  return 'CHF ' + Math.round(v);
}

const SCENARIO_COLORS = ['#d63031', '#e17055', '#fdcb6e', '#00b894'] as const;

interface Props {
  worstData:    number[];
  cashOnlyData: number[];
  cash1mData:   number[];
  factData:     number[];
  matchIdx:     number; // 0-3, which scenario matches current config
  cashPct:      number; // 0-30 (%)
}

export function OptimizeChart({ worstData, cashOnlyData, cash1mData, factData, matchIdx, cashPct }: Props) {
  const labels = Array.from({ length: 36 }, (_, i) => `M${i + 1}`);

  const datasets = [
    { label: 'Pire cas (LAMal 3m, no cash)',             data: worstData    },
    { label: `Cash ${cashPct}% + LAMal 3m`,              data: cashOnlyData },
    { label: `Cash ${cashPct}% + LAMal 1m`,              data: cash1mData   },
    { label: `Cash ${cashPct}% + Factoring`,             data: factData     },
  ].map((sc, i) => ({
    label: sc.label,
    data: sc.data,
    borderColor: SCENARIO_COLORS[i],
    backgroundColor: i === matchIdx ? SCENARIO_COLORS[i] + '18' : 'transparent',
    fill: i === matchIdx,
    tension: 0.3,
    pointRadius: 0,
    borderWidth: i === matchIdx ? 3 : 1.5,
    borderDash: i === matchIdx ? [] : [5, 4],
  }));

  const data = { labels, datasets };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index' as const, intersect: false },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: { usePointStyle: true, padding: 12, font: { size: 11 } },
      },
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
