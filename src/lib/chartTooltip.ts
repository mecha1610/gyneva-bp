/**
 * Branded Chart.js external tooltip — matches design system CSS variables.
 * Usage: add `tooltip: { enabled: false, external: brandedTooltip }` to chart options.
 */

export function fmtTooltip(v: number | string): string {
  if (typeof v !== 'number') return String(v);
  const abs = Math.abs(v);
  if (abs >= 1_000_000) return 'CHF ' + (v / 1_000_000).toFixed(2) + 'M';
  if (abs >= 1_000)     return 'CHF ' + Math.round(v / 1_000) + 'k';
  return 'CHF ' + Math.round(v);
}

type DataPoint = {
  dataset: { label?: string; borderColor?: string; backgroundColor?: string };
  formattedValue: string;
  raw: unknown;
  label: string;
};

type TooltipContext = {
  chart: { canvas: HTMLCanvasElement };
  tooltip: {
    opacity: number;
    dataPoints: DataPoint[];
    caretX: number;
    caretY: number;
    title: string[];
  };
};

function getOrCreate(): HTMLDivElement {
  const id = 'chartjs-branded-tooltip';
  let el = document.getElementById(id) as HTMLDivElement | null;
  if (!el) {
    el = document.createElement('div');
    el.id = id;
    document.body.appendChild(el);
  }
  return el;
}

function buildTooltipDom(
  el: HTMLDivElement,
  title: string,
  dataPoints: DataPoint[],
  formatter: (raw: unknown, label?: string) => string,
): void {
  // Clear existing children safely
  while (el.firstChild) el.removeChild(el.firstChild);

  if (title) {
    const titleEl = document.createElement('div');
    titleEl.textContent = title;
    Object.assign(titleEl.style, {
      color: 'var(--txtL)',
      marginBottom: '.3rem',
      fontSize: '.72rem',
      letterSpacing: '.02em',
    } as Partial<CSSStyleDeclaration>);
    el.appendChild(titleEl);
  }

  for (const dp of dataPoints) {
    const color =
      (typeof dp.dataset.borderColor === 'string' && dp.dataset.borderColor !== 'transparent'
        ? dp.dataset.borderColor
        : null) ??
      (typeof dp.dataset.backgroundColor === 'string'
        ? dp.dataset.backgroundColor
        : null) ??
      'var(--txt)';
    const name = dp.dataset.label ?? '';
    const val  = formatter(dp.raw, name);

    const row = document.createElement('div');
    Object.assign(row.style, {
      color,
      fontVariantNumeric: 'tabular-nums',
      lineHeight: '1.6',
    } as Partial<CSSStyleDeclaration>);

    if (name) {
      const nameSpan = document.createElement('span');
      nameSpan.textContent = name + ': ';
      nameSpan.style.color = 'var(--txtL)';
      row.appendChild(nameSpan);
    }

    row.appendChild(document.createTextNode(val));
    el.appendChild(row);
  }
}

function makeTooltip(
  formatter: (raw: unknown, label?: string) => string,
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function externalTooltip(context: any) {
    const { chart, tooltip } = context as TooltipContext;
    const el = getOrCreate();

    if (tooltip.opacity === 0) {
      el.style.opacity = '0';
      return;
    }

    const title = tooltip.title?.[0] ?? '';
    buildTooltipDom(el, title, tooltip.dataPoints, formatter);

    Object.assign(el.style, {
      position:      'fixed',
      background:    'var(--card)',
      border:        '1px solid var(--brd)',
      borderRadius:  '6px',
      padding:       '.55rem .85rem',
      fontSize:      '.78rem',
      boxShadow:     'var(--sh-md)',
      fontFamily:    'var(--font-mono)',
      minWidth:      '140px',
      pointerEvents: 'none',
      transition:    'opacity .1s ease',
      zIndex:        '9999',
      opacity:       '1',
      whiteSpace:    'nowrap',
    } as Partial<CSSStyleDeclaration>);

    const rect = chart.canvas.getBoundingClientRect();
    const x = rect.left + tooltip.caretX;
    const y = rect.top  + tooltip.caretY;

    const ttW = el.offsetWidth  || 160;
    const ttH = el.offsetHeight || 80;
    const left = Math.min(x + 12, window.innerWidth  - ttW - 8);
    const top  = Math.min(y - ttH / 2, window.innerHeight - ttH - 8);

    el.style.left = left + 'px';
    el.style.top  = Math.max(8, top) + 'px';
  };
}

/** Monetary formatter (CHF) */
export const brandedTooltip = makeTooltip((raw) => fmtTooltip(raw as number));

/** ETP / count formatter */
export const brandedTooltipCount = makeTooltip((raw) => `${raw} ETP`);

/** Percentage formatter */
export const brandedTooltipPct = makeTooltip((raw) => `${raw}%`);
