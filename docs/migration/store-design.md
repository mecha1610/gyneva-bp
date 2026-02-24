# Design des Stores Zustand — ADR (Architecture Decision Record)

> Phase 0.2 — Généré le 2026-02-24

---

## Décision

**Deux stores distincts** pour séparer les responsabilités et éviter un nouveau God Object :

| Store | Responsabilité | Fréquence de mutation |
|-------|---------------|----------------------|
| `useSimStore` | Moteur financier — inputs sliders + état calculé `D` | Haute (chaque interaction slider) |
| `useAppStore` | État applicatif — session, plans, UI | Basse (navigation, login, import) |

Cette séparation évite que le changement d'un plan déclenche un recalcul financier, et qu'un déplacement de slider invalide la liste des plans.

---

## Store 1 : `useSimStore`

**Fichier** : `src/stores/useSimStore.ts`

### 1.1 État brut (inputs utilisateur)

```typescript
type SimInputs = {
  // Volume
  consultDay: number;      // défaut: 16  (8–24)
  fee: number;             // défaut: 225 (120–350 CHF)
  daysYear: number;        // défaut: 215 (180–250)
  // Équipe
  assocCount: number;      // défaut: 2   (1–4)
  indepCount: number;      // défaut: 3   (0–6)
  interneCount: number;    // défaut: 2   (0–4)
  // Finance
  retroPct: number;        // défaut: 40  (20–60 %)
  delayMonths: number;     // défaut: 0   (0–6)
  cashPct: number;         // défaut: 15  (0–30 %)
  factoringEnabled: boolean; // défaut: false
  extraCharges: number;    // défaut: 200000 (0–400000 CHF)
  rcCost: number;          // défaut: 60000  (0–120000 CHF)
  // Activité
  startMonth: number;      // défaut: 4   (1–12)
  occupancyY1: number;     // défaut: 60  (30–100 %)
};
```

### 1.2 État calculé (D — lecture seule dans les composants)

```typescript
type SimData = {
  // Séries 36 mois
  ca: number[];
  caAssoc: number[];
  caIndep: number[];
  caInterne: number[];
  caSage: number[];
  result: number[];
  cashflow: number[];
  treso1m: number[];
  treso3m: number[];
  admin: number[];
  opex: number[];
  lab: number[];
  // ETP
  fteAssoc: number[];
  fteIndep: number[];
  fteInterne: number[];
  fteAdmin: number[];
  fteTotal: number[];
  // Scalaires
  consultDay: number;
  fee: number;
  daysYear: number;
  revSpec: number;
  capex: number;
  // Agrégats dérivés (calculés par computeDerived)
  caY1: number; caY2: number; caY3: number;
  resY1: number; resY2: number; resY3: number;
  tresoFact: number; tresoCash3m: number; tresoCash1m: number;
  // ... (tous les champs produits par computeDerived())
};
```

### 1.3 État de navigation

```typescript
type SimNavState = {
  simActiveYear: 'all' | '1' | '2' | '3';
  revActiveYear: 'all' | '1' | '2' | '3';
  cfActiveYear:  'all' | '1' | '2' | '3';
  teamActiveYear: 'all' | '1' | '2' | '3';
  revActiveProfiles: Set<'assoc' | 'indep' | 'interne' | 'sage'>;
};
```

### 1.4 État SIM (scénarios comparés)

```typescript
type SimResult = {
  // Résultat de runSim() — structure complète de la simulation courante
  // Encapsulé tel quel depuis lib/simulation.ts
  [key: string]: any;
};
```

### 1.5 Actions

```typescript
type SimActions = {
  setParam: (key: keyof SimInputs, value: number | boolean) => void;
  loadData: (data: SimData) => void;       // après import Excel ou chargement plan
  resetToDefaults: () => void;
  setActiveYear: (
    section: 'simulator' | 'revenue' | 'cashflow' | 'team',
    year: 'all' | '1' | '2' | '3'
  ) => void;
  toggleRevProfile: (profile: string) => void;
};
```

### 1.6 Flux unidirectionnel (règle d'or)

```
Slider onChange
    │
    ▼
useSimStore.setParam(key, value)
    │
    ├─► met à jour inputs[key]
    │
    └─► exécute automatiquement :
            D = computeDerived(inputs)  ← lib/simulation.ts (non modifiée)
            SIM = runSim(inputs)        ← lib/simulation.ts (non modifiée)
    │
    ▼
Zustand notifie tous les abonnés
    │
    ▼
<SimKPIs>, <CashflowCharts>, <RevenueChart>, etc.
re-rendent via leurs sélecteurs
```

### 1.7 Implémentation (squelette)

