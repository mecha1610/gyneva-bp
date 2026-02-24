# Inventaire des DOM IDs — Mapping vers les composants Next.js

> Phase 0.1 — Généré le 2026-02-24
> Source : `public/index.html` (~5600 lignes)
> Total : **186 appels** `getElementById`, **~150 IDs uniques** définis en HTML

---

## Conventions

| Symbole | Signification |
|---------|---------------|
| `'use client'` | Le composant doit obligatoirement être un Client Component |
| RSC | Peut rester un React Server Component (lecture seule) |
| Zustand | L'ID est remplacé par de la réactivité via le store |

---

## 1. Auth & Pages globales

| ID actuel | Futur composant / fichier | Type | Notes |
|-----------|--------------------------|------|-------|
| `login-screen` | `app/(auth)/login/page.tsx` | RSC shell + `'use client'` inner | Wrapper de page |
| `invite-screen` | `app/(auth)/invite/[token]/page.tsx` | RSC shell | Vérification token server-side |
| `app-content` | `app/(app)/layout.tsx` | RSC | Layout protégé par middleware |
| `auth-error` | `<AuthError>` dans login/page | `'use client'` | État local d'erreur |
| `google-btn` | `<GoogleButton>` | `'use client'` | `next/script` afterInteractive |
| `loginEmail` `loginPassword` | inputs dans `<LoginForm>` | `'use client'` | Contrôlés par useState |
| `inviteEmailDisplay` `inviteRoleTag` | `<InviteInfo>` | RSC possible | Données passées en props |
| `inviteName` `invitePassword` `invitePasswordConfirm` | `<InviteForm>` | `'use client'` | Formulaire contrôlé |
| `inviteEmail` `inviteRole` | selects dans `<InviteForm>` | `'use client'` | |
| `invite-error` | `<AuthError>` réutilisé | `'use client'` | |
| `inviteLinkBox` `inviteLinkText` | `<InviteLinkBox>` | `'use client'` | Affiché après génération |
| `inactivity-warn` | `<InactivityWarning>` | `'use client'` | Créé dynamiquement, global |

---

## 2. Layout global

| ID actuel | Futur composant | Type | Notes |
|-----------|----------------|------|-------|
| `sidebar` | `<Sidebar>` | `'use client'` | État collapsed dans useAppStore |
| `toggleBtn` | bouton dans `<Sidebar>` | `'use client'` | |
| `hamburgerBtn` | bouton dans `<Topbar>` | `'use client'` | Mobile nav |
| `mobileOverlay` | `<MobileOverlay>` dans `<Sidebar>` | `'use client'` | |
| `navAdmin` | item conditionnel dans `<Sidebar>` | `'use client'` | Visible si `user.role === 'ADMIN'` |
| `badge-overview` `badge-revenue` `badge-cashflow` `badge-team` `badge-risks` `badge-profit` `badge-optimize` | `<NavBadge>` dans chaque item `<Sidebar>` | `'use client'` | Couleur calculée depuis useSimStore |
| `pageTitle` | `<PageTitle>` dans `<Topbar>` | `'use client'` | Synchronisé avec la route active |
| `planSwitcher` `planDropdown` `planNameDisplay` `planListItems` | `<PlanSwitcher>` dans `<Topbar>` | `'use client'` | Liste depuis useAppStore |
| `statusPill` `statusDot` `statusLabel` | `<StatusPill>` dans `<Topbar>` | `'use client'` | Réactif à l'import de fichier |
| `langToggle` | `<LangToggle>` dans `<Topbar>` | `'use client'` | `useAppStore.lang` |
| `themeToggle` | `<ThemeToggle>` dans `<Topbar>` | `'use client'` | `useAppStore.theme` |
| `actionsMenu` `actionsToggleBtn` | `<ActionsMenu>` dans `<Topbar>` | `'use client'` | Dropdown avec 5 actions |
| `pushToggle` | item dans `<ActionsMenu>` | `'use client'` | Conditionnel si PushManager dispo |
| `fileInput` | `<input>` caché dans `<ActionsMenu>` | `'use client'` | Déclenché par click programmatique |
| `user-badge` | `<UserBadge>` dans `<Topbar>` | `'use client'` | Avatar + logout |

