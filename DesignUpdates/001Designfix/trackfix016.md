# Track Fix 016: Fix Trash Bin Bar Rendering with Equal Segments

## Fix Specification
**File**: `DesignUpdates/001Designfix/fix016.md`  
**Issue**: In the Subtraction app (異分母分數減法), the trash bin display shows bars with unequal segment lengths and may show only one bar instead of two.  
**Purpose**: Show two separate bars (red and blue) with equal-width segments in the trash bin to accurately represent the trashed pieces from both fractions.

## Implementation Date
2026-05-15

## Problem Analysis

### Root Cause
The React version was completely missing the trash content display functionality:
1. No `trash-content` div to show the bars
2. No `updateTrashTooltip()` function to render bars with equal segments
3. Trash area only showed the trash icon (🗑️) but no visual feedback of what was trashed

### Original HTML Reference
From `FractionApp48(Subtraction).html` (lines 732-751):
- `updateTrashTooltip(cd)` function renders trash content
- `genMini(count, color)` helper generates bars with equal segments using grid-overlay
- Shows TWO bars: "被減數 (紅) 已丟棄" and "減數 (藍) 已對消"
- Each bar uses `bar-unit` containers with `grid-overlay` containing `abs-thin-line` divs for equal segments

## Changes Made

### 1. App.tsx - Added updateTrashTooltip() Function
**File**: `src/apps/subtraction/App.tsx`

**Added complete function** (after updateTrashAreaVisibility, around line 1075):
```typescript
// Update trash content to show two bars with equal segments (Fix016)
function updateTrashTooltip(cd: number) {
  const tooltip = document.getElementById('trash-content') as HTMLElement | null
  if (!tooltip) return
  
  // Show empty message if nothing trashed yet
  if (trashedCount === 0 || !isCommonDenomReady) {
    tooltip.innerHTML = "<div style='text-align:center; color:#7f8c8d; padding:10px; font-weight:normal;'>目前垃圾桶是空的</div>"
    return
  }
  
  const w = Math.floor(trashedCount / cd)
  const n = trashedCount % cd
  let fracHtml = ''
  
  if (w > 0 && n === 0) {
    fracHtml = `<b>${w}</b> 個整數`
  } else if (w > 0) {
    fracHtml = `<b>${w}</b> 個整數 和 <div class="inline-frac"><span>${n}</span><div class="line"></div><span>${cd}</span></div>`
  } else {
    fracHtml = `<div class="inline-frac"><span>${n}</span><div class="line"></div><span>${cd}</span></div>`
  }
  
  // Generate mini bar with EQUAL segments (using grid-overlay)
  const genMini = (count: number, color: string) => {
    if (cd <= 0) return ''
    let html = '<div class="bar-wrap-container continuous" style="margin-top: 8px;">'
    const maxWholes = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--max-wholes')) || 1
    
    for (let i = 0; i < maxWholes; i++) {
      const fillPct = (i < Math.floor(count / cd)) 
        ? 100 
        : ((i === Math.floor(count / cd) && (count % cd) > 0) 
            ? ((count % cd) / cd) * 100 
            : 0)
      
      // Grid overlay with thin lines for EQUAL segments
      const gridLines = Array.from({length: cd - 1}, (_, k) => 
        `<div class="abs-thin-line" style="left:${((k + 1) / cd) * 100}%;"></div>`
      ).join('')
      
      html += `<div class="bar-unit" style="background: transparent;">${
        fillPct > 0 
          ? `<div class="bar-fill" style="width:${fillPct}%; background-color:${color}; opacity: 0.85;"></div>` 
          : ''
      }<div class="grid-overlay">${gridLines}</div></div>`
    }
    return html + '</div>'
  }
  
  // Show TWO bars: red (被減數) and blue (減數)
  tooltip.innerHTML = `
    <div style="margin-bottom: 15px;">
      <div style="padding: 0 15px;">
        <span style="color:var(--red); font-weight:bold;">被減數 (紅) 已丟棄: ${fracHtml}</span>
      </div>
      ${genMini(trashedCount, 'var(--red)')}
    </div>
    <div>
      <div style="padding: 0 15px;">
        <span style="color:var(--blue); font-weight:bold;">減數 (藍) 已對消: ${fracHtml}</span>
      </div>
      ${genMini(trashedCount, 'var(--blue)')}
    </div>
  `
}
```

