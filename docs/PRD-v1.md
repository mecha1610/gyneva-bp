# PRD — Fonctionnalites v0.15 a v0.17

## Contexte

L'application GYNEVA Business Plan dispose de 8 onglets interactifs (v0.14.0), un simulateur 13 parametres, un systeme de sauvegarde de scenarios, et un versioning automatique. L'export actuel se limite a `window.print()`. Il n'y a pas de vue executive synthetique ni de comparaison multi-scenarios cote a cote.

Les 3 fonctionnalites ci-dessous repondent aux besoins des fondateurs pour presenter le projet a des investisseurs/banques, prendre des decisions rapides, et evaluer des alternatives.

---

## F1 — Export PDF professionnel (v0.15.0)

### Probleme

Le `window.print()` actuel produit un PDF brut, sans mise en page, sans structure, et sans les charts (Chart.js ne rend pas en print natif). Les fondateurs ont besoin d'un document professionnel pour les banques et investisseurs.

### Objectif

Generer un rapport PDF multi-pages, structure et brandé, contenant tous les KPIs, charts (rendus en image), verdicts et hypotheses du business plan.

### Utilisateurs

- Fondateurs GynEva (presentation investisseurs, banques, partenaires)
- Editeurs (partage interne)

### Exigences fonctionnelles

| ID | Exigence | Priorite |
|----|----------|----------|
| F1.1 | Bouton "Exporter PDF" dans la topbar, remplace le `window.print()` actuel | Must |
| F1.2 | Page de garde : logo GynEva, titre du plan, date, nom de l'utilisateur | Must |
| F1.3 | Section Executive Summary (1 page) : verdict global, 6 KPIs overview, chart overview | Must |
| F1.4 | Section Revenue (1 page) : verdict, 4 KPIs, chart CA par source, cards profils | Must |
| F1.5 | Section Tresorerie (1 page) : verdict, 4 KPIs, chart scenarios, waterfall | Must |
| F1.6 | Section Equipe (1 page) : verdict, 4 KPIs, chart ETP, profils | Must |
| F1.7 | Section Risques (1 page) : jauge composite, matrice, stress test | Must |
| F1.8 | Section Profit (1 page) : verdict, 4 KPIs, chart ROI, breakdown med/non-med | Must |
| F1.9 | Section Optimisations (1 page) : verdict, KPIs, scenarios, recommandation | Should |
| F1.10 | Section Simulateur (1-2 pages) : parametres actuels, comparaison base, charts sim | Should |
| F1.11 | Footer sur chaque page : nom du plan, date, numero de page | Must |
| F1.12 | Charts rendus en PNG via `chart.toBase64Image()` puis inseres dans le PDF | Must |
| F1.13 | Couleurs des verdicts preservees (vert/orange/rouge) | Must |
| F1.14 | Format A4 portrait, marges 15mm | Must |
| F1.15 | Telechargement automatique : `GynEva_BusinessPlan_YYYY-MM-DD.pdf` | Must |

### Approche technique

- **Bibliotheque** : `jsPDF` (cote client, pas de serveur necessaire) + `jsPDF-AutoTable` pour les tableaux
- Les charts Chart.js sont convertis en images via `chart.toBase64Image()` (API native Chart.js 4.4)
- Le DOM est lu pour extraire les valeurs des KPIs, verdicts, et cards
- Un script `generatePDF()` orchestre la generation page par page
- Pas de dependance serveur additionnelle

### Hors perimetre

