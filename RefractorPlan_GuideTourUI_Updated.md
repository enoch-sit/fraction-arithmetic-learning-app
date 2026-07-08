# Refactor Plan: Unified Guide Content System (Tours + Tooltips)

## Goal

Centralize and unify **ALL guide-related text** (full guided tours + startup light tooltips + shared controls) into one discoverable, maintainable, localization-ready system. Enable both the startup tooltip and tour step #1 to reference the same UI target with properly separated content and wiring.

## Background: Tooltip Transformation

Recently, the project implemented a light-tooltip system alongside the guided tours:
- **Light tooltips** appear on page load with animated visual cues, auto-dismiss, and are non-intrusive
- **Guided tours** provide comprehensive multi-step walkthroughs with full navigation
- **Problem:** The startup tooltip and tour step #1 both target the same element (#frac1-group) but have completely separate text and configuration
- **Opportunity:** Unifying content management will make both systems easier to maintain and localize

## Current State Inventory

### Guided Tour Infrastructure
- Shared tour launcher: [src/shared/components/GuidedTour.tsx](src/shared/components/GuidedTour.tsx)
- Shared styling: [src/shared/base.css](src/shared/base.css)
- Per-page tour steps:
  - [src/shared/tours/addition.ts](src/shared/tours/addition.ts) (5 steps)
  - [src/shared/tours/subtraction.ts](src/shared/tours/subtraction.ts) (5 steps)
  - [src/shared/tours/multiplication.ts](src/shared/tours/multiplication.ts) (5 steps)
  - [src/shared/tours/division.ts](src/shared/tours/division.ts) (5 steps)
  - [src/shared/tours/expanding.ts](src/shared/tours/expanding.ts) (6 steps)
- Wired into all five teaching apps via `<GuidedTour steps={tourSteps} />`

### Light Tooltip Infrastructure
- Shared tooltip helper: [src/shared/components/LightGuideHint.ts](src/shared/components/LightGuideHint.ts)
- Shared banner suppression: [src/shared/components/InstructionBannerVisibility.ts](src/shared/components/InstructionBannerVisibility.ts)
- Light tooltip styling: [src/shared/base.css](src/shared/base.css)
- Wired into each app's `App.tsx` via `useEffect` hook
- Example (addition app):
  ```typescript
  useEffect(() => {
    return showLightGuideHint({
      element: '#frac1-group',
      title: '先試試看',
      description: '點一下上方分數，先看看圖形怎麼出現。',
    })
  }, [])
  ```

### Current Content Fragmentation

**Unified:**
- Shared button labels and navigation controls in [GuidedTour.tsx](src/shared/components/GuidedTour.tsx)
- Shared visual styling in [base.css](src/shared/base.css)

**Scattered:**
1. **Tour step titles & descriptions** — spread across five tour files
2. **Startup tooltip text** — hardcoded in each app's [App.tsx](src/apps/addition/App.tsx)
3. **No shared guide content type** — tour uses `DriveStep`, tooltip uses function parameters

