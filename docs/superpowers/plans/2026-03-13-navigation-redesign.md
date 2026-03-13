# Navigation Shell Redesign Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the sidebar collapse → layout responsiveness bug, replace all emoji icons with SVGs in the Topbar, and add the user's display name — delivering a polished, consistent premium navigation shell.

**Architecture:** `Sidebar.tsx` syncs a CSS custom property (`--sidebar-current-w`) to `:root` via `useEffect`, enabling `layout.module.css` to respond to collapse state without breaking SSR. All emoji in `Topbar.tsx` are replaced with inline SVG using the same convention as existing Sidebar icons (viewBox 0 0 24 24, strokeWidth 2, currentColor). The `design-system/MASTER.md` already exists — no further action needed.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, CSS Modules, Zustand 5. No new dependencies. Verification: `npm run typecheck` + `npm run build`.

**Spec:** `docs/superpowers/specs/2026-03-13-navigation-redesign-design.md`
**Design system:** `design-system/MASTER.md`

---

## Chunk 1: Layout responsiveness + Sidebar SVG toggle

### Task 1: Fix `layout.module.css` — responsive sidebar margin

**Files:**
- Modify: `src/app/(app)/layout.module.css`

**Context:** Currently `margin-left: var(--sidebar-w)` is static — it never updates when the sidebar collapses. The fix uses a runtime CSS variable `--sidebar-current-w` that `Sidebar.tsx` will set. The `var(--sidebar-w)` fallback ensures correct SSR before hydration.

- [ ] **Step 1: Read the current file**

  ```bash
  cat src/app/(app)/layout.module.css
  ```

  Expected current content:
  ```css
  .mainArea {
    margin-left: var(--sidebar-w);
    transition: var(--trans);
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }
  ```

- [ ] **Step 2: Replace `.mainArea` with the responsive version**

  Replace the entire `.mainArea` rule:

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

  Key changes:
  - `margin-left` now uses `--sidebar-current-w` with `--sidebar-w` as SSR fallback
  - `transition` targets `margin-left` only (was `all` via `--trans` — broader than needed)
  - All other properties unchanged

