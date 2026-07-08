# Multi-App Integration Plan: Integer Parts & Fraction Conversion

**Document Version**: 2.0  
**Created**: June 3, 2026  
**Updated**: June 3, 2026

This plan covers integration of **two related features**:
- **FractionApp65**: Integer Parts / Factor Arrangements (整數的部份)
- **FractionApp66**: Integer-Fraction Conversion (整數與分數互換)

---

# PART A: FractionApp65 (整數的部份)

**Feature Name**: Integer Parts / Factor Arrangements  
**Source**: tmp/FractionApp65(整數的部份).html  
**Target**: React/TypeScript app in `src/apps/integerparts/`  
**Priority**: Medium (can be deferred)

---

## 1. Feature Overview

### Purpose
Educational tool for understanding integers as products of factors, visualizing different rectangular arrangements of the same quantity.

### Core Concepts
- **Factorization**: Express an integer as factor1 × factor2
- **Array Model**: Visual representation using grid arrangements of circles
- **Multiple Representations**: Same integer can be arranged in different row×column configurations

### Two Modes

#### Mode 1: Exploration Mode (探索模式)
- User inputs a target integer (1-999)
- User tries different factor pairs
- System validates: factor1 × factor2 = target?
- **Correct**: Arrange circles in rows × columns grid ✅
- **Incorrect**: Show error, scatter circles randomly
- **Next button** (⏭): Cycles through valid factor pairs automatically
- **Swap button** (⇄): Swaps factor1 and factor2 values

#### Mode 2: All Arrangements Mode (完整排列模式)
- Display all valid factor pair arrangements simultaneously
- Each arrangement shown as a miniature card
- Cards contain: label (e.g., "2 × 3") + small grid of circles
- Dynamic circle sizing to fit large numbers (up to 999)

### Key Interactions
1. **Input target integer** → System calculates all factor pairs
2. **Mode toggle** → Switch between exploration and overview
3. **Factor input** → Validate and arrange or show error
4. **Next/Swap buttons** → Navigate through valid arrangements
5. **Dynamic sizing** → Circles resize based on grid dimensions

---

## 2. Component Reuse Strategy

### 2.1 Reusable Components (Use As-Is) ✅

#### `AppHeader`
- **Usage**: Display "整數的部份" title
- **Props**: Just needs title string
- **Changes**: None needed

#### `LangBtn` (Optional)
- **Usage**: Language toggle if bilingual support needed
- **Props**: Standard language props
- **Changes**: None needed

### 2.2 Components NOT Suitable for Reuse ❌

#### `ActionButtonRow`
- **Why Not**: Different button structure (swap + next in same row with inputs)
- **Alternative**: Create inline button elements in FactorRow component

#### `StepperInput`
- **Why Not**: Design uses plain input boxes, not steppers
- **Alternative**: Use standard HTML input with custom styling

#### `ControlsPill`
- **Why Not**: Only one toggle button needed (mode switch), not a control panel
- **Alternative**: Single button element in header area

#### `FractionBar` / `NumberLineDisplay`
- **Why Not**: Completely different visualization (circles vs bars/lines)
- **Alternative**: Create new CircleGrid component

---

## 3. New Components to Create

### 3.1 CircleGrid Component

**File**: `src/shared/components/CircleGrid.tsx`

**Purpose**: Render circles in either grid layout (arranged) or flex layout (scattered)

**Props**:
```typescript
interface CircleGridProps {
  total: number              // Number of circles to render
  rows: number | null        // Grid rows (null = scattered mode)
  cols: number | null        // Grid columns (null = scattered mode)
  isArranged: boolean        // true = grid, false = scattered
}
```

**Key Features**:
- Dynamic CSS variable sizing: `--circle-size`, `--gap-size`
- Grid mode: `display: grid; grid-template-columns: repeat(cols, ...)`
- Scatter mode: `display: flex; flex-wrap: wrap` with random rotations
- Dynamic sizing algorithm based on viewport and grid dimensions
- Yellow circles with border and shadow