**Key Implementation Details**:
- **Empty State**: Shows "目前垃圾桶是空的" when trashedCount === 0
- **Fraction Display**: Formats whole numbers and fractions using inline-frac style
- **genMini Helper**: Generates bar units with grid-overlay for equal segments
- **Grid Lines**: Uses `abs-thin-line` divs positioned at `(k+1)/cd * 100%` for equal spacing
- **Two Bars**: Red bar shows "被減數 (紅) 已丟棄", blue bar shows "減數 (藍) 已對消"
- **Fill Percentage**: Calculates fill based on count/cd for each whole unit
- **Continuous Container**: Uses `bar-wrap-container continuous` class for seamless display

### 2. App.tsx - Updated Trash Area HTML
**File**: `src\apps\subtraction\App.tsx`

**Replaced trash area structure** (around line 2031):
```tsx
<div id="trash-area" style="display:none; position:relative; width:100%; min-height:50px; align-items:flex-start; justify-content:space-between; border-top: 2px dashed #ccc; padding-top: 5px;">
  <div style="width:15%; display: flex; flex-direction: column; align-items: center; gap: 5px;">
    <div id="trash-can" style="font-size: 3rem;">🗑️</div>
    <div style="font-weight:bold; color:var(--dark); font-size:1rem;">垃圾桶</div>
  </div>
  <div id="trash-content" class="bars-column" style="background: white; padding: 15px 0; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.08); border: 1px solid #eee;">
    <div style='text-align:center; color:#7f8c8d; padding:10px; font-weight:normal;'>目前垃圾桶是空的</div>
  </div>
  <div style="width:15%;"></div>
</div>
```

**Changes**:
- Removed old trash-meter-card structure (meter, progress bar, capacity label)
- Added `trash-content` div with `bars-column` class
- Trash content spans 70% width in center column
- Left column (15%): Trash icon and label
- Center column (70%): Bar display area
- Right column (15%): Empty spacer
- Default content: "目前垃圾桶是空的"

### 3. App.tsx - Integration with Trash Operations
**File**: `src/apps/subtraction/App.tsx`

**Location 1 - After trashing pieces** (around line 1590):
```typescript
trashedCount += candidate.removePieces
updateSubtrahendCountdown(cd, animDuration)
updateTrashFeedback(cd)
updateTrashTooltip(cd)  // Added Fix016
updateLabelsDuringRemoval(cd)
```
- **Purpose**: Update trash display after pieces are removed
- **Timing**: Called during drag-and-drop trash animation
- **Result**: Bars grow as more pieces are trashed

**Location 2 - Step back operation** (around line 1517):
```typescript
isRearranged = false
trashedCount = 0
removalHistory = []
convertBarToDraggable(1, cd, 'var(--red)')
convertBarToDraggable(2, cd, 'var(--blue)')
updateSubtrahendCountdown(cd, 250)
updateTrashFeedback(cd)
updateTrashTooltip(cd)  // Added Fix016
updateLabelsDuringRemoval(cd)
```
- **Purpose**: Reset trash display when stepping back
- **Result**: Shows "目前垃圾桶是空的" message

**Location 3 - Common denominator ready** (around line 1847):
```typescript
trashedCount = 0
removalHistory = []
isRemovalAnimating = false
removalTargetPieces = getSafeValues().total_n2 * s2

convertBarToDraggable(1, cd1, 'var(--red)')
convertBarToDraggable(2, cd2, 'var(--blue)')
updateSubtrahendCountdown(cd1, 0)
updateLabelsDuringRemoval(cd1)
updateTrashFeedback(cd1)
updateTrashTooltip(cd1)  // Added Fix016
```
- **Purpose**: Reset trash display when denominators become common
- **Result**: Clears trash content for new removal phase

