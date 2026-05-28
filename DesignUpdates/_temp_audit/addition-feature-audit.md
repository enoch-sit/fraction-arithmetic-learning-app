# Addition Feature Audit

## Scope

This audit compares behavior in [FractionApp47(Addition).html](c:\Users\user\Documents\ThankGodForJesusChrist\ThankGodForAILearningApp\mathaddsubtraactdividemulti-react\DesignUpdates\FractionApp47(Addition).html) against the React/TypeScript addition implementation in [App.tsx](c:\Users\user\Documents\ThankGodForJesusChrist\ThankGodForAILearningApp\mathaddsubtraactdividemulti-react\src\apps\addition\App.tsx).

The React app is the style oracle. This document ignores visual-only differences unless they change behavior.

Included:

- startup guidance behavior
- fraction input and setup flow
- random challenge and word problem behavior
- bar rendering and expand/simplify logic
- drag/drop and click-to-move behavior
- mismatched denominator flow
- common denominator flow
- answer checking and completion flow
- number line and whole-number mode behavior
- state transitions and teaching surfaces

Excluded:

- colors, spacing, typography, and layout polish
- componentization differences that do not alter behavior
- CSS-only motion differences unless they change learner flow or state timing

## Parity Status Legend

- `Match`: behavior appears equivalent
- `Changed Intentionally`: behavior differs but looks like a product choice
- `Missing/Inconsistent`: likely parity gap or regression
- `Needs Runtime Audit`: code suggests a possible difference that still needs browser verification

## Audit Matrix