**Styling**: Inline styles + CSS module or styled-components

---

### 3.2 FactorRow Component

**File**: `src/shared/components/FactorRow.tsx`

**Purpose**: Display the equation row: = [factor1] × [factor2] [swap] [next] [status]

**Props**:
```typescript
interface FactorRowProps {
  factor1: number | string
  factor2: number | string
  onFactor1Change: (val: number) => void
  onFactor2Change: (val: number) => void
  onSwap: () => void
  onNext: () => void
  status: 'idle' | 'correct' | 'error'
  showShake: boolean
}
```

**Key Features**:
- Two input boxes (styled as `.math-box.small`)
- Swap button (⇄) and Next button (⏭)
- Status indicator: ✅ (green) or "錯誤" (red)
- Shake animation on error
- Click handler for row activation
- Active/error/viewing state styling

**Styling**: Import from `app.css`

---

### 3.3 ArrangementCard Component

**File**: `src/shared/components/ArrangementCard.tsx`

**Purpose**: Display a single miniature arrangement card for Mode 2

**Props**:
```typescript
interface ArrangementCardProps {
  rows: number
  cols: number
  total: number
  miniSize: number          // Dynamic size for miniature circles
}
```

**Key Features**:
- White card with shadow and hover effect
- Label: `${rows} × ${cols}`
- Miniature grid of circles (3px to 24px depending on total)
- Dynamic sizing algorithm:
  - 24px for small grids
  - 16px if cols/rows > 10
  - 10px if cols/rows > 25
  - 6px if cols/rows > 50
  - 3px if cols/rows > 100

**Styling**: Inline styles or CSS module

---

## 4. App Structure

### File Structure
```
src/apps/integerparts/
├── App.tsx              # Main app logic and state
├── app.css              # App-specific styles
└── main.tsx             # Entry point
```

### State Management

```typescript
interface IntegerPartsState {
  targetInteger: number          // Main input (1-999)
  mode: 1 | 2                    // 1 = Exploration, 2 = All Arrangements
  factor1: number | ''           // First factor input
  factor2: number | ''           // Second factor input
  status: 'idle' | 'correct' | 'error'  // Validation status
  showShake: boolean             // Trigger shake animation
  factorPairs: [number, number][] // All valid factor pairs
  currentPairIndex: number       // Index for Next button cycling
}
```

### Core Functions

#### `getFactorPairs(num: number): [number, number][]`
- Calculate all factor pairs for a given integer
- Returns array of [factor1, factor2] tuples
- Example: 12 → [[1,12], [2,6], [3,4], [4,3], [6,2], [12,1]]

#### `validateFactors(f1: number, f2: number, target: number): boolean`
- Check if f1 × f2 === target
- Update status state accordingly

#### `calculateDynamicSize(rows: number, cols: number): { circleSize: number, gap: number }`
- Algorithm to fit circles in viewport
- Consider container dimensions (85% width, 55% height)
- Return optimal circle size and gap

#### `handleModeToggle()`
- Switch between mode 1 and mode 2
- Reset visualization state

#### `handleNextPair()`
- Cycle to next valid factor pair
- Update factor1 and factor2 inputs
- Trigger validation and arrangement

#### `handleSwap()`
- Swap factor1 and factor2 values
- Trigger validation

---

## 5. Styling Requirements

### Global Styles (base.css)
- Already has font family and base resets
- No changes needed

### App-Specific Styles (app.css)

#### CSS Variables
```css
:root {
  --circle-size: 45px;
  --gap-size: 10px;
}
```

#### Key Classes
- `.header-title`: Positioned top-left title
- `.mode-toggle-btn`: Positioned top-right button (blue/orange)
- `.input-section`: White card container for inputs
- `.math-box`: Large input box (80×80px, 32px font)
- `.math-box.small`: Small input box (60×60px, 24px font)
- `.symbol`: Multiplication symbol styling
- `.symbol-equals`: Equals sign styling
- `.formula-row`: Interactive row with hover/active/error/viewing states
- `.swap-btn`, `.next-btn`: Icon buttons
- `.status-indicator`: Status display area
- `.circle`: Yellow circle with border and shadow
- `.circle-container`: Flex or grid container for circles
- `@keyframes shake`: Error animation

