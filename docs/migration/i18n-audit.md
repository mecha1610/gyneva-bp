# Audit i18n — Mapping T object → next-intl

> Phase 0.3 — Généré le 2026-02-24
> Source : objet `TRANSLATIONS` dans `public/index.html` (lignes ~1669–2210)

---

## Résumé

| Métrique | Valeur |
|----------|--------|
| Locales | 2 (`fr`, `en`) |
| Namespaces | **25** |
| Clés totales (par locale) | ~350 |
| Clés paramétrées `{param}` | ~85 |
| Clés avec HTML inline `<strong>` | ~30 |

---

## Installation recommandée

```bash
npm install next-intl
```

**Configuration** : `next.config.ts` + `src/i18n.ts` + `src/middleware.ts`

La compatibilité est immédiate : `next-intl` utilise nativement la syntaxe `{param}` (ICU Message Format). **Aucune réécriture des valeurs** n'est nécessaire pour les clés simples.

---

## Structure cible des fichiers

```
messages/
  fr.json       ← toutes les clés FR (extrait direct du bloc TRANSLATIONS.fr)
  en.json       ← toutes les clés EN
```

---

## Les 25 Namespaces

| # | Namespace | Clés (~) | Notes |
|---|-----------|----------|-------|
| 1 | `common` | 22 | Partagé partout |
| 2 | `login` | 8 | Page login |
| 3 | `invite` | 8 | Page invitation |
| 4 | `sidebar` | 10 | Navigation latérale |
| 5 | `topbar` | 9 | Barre du haut |
| 6 | `dropzone` | 5 | Import Excel |
| 7 | `exec` | 14 | Executive Dashboard |
| 8 | `overview` | 28 | Onglet Vue d'ensemble |
| 9 | `simulator` | 55 | Onglet Simulateur — le plus large |
| 10 | `revenue` | 30 | Onglet Revenus |
| 11 | `cashflow` | 22 | Onglet Trésorerie |
| 12 | `team` | 20 | Onglet Équipe |
| 13 | `risks` | 25 | Onglet Risques (inclut `matrix: []` array) |
| 14 | `profit` | 18 | Onglet Profit |
| 15 | `optimize` | 18 | Onglet Optimisations |
| 16 | `admin` | 15 | Onglet Administration |
| 17 | `pdf` | 20 | Export PDF (titres de sections) |
| 18 | `compare` | 12 | Modale de comparaison |
| 19 | `scenario` | 8 | Gestion des scénarios |
| 20 | `version` | 6 | Panel historique versions |
| 21 | `import` | 10 | Rapport d'import diff |
| 22 | `pills` | 6 | Pills hypothèses |
| 23 | `plan` | 8 | Gestion des plans |
| 24 | `overlay` | 4 | Sélecteur overlay scénario |
| 25 | `chart` | 6 | Labels génériques graphiques |

---

## Clés paramétrées — Inventaire complet

Ces clés utilisent `{param}` et nécessitent d'être appelées avec `t('key', { param: value })` — syntaxe identique dans `next-intl`.

### `common`
| Clé | Paramètres | Exemple rendu |
|-----|-----------|---------------|
| `yearN` | `{n}` | `Année 3` |
| `collaborators` | `{n}` | `5 collaborateurs` |

### `overview`
| Clé | Paramètres |
|-----|-----------|
| `caGrowth` | `{pct}` |
| `margin` | `{pct}` |
| `verdictGreen` | `{margin}` `{payback}` `{treso}` |
| `verdictOrange` | `{margin}` `{payback}` `{bfr}` |
| `verdictRed` | `{margin}` `{bfr}` |

### `simulator` (namespace le plus dense)
| Clé | Paramètres |
|-----|-----------|
| `verdictGreen` | `{margin}` `{payback}` `{treso}` |
| `verdictOrange` | `{margin}` `{bfr}` `{bfrWarn}` `{paybackWarn}` |
| `verdictRed` | `{margin}` `{bfr}` `{payback}` |
| `paybackWarning` | `{payback}` |
| `startActivity` | `{start}` `{occup}` |
| `delayPayment` | `{delay}` |
| `rampUp` | `{pct}` |
| `caY2note` | `{ca}` |
| `caY2growth` | `{pct}` |
| `resY2note` | `{res}` |
| `resAdjNote` | `{res}` `{extra}` `{rc}` |
| `perAssoc` | `{val}` |
| `tresoFinal` | `{val}` |
| `yearDetail` | `{n}` |
| `resYearN` | `{n}` |
| `resAdjYearN` | `{n}` |
| `perAssocYearN` | `{n}` |
| `tresoMinYearN` | `{n}` |
| `tresoEndYearN` | `{n}` |
| `sensDelayImpact` | `{level}` |
| `sensStartImpact` | `{start}` `{level}` |
| `sensOccupImpact` | `{occup}` |
| `sensCashOI` | `{pct}` |
| `sensTeam` | `{n}` `{level}` |
| `sensCharges` | `{val}` `{level}` |
| `y1Start` | `{start}` |
| `y1Occup` | `{occup}` |
| `y1Delay` | `{delay}` |
| `y1Res` | `{res}` |
| `verdictY2Detail` | `{occup}` `{res}` |
| `verdictY3Detail` | `{assoc}` `{resAdj}` `{perAssoc}` |