---

## 3. Exec Dashboard (bandeau global)

| ID actuel | Futur composant | Type | Notes |
|-----------|----------------|------|-------|
| `execDashboard` | `<ExecDashboard>` | `'use client'` | Bandeau collapsible sous Topbar |
| `execBody` | div interne `<ExecDashboard>` | `'use client'` | Masqué si collapsed |
| `execToggle` | bouton dans `<ExecDashboard>` | `'use client'` | |
| `execScoreText` `execScoreLabel` | `<ExecGauge>` | `'use client'` | SVG animée via useSimStore |
| `execArc` | `<path>` SVG dans `<ExecGauge>` | `'use client'` | Calculé dynamiquement |
| `execKpis` | `<ExecKpiGrid>` | `'use client'` | 5 mini-KPIs |
| `execSpark` `cExecSpark` | `<ExecSparkline>` | `'use client'` | Canvas Chart.js |
| `overlayScenarioSelect` `overlayControl` `overlayDot` | `<OverlaySelector>` dans `<ExecDashboard>` | `'use client'` | Comparaison scénario overlay |

---

## 4. Import & Dropzone

| ID actuel | Futur composant | Type | Notes |
|-----------|----------------|------|-------|
| `dropzone` `dzText` | `<Dropzone>` | `'use client'` | Drag-and-drop Excel |
| `importSummary` `importDiffContent` | `<ImportDiffModal>` | `'use client'` | Modale post-import |

---

## 5. Onglet Overview

| ID actuel | Futur composant | Type | Notes |
|-----------|----------------|------|-------|
| `ovVerdict` `ovVerdictText` | `<OverviewVerdict>` | `'use client'` | Classe CSS dynamique |
| `ovYearTl` | `<OverviewYearTimeline>` | `'use client'` | Grille 3 colonnes Y1/Y2/Y3 |
| `ovSummaryGrid` | `<OverviewSummaryGrid>` | `'use client'` | 4 résumés icône+valeur |
| `ovBfr` `ovBfrSub` `ovCapex` `ovMargin` `ovMarginPct` `ovCaGrowth` `ovCaY3` `ovPayback` `ovResY3` | props dans `<OverviewKPIs>` | Zustand | Remplacés par lecture directe du store |
| `pillsAssumptions` | `<AssumptionPills>` | `'use client'` | Pills cliquables |
| `cOverview` | `<OverviewChart>` | `'use client'` | `react-chartjs-2` |

---

## 6. Onglet Simulateur

### Inputs (Sliders)

| ID actuel | Valeur par défaut | Futur composant |
|-----------|-------------------|----------------|
| `sConsult` / `sConsultVal` | 16 consult/j | `<VolumeSliders>` |
| `sFee` / `sFeeVal` | CHF 225 | `<VolumeSliders>` |
| `sDays` / `sDaysVal` | 215 j/an | `<VolumeSliders>` |
| `sAssoc` / `sAssocVal` | 2 associés | `<TeamSliders>` |
| `sIndep` / `sIndepVal` | 3 indépendants | `<TeamSliders>` |
| `sInterne` / `sInterneVal` | 2 internes | `<TeamSliders>` |
| `sRetro` / `sRetroVal` | 40% rétrocession | `<RetroSlider>` |
| `sDelay` | 0–6 mois délai | `<DelaySelect>` |
| `sCash` / `sCashVal` | 15% cash OI | `<CashSlider>` |
| `sFactToggle` | factoring on/off | `<FactoringToggle>` |
| `sExtra` / `sExtraVal` | CHF 200k charges | `<ChargesSliders>` |
| `sRC` / `sRCVal` | CHF 60k RC pro | `<ChargesSliders>` |
| `sStart` / `sStartVal` | mois 4 | `<StartSliders>` |
| `sOccup` / `sOccupVal` | 60% occup. Y1 | `<StartSliders>` |

> Tous ces composants → `'use client'`, mutation via `useSimStore.setParam(key, val)`.

### Résultats Simulateur

