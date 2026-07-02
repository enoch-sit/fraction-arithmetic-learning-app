# Design Recommendation — FractionApp48 Subtraction Prototype (Two-Bar Model)

A prototype design for 異分母分數減法 that **keeps two bars** but fixes the problems raised in
`CRITIQUE_FractionApp48_Subtraction.md`. The guiding idea: stop throwing both bars away. Instead,
**line the subtrahend up against the minuend and let the uncovered remainder _be_ the answer.**

Audience: primary-school students (ages ~8–11), often on classroom **tablets** (touch-first).

---

## 1. Goals

1. Keep two bars (red 被減數 / minuend, blue 減數 / subtrahend) as the user requested.
2. Make the two bars *mean* something together — comparison/take-away by alignment, not a
   double trash-can.
3. Keep the answer **visible in place** — never destroy-and-recreate it.
4. Keep numbers and the picture **moving together** at every step.
5. Make the child **do** the subtraction (count it out), not watch the app do it.
6. Be **tap-first** and **touch-safe**, with affordances a child recognises without reading.

---

## 2. Core model: align-and-compare (keeps both bars)

Instead of trashing pieces from both bars, the blue bar **slides underneath the red bar, left-
aligned**. The two bars share the same left edge (the "0" mark) once denominators match.

```
 红 (被減數)  ████████████████████░░░░    a
 蓝 (減數)    ████████████              b   ← slid under, left-aligned
                          └──────────┘
                          剩下這段 = 答案 (a − b)
```

- The part of the red bar **not covered by blue** is highlighted as 答案 (the difference / what
  remains). This single visual works for **both** problem types in the word bank:
  - take-away ("吃掉了…還剩多少") → "the red you haven't eaten yet,"
  - comparison ("紅比藍長多少") → "how much red sticks out past blue."
- Nothing goes in a trash can. There is no second, contradictory "對消" action.

> **Fixes critique §2.1 (dual trash), §2.2 (one model fits both stories), §2.3 (answer stays
> visible).** The leftover red segment is literally the answer; we never rebuild a fresh bar.

---

## 3. Screen layout

```
┌───────────────────────────────────────────────────────────┐
│ Header: 帶分數 / 數線 toggles · 動畫速度 · 🎲 隨機出題          │
├───────────────────────────────────────────────────────────┤
│ Word problem (fractions colour-coded red/blue)               │
├───────────────────────────────────────────────────────────┤
│ Formula:  [被減數] − [減數] = [ ? ]   ← big, tappable cards    │
├───────────────────────────────────────────────────────────┤
│ Instruction strip (one action at a time, large, styled)      │
├───────────────────────────────────────────────────────────┤
│ ROW 1  label  [ red bar  ████████░░ ]  [➕擴分][➖約分]        │
│ ROW 2  label  [ blue bar ██████     ]  [➕擴分][➖約分]        │
│        (optional number line under each, stays visible)      │
│                                                              │
│ ANSWER BAND (appears in place, below, aligned to same 0):    │
│        red remainder highlighted + "剩下/相差" tag            │
├───────────────────────────────────────────────────────────┤
│ Answer inputs:  整數 [ ] 分子[ ]/分母[ ]   + feedback         │
└───────────────────────────────────────────────────────────┘
```

The two bars **never collapse or disappear**. The answer band sits directly beneath them, sharing
the same left edge and unit width, so the child sees the comparison and the result at once.

> **Fixes critique §2.3** (no collapse-then-reappear; bars stay on screen).

---

## 4. Interaction flow (stage by stage)

### Stage 0 — Reveal bars
- Tapping the red fraction card shows the red bar; tapping the blue card shows the blue bar.
- The cards look like **buttons** (see §6), with a gentle idle pulse + a 👆 hint finger if the
  child hasn't tapped within ~3 s.

