# FractionApp64 (Equivalent Fractions) Integration Plan

## Executive Summary
This document outlines the strategy for integrating FractionApp64 (相等分數 - Equivalent Fractions) into the React application using existing components, creating new components where needed, and defining component variations for reusability.

---

## 1. Feature Analysis of FractionApp64

### Core Concept
**Equivalent Fractions** teaches students that fractions can be multiplied or divided (by the same factor in numerator and denominator) to create equivalent fractions:
- **Expanding (擴分)**: `2/8 × 3/3 = 6/24`
- **Simplifying (約分)**: `6/24 ÷ 3/3 = 2/8`

### Key Features

#### A. UI Components
1. **Header Section**
   - Mode toggle button (模式1/模式2 - Sync/Independent mode)
   - Title badge
   - Swap fractions button (左右互換)
   - Random fraction generator (隨機分數)
   - Controls pill with:
     - Number line toggle checkbox
     - Animation speed slider

2. **Action Buttons**
   - Simplify button (約分) - triggers division mode
   - Expand button (擴分) - triggers multiplication mode
   - Buttons have active/disabled states

3. **Math Engine (Equation Display)**
   - **Left fraction box**: 
     - Numerator stepper input
     - Denominator stepper input
   - **Process container** (center section):
     - Base numerator display (read-only)
     - Operation selector (× or ÷)
     - Factor numerator stepper
     - Base denominator display (read-only)
     - Operation selector (× or ÷)
     - Factor denominator stepper
   - **Right fraction box** (result):
     - Result numerator (read-only)
     - Result denominator (read-only)

4. **Question Banner**
   - Shows when targetNum/targetDen are set via URL params
   - Displays equation with blanks: `2/8 = ?/24`

5. **Visual Stack (Bar Visualization)**
   - Dynamic bar container with grid overlay
   - Animated divider lines (thin lines grow/shrink during multiply/divide)
   - Optional number line display
   - Scrollable container (when fraction result > 1)

#### B. Operational Modes

1. **Mode 1 (Sync Mode)** - Default
   - Factor numerator and denominator are always synchronized
   - Changing one automatically updates the other
   - Maintains equivalent fractions

2. **Mode 2 (Independent Mode)**
   - Factor numerator and denominator can be different
   - Shows error state when values mismatch
   - Changes `=` to `≠` with red color
   - Border colors turn red for mismatched inputs

#### C. Operation Types

1. **Multiply (擴分)**
   - Expands fraction by multiplying numerator and denominator by same factor
   - Factor range: 1-20
   - Creates more segments in visualization

2. **Divide (約分)**
   - Simplifies fraction by dividing numerator and denominator by same factor
   - Factor range: 1-100
   - Validates that division is possible (no remainder)
   - Shows error if division not possible

#### D. Validation & Error Handling
- Checks if numerator/denominator can be divided evenly in simplify mode
- Shows mismatch warning in independent mode
- Grays out visualization when calculation not possible
- Prevents invalid inputs (negative numbers, zero denominators)

#### E. Advanced Features
- **URL parameter support**: `?numerator=2&denominator=8&mode=simplify&targetNum=1&targetDen=4`
- **PostMessage API**: Allows parent iframe to control the app
- **Number line**: Shows fraction positions on a number line (0 to 2+)
- **Dynamic scaling**: Bar extends beyond 100% width when result > 1 (creates horizontal scroll)

---

## 2. Existing Component Reuse Strategy

### ✅ Can Reuse Directly (No Changes)

#### 2.1 AppHeader
**Location**: `src/shared/components/AppHeader.tsx`
- **Usage**: Main header layout with left/right slots
- **Props**: `leftSlot`, `rightSlot`
- **Integration**: Direct use, pass mode toggle + title on left, utility buttons + controls pill on right

#### 2.2 LangBtn
**Location**: `src/shared/components/LangBtn.tsx`
- **Usage**: For "Swap", "Random", and "Mode Toggle" buttons
- **Props**: Standard button props
- **Integration**: Use for all header action buttons

