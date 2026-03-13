# Coding Rules — gyneva-bp

### API Route Handlers (`src/app/api/`)
- **Validate request body with Zod** before touching the DB — schemas live at the top of each route file, preventing malformed data from reaching Prisma.
- **Call `requireAuth(request)` or `requireAdmin(request)`** from `src/lib/server/middleware.ts` as the first line of every protected handler — skipping this exposes endpoints to unauthenticated access.
- **Return errors via helpers in `src/lib/server/errors.ts`** — they produce a consistent `{ error, code, details }` shape that the frontend error handler depends on.
- **Never write raw SQL** — all DB access goes through the Prisma client from `src/lib/server/db.ts` to keep migrations and type safety in sync.
- **Route Handlers contain no business logic** — validate input, call `lib/server/` helpers, return JSON; logic in handlers is untestable and leaks across layers.
- **Invite management uses `?scope=invites`** on `admin/users/route.ts` — there is no separate invites route; adding one would duplicate auth and validation logic.

### React Pages (`src/app/(app)/`)
- **CSS Modules only** — import as `import styles from './page.module.css'`; no inline styles or Tailwind, keeping styling co-located and scoped by default.
- **Dynamically import Chart.js components** with `{ ssr: false }` as named exports — top-level imports cause SSR crashes because Chart.js references `window`.
- **Client state goes in Zustand stores** (`useAppStore`, `useSimStore`) — prop drilling between sections breaks when the component tree is reorganized.
- **No business logic in page files** — financial calculations belong in `lib/compute.ts` or `lib/simulation.ts` where vitest can cover them.
- **Do not manually call store setters during SSR** — `AppStoreInitializer.tsx` handles hydration on mount; double-setting causes hydration mismatches.

### Shared `lib/` (outside `src/`)
- **`compute.ts` and `simulation.ts` are pure functions** — no side effects, no imports from `src/`; purity is what makes vitest unit tests reliable.
- **`types.ts` is the single source of truth for TypeScript interfaces** — add types here, not inline, so both the legacy SPA and Next.js share the same contracts.
- **`constants.ts` owns all default plan data and Excel row mappings** — hardcoding these in components or handlers causes silent drift when values change.
- **`lib/` must stay compatible with the legacy SPA** until `public/index.html` is deleted — changes that assume Next.js APIs will silently break the old entry point.

### Financial Data
- **All monetary values are integers** — apply `Math.round()` everywhere, especially on Excel cell values, to avoid floating-point drift in financial totals.
- **36-month arrays must always have exactly 36 elements** — validate with `.length === 36` before storing; a shorter array produces silent `undefined` reads in simulations.
- **Retrocession rate is stored as an integer 20–60** and divided by 100 at compute time — storing it as a decimal breaks the existing DB constraint and display logic.
- **Enforce `revSpec` cap (10,000,000) and `capex` cap (5,000,000) in Zod schemas** — these limits come from regulatory requirements and must be rejected before reaching the DB.

### Testing
- **Unit tests via vitest target pure functions in `lib/` only** — no DB, no network calls; add new ones when touching `computeSimulation()`.
- **`tests/simulation.test.ts` is the canonical unit test file** (45 tests) — when modifying `computeSimulation()` or any `lib/` pure function, add tests here, not in a new file.
- **E2E tests hit real endpoints** — run `npm run db:seed` against a dedicated test database before Playwright; mocked DB tests have historically passed while production migrations failed.
- **Never mock the DB in E2E tests** — real migrations can fail silently behind a mock; integration confidence requires the actual Prisma client and schema.

### TypeScript
- **Run `npm run typecheck` (tsc --noEmit) before every commit** — CI fails on type errors, and fixing them after the fact often requires touching multiple files.
- **Use `as Prisma.InputJsonValue`** when writing JSONB fields, not `as any` — `as any` hides shape errors that only surface at runtime.
- **No non-null assertion (`!`) on env vars** — validate at module load time and throw explicitly so misconfigured deployments fail fast with a clear message.

### Git / Deployment
- **`npm run build` runs `prisma generate && next build`** — if you add a Prisma model, run `npm run db:push` first or the generate step will fail against a stale schema.
- **Run `vercel pull` locally to sync env vars before testing a production build** — CI fetches them automatically via Vercel's build pipeline.
- **Commit message format: `type(scope): description`** — e.g., `fix(auth): handle missing GOOGLE_CLIENT_ID at startup`; this format drives the CHANGELOG generator.
