# Track Fix 014: Incorrect Bar Display After Dragging Without Common Denominator

## Fix Specification
**File**: `DesignUpdates/001Designfix/fix014.md`  
**Issue**: When user drags fraction bars without first converting to common denominator, no visual feedback is shown to explain why the action is incorrect.  
**Educational Goal**: Help students understand that fractions with different denominators cannot be directly subtracted - they must find common denominator first.

## Implementation Date
2026-05-15

## Changes Made

### 1. App.tsx - State Management
**File**: `src/apps/subtraction/App.tsx`

**Added Error Display State** (after line 14):
```typescript
let errorMergeShown = false
```
- Tracks whether error display is currently shown
- Prevents duplicate error displays

### 2. App.tsx - Error Display Functions
**File**: `src/apps/subtraction/App.tsx`

**Added triggerErrorMerge()** (after clearTextSelection):
```typescript
function triggerErrorMerge() {
  const instrEl = document.getElementById('drag-instruction')
  if (instrEl) {
    instrEl.innerHTML = `⚠️ 分母不同，無法直接相減！請先點擊「擴分/約分」尋找公共的分母。`
  }
  showErrorMergeBar()
}
```
- Updates instruction text with error message
- Calls showErrorMergeBar to display visual feedback
- **Educational Message**: "分母不同，無法直接相減！" (Denominators different, cannot subtract directly!)

**Added showErrorMergeBar()** (after triggerErrorMerge):
```typescript
function showErrorMergeBar() {
  const errArea = document.getElementById('error-merge-area') as HTMLElement | null
  if (!errArea) return
  errArea.style.display = 'flex'

  const wrap = document.getElementById('error-bar-wrap') as HTMLElement | null
  const nlWrap = document.getElementById('error-nl-wrap') as HTMLElement | null
  if (!wrap || !nlWrap) return

  const showNL = (document.getElementById('show-nl-cb') as HTMLInputElement).checked
  const vals = getSafeValues()
  const maxW = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--max-wholes')) || 1

  wrap.innerHTML = ''
  nlWrap.innerHTML = ''

  const errorLabel = document.getElementById('error-label') as HTMLElement | null
  if (errorLabel) {
    errorLabel.innerHTML = `<div style="display:flex; align-items:center; justify-content:center; gap:5px; flex-wrap:wrap; font-size:1.8rem;">${getDisplayHtml(vals.w1, vals.n1, vals.d1, 'var(--red)')}<span style="font-weight:bold; color:var(--dark); font-size:1.8rem;">-</span>${getDisplayHtml(vals.w2, vals.n2, vals.d2, 'var(--blue)')}<span style="font-weight:bold; color:var(--dark); font-size:1.8rem;">?</span></div>`
  }

  for (let i = 0; i < maxW; i++) {
    const unit = document.createElement('div')
    unit.className = 'bar-unit'
    const pct1 = Math.max(0, Math.min(100, ((vals.total_n1 - (i * vals.d1)) / vals.d1) * 100))
    const pct2 = Math.max(0, Math.min(100, ((vals.total_n2 - (i * vals.d2)) / vals.d2) * 100))

    let grids = '<div class="grid-overlay">'
    // Add grid lines for BOTH denominators - this shows the mismatch
    for (let k = 1; k < vals.d1; k++) {
      grids += `<div class="abs-thin-line" style="left:${(k / vals.d1) * 100}%; height: 100%; top: 0;"></div>`
    }
    for (let k = 1; k < vals.d2; k++) {
      grids += `<div class="abs-thin-line" style="left:${(k / vals.d2) * 100}%; height: 100%; top: 0;"></div>`
    }
    grids += '</div>'

    // OVERLAPPING bars with different fills - shows visual mismatch
    unit.innerHTML = `<div class="bar-fill" style="width: ${pct1}%; background-color: var(--red); opacity: 0.85; height: 100%; top: 0; position: absolute; left: 0; z-index: 1;"></div><div class="bar-fill" style="width: ${pct2}%; background-color: var(--blue); opacity: 0.85; height: 100%; top: 0; position: absolute; left: 0; z-index: 2;"></div>${grids}`
    wrap.appendChild(unit)

    const nlUnit = document.createElement('div')
    nlUnit.className = 'nl-unit'
    let labelsHtml = (i === 0) ? `<div style="position: absolute; left: 0%; top: 0px; transform: translateX(-50%); display: flex; flex-direction: column; align-items: center; z-index: 5;"><div style="width: 2px; height: 6px; background: var(--dark); margin-bottom: 2px;"></div><span style="font-weight:bold; font-size:1.1rem; color:var(--dark);">0</span></div>` : ''
    labelsHtml += `<div style="position: absolute; left: 100%; top: 0px; transform: translateX(-50%); display: flex; flex-direction: column; align-items: center; z-index: 5;"><div style="width: 2px; height: 6px; background: var(--dark); margin-bottom: 2px;"></div><span style="font-weight:bold; font-size:1.1rem; color:var(--dark);">${i + 1}</span></div>`

    const f1 = vals.total_n1 / vals.d1
    const f2 = vals.total_n2 / vals.d2
    if (f1 > i && f1 <= i + 1) {
      labelsHtml += `<div style="position: absolute; left: ${(f1 - i) * 100}%; top: 0px; transform: translateX(-50%); display: flex; flex-direction: column; align-items: center; z-index: 6;"><div style="width: 2px; height: 10px; background: var(--red); margin-bottom: 2px;"></div><div style="transform: scale(0.85); transform-origin: top center; background: rgba(255,255,255,0.85); border-radius: 4px; padding: 2px; white-space:nowrap;">${getDisplayHtml(vals.w1, vals.n1, vals.d1, 'var(--red)')}</div></div>`
    }
    if (f2 > i && f2 <= i + 1) {
      labelsHtml += `<div style="position: absolute; left: ${(f2 - i) * 100}%; top: 0px; transform: translateX(-50%); display: flex; flex-direction: column; align-items: center; z-index: 6;"><div style="width: 2px; height: 10px; background: var(--blue); margin-bottom: 2px;"></div><div style="transform: scale(0.85); transform-origin: top center; background: rgba(255,255,255,0.85); border-radius: 4px; padding: 2px; white-space:nowrap;">${getDisplayHtml(vals.w2, vals.n2, vals.d2, 'var(--blue)')}</div></div>`
    }
    nlUnit.innerHTML = labelsHtml
    nlWrap.appendChild(nlUnit)
  }

  if (showNL) {
    wrap.classList.add('continuous')
    nlWrap.classList.add('continuous')
    nlWrap.style.display = 'flex'
  } else {
    wrap.classList.remove('continuous')
    nlWrap.classList.remove('continuous')
    nlWrap.style.display = 'none'
  }

  errorMergeShown = true
}
```
- Creates error display with **overlapping bars** showing both fractions
- **Key Visual Feature**: Shows grid lines for BOTH denominators simultaneously
- This demonstrates why direct subtraction is impossible - the divisions don't align
- Respects number line toggle setting
- Displays fraction labels with color coding (red and blue)

