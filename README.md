# GYNEVA Business Plan

Interactive financial planning application for a gynecology clinic in Geneva. Provides 36-month revenue projections, cashflow scenario analysis, team ramp-up modeling, and a real-time business simulator.

**Production**: https://gyneva-bp-https.vercel.app

## Table of Contents

- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Environment Variables](#environment-variables)
- [Database](#database)
- [API Reference](#api-reference)
- [Authentication](#authentication)
- [Business Logic](#business-logic)
- [Deployment](#deployment)

---

## Architecture

```
Browser (SPA)                    Vercel Serverless Functions
+-----------------------+        +---------------------------+
| public/index.html     |  HTTP  | api/auth/*    (sessions)  |
| - Google Sign-In      |------->| api/plans/*   (CRUD)      |
| - Chart.js dashboards |<-------| api/scenarios/*(simulator) |
| - Real-time simulator |        | api/import/*  (Excel)     |
| - Excel drag & drop   |        | api/admin/*   (whitelist) |
+-----------------------+        +---------------------------+
                                          |
                                    Prisma ORM
                                          |
                                 +------------------+
                                 | PostgreSQL (Neon) |
                                 | 6 tables          |
                                 +------------------+
```

The frontend is a single HTML file served as static content. All data operations go through the REST API. The simulator engine (`lib/compute.ts`) runs client-side for instant slider feedback, while persistence happens via API calls.

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
| Excel | `xlsx` library (server-side parsing) |

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

### Useful Commands

```bash
npm run dev          # Local dev server (Vercel Functions + static)
npm run typecheck    # TypeScript type checking
npm run test         # Run tests (vitest)
npm run db:push      # Sync Prisma schema to DB
npm run db:seed      # Seed initial data
npm run db:studio    # Open Prisma Studio (DB GUI)
npm run db:migrate   # Create migration files
```

## Project Structure

```
gyneva-bp/
├── api/                        # Vercel serverless functions
│   ├── _lib/                   # Shared utilities (not deployed as endpoints)
│   │   ├── auth.ts             # Google OAuth verification, session CRUD
│   │   ├── db.ts               # Prisma client singleton (Neon adapter)
│   │   ├── errors.ts           # Standardized error responses
│   │   └── middleware.ts       # CORS, rate limiting, auth guards
│   ├── auth/
│   │   ├── google.ts           # POST   Login with Google credential
│   │   ├── me.ts               # GET    Current user from session
│   │   └── logout.ts           # POST   Destroy session
│   ├── plans/
│   │   ├── index.ts            # GET    List plans / POST Create plan
│   │   ├── [id].ts             # GET    Read / PUT Update / DELETE Soft-delete
│   │   └── [id]/versions.ts    # GET    Version history
│   ├── scenarios/
│   │   ├── index.ts            # GET    List / POST Create scenario
│   │   └── [id].ts             # GET    Read / PUT Update / DELETE Remove
│   ├── import/
│   │   └── excel.ts            # POST   Parse uploaded Excel file
│   ├── admin/
│   │   └── users.ts            # GET    List / POST Add / DELETE Remove emails
│   └── health.ts               # GET    Health check
│
├── lib/                        # Shared code (front + back)
│   ├── types.ts                # TypeScript interfaces
│   ├── constants.ts            # Default data, Excel mappings, simulator defaults
│   └── compute.ts              # Financial engine (scenarios, derived metrics, simulator)
│
├── prisma/
│   ├── schema.prisma           # Database schema (6 models)
│   └── seed.ts                 # Seed script
│
├── public/
│   └── index.html              # Single-page application (all sections embedded)
│
├── tests/                      # Test directory (vitest)
├── package.json
├── tsconfig.json
└── vercel.json                 # Build + deployment config
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `POSTGRES_PRISMA_URL` | Yes | Pooled Postgres connection string |
| `POSTGRES_URL_NON_POOLING` | Yes | Direct connection (used by Prisma migrations) |
| `GOOGLE_CLIENT_ID` | Yes | Google OAuth 2.0 Client ID |
| `SESSION_SECRET` | Yes | Random string for future session signing |
| `ALLOWED_ORIGIN` | Yes | Production URL for CORS (`https://gyneva-bp-https.vercel.app`) |
| `NODE_ENV` | Auto | Set by Vercel; controls Secure/SameSite cookie flags |

Copy `.env.example` to `.env.local` and fill in your values.

## Database

### Schema Overview

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

**User** — Authenticated users (`ADMIN` | `EDITOR` | `VIEWER`)

**Session** — Server-side sessions with 24h TTL, linked to User (cascade delete)

**AllowedEmail** — Email whitelist; checked during login before user creation

**BusinessPlan** — 36-month financial model stored as JSONB + queryable scalar constants. Supports soft-delete (`isActive`)

**BusinessPlanVersion** — Auto-created snapshots before each plan update. Stores full data + constants at that point in time

**SimulatorScenario** — Saved simulator parameter sets (13 parameters). Can be shared between users and optionally linked to a plan

### Seeded Data

The seed script (`npm run db:seed`) creates:
- 2 allowed emails
- 1 ADMIN user, 1 EDITOR user
- 1 default business plan with the GYNEVA baseline 36-month model

## API Reference

All endpoints are prefixed with `/api`. Responses use JSON. Errors follow the format:

```json
{ "error": "Human-readable message", "code": "ERROR_CODE", "details": {} }
```

### Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/auth/google` | No | Exchange Google JWT for session |
| `GET` | `/api/auth/me` | Yes | Get current user |
| `POST` | `/api/auth/logout` | Yes | Destroy session |

**POST /api/auth/google**

```json
// Request
{ "credential": "<Google JWT>" }

// Response 200
{ "user": { "id": "...", "email": "...", "name": "...", "picture": "...", "role": "EDITOR" } }

// Response 403
{ "error": "Access denied: user@example.com is not authorized", "code": "EMAIL_NOT_ALLOWED" }
```

### Business Plans

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/plans` | Yes | List user's active plans |
| `POST` | `/api/plans` | Yes | Create plan (defaults or custom data) |
| `GET` | `/api/plans/:id` | Yes | Get plan with full 36-month data |
| `PUT` | `/api/plans/:id` | Yes | Update plan (auto-snapshots before overwrite) |
| `DELETE` | `/api/plans/:id` | Yes | Soft-delete plan |
| `GET` | `/api/plans/:id/versions` | Yes | List version history |

**POST /api/plans**

```json
// Request (minimal — uses defaults)
{ "name": "My Plan" }

// Request (with custom data)
{
  "name": "Custom Plan",
  "data": {
    "ca": [0, 0, 0, ...],           // 36 elements
    "caAssoc": [0, 0, 0, ...],      // 36 elements
    // ... all 17 arrays with 36 elements each
  },
  "consultDay": 16,
  "fee": 225,
  "daysYear": 215,
  "revSpec": 923432,
  "capex": 523000
}
```

**PUT /api/plans/:id** — When `data` is included, the current state is saved as a `BusinessPlanVersion` before the update is applied.

### Simulator Scenarios

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/scenarios` | Yes | List own + shared scenarios |
| `POST` | `/api/scenarios` | Yes | Save a simulator scenario |
| `GET` | `/api/scenarios/:id` | Yes | Get scenario parameters |
| `PUT` | `/api/scenarios/:id` | Yes | Update scenario |
| `DELETE` | `/api/scenarios/:id` | Yes | Delete scenario |

**POST /api/scenarios**

```json
{
  "name": "Optimistic",
  "params": {
    "consult": 20,    // 8–24
    "fee": 250,       // 120–350 CHF
    "days": 220,      // 180–250
    "assoc": 2,       // 1–4
    "indep": 4,       // 0–6
    "interne": 2,     // 0–4
    "start": 3,       // 1–12
    "occup": 70,      // 30–100 %
    "cashPct": 20,    // 0–30 %
    "delay": 1,       // 0, 1, or 3
    "factoring": true,
    "extra": 150000,  // 0–400000 CHF
    "rc": 60000       // 0–120000 CHF
  },
  "businessPlanId": "clu...",
  "isShared": false
}
```

### Excel Import

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/import/excel` | Yes | Parse `.xlsx` and return structured data |

Expects a base64-encoded Excel file with a sheet named **"Backend"**. The parser extracts data from specific rows mapped in `lib/constants.ts` (`EXCEL_ROW_MAP`, `EXCEL_SCALAR_MAP`).

```json
// Request
{ "file": "<base64 xlsx>", "filename": "model.xlsx" }

// Response 200
{ "data": { "ca": [...], "result": [...], ... }, "filename": "model.xlsx", "message": "Excel parsed successfully" }
```

Size limit: 10 MB.

### Admin

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/admin/users` | ADMIN | List allowed emails + registered users |
| `POST` | `/api/admin/users` | ADMIN | Add email to whitelist |
| `DELETE` | `/api/admin/users?email=...` | ADMIN | Remove email from whitelist |

### Health

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/health` | No | Returns `{ ok: true, ts: <timestamp> }` |

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 204 | Preflight OK |
| 400 | Validation error (`BAD_REQUEST`) |
| 401 | No session (`UNAUTHORIZED`) |
| 403 | Forbidden / Email not allowed (`FORBIDDEN`, `EMAIL_NOT_ALLOWED`) |
| 404 | Resource not found (`NOT_FOUND`) |
| 405 | Wrong HTTP method (`METHOD_NOT_ALLOWED`) |
| 429 | Rate limit exceeded (60 req/min per IP) |
| 500 | Server error (`INTERNAL_ERROR`) |

## Authentication

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

### Security

- **Server-side JWT verification** via `google-auth-library` (no client-side decode)
- **HttpOnly cookies**: session token not accessible to JavaScript
- **Secure flag**: enabled in production (HTTPS only)
- **SameSite=Strict**: in production (prevents CSRF)
- **Email whitelist**: only pre-approved emails can log in
- **Role-based access**: `ADMIN`, `EDITOR`, `VIEWER`
- **Parameterized queries**: all DB access through Prisma (no raw SQL)
- **Input validation**: Zod schemas on all API inputs
- **Rate limiting**: 60 requests/minute per IP (in-memory)
- **CORS**: restricted to configured origin

## Business Logic

### Financial Model

The application models a 36-month financial projection for a medical clinic with four revenue sources:

| Source | Description | Revenue Share |
|--------|-------------|--------------|
| Associes | Partner doctors | 40% of spec revenue |
| Independants | Independent doctors | 40% of spec revenue |
| Internes | Salaried doctors | 100% of spec revenue |
| Sages-femmes | Midwives | Fixed CHF 13,333/month |

### Cashflow Scenarios

Three treasury scenarios are computed based on how LAMal (Swiss mandatory health insurance) payments are received:

| Scenario | Description | Working Capital Impact |
|----------|-------------|----------------------|
| **Factoring** | Caisse des Medecins pays immediately (1.5% fee) | Lowest BFR |
| **1-month delay** | LAMal pays after 1 month | Moderate BFR |
| **3-month delay** | LAMal pays after 3 months | Highest BFR |

In all scenarios, cash patients (OI/ONU, ~15% of revenue) pay immediately.

### Simulator

The simulator (`lib/compute.ts:runSimulation`) accepts 13 parameters and produces a full 36-month projection with ramp-up modeling:

- **Year 1**: Gradual occupation from month `start`, reaching target `occup%` over 8 months
- **Year 2**: Occupation increases to `occup + 60% * (1 - occup)`
- **Year 3**: Full capacity (100%)

Costs scale linearly with team size relative to a 7-doctor baseline.

### Key Constants

```
Consultations/day:  16          Working days/year:  215
Fee/consultation:   CHF 225     Revenue/specialist: CHF 923,432/year
Cash patients:      15%         Factoring cost:     1.5%
CAPEX:              CHF 523,000
```

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