- [ ] **Step 3: Verify typecheck passes**

  ```bash
  cd /Users/thomas/Documents/GitHub/gyneva-bp && npm run typecheck
  ```

  Expected: no errors (CSS modules don't affect TypeScript)

- [ ] **Step 4: Commit**

  ```bash
  git add src/app/(app)/layout.module.css
  git commit -m "fix(layout): respond to sidebar collapse via CSS custom property"
  ```

---

### Task 2: Update `Sidebar.tsx` — SVG chevron toggle + CSS var sync

**Files:**
- Modify: `src/components/Sidebar.tsx`

**Context:** Two changes: (1) replace `◀/▶` text chars in the toggle button with a proper SVG chevron, (2) add a `useEffect` that syncs `sidebarCollapsed` Zustand state to `--sidebar-current-w` on `:root`. This is the client-side mechanism that makes Task 1's CSS variable work.

- [ ] **Step 1: Read the current file**

  ```bash
  cat src/components/Sidebar.tsx
  ```

- [ ] **Step 2: Add the CSS variable sync `useEffect`**

  After the existing `toggleSidebar` line (around line 129), add a `useEffect` import if not already present (React is already used via JSX), then add this effect inside the component body:

  ```tsx
  // After: const toggleSidebar = useAppStore(s => s.toggleSidebar);
  // Add this import at the top of the file if useEffect isn't imported:
  // import { useEffect } from 'react';  ← add useEffect to the React import

  useEffect(() => {
    document.documentElement.style.setProperty(
      '--sidebar-current-w',
      collapsed ? 'var(--sidebar-w-col)' : 'var(--sidebar-w)'
    );
  }, [collapsed]);
  ```

  Note: `'use client'` is already at the top. `useEffect` needs to be added to the React import. The current file doesn't import from 'react' directly — it uses JSX implicitly. Add:
  ```tsx
  import { useEffect } from 'react';
  ```
  at the top of the file (after `'use client';`).

- [ ] **Step 3: Replace the toggle button content**

  Find this in the toggle button JSX:
  ```tsx
  {collapsed ? '▶' : '◀'}
  ```

  Replace with:
  ```tsx
  <svg
    viewBox="0 0 24 24"
    width="14"
    height="14"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {collapsed
      ? <polyline points="9 18 15 12 9 6" />
      : <polyline points="15 18 9 12 15 6" />
    }
  </svg>
  ```

- [ ] **Step 4: Verify typecheck passes**

  ```bash
  cd /Users/thomas/Documents/GitHub/gyneva-bp && npm run typecheck
  ```

  Expected: no errors. If TypeScript complains about `polyline` JSX element, check that `@types/react` is installed (it is — it's a Next.js project).

- [ ] **Step 5: Commit**

  ```bash
  git add src/components/Sidebar.tsx
  git commit -m "feat(sidebar): SVG chevron toggle + sync --sidebar-current-w CSS var"
  ```

---

## Chunk 2: Topbar SVG icons + user name

### Task 3: Update `Topbar.tsx` — replace all emoji with SVGs, add user name, clean up actions

**Files:**
- Modify: `src/components/Topbar.tsx`

**Context:** Four emoji replacements + one removal + one addition:
1. Theme toggle: `🌙/☀️` → SVG Moon/Sun icons
2. Plan switcher chevron: `▾` text → SVG ChevronDown
3. Actions button chevron: `▾` text → SVG ChevronDown
4. Actions menu: `📄/🕘/🖨` → SVG Upload/Clock/Download; `📈 Comparer` removed entirely
5. User name `<span>` added before logout button

All SVGs follow: `viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"`

- [ ] **Step 1: Read the current file**

  ```bash
  cat src/components/Topbar.tsx
  ```

- [ ] **Step 2: Define inline SVG helper components at the top of the file (after imports)**

  Add these after all imports, before the `Props` interface — they are local constants, not exported:

  ```tsx
  const IconMoon = () => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  );

  const IconSun = () => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1" x2="12" y2="3"/>
      <line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/>
      <line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  );

  const IconUpload = () => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="16 16 12 12 8 16"/>
      <line x1="12" y1="12" x2="12" y2="21"/>
      <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
    </svg>
  );

  const IconClock = () => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  );

  const IconDownload = () => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="8 17 12 21 16 17"/>
      <line x1="12" y1="12" x2="12" y2="21"/>
      <path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.83"/>
    </svg>
  );

  const IconChevronDown = () => (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  );
  ```

- [ ] **Step 3: Replace theme toggle emoji**

  Find:
  ```tsx
  {theme === 'light' ? '🌙' : '☀️'}
  ```

  Replace with:
  ```tsx
  {theme === 'light' ? <IconMoon /> : <IconSun />}
  ```

- [ ] **Step 4: Replace plan switcher text chevron**

  Find:
  ```tsx
  {' ▾'}
  ```

  Replace with:
  ```tsx
  <IconChevronDown />
  ```

- [ ] **Step 5: Replace Actions button text chevron**

  Find:
  ```tsx
  Actions ▾
  ```

  Replace with:
  ```tsx
  Actions <IconChevronDown />
  ```

  The button should now look like:
  ```tsx
  <button
    className={styles.actionsBtn}
    onClick={() => setActionsOpen(o => !o)}
    aria-expanded={actionsOpen}
  >
    Actions <IconChevronDown />
  </button>
  ```

- [ ] **Step 6: Replace emoji in Actions menu items and remove Comparer**

  Find the entire actions menu content block (the four buttons inside `actionsMenu`):
  ```tsx
  <button role="menuitem" onClick={() => { fileInputRef.current?.click(); setActionsOpen(false); }}>
    📄 Importer Excel
  </button>
  <button role="menuitem" onClick={() => setActionsOpen(false)}>
    🕘 Versions
  </button>
  <button role="menuitem" onClick={() => setActionsOpen(false)}>
    📈 Comparer
  </button>
  <hr className={styles.menuDivider} />
  <button
    role="menuitem"
    className={styles.menuItemPrimary}
    onClick={() => setActionsOpen(false)}
  >
    🖨 Export PDF
  </button>
  ```

  Replace with (Comparer removed, emojis replaced with SVG icons, Export PDF gets title attribute noting SPA-only status):
  ```tsx
  <button role="menuitem" onClick={() => { fileInputRef.current?.click(); setActionsOpen(false); }}>
    <IconUpload /> Importer Excel
  </button>
  <button role="menuitem" onClick={() => setActionsOpen(false)}>
    <IconClock /> Historique des versions
  </button>
  <hr className={styles.menuDivider} />
  <button
    role="menuitem"
    className={styles.menuItemPrimary}
    onClick={() => setActionsOpen(false)}
    title="Export PDF (visualisation SPA uniquement — non disponible dans l'application Next.js)"
  >
    <IconDownload /> Export PDF
  </button>
  ```

- [ ] **Step 7: Add user name display before logout button**

  Find the user area section. The `userPicture` conditional block ends before the logout button. Find:
  ```tsx
  <button className={styles.logoutBtn} onClick={handleLogout}>
    Déconnexion
  </button>
  ```

  Add the user name before it:
  ```tsx
  {userName && (
    <span className={styles.userName}>{userName}</span>
  )}
  <button className={styles.logoutBtn} onClick={handleLogout}>
    Déconnexion
  </button>
  ```

- [ ] **Step 8: Verify typecheck passes**

  ```bash
  cd /Users/thomas/Documents/GitHub/gyneva-bp && npm run typecheck
  ```

  Expected: no errors. Common issue: if TypeScript complains about SVG element attributes, verify `@types/react` is present (it is).

- [ ] **Step 9: Commit**

  ```bash
  git add src/components/Topbar.tsx
  git commit -m "feat(topbar): replace emoji with SVG icons, add user name, remove Comparer"
  ```

---

### Task 4: Update `Topbar.module.css` — user name style + actions menu icon gap

**Files:**
- Modify: `src/components/Topbar.module.css`

**Context:** Four CSS additions: (1) `.userName` class for the new name display, (2) add `display: flex; align-items: center; gap: .4rem` to `.actionsBtn` so the SVG chevron aligns with the label text, (3) add `display: flex; align-items: center; justify-content: center` to `.iconBtn` so the SVG theme toggle centers in its button box, (4) update `.actionsMenu button` gap from `.5rem` to `.6rem`.

- [ ] **Step 1: Read the current file**

  ```bash
  cat src/components/Topbar.module.css
  ```

- [ ] **Step 2: Add `display: flex` alignment to `.actionsBtn`**

  Find the `.actionsBtn` rule. It currently looks like:
  ```css
  .actionsBtn {
    padding: .45rem 1rem;
    border-radius: 8px;
    border: 1px solid var(--brd);
    background: var(--card);
    color: var(--txt);
    font-size: .8rem;
    font-weight: 500;
    cursor: pointer;
    transition: var(--trans);
  }
  ```

  Add flex alignment so the SVG chevron and label text are vertically aligned:
  ```css
  .actionsBtn {
    padding: .45rem 1rem;
    border-radius: 8px;
    border: 1px solid var(--brd);
    background: var(--card);
    color: var(--txt);
    font-size: .8rem;
    font-weight: 500;
    cursor: pointer;
    transition: var(--trans);
    display: flex;
    align-items: center;
    gap: .4rem;
  }
  ```

- [ ] **Step 3: Add `display: flex` centering to `.iconBtn`**

  Find the `.iconBtn` rule. It currently looks like:
  ```css
  .iconBtn {
    background: none;
    border: 1px solid var(--brd);
    border-radius: var(--r-sm);
    padding: .35rem .5rem;
    cursor: pointer;
    font-size: .9rem;
    color: var(--txt);
    transition: var(--trans);
    line-height: 1;
  }
  ```

  Add flex centering so the SVG icon is vertically and horizontally centered:
  ```css
  .iconBtn {
    background: none;
    border: 1px solid var(--brd);
    border-radius: var(--r-sm);
    padding: .35rem .5rem;
    cursor: pointer;
    font-size: .9rem;
    color: var(--txt);
    transition: var(--trans);
    line-height: 1;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  ```

- [ ] **Step 4: Add `.userName` class**

  Add after the `.avatarPlaceholder` block (around line 227), before `.logoutBtn`:

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

- [ ] **Step 5: Update `.actionsMenu button` gap**

  Find:
  ```css
  .actionsMenu button {
    display: flex;
    align-items: center;
    gap: .5rem;
  ```

  Replace `gap: .5rem` with `gap: .6rem`.

- [ ] **Step 6: Verify typecheck passes**

  ```bash
  cd /Users/thomas/Documents/GitHub/gyneva-bp && npm run typecheck
  ```

  Expected: no errors (CSS modules don't affect TypeScript).

- [ ] **Step 7: Commit**

  ```bash
  git add src/components/Topbar.module.css
  git commit -m "feat(topbar): add userName style, flex alignment for icon buttons, refine menu gap"
  ```

---

## Chunk 3: Design system + final verification

### Task 5: Commit `design-system/MASTER.md`

**Files:**
- Already created: `design-system/MASTER.md`

**Context:** The design system file was already generated and written by the planning phase. It just needs to be committed.

- [ ] **Step 1: Verify the file documents all required CSS tokens**

  Run this to confirm all 21 token names from `globals.css` are present in `MASTER.md`:

  ```bash
  for token in --p --pl --acc --acc2 --warn --danger --bg --card --s2 --txt --txtL --txtXL --brd --brd2 --sh --sh-md --r --r-sm --trans --sidebar-w --sidebar-w-col; do
    grep -q "$token" design-system/MASTER.md && echo "✓ $token" || echo "✗ MISSING: $token"
  done
  ```

  Expected: all 21 tokens show `✓`. If any show `✗`, add the missing token to the Color Palette or Layout Variables table in `design-system/MASTER.md` before committing.

- [ ] **Step 2: Commit**

  ```bash
  git add design-system/MASTER.md
  git commit -m "docs: add design-system/MASTER.md with CSS tokens, icon system, component specs"
  ```

---

### Task 6: Full build verification

**Files:** No file changes — verification only.

**Context:** Run the full build to catch any issues that `typecheck` alone might miss (e.g., Next.js static analysis, missing exports).

- [ ] **Step 1: Run full build**

  ```bash
  cd /Users/thomas/Documents/GitHub/gyneva-bp && npm run build
  ```

  Expected: builds successfully. The build command runs `prisma generate && next build`.

  If `prisma generate` fails with "engine not found," run `npm run db:push` first (only needed if new Prisma models were added — they weren't in this task, so it should succeed).

- [ ] **Step 2: Verify there are no TypeScript errors in the build output**

  The Next.js build runs `tsc` as part of the process. Look for any `Type error:` lines in the output.

- [ ] **Step 3: Commit spec + plan if not already committed**

  ```bash
  git add docs/superpowers/specs/2026-03-13-navigation-redesign-design.md
  git add docs/superpowers/plans/2026-03-13-navigation-redesign.md
  git commit -m "docs: navigation redesign spec and implementation plan"
  ```

---

## Summary of Changes

| File | Change |
|------|--------|
| `src/app/(app)/layout.module.css` | `margin-left: var(--sidebar-current-w, var(--sidebar-w))`, targeted transition |
| `src/components/Sidebar.tsx` | SVG chevron toggle, `useEffect` syncing `--sidebar-current-w` |
| `src/components/Topbar.tsx` | 6 emoji → SVG, Comparer removed, user name added |
| `src/components/Topbar.module.css` | `.userName` class, `.actionsMenu button` gap `.6rem` |
| `design-system/MASTER.md` | New file — full design system documentation |

**Zero new dependencies.** All SVGs are inline JSX. All CSS uses existing custom properties.