| ID actuel | Futur composant | Notes |
|-----------|----------------|-------|
| `simTopKpis` `simTopCa3` `simTopRes3` `simTopTreso` `simTopBfr` (+ `Sub`) | `<SimKPIs>` | `'use client'`, lecture useSimStore |
| `simVerdict` `simVerdictText` | `<SimVerdict>` | `'use client'` |
| `simYrCard1` `simYrCard2` `simYrCard3` | `<SimYearCard year={n}>` × 3 | `'use client'` |
| `simOvCaY1..3` `simOvResY1..3` `simOvDeltaY1..3` | props de `<SimYearCard>` | Zustand |
| `simSummary` | `<SimSummary>` | `'use client'` |
| `simSensitivity` | `<SimSensitivity>` | `'use client'` |
| `simCompare` `simCompareGrid` | `<SimCompareTable>` | `'use client'` |
| `simYearDetail` `simYearKpis` `simYearVerdict` | `<SimYearDetail>` | `'use client'` |
| `cSim1` `cSim2` | `<SimCharts>` | `'use client'`, react-chartjs-2 |
| `scenarioList` | `<ScenarioList>` | `'use client'` |
| `ts-track-simulator` `ts-thumb-simulator` `ts-tip-simulator` | `<TimeScrubber section="simulator">` | `'use client'` |

---

## 7. Onglet Revenue

| ID actuel | Futur composant | Type |
|-----------|----------------|------|
| `revVerdict` `revVerdictText` | `<RevenueVerdict>` | `'use client'` |
| `revKpiSpec` `revKpiCa` `revKpiGrowth` `revKpiDiversif` (+ `Sub`) | `<RevenueKPIs>` | `'use client'` |
| `revDetailGrid` | `<RevenueDetailGrid>` | `'use client'` |
| `revRetroDoc` `revRetroDoc2` `revRetroGyneva` `revRetroGyneva2` | éléments dans `<RevenueDetailGrid>` | Zustand |
| `revProfileBar` | `<RevProfileFilter>` | `'use client'` |
| `cRevenue` | `<RevenueChart>` | `'use client'` |
| `ts-track-revenue` `ts-thumb-revenue` `ts-tip-revenue` | `<TimeScrubber section="revenue">` | `'use client'` |

---

## 8. Onglet Cashflow

| ID actuel | Futur composant | Type |
|-----------|----------------|------|
| `cfVerdict` `cfVerdictText` | `<CashflowVerdict>` | `'use client'` |
| `cfTresoFin` `cfBfrMin` `cfCritMonth` `cfRatio` (+ `Sub`) | `<CashflowKPIs>` | `'use client'` |
| `cfScenarioGrid` | `<CashflowScenarioGrid>` | `'use client'` |
| `cCashflow` `cCashWaterfall` | `<CashflowCharts>` | `'use client'` |
| `ts-track-cashflow` `ts-thumb-cashflow` `ts-tip-cashflow` | `<TimeScrubber section="cashflow">` | `'use client'` |

---

## 9. Onglet Team

| ID actuel | Futur composant | Type |
|-----------|----------------|------|
| `teamVerdict` `teamVerdictText` | `<TeamVerdict>` | `'use client'` |
| `tEtp` `tCaEtp` `tGrowth` `tRatio` (+ `Sub`) | `<TeamKPIs>` | `'use client'` |
| `teamProfiles` | `<TeamProfiles>` | `'use client'` |
| `teamProdCard` `teamProdToggle` | `<TeamProductivity>` | `'use client'` |
| `cTeam` `cTeamProd` | `<TeamCharts>` | `'use client'` |
| `ts-track-team` `ts-thumb-team` `ts-tip-team` | `<TimeScrubber section="team">` | `'use client'` |

---

## 10. Onglet Risks

| ID actuel | Futur composant | Type |
|-----------|----------------|------|
| `riskGauge` `riskScore` `riskSub` `riskLabel` `riskArc` | `<RiskGauge>` | `'use client'` |
| `riskScenarioGrid` | `<RiskScenarioGrid>` | `'use client'` |
| `riskSensitivity` | `<RiskSensitivity>` | `'use client'` |
| `riskMatrixContainer` | `<RiskMatrix>` | `'use client'` |
| `riskExposureVal` | `<RiskExposure>` | `'use client'` |
| `cRiskStress` | `<RiskStressChart>` | `'use client'` |
| `rBfrMin` `rCaY3` `rCaY3Delta` `rConsult` `rFee` `rOccup` `rResY3` `rResY3Delta` `rStart` `rTresoFinal` (+ `Val`) | éléments dans `<RiskControls>` et `<RiskScenarioGrid>` | Zustand |