**Added hideErrorMergeBar()** (after showErrorMergeBar):
```typescript
function hideErrorMergeBar() {
  const errArea = document.getElementById('error-merge-area') as HTMLElement | null
  if (errArea) errArea.style.display = 'none'
  errorMergeShown = false
}
```
- Hides error display
- Resets state flag

### 3. App.tsx - Drag Handler Updates
**File**: `src/apps/subtraction/App.tsx`

**Updated updateRemovalTargets()** (around line 1256):
Modified block onclick and onpointerdown handlers:
```typescript
block.onclick = !isRemovalAnimating && isActiveCandidate
  ? () => {
    if (block.dataset.suppressClick === 'true') return
    if (isCommonDenomReady) {
      executeSubtractionStep(cd, { skipHand: true, stableBarAnimation: true })
    } else {
      triggerErrorMerge()
    }
  }
  : null
block.onpointerdown = !isRemovalAnimating && isActiveCandidate
  ? (event) => {
    if (isCommonDenomReady) {
      startRemovalDrag(event, block, cd, 'red')
    } else {
      triggerErrorMerge()
    }
  }
  : null
```
- **Changed from**: Only allowing interaction when `isCommonDenomReady` is true
- **Changed to**: Always allow click/drag on active blocks, but show error if denominators don't match
- Educational approach: Let students attempt the action, then explain why it's wrong

### 4. App.tsx - Cleanup Integration
**File**: `src/apps/subtraction/App.tsx`

**Updated updateUI()** (line 1860):
```typescript
function updateUI() {
  hideErrorMergeBar()
  const valsInput = getSafeValues()
  // ... rest of function
}
```
- Hides error when input values change

**Updated checkCommonDenom()** (line 1819):
```typescript
function checkCommonDenom() {
  if (!bar1Visible || !bar2Visible) return
  hideErrorMergeBar()
  const vals = getSafeValues()
  // ... rest of function
}
```
- Hides error when denominators are recalculated

**Updated toggleRearrange()** (existing function):
```typescript
hideErrorMergeBar()
```
- Added call at end of function to hide error when rearranging

### 5. App.tsx - Window API Exposure
**File**: `src/apps/subtraction/App.tsx`

