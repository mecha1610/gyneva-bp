# gyneva-bp — Codebase Architecture

## Tech Stack

Next.js 16 App Router · React 19 · TypeScript · Prisma 7 · Neon PostgreSQL (serverless) · Zustand 5 · Chart.js 4 · Zod 3 · bcryptjs · web-push · xlsx · Deployed on Vercel.

---

## Two-Runtime Reality

| Runtime | Location | Status |
|---|---|---|
| **Current** | `src/` — Next.js 16 App Router | All active development here |
| **Legacy** | `public/index.html` — ~5900-line vanilla JS SPA | Frozen; targeted for deletion in a future cleanup PR |

All 8 sections (Overview, Simulator, Revenue, Cashflow, Team, Risks, Profit, Optimize) have been migrated to Next.js as of v0.21.0. **Do NOT add features to the SPA.**

---

## Directory Map

```
src/
  app/
    (app)/           # Route group: authenticated pages (sidebar + topbar layout)
      overview/      # page.tsx + OverviewChart.tsx + page.module.css
      simulator/     # page.tsx + SimulatorCharts.tsx + page.module.css
      revenue/       # page.tsx + page.module.css
      cashflow/      # page.tsx + page.module.css
      team/          # page.tsx + page.module.css
      risks/         # page.tsx + page.module.css
      profit/        # page.tsx + page.module.css
      optimize/      # page.tsx + page.module.css
      admin/         # page.tsx + page.module.css
      layout.tsx     # Shared layout: sidebar + topbar + AppStoreInitializer
    api/             # Route Handlers — validate input (Zod), delegate to lib/server/; no business logic
      auth/          # POST ?action=google|login|logout / GET ?action=me
      auth/invite/[token]/        # GET validate / POST accept
      plans/                      # GET list / POST create
      plans/[id]/                 # GET / PUT (auto-snapshot) / DELETE
      plans/[id]/versions/        # GET list
      plans/[id]/versions/[versionId]/  # GET full version data
      scenarios/                  # GET list / POST create
      scenarios/[id]/             # GET / PUT / DELETE
      import/excel/               # POST parse xlsx
      admin/users/                # GET list / POST add / DELETE remove email
      admin/users/[id]/           # PUT role/name / DELETE user
      admin/invites/              # GET list / POST create
      push/                       # POST subscribe / POST?action=send broadcast
      cron/cleanup/               # GET daily session cleanup (protected by CRON_SECRET)
    login/           # Public login page (no auth required)
    layout.tsx       # Root layout: theme flash prevention, font
    globals.css      # Design tokens (CSS custom properties), dark theme overrides
  components/
    Sidebar.tsx + Sidebar.module.css
    Topbar.tsx + Topbar.module.css
    AppStoreInitializer.tsx       # Hydrates Zustand store from server on mount
  lib/server/        # Server-only — never imported by client components
    auth.ts          # createSession(), validateSession(), deleteSession(), cleanExpiredSessions()
    db.ts            # Prisma singleton with Neon adapter (pooled connection)
    errors.ts        # Standardized error response helpers
    middleware.ts    # requireAuth(), requireAdmin(), withCors(), withRateLimit()
  stores/
    useAppStore.ts   # Zustand: active plan data (36-month arrays + constants), plan list, overlay scenario
    useSimStore.ts   # Zustand: simulator parameters (14 params), simulation results

lib/                 # Shared — imported by BOTH src/ components AND legacy SPA via <script>
  types.ts           # All TypeScript interfaces: BusinessPlan, SimulatorParams, SimulatorResult, etc.
  constants.ts       # Default plan data (36-month arrays), Excel row mappings, simulator defaults
  compute.ts         # computeScenarios(): derives cashflow scenarios from plan data (pure function)
  simulation.ts      # computeSimulation(params): runs 36-month simulator (pure function, 45 unit tests)

prisma/
  schema.prisma      # 8 models: User, Session, AllowedEmail, BusinessPlan, BusinessPlanVersion,
                     #           SimulatorScenario, InviteToken, PushSubscription
  seed.ts
prisma.config.ts     # Prisma v7 CLI config — connection URLs (uses POSTGRES_URL_NON_POOLING)

public/
  index.html         # LEGACY SPA — do not modify except for critical bug fixes
  sw.js              # Service worker (cache + push handler)
  manifest.json      # PWA manifest
  icons/             # 5 PWA icon sizes

src/proxy.ts         # Next.js 16 edge middleware: auth guard, session cookie check, redirects to /login
```

---

## Request Flow (Authenticated Page)

```
Browser → src/proxy.ts          (edge: check gyneva_session cookie)
        → (app)/ page           (App Router, server component)
        → Zustand stores        (useAppStore, useSimStore — client)
        → src/app/api/ handler  (Route Handler)
        → lib/server/middleware (requireAuth guard)
        → lib/server/auth.ts    (validateSession)
        → lib/server/db.ts      (Prisma client)
        → Neon PostgreSQL
```

---

## Data Flow

- **Plan data:** `GET /api/plans/:id` → `useAppStore` → page components read from store
- **Simulator:** `useSimStore` params → `computeSimulation()` in `lib/simulation.ts` → local state in simulator page
- **Plan shape:** 17 monthly arrays (JSONB) + 5 scalar constants per `BusinessPlan` row

---

## Key Design Decisions

1. **`src/proxy.ts` not `middleware.ts`** — Next.js 16 renamed middleware to `proxy.ts`; using the old name triggers deprecation warnings.
2. **Prisma v7 URL split** — `schema.prisma` has no `url`/`directUrl`; those live in `prisma.config.ts`. This is Prisma v7's mandatory new pattern.
3. **`lib/` is outside `src/`** — Intentionally shared between the legacy SPA and Next.js. Can move into `src/lib/` after the SPA is deleted.
4. **No business logic in Route Handlers** — API routes validate input (Zod) and call `lib/server/` helpers only. All financial logic lives in `lib/compute.ts` and `lib/simulation.ts`.
5. **Zustand for plan state** — Avoids prop drilling across the 8-section dashboard. `AppStoreInitializer` hydrates the store on mount.

---

## SPA / Next.js Boundary

- In production (Vercel), **all routes are handled by Next.js App Router**. `public/index.html` is not served automatically.
- `lib/` functions are consumed by both runtimes — changes must stay compatible with vanilla JS until the SPA is deleted.
- **Do not add features to `public/index.html`.**
