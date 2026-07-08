# TODO

## Goal
Simplify subtraction so students remove meaningful units directly instead of decoding a striped cut zone.

## Plan
1. Remove the striped subtraction overlay and its trash-drop interaction.
2. Keep unlike denominators in a transform-first state: no subtraction until the units match.
3. When denominators match, subtract from the first bar using the actual block structure:
   - remove whole blocks first when a full unit can be taken away
   - then remove equal fractional pieces one by one
4. Replace the old overlay cue with a lightweight hand-guidance animation that points from the first bar toward the bin.
5. Turn the bin feedback into a simple progress/capacity display for the amount removed.
6. Validate with a production build and keep the rest of the subtraction behavior unchanged.

## Execution Notes
- Keep the current positive-only operand swap for this pass.
- Limit the change to the subtraction app and its CSS.
- Prefer existing DOM/block helpers over adding a new abstraction layer.