#### Responsive Considerations
- Dynamic sizing based on viewport
- Max integer value: 999 (prevents overflow)
- Mobile: May need to adjust input sizes and circle sizes

---

## 6. Implementation Phases

### Phase 1: Component Foundation (Day 1)
- Create `src/apps/integerparts/` folder structure
- Create CircleGrid component (basic rendering)
- Create FactorRow component (UI only, no logic)
- Create ArrangementCard component

### Phase 2: Core Logic (Day 2)
- Implement state management in App.tsx
- Implement `getFactorPairs` algorithm
- Implement `validateFactors` logic
- Implement dynamic sizing algorithm
- Wire up input handlers

### Phase 3: Mode 1 Implementation (Day 3)
- Single-row factor input
- Validation logic
- Grid arrangement on success
- Scatter on error
- Shake animation
- Next/Swap buttons

### Phase 4: Mode 2 Implementation (Day 4)
- Mode toggle functionality
- Render all arrangement cards
- Miniature grid sizing algorithm
- Hover effects on cards

### Phase 5: Polish & Testing (Day 5)
- Refine animations
- Test edge cases (1, 999, primes)
- Responsive design testing
- Add to build configuration
- Add to hub navigation

---

## 7. Build Configuration Updates

### Files to Modify
1. **build-all.mjs**: Add `'integerparts'` to pages array
2. **integerparts.html**: Create entry point HTML file

### Entry Point HTML
```html
<!doctype html>
<html lang="zh-Hant">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>整數的部份</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/apps/integerparts/main.tsx"></script>
  </body>
</html>
```

---

## 8. Testing Scenarios

### Functional Tests
- [ ] Input integer → see scattered circles
- [ ] Input correct factors → see grid arrangement ✅
- [ ] Input incorrect factors → see error message + shake
- [ ] Click Next → cycle through valid factor pairs
- [ ] Click Swap → swap factor1 and factor2
- [ ] Toggle mode → switch between exploration and all arrangements
- [ ] Mode 2 → see all factor pairs displayed as cards
- [ ] Prime numbers (e.g., 7) → only show 1×7 and 7×1
- [ ] Square numbers (e.g., 9) → include 3×3 arrangement
- [ ] Large numbers (e.g., 500+) → see proper dynamic sizing

### Edge Cases
- [ ] Integer = 1 → only 1×1
- [ ] Integer = 999 → handle maximum value
- [ ] Empty factor inputs → no crash
- [ ] Non-numeric input → validation
- [ ] Prime numbers → minimal factor pairs
- [ ] Highly composite numbers (e.g., 60) → many arrangements

### Visual Tests
- [ ] Circles fit viewport without overflow
- [ ] Dynamic sizing works for all ranges (1-999)
- [ ] Mode 2 miniature grids readable
- [ ] Shake animation smooth
- [ ] Hover effects on cards
- [ ] Transitions smooth

---

## 9. Component Comparison Summary

| Component | Reuse? | Reason | Alternative |
|-----------|--------|--------|-------------|
| AppHeader | ✅ Yes | Standard header, no changes | - |
| LangBtn | ✅ Optional | Language toggle | - |
| ActionButtonRow | ❌ No | Different button structure | Inline buttons in FactorRow |
| StepperInput | ❌ No | Design uses plain inputs | Standard HTML input |
| ControlsPill | ❌ No | Only one toggle button | Single button element |
| FractionBar | ❌ No | Different visualization | CircleGrid (new) |
| NumberLineDisplay | ❌ No | Not needed for this feature | - |
| CircleGrid | 🆕 New | Circle arrangement visualization | Create new component |
| FactorRow | 🆕 New | Factor input row with buttons | Create new component |
| ArrangementCard | 🆕 New | Miniature grid cards for mode 2 | Create new component |

