# Changelog

All notable changes to the GYNEVA Business Plan application are documented here.

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