| Theme | Prototype Behavior | React Behavior | Status | Owning React Code | Audit Notes | Action |
| --- | --- | --- | --- | --- | --- | --- |
| Startup cue | Uses startup highlight plus tutorial hand on first target | Uses `TutorialFingerOverlay` plus `startup-cue-active` lifecycle | Changed Intentionally | [App.tsx](c:\Users\user\Documents\ThankGodForJesusChrist\ThankGodForAILearningApp\mathaddsubtraactdividemulti-react\src\apps\addition\App.tsx), [TutorialFingerOverlay.tsx](c:\Users\user\Documents\ThankGodForJesusChrist\ThankGodForAILearningApp\mathaddsubtraactdividemulti-react\src\shared\components\TutorialFingerOverlay.tsx) | React replaces raw DOM tutorial-hand positioning with reusable overlay logic | Confirm intentional change |
| Inactivity tutorial hand | Starts after inactivity or hover-still conditions and points to next action with click/drag animation | No inactivity-driven automatic teaching hand found | Missing/Inconsistent | [App.tsx](c:\Users\user\Documents\ThankGodForJesusChrist\ThankGodForAILearningApp\mathaddsubtraactdividemulti-react\src\apps\addition\App.tsx), [TutorialFingerOverlay.tsx](c:\Users\user\Documents\ThankGodForJesusChrist\ThankGodForAILearningApp\mathaddsubtraactdividemulti-react\src\shared\components\TutorialFingerOverlay.tsx) | Highest-risk teaching-flow gap relative to prototype | Needs browser verification |
| Instruction banner messaging | Inline messages are set directly inside flow functions | Messages are driven by `InstructionStateTracker` state transitions | Changed Intentionally | [App.tsx](c:\Users\user\Documents\ThankGodForJesusChrist\ThankGodForAILearningApp\mathaddsubtraactdividemulti-react\src\apps\addition\App.tsx), [instructionStateTracker.ts](c:\Users\user\Documents\ThankGodForJesusChrist\ThankGodForAILearningApp\mathaddsubtraactdividemulti-react\src\shared\utils\instructionStateTracker.ts) | React makes teaching flow explicit and centralized | Confirm intentional change |
| State-based tooltips | Prototype relies on banner text and tutorial hand instead of a shared tooltip system | React invokes `showLightGuideHint()` for selected states | Changed Intentionally | [App.tsx](c:\Users\user\Documents\ThankGodForJesusChrist\ThankGodForAILearningApp\mathaddsubtraactdividemulti-react\src\apps\addition\App.tsx), [LightGuideHint.ts](c:\Users\user\Documents\ThankGodForJesusChrist\ThankGodForAILearningApp\mathaddsubtraactdividemulti-react\src\shared\components\LightGuideHint.ts), [addition.ts](c:\Users\user\Documents\ThankGodForJesusChrist\ThankGodForAILearningApp\mathaddsubtraactdividemulti-react\src\shared\guides\addition.ts) | Separate from startup cue and guided tour; audit as its own teaching surface | Confirm intentional change |
| Manual guided tour | Not present in the prototype | Present via shared driver.js guided tour | Changed Intentionally | [GuidedTour.tsx](c:\Users\user\Documents\ThankGodForJesusChrist\ThankGodForAILearningApp\mathaddsubtraactdividemulti-react\src\shared\components\GuidedTour.tsx), [addition.ts](c:\Users\user\Documents\ThankGodForJesusChrist\ThankGodForAILearningApp\mathaddsubtraactdividemulti-react\src\shared\tours\addition.ts) | Additional help surface in React, not prototype parity target by default | Leave as intentional |
| Whole-number toggle | Shows/hides whole-number inputs and resets values when disabled | Same behavior is present | Match | [App.tsx](c:\Users\user\Documents\ThankGodForJesusChrist\ThankGodForAILearningApp\mathaddsubtraactdividemulti-react\src\apps\addition\App.tsx) | Validate edge cases only | No action |
| Number line toggle | Re-renders bars and number lines, including continuous mode behavior | Same broad pattern appears implemented | Needs Runtime Audit | [App.tsx](c:\Users\user\Documents\ThankGodForJesusChrist\ThankGodForAILearningApp\mathaddsubtraactdividemulti-react\src\apps\addition\App.tsx) | Confirm `continuous` class and boundary labels match prototype | Needs browser verification |
| Random challenge | Generates denominators, numerators, optional mixed-number conversion, and injects one of several word problems | Same template-driven random challenge exists | Match | [App.tsx](c:\Users\user\Documents\ThankGodForJesusChrist\ThankGodForAILearningApp\mathaddsubtraactdividemulti-react\src\apps\addition\App.tsx) | Verify mixed-number randomization branch in runtime | No action |
| Word problem display | Shows generated word problem when a template is active | Same dynamic word problem flow appears implemented | Match | [App.tsx](c:\Users\user\Documents\ThankGodForJesusChrist\ThankGodForAILearningApp\mathaddsubtraactdividemulti-react\src\apps\addition\App.tsx) | Low risk | No action |
| First/second fraction reveal flow | Clicking each fraction reveals its row and updates teaching state implicitly | Clicking each fraction reveals its row and updates tracker state explicitly | Match | [App.tsx](c:\Users\user\Documents\ThankGodForJesusChrist\ThankGodForAILearningApp\mathaddsubtraactdividemulti-react\src\apps\addition\App.tsx) | React is more explicit but behavior looks aligned | No action |
| Expand/simplify tools | Adjust scalars and rerender bars with animated grid transitions | Same behavior appears implemented | Match | [App.tsx](c:\Users\user\Documents\ThankGodForJesusChrist\ThankGodForAILearningApp\mathaddsubtraactdividemulti-react\src\apps\addition\App.tsx) | Timing still worth spot-checking | No action |
| Grid animation | Uses expansion/simplification line animations tied to speed | Same animation logic exists in React imperative flow | Needs Runtime Audit | [App.tsx](c:\Users\user\Documents\ThankGodForJesusChrist\ThankGodForAILearningApp\mathaddsubtraactdividemulti-react\src\apps\addition\App.tsx) | Verify timing and transition sequencing, not appearance | Needs browser verification |
| Mismatched denominator exploration | Dragging before common denominator triggers error merge teaching flow | Same broad logic appears implemented with tracker support | Needs Runtime Audit | [App.tsx](c:\Users\user\Documents\ThankGodForJesusChrist\ThankGodForAILearningApp\mathaddsubtraactdividemulti-react\src\apps\addition\App.tsx), [instructionStateTracker.ts](c:\Users\user\Documents\ThankGodForJesusChrist\ThankGodForAILearningApp\mathaddsubtraactdividemulti-react\src\shared\utils\instructionStateTracker.ts) | Need to confirm exact trigger conditions and resulting guidance | Needs browser verification |
| Error merge number line | Prototype renders special error-line visualization when enabled | React likely does the same, but this needs direct verification | Needs Runtime Audit | [App.tsx](c:\Users\user\Documents\ThankGodForJesusChrist\ThankGodForAILearningApp\mathaddsubtraactdividemulti-react\src\apps\addition\App.tsx) | Medium risk because it is easy to miss boundary behavior | Needs browser verification |
| Click-to-move blocks | Blocks can be clicked to move as well as dragged | React also wires direct move helpers | Match | [App.tsx](c:\Users\user\Documents\ThankGodForJesusChrist\ThankGodForAILearningApp\mathaddsubtraactdividemulti-react\src\apps\addition\App.tsx) | Important for touch/fallback semantics | No action |
| Drag-to-merge blocks | Uses drag-and-drop plus undo by clicking merged blocks | React appears to preserve both patterns | Needs Runtime Audit | [App.tsx](c:\Users\user\Documents\ThankGodForJesusChrist\ThankGodForAILearningApp\mathaddsubtraactdividemulti-react\src\apps\addition\App.tsx), [unitDragSystem.ts](c:\Users\user\Documents\ThankGodForJesusChrist\ThankGodForAILearningApp\mathaddsubtraactdividemulti-react\src\shared\utils\unitDragSystem.ts) | Confirm active drag path is the intended one and not vestigial | Needs browser verification |
| Common denominator ready flow | Unlocks merge result area and changes teaching message | Same broad flow plus tracker state appears implemented | Match | [App.tsx](c:\Users\user\Documents\ThankGodForJesusChrist\ThankGodForAILearningApp\mathaddsubtraactdividemulti-react\src\apps\addition\App.tsx), [instructionStateTracker.ts](c:\Users\user\Documents\ThankGodForJesusChrist\ThankGodForAILearningApp\mathaddsubtraactdividemulti-react\src\shared\utils\instructionStateTracker.ts) | Verify message ordering | No action |
| Completion cleanup | Prototype fades source rows out over 0.8s before removing layout space | React likely hides without the same fade choreography | Missing/Inconsistent | [App.tsx](c:\Users\user\Documents\ThankGodForJesusChrist\ThankGodForAILearningApp\mathaddsubtraactdividemulti-react\src\apps\addition\App.tsx) | This is behavioral feedback, not just style, because it affects completion pacing | Needs browser verification |
| Answer-zone reveal | Shows final answer area after all blocks are merged | Same broad reveal flow appears implemented | Match | [App.tsx](c:\Users\user\Documents\ThankGodForJesusChrist\ThankGodForAILearningApp\mathaddsubtraactdividemulti-react\src\apps\addition\App.tsx) | Check sequencing with completion cleanup | No action |
| Answer validation | Accepts equivalent values, flags simplification/mixed-number opportunities, and warns when denominator is not LCM-based | Same validation logic appears present | Match | [App.tsx](c:\Users\user\Documents\ThankGodForJesusChrist\ThankGodForAILearningApp\mathaddsubtraactdividemulti-react\src\apps\addition\App.tsx) | Low risk but still worth edge-case testing | No action |
| Keyboard/restriction behavior | Blocks right-click and several shortcuts | React does not do this | Changed Intentionally | No direct React equivalent | Treat as product/platform policy difference unless explicitly required | Leave as intentional |

