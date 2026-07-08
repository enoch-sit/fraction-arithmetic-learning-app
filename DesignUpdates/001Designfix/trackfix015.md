# Track Fix 015: Display Trash Bin When Both Fraction Bars Are Visible

## Fix Specification
**File**: `DesignUpdates/001Designfix/fix015.md`  
**Issue**: In the Subtraction app (異分母分數減法), the trash bin area should be displayed when both fraction bars are visible, but currently it remains hidden or shows at incorrect times.  
**Purpose**: Allow users to see their progress toward completing subtraction by displaying the trash bin meter once both fractions are shown.

## Implementation Date
2026-05-15

## Changes Made

### 1. App.tsx - Trash Area Visibility Function
**File**: `src/apps/subtraction/App.tsx`

**Added updateTrashAreaVisibility()** (after hideErrorMergeBar, around line 1060):
```typescript
// Toggle trash area visibility based on bar visibility (Fix015)
function updateTrashAreaVisibility() {
  const trashArea = document.getElementById('trash-area') as HTMLElement | null
  if (!trashArea) return
  
  // Show trash area only when both bars are displayed
  if (bar1Visible && bar2Visible) {
    trashArea.style.display = 'flex'
  } else {
    trashArea.style.display = 'none'
  }
}
```
- **Purpose**: Controls trash area visibility based on bar state
- **Logic**: Shows trash area ONLY when both bar1Visible AND bar2Visible are true
- **Display Style**: Uses flexbox layout when visible
- **Safety**: Checks for null before manipulating DOM

### 2. App.tsx - Integration with Bar Display Functions
**File**: `src/apps/subtraction/App.tsx`

**Updated onFrac1Click()** (around line 172):
```typescript
function onFrac1Click() {
  const row = document.getElementById('bar1-row')!
  row.style.display = 'flex'
  s1 = 1
  renderBar(1, 'none')
  row.classList.remove('fade-in-slow')
  void (row as HTMLElement).offsetWidth
  row.classList.add('fade-in-slow')
  bar1Visible = true
  updateTrashAreaVisibility()  // Added Fix015
  checkCommonDenom()
  showNextActionCue()
}
```
- **Added Call**: `updateTrashAreaVisibility()` after setting `bar1Visible = true`
- **Purpose**: Check if trash should appear after first bar is shown
- **Behavior**: At this point only one bar is visible, so trash remains hidden

**Updated onFrac2Click()** (around line 185):
```typescript
function onFrac2Click() {
  const row = document.getElementById('bar2-row')!
  row.style.display = 'flex'
  s2 = 1
  renderBar(2, 'none')
  row.classList.remove('fade-in-slow')
  void (row as HTMLElement).offsetWidth
  row.classList.add('fade-in-slow')
  bar2Visible = true
  updateTrashAreaVisibility()  // Added Fix015
  checkCommonDenom()
  showNextActionCue()
}
```
- **Added Call**: `updateTrashAreaVisibility()` after setting `bar2Visible = true`
- **Purpose**: Show trash area when second bar appears
- **Behavior**: NOW both bars are visible, so trash area will display

### 3. App.tsx - Cleanup Integration
**File**: `src/apps/subtraction/App.tsx`

**Updated updateUI()** (around line 1895):
```typescript
enforceInputLimits()
updateMaxWholes()
const vals = getSafeValues()

s1 = 1; s2 = 1
bar1Visible = false; bar2Visible = false
updateTrashAreaVisibility()  // Added Fix015
isCommonDenomReady = false
trashedCount = 0
removalTargetPieces = 0
clearRemovalCue()
```
- **Added Call**: `updateTrashAreaVisibility()` after resetting both bar visibility flags
- **Purpose**: Hide trash area when resetting the problem
- **Behavior**: When bars are hidden, trash area also hides

### 4. App.tsx - Window API Exposure
**File**: `src/apps/subtraction/App.tsx`

**Updated window._sub namespace** (around line 2116):
```typescript
;(window as any)._sub = {
  applyTool,
  toggleWholeNumber,
  toggleNumberLine,
  triggerErrorMerge,
  hideErrorMergeBar,
  updateTrashAreaVisibility,  // Added Fix015
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
- Exposed `updateTrashAreaVisibility` for testing/debugging
- Can be called manually via browser console: `window._sub.updateTrashAreaVisibility()`

### 5. HTML Structure (Already Exists)
**File**: `src/apps/subtraction/App.tsx`

**Trash Area Container** (already exists at line 1973):
```tsx
<div id="trash-area" style="display:none; flex-direction: column; align-items: center; justify-content: center; width: 100%; min-height: 140px; margin-top: 10px; border-top: 2px dashed #ccc; padding-top: 15px;">
  <div class="trash-meter-card">
    <div class="trash-meter-head">
      <div id="trash-can" class="trash-can-icon">🗑️</div>
      <div class="trash-meter-copy">
        <div class="trash-meter-title">移除目標</div>
        <div id="trash-capacity-label">要拿走：0 格</div>
      </div>
    </div>
    <div id="trash-meter" class="trash-meter-track">
      <div id="trash-meter-fill" class="trash-meter-fill"></div>
    </div>
    <div id="trash-progress" class="trash-progress-copy">0 / 0 格</div>
    <div id="trash-tooltip" class="trash-status-copy">還沒有移走任何方塊</div>
  </div>
