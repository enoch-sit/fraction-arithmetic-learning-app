# Finding: "Top-Left Bar Remains" After Drop Animation

**App:** [FractionApp38(Division).html](FractionApp38(Division).html)
**Code:** [js/FractionApp38.js](js/FractionApp38.js) — `setupManualDragAndFill`, `handleDropChunk`
**Method:** Reproduced in a real browser (local HTTP server + CDP `Runtime.evaluate` for DOM inspection, screenshots at each stage) using the default `2/3 ÷ 1/2` case and a mixed-number case `1 2/3 ÷ 1/2`.

## Root cause: confirmed as H1 — intentional dashed placeholder, never cleaned up

`handleDropChunk` never removes or hides the source `.drag-block` chunk after a drop. It converts it into a permanent transparent box with a dashed red border:

```558:565:js/FractionApp38.js
    chunk.setAttribute('data-measured', '1');
    chunk.style.backgroundColor = 'transparent';
    chunk.style.opacity = '1';
    chunk.style.border = '2px dashed var(--red)';
    chunk.style.cursor = 'default';
    chunk.draggable = false;
    chunk.onclick = null;
```

Once **every** chunk has been dropped, the entire original dividend bar — the "top bar" — ends up as a fully empty, dashed-outline rectangle sitting where the solid red bar used to be. It does not fade out, get removed, or get replaced by any summary/count. It persists indefinitely, including after the bottom answer zone appears.

This is what is being perceived as **"a bar remains at the top-left"**: not a stuck clone or an animation bug, but the deliberate end-state of the "measured" chunks, which currently has no visual polish (no fade-out, no checkmark, no color retained).

### Visual evidence

Final state after dropping all 4 chunks for `1 2/3 ÷ 1/2` (denominators already common at 6ths):

- Entire top bar (spanning `0` to `1 4/6` on the number line) is a hollow dashed-red rectangle.
- Underlying `.bar-fill` is confirmed `visibility: hidden` (set once at setup, [js/FractionApp38.js:472](js/FractionApp38.js)) and never restored.
- `.bar-unit` grey skeleton borders are covered by the dashed chunks, so no grey "ghost" shows through — the artifact is specifically the **dashed chunk overlay**, not the underlying bar structure.

DOM state captured via CDP after all chunks dropped:

```json
{
  "chunks": [
    { "id": "div-chunk-0", "bg": "rgba(0, 0, 0, 0)", "border": "2px dashed rgb(231, 76, 60)" },
    { "id": "div-chunk-1", "bg": "rgba(0, 0, 0, 0)", "border": "2px dashed rgb(231, 76, 60)" },
    { "id": "div-chunk-2", "bg": "rgba(0, 0, 0, 0)", "border": "2px dashed rgb(231, 76, 60)" },
    { "id": "div-chunk-3", "bg": "rgba(0, 0, 0, 0)", "border": "2px dashed rgb(231, 76, 60)" }
  ]
}
```

## Other hypotheses: ruled out

| Hypothesis | Verdict | Evidence |
|---|---|---|
| **H2** — grey `.bar-unit`/grid skeleton showing through | Not the cause | `#drag-overlay` fully covers the bar (z-index 10); dashed chunks are contiguous and cover 100% of the bar width, so no grey shows through. |
| **H3** — flying clone (`animBlock`) gets stuck | Not reproduced | Inspected `document.body` for fixed-position elements immediately after drop, mid-flight (using an artificially slowed 20s flight via `currentSpeed=0.1`), and after landing. Exactly one `animBlock` exists during flight and it is always removed on schedule (`fixedDivs: 0` after landing, every time). |
| **H4** — width mismatch between source chunk and flying clone | Not reproduced | For both a full chunk (`size=3, P2=3` → full width) and a remainder chunk (`size=1, P2=3` → 1/3 width), `animBlock` width matched the proportional target width exactly (e.g. `109.65625px` = `(1/3) × 329px` mold width). No overflow or gap observed. |
| **H5** — HTML5 drag-ghost/opacity race | Not a contributor to the persistent artifact | By code inspection: `ondragstart` sets `opacity: 0.4` only during an active drag gesture; `ondrop` synchronously calls `handleDropChunk`, which immediately overwrites style to the dashed/transparent state. The final persistent artifact is identical whether triggered by click or by drag — confirmed by testing exclusively via `.click()` (which uses the same `handleDropChunk` code path as `wrap2.ondrop`). |

## Secondary observation (not the reported issue, but worth flagging)

The flying clone (`animBlock`) is `position: fixed` with `top`/`left` captured once via `getBoundingClientRect()` and animated via CSS transition to a second fixed target. If the user scrolls the page **during** the 2-second (or slower) flight, the clone will not track the scroll — it will visually separate from the moving source/target bars since `position: fixed` is viewport-relative while the bars move with the page. This is a latent, separate bug from the reported "bar remains" issue and was not the focus of this investigation.

## Comparison with `FractionApp38_v2.js`

The `_v2` rewrite ([js/FractionApp38_v2.js](js/FractionApp38_v2.js), `renderCups()` / `placeCup()`) avoids this problem structurally:

- It **never hides** the dividend's `.bar-fill` — the red color stays visible for the entire exercise.
- "Measured" cups only get a subtle semi-transparent white overlay plus a small white badge (`1` or a reduced fraction), layered *on top of* the still-colored bar:

```58:67:FractionApp38(Division)_v2.html
.cup { position: absolute; top: 0; height: 100%; box-sizing: border-box; border-right: 3px solid var(--dark); ... }
.cup.measured { background: rgba(255,255,255,0.18); }
.cup.partial { border-right-style: dashed; background: repeating-linear-gradient(...); }
.cup-badge { background: #fff; color: var(--dark); font-weight: bold; ... border-radius: 50px; ... }
```

Because the underlying color is never removed, the top bar never turns into an empty dashed frame — there is nothing that reads as "a leftover empty bar."

## Recommended fix scope

Do not need to touch the flying-clone mechanics (H3/H4 code) — they work correctly. The fix is localized to what happens to the **source chunk** in `handleDropChunk` ([js/FractionApp38.js:558-565](js/FractionApp38.js)):

1. **Minimal fix:** instead of leaving a permanent transparent+dashed box, fade the chunk out (e.g. transition `opacity` to `0` over ~0.3s, or set `visibility: hidden`) once the flying clone has departed, so the top bar visually empties out cleanly rather than leaving hollow rectangles behind.
2. **Better fix (aligned with v2's approach):** stop hiding `.bar-fill` at setup, and instead of dashed/transparent placeholders, overlay a small "measured" badge or checkmark on top of the still-colored chunk. This keeps the red bar visually intact throughout and gives the child a running visual count, consistent with the `_v2` design and the critique already on file at [CRITIQUE_FractionApp38_Division.md](CRITIQUE_FractionApp38_Division.md) (section 2.6, which independently flagged the drop/land disconnect).

Both options are scoped entirely to `handleDropChunk` (and, for option 2, the `.bar-fill` hide call in `setupManualDragAndFill`) — no changes needed to the flying-animation timing/positioning code.