#### 2.3 ControlsPill
**Location**: `src/shared/components/ControlsPill.tsx`
- **Usage**: Container for checkbox + speed slider
- **Props**: `children`, `speedId`, `speedLabelId`, `onSpeedChange`
- **Integration**: Direct use, pass number line checkbox as children

#### 2.4 StepperInput
**Location**: `src/shared/components/StepperInput.tsx`
- **Usage**: For all numerator/denominator/factor inputs
- **Props**: `id`, `defaultValue`, `min`, `max`, `inputClassName`, `wrapperClassName`, `onInput`, `onBlur`, `onStepUp`, `onStepDown`
- **Integration**: Use 4 instances (left num/den, factor num/den)

#### 2.5 QuestionBanner
**Location**: `src/shared/components/QuestionBanner.tsx`
- **Usage**: Display fill-in-the-blank questions
- **Integration**: Use when targetNum/targetDen are provided via URL params

#### 2.6 GuidedTour
**Location**: `src/shared/components/GuidedTour.tsx`
- **Usage**: Interactive tutorial system
- **Integration**: Create new tour steps for equivalent fractions

#### 2.7 TutorialFingerOverlay
**Location**: `src/shared/components/TutorialFingerOverlay.tsx`
- **Usage**: Animated finger pointer for startup cue
- **Integration**: Point to fraction inputs on first load

---

## 3. Components Requiring Variations/Extensions

### 3.1 ActionButtonRow - ⚠️ NEEDS MODE SUPPORT
**Current State**: Only supports 2 buttons with merge/slice styling
**New Requirement**: Support active/disabled states based on operation mode

**Proposed Enhancement**:
```typescript
interface ActionBtn {
  id: string
  label: string
  onClick: () => void
  disabled?: boolean  // NEW
}

interface ActionButtonRowProps {
  primary: ActionBtn
  secondary: ActionBtn
}
```

**Why**: 
- In FractionApp64, only one button is active at a time
- "Simplify" button disabled when in multiply mode
- "Expand" button disabled when in divide mode
- Buttons show pressed state when active (via `disabled` + CSS)

**CSS Update Needed**: The `.btn-merge:disabled` and `.btn-slice:disabled` styles need to be verified in `base.css` to match the prototype.

---

## 4. New Components Required

### 4.1 EquationDisplay Component
**Purpose**: Display the full equation: `n/d = (n × f) / (d × f) = result/result`

**Location**: `src/shared/components/EquationDisplay.tsx` (or app-specific)

**Structure**:
```typescript
interface EquationDisplayProps {
  startNum: number
  startDen: number
  operation: '×' | '÷'
  factorNum: number
  factorDen: number
  resultNum: number | string  // can be "?"
  resultDen: number | string  // can be "?"
  isSync: boolean
  isMismatch: boolean
}
```

**Renders**:
- Left fraction (StepperInput × 2)
- Equals sign (or ≠ if mismatch)
- Process container with:
  - Base numbers (read-only displays)
  - Operation symbols
  - Factor StepperInputs
- Right fraction (read-only result)

**Styling**: Uses `.math-engine`, `.fraction-box`, `.process-container`, `.row-align`, `.op-select`, `.eq-sign`

**Why New**: This layout is specific to equivalent fractions and doesn't match existing apps. The center "process container" with operations is unique.

---

### 4.2 FractionBar Component (with Dynamic Scaling)
**Purpose**: Animated bar visualization with grid overlay, supports scaling > 100%

**Location**: `src/shared/components/FractionBar.tsx`

**Structure**:
```typescript
interface FractionBarProps {
  label: string
  numerator: number
  denominator: number
  totalSegments: number  // can be > denominator when scaling
  fillColor: string
  operation: '×' | '÷'
  factorNum: number
  factorDen: number
  animate: boolean
  speedMultiplier: number
}
```

