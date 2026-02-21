import type { BusinessPlanData, CashflowScenarios, DerivedMetrics, SimulatorParams } from './types.js';
import { CASH_SHARE_BASE, FACT_COST } from './constants.js';

/**
 * Compute cashflow scenarios: factoring, 3-month LAMal delay, 1-month LAMal delay.
 */
export function computeScenarios(
  ca: number[],
  admin: number[],
  opex: number[],
  lab: number[],
  cashShare: number,
): CashflowScenarios {
  const fact: number[] = [];
  const cash3m: number[] = [];
  const cash1m: number[] = [];
  let c1 = 0, c2 = 0, c3 = 0;

  for (let m = 0; m < 36; m++) {
    // Factoring: immediate payment with 1.5% cost
    c1 += ca[m] * cashShare + ca[m] * (1 - cashShare) * (1 - FACT_COST) + admin[m] + opex[m] + lab[m];
    fact.push(c1);

    // 3-month LAMal delay
    c2 += ca[m] * cashShare + (m >= 3 ? ca[m - 3] * (1 - cashShare) : 0) + admin[m] + opex[m] + lab[m];
    cash3m.push(c2);

    // 1-month LAMal delay
    c3 += ca[m] * cashShare + (m >= 1 ? ca[m - 1] * (1 - cashShare) : 0) + admin[m] + opex[m] + lab[m];
    cash1m.push(c3);
  }

  return { fact, cash3m, cash1m };
}

/**
 * Compute derived metrics from business plan data (annual aggregates + BFR).
 */
export function computeDerived(data: BusinessPlanData): DerivedMetrics {
  const sum = (arr: number[], start: number, end: number) =>
    arr.slice(start, end).reduce((a, b) => a + b, 0);

  const caY1 = sum(data.ca, 0, 12);
  const caY2 = sum(data.ca, 12, 24);
  const caY3 = sum(data.ca, 24, 36);
  const resY1 = sum(data.result, 0, 12);
  const resY2 = sum(data.result, 12, 24);
  const resY3 = sum(data.result, 24, 36);

  const scenarios = computeScenarios(data.ca, data.admin, data.opex, data.lab, CASH_SHARE_BASE);

  return {
    caY1, caY2, caY3,
    resY1, resY2, resY3,
    tresoFact: scenarios.fact,
    tresoCash3m: scenarios.cash3m,
    tresoCash1m: scenarios.cash1m,
    bfrWorst: Math.min(...data.treso3m),
    bfrFact: Math.min(...scenarios.fact),
    bfrCash3m: Math.min(...scenarios.cash3m),
    bfrCash1m: Math.min(...scenarios.cash1m),
  };
}

/**
 * Run simulator with given parameters, returns simulated 36-month data.
 */
export function runSimulation(params: SimulatorParams) {
  const annualCA_per_spec = params.consult * params.fee * params.days;
  const monthlyCA_per_spec = annualCA_per_spec / 12;
  const occup = params.occup / 100;
  const cashPct = params.cashPct / 100;

  const simCA: number[] = [];
  const simResult: number[] = [];
  const simCashflow: number[] = [];
  let cumCash = 0;

  for (let m = 0; m < 36; m++) {
    const year = m < 12 ? 1 : m < 24 ? 2 : 3;

    // Ramp-up: before start month = 0, then gradual occupation
    let occ = 0;
    if (m >= params.start - 1) {
      const monthsSinceStart = m - (params.start - 1);
      if (year === 1) {
        occ = Math.min(occup, occup * Math.min(1, (monthsSinceStart + 1) / 8));
      } else if (year === 2) {
        occ = Math.min(1, occup + (1 - occup) * 0.6);
      } else {
        occ = 1;
      }
    }

    // CA by source
    const caAssoc = monthlyCA_per_spec * params.assoc * occ * 0.4;
    const caIndep = monthlyCA_per_spec * params.indep * occ * 0.4;
    const caInterne = monthlyCA_per_spec * params.interne * occ;
    const caSage = occ > 0 ? 13333 : 0;
    const totalCA = caAssoc + caIndep + caInterne + caSage;

    // Costs (scaled from base)
    const baseMonthlyAdmin = 52650 * (1 + (params.assoc + params.indep + params.interne - 7) * 0.08);
    const baseMonthlyOpex = 45584 * (1 + (params.assoc + params.indep + params.interne - 7) * 0.05);
    const totalCosts = -(Math.abs(baseMonthlyAdmin) + Math.abs(baseMonthlyOpex)) * occ - (params.extra + params.rc) / 12;
    const salInterne = monthlyCA_per_spec * params.interne * occ * 0.55;

    const netResult = totalCA + totalCosts - salInterne * (occ > 0 ? 1 : 0);

    simCA.push(totalCA);
    simResult.push(netResult);

    // Cashflow based on payment scenario
    let cashIn = 0;
    if (params.factoring) {
      cashIn = totalCA * cashPct + totalCA * (1 - cashPct) * (1 - FACT_COST);
    } else {
      cashIn = totalCA * cashPct;
      if (m >= params.delay) cashIn += simCA[m - params.delay] * (1 - cashPct);
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
