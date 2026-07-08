# Addition Playwright Capture Plan

## Goal

Use Playwright to capture paired screenshots that illustrate behavior differences between:

- prototype: [FractionApp47(Addition).html](c:\Users\user\Documents\ThankGodForJesusChrist\ThankGodForAILearningApp\mathaddsubtraactdividemulti-react\DesignUpdates\FractionApp47(Addition).html)
- React app: [App.tsx](c:\Users\user\Documents\ThankGodForJesusChrist\ThankGodForAILearningApp\mathaddsubtraactdividemulti-react\src\apps\addition\App.tsx) served at `http://localhost:3050/addition`

This plan is for audit evidence. It is not a visual regression plan.

## Capture Principles

1. Capture paired states, not random screens.
2. Reset both apps before every state.
3. Wait for a concrete UI condition before screenshotting.
4. Use the same state number and filename for prototype and React captures.
5. Prefer settled states over in-motion frames unless the animation itself is the audit target.

## Output Structure

```text
screenshots/
  audit-runs/
    YYYY-MM-DD/
      prototype/
        01-startup-fresh.png
        02-startup-idle-3p5s.png
        03-frac1-revealed.png
        04-both-fracs-revealed.png
        05-expand-result.png
        06-common-denom-ready.png
        07-error-merge.png
        08-all-merged.png
        09-answer-correct.png
      react/
        01-startup-fresh.png
        02-startup-idle-3p5s.png
        03-frac1-revealed.png
        04-both-fracs-revealed.png
        05-expand-result.png
        06-common-denom-ready.png
        07-error-merge.png
        08-all-merged.png
        09-answer-correct.png
      comparison-index.md
```

## Source Loading Plan

### React source

- URL: `http://localhost:3050/addition`
- Reset method: fresh navigation to the route

### Prototype source

- Preferred: serve the prototype HTML over local HTTP
- Avoid relying on `file://` unless browser loading is already proven stable
- Reset method: fresh navigation to the served prototype URL

Recommended local prototype route example:

- `http://localhost:<prototype-port>/FractionApp47(Addition).html`

## Shared Reset Rule

Before each capture:

1. navigate fresh
2. wait for page load
3. wait for `#frac1-group`
4. add a short paint buffer of about `100ms` to `200ms`

## Selector Map

These selectors should be valid on both the prototype and React app unless proven otherwise.

### Primary controls

- `#frac1-group`
- `#frac2-group`
- `#show-whole-cb`
- `#show-nl-cb`
- `#speed-slider`
- `#drag-instruction`
- `#word-problem`

### Flow containers

- `#bar1-row`
- `#bar2-row`
- `#bar3-row`
- `#bottom-answer-zone`
- `#anim-area`

### Answer inputs

- `#ans-w`
- `#ans-num`
- `#ans-den`
- `#feedback`

### Prototype-only or likely divergent selectors

- `#tutorial-hand`
- `#bar-error-row`
- `#bar-error-wrap`
- `#bar-error-nl`

### React-only or likely divergent selectors

- `.tutorial-finger`
- `.startup-cue-active`
- `.driver-popover`

## Capture State Checklist

### 01. Startup fresh

Purpose:

- compare first-load teaching surface
- compare startup cue visibility

Prototype setup:

- load fresh only

React setup:

- load fresh only

Wait for:

- `#frac1-group`
- `#drag-instruction`

Look for:

- prototype tutorial-hand presence or startup emphasis
- React finger overlay presence
- instruction banner starting state

### 02. Startup idle 3.5s

Purpose:

- audit the missing inactivity-driven tutorial behavior

Prototype setup:

- fresh load
- wait `3500ms`

React setup:

- fresh load
- wait `3500ms`

Wait for:

- prototype: `#tutorial-hand` visible if idle teaching starts
- React: check whether `.tutorial-finger` still exists or whether no new help appears

Look for:

- prototype idle teaching hand
- React absence of equivalent recurring idle guidance

### 03. First fraction revealed

Purpose:

- compare first interaction transition

Prototype setup:

- click `#frac1-group`

React setup:

- click `#frac1-group`

Wait for:

- `#bar1-row` visible

Look for:

- first bar reveal
- banner text update
- any tooltip/help change

### 04. Both fractions revealed

Purpose:

- compare mid-setup learner state

Prototype setup:

- click `#frac1-group`
- click `#frac2-group`

React setup:

- click `#frac1-group`
- click `#frac2-group`

Wait for:

- `#bar1-row` visible
- `#bar2-row` visible

Look for:

- reveal sequencing
- banner guidance after both rows appear

### 05. Expand result

Purpose:

- compare settled post-expand state instead of in-motion animation

Prototype setup:

- reveal both fractions
- click first expand button in `#bar1-row .tool-btn`

React setup:

- reveal both fractions
- click first expand button in `#bar1-row .tool-btn`

Wait for:

- post-click settle buffer of about `700ms`

Look for:

- changed denominator grid state
- instruction update after expansion

### 06. Common denominator ready

Purpose:

- compare the pivot state when merge becomes valid

Prototype setup:

- reveal both fractions
- expand the smaller denominator side until denominators match

React setup:

- reveal both fractions
- expand the smaller denominator side until denominators match

Wait for:

- `#bar3-row` visible

Look for:

- merge area appearance
- instruction change to merge guidance
- number-line behavior if enabled

### 07. Error merge

Purpose:

- compare the wrong-path teaching flow before common denominator is ready

Prototype setup:

- reveal both fractions
- without matching denominators, drag a block from one bar toward the other bar or wrong target

React setup:

- reveal both fractions
- without matching denominators, drag a block from one bar toward the other bar or wrong target

Wait for:

- prototype: `#bar-error-row` visible
- React: error-state visual or banner guidance update

Look for:

- error merge teaching surface
- error number-line presence if enabled
- instruction difference between prototype and React

### 08. All merged

Purpose:

- compare completion cleanup and answer-zone reveal

Prototype setup:

- reach common denominator ready state
- move or drag all required blocks into merge result

React setup:

- reach common denominator ready state
- move or drag all required blocks into merge result

Wait for:

- `#bottom-answer-zone` visible

Look for:

- source row fade-out versus immediate hide
- answer-zone reveal timing
- final merge state labeling

### 09. Answer correct

Purpose:

- compare final correctness feedback

Prototype setup:

- reach all-merged state
- fill `#ans-num` and `#ans-den` with the correct answer

React setup:

- reach all-merged state
- fill `#ans-num` and `#ans-den` with the correct answer

Wait for:

- `#feedback` visible or opacity changed

Look for:

- success feedback text
- simplification or LCM hint behavior

## Runtime Notes Per State

### Idle teaching state

- this is the most important screenshot pair because it supports the strongest missing-feature claim

### Drag states

- use deterministic drag logic
- if full drag is flaky, document and fall back to click-to-move where that still demonstrates the target state

### Number-line variants

- default capture set can run with number line off
- if needed, add a second pass with `#show-nl-cb` enabled for states `06`, `07`, and `08`

## Suggested Playwright Flow Shape

For each state:

1. reset prototype page
2. reset React page
3. run prototype setup
4. wait for stabilization selector
5. capture prototype screenshot
6. run React setup
7. wait for stabilization selector
8. capture React screenshot

## Suggested Comparison Index Markdown

Each screenshot pair entry should include:

- state id
- audit theme
- prototype image path
- React image path
- what the reviewer should look for
- current parity expectation

Example structure:

```md
## 02 Startup Idle 3.5s

- Theme: Teaching surfaces
- Expected finding: prototype has recurring idle guidance, React does not
- Prototype: `prototype/02-startup-idle-3p5s.png`
- React: `react/02-startup-idle-3p5s.png`
- Reviewer prompt: Look for a tutorial hand or equivalent passive teaching cue after idle time.
```

## Known Blockers

### Prototype loading

- if `file://` loading is unstable, use a local HTTP server before implementing Playwright capture code

### Drag-and-drop reproducibility

- drag setup may require source-specific handling
- treat drag as a separate proof-of-work step before automating all states

### Timing drift

- both versions use timers and animation delays
- stabilization should prefer visible selectors over hardcoded waits whenever possible

## First Capture Pass Recommendation

If implementation starts incrementally, do these first:

1. `01-startup-fresh`
2. `02-startup-idle-3p5s`
3. `07-error-merge`
4. `08-all-merged`

These four will provide the fastest evidence for the most important parity questions.