**Features**:
- Renders bar container with fill percentage
- Creates grid overlay with segments
- Adds thick dividers at main boundaries
- Adds thin dividers (animated) for subdivisions
- Scales wrapper width when result > 1 (creates scrollable container)
- Animation timing based on speedMultiplier

**Why New**: Existing apps may have bar components, but this needs:
- Dynamic width scaling (100%, 125%, 200%, etc.)
- Scrollable wrapper
- Animated thin dividers that grow/shrink
- More complex grid logic based on factors

---

### 4.3 NumberLineDisplay Component
**Purpose**: Shows fraction positions on a number line

**Location**: `src/shared/components/NumberLineDisplay.tsx`

**Structure**:
```typescript
interface NumberLineDisplayProps {
  denominator: number
  totalSegments: number
  visible: boolean
}
```

**Features**:
- Renders horizontal line
- Adds tick marks at regular intervals
- Labels: 0, fractions (n/d), whole numbers (1, 2, etc.)
- Fraction labels use stacked display (numerator/line/denominator)

**Why New**: This is a specialized visualization not present in other apps.

---

### 4.4 ModeToggleButton Component
**Purpose**: Toggle between Sync Mode (模式1) and Independent Mode (模式2)

**Location**: `src/shared/components/ModeToggleButton.tsx` (or reuse LangBtn with active class)

**Structure**:
```typescript
interface ModeToggleButtonProps {
  isSync: boolean
  onToggle: () => void
}
```

**Renders**: 
- Button showing "模式1" or "模式2"
- Active state styling (`.btn-active-mode`)

**Why New**: While we could use `LangBtn`, this has specific toggle behavior and styling. Consider creating a variant or using `LangBtn` with conditional className.

**Decision**: Use `LangBtn` with dynamic content and className - no new component needed.

---

## 5. Component Architecture

### App Structure
```
src/apps/equivalent/
  ├── app.css           (app-specific styles)
  ├── App.tsx           (main component)
  └── main.tsx          (entry point)
```

### Component Usage Hierarchy
```
App.tsx
├── AppHeader
│   ├── (left slot)
│   │   ├── LangBtn (mode toggle)
│   │   └── Title Badge (div)
│   └── (right slot)
│       ├── LangBtn (swap)
│       ├── LangBtn (random)
│       └── ControlsPill
│           └── Checkbox (number line toggle)
├── QuestionBanner (conditional)
├── ActionButtonRow
│   ├── primary: Simplify
│   └── secondary: Expand
├── EquationDisplay (NEW)
│   ├── FractionInputBox (left)
│   │   ├── StepperInput (numerator)
│   │   └── StepperInput (denominator)
│   ├── ProcessContainer
│   │   ├── BaseDisplay (numerator)
│   │   ├── OpSelector (×/÷)
│   │   ├── StepperInput (factor num)
│   │   ├── BaseDisplay (denominator)
│   │   ├── OpSelector (×/÷)
│   │   └── StepperInput (factor den)
│   └── FractionResultBox (right)
├── ErrorMessage (div)
└── VisualStack
    ├── FractionBar (NEW)
    └── NumberLineDisplay (NEW, conditional)
```

---

## 6. State Management Plan

### App State
```typescript
interface EquivalentFractionsState {
  // Fraction values
  startNum: number
  startDen: number
  factorNum: number
  factorDen: number
  resultNum: number | string
  resultDen: number | string
  
  // Mode & operation
  isSyncMode: boolean
  currentOp: '×' | '÷'
  
  // UI state
  showNumberLine: boolean
  animSpeed: number
  
  // Question mode
  targetNum: number | null
  targetDen: number | null
  
  // Validation
  errorMessage: string
  isMismatch: boolean
  canCalculate: boolean
}
```

