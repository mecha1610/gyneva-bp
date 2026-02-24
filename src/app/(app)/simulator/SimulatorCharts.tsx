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
import type { SimulationResult } from '@lib/simulation';

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
  sim: SimulationResult;
  activeYear: 'all' | '1' | '2' | '3';
  chartType: 'bar' | 'cashflow';
}

function fmt(v: number) {
  if (Math.abs(v) >= 1_000_000) return 'CHF ' + (v / 1_000_000).toFixed(1) + 'M';
  if (Math.abs(v) >= 1_000) return 'CHF ' + Math.round(v / 1_000) + 'k';
  return 'CHF ' + Math.round(v);
}

export default function SimulatorCharts({ sim, activeYear, chartType }: Props) {
  if (chartType === 'bar') {
    const data = {
      labels: ['Année 1', 'Année 2', 'Année 3'],
      datasets: [
        {
          type: 'bar' as const,
          label: 'CA',
          data: [sim.caY1, sim.caY2, sim.caY3],
          backgroundColor: 'rgba(37,99,235,.75)',
          borderRadius: 6,
          barPercentage: 0.65,
          yAxisID: 'y',
        },
        {
          type: 'bar' as const,
          label: 'Résultat net',
          data: [sim.resY1, sim.resY2, sim.resY3],
          backgroundColor: 'rgba(16,185,129,.75)',
          borderRadius: 6,
          barPercentage: 0.65,
          yAxisID: 'y',
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
        y: {
          grid: { color: 'rgba(0,0,0,.04)' },
          ticks: { callback: (v: string | number) => fmt(Number(v)), font: { size: 10 } },
        },
        x: { grid: { display: false } },
      },
    };
    return <Chart type="bar" data={data} options={options} />;
  }

  // cashflow line chart
  const startM = activeYear === 'all' ? 0 : (Number(activeYear) - 1) * 12;
  const endM   = activeYear === 'all' ? 36 : Number(activeYear) * 12;
  const cfData = sim.cashflow.slice(startM, endM);
  const cfLabels = Array.from({ length: cfData.length }, (_, i) => `M${startM + i + 1}`);

  const data = {
    labels: cfLabels,
    datasets: [
      {
        type: 'line' as const,
        label: 'Trésorerie cumulée',
        data: cfData,
        borderColor: '#e17055',
        backgroundColor: 'rgba(225,112,85,.08)',
        borderWidth: 2,
        pointRadius: cfData.length <= 12 ? 3 : 0,
        tension: 0.35,
        fill: true,
        yAxisID: 'y',
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
      y: {
        grid: { color: 'rgba(0,0,0,.04)' },
        ticks: { callback: (v: string | number) => fmt(Number(v)), font: { size: 10 } },
      },
      x: { grid: { display: false }, ticks: { font: { size: 10 }, maxTicksLimit: 12 } },
    },
  };
  return <Chart type="line" data={data} options={options} />;
}
