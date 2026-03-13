# Design System Master File

> **LOGIC:** When building a specific page, first check `design-system/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** GYNEVA Business Plan
**Generated:** 2026-03-13
**Category:** Financial Dashboard — Next.js 16 + React 19 + CSS Modules
**Stack:** Next.js 16 App Router, TypeScript, CSS Modules (no Tailwind), Zustand 5
**Product type:** Financial Dashboard — Primary style: Data-Dense + Trust Blue

---

## Global Rules

### Color Palette

The project uses CSS custom properties defined in `src/app/globals.css`. **Always use CSS variables — never hardcode hex values in components.**

#### Light Mode (`:root`)

| Role | CSS Variable | Hex | Semantic Meaning |
|------|-------------|-----|-----------------|
| Brand primary (headings, emphasis) | `--p` | `#1B3A5C` | Deep navy |
| Interactive primary (links, active states) | `--pl` | `#2563EB` | Trust blue |
| Success / positive indicator | `--acc` | `#10B981` | Emerald green |
| Info / secondary accent | `--acc2` | `#06B6D4` | Cyan |
| Warning | `--warn` | `#F59E0B` | Amber |
| Danger / negative indicator | `--danger` | `#EF4444` | Red |
| Page background | `--bg` | `#F1F5F9` | Slate-100 |
| Card / panel background | `--card` | `#FFFFFF` | White |
| Subtle background | `--s2` | `#F8FAFC` | Slate-50 |
| Body text | `--txt` | `#0F172A` | Slate-900 |
| Secondary text | `--txtL` | `#64748B` | Slate-500 |
| Placeholder / muted text | `--txtXL` | `#94A3B8` | Slate-400 |
| Border (default) | `--brd` | `#E2E8F0` | Slate-200 |
| Border (strong) | `--brd2` | `#CBD5E1` | Slate-300 |

#### Dark Mode (`[data-theme="dark"]` toggled by `Topbar.tsx`)

| CSS Variable | Dark Hex | Notes |
|-------------|---------|-------|
| `--p` | `#60A5FA` | Lighter blue for headings |
| `--pl` | `#3B82F6` | Slightly lighter interactive blue |
| `--acc` | `#34D399` | Lighter emerald |
| `--acc2` | `#22D3EE` | Lighter cyan |
| `--bg` | `#0F172A` | Near-black (Slate-900) |
| `--card` | `#1E293B` | Slate-800 |
| `--s2` | `#162032` | Custom dark |
| `--txt` | `#F1F5F9` | Off-white |
| `--txtL` | `#94A3B8` | Slate-400 |
| `--txtXL` | `#64748B` | Slate-500 |
| `--brd` | `#334155` | Slate-700 |
| `--brd2` | `#475569` | Slate-600 |

#### Sidebar (always dark, theme-independent)

| Element | Light theme bg | Dark theme bg |
|---------|---------------|--------------|
| Background gradient | `#0F2340 → #091829` | `#111 → #080808` |
| Nav text (inactive) | `rgba(255,255,255,.55)` | same |
| Nav text (active/hover) | `#fff` | same |
| Active left border | `var(--pl)` = `#2563EB` | same |
| Active bg | `rgba(37,99,235,.15)` | same |

### Typography

- **Font family:** Inter (loaded via Google Fonts in `globals.css`)
- **Recommended future upgrade:** IBM Plex Sans for headings (financial premium feel — out of scope for navigation shell redesign)
- **Line height:** `1.6` body, `1` for UI labels
- **Anti-aliasing:** `-webkit-font-smoothing: antialiased`

**Type scale used in navigation shell:**

| Usage | Size | Weight | Location |
|-------|------|--------|----------|
| Page title | `1.05rem` | `700` | Topbar `.pageTitle` |
| Logo name | `1.05rem` | `700` | Sidebar `.logoName` |
| Nav label | `0.8rem` | `500` | Sidebar `.navLabel` |
| Button / dropdown | `0.8rem` | `500` | Topbar buttons |
| Plan name | `0.82rem` | `500` | Topbar plan switcher |
| Logout / small | `0.75rem` | — | Topbar user area |
| Sidebar footer | `0.65rem` | — | Sidebar `.footer` |
| Logo subtitle | `0.62rem` | — | Sidebar `.logoSub` |

### Spacing

