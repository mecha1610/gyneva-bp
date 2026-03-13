# gyneva-bp

Interactive financial planning SPA for a Geneva gynecology clinic. Next.js 16 App Router + Prisma 7 + Neon PostgreSQL, deployed on Vercel.

## Commands

```bash
npm run dev          # Next.js dev server (port 3000)
npm run dev:vercel   # Vercel dev (includes cron + headers from vercel.json)
npm run build        # prisma generate + next build
npm run typecheck    # tsc --noEmit
npm run test         # vitest (unit tests)
npm run test:watch   # vitest watch mode

# Database
npm run db:push      # Sync Prisma schema to DB (no migration file)
npm run db:migrate   # Create migration file + apply
npm run db:seed      # Seed 2 users + 1 default business plan
npm run db:studio    # Open Prisma Studio GUI
```

## Architecture

```
src/
  app/
    (app)/           # Authenticated pages (layout with sidebar/topbar)
      overview/ revenue/ cashflow/ team/ risks/ profit/ simulator/ optimize/ admin/
    api/             # Next.js Route Handlers
      auth/ plans/ scenarios/ import/ admin/ push/ cron/
    login/           # Public login page
    layout.tsx       # Root layout (theme flash prevention)
  components/        # Sidebar.tsx, Topbar.tsx (shared layout)
  lib/server/        # auth.ts (session CRUD), db.ts (Prisma singleton)
  stores/            # Zustand: useAppStore.ts (plan data), useSimStore.ts (simulator)
  proxy.ts           # Next.js 16 middleware (named export proxy())

lib/                 # Shared frontend+backend: types.ts, constants.ts, compute.ts, simulation.ts
prisma/
  schema.prisma      # 8 models (no DB URLs — those are in prisma.config.ts)
  seed.ts
prisma.config.ts     # Prisma v7 CLI config — uses POSTGRES_URL_NON_POOLING
public/              # Legacy SPA (index.html), PWA assets (manifest.json, sw.js, icons/)
tests/               # Playwright e2e
```

## Key Gotchas

**`src/proxy.ts` — do NOT rename to `middleware.ts`**: Next.js 16 renamed the middleware convention to `proxy.ts`; renaming back causes a deprecation warning. The export must be `export function proxy()`, not the default Next.js `middleware` name.

**`NEXT_PUBLIC_GOOGLE_CLIENT_ID` trailing newline**: Setting this env var with a shell `echo` adds a trailing `\n`, causing `invalid_client` from Google. Always use `printf` or the Vercel Dashboard UI.

**Prisma v7 DB URL split**: `schema.prisma` has no `url`/`directUrl` fields. Connection strings live exclusively in `prisma.config.ts` (uses `POSTGRES_URL_NON_POOLING` for CLI ops). Runtime uses `POSTGRES_PRISMA_URL` (pooled via Neon).

**`build` requires Prisma client**: `npm run build` runs `prisma generate && next build`. If you add a new Prisma model, run `npm run db:push` before building locally.

**Cron job auth**: `GET /api/cron/cleanup` (daily session cleanup) requires `CRON_SECRET` env var set in Vercel — Vercel sets `Authorization: Bearer <CRON_SECRET>` automatically on cron calls.

## Environment Variables

```bash
POSTGRES_PRISMA_URL          # Pooled connection (runtime)
POSTGRES_URL_NON_POOLING     # Direct connection (migrations/prisma CLI)
NEXT_PUBLIC_GOOGLE_CLIENT_ID # Google OAuth (browser)
GOOGLE_CLIENT_ID             # Google OAuth (server verification)
SESSION_SECRET               # Random 64-char string
ALLOWED_ORIGIN               # https://gyneva-bp-https.vercel.app
VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY / VAPID_EMAIL  # Web Push
CRON_SECRET                  # Protects /api/cron/cleanup
```

Generate VAPID keys: `npx web-push generate-vapid-keys`

## Testing

- **Unit**: `vitest` — `tests/simulation.test.ts` (45 tests for `computeSimulation()` in `lib/simulation.ts`)
- **E2E**: Playwright — `tests/` with `playwright.config.ts`

## Data Model

36-month plan = 17 monthly arrays (JSONB) + 5 scalar constants. Key arrays: `ca`, `caAssoc`, `caIndep`, `caInterne`, `caSage`, `result`, `cashflow`, `treso1m`, `treso3m`. Every `PUT /api/plans/:id` with `data` auto-snapshots the current state as a `BusinessPlanVersion` before overwriting.