### Key Functions
```typescript
// Mode management
toggleSyncMode()
setOperation(op: '×' | '÷')

// Input handlers
handleStartNumChange(val: number)
handleStartDenChange(val: number)
handleFactorNumChange(val: number)
handleFactorDenChange(val: number)
stepInput(id: string, delta: number)

// Utilities
generateRandomFraction()
swapFractions()
validateDivision(): boolean

// Rendering
calculateResult()
renderVisualization(animate: boolean)
syncOpColor()
```

---

## 7. CSS Strategy

### Reuse from base.css
- `.header`, `.header-left`, `.header-right`
- `.controls-pill`, `.checkbox-label`, `.speed-ctrl`
- `.lang-btn`, `.btn-active-mode`
- `.control-panel`, `.action-btn`, `.btn-merge`, `.btn-slice`
- `.input-wrapper`, `.stepper-btn-group`, `.step-btn`
- `.question-banner`

### New in app.css (equivalent/app.css)
- `.math-engine` - main equation container
- `.fraction-box` - left/right fraction displays
- `.process-container` - center operation section
- `.row-align` - horizontal alignment helper
- `.base-num` - read-only number displays
- `.op-select` - operation symbol display
- `.eq-sign` - equals/not-equals sign
- `.fraction-line` - horizontal divider in fractions
- `.bar-container`, `.bar-fill`, `.grid-overlay` - visualization
- `.segment`, `.divider-thick`, `.divider-thin`, `.anim-line` - grid elements
- `.number-line-wrapper`, `.nl-line`, `.nl-tick`, `.nl-label` - number line
- `.num-target` - special color for result numerator
- Dynamic width/scaling styles for overflow scrolling

---

## 8. Implementation Phases

### Phase 1: Component Foundation (Days 1-2)
**Goal**: Create new components and component structure

1. **Create app folder structure**
   ```
   src/apps/equivalent/
   ```

2. **Build EquationDisplay component**
   - Layout the three-part equation
   - Integrate StepperInput components
   - Add read-only displays for base numbers and results

3. **Build FractionBar component**
   - Bar container with fill
   - Grid overlay system
   - Dynamic scaling wrapper
   - Animation logic for dividers

4. **Build NumberLineDisplay component**
   - Tick mark generation
   - Label formatting (whole numbers vs fractions)
   - Dynamic segment calculation

5. **Extend ActionButtonRow**
   - Add `disabled` prop support
   - Verify CSS disabled states

### Phase 2: State Logic (Days 3-4)
**Goal**: Implement business logic and calculations

1. **Set up state management**
   - Define state interface
   - Initialize with defaults
   - Connect to URL parameters

2. **Implement mode logic**
   - Sync vs Independent mode toggle
   - Factor synchronization in sync mode
   - Mismatch detection in independent mode

3. **Operation switching**
   - Multiply mode (expand)
   - Divide mode (simplify)
   - Button state management

4. **Calculation engine**
   - Result computation
   - Validation (division checks)
   - Error message generation

5. **Input handlers**
   - Step up/down
   - Manual input with validation
   - Empty field handling

### Phase 3: Visualization (Day 5)
**Goal**: Wire up visual components with state

1. **Bar rendering**
   - Connect FractionBar to state
   - Calculate segments and scale
   - Animation timing

2. **Number line rendering**
   - Toggle visibility
   - Tick generation based on denominator
   - Label positioning

3. **Color synchronization**
   - Border color changes based on operation
   - Error state (red borders)
   - Mismatch indicator (red text)

### Phase 4: Features & Polish (Days 6-7)
**Goal**: Add utility features and refinements

1. **Random fraction generator**
   - Generate appropriate fractions for each mode
   - Ensure divide mode has factorable fractions

2. **Swap functionality**
   - Exchange left and right fractions
   - Switch operation mode

3. **Question banner integration**
   - Parse URL params
   - Display fill-in-the-blank equation
   - Hide when not in question mode

4. **PostMessage API**
   - Listen for parent messages
   - Update state from external control

5. **Speed control**
   - Wire slider to animation duration
   - Update all animated elements

### Phase 5: Testing & Refinement (Days 8-9)
**Goal**: Ensure quality and responsiveness