**Location 4 - Reset in updateUI()** (around line 1960):
```typescript
s1 = 1; s2 = 1
bar1Visible = false; bar2Visible = false
updateTrashAreaVisibility()
isCommonDenomReady = false
trashedCount = 0
removalTargetPieces = 0
updateTrashTooltip(vals.d1 * s1)  // Added Fix016
clearRemovalCue()
```
- **Purpose**: Reset trash display when problem changes
- **Result**: Empty trash message displayed

### 4. App.tsx - Window API Exposure
**File**: `src/apps/subtraction/App.tsx`

**Updated window._sub namespace** (around line 2167):
```typescript
;(window as any)._sub = {
  applyTool,
  toggleWholeNumber,
  toggleNumberLine,
  triggerErrorMerge,
  hideErrorMergeBar,
  updateTrashAreaVisibility,
  updateTrashTooltip,  // Added Fix016
  updateSpeed,
  randomChallenge,
  updateUI,
  autoCheck,
  onFrac1Click,
  onFrac2Click,
  toggleRearrange,
  stepBackSubtraction,
  resetSubtractionAnimation,
}
```
- Exposed for testing/debugging
- Can call manually: `window._sub.updateTrashTooltip(12)`

## Technical Deep Dive

### Equal Segment Rendering Algorithm

**Problem**: How to ensure all segments have equal width regardless of denominator?

**Solution**: Use grid-overlay with absolute positioning

1. **Container Structure**:
   ```html
   <div class="bar-unit" style="background: transparent;">
     <div class="bar-fill" style="width:X%; background-color:red;"></div>
     <div class="grid-overlay">
       <div class="abs-thin-line" style="left:Y%;"></div>
       <!-- More lines... -->
     </div>
   </div>
   ```

2. **Grid Line Positioning**:
   - For denominator `cd` with segments 1 to `cd-1`
   - Line at position k: `left: ((k+1) / cd) * 100%`
   - Example for cd=6: Lines at 16.67%, 33.33%, 50%, 66.67%, 83.33%
   - Creates cd equal sections

3. **Fill Percentage Calculation**:
   ```typescript
   const fillPct = (i < Math.floor(count / cd)) 
     ? 100                                      // Full units
     : ((i === Math.floor(count / cd) && (count % cd) > 0) 
         ? ((count % cd) / cd) * 100            // Partial unit
         : 0)                                    // Empty units
   ```

4. **Why This Works**:
   - Grid lines are positioned at exact fractional intervals
   - All segments between lines have equal width
   - Works for any denominator value
   - Visually consistent with main bar display

### CSS Classes Used

**Existing Classes** (from app.css and base.css):
- `.bar-wrap-container`: Flex container for bar units
- `.bar-wrap-container.continuous`: Removes gaps between units (gap: 0)
- `.bar-unit`: Individual whole number unit container
- `.bar-fill`: Colored fill inside unit
- `.grid-overlay`: Container for grid lines (position: absolute)
- `.abs-thin-line`: Vertical grid line (width: 1px, absolute positioning)
- `.bars-column`: Flex column layout for trash content
- `.inline-frac`: Inline fraction display with numerator/line/denominator

**No New CSS Required**: All necessary styles already exist in the codebase

### State Flow

```
User drags piece to trash
    ↓
trashedCount += removePieces
    ↓
updateTrashTooltip(cd) called
    ↓
Check trashedCount and isCommonDenomReady
    ↓
If empty: Show "目前垃圾桶是空的"
If not empty:
    ↓
Calculate w (wholes) and n (numerator)
    ↓
Format fracHtml display string
    ↓
genMini(trashedCount, 'red') → Generate red bar HTML
genMini(trashedCount, 'blue') → Generate blue bar HTML
    ↓
Set tooltip.innerHTML with both bars
    ↓
Trash content displays two bars with equal segments
```

