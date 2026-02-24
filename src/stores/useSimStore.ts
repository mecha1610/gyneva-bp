'use client';

import { create } from 'zustand';
import { computeSimulation } from '@lib/simulation';
import { computeDerived } from '@lib/compute';
import { DEFAULT_BUSINESS_PLAN_DATA, SIMULATOR_DEFAULTS } from '@lib/constants';
import type { BusinessPlanData, SimulatorParams } from '@lib/types';

// ── Types ──────────────────────────────────────────────────────────────────

export type ActiveYear = 'all' | '1' | '2' | '3';
export type RevProfile = 'assoc' | 'indep' | 'interne' | 'sage';

export interface SimState {
  // Raw plan data (from DB or Excel import)
  planData: BusinessPlanData;

  // Simulator inputs
  inputs: SimulatorParams;

  // Navigation
  simActiveYear: ActiveYear;
  revActiveYear: ActiveYear;
  cfActiveYear:  ActiveYear;
  teamActiveYear: ActiveYear;
  revActiveProfiles: Set<RevProfile>;
}

export interface SimActions {
  /** Replace plan data (after Excel import or plan switch) */
  loadPlanData: (data: BusinessPlanData) => void;
  /** Update one simulator parameter and re-run computeSimulation */
  setParam: (key: keyof SimulatorParams, value: number | boolean) => void;
  /** Reset simulator inputs to defaults */
  resetInputs: () => void;
  /** Set year filter for a section */
  setActiveYear: (
    section: 'simulator' | 'revenue' | 'cashflow' | 'team',
    year: ActiveYear
  ) => void;
  /** Toggle revenue profile filter */
  toggleRevProfile: (profile: RevProfile) => void;
}

type SimStore = SimState & SimActions;

// ── Store ──────────────────────────────────────────────────────────────────

export const useSimStore = create<SimStore>()((set) => ({
  // Initial state — default plan data from constants
  planData: DEFAULT_BUSINESS_PLAN_DATA,
  inputs: { ...SIMULATOR_DEFAULTS },

  simActiveYear: 'all',
  revActiveYear: 'all',
  cfActiveYear:  'all',
  teamActiveYear: 'all',
  revActiveProfiles: new Set<RevProfile>(['assoc', 'indep', 'interne', 'sage']),

  // ── Actions ────────────────────────────────────────────────────────────

  loadPlanData: (data) => set({ planData: data }),

  setParam: (key, value) =>
    set((state) => ({
      inputs: { ...state.inputs, [key]: value },
    })),

  resetInputs: () =>
    set({ inputs: { ...SIMULATOR_DEFAULTS } }),

  setActiveYear: (section, year) =>
    set({ [`${section}ActiveYear`]: year } as Partial<SimState>),

  toggleRevProfile: (profile) =>
    set((state) => {
      const next = new Set(state.revActiveProfiles);
      if (next.has(profile)) {
        next.delete(profile);
      } else {
        next.add(profile);
      }
      return { revActiveProfiles: next };
    }),
}));

// ── Selectors (memoised derivations) ──────────────────────────────────────

/** Current plan data (from DB/import) with derived metrics */
export function usePlanDerived() {
  const planData = useSimStore((s) => s.planData);
  return computeDerived(planData);
}

/** Live simulation result from current inputs */
export function useSimResult() {
  const inputs = useSimStore((s) => s.inputs);
  return computeSimulation(inputs);
}
