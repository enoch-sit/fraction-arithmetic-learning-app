# Fraction Comparison Plan

## Abstract Component Map

### Page Shell
- `comparison.html`: page entry for the single-file build pipeline.
- `src/apps/comparison/main.tsx`: React bootstrap.
- `src/apps/comparison/App.tsx`: page-level coordinator for state, rendering, and interactions.
- `src/apps/comparison/app.css`: comparison-specific layout and interaction styling layered on shared base styles.

### Shared Reuse Layer
- `AppHeader`: preserves the same header split used across the current apps.
- `LangBtn`: reusable control button for mode changes and quick actions.
- `src/shared/base.css`: visual tokens, background, header, button, and popover baseline.

### Comparison App Local Components
- `ComparisonToolbar`: logical section inside `App.tsx` for count selector, mode toggle, quick width actions, and number-line toggle.
- `FractionInputCard`: local render branch for integer, fraction, and mixed-number input forms.
- `ComparisonRow`: local render branch for each labeled bar and its optional number line.
- `NumberLine`: local SVG-like tick layout rendered from the shared denominator scale.
- `ComparisonState`: app-local state model for fraction entries, width percentages, vertical offsets, and view flags.
- `PointerInteractionLayer`: app-local pointer logic for width dragging, snapping, and vertical reordering.

### State Boundaries
- Shared reusable shell components stay stateless.
- Math value normalization and scale calculation live in `App.tsx`.
- Mode 2 width drag and vertical drag remain app-local until a second app proves the abstraction is reusable.

## Execution Order
1. Wire the new page into the build, hub, and routing.
2. Implement the app-local state model and Mode 1 rendering.
3. Add the optional number line.
4. Add Mode 2 width drag, snap behavior, and mismatch feedback.
5. Add vertical drag offsets.
6. Validate with build and lint.

## Critical Decisions
- Do not port the prototype's global `document` event blocking.
- Do not start with a generic `ComparisonEngine` abstraction.
- Keep the first implementation inside the comparison app and only extract shared code after behavior is stable.