| Token | Value | CSS | Usage |
|-------|-------|-----|-------|
| `--space-xs` | `4px` | `0.25rem` | Tight gaps |
| `--space-sm` | `8px` | `0.5rem` | Icon gaps, inline |
| `--space-md` | `16px` | `1rem` | Standard padding |
| `--space-lg` | `24px` | `1.5rem` | Section padding |
| `--space-xl` | `32px` | `2rem` | Large gaps, page padding |
| `--space-2xl` | `48px` | `3rem` | Section margins |

### Border Radius

| Variable | Value | Usage |
|----------|-------|-------|
| `--r` | `10px` | Cards, modals, dropdowns |
| `--r-sm` | `6px` | Buttons, inputs, small elements |

### Shadows

| Variable | Value | Usage |
|----------|-------|-------|
| `--sh` | `0 1px 3px rgba(0,0,0,.07), 0 1px 2px rgba(0,0,0,.05)` | Subtle lift (topbar) |
| `--sh-md` | `0 4px 6px rgba(0,0,0,.06), 0 2px 4px rgba(0,0,0,.05)` | Dropdowns |

### Transitions

| Variable | Value | Usage |
|----------|-------|-------|
| `--trans` | `all .2s cubic-bezier(.4,0,.2,1)` | Default (hover states) |
| margin-left specific | `margin-left .2s cubic-bezier(.4,0,.2,1)` | Layout shift on sidebar collapse |

### Layout Variables

| Variable | Value | Notes |
|----------|-------|-------|
| `--sidebar-w` | `230px` | Full sidebar width |
| `--sidebar-w-col` | `58px` | Collapsed sidebar width |
| `--sidebar-current-w` | set at runtime by `Sidebar.tsx` | CSS variable synced via `useEffect` — defaults to `--sidebar-w` |

---

## Icon System

**Rule:** All icons must be SVG — no emojis, no icon fonts, no raster images.

**Standard SVG attributes for navigation icons:**
```jsx
viewBox="0 0 24 24"
width="18" height="18"        // Sidebar nav icons
width="16" height="16"        // Topbar icons
fill="none"
stroke="currentColor"
strokeWidth="2"
strokeLinecap="round"
strokeLinejoin="round"
```

**Toggle chevron (Sidebar):**
```jsx
<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
  {/* Collapsed → point right */}
  <polyline points="9 18 15 12 9 6"/>
  {/* Expanded → point left */}
  <polyline points="15 18 9 12 15 6"/>
</svg>
```

**Topbar icon inventory** (all `width="16" height="16"`, `strokeWidth="2"`):

| Icon | Usage | Lucide equivalent |
|------|-------|-------------------|
| Sun | Theme toggle (light mode) | `Sun` |
| Moon | Theme toggle (dark mode) | `Moon` |
| Upload / FileUp | Import Excel | `Upload` |
| Clock / History | Versions | `Clock` |
| Download / FileDown | Export PDF | `Download` |
| ChevronDown | Dropdown chevrons | `ChevronDown` |

All icons inline as JSX (no external library import needed — inline SVG keeps bundle minimal).

---

## Navigation Shell Component Specs

### Sidebar

- **Width expanded:** `var(--sidebar-w)` = `230px`
- **Width collapsed:** `var(--sidebar-w-col)` = `58px`
- **Transition:** `width .2s cubic-bezier(.4,0,.2,1)` on `.sidebar`
- **Position:** `fixed`, full height, `z-index: 200`
- **Collapse state:** managed by `useAppStore` (`sidebarCollapsed`, `toggleSidebar`)
- **CSS var sync:** `useEffect` in `Sidebar.tsx` sets `--sidebar-current-w` on `:root`
- **Toggle button:** positioned at `right: -13px` from sidebar edge, `z-index: 201`, `var(--pl)` background
- **Nav active state:** `border-left: 3px solid var(--pl)` + `rgba(37,99,235,.15)` background

### Topbar

- **Position:** `sticky`, `top: 0`, `z-index: 100`
- **Background:** `var(--card)` with `border-bottom: 1px solid var(--brd)`
- **Height:** `~52px` (padding `.8rem 2rem`)
- **Layout:** flex row, `gap: 1rem`, items: plan switcher | spacer | theme toggle | actions | user area
- **All interactive elements:** `cursor: pointer` (including icon buttons)
- **Dropdowns:** `position: absolute`, `top: calc(100% + 6px)`, `box-shadow: var(--sh-md)`, `border-radius: var(--r)`

### Layout Shell

- **`.layout`:** `display: flex`, `min-height: 100vh`
- **`.mainArea`:** `margin-left: var(--sidebar-current-w, var(--sidebar-w))`, `transition: margin-left .2s cubic-bezier(.4,0,.2,1)`, `flex: 1`
- **`.content`:** `padding: 1.8rem 2rem`, `max-width: 1200px`, `margin: 0 auto`