### Stage 1 — Make the denominators match (with a visible target)
- Each bar keeps its **擴分 / 約分** buttons and its **number line stays on**.
- Show an explicit, child-friendly **target chip**: `🎯 目標：兩條的格子要一樣大` and, once a
  candidate is reached, a live read-out of each bar's current denominator (e.g., `紅: 6 等分 ·
  藍: 3 等分`). When they match, the chip turns green: `✅ 格子一樣大了！`
- A subtle "snap" highlight when `d1*s1 === d2*s2`.

> **Fixes critique §2.7** (gives the equalize step a goal post; keeps number line visible).

### Stage 2 — If the child tries to subtract too early (honest error)
- If the child tries to align before denominators match, **animate the pieces failing to line
  up**: blue slides under red, but the grid lines visibly **don't meet** — blue's tick marks
  land *between* red's marks, and a short shake + caption: `格子大小不同，沒辦法剛好對齊，先讓格子一
  樣大！`
- This replaces the current opaque red-over-blue "?" overlay with a *reason* the child can see.

> **Fixes critique §2.6** (error shows *why*, not just a warning).

### Stage 3 — Subtract by counting out the pieces (child does the work)
Two equivalent, **tap-first** ways to remove the subtrahend, both keeping the count explicit:

- **Tap-to-remove (primary):** Tap red pieces one at a time. Each tap dims one red piece and
  advances a counter: `還要拿走 5 份中的 3 份`. When the counter hits the subtrahend, the
  remaining (un-dimmed) red is the answer.
- **Slide-to-align (alternate):** Drag the **blue bar** to sit under the red bar, left-aligned.
  As it snaps into place, the overlapped red region dims piece-by-piece and the uncovered red
  region lights up as the answer.

Either way:
- **One piece per action** — the app never bulk-removes an app-chosen amount.
- A live counter (`還要拿走 N 份`) supports the counting.
- The numeric labels **stay visible and tick down** as pieces are removed: red label updates
  `5/6 → 4/6 → …`, so symbol and picture move together.

> **Fixes critique §2.5** (child counts out the subtrahend), **§2.4** (labels live throughout),
> and keeps the two-bar relationship central.

### Stage 4 — Read the answer (already on screen)
- The highlighted red remainder gets a tag: `剩下` (take-away problems) or `相差` (comparison
  problems), chosen from the active word-problem template.
- The answer inputs appear; `autoCheck` keeps the existing value + simplest-form logic.

> **Fixes critique §2.2** (correct vocabulary per problem type).

---

## 5. Tooltips & instructions

- **Remove all `title=""` tooltips.** Replace each with an always-visible, styled hint near the
  element (e.g., a small speech bubble under the fraction cards on first load: `先點我，看圖形`).
  Nothing important should depend on hover, because tablets have no hover.
- **One instruction = one action.** The instruction strip shows a single step in plain language
  with an icon, and the element it refers to **pulses/highlights** when the text changes. No
  sentence should name two gestures or two formal terms at once.
- **Plain-language first, formal term second.** e.g., `把要拿走的藍色對齊紅色 (減數)` rather than
  leading with 被減數/減數.
- **Counter as feedback, not a tooltip:** `還要拿走 N 份` lives on-screen, not in a hover tip.

> **Fixes critique §3.1–3.4** (touch-safe, low reading load, plain register).

---

## 6. Affordances — make things look tappable / draggable

### Tappable fraction cards
- Style the fraction group as a **raised card**: solid/tinted background, soft shadow, rounded
  corners, a small `👆` or `▶` badge, and a **press-down** animation on tap.
- Visually separate the *editable inputs* from the *tap-to-show* affordance so the child doesn't
  confuse "type here" with "press here" (e.g., a clear `顯示圖形` pill on the card).
- **Idle pulse + hint finger** on first load so the first action is discoverable without reading.

### Removable / draggable pieces
- Red pieces that can be tapped get a **clear interactive look**: brighter fill, subtle outline,
  and a quick scale-down on tap. Removed pieces visibly **dim/grey**, not vanish, so the child
  sees what they've taken.
- If drag is offered (slide-the-blue-bar), give the blue bar a **grab affordance**: dashed/grip
  edge, a `✋ 拖我` chip on first appearance, and a **lift shadow** while dragging.
- **Drop zone is obvious and where the action lands:** show a dashed outline + `放這裡對齊` label
  exactly where the blue bar should snap. The highlight must work on **touch**, not only on
  desktop `dragover`.

### Touch-first, drag-optional
- **Lead with tap.** Drag is an optional enhancement; never put a drag-only instruction in the
  primary strip.
- Implement interactions with **pointer events** (or a touch-drag shim) so they work on tablets;
  do not rely on HTML5 native drag, `cursor:`, or `title:` cues that don't exist on touch.

### Reuse the one good affordance
- The existing `.tool-btn` (solid fill, hover-grow, press-shrink) is the visual model children
  already read as a button. Apply that vocabulary to the fraction cards and removable pieces.

> **Fixes critique §4.1–4.5** (discoverable, touch-safe, drop zones, button-like styling).

---

## 7. Animation guidance

- **Keep it slow and singular.** Animate one piece at a time on tap-to-remove; if sliding the
  blue bar, one smooth ~0.5–0.8 s snap (scaled by the existing speed slider), not many
  simultaneous 3 s flights.
- **No destroy-and-rebuild.** The answer band fades in *from* the existing red remainder
  (e.g., the uncovered red brightens), so the child sees the answer emerge from the bar.
- **Respect `prefers-reduced-motion`**: offer an instant/low-motion variant.
- **A next-step hint finger** (reuse the subtraction app's `playHintAnimation` pattern) for each
  stage, so a stuck child sees the move demonstrated.

---

## 8. Answer checking & vocabulary

- Keep the existing exact-value + simplest-form check and the LCM nudge.
- Choose the remainder tag and feedback wording from the **active word-problem type**:
  `剩下` for take-away, `相差` for comparison.
- If the child reached a common denominator that isn't the LCM, keep the gentle "你用的不是最小
  公倍數" hint.

---

## 9. Critique → design mapping

| Critique issue | This design's fix |
|----------------|-------------------|
| §2.1 Dual trash (丟棄 + 對消) | Align-and-compare; nothing is trashed |
| §2.2 One animation, two story types | Same align visual; tag is `剩下` or `相差` per problem |
| §2.3 Answer destroyed then recreated | Answer band fades in from the leftover red; bars never collapse |
| §2.4 Labels hidden during subtraction | Numeric labels stay visible and tick down |
| §2.5 App auto-removes the subtrahend | Child removes one piece per tap; live `還要拿走 N 份` counter |
| §2.6 Error not explained | Pieces visibly fail to line up + caption |
| §2.7 No common-denominator target | 🎯 target chip + live denominator read-out + ✅ on match |
| §2.8 Silent operand swap | Keep auto-order, but show a brief note when it reorders |
| §3.1–3.4 Tooltip problems | Always-visible styled hints; one action per instruction; touch-safe |
| §4.1 Fractions don't look tappable | Raised card, badge, idle pulse, hint finger |
| §4.2 Blocks don't look draggable / drag fails on touch | Tap-first; grab affordance + pointer-event drag if offered |
| §4.3 Two gestures, two meanings | One primary gesture (tap); slide-blue is a clearly-labelled alternate |
| §4.4 Drop zone unclear | Obvious dashed drop zone where the bar lands, works on touch |

---

## 10. Build notes (for the prototype)

- Reuse `getSafeValues`, `gcd/lcm`, `renderBar`, `applyGridAnimation`, and the answer-check logic
  from `js/FractionApp48.js`.
- **Replace** `trashPieces`, `animateToTrash`, `showErrorMergeBar`, `showFinalAnswerBar`, and the
  row-collapse block with: `removePiece` (tap), `alignBlueBar` (optional drag), `renderRemainder`
  (answer band), and `renderMismatchError` (lines-don't-meet).
- **Keep** `label1`/`label2` at `opacity:1` throughout; drive their numerators down per removal.
- Add a `targetChip` element updated by `checkCommonDenom`.
- Use **pointer events**; do not disable the number line during subtraction.
- Verify on a **tablet/touch** before sign-off (this is where the current app fails hardest).

---

## 11. Suggested next step
On approval, I'll implement this as a parallel file (e.g., `js/FractionApp48_proto.js` +
`FractionApp48(Subtraction)_proto.html`) so it can be compared side-by-side with the current
trash-can version without disturbing the existing app.
