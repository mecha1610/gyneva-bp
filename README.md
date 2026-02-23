# GYNEVA Business Plan

Interactive financial planning application for a gynecology clinic in Geneva. Provides 36-month revenue projections, cashflow scenario analysis, team ramp-up modeling, a real-time business simulator with configurable retrocession rate, Excel import with change tracking, full version history with restore, multi-plan management, scenario overlay comparison, PDF version comparison, revenue profile filters, interactive optimization controls with dynamic recommendations, dark/light theme, bilingual UI (FR/EN), and installable PWA with push notifications.

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
- [Changelog](CHANGELOG.md)

---

## Features

### Dashboard & Visualization
- **8-section SPA** with sidebar navigation: Overview, Simulator, Revenue, Cashflow, Team, Risks, Profit, Optimizations
- **Real-time KPI cards**: CAPEX, CA Y3, Net result Y3, ROI payback
- **Interactive Chart.js visualizations** for revenue evolution, cashflow scenarios, team growth, profitability
- **Verdict engine**: automatic viability assessment with color-coded indicators
- **Scenario overlay**: overlay a saved simulator scenario on dashboard charts (semi-transparent bars for overview, dashed lines for revenue and cashflow) to compare projections vs. actuals
- **Executive dashboard**: collapsible panel above tabs with global score gauge, 10 KPIs, and cashflow sparkline

### Internationalization
- **Bilingual UI (FR/EN)**: complete translation of all UI strings, verdicts, KPI labels, chart axes, and dynamic content
- **Auto-detection**: detects browser language via `navigator.language`, persists to localStorage
- **FR/EN toggle** in topbar; switching language instantly rebuilds all charts and reruns simulation
- **Mobile-responsive**: hamburger menu, slide-in sidebar drawer, 3 responsive breakpoints

### Dark Theme
- **Dark/light toggle** (`🌙/☀️`) in topbar, persisted to localStorage
- **Flash-prevention**: inline `<head>` script applies saved theme before first paint
- **Full coverage**: all sections, charts, tables, login card, modals

### Excel Import with Change Tracking
- **Drag-and-drop or file picker** upload of `.xlsx` business plan models
- **Server-side parsing** of the "Backend" sheet with mapped rows/columns
- **Math.round() on all cell values** to eliminate floating-point rounding drift
- **Import diff summary**: after each import, a grid shows every changed metric with old value, new value, and percentage variation
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

### Version Comparison (PDF Export)
- **"Comparer" button in topbar** opens a full-screen comparison modal
- **Side-by-side selectors**: choose two versions (or "Current data") from dropdowns
- **10-metric comparison grid**: CA Y1-3, Result Y1-3, Cashflow Y3, CAPEX, Consult/day, Fee — with old/new values, absolute delta, and percentage change (color-coded green/red)
- **2 comparison charts**: grouped bar chart (overview of 6 key metrics) + line chart (cashflow overlay)
- **Print/PDF export**: dedicated `@media print` CSS for clean A4 output via `window.print()`

### Multi-Plan Management
- **Plan switcher in topbar**: dropdown showing all user plans with selection, create, rename, and delete
- **Create new plan**: one-click creation with default GYNEVA data, auto-switch
- **Rename/delete inline**: contextual actions per plan in the dropdown
- **Plan-scoped data**: switching plans reloads all data, charts, scenarios, and version history

### Simulator
- **14-parameter interactive simulator** with real-time slider feedback
- **Parameters**: consultations/day, fees, working days, team composition (associates, independents, salaried), start month, occupancy rate, cash patients %, LAMal delay, factoring toggle, extra charges, professional liability, retrocession rate (20-60%)
- **Save/load named scenarios** for comparing alternative business models
- **Delta indicators** showing impact vs. baseline on key metrics
- **Year tabs (Y1 / Y2 / Y3 / Vue 3 ans)**: browse results per year instead of Y3-only
- **Scenario comparison modal**: full-screen side-by-side comparison of 2-3 saved scenarios with 12-metric grid, charts, and automatic rank-sum verdict

