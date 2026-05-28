# Refactor Plan: Animation Review

## Goal

Create a review and refactor plan for the animation system across the math apps so that shared behaviors, timing models, and motion patterns can be identified, reduced in duplication, and made easier to maintain.

## Current Animation Inventory

### Shared animation primitives

Shared bar, grid, and animation-related styling currently lives in [src/shared/base.css](src/shared/base.css), including:

- `.bar-container`
- `.bar-fill`
- `.grid-overlay`
- `.divider-thin .anim-line`
- `.number-line-wrapper`
- `.animation-zone`
- multiple shared `transition` declarations for bars, inputs, and controls

These styles act as the visual foundation for multiple page-level animations.

### Page-specific animation entry points

Addition in [src/apps/addition/App.tsx](src/apps/addition/App.tsx):

- `currentSpeed` state and `speed-slider` driven timing.
- `applyGridAnimation` for expand/simplify-like grid line transitions.
- setTimeout-based orchestration for common denominator flow.
- drag-and-drop or move-to-target visual assembly of result bars.
- answer-zone opacity reveal.
- number-line and bar resizing updates.

Subtraction in [src/apps/subtraction/App.tsx](src/apps/subtraction/App.tsx):

- `currentSpeed` state and `speed-slider` timing.
- `applyGridAnimation` with line removal and retained-line movement.
- `animateToTrash` for trash-can motion using cloned DOM elements.
- `requestAnimationFrame` usage in motion sequencing.
- drag-block interactions.
- answer-zone reveal and instruction-state transitions.

Multiplication in [src/apps/multiplication/App.tsx](src/apps/multiplication/App.tsx):

- `currentSpeed` state and slider-driven duration scaling.
- `requestAnimationFrame` loop controlling a two-step multiplication explanation.
- progress-bar width updates over time.
- block opacity transitions between discarded, kept, and added states.
- answer-zone reveal in `finishAnimation`.

Division in [src/apps/division/App.tsx](src/apps/division/App.tsx):

- `currentSpeed` state and slider-driven durations.
- `applyGridAnimation` reused for bar/grid updates.
- `startDivisionAnimation` sequencing entry point.
- `buildDivisorMold` visual mold construction and glow feedback.
- `setupManualDragAndFill` for drag setup and interactive measurement.
- `handleDropChunk` with 2-second transition-based motion from source to target.
- answer-zone reveal after all fills complete.

Expanding in [src/apps/expanding/App.tsx](src/apps/expanding/App.tsx):

- `drawProcess` orchestrates expand/simplify divider animations.
- inline transition strings drive `.anim-line` height and color changes.
- timing is derived from factor size and speed slider value.
- visual comparison bars and process redraws are updated imperatively.

### Page-specific animation CSS

App-specific animation styles exist in:

- [src/apps/addition/app.css](src/apps/addition/app.css)
- [src/apps/subtraction/app.css](src/apps/subtraction/app.css)
- [src/apps/multiplication/app.css](src/apps/multiplication/app.css)
- [src/apps/division/app.css](src/apps/division/app.css)
- [src/apps/expanding/app.css](src/apps/expanding/app.css)

Common patterns there include:

- `fadeInSlow` keyframes
- instruction box fades
- answer-zone fades
- drag-block interaction feedback
- button hover/active motion

## Animation Categories

### 1. Grid-line reveal and reduction animations

- Addition, subtraction, and division each implement `applyGridAnimation` with highly similar logic.
- Expanding uses a related divider animation concept in `drawProcess`.

### 2. Bar growth, resize, and redraw animations

- Shared bar container transitions are defined in shared CSS.
- Pages imperatively redraw bars and update widths based on math state.

### 3. Sequenced explanation flows

- Addition and subtraction use `setTimeout`-heavy sequencing.
- Multiplication uses a `requestAnimationFrame` timeline loop.
- Division combines delayed sequencing with drag interaction states.

### 4. Drag and transfer animations

- Addition uses drag blocks to assemble results.
- Subtraction animates pieces toward a trash target.
- Division animates measurement chunks into molds.

