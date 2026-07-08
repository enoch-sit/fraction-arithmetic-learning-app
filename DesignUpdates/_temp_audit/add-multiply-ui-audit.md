# Addition and Multiplication UI Audit

## Purpose

This audit compares the incoming standalone colleague updates with the current React implementation for addition and multiplication. The decision rule for this review is strict: preserve the existing shared tooltip system, guided tour targeting, and shared CSS foundation unless a change has clear visual value and can be absorbed without breaking those protected surfaces.

## Inputs Reviewed

### Incoming reference HTML
- `DesignUpdates/Re_ Protecting our code/FractionApp44(Addition).html`
- `DesignUpdates/Re_ Protecting our code/FractionApp45(Multiplication).html`

### Current React implementation
- `src/apps/addition/App.tsx`
- `src/apps/addition/app.css`
- `src/apps/multiplication/App.tsx`
- `src/apps/multiplication/app.css`

### Protected shared surfaces
- `src/shared/base.css`
- `src/shared/components/LightGuideHint.ts`
- `src/shared/components/GuidedTour.tsx`
- `src/shared/guides/addition.ts`
- `src/shared/guides/multiplication.ts`
- related tour target selectors such as `#frac1-group`, `#frac2-group`, `#anim-zone`, `.controls-pill`, and `#bottom-answer-zone`

## Protected Surfaces

These areas should be treated as preserve-by-default:

1. Shared tooltip behavior driven by `showLightGuideHint()` and page guide content.
2. Guided tour selector targets already wired to the current DOM.
3. Shared visual language in `src/shared/base.css`, especially popover and controls styling.
4. Current app-specific CSS that already matches the shared system and does not block future redesign.

### Main risk to avoid

The colleague HTML files are standalone, inline-style, inline-script heavy documents with their own tutorial cue layers. Copying them directly would create selector drift, duplicate guidance systems, and CSS fragmentation. The safer path is selective re-implementation inside the existing React and shared-style structure.

## Executive Summary

### Addition
- The incoming addition HTML is very close to the current React addition page in layout, structure, and baseline styling.
- Most of the visible value is already present in the React version.
- The largest differences are tutorial-hand affordances, some header styling details, and standalone inline-script behavior.
- Recommendation: keep the current React architecture and shared tooltip system. Adopt only minor visual touches if they still fit the shared CSS approach.

### Multiplication
- The incoming multiplication HTML is also structurally close to the current React page, but it adds a separate finger-based teaching layer and exposes stronger standalone choreography in the page script.
- The current React page already preserves the major instructional layout while using the shared tooltip infrastructure.
- Recommendation: preserve the current tooltip and guided-tour model; only adapt visual polish, not the standalone tutorial overlay logic.

## Region Audit: Addition

### Header and settings controls
Current React:
- Uses shared header and controls components, which keeps this page aligned with the rest of the app family.
- Styling inherits from the shared base system rather than local inline blocks.

Incoming HTML:
- Uses a standalone `.header-controls` and `.settings-group` block with a random button and direct inline wiring.
- Visual treatment is polished but not materially different in information architecture.

Overlap with tooltip or CSS work:
- Low tooltip risk.
- Medium CSS risk if copied directly, because the standalone file would bypass shared header and controls components.

Recommendation:
- Adapt only minor spacing or surface polish if desired.
- Do not replace the shared header or controls architecture.

Decision: adapt
Impact type: local CSS, shared CSS

### Fraction input cards and formula zone
Current React:
- Uses the existing fraction stepper and current DOM targets such as `#frac1-group` and `#frac2-group` that are already tied to tooltip and tour content.
- Startup tooltip for addition targets `#frac1-group`.

Incoming HTML:
- Presents the same basic formula-zone structure and click-to-show interactions.
- Uses standalone input and click wiring directly in the HTML.

Overlap with tooltip or CSS work:
- High selector risk if structure changes remove or rename `#frac1-group` or `#frac2-group`.
- Low visual gain relative to current implementation because the structure is already close.