1. **Responsive design**
   - Test mobile layouts
   - Verify scrollable bar behavior
   - Adjust font sizes

2. **Edge cases**
   - Zero/negative inputs
   - Division by non-factors
   - Large numbers (denominators > 100)

3. **Embedded mode**
   - Test iframe integration
   - Verify URL parameters
   - Test PostMessage API

4. **Animation tuning**
   - Verify timing at different speeds
   - Test with large factors
   - Optimize performance

### Phase 6: Guided Tour (Day 10)
**Goal**: Create educational content

1. **Create tour steps**
   - Add to `src/shared/tours/equivalent.ts`
   - Define step-by-step guidance

2. **Create guide content**
   - Add to `src/shared/guides/equivalent.ts`
   - Write tooltips and hints

3. **Startup tutorial**
   - Finger overlay on first visit
   - Tooltip hints for key features

---

## 9. File Checklist

### New Files to Create
- [ ] `src/apps/equivalent/App.tsx`
- [ ] `src/apps/equivalent/app.css`
- [ ] `src/apps/equivalent/main.tsx`
- [ ] `src/shared/components/EquationDisplay.tsx` (or inline in App.tsx)
- [ ] `src/shared/components/FractionBar.tsx`
- [ ] `src/shared/components/NumberLineDisplay.tsx`
- [ ] `src/shared/tours/equivalent.ts`
- [ ] `src/shared/guides/equivalent.ts`
- [ ] `equivalent.html` (entry point)
- [ ] Update `build-all.mjs` to include equivalent app

### Files to Modify
- [ ] `src/shared/components/ActionButtonRow.tsx` - add `disabled` prop
- [ ] `src/shared/base.css` - verify disabled button styles
- [ ] `vite.config.ts` - add equivalent entry point
- [ ] `README.md` - document new app

---

## 10. Key Differences from Existing Apps

### vs. Expanding App
**Similarities**:
- Both use multiplication/division
- Both have factor inputs
- Both use bar visualization

**Differences**:
- Equivalent has TWO modes (sync/independent)
- Equivalent shows full equation (left = center = right)
- Equivalent has swap and random buttons
- Equivalent supports scaling > 100% (scrollable)
- Equivalent has number line option
- Equivalent validates division (must be whole numbers)
- Equivalent has question mode with blanks

### Unique Features in Equivalent
1. **Mode toggle** - synchronized vs independent factors
2. **Mismatch detection** - shows ≠ when factors differ
3. **Bidirectional** - can go from simple to complex or vice versa
4. **Swap button** - exchange left and right
5. **Question mode** - fill-in-the-blank via URL params
6. **Number line** - optional visualization
7. **Dynamic scaling** - bar extends beyond 100%

---

## 11. Testing Scenarios

### Sync Mode Tests
1. Change factor numerator → denominator auto-updates ✓
2. Change factor denominator → numerator auto-updates ✓
3. Result maintains equivalent fraction ✓

### Independent Mode Tests
1. Set different factors → shows ≠ sign ✓
2. Borders turn red ✓
3. Warning message appears ✓
4. Calculation still shows result ✓

### Operation Tests
1. Multiply: 2/8 × 3/3 = 6/24 ✓
2. Divide: 6/24 ÷ 3/3 = 2/8 ✓
3. Invalid divide: 7/20 ÷ 3/3 → error ✓

### UI Tests
1. Random generates valid fractions ✓
2. Swap exchanges positions and inverts operation ✓
3. Number line toggles correctly ✓
4. Speed slider affects animation ✓
5. Buttons disable/enable based on mode ✓

### Visual Tests
1. Bar scales correctly for results > 1 ✓
2. Scrollbar appears when needed ✓
3. Grid dividers animate properly ✓
4. Number line labels format correctly ✓
5. Colors sync with operation type ✓