---

## 10. Risk Assessment

### Low Risk ✅
- AppHeader reuse (proven pattern)
- Basic input handling
- Factor calculation algorithm (straightforward)

### Medium Risk ⚠️
- Dynamic sizing algorithm (needs careful tuning)
- Performance with large integers (e.g., 999 circles)
- Mode 2 rendering with many cards (highly composite numbers)

### Mitigation Strategies
- **Performance**: Use `useMemo` for factor calculations
- **Sizing**: Test with various integer ranges, add min/max constraints
- **Rendering**: Limit circle rendering with virtualization if needed

---

## 11. Hub Integration

### Add to Navigation
**File**: `src/hub/App.tsx`

```typescript
{ 
  href: 'integerparts.html', 
  emoji: '🔢', 
  title: '整數的部份', 
  desc: '探索整數的因數組合，以圓圈陣列視覺化不同排列方式', 
  color: '#2c3e50' 
}
```

---

## 12. Success Criteria

### Must Have ✅
- [x] Mode 1 works: validate factors, arrange circles
- [x] Mode 2 works: display all arrangements
- [x] Next/Swap buttons functional
- [x] Dynamic sizing for all integer ranges (1-999)
- [x] Build successful
- [x] No TypeScript errors

### Should Have 🎯
- [ ] Smooth animations
- [ ] Responsive on mobile
- [ ] Accessible (keyboard navigation)
- [ ] Performance optimized

### Nice to Have ✨
- [ ] Guided tour
- [ ] Sound effects
- [ ] Color themes
- [ ] Save/share arrangements

---

## 13. Decision Log

### Design Decisions

**Decision 1**: Use standard HTML inputs instead of StepperInput
- **Reason**: Original design has simple input boxes, steppers would add unnecessary complexity
- **Impact**: Simpler implementation, fewer dependencies

**Decision 2**: Create three new components (CircleGrid, FactorRow, ArrangementCard)
- **Reason**: Feature is sufficiently different from existing apps, reuse would require extensive modifications
- **Impact**: Clear separation of concerns, easier maintenance

**Decision 3**: Keep mode toggle as standalone button
- **Reason**: Single toggle doesn't justify using ControlsPill
- **Impact**: Simpler UI, less overhead

**Decision 4**: Inline buttons in FactorRow instead of ActionButtonRow
- **Reason**: Buttons are integrated with the formula row, not separate action buttons
- **Impact**: Better visual cohesion, component fits specific use case

---

## 14. Next Steps

1. **Review this plan** with team/user
2. **Create TRACK.md** for progress tracking
3. **Implement Phase 1**: Create component structure
4. **Iterate through phases 2-5**
5. **Build and test**
6. **Update hub navigation**
7. **Document any learnings**

---

# PART B: FractionApp66 (整數與分數互換)

**Feature Name**: Integer-Fraction Conversion  
**Source**: tmp/FractionApp66(整數與分數互換).html  
**Target**: React/TypeScript app in `src/apps/intfracconv/`  
**Priority**: HIGH (Execute immediately)

---

## B1. Feature Overview

### Purpose
Educational tool for understanding the relationship between whole numbers, proper fractions, improper fractions, and mixed numbers through interactive bar visualization.

### Core Concepts
- **Three Input Modes**: Whole number, Fraction, Mixed number
- **Bar Visualization**: Interactive cells that represent fractions
- **Type Detection**: Identifies whole, proper fraction, improper fraction, mixed number
- **Bidirectional Conversion**: Shows all equivalent forms

### Three Input Modes (Right-click/Long-press to Switch)

#### Mode 1: Whole Number (整數)
- Input: Integer only
- Example: `5`
- Displays: 5 complete bars (no subdivisions)

#### Mode 2: Fraction (分數)
- Input: Numerator/Denominator only  
- Example: `7/3` (improper) or `2/5` (proper)
- Displays: Bars subdivided into denominator parts, filled based on numerator

