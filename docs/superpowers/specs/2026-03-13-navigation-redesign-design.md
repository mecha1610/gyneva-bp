# Design Spec — Navigation Shell Redesign

**Date:** 2026-03-13
**Status:** Approved
**Scope:** Sidebar, Topbar, layout shell, design system documentation

---

## Goal

Redesign the navigation shell (Sidebar + Topbar + layout responsiveness) to deliver a premium SaaS aesthetic, fix known layout bugs, and document the design system in `design-system/MASTER.md`.

**Out of scope:** Page content, chart components, data model changes.

---

## Problems Being Solved

| # | Problem | Current state |
|---|---------|--------------|
| 1 | Main content does not shift when sidebar collapses | `margin-left: var(--sidebar-w)` is static in `layout.module.css` — Zustand `sidebarCollapsed` state is ignored |
| 2 | Topbar uses emoji icons | `🌙 ☀️ 📄 🕘 📈 🖨` are inconsistent with the SVG icons used in the Sidebar nav |
| 3 | Collapse toggle uses text arrows | `◀ ▶` characters look unprofessional |
| 4 | Actions dropdown has stubs | Versions, Comparer have `onClick={() => setActionsOpen(false)}` — no action |
| 5 | No design system documentation | Tokens live only in `globals.css`, undocumented for future contributors |

---

## Architecture Decisions

### Layout responsiveness: CSS custom property sync

`layout.tsx` is a Server Component — it cannot read Zustand state. The fix must be client-side.

**Approach:** `Sidebar.tsx` (already a client component) runs a `useEffect` that syncs `collapsed` state to a CSS custom property on `:root`:

```ts
useEffect(() => {
  document.documentElement.style.setProperty(
    '--sidebar-current-w',
    collapsed ? 'var(--sidebar-w-col)' : 'var(--sidebar-w)'
  );
}, [collapsed]);
```

`layout.module.css` then uses:
```css
.mainArea {
  margin-left: var(--sidebar-current-w, var(--sidebar-w));
  transition: margin-left .2s cubic-bezier(.4,0,.2,1);
}
```

The `var(--sidebar-w)` fallback ensures correct layout before hydration (SSR renders full sidebar width).

### Emoji → SVG replacement

All emoji in `Topbar.tsx` replaced with inline SVG components matching the style of existing Sidebar icons (`viewBox="0 0 24 24"`, `width="16" height="16"`, `fill="none" stroke="currentColor" strokeWidth="2"`).

### Actions menu cleanup

- **Importer Excel** — keep, has real API (`/api/import/excel`)
- **Versions** — keep stub, rename to "Historique des versions" (future feature)
- **Comparer** — remove (no roadmap entry, clutters menu)
- **Export PDF** — keep, add `title` tooltip noting SPA-only status

---

## Component Specifications

### Sidebar.tsx changes

1. Replace `◀/▶` text in toggle button with SVG chevron:
   ```jsx
   <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
     {collapsed ? <polyline points="9 18 15 12 9 6"/> : <polyline points="15 18 9 12 15 6"/>}
   </svg>
   ```

2. Add `useEffect` to sync `--sidebar-current-w` CSS variable on mount and on collapse state change.

3. No visual changes to colors, spacing, or nav items — the dark gradient design is kept.

### Sidebar.module.css changes

None required. The toggle button already has `.toggleBtn` styling that works with any content.

### Topbar.tsx changes

1. **Theme toggle**: Replace `{theme === 'light' ? '🌙' : '☀️'}` with SVG moon/sun icons.

2. **Plan switcher chevron**: Replace `{' ▾'}` text with SVG chevron-down icon.

3. **Actions menu items**: Replace emoji with SVG icons; remove Comparer item. The `📈 Comparer` item is removed outright (not replaced — no roadmap entry). Remaining replacements:
   - `📄 Importer Excel` → Upload SVG icon
   - `🕘 Versions` → Clock SVG icon
   - `🖨 Export PDF` → Download SVG icon

   All Topbar SVG icons use `viewBox="0 0 24 24"` `width="16" height="16"` `fill="none"` `stroke="currentColor"` `strokeWidth="2"` `strokeLinecap="round"` `strokeLinejoin="round"` — consistent with Sidebar nav icons. Specific path data should match standard Heroicons/Lucide equivalents (implementer may use any source matching these dimensions and stroke style).