### Optimizations
- **Interactive controls**: factoring toggle, cash OI/ONU slider (0-30%), LAMal delay selector (0/1/3 months) — directly in the tab
- **4 dynamic KPIs**: worst-case BFR, current-config BFR (color-coded), BFR savings with percentage, factoring annual cost as % of net result
- **4-scenario comparison grid**: side-by-side cards with BFR min, critical month, risk tags, and active config highlight

### Revenue Profile Filters
- **Pill button filters**: toggle revenue sources (Tous, Associes, Independants, Internes, Sage-femme) on the Revenue chart
- **Single-profile view**: selecting one profile unstacks bars for clear ramp-up visualization
- **Profile detail cards**: per-profile CA Y1/Y2/Y3, percentage of total, ramp-up timeline, GynEva revenue share

### Authentication & Access Control
- **Google OAuth 2.0** sign-in with server-side JWT verification
- **Email/password login** via bcrypt-hashed credentials (12 salt rounds)
- **Invitation system**: admin generates a 48h invite link; user visits it to set name + password
- **Email whitelist**: only pre-approved addresses can access the app
- **Role-based access**: ADMIN, EDITOR, VIEWER (default VIEWER)
- **Admin panel**: user management (edit role/name, delete), invite management, whitelist management

### Progressive Web App (PWA)
- **Installable**: `manifest.json` + iOS meta tags — add to home screen on Android and iPhone
- **App icons**: 5 sizes (72, 192, 512, 512-maskable, apple-touch-icon 180px)
- **Service worker**: network-first fetch with offline fallback for the app shell
- **Push notifications**: Web Push API with VAPID; admin can broadcast to all subscribed users
- **Push subscription UI**: `🔔` button in topbar appears after login; subscribes/unsubscribes on click

---

## Architecture

```
Browser (SPA)                    Vercel Serverless Functions
+-----------------------+        +---------------------------+
| public/index.html     |  HTTP  | api/auth/*    (sessions)  |
| - Google Sign-In      |------->| api/plans/*   (CRUD+vers) |
| - Password login      |<-------| api/scenarios/*(simulator)|
| - Chart.js dashboards |        | api/import/*  (Excel)     |
| - Real-time simulator |        | api/admin/*   (users+inv) |
| - Dark/light theme    |        | api/push/*    (PWA push)  |
| - FR/EN language      |        +---------------------------+
| - PWA + push notif.   |                 |
| - Excel drag & drop   |           Prisma ORM
| - Version history     |                |
| - Version comparison  |        +------------------+
| - Multi-plan switcher |        | PostgreSQL (Neon) |
| - Scenario overlay    |        | 8 tables          |
| - Scenario comparison |        +------------------+
| - Revenue prof.filter |
| - Optimize controls   |
| - Executive dashboard |
+-----------------------+
```