#### Mode 3: Mixed Number (帶分數)
- Input: Whole + Numerator/Denominator
- Example: `2 1/3`
- Displays: Complete bars + fractional bar

### Visual Features

#### Bar Display
- **Smooth Mode Transition**: CSS variable `--f` (0=bar, 1=fraction) animates height/borders
- **Interactive Cells**: Click any cell to set the value
- **Dynamic Labels**: Shows whole numbers at bar boundaries, fractions at subdivisions
- **Color Coding**:
  - Filled cells: Red (`--primary-red: #ff3333`)
  - Border: Blue when bar mode, gray when fraction mode
  - Whole numbers: Green (`--integer-green: #009900`)
  - Numerators: Red, Denominators: Blue

#### Adjustable Display
- **Height Slider**: 0-100 (controls bar height and fraction mode interpolation)
- **Width Slider**: 50-300px per unit bar

### Conversion Panel

Shows automatic conversions:
- **Current value type**: Whole / Proper Fraction / Improper Fraction / Mixed Number
- **To Fraction**: Shows `n/d` form (if not already)
- **To Mixed Number**: Shows `w n/d` form (if not already) 
- **To Whole**: Shows integer (if exact division)

### Key Interactions

1. **Mode Switch** (Right-click/Long-press) → Change input layout
2. **Input Values** → Update bar visualization
3. **Click Cell** → Set value based on current mode
4. **Adjust Sliders** → Change visual appearance
5. **View Conversions** → See all equivalent forms

---

## B2. Component Reuse Strategy

### B2.1 Reusable Components (Use As-Is) ✅

#### `AppHeader`
- **Usage**: Display "整數與分數互換" title
- **Props**: Standard title string
- **Changes**: None needed

#### `LangBtn` (Optional)
- **Usage**: Language toggle if needed
- **Props**: Standard
- **Changes**: None

### B2.2 Components NOT Suitable for Reuse ❌

#### `StepperInput`
- **Why Not**: Uses plain input boxes with validation
- **Alternative**: Standard HTML inputs

#### `ActionButtonRow`
- **Why Not**: Only has one confirm button
- **Alternative**: Inline button element

#### `ControlsPill`
- **Why Not**: Uses range sliders in settings panel
- **Alternative**: Standard HTML range inputs

#### Existing Visualization Components
- **Why Not**: Unique bar/cell visualization
- **Alternative**: Create new InteractiveBars component

---

## B3. New Components to Create

### B3.1 InteractiveBars Component

**File**: `src/shared/components/InteractiveBars.tsx`

**Purpose**: Render interactive bar visualization with clickable cells, dynamic labels, and smooth mode transitions

**Props**:
```typescript
interface InteractiveBarsProps {
  whole: number          // Whole number part
  numerator: number      // Numerator (0 if whole mode)
  denominator: number    // Denominator
  barHeight: number      // Height in pixels (affects mode interpolation)
  unitWidth: number      // Width per bar in pixels
  onCellClick: (totalCells: number, denominator: number) => void
}
```

**Key Features**:
- **CSS Variable Animation**: `--f` controls transition between bar/fraction modes
  - `--f = 0`: Full bar mode (height 100%, solid borders)
  - `--f = 1`: Fraction mode (height 0, center lines, tick marks)
  - Interpolation: `f = (26 - height) / 20` when height is 6-26
- **Dynamic Cell Generation**: Creates bars with subdivided cells
- **Center Line & Tick Marks**: Visible in fraction mode (opacity controlled by `--f`)
- **Border Overlay**: Blue border fades as `--f` increases
- **Interactive Cells**: Click to set value based on mode
- **Dynamic Labels**: 
  - Whole numbers at bar boundaries (green)
  - Fractions at subdivisions (mixed number format: whole + num/den)
- **Auto-sizing**: Calculates number of bars needed based on total cells

**Styling**: Uses CSS-in-JS with CSS variables

---

### B3.2 ModeSelector Component

**File**: `src/shared/components/ModeSelector.tsx`