4. **Actions button chevron**: Replace `▾` text with SVG chevron-down icon.

5. **User name display**: Add `<span className={styles.userName}>{userName}</span>` before the logout button. The name is always visible — no responsive hiding. `layout.tsx` requires no change; it already passes `userName` as a prop.

### Topbar.module.css changes

1. Add `.userName` class (always visible, no breakpoint):
   ```css
   .userName {
     font-size: .8rem;
     font-weight: 500;
     color: var(--txt);
     white-space: nowrap;
     max-width: 120px;
     overflow: hidden;
     text-overflow: ellipsis;
   }
   ```

2. Update `.actionsMenu button` to use `gap: .6rem` (slightly more space for icon + label pairs).

### layout.module.css changes

```css
.mainArea {
  margin-left: var(--sidebar-current-w, var(--sidebar-w));
  transition: margin-left .2s cubic-bezier(.4,0,.2,1);
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
```

Replace the static `margin-left: var(--sidebar-w)` with the dynamic variable. Replace `transition: var(--trans)` (which applies to `all` properties) with a targeted `margin-left`-only transition. The `flex: 1`, `min-width: 0`, and `display: flex` / `flex-direction: column` properties require no transition and are kept as-is. No other property on `.mainArea` currently benefits from animation.

`layout.tsx` requires no changes — the CSS variable is set by `Sidebar.tsx` on the client.

---

## New File: `design-system/MASTER.md` (repo root — `/Users/thomas/Documents/GitHub/gyneva-bp/design-system/MASTER.md`)

Documents the complete design system for gyneva-bp. Sections:

1. **Overview** — purpose, audience, how to update
2. **Color palette** — full table of all `--var` tokens with hex values, semantic meaning, light/dark variants
3. **Typography** — font family, scale (xs / sm / base / lg / xl), weight scale
4. **Spacing** — padding/gap conventions (`.3rem`, `.5rem`, `.65rem`, `1rem`, `1.8rem`, `2rem`)
5. **Border radius** — `--r` (10px = cards), `--r-sm` (6px = buttons/inputs)
6. **Shadows** — `--sh` (subtle), `--sh-md` (dropdowns), sidebar-specific
7. **Transitions** — `--trans` (all .2s), margin-left specific
8. **Layout** — sidebar widths (`--sidebar-w`, `--sidebar-w-col`), `--sidebar-current-w` runtime var, breakpoints
9. **Icon system** — SVG conventions (viewBox, stroke width, size variants), inventory of all icons with their JSX
10. **Component tokens** — which tokens each component uses

---

## File Inventory

| File | Action | Change summary |
|------|--------|----------------|
| `src/components/Sidebar.tsx` | Modify | SVG chevron toggle, CSS var sync useEffect |
| `src/components/Topbar.tsx` | Modify | Replace emoji with SVGs, remove Comparer, add userName |
| `src/components/Topbar.module.css` | Modify | Add `.userName`, tweak `.actionsMenu button` gap |
| `src/app/(app)/layout.module.css` | Modify | Dynamic sidebar margin via CSS variable |
| `design-system/MASTER.md` | Create | Full design system documentation (at repo root) |
| `src/app/(app)/layout.tsx` | No change | Passes `userName` prop already; no new props needed |
| `src/components/Sidebar.module.css` | No change | Toggle button styling works with any child content |
| `src/app/globals.css` | No change | Tokens are correct; `--sidebar-current-w` is set at runtime by Sidebar.tsx, not defined statically |

---

## Non-Goals

- Mobile hamburger menu (next iteration)
- Section health badges (next iteration)
- Animations beyond existing collapse transition
- Chart/page content styling
- New color palette or typography

---

## Success Criteria

1. When sidebar collapses, `main` content area shifts left smoothly (no overlap, no gap)
2. All topbar icons are SVGs — zero emoji remaining in Topbar.tsx
3. `design-system/MASTER.md` exists at repo root and documents every CSS custom property in `globals.css` — including hex values, semantic meaning, and light/dark variants for all 17 tokens (`--p, --pl, --acc, --acc2, --warn, --danger, --bg, --card, --s2, --txt, --txtL, --txtXL, --brd, --brd2, --sh, --sh-md, --r, --r-sm, --trans, --sidebar-w, --sidebar-w-col`)
4. `npm run typecheck` passes
5. `npm run build` passes
