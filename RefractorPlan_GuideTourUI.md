# Refactor Plan: Guide Tour UI

## Goal

Create a clear refactor plan for the guided-tour UI so that **all guide-related text** (full tours, startup tooltips, and fallback content) is easy to find, review, localize, update, and reuse without mixing content with step wiring and visual behavior.

## Current State Inventory

### Guided Tour Infrastructure
- Shared guided-tour launcher lives in [src/shared/components/GuidedTour.tsx](src/shared/components/GuidedTour.tsx).
- Shared guided-tour styling lives in [src/shared/base.css](src/shared/base.css).
- Per-page guide-tour step definitions live in:
  - [src/shared/tours/addition.ts](src/shared/tours/addition.ts)
  - [src/shared/tours/subtraction.ts](src/shared/tours/subtraction.ts)
  - [src/shared/tours/multiplication.ts](src/shared/tours/multiplication.ts)
  - [src/shared/tours/division.ts](src/shared/tours/division.ts)
  - [src/shared/tours/expanding.ts](src/shared/tours/expanding.ts)
- GuidedTour is wired into the page header for all five teaching pages.
- The tour engine is `driver.js`.
- Shared control labels in GuidedTour are centralized:
  - `下一步 →`, `← 上一步`, `完成 ✓`
  - progress: `{{current}} / {{total}}`
  - button title: `使用教學`
- Current step counts: 5 steps (addition, subtraction, multiplication, division), 6 steps (expanding)

### Light Tooltip Infrastructure (Recently Added)
- **New:** Shared light-tooltip helper: [src/shared/components/LightGuideHint.ts](src/shared/components/LightGuideHint.ts)
- **New:** Startup banner suppression helper: [src/shared/components/InstructionBannerVisibility.ts](src/shared/components/InstructionBannerVisibility.ts)
- **New:** Light tooltip styling in [src/shared/base.css](src/shared/base.css)
- **New:** Each page now wires a startup light tooltip in addition to the full tour
- Example from addition app:
  ```typescript
  useEffect(() => {
    return showLightGuideHint({
      element: '#frac1-group',
      title: '先試試看',
      description: '點一下上方分數，先看看圖形怎麼出現。',
    })
  }, [])
  ```

### Current Content Distribution
- **Unified:** Shared button labels and controls in [GuidedTour.tsx](src/shared/components/GuidedTour.tsx)
- **Scattered:** Per-page tour step titles and descriptions in five separate tour files
- **Scattered:** Startup light-tooltip text hardcoded in each app's [App.tsx](src/apps/addition/App.tsx) file
- **Problem:** Same "first step" concept exists in TWO places: as tour step #1 AND as startup light tooltip, with different wording

## What Text Belongs to GuidedTour

The following strings should be treated as guided-tour content and documented as part of the tour text system:

- Tour trigger button visible label or icon fallback text.
- Tour trigger button `title` text.
- Tour trigger button `aria-label` text.
- Shared popover navigation labels:
  - next
  - previous
  - done
  - close if customized later
- Shared progress text template.
- Popover titles for every step.
- Popover descriptions for every step.
- Any future empty-state tour text.
- Any future missing-target fallback text when a selector does not resolve.
- Any future error or unsupported-state messaging tied to starting a tour.
- Any future “tour completed” or “restart tour” messaging if added.

The following items are not text content and should remain as metadata or wiring near the step definitions:

- `element` selectors such as `#frac1-group`, `#anim-zone`, `.controls-pill`.
- `side` placement values.
- Step order.
- Any future conditional visibility logic for steps.

### Current Centralized vs Scattered State

Currently centralized:

- Shared button title and navigation labels in [src/shared/components/GuidedTour.tsx](src/shared/components/GuidedTour.tsx).
- Shared visual styling in [src/shared/base.css](src/shared/base.css).

Currently scattered:

- All per-step popover titles.
- All per-step popover descriptions.
- Per-page phrasing differences across the five tour files.

## Problems/Risks

