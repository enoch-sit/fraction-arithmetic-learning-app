# Critique — FractionApp48 (異分母分數減法 / Unlike-Denominator Subtraction)

A usability and pedagogy review of the subtraction app's animation flow, tooltip use, and
interaction affordances, evaluated specifically against the abilities and expectations of
**primary-school students (roughly ages 8–11)**.

Files reviewed:
- `FractionApp48(Subtraction).html`
- `js/FractionApp48.js`
- `css/arith-common.css`, `css/bar-component.css`, `css/FractionApp48.css`

---

## 1. How the animation actually flows

The app drives everything through `updateUI()` rebuilding the DOM, plus a web of
`setTimeout` / `requestAnimationFrame` timers. The intended journey is five stages:

1. **Reveal bars** — Clicking 分數1 (`onFrac1Click`) and 分數2 (`onFrac2Click`) renders two
   horizontal bars: red = 被減數 (minuend), blue = 減數 (subtrahend). Each bar is split into
   whole-number units with grid lines for the denominator (`renderBar` → `applyGridAnimation`).
2. **Equalize denominators** — `applyTool(num, 'expand'|'simplify')` animates the grid:
   擴分 grows orange sub-lines that fade to dark; 約分 fades one line out and slides the rest.
   `checkCommonDenom` compares `d1*s1` vs `d2*s2`.
3. **Error guard** — If the child tries to subtract before denominators match,
   `triggerErrorMerge` overlays the red bar on the blue bar with a "?" (`showErrorMergeBar`).
4. **Subtract via trash can** — Once `isCommonDenomReady`, `convertBarToDraggable` turns the
   fills into clickable/draggable blocks. `trashPieces` flies red pieces into 🗑️ **and
   simultaneously** flies an equal number of blue pieces in ("對消"). When
   `trashedCount === total_n2*s2`, `bar1-row` and `bar2-row` collapse to height 0.
5. **Reveal answer** — `showFinalAnswerBar` builds a fresh "剩餘" bar and `showAnswerZone`
   opens fill-in inputs validated by `autoCheck`.

A 👆 hint finger (`playHintAnimation`) auto-demos the next step after 3s idle or 1s hover.

---

## 2. Animation logic — conceptual clarity for a child

### 2.1 The dual trash-can ("丟棄" + "對消") breaks the meaning of subtraction
In `trashPieces`, removing red (minuend) pieces also sends an equal number of blue pieces to
the bin:

```js
let bar2Blocks = Array.from(document.querySelectorAll('[id^="drag-2-"]')).reverse();
// ... animateToTrash(b2, ...) for the matching blue pieces
```

The tooltip uses two different verbs — red "已丟棄" (discarded), blue "已對消" (cancelled).
A child sees **two quantities, in equal amounts, both flying into the bin**, but `a − b`
removes *one* quantity *from* another. No everyday subtraction throws away both numbers. This
is really a *matching/cancellation* model (from comparison subtraction) presented without
explanation, so the takeaway becomes "subtraction = delete equal pairs from two bars," which
does not transfer to paper-and-pencil work.

### 2.2 One animation is forced onto two incompatible problem types
The word-problem templates mix **take-away** ("吃掉了", "倒出了") with **comparison**
("紅彩帶比藍彩帶長多少"). The matching-and-trashing animation only fits comparison. For a
take-away problem there should be a single bar that loses pieces — the blue bar shouldn't
physically exist. The result is always labelled "剩餘" (remaining), which is take-away
language even when the problem asks for a 相差 (difference). Visual and vocabulary contradict
each other.

### 2.3 The answer is destroyed, then re-created
After the last piece is trashed, both working rows collapse and vanish:

```js
row.style.maxHeight = '0px'; row.style.opacity = '0';
// ...then later:
showFinalAnswerBar(); // builds a brand-new bar from finalParts
```

The leftover red pieces — which **are** the answer — disappear, and a freshly generated bar
appears elsewhere. The child never sees "the pieces still in the red bar are the answer." The
biggest payoff of a visual model (the remainder is right there) is animated away.

### 2.4 The numbers hide exactly when subtraction happens
`checkCommonDenom` sets `label1`/`label2` to `opacity: 0` the moment denominators match.
`updateLabelsDuringDrag` rewrites the label text but never restores opacity, so during the
actual take-away the symbolic fractions are invisible. The link between "I removed 2 pieces"
and "the numerator dropped by 2" is broken at the critical moment.

