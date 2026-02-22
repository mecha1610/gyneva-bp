import type { SimulatorParams } from './types';
import { FACT_COST } from './constants';

export interface SimulationResult {
  ca: number[];
  result: number[];
  cashflow: number[];
  caY1: number;
  caY2: number;
  caY3: number;
  resY1: number;
  resY2: number;
  resY3: number;
  resAdj: number;
  perAssoc: number;
  bfrMin: number;
  tresoFinal: number;
}

/**
 * Pure simulation engine — mirrors the inline computeSimulation() in index.html.
 * Any change here MUST be reflected in public/index.html and vice-versa.
 */
export function computeSimulation(params: SimulatorParams): SimulationResult {
  const V = {
    consult: params.consult,
    fee: params.fee,
    days: params.days,
    assoc: params.assoc,
    indep: params.indep,
    interne: params.interne,
    start: params.start,
    occup: params.occup / 100,
    cashPct: params.cashPct / 100,
    delay: params.delay,
    factoring: params.factoring,
    extra: params.extra,
    rc: params.rc,
    retro: (params.retro || 40) / 100,
  };

  const annualCA_per_spec = V.consult * V.fee * V.days;
  const monthlyCA_per_spec = annualCA_per_spec / 12;

  const simCA: number[] = [];
  const simResult: number[] = [];
  const simCashflow: number[] = [];
  let cumCash = 0;

  for (let m = 0; m < 36; m++) {
    const year = m < 12 ? 1 : m < 24 ? 2 : 3;

    let occ = 0;
    if (m >= V.start - 1) {
      const monthsSinceStart = m - (V.start - 1);
      if (year === 1) occ = Math.min(V.occup, V.occup * Math.min(1, (monthsSinceStart + 1) / 8));
      else if (year === 2) occ = Math.min(1, V.occup + (1 - V.occup) * 0.6);
      else occ = 1;
    }

    const caAssoc = monthlyCA_per_spec * V.assoc * occ * V.retro;
    const caIndep = monthlyCA_per_spec * V.indep * occ * V.retro;
    const caInterne = monthlyCA_per_spec * V.interne * occ;
    const caSage = occ > 0 ? 13333 : 0;
    const totalCA = caAssoc + caIndep + caInterne + caSage;

    const baseMonthlyAdmin = 52650 * (1 + (V.assoc + V.indep + V.interne - 7) * 0.08);
    const baseMonthlyOpex = 45584 * (1 + (V.assoc + V.indep + V.interne - 7) * 0.05);
    const totalCosts = -(Math.abs(baseMonthlyAdmin) + Math.abs(baseMonthlyOpex)) * occ - (V.extra + V.rc) / 12;

    const salInterne = monthlyCA_per_spec * V.interne * occ * 0.55;
    const netResult = totalCA + totalCosts - salInterne * (occ > 0 ? 1 : 0);

    simCA.push(totalCA);
    simResult.push(netResult);

    let cashIn = 0;
    if (V.factoring) {
      cashIn = totalCA * V.cashPct + totalCA * (1 - V.cashPct) * (1 - FACT_COST);
    } else {
      cashIn = totalCA * V.cashPct;
      if (m >= V.delay) cashIn += simCA[m - V.delay] * (1 - V.cashPct);
    }

    cumCash += cashIn + totalCosts - salInterne * (occ > 0 ? 1 : 0);
    simCashflow.push(cumCash);
  }

  const sum = (arr: number[], s: number, e: number) => arr.slice(s, e).reduce((a, b) => a + b, 0);

  return {
    ca: simCA,
    result: simResult,
    cashflow: simCashflow,
    caY1: sum(simCA, 0, 12),
    caY2: sum(simCA, 12, 24),
    caY3: sum(simCA, 24, 36),
    resY1: sum(simResult, 0, 12),
    resY2: sum(simResult, 12, 24),
    resY3: sum(simResult, 24, 36),
    resAdj: sum(simResult, 24, 36) - params.extra - params.rc,
    perAssoc: (sum(simResult, 24, 36) - params.extra - params.rc) / params.assoc,
    bfrMin: Math.min(...simCashflow),
    tresoFinal: simCashflow[35],
  };
}