- Tour copy is distributed across five separate files, making audits and wording updates slower.
- Shared labels and per-page labels use different ownership patterns, so text governance is inconsistent.
- Reuse is limited because the text and step metadata are currently coupled in one object shape.
- Localization expansion will be harder if a second language is introduced for tour text.
- Content review is difficult because there is no single inventory of all tour-facing strings.
- Future selector changes may silently break tours, but there is no obvious fallback or content-level review process.
- It is easy for terminology drift to appear between addition, subtraction, multiplication, division, and expanding tours.

## Refactor Direction

Separate guided-tour content from guided-tour wiring.

Recommended direction:

- Keep `DriveStep[]` construction close to the UI because selectors and placement are UI metadata.
- Move all human-facing text into normalized content objects or locale dictionaries.
- Use a per-page content module or locale-driven content map.
- Build each page's `DriveStep[]` by combining:
  - selector metadata
  - placement metadata
  - text content from a structured source

Recommended content model:

```ts
type GuidedTourCopy = {
  buttonTitle: string
  buttonAriaLabel: string
  controls: {
    next: string
    previous: string
    done: string
    progress: string
  }
  steps: Array<{
    id: string
    title: string
    description: string
  }>
  fallback?: {
    missingTarget?: string
    cannotStart?: string
    emptyTour?: string
  }
}
```

This keeps text review separate from DOM selector review.

## Proposed File Structure

Option A: Per-page content modules.

- `src/shared/tours/content/addition.ts`
- `src/shared/tours/content/subtraction.ts`
- `src/shared/tours/content/multiplication.ts`
- `src/shared/tours/content/division.ts`
- `src/shared/tours/content/expanding.ts`
- `src/shared/tours/addition.ts`
- `src/shared/tours/subtraction.ts`
- `src/shared/tours/multiplication.ts`
- `src/shared/tours/division.ts`
- `src/shared/tours/expanding.ts`

Option B: Locale-first structure.

- `src/shared/tours/content/zh-Hant.ts`
- `src/shared/tours/definitions/addition.ts`
- `src/shared/tours/definitions/subtraction.ts`
- `src/shared/tours/definitions/multiplication.ts`
- `src/shared/tours/definitions/division.ts`
- `src/shared/tours/definitions/expanding.ts`

Recommended starting point:

- Use Option A first because it is lower-risk and matches the current per-page file ownership.
- Move to Option B later if broader localization is introduced.

## Migration Plan

### Phase 1: Inventory and freeze current text

- Extract all current tour-facing strings from the five tour files.
- Record them in one reviewable checklist.
- Confirm terminology consistency across pages.
- Confirm whether `aria-label` should stay English or be localized.

### Phase 2: Normalize shared control copy

- Move shared button labels and progress template into one exported content object.
- Stop hardcoding shared labels directly inside `GuidedTour.tsx`.
- Keep `GuidedTour.tsx` focused on rendering and driver.js configuration.

### Phase 3: Separate page copy from step wiring

- For each page, move step `title` and `description` strings into a content module.
- Keep `element` and `side` values in the tour-definition file.
- Compose `DriveStep[]` from metadata plus content.

### Phase 4: Introduce fallback content shape

- Add explicit optional text keys for:
  - missing selector targets
  - empty step list
  - start-tour failure
- Even if these are not rendered yet, define the content shape now so future UI changes do not add ad hoc strings.

### Phase 5: Review and cleanup

- Remove duplicated wording patterns where a shared wording fragment can be standardized.
- Ensure each tour step still points to the intended DOM target.
- Rebuild the app and verify the generated single-file outputs still include the tours.

## Validation Checklist

- Every tour-facing string is discoverable from a single content inventory.
- Shared labels are not hardcoded in more than one place.
- Per-page `DriveStep[]` still resolve to the correct selectors.
- No step loses its `title` or `description` during extraction.
- Traditional Chinese wording remains unchanged unless intentionally edited.
- The trigger button still renders and starts the tour in all five apps.
- `driver.js` still shows progress, navigation buttons, and completion text correctly.
- There is a clear home for future fallback or error text.
- Content review and selector review can be done independently.