```typescript
// src/stores/useSimStore.ts
import { create } from 'zustand';
import { computeDerived, runSim, getDefaultInputs } from '@/lib/simulation';

const DEFAULT_INPUTS: SimInputs = {
  consultDay: 16, fee: 225, daysYear: 215,
  assocCount: 2, indepCount: 3, interneCount: 2,
  retroPct: 40, delayMonths: 0, cashPct: 15,
  factoringEnabled: false, extraCharges: 200000, rcCost: 60000,
  startMonth: 4, occupancyY1: 60,
};

export const useSimStore = create<SimInputs & SimNavState & { D: SimData; SIM: SimResult } & SimActions>(
  (set, get) => ({
    // Inputs
    ...DEFAULT_INPUTS,
    // Nav
    simActiveYear: 'all', revActiveYear: 'all', cfActiveYear: 'all', teamActiveYear: 'all',
    revActiveProfiles: new Set(['assoc', 'indep', 'interne', 'sage']),
    // Computed (calculé une fois à l'init)
    D: computeDerived(DEFAULT_INPUTS),
    SIM: runSim(DEFAULT_INPUTS),

    // Actions
    setParam: (key, value) => set(state => {
      const newInputs = { ...state, [key]: value };
      return {
        [key]: value,
        D: computeDerived(newInputs),
        SIM: runSim(newInputs),
      };
    }),
    loadData: (data) => set({ D: data }),
    resetToDefaults: () => set({
      ...DEFAULT_INPUTS,
      D: computeDerived(DEFAULT_INPUTS),
      SIM: runSim(DEFAULT_INPUTS),
    }),
    setActiveYear: (section, year) => set({ [`${section}ActiveYear`]: year }),
    toggleRevProfile: (profile) => set(state => {
      const next = new Set(state.revActiveProfiles);
      next.has(profile) ? next.delete(profile) : next.add(profile);
      return { revActiveProfiles: next };
    }),
  })
);
```

---

## Store 2 : `useAppStore`

**Fichier** : `src/stores/useAppStore.ts`

### 2.1 État

```typescript
type AppState = {
  // Session
  currentUser: User | null;
  // Plans
  currentPlanId: string | null;
  allPlans: Plan[];
  // Overlay (scénario comparé sur les graphiques)
  overlayData: SimData | null;
  overlayScenarioId: string | null;
  // UI
  lang: 'fr' | 'en';
  theme: 'light' | 'dark';
  sidebarCollapsed: boolean;
  importStatus: 'default' | 'live';
  importFileName: string | null;
};
```

### 2.2 Actions

```typescript
type AppActions = {
  setUser: (user: User | null) => void;
  setPlans: (plans: Plan[]) => void;
  switchPlan: (planId: string, data: SimData) => void;
  setOverlay: (scenarioId: string | null, data: SimData | null) => void;
  setLang: (lang: 'fr' | 'en') => void;
  setTheme: (theme: 'light' | 'dark') => void;
  toggleSidebar: () => void;
  setImportStatus: (status: 'default' | 'live', fileName?: string) => void;
};
```

### 2.3 Implémentation (squelette)

```typescript
// src/stores/useAppStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAppStore = create<AppState & AppActions>()(
  persist(
    (set) => ({
      currentUser: null,
      currentPlanId: null,
      allPlans: [],
      overlayData: null,
      overlayScenarioId: null,
      lang: 'fr',
      theme: 'light',
      sidebarCollapsed: false,
      importStatus: 'default',
      importFileName: null,

      setUser: (user) => set({ currentUser: user }),
      setPlans: (plans) => set({ allPlans: plans }),
      switchPlan: (planId, data) => {
        set({ currentPlanId: planId });
        // Déclenche le recalcul dans useSimStore via l'appelant
      },
      setOverlay: (id, data) => set({ overlayScenarioId: id, overlayData: data }),
      setLang: (lang) => set({ lang }),
      setTheme: (theme) => set({ theme }),
      toggleSidebar: () => set(s => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setImportStatus: (status, fileName) =>
        set({ importStatus: status, importFileName: fileName ?? null }),
    }),
    { name: 'gyneva-app-store', partialize: (s) => ({ lang: s.lang, theme: s.theme }) }
  )
);
```

> `persist` avec `partialize` ne sauvegarde que `lang` et `theme` dans `localStorage` — les autres champs sont en mémoire session.

---

## Interaction entre les deux stores

```
switchPlan(planId)
    │
    ├─► useAppStore.switchPlan(planId, data)  ← met à jour currentPlanId
    │
    └─► useSimStore.loadData(data)            ← charge les nouvelles données dans D
```

Les stores **ne se connaissent pas directement**. L'orchestration se fait dans le composant ou le hook appelant :

```typescript
// hooks/useSwitchPlan.ts
export function useSwitchPlan() {
  const loadData = useSimStore(s => s.loadData);
  const switchPlan = useAppStore(s => s.switchPlan);

  return async (planId: string) => {
    const data = await fetchPlanData(planId); // Server Action ou fetch
    switchPlan(planId, data);
    loadData(data);
  };
}
```

---

## Prérequis pour la migration de `lib/simulation.ts`

Les fonctions `computeDerived()` et `runSim()` doivent être extraites de `index.html` vers `src/lib/simulation.ts` **sans modification de leur logique**. Seul leur interface d'entrée change : au lieu de lire des globals, elles reçoivent un objet `SimInputs` en paramètre.

```typescript
// src/lib/simulation.ts
export function computeDerived(inputs: SimInputs): SimData { ... }
export function runSim(inputs: SimInputs): SimResult { ... }
export function getDefaultData(): SimData { ... }
```

Ces fonctions sont **couvertes par les 45 tests Vitest existants** — valider qu'ils passent toujours après extraction est le critère de "done" de la Phase 1.