---

## 11. Onglet Profit

| ID actuel | Futur composant | Type |
|-----------|----------------|------|
| `profitVerdict` `profitVerdictText` | `<ProfitVerdict>` | `'use client'` |
| `pAssoc` `pCharges` `pInvestAssoc` `pPayback` `pPerAssocY3` `pRoi` (+ `Val/Sub`) | `<ProfitKPIs>` | `'use client'` |
| `pPerY1` `pPerY2` `pPerY3` `pResY1` `pResY2` `pResY3` `pAdjY1` `pAdjY2` `pAdjY3` | `<ProfitTable>` | `'use client'` |
| `profitBreakdown` | `<ProfitBreakdown>` | `'use client'` |
| `chargesBody` `chargesTotalLabel` | `<ChargesTable>` | `'use client'` |
| `cProfit` `cProfitCumul` `cCharges` | `<ProfitCharts>` | `'use client'` |

---

## 12. Onglet Optimize

| ID actuel | Futur composant | Type |
|-----------|----------------|------|
| `optVerdict` `optVerdictText` `optReco` `optRecoText` | `<OptimizeVerdict>` | `'use client'` |
| `optBfrCurrent` `optBfrCurrentSub` `optBfrSaved` `optBfrSavedPct` `optBfrWorst` | `<OptimizeBFR>` | `'use client'` |
| `optCash` `optCashVal` `optDelay` `optFact` `optFactCost` `optFactCostPct` | `<OptimizeLevers>` | `'use client'` |
| `optCompareGrid` | `<OptimizeScenarios>` | `'use client'` |
| `cOptimize` | `<OptimizeChart>` | `'use client'` |

---

## 13. Onglet Admin

| ID actuel | Futur composant | Type |
|-----------|----------------|------|
| `adminUsersTable` | `<AdminUsersTable>` | `'use client'` |
| `adminEmailList` | `<AdminEmailList>` | `'use client'` |
| `adminNewEmail` `inviteRole` | inputs dans `<AdminInviteForm>` | `'use client'` |
| `adminPending` | `<AdminPendingList>` | `'use client'` |
| `pushTitle` `pushBody` `pushResult` | `<AdminPushForm>` | `'use client'` |

---

## 14. Panels & Modales

| ID actuel | Futur composant | Type |
|-----------|----------------|------|
| `versionOverlay` `versionPanel` `versionList` | `<VersionPanel>` | `'use client'` |
| `compareModal` `compareContent` `compareLeft` `compareRight` | `<CompareModal>` | `'use client'` |
| `scenarioCompareModal` `scGridContainer` `scSelectA` `scSelectB` `scSelectC` `scVerdictContainer` | `<ScenarioCompareModal>` | `'use client'` |
| `cCompareCashflow` `cCompareOverview` | canvas dans `<CompareModal>` | `'use client'` |

---

## 15. Composant réutilisable : TimeScrubber

Instancié 4 fois — 1 composant unique paramétré :

```tsx
// components/TimeScrubber.tsx — 'use client'
<TimeScrubber section="simulator" />
<TimeScrubber section="revenue" />
<TimeScrubber section="cashflow" />
<TimeScrubber section="team" />
```

IDs remplacés par des `useRef` internes au composant (track, thumb, tooltip).

---

## Résumé par section

| Section | Composants à créer | IDs remplacés |
|---------|-------------------|--------------|
| Auth | 6 | 12 |
| Layout | 15 | 20 |
| ExecDashboard | 4 | 8 |
| Overview | 5 | 10 |
| Simulator | 18 | 45 |
| Revenue | 6 | 12 |
| Cashflow | 5 | 10 |
| Team | 5 | 10 |
| Risks | 6 | 14 |
| Profit | 5 | 12 |
| Optimize | 5 | 10 |
| Admin | 5 | 8 |
| Panels / Modales | 5 | 10 |
| **TOTAL** | **~90 composants** | **~150 IDs** |
