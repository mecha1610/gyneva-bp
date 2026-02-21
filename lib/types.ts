// ===== Business Plan Data (36-month arrays) =====

export interface MonthlyArrays {
  ca: number[];          // Total revenue
  caAssoc: number[];     // Partner doctors revenue
  caIndep: number[];     // Independent doctors revenue
  caInterne: number[];   // Salaried doctors revenue
  caSage: number[];      // Midwife revenue
  result: number[];      // Net profit/loss
  cashflow: number[];    // Cumulative cashflow (sans délai)
  treso1m: number[];     // 1-month LAMal delay scenario
  treso3m: number[];     // 3-month LAMal delay scenario
  admin: number[];       // Administrative costs
  opex: number[];        // Operating expenses
  lab: number[];         // Lab/testing costs
  fteAssoc: number[];    // Partner FTE
  fteIndep: number[];    // Independent FTE
  fteInterne: number[];  // Salaried FTE
  fteAdmin: number[];    // Admin staff FTE
  fteTotal: number[];    // Total headcount
}

export interface BusinessPlanConstants {
  consultDay: number;   // Consultations per day
  fee: number;          // CHF per consultation
  daysYear: number;     // Working days/year
  revSpec: number;      // Revenue potential per specialist
  capex: number;        // Capital expenditure
}

export interface BusinessPlanData extends MonthlyArrays, BusinessPlanConstants {}

// ===== Derived values (computed from monthly data) =====

export interface DerivedMetrics {
  caY1: number;
  caY2: number;
  caY3: number;
  resY1: number;
  resY2: number;
  resY3: number;
  tresoFact: number[];
  tresoCash3m: number[];
  tresoCash1m: number[];
  bfrWorst: number;
  bfrFact: number;
  bfrCash3m: number;
  bfrCash1m: number;
}

// ===== Simulator parameters =====

export interface SimulatorParams {
  consult: number;      // Consultations/day (8-24)
  fee: number;          // CHF per consultation (120-350)
  days: number;         // Working days/year (180-250)
  assoc: number;        // Partner doctors (1-4)
  indep: number;        // Independent doctors (0-6)
  interne: number;      // Salaried doctors (0-4)
  start: number;        // Month to start operations (1-12)
  occup: number;        // % occupation Y1 (30-100)
  cashPct: number;      // % cash patients (0-30)
  delay: number;        // LAMal payment delay months (0, 1, 3)
  factoring: boolean;   // Enable factoring
  extra: number;        // Unbudgeted charges/year (0-400000)
  rc: number;           // Professional liability/year (0-120000)
}

// ===== Cashflow scenarios =====

export interface CashflowScenarios {
  fact: number[];       // Factoring scenario
  cash3m: number[];     // 3-month LAMal delay
  cash1m: number[];     // 1-month LAMal delay
}

// ===== API response types =====

export interface ApiUser {
  id: string;
  email: string;
  name: string | null;
  picture: string | null;
  role: 'ADMIN' | 'EDITOR' | 'VIEWER';
}

export interface ApiBusinessPlan {
  id: string;
  name: string;
  data: MonthlyArrays;
  consultDay: number;
  fee: number;
  daysYear: number;
  revSpec: number;
  capex: number;
  createdAt: string;
  updatedAt: string;
}

export interface ApiBusinessPlanVersion {
  id: string;
  versionNumber: number;
  label: string | null;
  data: MonthlyArrays;
  constants: BusinessPlanConstants;
  createdAt: string;
}

export interface ApiScenario {
  id: string;
  name: string;
  params: SimulatorParams;
  businessPlanId: string | null;
  isShared: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApiError {
  error: string;
  code: string;
  details?: unknown;
}
