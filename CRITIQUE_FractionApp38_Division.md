# Critique — FractionApp38 (分數除法 / Fraction Division)

A usability and pedagogy review of the division app's animation flow, tooltip use, and
interaction affordances, evaluated specifically against the abilities and expectations of
**primary-school students (roughly ages 8–11)**.

Files reviewed:
- `FractionApp38(Division).html`
- `js/FractionApp38.js`
- `css/arith-common.css`, `css/bar-component.css`, `css/FractionApp38.css`

> Companion to `CRITIQUE_FractionApp48_Subtraction.md`. Where the two apps share code, the
> shared issues are noted but kept brief; the focus here is what is specific to division.

---

## 1. How the animation actually flows

Like the subtraction app, everything is driven by `updateUI()` rebuilding the DOM plus a web of
`setTimeout` timers. Division uses a **quotitive / measurement** model ("how many times does the
divisor fit into the dividend?"), reached *after* forcing a common denominator:

1. **Reveal bars** — Clicking 分數1 (`onFrac1Click`) and 分數2 (`onFrac2Click`) renders the
   被除數 (dividend, red) and 除數 (divisor, blue) bars.
2. **Equalize denominators** — `applyTool(num, 'expand'|'simplify')` runs the same grid
   animation as the other apps. `checkCommonDenom` compares `d1*s1` vs `d2*s2`.
3. **Auto-start division** — The instant denominators match, `checkCommonDenom` **hides all
   tool buttons, hides and disables the number line**, and calls `startDivisionAnimation(cd)`
   with no confirmation.
4. **Build the "mould"** — `buildDivisorMold` replaces the divisor bar with a solid blue
   "封閉模具" (closed mould) that flashes a glow.
5. **Measure by dragging** — `setupManualDragAndFill` pre-cuts the dividend into chunks each one
   whole divisor wide (`P2` pieces; the last chunk is the remainder `P1 % P2`). The child drags
   or clicks each red chunk onto the blue divisor bar (`wrap2`); `handleDropChunk` then flies it
   over a **2-second** animation into a result mould in a third row (`bar3-row`).
6. **Reveal answer** — When every chunk has landed, `showAnswerZone` opens the fill-in inputs
   validated by `autoCheck`. The quotient is `P1/P2` (number of divisor-portions that fit).

Note: unlike the subtraction app, there is **no `playHintAnimation` finger** here — a stuck
child gets no animated guidance, only the static instruction line.

---

## 2. Animation logic — conceptual clarity for a child

### 2.1 The whole "equalize denominators first" detour is the wrong mental model for division
The app makes common denominators a **mandatory gate** before division can even begin
(`checkCommonDenom` only calls `startDivisionAnimation` when `isCommonDenomReady`). Division of
fractions does not require a common denominator the way addition/subtraction does — the school
method is *invert and multiply*. The app is teaching the niche "common-denominator division"
trick (`a/c ÷ b/c = a/b`) **without ever naming it or explaining why it works**. A child is
forced through an addition-style ritual that doesn't match anything their textbook will show for
division, then the actual division insight (`P1 ÷ P2`) happens silently in the numerators.

### 2.2 The "mould" (模具) metaphor is industrial, not childlike
`buildDivisorMold` turns the divisor into a 封閉模具 (closed mould/die). "模具" is
manufacturing vocabulary most 8–11 year-olds have never met. The word problems use friendly
framings (杯 cups, 段 segments, 天 days), but the on-screen object is a "mould" — the metaphor
the child is given doesn't match the story they were just told.

### 2.3 The child doesn't actually do the measuring — the app pre-cuts everything
The core insight of quotitive division is *"keep laying the divisor against the dividend and
count how many fit."* But `setupManualDragAndFill` pre-segments the dividend into exactly the
right chunks:

```js
let numMolds = Math.ceil(P1 / P2);
let size = (i === numMolds - 1 && P1 % P2 !== 0) ? (P1 % P2) : P2;
```

The answer (`numMolds`, and the size of the leftover) is computed *before* the child touches
anything. The child just shuttles pre-cut pieces across the screen. As in the subtraction app,
the thinking is automated away and the interaction becomes busywork.

### 2.4 The fractional part of the quotient is never explained
When `P1` isn't a multiple of `P2`, the last chunk is a partial block dropped into a full-size
mould. That partial fill **is** the fractional part of the answer (e.g., 2 cells of a 3-cell
mould = ⅔ of a portion). Nothing connects "this mould is partly full" to the fraction the child
must type. The feedback even asks them to figure it out unaided:

```js
fb.innerText = '👀 答案不對喔，再觀察一下總共裝滿了幾個模具？剩下不滿的佔幾個格子？';
```

For division — where "what does the remainder mean?" is the hardest idea — leaving this implicit
is a major gap.

### 2.5 The divisor appears in three different forms at once
The divisor is shown as (a) the original blue bar in row 2, (b) the glowing blue "mould" drop
target it morphs into, and (c) the row-3 result moulds the pieces fly into. Three
representations of the same quantity, on screen simultaneously, with no labelling of how they
relate. A child cannot easily tell that all three are "the divisor."

### 2.6 Drop here, land there — the gesture and its result are disconnected
The child drops a red chunk onto the **blue divisor bar** (`wrap2.ondrop`), but
`handleDropChunk` flies the piece to a **different row** (`bar3`) over 2 seconds:

```js
animBlock.style.transition = 'top 2s ease-in-out, left 2s ease-in-out';
```

The place you act on is not the place the result appears. The cause (drop on row 2) and effect
(fill in row 3) are spatially separated, and at 2 s per chunk with several chunks the sequence is
slow and easy to lose track of. There is also no running "已裝滿 N 份 / 杯" counter, so the child
isn't supported in counting the very thing they're meant to count.

### 2.7 Representations are stripped away exactly when division happens
`checkCommonDenom` hides the tool buttons, hides both number lines, **and disables the number-line
checkbox** the moment division starts:

```js
document.getElementById('show-nl-cb').disabled = true;
```

`startDivisionAnimation` then sets `label1`/`label2` opacity to 0. So during the key measuring
step the child loses the number line *and* the numeric fraction labels — the same symbol↔picture
break flagged in the subtraction app, made worse by also removing the number line.

### 2.8 Auto-start removes the child's control
There is no "start" button. As soon as denominators match, the UI reconfigures itself and begins
the division sequence. A child experimenting with 擴分/約分 who happens to hit a common
denominator is yanked into a new mode with the tools they were using suddenly gone.

### 2.9 The word-problem framing breaks for quotients below 1
The templates all assume the dividend is bigger ("可以倒滿幾杯？", "共可剪成多少段？"). The app
does **not** reorder operands (correctly, since division isn't commutative), but it also doesn't
guard the story: a proper-fraction quotient yields answers like "倒滿 ¾ 杯", which is nonsensical
for "how many full cups," confusing a child who is reading the narrative literally.

---

## 3. Tooltip use

### 3.1 Native `title=""` tooltips are invisible to the target users
The most important discovery hints are HTML `title` attributes:

```html
<div class="mixed-frac" id="frac1-group" onclick="onFrac1Click()" title="點擊重置並顯示被除數圖形">
...
<div class="mixed-frac" id="frac2-group" onclick="onFrac2Click()" title="點擊重置並顯示除數圖形">
...
<label for="speed-slider" title="調整擴分/約分的動畫速度">
```

Native `title` tooltips appear only on ~1 s desktop hover and **never on touch devices** (the
typical classroom tablet), in tiny unstyled text. The primary "tap the fraction to start" hint is
effectively missing for most students.

### 3.2 The instruction line is overloaded and uses formal register
`#drag-instruction` is the real teaching channel, but it asks for a lot at once:

```js
"💡 請將上方紅色的「被除數」色塊，每次拖拉（或點擊）「一整份」到第二列的「除數」圖形中來測量！"
```

One sentence names two formal terms (被除數 / 除數), offers **two** gestures (drag *or* click),
references a position ("第二列"), and introduces a new verb ("測量"). That's heavy reading for an
8–10 year-old, and the line changes with no signal that it changed.

### 3.3 No glossary for the new metaphor
"模具" (mould) and "測量" (measure) are introduced only inside a transient instruction string.
There is no persistent, child-friendly legend explaining what the blue container *is* or why the
red pieces are being poured into it.

### 3.4 Recommendation
- Replace `title` attributes with **always-visible, styled, large-text** hints; never depend on
  hover. Ensure every hint works on touch.
- One instruction = **one action**, in plain language, with the referenced element highlighted
  when the text changes.
- Swap "模具" for a familiar word (e.g., 量杯 / 格子) consistent with the word problem.

---

## 4. Affordances — do the elements look clickable / draggable?

### 4.1 "Tap the fraction to start" is almost undiscoverable
`.mixed-frac` is the click target but looks like an equation, not a button:

```css
.mixed-frac { cursor: pointer; padding: 5px; border-radius: 10px; }
.mixed-frac:hover { background: #f0f0f0; }
```

It contains `<input>` fields, so children read it as "a box to type in." The only affordances are
`cursor: pointer` and a faint grey hover — both invisible on touch and subtle on desktop. If the
opening hint ("點擊上方分數，顯示長條圖！") is missed, the app looks inert.

### 4.2 Draggable chunks look like blocks, but "draggable" is fragile for kids
`setupManualDragAndFill` builds chunks with a white border and `cursor: grab` and sets
`draggable = true`:

```js
chunk.className = 'drag-block';
chunk.style.border = '2px solid white';
chunk.style.cursor = 'grab';
chunk.draggable = true;
chunk.onclick = () => handleDropChunk(chunk.id, molds, P1, P2, cd);
```

```css
.drag-block { transition: transform 0.1s, opacity 0.2s, box-shadow 0.2s; touch-action: manipulation; }
.drag-block:active { transform: scale(0.95); }
```

Problems:
- No grip handle, dotted edge, shadow, or "drag me / ✋" icon — a flat red rectangle gives little
  hint it can be picked up; `cursor: grab` is meaningless on touch.
- **HTML5 native drag-and-drop does not work on touch** the way `ondragstart`/`ondrop` assume, so
  on a tablet dragging a chunk onto the divisor bar typically does nothing. A click fallback
  exists, but the headline instruction still leads with "拖拉," inviting a gesture that silently
  fails on common hardware.
- Precise drag (pickup → travel → release) is **developmentally demanding** for this age; tap is
  far more reliable. The design leads with the harder gesture.

### 4.3 The one good affordance — and the one that's missing
On the positive side, the drop target glows during a desktop drag:

```js
wrap2.ondragover = (e) => { e.preventDefault(); wrap2.style.boxShadow = '0 0 15px 5px rgba(52, 152, 219, 0.5)'; };
```

That's a clear drop-zone cue — but it only fires during HTML5 `dragover` (not touch), and it
highlights row 2 even though the piece ends up in row 3 (see §2.6).

Crucially, **division has no hint-finger animation** (the subtraction app's `playHintAnimation`).
So a child who stalls gets no animated demonstration at all — only static text. Given how
non-obvious "tap the equation" and "drag a chunk onto the blue bar" are, the absence of any
auto-guidance is a real discoverability regression.

### 4.4 Tool buttons are the model to copy
`.tool-btn` (solid fill, hover grow, press shrink) is the only control children reliably read as
interactive. The clickable fractions and drag chunks should borrow this button vocabulary and
press feedback instead of relying on cursor changes.

### 4.5 Recommendations for affordances
- **Lead with tap**, make drag optional, and never put a drag-only instruction in the primary hint.
- Give clickable fractions an obvious button look (raised surface, shadow, ▶/👆 badge, gentle idle
  pulse on first load).
- Give chunks a real grab affordance (dashed border, handle dots, lift shadow on press, "拖我" hint).
- Make the drop zone the place the piece actually lands, and keep its highlight working on touch.
- Add a division hint-finger (or reuse the subtraction app's pattern) so a stuck child sees the
  next move demonstrated.
- Ensure **all** interactions work with touch/pointer events and verify on a tablet.

---

## 5. Priority summary

| # | Issue | Why it hurts a primary student | Severity |
|---|-------|--------------------------------|----------|
| 1 | Mandatory common-denominator gate, mechanism never explained | Teaches a non-standard division ritual with no "why" | High |
| 2 | App pre-cuts the dividend; child doesn't measure | The central division insight is automated away | High |
| 3 | Fractional part of the quotient never explained | Hardest idea in fraction division left implicit | High |
| 4 | Drag-led primary instruction + native HTML5 drag | Fails silently on tablets; drag is hard for the age | High |
| 5 | Fractions/chunks don't look interactive; no hint finger | First/next actions undiscoverable without reading | High |
| 6 | Drop on row 2, result appears in row 3 (2 s flight) | Cause and effect spatially/temporally disconnected | Medium |
| 7 | Number line + labels removed during division | Breaks symbol↔picture link at the key moment | Medium |
| 8 | "模具/測量" formal vocabulary, no glossary | Reading load; metaphor mismatches the word problem | Medium |
| 9 | Auto-start with no confirmation; tools vanish | Child loses control mid-exploration | Medium |
| 10 | `title=""` tooltips for key hints | Invisible on touch; tiny text | Medium |
| 11 | Divisor shown in three forms at once | Hard to see they're the same quantity | Low |
| 12 | Word-problem framing breaks for quotient < 1 | "倒滿 ¾ 杯" contradicts the story | Low |

---

## 6. Suggested next step
I can prototype a revised division flow in `js/FractionApp38.js` that:
- lets the child **lay the divisor repeatedly themselves** and **counts aloud** ("已裝滿 N 份"),
  rather than pre-cutting the dividend,
- keeps the number line and numeric labels **live** throughout,
- makes the **leftover explicitly readable** as the fractional part of the quotient,
- replaces "模具" with a word-problem-consistent container, and
- uses **tap-first, always-visible, touch-safe** affordances plus a next-step hint demonstration.

Say the word and I'll build it alongside the current version for side-by-side comparison.