Recommendation:
- Preserve current DOM landmarks and guide targets.
- Only adopt very small presentation details if they do not disturb selector continuity.

Decision: keep current
Impact type: structure, tooltip or tour selector risk

### Instruction banner and startup guidance
Current React:
- Uses `observeInstructionBannerVisibility()` and `showLightGuideHint()` with content from `additionGuideContent`.
- Also includes state-based tooltip follow-ups through `instructionStateTracker`.

Incoming HTML:
- Uses an in-page instruction banner and a separate `#tutorial-hand` element with very high z-index.
- The banner is designed as the primary live teaching channel.

Overlap with tooltip or CSS work:
- Very high conflict with the current tooltip system.
- The incoming hand cue layer would duplicate or visually compete with existing light guide hints.

Recommendation:
- Do not adopt the standalone tutorial-hand system.
- If you want a stronger cue, adapt that idea inside the existing tooltip engine rather than adding a second guidance layer.

Decision: reject direct adoption
Impact type: behavior, shared CSS, tooltip or tour selector risk

### Animation zone and bar layout
Current React:
- Uses the same broad bar layout model, drag workflow, number-line option, and answer reveal structure.
- Local CSS already supports drag-over highlighting and unit dragging.

Incoming HTML:
- Uses a visually similar multi-row layout with drag blocks and a merge area.
- Script and styles are tightly coupled in the standalone file.

Overlap with tooltip or CSS work:
- Low tooltip risk if structure remains stable.
- Medium behavior risk if standalone logic is copied because the React version already has custom tracker and drag systems.

Recommendation:
- Keep the current implementation as the baseline.
- Review only isolated visual details such as spacing, shadow depth, or instruction-zone sizing.

Decision: keep current
Impact type: behavior, local CSS

### Answer zone
Current React:
- Already uses `#bottom-answer-zone`, which is a protected selector used by guides and current tooltip planning.
- Styling and reveal behavior already align with the shared app family.

Incoming HTML:
- Very similar answer-zone structure, with little additional visual value.

Overlap with tooltip or CSS work:
- High selector sensitivity, low redesign value.

Recommendation:
- Keep the current answer-zone structure and selector intact.
- Do not rebuild this region from the standalone file.

Decision: keep current
Impact type: structure, tooltip or tour selector risk

### Responsive behavior
Current React:
- Uses an app-level mobile breakpoint and keeps the shared visual model intact.

Incoming HTML:
- Uses a nearly identical single-breakpoint responsive approach.

Overlap with tooltip or CSS work:
- Low risk.

Recommendation:
- No meaningful migration value from the incoming file here.

Decision: defer
Impact type: local CSS

## Region Audit: Multiplication

### Header and settings controls
Current React:
- Uses shared header and controls patterns, matching the rest of the product.

Incoming HTML:
- Uses the same standalone settings-group pattern as addition and includes the random button.

Overlap with tooltip or CSS work:
- Low tooltip risk, medium shared CSS duplication risk.

Recommendation:
- Preserve shared header and controls components.
- Only adapt small presentation details if there is a strong visual preference.

Decision: adapt
Impact type: local CSS, shared CSS

### Fraction inputs and trigger flow
Current React:
- Startup tooltip targets `#frac1-group` using `multiplicationGuideContent`.
- The page uses the current guided tour target model and separate React event flow.

Incoming HTML:
- Keeps the same conceptual structure, but also makes the operator and right-hand fraction part of the standalone trigger flow.

Overlap with tooltip or CSS work:
- High selector and flow risk if the formula zone is restructured.

Recommendation:
- Keep the current DOM target structure and guide targeting.
- Do not import the standalone trigger behavior wholesale.

Decision: keep current
Impact type: structure, behavior, tooltip or tour selector risk

### Instruction banner and tutorial finger
Current React:
- Uses shared tooltip and startup guide infrastructure.
- Keeps the banner tied to the existing app flow without introducing a competing overlay guide.

Incoming HTML:
- Adds `#tutorial-finger`, idle and hover timing, and a separate tutorial state machine.
- This is the clearest visual difference from the current implementation.