The frontend is a single HTML file served as static content from `public/`. All data operations go through the REST API. The simulator engine runs client-side for instant slider feedback; persistence and Excel parsing happen server-side via API calls.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vanilla JS, Chart.js 4.4, Google Identity Services |
| API | Vercel Serverless Functions (TypeScript) |
| Database | PostgreSQL via Neon serverless |
| ORM | Prisma 7.x with `@prisma/adapter-neon` |
| Validation | Zod |
| Auth | Google OAuth 2.0 + email/password (bcryptjs) |
| Sessions | HttpOnly cookies + DB-backed tokens |
| Push | Web Push API via `web-push` (VAPID) |
| Excel | `xlsx` library (server-side parsing with Math.round) |
| i18n | Custom `t()` engine with FR/EN dictionaries |
| Theme | CSS custom properties + `[data-theme="dark"]` |
| PWA | Web App Manifest + Service Worker |

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
│   │   ├── index.ts               # POST ?action=google|login|logout / GET ?action=me
│   │   └── invite/
│   │       └── [token].ts         # GET Validate / POST Accept invite token
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
│   │   ├── users.ts               # GET    List users+emails / POST Add / DELETE Remove
│   │   ├── users/
│   │   │   └── [id].ts            # PUT    Update role/name / DELETE Remove user
│   │   └── invites.ts             # GET    List pending / POST Create invite
│   └── push/
│       └── index.ts               # POST Subscribe / POST ?action=send Broadcast (admin)
│
├── lib/                           # Shared code (front + back)
│   ├── types.ts                   # TypeScript interfaces
│   ├── constants.ts               # Default data, Excel mappings, simulator defaults
│   ├── compute.ts                 # Financial engine (scenarios, derived metrics)
│   └── simulation.ts              # Extracted computeSimulation() for unit testing
│
├── tests/
│   └── simulation.test.ts         # 45 vitest tests for computeSimulation()
│
├── prisma/
│   ├── schema.prisma              # Database schema (8 models)
│   └── seed.ts                    # Seed script
│
├── prisma.config.ts               # Prisma v7 CLI config (connection URLs)
│
├── public/
│   ├── index.html                 # Single-page application (all sections embedded)
│   ├── manifest.json              # PWA Web App Manifest
│   ├── sw.js                      # Service Worker (cache + push handler)
│   └── icons/
│       ├── icon-72.png            # Android icon 72×72
│       ├── icon-192.png           # Android icon 192×192
│       ├── icon-512.png           # Android splash icon 512×512
│       ├── icon-512-maskable.png  # Android adaptive icon 512×512
│       └── apple-touch-icon.png   # iOS home screen icon 180×180
│
├── docs/
│   └── PRD-v1.md                  # Product Requirements Document
│
├── vitest.config.ts
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
| `VAPID_PUBLIC_KEY` | Yes | VAPID public key for Web Push (generate with `web-push generate-vapid-keys`) |
| `VAPID_PRIVATE_KEY` | Yes | VAPID private key for Web Push |
| `VAPID_EMAIL` | Yes | Contact email for VAPID (`mailto:you@example.com`) |
| `NODE_ENV` | Auto | Set by Vercel; controls Secure/SameSite cookie flags |

Copy `.env.example` to `.env.local` and fill in your values.

To generate VAPID keys:
```bash
npx web-push generate-vapid-keys
```

## Database

### Schema

```
┌──────────────┐     ┌──────────────┐────<┌───────────────────┐
│ AllowedEmail │     │    User      │     │     Session        │
│              │     │              │     │ (token, expiresAt) │
│ email        │     │ email        │     └───────────────────┘
│ addedBy      │     │ role (enum)  │
└──────────────┘     │ googleSub    │────<┌───────────────────┐
                     │ passwordHash │     │  BusinessPlan     │
┌──────────────┐     └──────────────┘     │  (36-month JSONB)  │
│ InviteToken  │            │        ────<│  + scalar constants│
│              │            │             └───────────────────┘
│ token        │            │                      │
│ email, role  │            │                 ────<│
│ expiresAt    │     ┌──────┴───────────┐   ┌─────────────────────┐
└──────────────┘     │SimulatorScenario │   │BusinessPlanVersion  │
                     │ (params JSONB)   │   │ (data + constants)  │
                     └──────────────────┘   └─────────────────────┘
                            │
                     ┌──────┴──────────────┐
                     │  PushSubscription   │
                     │  (endpoint, keys)   │
                     └─────────────────────┘
```

### Models

