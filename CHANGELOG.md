# Changelog

All notable changes to the GYNEVA Business Plan application are documented here.

## [0.15.0] - 2026-02-22

### Added
- **Professional PDF export**: 9-page branded report generated client-side via jsPDF 2.5.2 (replaces `window.print()`)
- **Cover page**: dark blue background (#0f2b46), green accent stripes, logo placeholder, plan name, date, author, confidential notice
- **7 section pages**: Overview, Revenue, Tresorerie, Equipe, Risques, Profit, Optimisations — each with section title, verdict banner (color-coded), 4 KPI cards, and Chart.js charts rendered as PNG via `toBase64Image()`
- **Risk gauge rendering**: circular score indicator (0-100) with color-coded border and descriptive text
- **Paginated footer**: plan name, date, page number on every content page
- **Auto-download**: filename format `GynEva_[PlanName]_YYYY-MM-DD.pdf`

### Changed
- `exportPDF()` now shows all sections temporarily (400ms) to allow Chart.js to render hidden tab charts before capture
- Active section restored after PDF generation completes
- jsPDF 2.5.2 CDN added to script imports

## [0.14.0] - 2026-02-21

### Added
- **Dynamic verdict**: composite score (0-12) from growth, diversification, ramp-up health, CA Y3 absolute — green (>=10), orange (>=6), red (<6) with contextual messages adapting to year selection
- **Year selector**: period buttons (Tous/Y1/Y2/Y3) to focus revenue analysis on a specific year with chart bar highlighting (dimmed bars for non-selected period)
- **4 enriched KPIs**: potentiel/specialiste (CHF/an), CA periode (year+profile aware), croissance (% vs previous year, color-coded), diversification (active sources count with threshold coloring)
- **Year highlight plugin** (`revYearPlugin`): translucent band + label on bar chart for selected year
- **Per-year detail cards**: quarterly breakdown (T1-T4) with average/month when specific year selected, Y1/Y2/Y3 view in Tous mode
- **Combined controls bar**: year selector + profile filter buttons in unified `.rev-controls` row

### Changed
- Revenue chart managed by `updateRevenue()` master function (calls `updateRevenueChart()` + `updateRevDetail()` + `updateRevVerdict()`)
- `updateUI()` no longer updates kCaY3b/kRevSpec/kCaY1/kCaY2 (delegated to `updateRevDetail()`)
- Chart destroy loop excludes `revenue` key (lifecycle managed by `updateRevenue()`)
- `toggleRevProfile()` calls `updateRevenue()` instead of separate chart+detail calls
- KPI IDs renamed from kRevSpec/kCaY1/kCaY2/kCaY3b to revKpiSpec/revKpiCa/revKpiGrowth/revKpiDiversif

## [0.13.0] - 2026-02-21

### Added
- **Dynamic verdict**: composite health score (0-12) from margin, BFR, growth, payback — green (>=9), orange (>=5), red (<5) with contextual messages
- **4 persistent top-level KPIs**: CA total 3 ans, resultat total 3 ans, BFR minimum, treso finale M36 — always visible regardless of year tab, with delta badges vs base
- **Comparison panel**: 6-metric ecart vs base (CA total, resultat, BFR, treso M36, CA Y1, CA Y3) — auto-shown when parameters differ from BASE, hidden on reset
- **Phase labels in summary**: Demarrage (Y1, orange), Croissance (Y2, yellow), Croisiere (Y3, green) badges in the 3-year summary cards

### Changed
- `SIM` global object now stores `bfrMin` and `tresoFinal` for reuse across `updateSimVerdict()`, `updateSimTopKpis()`, `updateSimCompare()`
- `runSim()` calls 3 new functions (`updateSimVerdict`, `updateSimTopKpis`, `updateSimCompare`) before `updateSimYearDetail` and `updateSimCharts`
- Verdict div has `id="simVerdict"` and `id="simVerdictText"` for dynamic updates

## [0.12.0] - 2026-02-21

### Added
- **6 enriched KPIs**: investissement total, CA Y3 (+growth% vs Y1), resultat net Y3 (color-coded by margin), marge nette Y3 (%), payback period (color-coded by duration), BFR minimum (color-coded by severity)
- **Year timeline cards**: 3 cards (Y1/Y2/Y3) showing CA, resultat net, marge nette, ETP with phase labels (Demarrage/Croissance/Croisiere) and gradient top borders
- **Section summary grid**: 4 cards (Tresorerie, Equipe, Risques, Profit) with live values, color-coded tags, and risk score read from DOM
- **Dynamic verdict**: composite multi-factor score (0-12) from margin, payback, BFR, ROI — green (>=10), orange (>=6), red (<6)
- **Enriched chart**: grouped bar (CA + Resultat) with cumulative cashflow line overlay (M12/M24/M36 data points)

### Changed
- Overview chart managed by `updateOverview()` instead of inline construction in `updateCharts()`
- `updateUI()` no longer updates kCapex/kCaY3/kResY3/kMargin/kCaGrowth/kPayback/vTresoY3 (delegated to `updateOverview()`)
- Chart destroy loop excludes `overview` key (lifecycle managed by `updateOverview()`)
- `updateOverview()` called last in `updateCharts()` chain (after `updateRisks()`/`updateProfit()`) to read composite risk score from DOM

## [0.11.0] - 2026-02-21

### Added
- **Year selector**: period buttons (Tous/Y1/Y2/Y3) to focus cashflow analysis on a specific year
- **4 dynamic KPIs**: tresorerie finale (end of period), BFR minimum (color-coded by severity), mois critique (first negative month in LAMal 3m scenario), ratio entrees/sorties (inflows vs outflows)
- **Dynamic verdict**: adapts to BFR severity — maitrisee (>=-50k, green), attention (-50k to -150k, orange), risque eleve (<-150k, red)
- **Dynamic scenario cards**: 4 cards (LAMal 3m, cash+LAMal 3m, cash+LAMal 1m, Factoring) with per-period BFR, critical month, first negative month, risk tags (eleve/modere/securise), worst/best border highlighting
- **Year highlight plugin** (`cfYearPlugin`): translucent band + label on line chart for selected year
- **Monthly waterfall chart** (`cCashWaterfall`): bar chart showing net cashflow per month (green positive, red negative) with year highlighting via opacity

### Changed
- Cashflow chart managed by `updateCashflow()` instead of inline construction in `updateCharts()`
- `updateUI()` no longer updates vCashMin/vCashOpt/scWorst/scCash3m/scCash1m/scFact (delegated to `updateCashflow()`)
- Chart destroy loop excludes `cashflow` and `cashWaterfall` keys (lifecycle managed by `updateCashflow()`)
- OVERLAY support preserved on scenario comparison line chart

## [0.10.0] - 2026-02-21

### Added
- **Year selector**: period buttons (Tous/Y1/Y2/Y3) to focus team view on a specific year with chart bar highlighting (dimmed bars for non-selected period)
- **4 dynamic KPIs**: ETP total (end of period), CA/ETP productivity (average FTE over period), admin/praticiens ratio (overhead), croissance ETP (growth percentage)
- **4 profile cards**: Associes, Independants, Internes, Personnel admin — each showing start month, FTE Y1/Y2/Y3, CA contribution per period, proportional bar
- **Productivity line chart** (`cTeamProd`): CA per ETP over 36 months with raw monthly line (dashed) and 3-month rolling average (solid filled)
- **Productivity toggle**: show/hide the CA/ETP chart
- **Dynamic verdict**: adapts to selected year — Demarrage (Y1, orange), Croissance (Y2, green), Croisiere (Y3, green), or global summary (Tous)

### Changed
- Team chart managed by `updateTeam()` instead of inline construction in `updateCharts()`
- `updateUI()` no longer updates kFte6/kFte12/kFte24/kFte36 (delegated to `updateTeam()`)
- Chart destroy loop excludes `team` and `teamProd` keys (lifecycle managed by `updateTeam()`)

## [0.9.0] - 2026-02-21

### Added
- **Interactive profit controls**: sliders for number of associates (1-4) and annual missing charges (0-400k CHF)
- **4 dynamic KPIs**: ROI cumule 3 ans (with color-coded thresholds), payback period in months, resultat/associe Y3 after charges, investissement/associe (CAPEX share)
- **Dynamic verdict**: adapts to ROI level — excellent (>=5x), attractif (>=2x), modere (>=1x), insuffisant (<1x)
- **Medecin vs non-medecin breakdown**: two detail cards showing retrocession propre CA (uses dynamic retrocession rate) + part resultat for medecin, resultat seul for non-medecin, with 3-year cumulative totals
- **Enriched bar chart**: 3 datasets (resultat brut/associe, apres charges manquantes, revenu medecin total including retrocession)
- **Cumulative profit line chart**: 36-month profit cumule per associate with CAPEX/associate investment threshold line (dashed red)

### Changed
- All profit calculations delegated to `updateProfit()` function (removed hardcoded division by 2 and 200k charges)
- `updateUI()` no longer directly updates profit elements (delegated to `updateProfit()`)
- Chart destroy loop excludes `profit` and `profitCumul` keys (lifecycle managed by `updateProfit()`)

## [0.8.0] - 2026-02-21

### Added
- **Interactive stress test**: 4 sliders (consultations/jour, honoraires, occupation Y1, delai montee) with real-time recalculation via `computeSimulation()`
- **3-scenario comparison**: Pessimiste (-25%), Base, Optimiste (+25%) cards with CA Y3, Resultat Y3, BFR min, Treso M36
- **Sensitivity analysis**: horizontal impact bars per variable showing relative effect on Resultat Y3, plus Chart.js bar chart
- **Interactive risk matrix**: sortable columns (score/probabilite/impact), clickable badges cycling 1-5 levels, color-coded risk scores, total exposure indicator
- **Composite risk gauge**: SVG circular gauge (0-100) combining stress test sensitivity and risk matrix exposure, with dynamic verdict (Faible/Modere/Eleve)
- **Charges donut chart**: Chart.js doughnut by criticite (critique/important/moyen) with total row in table
- **4 dynamic KPIs**: CA Y3, Resultat Y3, BFR min, Treso finale — color-coded with delta vs plan data

### Changed
- Replaced 3 static tables (risk matrix, charges, stress test) with fully interactive components
- `updateRisks()` manages risk chart and charges chart lifecycle independently
- `updateUI()` syncs risk sliders from plan data (`consultDay`, `fee`) instead of static `stConsult`/`stFee` text
- Chart destroy loop excludes `riskStress` and `charges` keys

## [0.7.0] - 2026-02-21

### Added
- **Interactive optimization controls**: inline factoring toggle, cash OI/ONU slider (0-30%), and LAMal delay selector directly in the Optimizations tab
- **4 dynamic KPIs**: worst-case BFR, current-config BFR (color-coded red/orange/green), BFR savings amount + percentage, factoring annual cost + percentage of net result
- **Dynamic verdict**: green/orange/red banner adapts to current configuration risk level (optimal, moderate, elevated)
- **Smart recommendation**: calculates factoring ROI (cost vs. BFR reduction) or warns about BFR risk when factoring is off
- **4-scenario comparison grid**: cards for "100% LAMal 3m", "Cash X% + LAMal 3m", "Cash X% + LAMal 1m", "Cash X% + Factoring" with BFR min, critical month, risk tags, and active config highlight
- **`computeOptScenario()`**: flexible cashflow scenario calculator supporting any cash%, delay, and factoring combination
- **Enhanced chart**: current-config line drawn thick/filled, other scenarios thin/dashed for visual emphasis

### Changed
- Optimization chart managed by `updateOptimize()` instead of inline construction in `updateCharts()`
- Chart destroy loop skips 'optimize' key (lifecycle managed independently)
- Removed static factoring/OI-ONU info cards in favor of interactive controls

## [0.6.0] - 2026-02-21

### Added
- **Adjustable retrocession rate**: new simulator slider (20-60%) to configure the revenue sharing split between practitioners and GynEva (previously hardcoded at 40%)
- `retro` parameter added to `SimulatorParams` type, `SIMULATOR_DEFAULTS`, and Zod validation schema (backward-compatible with existing scenarios defaulting to 40%)

### Changed
- `computeSimulation()` and `runSimulation()` use `params.retro / 100` instead of hardcoded `0.4`
- Revenue detail cards dynamically display the current retrocession rate
- Revenue model description text updates in real-time when the slider changes
- Assumptions pill shows the dynamic split ratio (e.g., "60/40" or "70/30")

## [0.5.0] - 2026-02-21

### Added
- **Revenue profile filters**: pill buttons (Tous, Associes, Independants, Internes, Sage-femme) to toggle revenue sources on the chart
- **Single-profile view**: selecting one profile unstacks bars for clear ramp-up visualization
- **Profile detail cards**: per-profile breakdown with CA Y1/Y2/Y3, percentage of total, ramp-up timeline ("Debut mois X → capacite max mois Y"), and GynEva revenue share
- **Dynamic KPIs**: CA Year 1/2/3 KPI cards update to reflect only selected profiles

### Changed
- Revenue chart construction extracted to `updateRevenueChart()` for reuse by profile filter toggle
- `updateCharts()` delegates revenue chart to `updateRevenueChart()` and `updateRevDetail()`

## [0.4.0] - 2026-02-21

### Added
- **Simulator year tabs**: browse simulator results per year (Y1/Y2/Y3) instead of Y3-only focus
- **Year overview timeline**: always-visible row showing CA, Result, and delta for each year
- **Per-year KPIs**: 6 detailed indicators (CA, Result, Result ajuste, /Associe, Treso min, Treso fin) scoped to the selected year
- **Contextual verdict**: Y1 "Demarrage", Y2 "Croissance", Y3 "Croisiere" with tailored insights
- **Sensitivity tags**: colored badges showing which simulator parameters impact the selected year
- **Structured summary**: 3-column grid (Y1/Y2/Y3) with bullet-point highlights replacing the old single Y3 paragraph
- **Chart year highlighting**: bar chart dims non-selected year bars; cashflow line chart draws a translucent highlight band

### Changed
- Extracted `simDelta()` function to module scope for reuse by year-detail rendering
- `runSim()` now populates the year overview timeline and calls `updateSimYearDetail()`
- `updateSimCharts()` applies dynamic bar opacity and uses a `yearHighlightPlugin` for the cashflow chart

## [0.3.0] - 2026-02-21

### Added
- **Version comparison modal**: "Comparer" button in topbar opens a full-screen side-by-side comparison
  - Two version selectors (including "Current data")
  - 10-metric comparison grid with deltas and percentage changes
  - 2 comparison charts (grouped bar overview + cashflow line overlay)
  - Print/PDF export with dedicated `@media print` CSS
- **Multi-plan switcher**: dropdown in topbar to create, rename, delete, and switch between named business plans
- **Scenario overlay on dashboard**: overlay a saved simulator scenario on overview, revenue, and cashflow charts with semi-transparent/dashed visual treatment

### Changed
- `grantAccess()` now loads the plan list and refreshes overlay scenario options
- `updateCharts()` conditionally adds overlay datasets when a scenario overlay is active
- `logout()` resets plan list, overlay state, and scenario selection

## [0.2.0] - 2026-02-20

### Added
- **Pure simulation engine**: extracted `computeSimulation(params)` as a reusable pure function from `runSim()`
- **Import diff summary**: grid showing changed metrics after Excel import (old vs. new values with percentage variation)
- **Math.round() on all Excel cell values** to eliminate floating-point rounding drift
- **Parser robustness**: sheet fallback for single-sheet workbooks, available sheets listed in error messages, critical row validation, zero-row detection
- **Version history**: auto-snapshot before each plan update, slide-in version panel, one-click restore with diff display
- **5 data discrepancy fixes**: corrected caAssoc, caIndep, caInterne, caSage, and lab default arrays to match the Excel model

## [0.1.0] - 2026-02-19

### Added
- Initial release of the GYNEVA Business Plan application
- 8-section SPA dashboard (Overview, Simulator, Revenue, Cashflow, Team, Risks, Profit, Optimizations)
- Google OAuth 2.0 authentication with email whitelist
- 36-month financial projection model (17 arrays + 5 scalar constants)
- Interactive 13-parameter simulator with save/load scenarios
- Excel drag-and-drop import with "Backend" sheet parsing
- Chart.js visualizations for all financial metrics
- REST API with Vercel Serverless Functions
- PostgreSQL database via Neon with Prisma ORM
- Role-based access control (ADMIN, EDITOR, VIEWER)
- Admin panel for email whitelist management
