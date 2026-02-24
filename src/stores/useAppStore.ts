'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ApiBusinessPlan } from '@lib/types';

// ── Types ──────────────────────────────────────────────────────────────────

export interface AppState {
  // Plans
  currentPlanId: string | null;
  allPlans: ApiBusinessPlan[];
  // UI preferences (persisted to localStorage)
  lang: 'fr' | 'en';
  theme: 'light' | 'dark';
  sidebarCollapsed: boolean;
  // Import status
  importStatus: 'default' | 'live';
  importFileName: string | null;
}

export interface AppActions {
  setPlans: (plans: ApiBusinessPlan[]) => void;
  setCurrentPlanId: (id: string | null) => void;
  setLang: (lang: 'fr' | 'en') => void;
  setTheme: (theme: 'light' | 'dark') => void;
  toggleSidebar: () => void;
  setImportStatus: (status: 'default' | 'live', fileName?: string) => void;
}

type AppStore = AppState & AppActions;

// ── Store ──────────────────────────────────────────────────────────────────

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      currentPlanId: null,
      allPlans: [],
      lang: 'fr',
      theme: 'light',
      sidebarCollapsed: false,
      importStatus: 'default',
      importFileName: null,

      setPlans: (plans) => set({ allPlans: plans }),
      setCurrentPlanId: (id) => set({ currentPlanId: id }),
      setLang: (lang) => set({ lang }),
      setTheme: (theme) => set({ theme }),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setImportStatus: (status, fileName) =>
        set({ importStatus: status, importFileName: fileName ?? null }),
    }),
    {
      name: 'gyneva-app-store',
      // Only persist UI preferences — plans/import state are session-only
      partialize: (s) => ({ lang: s.lang, theme: s.theme, sidebarCollapsed: s.sidebarCollapsed }),
    }
  )
);