**Purpose**: Context menu for switching between whole/fraction/mixed modes

**Props**:
```typescript
interface ModeSelectorProps {
  visible: boolean
  x: number              // Menu position X
  y: number              // Menu position Y
  onSelect: (mode: 'whole' | 'fraction' | 'mixed') => void
  onClose: () => void
}
```

**Key Features**:
- Positioned absolutely at click/touch coordinates
- Three options: 整數, 分數, 帶分數
- Hover effects
- Closes on select or outside click

**Styling**: White background, shadow, rounded corners

---

### B3.3 ConversionPanel Component

**File**: `src/shared/components/ConversionPanel.tsx`

**Purpose**: Display type detection and conversion information

**Props**:
```typescript
interface ConversionPanelProps {
  whole: number
  numerator: number
  denominator: number
}
```

**Key Features**:
- **Type Detection Logic**:
  - Whole: `n === 0`
  - Proper Fraction: `w === 0 && n < d`
  - Improper Fraction: `w === 0 && n >= d`
  - Mixed Number: `w > 0 && n > 0`
- **Conversion Display**:
  - To Fraction: `(w*d + n) / d`
  - To Mixed Number: `floor(total/d)  (total%d)/d`
  - To Whole: If `total % d === 0`
- **Fraction Rendering**: Uses stacked fraction display

**Styling**: Info section with title and formatted conversions

---

## B4. App Structure

### File Structure
```
src/apps/intfracconv/
├── App.tsx              # Main app logic and state
├── app.css              # App-specific styles
└── main.tsx             # Entry point

src/shared/components/
├── InteractiveBars.tsx     # NEW - Bar visualization
├── ModeSelector.tsx        # NEW - Mode context menu
└── ConversionPanel.tsx     # NEW - Conversion info display
```

### State Management

```typescript
interface IntFracConvState {
  mode: 'whole' | 'fraction' | 'mixed'  // Current input mode
  whole: number | ''                     // Whole number input (1-100)
  numerator: number | ''                 // Numerator input (1-100)
  denominator: number | ''               // Denominator input (1-100)
  barHeight: number                      // Height slider (0-100)
  unitWidth: number                      // Width slider (50-300)
  menuVisible: boolean                   // Context menu visibility
  menuX: number                          // Menu position X
  menuY: number                          // Menu position Y
}
```

### Core Functions

#### `handleModeChange(mode: 'whole' | 'fraction' | 'mixed')`
- Switch input mode
- Reset all inputs to 1
- Show/hide appropriate input fields
- Update visualization

#### `handleCellClick(totalCells: number, den: number)`
- Calculate appropriate whole/numerator values based on current mode
- **Whole mode**: `w = ceil(totalCells / den)`
- **Fraction mode**: `w = 0, n = totalCells`
- **Mixed mode**: `w = floor(totalCells / den), n = totalCells % den`
- Update state and re-render

#### `calculateConversions(w: number, n: number, d: number)`
- Calculate total cells: `totalNum = w * d + n`
- Calculate improper fraction: `totalNum / d`
- Calculate mixed number: `floor(totalNum / d)  (totalNum % d) / d`
- Detect type based on values

#### `handleContextMenu(e: React.MouseEvent)`
- Prevent default context menu
- Show custom mode selector at cursor position

#### `handleLongPress(e: React.TouchEvent)`
- Detect 600ms touch hold
- Show mode selector at touch coordinates

---

## B5. Styling Requirements

### Global Styles (base.css)
- Font already configured
- No changes needed

### App-Specific Styles (app.css)

#### CSS Variables
```css
:root {
  --primary-red: #ff3333;
  --border-blue: #0000ff;
  --integer-green: #009900;
  --bg-gray: #f9f9f9;
  --f: 0;                    /* Mode interpolation factor */
  --bar-h: 45px;              /* Dynamic bar height */
}
```