Overlap with tooltip or CSS work:
- Very high conflict with the existing tooltip architecture.
- Also introduces competing z-index and timing layers.

Recommendation:
- Reject direct adoption of the tutorial finger system.
- If this cue feels useful, translate only the teaching intent into the existing guide and tooltip framework.

Decision: reject direct adoption
Impact type: behavior, shared CSS, tooltip or tour selector risk

### Animation zone and main bar presentation
Current React:
- Already implements the main instructional layout, number line behavior, and phased multiplication visualization.
- Local CSS intentionally increases bar height and line thickness for multiplication.

Incoming HTML:
- Very close to current visual structure and dimensions.
- Strongest difference is that the standalone file tightly couples visuals and script timing.

Overlap with tooltip or CSS work:
- Low guide conflict, medium logic coupling risk.

Recommendation:
- Keep the current React animation structure.
- Only adopt small styling details if they can be isolated to local CSS.

Decision: keep current
Impact type: behavior, local CSS

### Answer zone
Current React:
- Uses protected selector `#bottom-answer-zone` and current guide targeting.

Incoming HTML:
- Similar answer-zone composition with little net gain.

Overlap with tooltip or CSS work:
- High selector sensitivity, low visual upside.

Recommendation:
- Keep current implementation unchanged.

Decision: keep current
Impact type: structure, tooltip or tour selector risk

### Responsive behavior
Current React:
- Keeps a compact responsive rule set and aligns with the current shared visual language.

Incoming HTML:
- Uses nearly the same responsive structure.

Recommendation:
- Defer changes here unless a later visual redesign requires it.

Decision: defer
Impact type: local CSS

## Cross-Cutting Findings

### What is safe to adopt
- Small spacing, radius, shadow, or surface-polish adjustments that can be expressed in the current page CSS.
- Minor header presentation tweaks if they do not replace shared components.
- Cosmetic refinements to the instruction banner presentation, provided they stay inside the current shared tooltip and banner model.

### What should be adapted, not copied
- Any visual cue from the standalone tutorial hand or finger systems.
- Any standalone header-controls treatment that duplicates existing shared components.
- Any animation polish tied to inline scripts in the incoming HTML.

### What should not be adopted directly
- Standalone tutorial hand or finger overlays.
- Inline-script control flow from the incoming HTML files.
- Inline CSS blocks as a source of truth for these pages.
- Any DOM restructuring that changes guide target selectors.

## Recommended Next Changes

1. Create the visual comparison page and review both current pages next to the colleague HTML before changing any source code.
2. If you want visual updates, start with page-local CSS only in addition and multiplication, not shared components.
3. Preserve `#frac1-group`, `#frac2-group`, `#anim-zone`, `.controls-pill`, and `#bottom-answer-zone` unless you are also planning a guide-selector remediation pass.
4. Treat tutorial-hand and tutorial-finger ideas as inspiration for future improvements to the existing tooltip system, not as direct imports.

## Decision Matrix

| Region | Addition | Multiplication | Reason |
| --- | --- | --- | --- |
| Header and settings | Adapt | Adapt | Small visual differences, but shared component architecture should remain |
| Fraction input zone | Keep current | Keep current | Protected selectors already used by tooltip and tour content |
| Instruction and startup guidance | Reject direct adoption | Reject direct adoption | Standalone tutorial overlays conflict with current tooltip system |
| Animation zone layout | Keep current | Keep current | Current React structure already captures the instructional model |
| Answer zone | Keep current | Keep current | Protected selector with minimal visual upside from incoming HTML |
| Responsive behavior | Defer | Defer | No meaningful redesign advantage from the incoming files |

## Bottom Line

The incoming addition and multiplication HTML files are useful as visual references, but they do not justify a structural rewrite. The current React implementation already covers most of the same UI ideas while preserving shared tooltips, tours, and CSS. The strongest recommendation is to keep the existing structure and selectively borrow only low-risk visual polish from the colleague files.