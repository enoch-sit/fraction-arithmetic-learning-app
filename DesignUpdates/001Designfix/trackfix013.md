# Fix 013: Number Line Display Error in Subtraction App - Tracking Document

## Specification Reference
- **Source**: `DesignUpdates/001Designfix/fix013.md`
- **Reference HTML**: `DesignUpdates/FractionApp48(Subtraction).html`
- **Reference Image**: `images/image_7.png`

## Problem Summary
The number line (數線) in the Subtraction app displayed incorrectly due to incomplete `toggleNumberLine()` function implementation. The React version was missing the proper display control logic that existed in the original HTML version.

## Root Cause Analysis
1. **Incomplete toggleNumberLine() Function**: The React version only called renderBar() but didn't handle the display/visibility toggle or CSS class management for number line containers
2. **Missing Display Logic**: No code to show/hide the nl-wrap-container elements when checkbox was toggled
3. **Missing Continuous Class Toggle**: The continuous class (which removes gaps between units) wasn't being properly applied/removed

## Implementation Changes

### File: `src/apps/subtraction/App.tsx`

#### Change 1: Fixed toggleNumberLine() Function (Lines 67-97)
**Before**:
```typescript
function toggleNumberLine() {
  if (bar1Visible) renderBar(1, 'none')
  if (bar2Visible) renderBar(2, 'none')
  renderMismatchPreview()
}
```

**After**:
```typescript
function toggleNumberLine() {
  const showNL = (document.getElementById('show-nl-cb') as HTMLInputElement).checked

  // Handle all bar displays (bar1, bar2, mismatch-preview)
  const prefixes = ['bar1', 'bar2', 'mismatch-preview']

  prefixes.forEach((prefix) => {
    const wrap = document.getElementById(`${prefix}-wrap`)
    const nlWrap = document.getElementById(`${prefix}-nl`)

    if (wrap) {
      if (showNL) wrap.classList.add('continuous')
      else wrap.classList.remove('continuous')
    }

    if (nlWrap && nlWrap.innerHTML.trim() !== '') {
      if (showNL) {
        nlWrap.style.display = 'flex'
        nlWrap.classList.add('continuous')
      } else {
        nlWrap.style.display = 'none'
        nlWrap.classList.remove('continuous')
      }
    }
  })

  // Re-render bars to regenerate number lines if needed
  if (bar1Visible) renderBar(1, 'none')
  if (bar2Visible) renderBar(2, 'none')
  renderMismatchPreview()
}
```

**Rationale**: 
- Reads checkbox state to determine show/hide
- Loops through all three number line containers (bar1-nl, bar2-nl, mismatch-preview-nl)
- Applies 'continuous' class to both bar wraps and nl wraps for seamless unit connection
- Controls visibility with display: flex/none
- Then calls render functions to regenerate content

#### Change 2: Fixed renderBar() Number Line Section (Lines 250-269)
**Before**:
```typescript
if (nlWrap) {
  nlWrap.style.display = showNL ? 'flex' : 'none'
  if (showNL) {
    if (showNL) nlWrap.classList.add('continuous')  // Redundant if
    else nlWrap.classList.remove('continuous')
    nlWrap.innerHTML = ''
    const maxW2 = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--max-wholes')) || 1
    for (let i = 0; i < maxW2; i++) {
      const nlUnit = document.createElement('div')
      nlUnit.className = 'nl-unit'
      const piecesInUnit = d * s
      const filledPieces = Math.max(0, Math.min(total_n * s - i * piecesInUnit, piecesInUnit))
      const svg = renderNLUnit(i, d, s, filledPieces, piecesInUnit, color, maxW2)
      nlUnit.innerHTML = svg
      nlWrap.appendChild(nlUnit)
    }
  }
}
```

**After**:
```typescript
if (nlWrap) {
  nlWrap.style.display = showNL ? 'flex' : 'none'
  if (showNL) {
    nlWrap.classList.add('continuous')
    nlWrap.innerHTML = ''
    const maxW2 = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--max-wholes')) || 1
    for (let i = 0; i < maxW2; i++) {
      const nlUnit = document.createElement('div')
      nlUnit.className = 'nl-unit'
      const piecesInUnit = d * s
      const filledPieces = Math.max(0, Math.min(total_n * s - i * piecesInUnit, piecesInUnit))
      const svg = renderNLUnit(i, d, s, filledPieces, piecesInUnit, color, maxW2)
      nlUnit.innerHTML = svg
      nlWrap.appendChild(nlUnit)
    }
  } else {
    nlWrap.classList.remove('continuous')
  }
}
```

**Rationale**:
- Fixed redundant `if (showNL)` nested inside another `if (showNL)` block
- Added proper else block to remove 'continuous' class when hiding number line
- Cleaner conditional structure

## Technical Details

### Number Line Rendering Logic
The number line uses SVG rendering via `renderNLUnit()` function (lines 273-311):
- Creates SVG with viewBox="0 0 100 45" for scalability
- Draws filled rectangle for occupied fraction portions
- Draws horizontal line with vertical tick marks
- Major ticks at denominator boundaries (d divisions)
- Minor ticks at subdivision boundaries (d*s divisions)
- Labels show integer positions (0, 1, 2, etc.)
- Arrow endpoint on final unit

### CSS Support (src/apps/subtraction/app.css)
- `.nl-wrap-container`: Flex container with 15px gap between units
- `.nl-wrap-container.continuous`: Removes gap (gap: 0) for seamless number line
- `.nl-unit`: Individual unit containers with responsive width based on --max-wholes
- SVG width: 100% for responsive scaling
- Height: 45px (40px visible + 5px for labels)

### Integration with Bar Display
- Number line appears below each fraction bar
- Three instances: bar1-nl, bar2-nl, mismatch-preview-nl
- Synchronized with bar display through renderBar() and renderMismatchPreview()
- Checkbox "顯示數線" controls all instances simultaneously

## Verification Steps
1. ✅ Open Subtraction app (subtraction.html)
2. ✅ Click on first fraction to display bar1
3. ✅ Check "顯示數線" checkbox
4. ✅ Verify number line appears below bar1 with correct scale
5. ✅ Verify units connect seamlessly (no gaps)
6. ✅ Verify tick marks align with bar segments
7. ✅ Click on second fraction to display bar2
8. ✅ Verify number line appears below bar2
9. ✅ Verify mismatch preview shows number line with both fractions labeled
10. ✅ Uncheck "顯示數線" to verify proper hiding
11. ✅ Test with different fractions and denominators
12. ✅ Test with whole numbers (帶分數)
13. ✅ Test expand/simplify operations maintain number line accuracy

## Educational Value
The number line provides visual representation of:
- Absolute position of fractions on the continuous number scale
- Distance between fractions (for subtraction visualization)
- Relationship between different fractions when scaled to common denominator
- Integer boundaries and fractional subdivisions

## Status
✅ **COMPLETE** - Number line display now functions correctly with proper toggle behavior and seamless unit connection.

## Files Modified
- `src/apps/subtraction/App.tsx` (2 changes)

## Related Fixes
- This fix enables proper foundation for Fix014, Fix015, Fix016 which build upon the bar display system

---
**Fix Completed**: 2026-06-04
**Implementation Time**: ~15 minutes
**Complexity**: Low (function logic completion)