### `revenue`
| Clé | Paramètres |
|-----|-----------|
| `sourcesAbove5` | `{n}` |
| `yearN` | `{n}` |
| `retroForGyneva` | `{pct}` |
| `startMonth` | `{m}` |
| `maxCapMonth` | `{m}` |
| `stableMonth` | `{m}` |
| `caYear` | `{n}` |
| `verdictGreenAll` | `{growth}` `{sources}` |
| `verdictOrangeAll` | `{sources}` `{growth}` |
| `verdictRedAll` | `{growth}` `{sources}` |
| `verdictGreenYear` | `{yLabel}` `{ca}` `{sources}` |
| `verdictOrangeYear` | `{yLabel}` `{ca}` `{sources}` |
| `verdictRedYear` | `{yLabel}` `{ca}` `{sources}` |

### `cashflow`
| Clé | Paramètres |
|-----|-----------|
| `endPeriod` | `{period}` |
| `verdictGreen` | `{period}` `{bfr}` `{ratio}` |
| `verdictOrange` | `{period}` `{bfr}` `{month}` |
| `verdictRed` | `{period}` `{bfr}` `{month}` |
| `bfrMinMonth` | `{m}` |

### `team`
| Clé | Paramètres |
|-----|-----------|
| `endPeriod` | `{period}` |
| `avgPeriod` | `{period}` |
| `adminPractitioners` | `{admin}` `{prat}` |
| `etpTransition` | `{start}` `{end}` |
| `verdictY1` | `{fte}` |
| `verdictY2` | `{fte}` `{caEtp}` |
| `verdictY3` | `{fte}` `{caEtp}` |
| `verdictAll` | `{start}` `{end}` `{caEtp}` |

### `dropzone`
| Clé | Paramètres |
|-----|-----------|
| `synced` | `{name}` |
| `error` | `{msg}` |
| `liveLabel` | `{name}` |

---

## Cas particulier : Clés avec HTML inline

~30 clés `verdict*` contiennent des balises `<strong>`. La gestion actuelle : `innerHTML = t('key', params)`.

En React, **`dangerouslySetInnerHTML` est à éviter**. Deux approches :

### Option A — `next-intl` Rich Text (recommandée)
```typescript
// messages/fr.json
{
  "simulator": {
    "verdictGreen": "<strong>Scénario viable.</strong> Marge Y3 de {margin}%, payback en {payback} mois."
  }
}

// Composant
const t = useTranslations('simulator');
<p dangerouslySetInnerHTML={{ __html: t('verdictGreen', { margin, payback }) }} />
```

> Acceptable car les valeurs sont toutes générées en interne (pas d'entrée utilisateur libre). Aucun risque XSS.

### Option B — Décomposer la clé
```typescript
// messages/fr.json — séparer le titre gras du corps
{
  "simulator": {
    "verdictGreenTitle": "Scénario viable.",
    "verdictGreenBody": "Marge Y3 de {margin}%, payback en {payback} mois."
  }
}

// Composant
<p><strong>{t('verdictGreenTitle')}</strong> {t('verdictGreenBody', { margin, payback })}</p>
```

**Recommandation : Option A** pour la Phase 4.1 (migration sans réécriture), Option B pour un refactoring ultérieur si nécessaire.

---

## Cas particulier : `risks.matrix`

Le namespace `risks` contient un tableau d'objets :

```javascript
matrix: [
  { risque: 'Concentration des revenus', proba: 3, impact: 4, ... },
  { risque: 'Délai de conventionnement LAMal', proba: 4, impact: 4, ... },
  // ...
]
```

Ce tableau **ne peut pas être un fichier JSON plat** avec `next-intl`. Solutions :

1. **Sortir le tableau du système i18n** : le stocker dans `src/data/risks.ts` avec des clés de traduction séparées par item. Les textes restent dans les fichiers JSON en tant que clés nommées.

2. **Laisser dans le code** : comme `risks.matrix` est statique et non traduit dynamiquement (les deux langues ont les mêmes risques), on peut le traiter comme une constante `src/data/riskMatrix.ts`.

**Recommandation : Option 2** — sortir le tableau de `TRANSLATIONS` vers un fichier de données statiques.

---

## Plan de migration en 3 étapes

### Étape 1 — Extraction (Phase 1)
```bash
# Script à écrire une fois : extraire les deux objets TRANSLATIONS.fr et TRANSLATIONS.en
# depuis index.html et les sérialiser en JSON
node scripts/extract-i18n.mjs
# → messages/fr.json
# → messages/en.json
```

### Étape 2 — Configuration next-intl (Phase 1)
```typescript
// src/i18n.ts
import { getRequestConfig } from 'next-intl/server';
export default getRequestConfig(async ({ locale }) => ({
  messages: (await import(`../messages/${locale}.json`)).default
}));
```

### Étape 3 — Remplacement de `t()` (Phase 4, par composant)
```typescript
// Avant (vanilla)
element.innerHTML = t('simulator.verdictGreen', { margin, payback, treso });

// Après (next-intl, Client Component)
const t = useTranslations('simulator');
<div dangerouslySetInnerHTML={{ __html: t('verdictGreen', { margin, payback, treso }) }} />
```

La fonction `t(key, params)` actuelle a exactement la même signature que `useTranslations()` de `next-intl`. La migration est mécanique, clé par clé.

---

## Script d'extraction (à créer en Phase 1)

```javascript
// scripts/extract-i18n.mjs
// Exécuté une seule fois pour générer messages/fr.json et messages/en.json
// depuis le bloc TRANSLATIONS de public/index.html
// Utilise un AST parser ou un eval() contrôlé en sandbox
```

> Note : le bloc `TRANSLATIONS` est du JavaScript pur (objet littéral). Le parser le plus simple est `node -e "const TRANSLATIONS = ...; require('fs').writeFileSync('messages/fr.json', JSON.stringify(TRANSLATIONS.fr, null, 2))"`.