**Updated window._sub namespace** (around line 2095):
```typescript
;(window as any)._sub = {
  applyTool,
  toggleWholeNumber,
  toggleNumberLine,
  triggerErrorMerge,
  hideErrorMergeBar,
  updateSpeed,
  randomChallenge,
  updateUI,
  autoCheck,
  onFrac1Click,
  onFrac2Click,
  toggleRearrange,
  stepBackSubtraction,
}
```
- Exposed triggerErrorMerge for potential testing/debugging
- Exposed hideErrorMergeBar for HTML button onclick handler

### 6. HTML Structure
**File**: `src/apps/subtraction/App.tsx`

**Error Merge Area Container** (already exists at line 1941):
```tsx
<div id="error-merge-area" style="display:none; position:relative; width:100%; min-height:80px; align-items:center; justify-content:space-between; background: #fff3cd; border: 2px solid #ff6b6b; border-radius: 12px; padding: 15px; margin-top: 10px; animation: errorShake 0.5s;">
  <div id="error-label" style="width:15%; text-align:center; font-weight:bold; color:var(--dark);"></div>
  <div class="bars-column">
    <div id="error-bar-wrap" class="bar-wrap-container"></div>
    <div id="error-nl-wrap" class="nl-wrap-container" style="display:none;"></div>
  </div>
  <div style="width:15%; display:flex; justify-content:center;">
    <button class="tool-btn" style="background: #666;" onclick="window._sub.hideErrorMergeBar()">✕ 關閉</button>
  </div>
</div>
```
- **Background**: #fff3cd (light yellow warning color)
- **Border**: 2px solid #ff6b6b (red error color)
- **Animation**: errorShake for attention
- **Close button**: Allows user to dismiss error display

### 7. CSS Animation
**File**: `src/apps/subtraction/app.css`

**Added errorShake keyframe** (before @media query at end):
```css
@keyframes errorShake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-8px); }
  75% { transform: translateX(8px); }
}
```
- Gentle shake animation to draw attention to error display
- Non-intrusive: only 8px movement
- Quick: completes in 0.5s

## Technical Details

### Visual Feedback Components
1. **Instruction Banner Update**: Changes to warning message explaining the problem
2. **Error Bar Display**: Shows BOTH fractions overlapping with their respective grid lines
3. **Grid Line Visualization**: Demonstrates denominator mismatch visually
4. **Color Coding**: Red for minuend, blue for subtrahend
5. **Number Line Integration**: Respects toggle setting, shows labels if enabled
6. **Close Button**: User-controlled dismissal

### Educational Value
- **Attempt-Then-Explain**: Students can attempt the incorrect action
- **Visual Demonstration**: Overlapping bars with mismatched grids show why it fails
- **Clear Messaging**: Instruction banner explains what's wrong and what to do
- **Persistent Reference**: Error display stays visible until user understands and dismisses it
- **Reinforces Concept**: Finding common denominator is prerequisite for subtraction

### Behavioral Flow
1. Student enters two fractions with different denominators
2. Student attempts to drag/click for subtraction
3. System detects denominators don't match (isCommonDenomReady = false)
4. triggerErrorMerge() is called
5. Error display appears with overlapping bars showing mismatch
6. Student can see visual proof of why direct subtraction is impossible
7. Student uses 擴分/約分 buttons to find common denominator
8. Error automatically hides when denominators change (checkCommonDenom)
9. Once denominators match, subtraction proceeds normally

## Files Modified
- `src/apps/subtraction/App.tsx`: Added error display functions, updated drag handlers, integrated cleanup
- `src/apps/subtraction/app.css`: Added errorShake animation

## Testing Recommendations
1. Enter two fractions with different denominators (e.g., 1/2 and 1/3)
2. Try to drag red bar or click blue bar
3. Verify error display appears with overlapping bars
4. Check that grid lines show both denominators (2 and 3)
5. Verify instruction banner shows error message
6. Click 擴分/約分 to find common denominator
7. Verify error display automatically hides
8. Verify subtraction can now proceed normally
9. Test with number line enabled/disabled
10. Test close button dismissal

## Reference
- Original HTML: `DesignUpdates/FractionApp48(Subtraction).html`
  - Line 543: triggerErrorMerge() implementation
  - Line 548: showErrorMergeBar() implementation
  - Line 848: error-merge-area HTML structure

## Educational Design Notes
The overlapping bar visualization is pedagogically powerful:
- Students see TWO sets of grid lines simultaneously
- The grid lines DON'T align at the same positions
- This visual mismatch makes it obvious why pieces can't be directly compared
- Red and blue overlapping fills show both quantities clearly
- Number line labels reinforce the actual values being subtracted

This is superior to simply blocking the action or showing a text error - students understand WHY through visual proof.