### 2.5 The child never counts out the subtrahend
Clicking a block trashes a whole block's worth, auto-capped by the app:

```js
let p_actual = Math.min(p, (vals.total_n2 * s2) - trashedCount);
```

One click can remove a large, app-decided chunk. The child does not deliberately count "I
need to take away 5/6" — the very skill the lesson should build is automated away.

### 2.6 The "can't subtract yet" error is shown, not explained
`showErrorMergeBar` stacks two semi-transparent bars with mismatched grids and a "?".
Overlapping different-sized grids is visual noise, not a demonstration of *why* unlike
denominators fail. The pieces never visibly "fail to line up."

### 2.7 Equalizing denominators has no goal post
The child must press 擴分/約分 on both bars by trial and error, with no target number shown and
no hint that the goal is a common denominator. For subtraction — where finding the common
denominator is the central difficulty — leaving it as unguided increment/decrement of hidden
`s1`/`s2` counters is a heavy, disconnected cognitive load.

### 2.8 Operands are silently swapped
`updateUI` reorders inputs so the larger fraction is always first. Sensible for avoiding
negatives, but a child who types `1/3 − 1/2` sees it silently flip to `1/2 − 1/3` with no
message, quietly contradicting the word problem they just read.

---

## 3. Tooltip use

The app relies on tooltips and inline instruction text in several places. For this age group
they are weak or counterproductive.

### 3.1 Native `title=""` tooltips are effectively invisible to children
The fraction groups use HTML `title` attributes for their most important hint:

```html
<div class="mixed-frac" id="frac1-group" onclick="onFrac1Click()"
     title="點擊重置並顯示被減數圖形">
```

Native `title` tooltips:
- **Only appear on desktop hover after ~1s** and **never appear on touch devices** (tablets
  are the most common classroom device). The primary discovery hint is missing exactly where
  most students are.
- Are rendered in tiny OS-default text, often outside a young child's reading focus.
- Cannot be styled, so they clash with the otherwise large, colourful UI.

The speed slider has the same problem: `title="調整擴分/約分的動畫速度"`.

### 3.2 The trash-can tooltip is information-dense and mixes registers
`updateTrashTooltip` renders a rich panel with two mini bar-charts plus text like
"被減數 (紅) 已丟棄" and "減數 (藍) 已對消". Issues:
- It uses formal math register (被減數/減數/對消) that many primary students have not yet
  internalised, with no plain-language gloss.
- It shows **two** mini-bars of equal amount, reinforcing the "throw both away" misconception
  from §2.1.
- It is toggled by a 隱藏內容/顯示內容 button (`toggleTrashContent`) that defaults to open, so a
  dense panel competes for attention with the main animation.

### 3.3 The instruction line carries too much, too fast
`#drag-instruction` is the real teaching channel, but it swaps between long sentences, e.g.:

```js
"💡 分母相同了！請點擊被減數的色塊，或將它拖入下方「減數長條圖」中扣除！"
```

This single line names a formal term (被減數), offers **two** different interactions
(click *or* drag), and a destination ("減數長條圖") all at once. It is a lot of reading for an
8–10 year old, and it changes without any signal that it changed.

### 3.4 Recommendation for tooltips
- Replace `title` attributes with **always-visible, styled, large-text labels or speech
  bubbles** anchored near the element; never depend on hover for primary content.
- Make sure every hint is **touch-first** (no hover dependency).
- One instruction = **one action** at a time, in plain kid language, with an icon and a brief
  highlight/pulse on the element it refers to when the text changes.

---

## 4. Affordances — do the elements look clickable / draggable?

This is the weakest area. The interactions are essential to the lesson, yet the visual
affordances are minimal.

### 4.1 "Click the fraction to show the bar" is almost undiscoverable
`.mixed-frac` is the click target, but it looks exactly like an equation, not a button:

```css
.mixed-frac { cursor: pointer; padding: 5px; border-radius: 10px; }
.mixed-frac:hover { background: #f0f0f0; }
```

- It contains `<input>` fields, so children read it as "a box to type in," not "a button to
  press." The clickable region and the editable region overlap, sending conflicting signals.
- The only affordance is `cursor: pointer` + a faint grey hover — **both invisible on touch
  devices**, and grey-on-white is very subtle even on desktop.
- The opening instruction "點擊上方分數，顯示圖形！" is the only real cue. If it's missed, the app
  looks broken (nothing happens until you guess to tap the equation).