---

## Component Specs

### Buttons

```css
/* Icon button (Topbar theme toggle, etc.) */
.iconBtn {
  background: none;
  border: 1px solid var(--brd);
  border-radius: var(--r-sm);
  padding: .35rem .5rem;
  cursor: pointer;
  color: var(--txt);
  transition: var(--trans);
  display: flex;
  align-items: center;
  justify-content: center;
}
.iconBtn:hover { border-color: var(--pl); color: var(--pl); }

/* Text button (Actions, Plan switcher) */
.textBtn {
  background: none;
  border: 1px solid var(--brd);
  border-radius: var(--r-sm);
  padding: .3rem .7rem;
  font-size: .82rem;
  font-weight: 500;
  color: var(--txt);
  cursor: pointer;
  transition: var(--trans);
  display: flex;
  align-items: center;
  gap: .45rem;
}
.textBtn:hover { border-color: var(--pl); color: var(--pl); }
```

### Dropdowns

```css
.dropdown {
  position: absolute;
  top: calc(100% + 6px);
  background: var(--card);
  border: 1px solid var(--brd);
  border-radius: var(--r);
  box-shadow: var(--sh-md);
  min-width: 180px;
  z-index: 200;
  overflow: hidden;
}

.dropdownItem {
  display: flex;
  align-items: center;
  gap: .6rem;
  width: 100%;
  padding: .6rem 1rem;
  background: none;
  border: none;
  text-align: left;
  font-size: .82rem;
  color: var(--txt);
  cursor: pointer;
  transition: background .15s;
  font-family: inherit;
}
.dropdownItem:hover { background: var(--s2); }
```

### Cards (page content, not navigation)

```css
.card {
  background: var(--card);
  border-radius: var(--r);
  padding: 1.5rem;
  box-shadow: var(--sh);
  border: 1px solid var(--brd);
}
```

### Inputs

```css
.input {
  padding: .6rem .8rem;
  border: 1px solid var(--brd);
  border-radius: var(--r-sm);
  font-size: 0.9rem;
  background: var(--card);
  color: var(--txt);
  transition: border-color .2s;
}
.input:focus {
  border-color: var(--pl);
  outline: none;
  box-shadow: 0 0 0 3px rgba(37,99,235,.12);
}
```

---

## Style Guidelines

**Chosen style:** Minimalism & Swiss Style — adapted for financial data density

**Keywords:** Clean, functional, high contrast, grid-based, sans-serif, essential elements only, trustworthy

**Key effects:**
- Hover: `border-color: var(--pl)` + `color: var(--pl)` on buttons (no transforms)
- Active nav: left border accent + very subtle blue fill
- Dropdowns: `box-shadow: var(--sh-md)` for depth
- Sidebar collapse: width + opacity transitions

**Avoid:**
- Scale transforms that shift layout (anti-pattern: `transform: translateY(-2px)` on hover)
- Emojis as icons
- Random hardcoded hex values
- Instant state changes (always transition 150-300ms)
- Invisible focus states

---

## Anti-Patterns (Do NOT Use)

- No emojis as icons — use inline SVG (Heroicons/Lucide style)
- No `cursor: default` on clickable elements — always `cursor: pointer`
- No hardcoded hex values in component CSS — always `var(--token)`
- No `transition: all` on layout properties — use targeted transitions
- No `transform: translateY()` on hover in nav items — causes layout shift
- No invisible focus states — always provide visible `:focus-visible` ring
- No `margin-left` static value in layout — use `var(--sidebar-current-w, var(--sidebar-w))`

---

## Pre-Delivery Checklist

Before delivering any UI code, verify:

- [ ] No emojis used as icons (use SVG instead)
- [ ] All icons from consistent SVG style (viewBox 0 0 24 24, strokeWidth 2, currentColor)
- [ ] `cursor-pointer` on all clickable elements
- [ ] Hover states with smooth transitions (150-300ms)
- [ ] Light mode: text contrast 4.5:1 minimum
- [ ] Dark mode: text contrast tested separately
- [ ] Focus states visible for keyboard navigation
- [ ] `prefers-reduced-motion` respected
- [ ] Sidebar collapse correctly shifts main content
- [ ] No content hidden behind fixed topbar (topbar is sticky, content has correct padding)
- [ ] No horizontal scroll on mobile
- [ ] `npm run typecheck` passes
- [ ] `npm run build` passes