### Visual Comparison

**Before Fix016**:
- Trash area showed only trash icon
- No visual feedback of trashed pieces
- No way to see progress

**After Fix016**:
- Trash icon + label on left
- Center area shows TWO bars:
  - Red bar: "被減數 (紅) 已丟棄: X/Y"
  - Blue bar: "減數 (藍) 已對消: X/Y"
- Each bar has equal-width segments defined by grid lines
- Visual consistency with main display area

## Files Modified
- `src/apps/subtraction/App.tsx`: Added updateTrashTooltip function, updated trash-area HTML, integrated calls at 4 locations, exposed to window._sub

## Educational Purpose

The trash bin display serves important pedagogical functions:

1. **Visual Progress Tracking**: Students see bars fill as they remove pieces
2. **Two-Bar Display**: Reinforces that BOTH fractions are involved in subtraction
3. **Equal Segments**: Shows consistent unit size (common denominator)
4. **Color Coding**: Red (被減數/minuend) vs. Blue (減數/subtrahend) maintains consistency
5. **Fraction Representation**: Shows both whole numbers and fractional parts
6. **Visual Confirmation**: Students can verify they've removed the correct amount

## Testing Recommendations

1. **Initial State**:
   - Load subtraction app
   - Click both fraction cards to show bars
   - Verify trash area appears with "目前垃圾桶是空的"

2. **Basic Trash Operation**:
   - Enter fractions with different denominators
   - Click both fraction cards
   - Use tools to create common denominator
   - Drag pieces to trash area
   - **VERIFY**: trash-content shows TWO bars (red and blue)
   - **VERIFY**: Both bars have equal-width segments
   - **VERIFY**: Segments match denominator value (e.g., 6 segments for d=6)

3. **Segment Equality**:
   - Try different denominators (3, 4, 5, 6, 8, 12)
   - For each denominator, verify:
     - Grid lines divide bar into equal sections
     - All segments have same visual width
     - Red and blue bars use identical grid layout

4. **Progressive Filling**:
   - Drag one piece at a time
   - Verify bars fill incrementally
   - Check that fill percentage matches pieces trashed

5. **Reset Operations**:
   - Click step back button
   - Verify trash content resets to empty message
   - Change input values
   - Verify trash content clears

6. **Edge Cases**:
   - Trash all pieces (bars should be 100% filled)
   - Trash fractional amounts (partial units)
   - Large denominators (12+): verify grid lines still equal

7. **Console Testing**:
   ```javascript
   // Test with different parameters
   window._sub.updateTrashTooltip(6)   // 6 segments
   window._sub.updateTrashTooltip(12)  // 12 segments
   ```

## Reference
- Original specification: `DesignUpdates/001Designfix/fix016.md`
- Image reference: `images/image_1.png` (shows equal segments comparison)
- Original HTML: `DesignUpdates/FractionApp48(Subtraction).html`
- Reference function: `updateTrashTooltip()` (lines 732-751)
- Reference helper: `genMini()` (lines 741-749)

## Implementation Notes

This fix required:
1. **Complete function port**: Translated updateTrashTooltip from original HTML
2. **HTML restructure**: Replaced old trash-meter design with trash-content column
3. **Multi-point integration**: Added calls at 4 key locations where trashedCount changes
4. **Equal segment algorithm**: Used grid-overlay with calculated line positions
5. **Two-bar display**: Shows both fractions to reinforce subtraction concept

The solution directly matches the original HTML implementation, ensuring visual consistency and proper educational feedback.

## Related Fixes
- **Fix015**: Implemented trash area visibility toggle (prerequisite for this fix)
- Both fixes together provide complete trash bin functionality with visual feedback