## Theme-by-Theme Audit Notes

### 1. Teaching Surfaces

The prototype has one main automatic teaching surface: the tutorial hand plus inline instruction text. The React app splits that into multiple surfaces:

- startup finger overlay
- instruction banner state machine
- contextual light-guide tooltips
- manual guided tour

This is the biggest audit area because parity cannot be judged by looking at a single hint mechanism.

Current verdict: `Changed Intentionally`, with one likely gap around the missing inactivity-based tutorial hand.

### 2. Input and Setup Flow

The fraction input, whole-number toggle, number-line toggle, speed control, and random challenge behavior appear structurally aligned. The React app uses shared UI components, but the behavior still appears owned by imperative logic in [App.tsx](c:\Users\user\Documents\ThankGodForJesusChrist\ThankGodForAILearningApp\mathaddsubtraactdividemulti-react\src\apps\addition\App.tsx).

Current verdict: `Mostly Match`.

### 3. Expand, Simplify, and Denominator Flow

Both versions calculate expansion/simplification via scalar multipliers and use grid-line transitions. Common-denominator readiness appears to be the pivot point for switching from exploratory/error behavior to merge behavior.

Current verdict: `Match`, pending runtime verification of transition timing.

### 4. Drag, Click-to-Move, and Merge Semantics

The prototype supports both drag-and-drop and click-to-move, plus undo by clicking merged blocks. The React app appears to preserve that behavior, but drag ownership should be verified because there is both direct drag code in [App.tsx](c:\Users\user\Documents\ThankGodForJesusChrist\ThankGodForAILearningApp\mathaddsubtraactdividemulti-react\src\apps\addition\App.tsx) and a secondary utility in [unitDragSystem.ts](c:\Users\user\Documents\ThankGodForJesusChrist\ThankGodForAILearningApp\mathaddsubtraactdividemulti-react\src\shared\utils\unitDragSystem.ts).