#### Key Classes
- `.app-container`: Main wrapper (850px, white, shadowed)
- `.header`: Title bar with bottom border
- `.bars-container`: Flex container for bar wrappers
- `.bar-wrapper`: Individual bar column
- `.unit-bar`: Bar element with cells (uses `--f` for transitions)
- `.center-line`: Horizontal line (visible when `--f > 0`)
- `.border-overlay`: Blue border (fades with `--f`)
- `.unit-bar::before`, `.cell::after`: Vertical tick marks (visible when `--f > 0`)
- `.cell`: Interactive cell (red when filled, clickable)
- `.label-row`: Container for fraction labels
- `.bar-label`: Individual label (whole numbers + fractions)
- `.stacked-fraction`: Vertical fraction display
- `.mixed-number`: Mixed number layout (whole + fraction)
- `.dashboard`: Grid layout for inputs + conversion panel
- `.input-section`: Input area with mode switching
- `.fraction-ui`: Flex layout for input boxes
- `.btn-confirm`: Submit button styling
- `.info-section`: Conversion panel styling

#### Smooth Transition Styles
- Bar height: `calc(... * (1 - var(--f, 0)) + ... * var(--f, 0))`
- Border opacity: `calc(1 - var(--f, 0))`
- Tick mark opacity/height: Controlled by `--f`
- Background transparency: `rgba(..., calc(1 - var(--f, 0)))`

---

## B6. Implementation Phases

### Phase 1: Component Foundation (Day 1)
- Create `src/apps/intfracconv/` folder
- Create InteractiveBars component (basic structure)
- Create ModeSelector component
- Create ConversionPanel component

### Phase 2: Core Logic (Day 2)
- Implement state management in App.tsx
- Implement mode switching logic
- Implement input validation (1-100 ranges)
- Wire up conversion calculations

### Phase 3: Interactive Bars (Day 3)
- Implement bar rendering logic
- Implement cell click handlers
- Implement dynamic label generation
- Implement CSS variable transitions

### Phase 4: Mode Transitions (Day 4)
- Wire up height slider to `--f` calculation
- Implement smooth visual transitions
- Test all three modes thoroughly
- Refine styling and animations

### Phase 5: Polish & Testing (Day 5)
- Test edge cases (1, 100, improper fractions)
- Responsive design testing
- Context menu long-press for mobile
- Add to build configuration
- Add to hub navigation

---

## B7. Build Configuration Updates

### Files to Modify
1. **build-all.mjs**: Add `'intfracconv'` to pages array
2. **intfracconv.html**: Create entry point HTML file

### Entry Point HTML
```html
<!doctype html>
<html lang="zh-Hant">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>整數與分數互換</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/apps/intfracconv/main.tsx"></script>
  </body>
</html>
```

---

## B8. Testing Scenarios

### Functional Tests
- [ ] Switch modes via context menu (right-click)
- [ ] Switch modes via long-press (touch)
- [ ] Input whole number → see solid bars
- [ ] Input proper fraction (e.g., 2/5) → see partial bar
- [ ] Input improper fraction (e.g., 7/3) → see multiple bars
- [ ] Input mixed number (e.g., 2 1/3) → see whole + fractional bars
- [ ] Click cell → update value based on current mode
- [ ] Adjust height slider → smooth transition between bar/fraction modes
- [ ] Adjust width slider → bars resize
- [ ] View conversions → see all equivalent forms

### Edge Cases
- [ ] Whole = 100 (maximum value)
- [ ] Numerator = 100, Denominator = 1 (edge improper fraction)
- [ ] Denominator = 1 (should behave like whole number)
- [ ] All inputs = 1 (minimum values)
- [ ] Height = 0 (full fraction mode)
- [ ] Height = 100 (full bar mode)
- [ ] Height = 6-26 (interpolation range)

### Visual Tests
- [ ] Smooth height transition
- [ ] Border fade animation
- [ ] Tick marks appear/disappear smoothly
- [ ] Labels positioned correctly
- [ ] Color coding consistent (green/red/blue)
- [ ] Context menu appears at correct position
- [ ] Mobile long-press works

---