- Export Excel (deja geré par l'import/export XLSX existant)
- Export par section individuelle (v2)
- Personnalisation du template (v2)

---

## F2 — Tableau de bord executif (v0.16.0)

### Probleme

L'onglet Overview actuel est riche (6 KPIs, timeline, summary grid, chart, hypotheses) mais n'offre pas une vue "executive" ultra-synthetique. Un decideur veut voir en 10 secondes si le projet est viable, sans naviguer entre onglets.

### Objectif

Ajouter un panneau executif one-page en haut du dashboard, visible avant les onglets, avec les 10 metriques cles, un verdict global unifie, et un mini-chart sparkline.

### Utilisateurs

- Fondateurs (decision rapide)
- Investisseurs/banques (premiere impression)
- Viewers (lecture seule)

### Exigences fonctionnelles

| ID | Exigence | Priorite |
|----|----------|----------|
| F2.1 | Panneau executif toujours visible en haut, au-dessus des onglets de navigation | Must |
| F2.2 | Verdict global unifie : score composite (0-100) agrege depuis les 6 verdicts d'onglets (overview, revenue, cashflow, equipe, risques, profit) | Must |
| F2.3 | Jauge visuelle du score (arc SVG 0-100, vert/orange/rouge) | Must |
| F2.4 | 10 KPIs cles en grille compacte : investissement, CA Y3, resultat Y3, marge nette, payback, BFR min, treso M36, ETP Y3, ROI 3 ans, score risque | Must |
| F2.5 | Mini sparkline (36 mois) du cashflow cumule, integre dans le panneau (canvas 200x60px) | Must |
| F2.6 | Bouton collapse/expand pour masquer le panneau (etat persiste en localStorage) | Should |
| F2.7 | Badge de sante par section : pastille verte/orange/rouge a cote de chaque onglet dans la sidebar | Must |
| F2.8 | Clic sur un KPI executif navigue vers l'onglet correspondant | Should |
| F2.9 | Panneau reactif : s'adapte quand les donnees changent (import Excel, simulation) | Must |
| F2.10 | Print-friendly : inclus automatiquement dans l'export PDF (F1) | Should |

### Approche technique

- Nouveau `<div id="execDashboard">` insere entre la topbar et le contenu principal
- Fonction `updateExecDashboard()` appelee a la fin de `updateCharts()` (apres `updateOverview()`)
- Score global : moyenne ponderee des scores d'onglets (chaque onglet expose son score 0-12 normalise en 0-100)
- Sparkline : Chart.js mini instance (type:'line', pas d'axes, pas de legende)
- Badges sidebar : `updateExecDashboard()` met a jour les classes CSS des liens sidebar

### Hors perimetre

- Personnalisation des KPIs affiches (v2)
- Export du panneau seul (couvert par F1)

---

## F3 — Comparaison multi-scenarios (v0.17.0)

### Probleme

L'overlay actuel permet de superposer un scenario sauvegarde sur les charts du dashboard, mais :
- On ne peut comparer que 1 scenario a la fois
- Pas de vue dediee cote a cote
- Pas de tableau comparatif des metriques
- Difficile de choisir entre 3+ scenarios

### Objectif

Offrir une vue dediee de comparaison cote a cote de 2-3 scenarios sauvegardes, avec tableau de metriques, charts superposes, et verdict comparatif.

### Utilisateurs

- Fondateurs (choix strategique entre scenarios)
- Editeurs (analyse de sensibilite)

### Exigences fonctionnelles

| ID | Exigence | Priorite |
|----|----------|----------|
| F3.1 | Bouton "Comparer" dans la topbar ou la section Simulateur, ouvre un modal plein ecran | Must |
| F3.2 | Selection de 2-3 scenarios parmi les scenarios sauvegardes + "Donnees actuelles" + "Base" | Must |
| F3.3 | Tableau comparatif : 12 metriques cles en lignes, scenarios en colonnes, deltas et % de variation | Must |
| F3.4 | Metriques du tableau : CA Y1/Y2/Y3, Resultat Y1/Y2/Y3, BFR min, Treso M36, Marge Y3, Payback, ROI, ETP total | Must |
| F3.5 | Code couleur : vert si meilleur que base, rouge si pire, gras pour le meilleur scenario | Must |
| F3.6 | Chart CA compare : grouped bar (1 couleur par scenario) sur 36 mois | Must |
| F3.7 | Chart Tresorerie comparee : line chart multi-series (1 ligne par scenario) sur 36 mois | Must |
| F3.8 | Verdict comparatif : recommandation automatique du meilleur scenario avec justification (scoring) | Should |
| F3.9 | Export PDF de la comparaison (page dediee ajoutee au rapport F1) | Should |
| F3.10 | Impression : `@media print` optimise pour le modal (A4 paysage) | Should |
| F3.11 | Fermeture du modal restaure l'etat precedent sans effet de bord | Must |
| F3.12 | Recalcul en temps reel : `computeSimulation()` est appele pour chaque scenario selectionne | Must |

### Approche technique

- Modal HTML `<div id="compareModal">` en position fixed, z-index eleve
- Chaque scenario est recalcule via `computeSimulation(params)` (fonction pure, pas d'effets de bord)
- Les resultats sont stockes dans un tableau temporaire `compareResults[]`
- 2 Chart.js instances dediees dans le modal (`cCompareCA`, `cCompareTreso`)
- Tableau genere dynamiquement avec deltas colores
- Scoring : somme des rangs par metrique (rang 1 = meilleur), scenario avec le score le plus bas recommande

### Hors perimetre

- Comparaison de versions (snapshots) — v2
- Comparaison avec des benchmarks externes — v2
- Sauvegarde d'une "comparaison" comme entite — v2

---

## Ordre de livraison recommande

| Version | Feature | Justification |
|---------|---------|---------------|
| v0.15.0 | Export PDF | Prerequis pour les presentations investisseurs, pas de dependance |
| v0.16.0 | Tableau executif | Enrichit le dashboard, prerequis pour inclure le panneau dans le PDF |
| v0.17.0 | Comparaison multi-scenarios | Depend du simulateur et de F1 pour l'export |

## Metriques de succes

- **F1** : PDF genere en < 3 secondes, toutes les sections presentes, charts lisibles
- **F2** : Score global coherent avec les verdicts individuels, mise a jour < 100ms
- **F3** : Comparaison de 3 scenarios en < 1 seconde, metriques correctes vs calcul individuel
