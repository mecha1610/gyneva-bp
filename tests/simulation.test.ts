import { describe, it, expect } from 'vitest';
import { computeSimulation, SimulationResult } from '../lib/simulation';
import { SIMULATOR_DEFAULTS } from '../lib/constants';
import type { SimulatorParams } from '../lib/types';

// Helper: create params with overrides
function params(overrides: Partial<SimulatorParams> = {}): SimulatorParams {
  return { ...SIMULATOR_DEFAULTS, ...overrides };
}

describe('computeSimulation', () => {
  // ===== Output structure =====

  describe('output structure', () => {
    it('returns 36-month arrays for ca, result, cashflow', () => {
      const sim = computeSimulation(params());
      expect(sim.ca).toHaveLength(36);
      expect(sim.result).toHaveLength(36);
      expect(sim.cashflow).toHaveLength(36);
    });

    it('returns all expected scalar properties', () => {
      const sim = computeSimulation(params());
      const keys: (keyof SimulationResult)[] = [
        'ca', 'result', 'cashflow',
        'caY1', 'caY2', 'caY3',
        'resY1', 'resY2', 'resY3',
        'resAdj', 'perAssoc', 'bfrMin', 'tresoFinal',
      ];
      for (const k of keys) {
        expect(sim).toHaveProperty(k);
        expect(sim[k]).not.toBeNaN();
      }
    });

    it('yearly sums match array slices', () => {
      const sim = computeSimulation(params());
      const sum = (arr: number[], s: number, e: number) => arr.slice(s, e).reduce((a, b) => a + b, 0);
      expect(sim.caY1).toBeCloseTo(sum(sim.ca, 0, 12), 0);
      expect(sim.caY2).toBeCloseTo(sum(sim.ca, 12, 24), 0);
      expect(sim.caY3).toBeCloseTo(sum(sim.ca, 24, 36), 0);
      expect(sim.resY1).toBeCloseTo(sum(sim.result, 0, 12), 0);
      expect(sim.resY2).toBeCloseTo(sum(sim.result, 12, 24), 0);
      expect(sim.resY3).toBeCloseTo(sum(sim.result, 24, 36), 0);
    });

    it('tresoFinal equals last cashflow value', () => {
      const sim = computeSimulation(params());
      expect(sim.tresoFinal).toBe(sim.cashflow[35]);
    });

    it('bfrMin equals minimum of cashflow array', () => {
      const sim = computeSimulation(params());
      expect(sim.bfrMin).toBe(Math.min(...sim.cashflow));
    });
  });

  // ===== Determinism =====

  describe('determinism', () => {
    it('produces identical results when called twice with same params', () => {
      const p = params();
      const a = computeSimulation(p);
      const b = computeSimulation(p);
      expect(a).toEqual(b);
    });
  });

  // ===== Default scenario sanity =====

  describe('default scenario (SIMULATOR_DEFAULTS)', () => {
    const sim = computeSimulation(params());

    it('generates positive CA for all 3 years', () => {
      expect(sim.caY1).toBeGreaterThan(0);
      expect(sim.caY2).toBeGreaterThan(0);
      expect(sim.caY3).toBeGreaterThan(0);
    });

    it('CA grows year over year (Y3 > Y2 > Y1)', () => {
      expect(sim.caY2).toBeGreaterThan(sim.caY1);
      expect(sim.caY3).toBeGreaterThan(sim.caY2);
    });

    it('result Y3 is positive (profitable at cruise speed)', () => {
      expect(sim.resY3).toBeGreaterThan(0);
    });

    it('tresoFinal is positive with defaults', () => {
      expect(sim.tresoFinal).toBeGreaterThan(0);
    });

    it('resAdj = resY3 - extra - rc', () => {
      expect(sim.resAdj).toBeCloseTo(sim.resY3 - SIMULATOR_DEFAULTS.extra - SIMULATOR_DEFAULTS.rc, 0);
    });

    it('perAssoc = resAdj / assoc', () => {
      expect(sim.perAssoc).toBeCloseTo(sim.resAdj / SIMULATOR_DEFAULTS.assoc, 0);
    });
  });

  // ===== Start month / ramp-up =====

  describe('start month and ramp-up', () => {
    it('months before start have zero CA', () => {
      const sim = computeSimulation(params({ start: 6 }));
      for (let m = 0; m < 5; m++) {
        expect(sim.ca[m]).toBe(0);
      }
      expect(sim.ca[5]).toBeGreaterThan(0);
    });

    it('start=1 generates CA from month 0', () => {
      const sim = computeSimulation(params({ start: 1 }));
      expect(sim.ca[0]).toBeGreaterThan(0);
    });

    it('start=12 only generates CA from month 11 in Y1', () => {
      const sim = computeSimulation(params({ start: 12 }));
      for (let m = 0; m < 11; m++) {
        expect(sim.ca[m]).toBe(0);
      }
      expect(sim.ca[11]).toBeGreaterThan(0);
    });

    it('later start reduces Y1 CA', () => {
      const early = computeSimulation(params({ start: 1 }));
      const late = computeSimulation(params({ start: 6 }));
      expect(early.caY1).toBeGreaterThan(late.caY1);
    });

    it('Y1 occupancy ramps up gradually over 8 months', () => {
      const sim = computeSimulation(params({ start: 1, occup: 80 }));
      // First month should be less than last month of Y1
      expect(sim.ca[0]).toBeLessThan(sim.ca[7]);
      // After 8 months, should be at max Y1 occupancy
      expect(sim.ca[7]).toBeCloseTo(sim.ca[8], 0);
    });

    it('Y3 reaches full occupancy (100%)', () => {
      const sim = computeSimulation(params({ occup: 50 }));
      // Y3 CA should be higher than Y2 because Y3 occ=100%
      expect(sim.caY3).toBeGreaterThan(sim.caY2);
    });
  });

  // ===== Occupancy =====

  describe('occupancy impact', () => {
    it('higher Y1 occupancy increases Y1 CA', () => {
      const low = computeSimulation(params({ occup: 30 }));
      const high = computeSimulation(params({ occup: 100 }));
      expect(high.caY1).toBeGreaterThan(low.caY1);
    });

    it('occupancy does not affect Y3 CA (always 100%)', () => {
      const low = computeSimulation(params({ occup: 30 }));
      const high = computeSimulation(params({ occup: 100 }));
      expect(low.caY3).toBeCloseTo(high.caY3, 0);
    });
  });

  // ===== Fee & consultations =====

  describe('fee and consultation parameters', () => {
    it('doubling fee nearly doubles CA (sage-femme flat component offsets slightly)', () => {
      const base = computeSimulation(params({ fee: 200 }));
      const doubled = computeSimulation(params({ fee: 400 }));
      const ratio = doubled.caY3 / base.caY3;
      expect(ratio).toBeGreaterThan(1.9);
      expect(ratio).toBeLessThan(2.1);
    });

    it('doubling consultations/day nearly doubles CA', () => {
      const base = computeSimulation(params({ consult: 10 }));
      const doubled = computeSimulation(params({ consult: 20 }));
      const ratio = doubled.caY3 / base.caY3;
      expect(ratio).toBeGreaterThan(1.9);
      expect(ratio).toBeLessThan(2.1);
    });

    it('more working days increases CA proportionally', () => {
      const fewer = computeSimulation(params({ days: 200 }));
      const more = computeSimulation(params({ days: 250 }));
      expect(more.caY3).toBeGreaterThan(fewer.caY3);
      // Ratio should be close to 250/200 = 1.25
      expect(more.caY3 / fewer.caY3).toBeCloseTo(1.25, 1);
    });
  });

  // ===== Team composition =====

  describe('team composition', () => {
    it('more associates increases CA', () => {
      const one = computeSimulation(params({ assoc: 1 }));
      const four = computeSimulation(params({ assoc: 4 }));
      expect(four.caY3).toBeGreaterThan(one.caY3);
    });

    it('zero independents still generates CA from associates', () => {
      const sim = computeSimulation(params({ indep: 0 }));
      expect(sim.caY3).toBeGreaterThan(0);
    });

    it('interne CA not multiplied by retro (full for GynEva)', () => {
      // With only internes, CA should NOT be affected by retro rate
      const r40 = computeSimulation(params({ assoc: 0, indep: 0, interne: 2, retro: 40 }));
      const r60 = computeSimulation(params({ assoc: 0, indep: 0, interne: 2, retro: 60 }));
      expect(r40.caY3).toBeCloseTo(r60.caY3, 0);
    });

    it('associe/indep CA scales with retro rate', () => {
      const r20 = computeSimulation(params({ assoc: 2, indep: 0, interne: 0, retro: 20 }));
      const r60 = computeSimulation(params({ assoc: 2, indep: 0, interne: 0, retro: 60 }));
      // Higher retro → more CA for GynEva (sage-femme flat component limits exact 3:1 ratio)
      expect(r60.caY3).toBeGreaterThan(r20.caY3);
      // Doctor CA portion should scale ~3x (60/20), check ratio > 2
      const sageFlatY3 = 13333 * 12;
      const doctorCA_r20 = r20.caY3 - sageFlatY3;
      const doctorCA_r60 = r60.caY3 - sageFlatY3;
      expect(doctorCA_r60 / doctorCA_r20).toBeCloseTo(3, 0);
    });

    it('sage-femme adds flat 13333/month when active', () => {
      const sim = computeSimulation(params({ start: 1 }));
      // After start, each month should include sage-femme
      expect(sim.ca[0]).toBeGreaterThan(0);
      // The difference between 0 associates/indep/interne should show sage-femme alone
      const sageOnly = computeSimulation(params({ assoc: 0, indep: 0, interne: 0, start: 1 }));
      // CA should be exactly sage-femme when no doctors
      // But costs scaling changes with team size, just check CA is close to sage contribution
      expect(sageOnly.ca[11]).toBeCloseTo(13333, 0);
    });
  });

  // ===== Retrocession =====

  describe('retrocession rate', () => {
    it('defaults to 40% when retro is 0/undefined', () => {
      const defaultRetro = computeSimulation(params({ retro: 40 }));
      const zeroRetro = computeSimulation({ ...params(), retro: 0 } as SimulatorParams);
      // retro||40 means 0 falls back to 40
      expect(zeroRetro.caY3).toBeCloseTo(defaultRetro.caY3, 0);
    });
  });

  // ===== Extra charges & RC =====

  describe('extra charges and RC insurance', () => {
    it('higher extra charges decrease result', () => {
      const low = computeSimulation(params({ extra: 0 }));
      const high = computeSimulation(params({ extra: 400000 }));
      expect(high.resY3).toBeLessThan(low.resY3);
    });

    it('extra charges reduce result by extra/12 per month (i.e. extra per year)', () => {
      const base = computeSimulation(params({ extra: 0, rc: 0 }));
      const with100k = computeSimulation(params({ extra: 100000, rc: 0 }));
      // Y3 has 12 months, each reduced by 100000/12, so total reduction = 100000
      expect(base.resY3 - with100k.resY3).toBeCloseTo(100000, -2);
    });

    it('RC insurance reduces result similarly', () => {
      const base = computeSimulation(params({ extra: 0, rc: 0 }));
      const withRC = computeSimulation(params({ extra: 0, rc: 60000 }));
      expect(base.resY3 - withRC.resY3).toBeCloseTo(60000, -2);
    });

    it('resAdj subtracts extra + rc from resY3', () => {
      const sim = computeSimulation(params({ extra: 150000, rc: 30000 }));
      expect(sim.resAdj).toBeCloseTo(sim.resY3 - 150000 - 30000, 0);
    });
  });

  // ===== Factoring vs delay =====

  describe('factoring and payment delay', () => {
    it('factoring=true: cash inflow starts immediately', () => {
      const sim = computeSimulation(params({ factoring: true, start: 1 }));
      // Month 0 has CA > 0 and cashflow should reflect immediate payment
      expect(sim.cashflow[0]).not.toBe(0);
    });

    it('factoring=false, delay=3: first 3 months LAMal payments delayed', () => {
      const sim = computeSimulation(params({ factoring: false, delay: 3, start: 1, cashPct: 0 }));
      // With 0% cash and 3-month delay, months 0-2 get no LAMal revenue inflow
      // Only costs flow out, so cashflow should be deeply negative
      const simFact = computeSimulation(params({ factoring: true, start: 1, cashPct: 0 }));
      // Delayed version should have worse BFR than factoring
      expect(sim.bfrMin).toBeLessThan(simFact.bfrMin);
    });

    it('factoring improves BFR vs 3-month delay', () => {
      const withFact = computeSimulation(params({ factoring: true, delay: 3 }));
      const withoutFact = computeSimulation(params({ factoring: false, delay: 3 }));
      expect(withFact.bfrMin).toBeGreaterThan(withoutFact.bfrMin);
    });

    it('delay=0 without factoring gives similar cashflow to factoring', () => {
      const noDelay = computeSimulation(params({ factoring: false, delay: 0, cashPct: 15 }));
      const fact = computeSimulation(params({ factoring: true, delay: 0, cashPct: 15 }));
      // Without delay, LAMal is paid same month — close to factoring (minus 1.5% cost)
      // Factoring has a small cost, so noDelay tresoFinal should be slightly better
      expect(noDelay.tresoFinal).toBeGreaterThan(fact.tresoFinal);
    });

    it('higher cashPct improves BFR when no factoring', () => {
      const lowCash = computeSimulation(params({ factoring: false, delay: 3, cashPct: 0 }));
      const highCash = computeSimulation(params({ factoring: false, delay: 3, cashPct: 30 }));
      expect(highCash.bfrMin).toBeGreaterThan(lowCash.bfrMin);
    });
  });

  // ===== Edge cases =====

  describe('edge cases', () => {
    it('zero team still produces sage-femme revenue', () => {
      const sim = computeSimulation(params({ assoc: 0, indep: 0, interne: 0, start: 1 }));
      expect(sim.caY3).toBeGreaterThan(0); // sage-femme 13333/month
    });

    it('start=1, occup=100: Y1 still ramps up over 8 months', () => {
      const sim = computeSimulation(params({ start: 1, occup: 100 }));
      // All 12 months active
      expect(sim.ca[11]).toBeGreaterThan(0);
      // Y1 has 8-month ramp-up even at 100% target, so Y1 < Y2 (which is at full occ)
      expect(sim.caY1).toBeLessThan(sim.caY2);
      // But Y2 and Y3 should be equal (both at 100%)
      expect(sim.caY2).toBeCloseTo(sim.caY3, 0);
    });

    it('minimum parameters produce valid output', () => {
      const sim = computeSimulation(params({
        consult: 8, fee: 120, days: 180,
        assoc: 1, indep: 0, interne: 0,
        start: 12, occup: 30, cashPct: 0,
        delay: 3, factoring: false,
        extra: 400000, rc: 120000, retro: 20,
      }));
      expect(sim.ca).toHaveLength(36);
      expect(sim.cashflow).toHaveLength(36);
      // With heavy costs and minimal revenue, result should be negative
      expect(sim.resY1).toBeLessThan(0);
    });

    it('maximum parameters produce valid output', () => {
      const sim = computeSimulation(params({
        consult: 24, fee: 350, days: 250,
        assoc: 4, indep: 6, interne: 4,
        start: 1, occup: 100, cashPct: 30,
        delay: 0, factoring: true,
        extra: 0, rc: 0, retro: 60,
      }));
      expect(sim.ca).toHaveLength(36);
      expect(sim.caY3).toBeGreaterThan(0);
      expect(sim.tresoFinal).toBeGreaterThan(0);
    });
  });

  // ===== Cashflow monotonicity =====

  describe('cashflow behavior', () => {
    it('cumulative cashflow at Y3 is monotonically increasing when profitable', () => {
      const sim = computeSimulation(params({
        start: 1, occup: 100, extra: 0, rc: 0, factoring: true,
      }));
      // In Y3 (months 24-35), each month should add positive cashflow
      for (let m = 25; m < 36; m++) {
        expect(sim.cashflow[m]).toBeGreaterThanOrEqual(sim.cashflow[m - 1]);
      }
    });
  });

  // ===== Pessimistic / Optimistic scenarios =====

  describe('scenario variants', () => {
    it('pessimistic scenario has lower results than base', () => {
      const base = computeSimulation(params());
      const pess = computeSimulation(params({
        consult: Math.max(8, Math.round(16 * 0.75)),
        fee: Math.round(225 * 0.75),
        occup: Math.max(30, Math.round(60 * 0.75)),
        start: Math.min(12, 4 + 2),
      }));
      expect(pess.caY3).toBeLessThan(base.caY3);
      expect(pess.resY3).toBeLessThan(base.resY3);
      expect(pess.tresoFinal).toBeLessThan(base.tresoFinal);
    });

    it('optimistic scenario has higher results than base', () => {
      const base = computeSimulation(params());
      const opt = computeSimulation(params({
        consult: Math.min(24, Math.round(16 * 1.25)),
        fee: Math.min(350, Math.round(225 * 1.25)),
        occup: Math.min(100, Math.round(60 * 1.25)),
        start: Math.max(1, 4 - 1),
      }));
      expect(opt.caY3).toBeGreaterThan(base.caY3);
      expect(opt.resY3).toBeGreaterThan(base.resY3);
      expect(opt.tresoFinal).toBeGreaterThan(base.tresoFinal);
    });
  });
});
