# GYNEVA Business Plan

Interactive financial planning application for a gynecology clinic in Geneva. Provides 36-month revenue projections, cashflow scenario analysis, team ramp-up modeling, a real-time business simulator, Excel import with change tracking, and full version history with restore.

**Production**: https://gyneva-bp-https.vercel.app

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Environment Variables](#environment-variables)
- [Database](#database)
- [API Reference](#api-reference)
- [Authentication & Security](#authentication--security)
- [Business Logic](#business-logic)
- [Excel Import](#excel-import)
- [Version History](#version-history)
- [Deployment](#deployment)

---

## Features

### Dashboard & Visualization
- **8-section SPA** with sidebar navigation: Overview, Simulator, Revenue, Cashflow, Team, Risks, Profit, Optimizations
- **Real-time KPI cards**: CAPEX, CA Y3, Net result Y3, ROI payback
- **Interactive Chart.js visualizations** for revenue evolution, cashflow scenarios, team growth, profitability
- **Verdict engine**: automatic viability assessment with color-coded indicators

### Excel Import with Change Tracking
- **Drag-and-drop or file picker** upload of `.xlsx` business plan models
- **Server-side parsing** of the "Backend" sheet with mapped rows/columns
- **Math.round() on all cell values** to eliminate floating-point rounding drift between Excel and the app
- **Import diff summary**: after each import, a grid shows every changed metric (CA Y1-3, Result Y1-3, CAPEX, fee, consult/day, ETP max) with old value, new value, and percentage variation
- **"No changes detected"** message when re-uploading the same file
- **Warnings display**: parser warnings (zero-rows, missing critical rows, sheet fallback) shown inline

### Parser Robustness
- **Sheet fallback**: if "Backend" is absent but the workbook has a single sheet, it is used automatically (with a warning)
- **Available sheets listed in error message** when "Backend" is missing from a multi-sheet workbook
- **Critical row validation**: checks that CA (row 46), Result (row 86), and Cashflow (row 87) exist within the worksheet range
- **Zero-row detection**: warns when CA, Result, Cashflow, or sub-revenue lines are entirely zero

### Version History & Restore
- **"Versions" button in topbar** opens a slide-in panel on the right
- **Version list** with version number, label, and formatted date
- **One-click restore**: fetches full version data, pushes it to the plan (which auto-snapshots the current state first), reloads the UI, and shows a diff of what changed
- **Labeled snapshots**: every Excel import creates a version labeled "Import Excel: filename.xlsx"; restores create "Restauration v3"

### Simulator
- **13-parameter interactive simulator** with real-time slider feedback
- **Parameters**: consultations/day, fees, working days, team composition (associates, independents, salaried), start month, occupancy rate, cash patients %, LAMal delay, factoring toggle, extra charges, professional liability
- **Save/load named scenarios** for comparing alternative business models
- **Delta indicators** showing impact vs. baseline on key metrics

### Authentication & Access Control
- **Google OAuth 2.0** sign-in with server-side JWT verification
- **Email whitelist**: only pre-approved addresses can access the app
- **Role-based access**: ADMIN, EDITOR, VIEWER
- **Admin panel** for managing the whitelist

---

## Architecture

```
Browser (SPA)                    Vercel Serverless Functions
+-----------------------+        +---------------------------+
| public/index.html     |  HTTP  | api/auth/*    (sessions)  |
| - Google Sign-In      |------->| api/plans/*   (CRUD+vers) |
| - Chart.js dashboards |<-------| api/scenarios/*(simulator) |
| - Real-time simulator |        | api/import/*  (Excel)     |
| - Excel drag & drop   |        | api/admin/*   (whitelist) |
| - Import diff summary |        +---------------------------+
| - Version history     |                 |
+-----------------------+           Prisma ORM
                                         |
                                +------------------+
                                | PostgreSQL (Neon) |
                                | 6 tables          |
                                +------------------+
```

The frontend is a single HTML file served as static content. All data operations go through the REST API. The simulator engine runs client-side for instant slider feedback; persistence and Excel parsing happen server-side via API calls.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vanilla JS, Chart.js 4.4, Google Identity Services |
| API | Vercel Serverless Functions (TypeScript) |
| Database | PostgreSQL via Neon serverless |
| ORM | Prisma 5.x with `@prisma/adapter-neon` |
| Validation | Zod |
| Auth | Google OAuth 2.0, server-side JWT verification |
| Sessions | HttpOnly cookies + DB-backed tokens |
| Excel | `xlsx` library (server-side parsing with Math.round) |

## Getting Started

### Prerequisites

- Node.js 18+
- A Neon PostgreSQL database (or any Postgres)
- A Google Cloud OAuth 2.0 Client ID (Web application type)
- Vercel CLI (`npm i -g vercel`)

### Setup

```bash
# Clone
git clone https://github.com/mecha1610/gyneva-bp.git
cd gyneva-bp

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your credentials

# Push schema to database
npx prisma db push

# Seed initial data (2 users, default business plan)
npm run db:seed

# Start local dev server
npm run dev
```

The app will be available at `http://localhost:3000`.

### Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Local dev server (Vercel Functions + static) |
| `npm run typecheck` | TypeScript type checking (`tsc --noEmit`) |
| `npm run test` | Run tests (vitest) |
| `npm run db:push` | Sync Prisma schema to DB |
| `npm run db:seed` | Seed initial data |
| `npm run db:studio` | Open Prisma Studio (DB GUI) |
| `npm run db:migrate` | Create migration files |

## Project Structure

```
gyneva-bp/
├── api/                           # Vercel serverless functions
│   ├── _lib/                      # Shared utilities (not deployed as endpoints)
│   │   ├── auth.ts                # Google OAuth verification, session CRUD
│   │   ├── db.ts                  # Prisma client singleton (Neon adapter)
│   │   ├── errors.ts              # Standardized error responses
│   │   └── middleware.ts          # CORS, rate limiting, auth guards
│   ├── auth/
│   │   ├── google.ts              # POST   Login with Google credential
│   │   ├── me.ts                  # GET    Current user from session
│   │   └── logout.ts             # POST   Destroy session
│   ├── plans/
│   │   ├── index.ts               # GET    List plans / POST Create plan
│   │   ├── [id].ts                # GET    Read / PUT Update (auto-snapshot) / DELETE
│   │   └── [id]/
│   │       ├── versions.ts        # GET    List version history
│   │       └── versions/
│   │           └── [versionId].ts # GET    Full version data (for restore)
│   ├── scenarios/
│   │   ├── index.ts               # GET    List / POST Create scenario
│   │   └── [id].ts                # GET    Read / PUT Update / DELETE Remove
│   ├── import/
│   │   └── excel.ts               # POST   Parse Excel (Math.round, fallback, warnings)
│   ├── admin/
│   │   └── users.ts               # GET    List / POST Add / DELETE Remove emails
│   └── health.ts                  # GET    Health check
│
├── lib/                           # Shared code (front + back)
│   ├── types.ts                   # TypeScript interfaces
│   ├── constants.ts               # Default data, Excel mappings, simulator defaults
│   └── compute.ts                 # Financial engine (scenarios, derived metrics)
│
├── prisma/
│   ├── schema.prisma              # Database schema (6 models)
│   └── seed.ts                    # Seed script
│
├── public/
│   └── index.html                 # Single-page application (all sections embedded)
│
├── package.json
├── tsconfig.json
└── vercel.json                    # Build + deployment config
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `POSTGRES_PRISMA_URL` | Yes | Pooled Postgres connection string |
| `POSTGRES_URL_NON_POOLING` | Yes | Direct connection (for Prisma migrations) |
| `GOOGLE_CLIENT_ID` | Yes | Google OAuth 2.0 Client ID |
| `SESSION_SECRET` | Yes | Random string for session signing |
| `ALLOWED_ORIGIN` | Yes | Production URL for CORS (`https://gyneva-bp-https.vercel.app`) |
| `NODE_ENV` | Auto | Set by Vercel; controls Secure/SameSite cookie flags |

Copy `.env.example` to `.env.local` and fill in your values.

## Database

### Schema

```
┌──────────────┐     ┌──────────────┐     ┌───────────────────┐
│ AllowedEmail │     │    User      │────<│     Session        │
│              │     │              │     │ (token, expiresAt) │
│ email        │     │ email        │     └───────────────────┘
│ addedBy      │     │ role (enum)  │
└──────────────┘     │ googleSub    │────<┌───────────────────┐
                     └──────────────┘     │  BusinessPlan     │
                            │             │  (36-month JSONB)  │
                            │        ────<│  + scalar constants│
                            │             └───────────────────┘
                            │                      │
                            │                 ────<│
                     ┌──────────────────┐   ┌─────────────────────┐
                     │SimulatorScenario │   │BusinessPlanVersion  │
                     │ (params JSONB)   │   │ (data + constants)  │
                     └──────────────────┘   └─────────────────────┘
```

### Models

| Model | Description |
|-------|-------------|
| **User** | Authenticated users with role (`ADMIN`, `EDITOR`, `VIEWER`) |
| **Session** | Server-side sessions with 24h TTL, cascade-deleted with user |
| **AllowedEmail** | Email whitelist checked during login |
| **BusinessPlan** | 36-month financial model (17 arrays as JSONB + 5 scalar constants), soft-deletable |
| **BusinessPlanVersion** | Auto-snapshot before each plan update; stores full data + constants at that point |
| **SimulatorScenario** | Saved simulator parameter sets (13 parameters), optionally shared or linked to a plan |

### Seed Data

The seed script (`npm run db:seed`) creates:
- 2 allowed emails
- 1 ADMIN user, 1 EDITOR user
- 1 default business plan with the GYNEVA baseline 36-month model

## API Reference

All endpoints are prefixed with `/api`. Responses use JSON. Errors follow:

```json
{ "error": "Human-readable message", "code": "ERROR_CODE", "details": {} }
```

### Auth

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/auth/google` | No | Exchange Google JWT for session cookie |
| `GET` | `/auth/me` | Yes | Get current user from session |
| `POST` | `/auth/logout` | Yes | Destroy session |

### Plans

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/plans` | Yes | List user's active plans |
| `POST` | `/plans` | Yes | Create plan (uses defaults if no data provided) |
| `GET` | `/plans/:id` | Yes | Get plan with full 36-month data |
| `PUT` | `/plans/:id` | Yes | Update plan (auto-snapshots before overwrite) |
| `DELETE` | `/plans/:id` | Yes | Soft-delete plan |
| `GET` | `/plans/:id/versions` | Yes | List version history (id, number, label, date) |
| `GET` | `/plans/:id/versions/:versionId` | Yes | Get full version data + constants (for restore) |

`PUT /plans/:id` accepts an optional `versionLabel` field. When `data` is included in the body, the current plan state is automatically saved as a `BusinessPlanVersion` before applying the update.

### Scenarios

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/scenarios` | Yes | List own + shared scenarios |
| `POST` | `/scenarios` | Yes | Save a simulator scenario |
| `GET` | `/scenarios/:id` | Yes | Get scenario parameters |
| `PUT` | `/scenarios/:id` | Yes | Update scenario |
| `DELETE` | `/scenarios/:id` | Yes | Delete scenario |

### Excel Import

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/import/excel` | Yes | Parse `.xlsx` and return structured data + warnings |

**Request**:
```json
{ "file": "<base64 xlsx>", "filename": "model.xlsx" }
```

**Response 200**:
```json
{
  "data": { "ca": [...], "result": [...], ... },
  "warnings": ["\"CA internes\" contient uniquement des zéros — ..."],
  "filename": "model.xlsx",
  "message": "Excel parsed successfully"
}
```

**Parser behavior**:
- Looks for sheet named "Backend"; falls back to the first (and only) sheet if "Backend" is absent
- All numeric cell values are rounded to integers via `Math.round()` to prevent floating-point drift
- Validates that all 17 arrays have exactly 36 elements
- Returns `warnings[]` for: sheet fallback, critical rows out of range, entirely-zero data rows

Size limit: 10 MB.

### Admin

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/admin/users` | ADMIN | List allowed emails + registered users |
| `POST` | `/admin/users` | ADMIN | Add email to whitelist |
| `DELETE` | `/admin/users?email=...` | ADMIN | Remove email from whitelist |

### Health

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/health` | No | Returns `{ ok: true, ts: <timestamp> }` |

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 204 | Preflight OK |
| 400 | Validation error (`BAD_REQUEST`) |
| 401 | No session (`UNAUTHORIZED`) |
| 403 | Forbidden / Email not allowed |
| 404 | Resource not found |
| 405 | Wrong HTTP method |
| 429 | Rate limit exceeded (60 req/min per IP) |
| 500 | Server error |

## Authentication & Security

### Flow

```
1. User clicks Google Sign-In button
2. Google Identity Services returns a JWT credential
3. Frontend POSTs credential to /api/auth/google
4. Server verifies JWT with google-auth-library
5. Server checks email against AllowedEmail table
6. Server upserts User record
7. Server creates Session (random 32-byte token, 24h TTL)
8. Server sets HttpOnly cookie (gyneva_session)
9. Subsequent requests include cookie automatically
```

### Security Measures

- **Server-side JWT verification** via `google-auth-library`
- **HttpOnly cookies**: session token not accessible to JavaScript
- **Secure + SameSite=Strict**: in production (HTTPS only, prevents CSRF)
- **Email whitelist**: only pre-approved emails can log in
- **Role-based access**: `ADMIN`, `EDITOR`, `VIEWER`
- **Parameterized queries**: all DB access through Prisma (no raw SQL)
- **Input validation**: Zod schemas on all API inputs
- **Rate limiting**: 60 requests/minute per IP (in-memory)
- **CORS**: restricted to configured origin
- **No-store cache headers**: on all API responses

## Business Logic

### Financial Model

The application models a 36-month financial projection for a medical clinic with four revenue sources:

| Source | Description | Revenue Model |
|--------|-------------|--------------|
| Associes | Partner specialists | 40% of specialist revenue potential |
| Independants | Independent doctors | 40% of specialist revenue potential |
| Internes | Salaried doctors | 100% of specialist revenue potential |
| Sages-femmes | Midwives | Fixed CHF 13,333/month at capacity |

### 36-Month Data Structure

Each plan contains 17 monthly arrays of 36 integers plus 5 scalar constants:

| Category | Arrays |
|----------|--------|
| Revenue | `ca`, `caAssoc`, `caIndep`, `caInterne`, `caSage` |
| Financial | `result`, `cashflow`, `treso1m`, `treso3m` |
| Costs | `admin`, `opex`, `lab` |
| Staffing | `fteAssoc`, `fteIndep`, `fteInterne`, `fteAdmin`, `fteTotal` |
| Constants | `consultDay`, `fee`, `daysYear`, `revSpec`, `capex` |

### Cashflow Scenarios

Three treasury scenarios based on LAMal (Swiss health insurance) payment delays:

| Scenario | Description | Working Capital Impact |
|----------|-------------|----------------------|
| **Factoring** | Caisse des Medecins pays immediately (1.5% fee) | Lowest BFR |
| **1-month delay** | LAMal pays after 1 month | Moderate BFR |
| **3-month delay** | LAMal pays after 3 months | Highest BFR |

In all scenarios, cash patients (OI/ONU, ~15% of revenue) pay immediately.

### Key Constants

| Parameter | Value |
|-----------|-------|
| Consultations/day | 16 |
| Fee/consultation | CHF 225 |
| Working days/year | 215 |
| Revenue/specialist/year | CHF 923,432 |
| Cash patients share | 15% |
| Factoring cost | 1.5% |
| CAPEX | CHF 523,000 |

## Excel Import

### Workflow

1. User drags `.xlsx` onto dropzone or uses file picker
2. File is read as ArrayBuffer, base64-encoded, and POSTed to `/api/import/excel`
3. Server parses the "Backend" sheet (or single-sheet fallback) using mapped rows from `EXCEL_ROW_MAP`
4. All cell values are `Math.round()`-ed to prevent floating-point rounding discrepancies
5. Server validates 36-element arrays and returns data + warnings
6. Frontend deep-copies current data, applies the import, and displays a diff summary
7. If a plan is active, the imported data is PUT to the plan (auto-creating a version snapshot)

### Row Mappings

| Metric | Excel Row | Metric | Excel Row |
|--------|-----------|--------|-----------|
| CA total | 46 | FTE Associes | 31 |
| CA Associes | 42 | FTE Independants | 32 |
| CA Independants | 43 | FTE Internes | 33 |
| CA Internes | 44 | FTE Admin (base) | 35 |
| CA Sages-femmes | 45 | FTE Admin (extra) | 36 |
| Resultat | 86 | FTE Total | 38 |
| Cashflow | 87 | Consult/day | Row 5, Col B |
| Treso 1 mois | 90 | Fee | Row 9, Col B |
| Treso 3 mois | 93 | Days/year | Row 8, Col B |
| Admin costs | 61 | Rev/specialist | Row 15, Col B |
| OPEX | 76 | CAPEX | Row 118, Col E |
| Lab | 82 | | |

Month columns: B-M (Y1), O-Z (Y2), AB-AM (Y3) = 36 months.

### Diff Summary

After each import the app compares 10 key metrics against the previous state:

- CA Year 1, 2, 3
- Result Year 1, 2, 3
- CAPEX, Honoraires/consultation, Consultations/jour, ETP max

Each changed metric shows: old value (strikethrough), arrow, new value, and percentage change (green for increase, red for decrease). If nothing changed, the summary shows "Aucun changement detecte."

Parser warnings (sheet fallback, zero rows, out-of-range rows) are displayed below the diff grid with warning icons.

## Version History

### How It Works

1. Every `PUT /plans/:id` that includes `data` automatically creates a `BusinessPlanVersion` snapshot of the current state before applying the update
2. Each version stores: full 36-month data arrays, scalar constants, version number, label, and timestamp
3. The "Versions" button in the topbar opens a slide-in panel listing all versions (newest first)
4. Clicking "Restaurer cette version" on any entry:
   - Fetches full version data via `GET /plans/:id/versions/:versionId`
   - PUTs it to the plan (which auto-snapshots the current state before overwriting)
   - Updates the UI and shows a diff of what changed
5. Version labels are set automatically: "Import Excel: filename.xlsx", "Restauration v3", etc.

### Version Chain

```
v1  "Import Excel: model_v1.xlsx"     2025-06-01
v2  "Import Excel: model_v2.xlsx"     2025-06-15   <-- user clicks "Restaurer"
v3  "Restauration v1"                 2025-06-20   (snapshot of v2 state before restore)
```

Restoring a version never destroys data; it always creates a new snapshot first.

## Deployment

### Vercel (Production)

The app is deployed on Vercel with:
- **Static files** from `public/` (SPA)
- **Serverless functions** from `api/` (auto-detected by Vercel)
- **PostgreSQL** via Neon (Frankfurt region)

```bash
# Deploy to production
npx vercel --prod

# Or push to main branch (auto-deploys via GitHub integration)
git push origin main
```

### Environment Setup on Vercel

Required env vars (set via Vercel Dashboard or CLI):

```
POSTGRES_PRISMA_URL          # From Neon/Vercel Postgres integration
POSTGRES_URL_NON_POOLING     # Direct connection for migrations
GOOGLE_CLIENT_ID             # Google OAuth Client ID
SESSION_SECRET               # Random secret string
ALLOWED_ORIGIN               # https://gyneva-bp-https.vercel.app
```

### Google OAuth Setup

1. Go to [Google Cloud Console > Credentials](https://console.cloud.google.com/apis/credentials)
2. Create an OAuth 2.0 Client ID (Web application type)
3. Add authorized JavaScript origins: `https://gyneva-bp-https.vercel.app`
4. Add authorized redirect URIs: `https://gyneva-bp-https.vercel.app`
5. Set the Client ID in both:
   - Vercel env var `GOOGLE_CLIENT_ID`
   - Frontend `public/index.html` (in the `google.accounts.id.initialize()` call)

---

Built for GYNEVA by [@mecha1610](https://github.com/mecha1610).