### 5. Answer-zone and feedback reveal animations

- Multiple pages use delayed display changes followed by opacity transitions.

### 6. Micro-interactions and UI feedback

- Buttons, draggable blocks, hint actions, and labels use hover/active/fade transitions.

## Cross-Cutting Problems

- Similar animation logic is duplicated across addition, subtraction, and division.
- Timing constants are embedded inline in many places.
- Animation orchestration mixes DOM mutation, state logic, and math logic inside the same functions.
- `innerHTML` string assembly is used for animated DOM generation, which increases fragility and review cost.
- Different pages use different sequencing models for similar UX goals.
- There is no explicit reduced-motion strategy.
- CSS keyframes and transition patterns are duplicated across app CSS files.
- Answer-zone reveal behavior is repeated with minor variations.
- DOM-clone motion patterns are page-specific and not abstracted.
- Selector-based imperative code makes animation failures harder to test.

## Refactor Opportunities

### Shared timing model

- Introduce a shared helper for converting speed-slider values into durations.
- Centralize named timing tokens such as:
  - short fade
  - grid expand
  - grid reduce
  - answer reveal
  - drag travel

### Shared grid animation utilities

- Review whether `applyGridAnimation` in addition, subtraction, and division can be extracted into a shared utility.
- Separate common line-generation logic from operation-specific differences.

### Shared answer reveal utility

- Extract answer-zone show/hide timing into a reusable helper.
- Reduce duplicated `display` plus delayed `opacity` patterns.

### Shared motion primitives

- Review whether clone-and-fly or block-transfer animation can use a common helper for:
  - source rect
  - target rect
  - duration
  - easing
  - cleanup

### CSS consolidation

- Move repeated `fadeInSlow` keyframes and repeated transition styles into shared CSS if behavior is intentionally consistent.
- Keep page-specific CSS only where the visuals genuinely differ.

### Reduced motion support

- Introduce a single reduced-motion switch or media-query strategy.
- Ensure timeline-heavy flows can complete without long waits.

### Rendering safety review

- Review `innerHTML`-based animated markup generation.
- Identify places where DOM node creation helpers or React-rendered fragments would reduce mutation risk.

## Proposed Review/Refactor Sequence

### Phase 1: Inventory and categorize

- Document every animation entry point per page.
- Group them into shared vs page-specific behaviors.
- Record timing constants and easing functions used today.

### Phase 2: Identify duplicated mechanisms

- Compare `applyGridAnimation` across addition, subtraction, and division.
- Compare answer-zone reveal behavior across pages.
- Compare `fadeInSlow` and drag-block styles across page CSS files.

### Phase 3: Stabilize timing contracts

- Create a single timing vocabulary.
- Replace ad hoc numbers with named timing constants.
- Align slider-to-duration conversion logic where possible.

### Phase 4: Extract shared primitives

- Extract shared animation helpers only after duplicated patterns are confirmed.
- Keep operation-specific behaviors local.
- Avoid premature generalization of multiplication and division flows if they remain meaningfully different.

### Phase 5: Add motion accessibility review

- Define expected behavior for reduced-motion users.
- Decide which animations should shorten, skip, or snap to final state.

### Phase 6: Clean up page CSS

- Move repeated keyframes and repeated transition patterns into shared CSS.
- Leave page CSS focused on layout and truly page-specific motion.

## Validation Checklist

- Each page still presents the same teaching sequence after refactor.
- Shared animation helpers reduce duplication without hiding page-specific math behavior.
- Slider-controlled speed remains functional and visually consistent.
- Answer-zone reveal still occurs at the correct moment in each page flow.
- Drag and drop interactions still feel responsive.
- Multiplication `requestAnimationFrame` flow still completes correctly.
- Division mold-fill animation still reaches the correct targets.
- Grid animations still align with the underlying denominator logic.
- Reduced-motion behavior is defined and testable.
- No animation refactor introduces selector drift or stale DOM cleanup issues.