| Model | Description |
|-------|-------------|
| **User** | Authenticated users with role (`ADMIN`, `EDITOR`, `VIEWER`); supports Google OAuth and password auth |
| **Session** | Server-side sessions with 24h TTL, cascade-deleted with user |
| **AllowedEmail** | Email whitelist checked during login |
| **BusinessPlan** | 36-month financial model (17 arrays as JSONB + 5 scalar constants), soft-deletable |
| **BusinessPlanVersion** | Auto-snapshot before each plan update; stores full data + constants at that point |
| **SimulatorScenario** | Saved simulator parameter sets (14 parameters), optionally shared or linked to a plan |
| **InviteToken** | Admin-generated invite links with email, role, 48h expiry, and usage tracking |
| **PushSubscription** | Web Push subscription per user (endpoint, p256dh, auth keys) |

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
| `POST` | `/auth?action=google` | No | Exchange Google JWT for session cookie |
| `POST` | `/auth?action=login` | No | Email/password login (max 5 attempts per 5 min) |
| `GET` | `/auth?action=me` | Yes | Get current user from session |
| `POST` | `/auth?action=logout` | Yes | Destroy session |
| `GET` | `/auth/invite/[token]` | No | Validate invite token (returns email, role) |
| `POST` | `/auth/invite/[token]` | No | Accept invite (set name + password, create account) |

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
| `PUT` | `/admin/users/:id` | ADMIN | Update user role or name |
| `DELETE` | `/admin/users/:id` | ADMIN | Delete user (cascades sessions, plans, scenarios) |
| `GET` | `/admin/invites` | ADMIN | List pending (unused, non-expired) invites |
| `POST` | `/admin/invites` | ADMIN | Create invite link (email + role, 48h TTL) |

### Push Notifications

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/push` | Yes | Subscribe current user to push notifications |
| `POST` | `/push?action=send` | ADMIN | Broadcast push notification to all subscribers |

**Subscribe body**: `{ endpoint, keys: { p256dh, auth } }` (standard Web Push subscription object)

**Send body**: `{ title, body, url? }`

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
| 429 | Rate limit exceeded (60 req/min per IP; 5 login attempts per 5 min) |
| 500 | Server error |

## Authentication & Security

### Google OAuth Flow

```
1. User clicks Google Sign-In button
2. Google Identity Services returns a JWT credential
3. Frontend POSTs credential to /api/auth?action=google
4. Server verifies JWT with google-auth-library
5. Server checks email against AllowedEmail table
6. Server upserts User record
7. Server creates Session (random 32-byte token, 24h TTL)
8. Server sets HttpOnly cookie (gyneva_session)
9. Subsequent requests include cookie automatically
```

### Password / Invite Flow

```
1. Admin creates invite via POST /api/admin/invites (email + role)
2. Admin copies the generated link (/?invite=TOKEN)
3. User opens the link — server validates token, returns email + role
4. User enters name + password (min 12 chars) and submits
5. Server hashes password with bcrypt (12 rounds), creates User + Session
6. Token marked as used; allowedEmail upserted — all in a single transaction
```

### Security Measures

- **Server-side JWT verification** via `google-auth-library`
- **HttpOnly cookies**: session token not accessible to JavaScript
- **Secure + SameSite=Strict**: in production (HTTPS only, prevents CSRF)
- **Email whitelist**: only pre-approved emails can log in
- **Login rate limiting**: max 5 attempts per IP per 5-minute window on password login
- **Password hashing**: bcryptjs with 12 salt rounds (NIST SP 800-63B compliant, min 12 chars)
- **Role-based access**: `ADMIN`, `EDITOR`, `VIEWER`
- **Parameterized queries**: all DB access through Prisma (no raw SQL)
- **Input validation**: Zod schemas on all API inputs
- **Rate limiting**: 60 requests/minute per IP (in-memory)
- **CORS**: restricted to configured `ALLOWED_ORIGIN`; `Allow-Credentials` only sent to allowed origins
- **No-store cache headers**: on all API responses
- **Security headers**: `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy` on all API responses
- **VAPID authentication**: push notifications authenticated with VAPID key pair

## Business Logic

### Financial Model

The application models a 36-month financial projection for a medical clinic with four revenue sources:

| Source | Description | Revenue Model |
|--------|-------------|--------------|
| Associes | Partner specialists | Configurable retrocession rate (20-60%, default 40%) of specialist revenue potential |
| Independants | Independent doctors | Same configurable retrocession rate as Associes |
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
- **Static files** from `public/` (SPA + PWA assets)
- **Serverless functions** from `api/` (auto-detected by Vercel, max 12 on Hobby plan)
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
VAPID_PUBLIC_KEY             # Generate with: npx web-push generate-vapid-keys
VAPID_PRIVATE_KEY            # (same command)
VAPID_EMAIL                  # mailto:your@email.com
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