### 4.2 Draggable blocks don't look draggable, and "draggable" is fragile for kids
`convertBarToDraggable` sets `block.draggable = true` and `cursor: grab`, but:

```css
.drag-block {
    transition: transform 0.1s, opacity 0.2s, box-shadow 0.2s;
    touch-action: manipulation;
}
.drag-block:active { transform: scale(0.95); }
```

- There is **no grip handle, no dotted border, no shadow, no "drag me" icon** — a flat
  coloured rectangle gives no hint it can be picked up. `cursor: grab` is the only resting cue
  and, again, touch devices never show a cursor.
- **HTML5 native drag-and-drop (`ondragstart`/`ondrop`) does not work on touch** in the way
  the code assumes. On a tablet, dragging a block into the blue bar (`wrap2.ondrop`) typically
  **does nothing**. The app does provide a click fallback (`block.onclick`), but the headline
  instruction still says "或將它拖入...", inviting an action that silently fails on the most
  common classroom hardware.
- Fine-motor drag-and-drop (precise pickup + travel + release) is **developmentally hard** for
  many primary students; tap/click is far more reliable. The design leads with the harder
  gesture.

### 4.3 The same object supports two different gestures with two meanings
A red block can be **clicked** (→ trash) or **dragged onto the blue bar** (→ subtract). Two
gestures mapping to one operation, with two different mental pictures (remove vs. move-onto),
is confusing. Dragging the minuend *onto* the subtrahend is also backwards from the take-away
intuition (you remove *from* the minuend; you don't drop it on the thing you subtract).

### 4.4 Tool buttons are the one well-afforded control — use them as the model
`.tool-btn` is the only element that reliably reads as interactive:

```css
.tool-btn { background:#3498db; color:white; cursor:pointer; }
.tool-btn:hover { background:#2980b9; transform: scale(1.05); }
.tool-btn:active { transform: scale(0.95); background:#1f618d; }
```

Solid fill, label, hover grow, and press shrink — children recognise this as a button. The
fraction "buttons" and drag blocks should borrow this vocabulary (clear button-like styling,
press feedback) instead of relying on cursor changes.

### 4.5 Recommendations for affordances
- **Lead with tap/click, not drag.** Make drag an optional enhancement, and never put a
  drag-only instruction in the primary hint.
- Give clickable fractions an obvious button look (raised surface, shadow, a small 👆/▶ badge,
  a gentle idle pulse on first load) so the first action is discoverable without reading.
- Give draggable blocks a real grab affordance: dotted/dashed border, drag-handle dots, a
  lift shadow on press, and a "拖我" or ✋ hint on first appearance.
- Ensure **all** interactions work with touch (pointer events / a touch-drag shim), and verify
  on a tablet, since `cursor`-based and `title`-based cues don't exist there.
- Add visible **drop-zone** styling (dashed outline, "放這裡" label, highlight on hover/drag-over)
  so a target is obvious rather than implied by text.

---

## 5. Priority summary

| # | Issue | Why it hurts a primary student | Severity |
|---|-------|--------------------------------|----------|
| 1 | Dual trash (red + blue both binned) | Teaches a wrong mental model of subtraction | High |
| 2 | Answer bar destroyed then re-created | Severs cause→effect; remainder isn't seen as the answer | High |
| 3 | Drag-only primary instruction + native HTML5 drag | Fails silently on tablets; drag is hard for the age group | High |
| 4 | Fractions/blocks don't look interactive | First action is undiscoverable without reading | High |
| 5 | `title=""` tooltips for key hints | Invisible on touch; tiny text | Medium |
| 6 | Numeric labels hidden during subtraction | Breaks symbol↔picture link at the key moment | Medium |
| 7 | One animation for take-away and comparison | "剩餘" wording mismatches some problems | Medium |
| 8 | No common-denominator target shown | Equalizing becomes blind trial-and-error | Medium |
| 9 | Dense, formal-register trash tooltip | Reading load + reinforces misconception | Medium |
| 10 | Silent operand swap | Quietly contradicts the word problem | Low |

---

## 6. Suggested next step
I can prototype a revised flow in `js/FractionApp48.js` that:
- uses a **single bar** for take-away problems where the remainder stays visible as the answer,
- removes **one piece per tap** with a running "還要拿走 N 份" counter,
- keeps numeric labels live throughout, and
- replaces drag-led, hover/`title`-based hints with **tap-first, always-visible, touch-safe**
  affordances and drop-zone styling.

Say the word and I'll build it alongside the current version for side-by-side comparison.