### URL Parameter Tests
1. ?numerator=2&denominator=8 sets initial fraction ✓
2. ?mode=simplify starts in divide mode ✓
3. ?targetNum=1&targetDen=4 shows question banner ✓

---

## 12. Implementation Decision Summary

### Reuse (No Changes)
- AppHeader ✓
- LangBtn ✓
- ControlsPill ✓
- StepperInput ✓
- QuestionBanner ✓
- GuidedTour ✓
- TutorialFingerOverlay ✓

### Minor Extension
- ActionButtonRow (+disabled prop)

### New Components
1. EquationDisplay (or inline in App.tsx)
2. FractionBar (with dynamic scaling)
3. NumberLineDisplay

### App-Specific CSS
- Equation layout styles
- Process container styles
- Bar visualization with grid
- Number line styles
- Dynamic width/scaling

---

## 13. Risk Assessment

### Low Risk
- Reusing existing components (proven in other apps)
- Standard React state management
- Similar animation patterns

### Medium Risk
- Dynamic bar scaling (need to ensure scroll works on mobile)
- Number line label formatting (fractions in HTML/CSS)
- Complex grid overlay logic (many dividers with different styles)

### High Risk
- None identified

---

## 14. Recommended Approach

### Option A: Conservative (Recommended for First Implementation)
1. Inline EquationDisplay logic in App.tsx (not a separate component)
2. Create FractionBar component (reusable)
3. Create NumberLineDisplay component (reusable)
4. Use existing components for everything else
5. App-specific CSS in `equivalent/app.css`

**Pros**: 
- Faster initial implementation
- Less abstraction overhead
- Easier to iterate on unique layout

**Cons**:
- Equation logic not reusable (but may never need to be)

### Option B: Component-First (Recommended for Scale)
1. Create EquationDisplay as shared component
2. Create FractionBar as shared component
3. Create NumberLineDisplay as shared component
4. More abstract, reusable architecture

**Pros**:
- Better for future apps that need equation displays
- Cleaner App.tsx

**Cons**:
- More upfront work
- May over-engineer if equation layout is truly unique

### Recommendation: **Start with Option A**, refactor to Option B if another app needs equation display.

---

## 15. Next Steps

1. **Review this plan** with stakeholders
2. **Create issue/task list** for each phase
3. **Set up app folder structure**
4. **Begin Phase 1** (Component Foundation)
5. **Daily check-ins** to track progress

---

## 16. Questions for Clarification

1. Should the app be named "equivalent" or "equivalent-fractions"?
2. Do we need i18n (English labels) or Chinese only for now?
3. Should error messages be dismissable or always visible?
4. Do we want audio feedback for correct/incorrect answers?
5. Should there be a "Check Answer" button in question mode?

---

## Appendix A: Component Props Quick Reference

### EquationDisplay (NEW)
```typescript
{
  startNum: number
  startDen: number
  operation: '×' | '÷'
  factorNum: number
  factorDen: number
  resultNum: number | string
  resultDen: number | string
  isSync: boolean
  isMismatch: boolean
  onStartNumChange: (val: number) => void
  onStartDenChange: (val: number) => void
  onFactorNumChange: (val: number) => void
  onFactorDenChange: (val: number) => void
}
```

### FractionBar (NEW)
```typescript
{
  label: string
  numerator: number
  denominator: number
  totalSegments: number
  fillColor: string
  operation: '×' | '÷'
  factorNum: number
  factorDen: number
  animate: boolean
  speedMultiplier: number
}
```

### NumberLineDisplay (NEW)
```typescript
{
  denominator: number
  totalSegments: number
  visible: boolean
}
```

### ActionButtonRow (EXTENDED)
```typescript
{
  primary: {
    id: string
    label: string
    onClick: () => void
    disabled?: boolean  // NEW
  }
  secondary: {
    id: string
    label: string
    onClick: () => void
    disabled?: boolean  // NEW
  }
}
```

---

**Plan Version**: 1.0  
**Created**: June 3, 2026  
**Status**: Ready for Implementation  
