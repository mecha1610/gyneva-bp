'use client';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Chart } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

interface Props {
  caY1: number; caY2: number; caY3: number;
  resY1: number; resY2: number; resY3: number;
  treso: [number, number, number];
}

function fmt(v: number) {
  if (Math.abs(v) >= 1_000_000) return 'CHF ' + (v / 1_000_000).toFixed(1) + 'M';
  if (Math.abs(v) >= 1_000) return 'CHF ' + Math.round(v / 1_000) + 'k';
  return 'CHF ' + Math.round(v);
}

export default function OverviewChart({ caY1, caY2, caY3, resY1, resY2, resY3, treso }: Props) {
  const labels = ['Année 1', 'Année 2', 'Année 3'];

  const data = {
    labels,
    datasets: [
      {
        type: 'bar' as const,
        label: 'CA',
        data: [caY1, caY2, caY3],
        backgroundColor: 'rgba(26,74,122,.8)',
        borderRadius: 8,
        barPercentage: 0.6,
        yAxisID: 'y',
      },
      {
        type: 'bar' as const,
        label: 'Résultat net',
        data: [resY1, resY2, resY3],
        backgroundColor: 'rgba(0,184,148,.8)',
        borderRadius: 8,
        barPercentage: 0.6,
        yAxisID: 'y',
      },
      {
        type: 'line' as const,
        label: 'Trésorerie cumul.',
        data: treso,
        borderColor: '#e17055',
        backgroundColor: 'rgba(225,112,85,.08)',
        borderWidth: 2.5,
        pointRadius: 5,
        pointBackgroundColor: '#e17055',
        tension: 0.3,
        fill: true,
        yAxisID: 'y',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: { usePointStyle: true, padding: 16, font: { size: 11 } },
      },
      tooltip: {
        callbacks: {
          label: (ctx: { dataset: { label?: string }; parsed: { y: number | null } }) =>
            ` ${ctx.dataset.label}: ${fmt(ctx.parsed.y ?? 0)}`,
        },
      },
    },
    scales: {
      y: {
        grid: { color: 'rgba(0,0,0,.04)' },
        ticks: {
          callback: (v: string | number) => fmt(Number(v)),
          font: { size: 11 },
        },
      },
      x: { grid: { display: false } },
    },
  };

  return <Chart type="bar" data={data} options={options} />;
}
