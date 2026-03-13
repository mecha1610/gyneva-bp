# Design Spec — gyneva-bp Project Documentation Suite

**Date:** 2026-03-13  
**Status:** Approved  
**Scope:** Four Claude Code context documents for the gyneva-bp project

---

## Goal

Create four AI-agent-facing documents that give Claude Code optimal context when working on gyneva-bp. All documents are written for machine consumption (Claude sessions), not human onboarding.

---

## Documents

### 1. `.claude/skills/gyneva-bp.md` — Project-wide catch-all skill

**Trigger:** Any work on the gyneva-bp project.

**Structure:**
- Session checklist (4 bullets Claude verifies at session start)
- Workflow commands (verbatim copy-paste for dev, test, deploy, DB operations)
- Critical gotchas (5 known landmines reinforced with context)
- Cross-references to the other three docs

**Key content:**
- Two-runtime reality: legacy SPA (`public/index.html`) + Next.js React app coexist
- `proxy.ts` must stay named `proxy.ts` (Next.js 16 convention)
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID` must not have trailing newline
- Prisma v7 URL split: runtime uses `POSTGRES_PRISMA_URL`, CLI uses `POSTGRES_URL_NON_POOLING` via `prisma.config.ts`
- `build` = `prisma generate && next build`
- Cron job at `/api/cron/cleanup` requires `CRON_SECRET`

---

### 2. `docs/architect.md` — Codebase orientation

**Audience:** Claude needing to understand how the system is structured before making changes.

**Structure:**
- System overview (two-runtime architecture explanation)
- Request flow diagram (proxy.ts → App Router → API handlers → lib/server → Prisma → Neon)
- Directory responsibilities (one line per directory)
- Data flow (plan data via Zustand, simulator via pure function)
- Key design decisions with rationale (why proxy.ts, why Prisma v7 split, why lib/ is separate, why SPA still exists)

---

### 3. `docs/rules.md` — Coding conventions

**Audience:** Claude writing or modifying code.

**Sections:**
- **API Route Handlers:** Zod validation, middleware guards, errors.ts, no raw SQL
- **React pages:** CSS Modules only, charts dynamically imported with `ssr: false`, Zustand for state, no business logic in pages
- **Shared lib/:** Pure functions only, types.ts as single source of truth, constants.ts owns defaults
- **Financial data:** All monetary values are integers (Math.round everywhere), 36-month arrays always length 36, retrocession as integer 20–60
- **Testing:** vitest for unit, Playwright for E2E, never mock the DB
- **Git/deployment:** typecheck must pass before commit, always run full build locally before pushing

---

### 4. `docs/prd.md` — Living product document

**Audience:** Claude needing product context (what exists, what's intentional, what's next).

**Structure:**
- Product vision (one sentence)
- Users & roles (ADMIN/EDITOR/VIEWER capabilities)
- Feature inventory table (feature | status | version shipped) — covers all shipped features at v0.21.3
- Key metrics & business logic (financial model constants, 36-month data structure, 3 cashflow scenarios)
- Known limitations & tech debt
- Roadmap (placeholder for future features)
- Historical PRDs (absorbed from `PRD-v1.md`)

**Absorbs:** `docs/PRD-v1.md` — content folded into the historical PRDs section, original file deleted.

---

## File Layout

```
.claude/
  skills/
    gyneva-bp.md          ← new
docs/
  architect.md            ← new
  rules.md                ← new
  prd.md                  ← new (absorbs PRD-v1.md)
  PRD-v1.md               ← deleted after absorption
  superpowers/
    specs/
      2026-03-13-project-docs-design.md   ← this file
```

---

## Out of Scope

- Human-readable onboarding guide
- API documentation (already in README.md)
- Deployment runbook (already in README.md + CLAUDE.md)
- Test plan document