Current verdict: `Needs Runtime Audit`.

### 5. Completion and Feedback Flow

Answer checking appears functionally aligned, including simplification and LCM-related feedback. The main likely drift is in how the source rows disappear after full merge completion.

Current verdict: `Match` for math correctness, `Missing/Inconsistent` for completion cleanup pacing.

## High-Risk Differences

### Inactivity tutorial hand

Prototype behavior includes a full idle/hover-based teaching animation that points to the next interaction target and can show click or drag intent. No equivalent logic was found in the React app.

Why it matters:

- changes how a stuck learner gets help
- affects feature discoverability during early interaction steps
- is behavior, not just visual styling

### Completion fade-out of source rows

Prototype behavior explicitly fades rows out before removing them from layout. If React removes them immediately, learner pacing changes at the moment the problem transitions into answer entry.

Why it matters:

- affects perceived completion feedback
- changes the temporal flow between merge completion and answer entry

### Multi-surface guidance split

The React app spreads teaching behavior across banner text, tooltips, finger overlay, and guided tour. The prototype is more singular. This can be an improvement, but only if each surface is intentionally scoped.

Why it matters:

- parity can be overstated if surfaces are conflated
- missing one automatic teaching behavior can be masked by the presence of a manual tour

## React Missing or Inconsistent Features

This section is the strict subset of prototype behavior that React currently does not appear to have, or does not appear to match closely enough yet.

### 1. Inactivity-driven tutorial hand

Prototype behavior:

- starts after about 3 seconds of inactivity
- can also start after the pointer stays still over interactive elements
- points to the next likely action
- supports both click and drag-style teaching motions

React status:

- not found in the current React addition flow
- current React behavior only shows the startup finger cue, not a recurring idle-help system

Why this counts as missing:

- this is a teaching behavior, not just a different visual implementation
- it changes how a stuck learner is guided after the initial startup moment

### 2. Completion fade-out before source rows are removed

Prototype behavior:

- after merge completion, the source rows fade out over about 0.8 seconds
- only after that fade completes are the rows removed from layout

React status:

- current audit indicates the React flow likely removes or hides those rows without the same completion choreography

Why this counts as inconsistent:

- it changes the timing of the transition into answer-entry mode
- it affects completion feedback, not just styling

### 3. Prototype-style passive teaching loop after startup

Prototype behavior:

- continues to provide automatic hand guidance after the learner pauses
- guidance adapts to the current stage of the flow

React status:

- current React teaching model uses startup cue, instruction banner, contextual tooltips, and guided tour
- none of those appears to fully replace the same passive, stage-aware idle loop

Why this counts as missing or partial:

- React has other help surfaces, but not the same automatic behavior loop
- this should be treated as a behavior gap unless product direction explicitly removed it

## Not Missing, Just Different

These should not be treated as missing unless product direction changes:

- manual guided tour in React
- shared light-guide tooltip system in React
- componentized controls/header structure
- no keyboard shortcut blocking in React

## Recommended Runtime Checks

Run these as separate audits, one flow at a time.

### 1. Startup guidance

- Load addition fresh.
- Compare prototype and React first-touch guidance.
- Check whether React has any idle-triggered teaching behavior after waiting without input.

### 2. Mismatched denominator exploration

- Reveal both bars.
- Try dragging or clicking to combine before denominators match.
- Confirm error merge visualization, banner text, and any tooltip behavior.

### 3. Common denominator ready flow

- Use expand/simplify until denominators match.
- Confirm merge area unlock behavior and guidance transition.

### 4. Merge completion cleanup

- Complete all moves.
- Compare whether the source rows fade out or disappear immediately.
- Confirm answer-zone reveal timing.

### 5. Answer validation edge cases

- Submit correct improper fraction.
- Submit correct mixed number.
- Submit correct but not simplest form.
- Submit correct value using a non-LCM denominator path.

## Triage Summary

### Implement in React

- If product direction still wants prototype-like passive teaching, add back an inactivity-based tutorial hand flow.
- If parity with completion pacing matters, restore the fade-out cleanup before source rows are removed.

### Confirm intentional change

- Multiple teaching surfaces instead of one automatic tutorial hand
- Shared tooltip and guided-tour system
- No keyboard/devtools blocking behavior

### Needs browser verification

- number-line parity details
- error merge edge cases
- drag ownership and fallback behavior
- completion cleanup pacing
- startup help behavior after user inactivity

### Leave as prototype-only behavior

- keyboard shortcut blocking and right-click suppression, unless there is a product requirement to restore it