</div>
```
- **Initial State**: `display:none` (hidden by default)
- **Container ID**: `trash-area` for JavaScript targeting
- **Components**: Trash icon (🗑️), meter track, progress display, status messages
- **Layout**: Flexbox with column direction, centered alignment

## Technical Details

### State Variables Used
- `bar1Visible` (boolean): Tracks first fraction bar visibility
- `bar2Visible` (boolean): Tracks second fraction bar visibility
- **Trigger Condition**: `bar1Visible && bar2Visible` must both be true

### Display Flow
1. **Initial State**: Both bars hidden, trash area hidden
2. **User clicks first fraction card** (红色分數 or 藍色分數)
   - onFrac1Click() or onFrac2Click() called
   - First bar becomes visible: bar1Visible OR bar2Visible = true
   - updateTrashAreaVisibility() checks: still only one bar visible
   - Trash area remains hidden
3. **User clicks second fraction card**
   - Corresponding onClick function called
   - Second bar becomes visible: NOW both bar1Visible AND bar2Visible = true
   - updateTrashAreaVisibility() checks: condition satisfied!
   - Trash area display changes from 'none' to 'flex'
   - Trash meter, icon, and controls appear
4. **User resets or changes values**
   - updateUI() called
   - Both bar1Visible and bar2Visible reset to false
   - updateTrashAreaVisibility() hides trash area
   - Ready for next problem

### Educational Purpose
- **Visual Feedback**: Students see the trash bin appear when both fractions are ready
- **Progress Tracking**: Trash meter shows how many pieces removed vs. target
- **Clear Goal**: Trash icon (🗑️) and "移除目標" label indicate the objective
- **Contextual Availability**: Only shows when relevant (both bars displayed)

### Design Consistency
- Uses existing `trash-area` HTML structure (no new elements needed)
- Respects flex layout for smooth appearance
- Integrates with existing bar visibility state management
- Follows established pattern of checking state and updating DOM

## Files Modified
- `src/apps/subtraction/App.tsx`: Added updateTrashAreaVisibility function, integrated with bar display and cleanup functions, exposed to window._sub

## Testing Recommendations
1. **Initial Load**: Verify trash area is hidden when app first loads
2. **First Bar Click**: Click either 红色分數 or 藍色分數
   - Verify first bar appears
   - Verify trash area remains hidden
3. **Second Bar Click**: Click the other fraction card
   - Verify second bar appears with fade-in animation
   - **VERIFY**: Trash area appears below bars with 🗑️ icon
   - Verify trash meter shows "要拿走：X 格"
4. **Value Change**: Modify any input value (w1, n1, d1, w2, n2, d2)
   - Verify updateUI() resets both bars
   - Verify trash area hides again
5. **Random Challenge**: Click random button
   - Verify bars reset and hide
   - Verify trash area hides
   - Click both fraction cards again
   - Verify trash area reappears
6. **Console Test**: Open browser console and run:
   ```javascript
   window._sub.updateTrashAreaVisibility()
   ```
   - Verify function can be called manually
   - Verify trash visibility matches bar state

## Reference
- Original specification: `DesignUpdates/001Designfix/fix015.md`
- Image reference: `images/image_6.png` (shows trash bin visible with both bars)
- Original HTML: `DesignUpdates/FractionApp48(Subtraction).html`

## Implementation Notes
This fix was straightforward because:
1. The `trash-area` HTML structure already existed in the JSX
2. State variables `bar1Visible` and `bar2Visible` were already maintained
3. Only needed to add visibility control logic tied to existing state
4. All relevant functions (onFrac1Click, onFrac2Click, updateUI) already existed

The solution is minimal and clean - just a simple conditional display toggle based on bar visibility state. No new HTML, CSS, or state variables needed.

## Related Fixes
- **Fix016**: Will fix the rendering of trash bin bars (equal segment lengths)
- Both fixes work together to provide complete trash bin functionality