**Critical Problem:**
- Same UI target (#frac1-group) has TWO descriptions:
  - Tour: `"在這裡輸入第一個分數。按 ▲▼ 調整分子和分母..."`
  - Tooltip: `"點一下上方分數，先看看圖形怎麼出現。"`
- Updating one requires touching both files separately
- Terminology can drift between tour and tooltip over time

---

## What Text Belongs to Guide Content System

### Shared Control Labels
- Button label: `?`
- Button title: `使用教學`
- Button aria-label: `guided tour`
- Navigation buttons: `下一步 →`, `← 上一步`, `完成 ✓`
- Progress template: `{{current}} / {{total}}`

### Per-Page Tour Content
- Step titles (e.g., `📝 被加數`, `🎬 動畫區`)
- Step descriptions (rich HTML with <br> tags)

### Per-Page Startup Tooltip Content
- Tooltip title (e.g., `先試試看`)
- Tooltip description (e.g., `點一下上方分數，先看看圖形怎麼出現。`)

### Metadata (NOT text, stays with wiring)
- Element selectors (#frac1-group, #anim-zone, etc.)
- Positioning (side: top/bottom)
- Step order/sequencing
- Timing values (delay, auto-close duration)
- Conditional visibility logic

---

## Problems & Risks

1. **Fragmentation** — Tour and tooltip text are in different files with no clear relationship
2. **Terminology drift** — Same concept described differently in tour vs. tooltip
3. **Maintenance burden** — Updating a guide requires touching multiple files (tour file + app file)
4. **Content audit difficulty** — No single place to review all guide-facing strings
5. **Localization complexity** — Text scattered across multiple files makes translation tracking hard
6. **Reuse limitations** — Can't easily reuse tour step descriptions elsewhere without duplication
7. **Inconsistency** — Tour-to-tooltip naming inconsistencies (e.g., `"被加數"` in tour, `"上方分數"` in tooltip)

---

## Refactor Direction

**Strategy:** Create a unified **PageGuideContent** structure that serves both tours and tooltips.

**Principles:**
1. **Single source of truth** — All guide text for a page lives in one place
2. **Content-wiring separation** — Text content separate from driver.js configuration
3. **Shared controls** — Centralize navigation labels and progress text
4. **Localization-ready** — Structure supports i18n expansion
5. **Type-safe** — TypeScript ensures consistency

### Recommended Content Model

```typescript
// Shared across all pages (single location)
export const SHARED_GUIDE_CONTROLS = {
  buttonLabel: '?',
  buttonTitle: '使用教學',
  buttonAriaLabel: 'guided tour',
  navigation: {
    next: '下一步 →',
    previous: '← 上一步',
    done: '完成 ✓',
  },
  progressTemplate: '{{current}} / {{total}}',
}

// Per-page guide content (one per page)
export type PageGuideContent = {
  controls: typeof SHARED_GUIDE_CONTROLS // Inherit shared controls
  
  // Startup tooltip shown on page load
  startupTooltip: {
    title: string
    description: string
    element: string // CSS selector
    side?: 'top' | 'bottom'
    delay?: number
  }
  
  // Full guided tour steps (shown on demand)
  tourSteps: Array<{
    id: string // Unique identifier (e.g., 'frac1-input')
    title: string // e.g., '📝 被加數'
    description: string // e.g., '在這裡輸入第一個分數...'
    element: string // CSS selector (e.g., '#frac1-group')
    side: 'top' | 'bottom'
  }>
  
  // Fallback content (future use)
  fallback?: {
    emptyTour?: string
    missingTarget?: string
    cannotStart?: string
    tourCompleted?: string
  }
}

// Example: Addition Page Guide Content
export const additionGuideContent: PageGuideContent = {
  controls: SHARED_GUIDE_CONTROLS,
  
  startupTooltip: {
    title: '先試試看',
    description: '點一下上方分數，先看看圖形怎麼出現。',
    element: '#frac1-group',
    side: 'bottom',
    delay: 450,
  },
  
  tourSteps: [
    {
      id: 'frac1-input',
      title: '📝 被加數',
      description: '在這裡輸入第一個分數。<br>按 ▲▼ 調整分子和分母，或直接在格子裡輸入數字。<br>點擊整個方塊可以重設並顯示圖形。',
      element: '#frac1-group',
      side: 'bottom',
    },
    {
      id: 'frac2-input',
      title: '📝 加數',
      description: '在這裡輸入第二個分數。<br>同樣可以用 ▲▼ 按鈕或直接輸入。',
      element: '#frac2-group',
      side: 'bottom',
    },
    // ... more steps
  ],
}
```

---

## Proposed File Structure

### Option A: Per-Page Content Modules (Recommended)

```
src/shared/
├── guides/
│   ├── shared.ts                    # SHARED_GUIDE_CONTROLS + type definitions
│   ├── addition.ts                  # additionGuideContent
│   ├── subtraction.ts               # subtractionGuideContent
│   ├── multiplication.ts             # multiplicationGuideContent
│   ├── division.ts                  # divisionGuideContent
│   └── expanding.ts                 # expandingGuideContent
├── tours/
│   ├── addition.ts                  # Wiring: tours/addition.ts → guide content
│   ├── subtraction.ts               # Wiring: imports additionGuideContent, builds DriveStep[]
│   ├── multiplication.ts
│   ├── division.ts
│   └── expanding.ts
├── components/
│   ├── GuidedTour.tsx               # Renders tour (unchanged)
│   ├── LightGuideHint.ts            # Renders tooltip (unchanged)
│   └── ...
└── base.css                         # All styling (unchanged)
```

### Option B: Locale-First Structure (Future)

```
src/shared/
├── guides/
│   ├── types.ts                     # Type definitions
│   └── locales/
│       ├── zh-Hant.ts               # zh-Hant content for all pages
│       └── en-US.ts                 # en-US content (future)
├── tours/
│   └── [unchanged, imports from locales]
└── ...
```

**Recommendation:** Start with **Option A** (per-page modules) because:
- Lower risk, matches current file ownership
- Easy to expand to Option B later
- Content changes don't require restructuring

---

## Migration Plan

### Phase 1: Inventory & Establish Type Definitions

**Goal:** Document all current text and define the content shape.

- [ ] Extract all tour step titles from five tour files
- [ ] Extract all tour step descriptions
- [ ] Extract all startup tooltip text from app files
- [ ] Extract shared control labels from GuidedTour.tsx
- [ ] Create `PageGuideContent` type definition in [src/shared/guides/shared.ts](src/shared/guides/shared.ts)
- [ ] Create `SHARED_GUIDE_CONTROLS` export
- [ ] Create checklist of all guide-facing strings for review

### Phase 2: Create Per-Page Guide Content Modules

**Goal:** Centralize all text for one page at a time.

For each teaching page (addition, subtraction, multiplication, division, expanding):

- [ ] Create [src/shared/guides/{page}.ts](src/shared/guides/{page}.ts) with `{page}GuideContent: PageGuideContent`
- [ ] Copy tour titles and descriptions from [src/shared/tours/{page}.ts](src/shared/tours/{page}.ts)
- [ ] Copy startup tooltip text from [src/apps/{page}/App.tsx](src/apps/{page}/App.tsx)
- [ ] Set correct element selectors and positioning
- [ ] Include shared controls by reference

**Example:** [src/shared/guides/addition.ts](src/shared/guides/addition.ts)
```typescript
import { SHARED_GUIDE_CONTROLS, PageGuideContent } from './shared'

export const additionGuideContent: PageGuideContent = {
  controls: SHARED_GUIDE_CONTROLS,
  startupTooltip: { /* ... */ },
  tourSteps: [ /* ... */ ],
}
```

### Phase 3: Update Tour Wiring to Use Content

**Goal:** Make tour files use the content modules instead of hardcoding text.

For each tour file:

- [ ] Import guide content: `import { additionGuideContent } from '../guides/addition'`
- [ ] Build `DriveStep[]` from content by mapping:
  ```typescript
  export const additionTourSteps: DriveStep[] = additionGuideContent.tourSteps.map(step => ({
    element: step.element,
    popover: {
      title: step.title,
      description: step.description,
      side: step.side,
    },
  }))
  ```
- [ ] Remove hardcoded step definitions
- [ ] Keep only the transformation logic

### Phase 4: Update App Files to Use Content

**Goal:** Wire startup tooltips from content modules.

For each app (addition, subtraction, multiplication, division, expanding):

- [ ] Import: `import { additionGuideContent } from '../../shared/guides/addition'`
- [ ] Replace hardcoded `useEffect` with:
  ```typescript
  useEffect(() => {
    const { startupTooltip } = additionGuideContent
    return showLightGuideHint({
      element: startupTooltip.element,
      title: startupTooltip.title,
      description: startupTooltip.description,
      delayMs: startupTooltip.delay,
    })
  }, [])
  ```
- [ ] Wire `observeInstructionBannerVisibility` similarly if using from content
- [ ] Remove inline text strings

### Phase 5: Cleanup & Centralize Shared Controls

**Goal:** Ensure shared controls are in one place.

- [ ] Move all control labels from [GuidedTour.tsx](src/shared/components/GuidedTour.tsx) to [src/shared/guides/shared.ts](src/shared/guides/shared.ts)
- [ ] Update GuidedTour to import controls:
  ```typescript
  import { SHARED_GUIDE_CONTROLS } from '../guides/shared'
  
  export default function GuidedTour({ steps }: GuidedTourProps) {
    function startTour() {
      const driverObj = driver({
        showProgress: true,
        showButtons: ['next', 'previous', 'close'],
        nextBtnText: SHARED_GUIDE_CONTROLS.navigation.next,
        prevBtnText: SHARED_GUIDE_CONTROLS.navigation.previous,
        doneBtnText: SHARED_GUIDE_CONTROLS.navigation.done,
        progressText: SHARED_GUIDE_CONTROLS.progressTemplate,
        popoverClass: 'math-tour-popover',
        steps,
      })
      driverObj.drive()
    }
    return <button ... title={SHARED_GUIDE_CONTROLS.buttonTitle} ... />
  }
  ```
- [ ] Remove hardcoded strings from GuidedTour.tsx

### Phase 6: Validation & Testing

**Goal:** Verify all content is properly wired and rendering.

- [ ] Build locally: `npm run build` (no errors)
- [ ] Docker rebuild: `docker-compose up --build -d`
- [ ] Route health check: all pages return 200 OK
- [ ] Manual browser test:
  - [ ] Startup tooltip appears on page load (all 5 pages)
  - [ ] Tour button renders with correct title
  - [ ] Tour starts and navigates correctly (all 5 pages)
  - [ ] Tour shows correct titles and descriptions per step
  - [ ] Navigation buttons show correct labels
  - [ ] Progress text displays correctly
  - [ ] Tour completion text is correct

---

## Validation Checklist

After completing all phases:

- [ ] **Content Inventory Complete**
  - Every tour step title is in a guide content module
  - Every tour step description is in a guide content module
  - Every startup tooltip text is in a guide content module
  - Every shared label is in `SHARED_GUIDE_CONTROLS`

- [ ] **Single Source of Truth**
  - No guide text remains hardcoded in React components
  - No guide text remains hardcoded in tour files
  - No guide text remains hardcoded in app files
  - All text is in `src/shared/guides/` modules

- [ ] **Consistency**
  - Shared control labels appear in only one place
  - No terminology drift between pages (all use consistent terminology)
  - Tour step and startup tooltip are properly related (if same UI target)

- [ ] **TypeScript & Build**
  - No TS compilation errors
  - All imports resolve correctly
  - No missing exports or unused imports

- [ ] **Rendering Verification**
  - Startup tooltips render with correct text
  - Full tours render with correct step text
  - Navigation buttons show correct labels
  - Progress counter displays correctly
  - Page title and aria-label render correctly

- [ ] **Localization Ready**
  - All guide text is in a structure that can be extracted for translation
  - Type definitions support future language variants
  - No inline Japanese, Chinese, or other text scattered in components

- [ ] **Related Guides**
  - Startup banner suppression still works (InstructionBannerVisibility)
  - Light tooltip styling is consistent
  - Tour styling is consistent

---

## File Reference

| File | Purpose | Status |
|------|---------|--------|
| [src/shared/guides/shared.ts](src/shared/guides/shared.ts) | Type definitions + shared controls | To create |
| [src/shared/guides/addition.ts](src/shared/guides/addition.ts) | Addition page guide content | To create |
| [src/shared/guides/subtraction.ts](src/shared/guides/subtraction.ts) | Subtraction page guide content | To create |
| [src/shared/guides/multiplication.ts](src/shared/guides/multiplication.ts) | Multiplication page guide content | To create |
| [src/shared/guides/division.ts](src/shared/guides/division.ts) | Division page guide content | To create |
| [src/shared/guides/expanding.ts](src/shared/guides/expanding.ts) | Expanding page guide content | To create |
| [src/shared/tours/addition.ts](src/shared/tours/addition.ts) | Tour wiring | To update |
| [src/shared/tours/subtraction.ts](src/shared/tours/subtraction.ts) | Tour wiring | To update |
| [src/shared/tours/multiplication.ts](src/shared/tours/multiplication.ts) | Tour wiring | To update |
| [src/shared/tours/division.ts](src/shared/tours/division.ts) | Tour wiring | To update |
| [src/shared/tours/expanding.ts](src/shared/tours/expanding.ts) | Tour wiring | To update |
| [src/shared/components/GuidedTour.tsx](src/shared/components/GuidedTour.tsx) | Tour component | To update |
| [src/apps/addition/App.tsx](src/apps/addition/App.tsx) | Addition app | To update |
| [src/apps/subtraction/App.tsx](src/apps/subtraction/App.tsx) | Subtraction app | To update |
| [src/apps/multiplication/App.tsx](src/apps/multiplication/App.tsx) | Multiplication app | To update |
| [src/apps/division/App.tsx](src/apps/division/App.tsx) | Division app | To update |
| [src/apps/expanding/App.tsx](src/apps/expanding/App.tsx) | Expanding app | To update |

---

## Next Steps

1. **Review & Approval** — Confirm this refactor plan aligns with project goals
2. **Phase 1** — Create type definitions and extract current content
3. **Phase 2-4** — Migrate content and wiring per page
4. **Phase 5-6** — Validate and deploy
5. **Future** — Consider localization expansion (Option B structure)
