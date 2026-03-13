# Skill: gyneva-bp
**Trigger:** any work on the gyneva-bp project
**Description:** gyneva-bp is a Next.js SaaS app for creating and sharing business plans, with Google OAuth, Prisma/Neon DB, and Vercel hosting.

---

## Session Checklist

- [ ] `.vercel/project.json` exists and references project `gyneva-bp-https`
- [ ] Identify runtime scope: legacy SPA (`public/index.html`) or Next.js React app (`src/`)
- [ ] `.env.local` exists with all 10 required vars before running `npm run dev`
- [ ] `npm run typecheck` passes before any commit

---

## Workflow Commands

```bash
npm run dev           # Next.js dev server (port 3000)
npm run dev:vercel    # Vercel dev (includes cron + headers from vercel.json); preferred for full-stack testing
npm run build         # runs: prisma generate && next build
npm run typecheck     # tsc --noEmit; must pass before committing
npm run test          # vitest unit tests (45 tests, ~400ms)
npm run test:watch    # vitest watch mode
npm run db:push       # sync Prisma schema to DB (no migration file)
npm run db:migrate    # create migration file + apply
npm run db:seed       # seed 2 users + 1 default business plan
npm run db:studio     # open Prisma Studio GUI
```

---

## Critical Gotchas

1. **`src/proxy.ts` — do NOT rename back to `middleware.ts`**: Next.js 16 renamed middleware from `middleware.ts` to `proxy.ts`. Using `middleware.ts` still works but triggers a deprecation warning. Export must be `export function proxy()`.

2. **`NEXT_PUBLIC_GOOGLE_CLIENT_ID` trailing newline**: Setting this via shell `echo` adds a `\n`, causing `invalid_client` from Google. Always use `printf` or the Vercel Dashboard UI when setting it.

3. **Prisma v7 DB URL split**: `schema.prisma` has NO `url`/`directUrl` fields. Connection strings live in `prisma.config.ts` only. Runtime uses `POSTGRES_PRISMA_URL` (pooled via Neon); CLI ops use `POSTGRES_URL_NON_POOLING`. If Prisma CLI errors with "missing datasource URL", check `prisma.config.ts`, not `schema.prisma`.

4. **Build requires Prisma client first**: `npm run build` = `prisma generate && next build`. If a new Prisma model is added, run `npm run db:push` before building locally.

5. **Cron job requires `CRON_SECRET`**: `GET /api/cron/cleanup` (daily session cleanup at 3am UTC) is protected by this env var. Vercel sets `Authorization: Bearer <CRON_SECRET>` automatically on cron invocations.

---

## Environment Variables

```
POSTGRES_PRISMA_URL          # Pooled Neon connection string (runtime / Prisma client)
POSTGRES_URL_NON_POOLING     # Direct Neon connection string (Prisma CLI: migrate, push, studio)
NEXT_PUBLIC_GOOGLE_CLIENT_ID # Google OAuth client ID exposed to browser (must NOT have trailing newline)
GOOGLE_CLIENT_ID             # Same client ID used server-side for JWT verification
SESSION_SECRET               # Random 64-char string used to sign session tokens
ALLOWED_ORIGIN               # Production URL for CORS (https://gyneva-bp-https.vercel.app)
VAPID_PUBLIC_KEY             # Web Push VAPID public key (generate: npx web-push generate-vapid-keys)
VAPID_PRIVATE_KEY            # Web Push VAPID private key
VAPID_EMAIL                  # Contact email for VAPID (mailto: format)
CRON_SECRET                  # Bearer token protecting /api/cron/cleanup from unauthorized calls
```

---

## Cross-References

- Architecture: `docs/architect.md`
- Coding rules: `docs/rules.md`
- Product context: `docs/prd.md`
- Project commands + more gotchas: `CLAUDE.md`
