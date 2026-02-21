# Changelog

All notable changes to the GYNEVA Business Plan application are documented here.

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