## B9. Component Comparison Summary

| Component | Reuse? | Reason | Alternative |
|-----------|--------|--------|-------------|
| AppHeader | ✅ Yes | Standard header | - |
| LangBtn | ✅ Optional | Language toggle | - |
| StepperInput | ❌ No | Uses plain inputs | Standard HTML input |
| ActionButtonRow | ❌ No | Single confirm button | Inline button |
| ControlsPill | ❌ No | Uses range sliders | Standard range inputs |
| FractionBar | ❌ No | Different visualization | InteractiveBars (new) |
| InteractiveBars | 🆕 New | Cell-based bar with click interaction | Create new |
| ModeSelector | 🆕 New | Context menu for mode switching | Create new |
| ConversionPanel | 🆕 New | Type detection + conversion display | Create new |

---

## B10. Risk Assessment

### Low Risk ✅
- AppHeader reuse (proven pattern)
- Basic input handling
- Mode switching logic

### Medium Risk ⚠️
- CSS variable interpolation animation (needs careful tuning)
- Touch long-press detection (cross-browser/device compatibility)
- Dynamic label positioning

### High Risk 🔴
- Cell click calculation in different modes (complex logic)
- Smooth visual transition while maintaining interaction

### Mitigation Strategies
- **Animation**: Test interpolation formula thoroughly, provide fallback
- **Touch**: Use established touch event patterns, test on multiple devices
- **Cell Click**: Write unit tests for calculation logic
- **Interaction**: Debounce height slider to prevent performance issues

---

## B11. Hub Integration

### Add to Navigation
**File**: `src/hub/App.tsx`

```typescript
{ 
  href: 'intfracconv.html', 
  emoji: '↔️', 
  title: '整數與分數互換', 
  desc: '探索整數、真分數、假分數與帶分數之間的轉換關係', 
  color: '#9b59b6' 
}
```

---

# COMBINED EXECUTION PLAN

## Priority Decision

Given limited time, we will **execute FractionApp66 (intfracconv) FIRST** because:
1. More educationally foundational (understanding fractions)
2. Unique smooth transition feature worth preserving
3. More complex implementation = higher risk if rushed

**FractionApp65 (integerparts) will be deferred** (can be implemented later if needed).

---

## Implementation Timeline (FractionApp66 Only)

### Day 1: Component Foundation
- [ ] Create `src/apps/intfracconv/` folder structure
- [ ] Create InteractiveBars.tsx (basic structure)
- [ ] Create ModeSelector.tsx (UI only)
- [ ] Create ConversionPanel.tsx (display logic)

### Day 2: Core Logic
- [ ] Implement state management in App.tsx
- [ ] Implement mode switching
- [ ] Implement input validation
- [ ] Wire up conversion calculations

### Day 3: Visualization
- [ ] Implement bar rendering with cells
- [ ] Implement cell click handlers
- [ ] Implement dynamic labels
- [ ] Wire up InteractiveBars to state

### Day 4: Smooth Transitions
- [ ] Implement CSS variable interpolation
- [ ] Wire up height slider to --f calculation
- [ ] Test transition animations
- [ ] Refine styling

### Day 5: Polish & Deploy
- [ ] Context menu implementation
- [ ] Touch long-press detection
- [ ] Edge case testing
- [ ] Build configuration
- [ ] Hub navigation
- [ ] Success validation

---

## Success Criteria

### Must Have ✅
- [x] Three input modes working (whole/fraction/mixed)
- [x] Bar visualization with clickable cells
- [x] Mode switching via context menu
- [x] Conversion panel displays all forms
- [x] Height/width sliders functional
- [x] Build successful
- [x] No TypeScript errors

### Should Have 🎯
- [ ] Smooth height transition animation
- [ ] Touch long-press for mobile
- [ ] Responsive design
- [ ] Performance optimized

### Nice to Have ✨
- [ ] Guided tour
- [ ] Keyboard shortcuts
- [ ] Accessibility improvements

---

*End of Combined Integration Plan*
