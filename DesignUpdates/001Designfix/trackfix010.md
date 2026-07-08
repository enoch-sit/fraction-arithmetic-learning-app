# Track Fix 010 - 點擊其他按鈕後不應讓不正確長條圖消失

## 問題描述
- **問題**: 在「異分母分數加法」應用中，當使用者進行錯誤嘗試後，不正確的長條圖（incorrect bar）在點擊其他按鈕後會消失
- **影響**: 使用者失去錯誤的上下文，無法參考之前的錯誤來學習
- **使用者體驗**: 長條圖應該持續顯示，直到明確清除或重置

## 實施日期
- **日期**: 2026-06-04
- **開發伺服器端口**: localhost:5173

## 根本原因分析

### 問題定位
1. **函式識別**: `setupDragAndDrop(cd1, cd2)` 函式在分母不匹配時無條件隱藏 bar3-row
2. **觸發時機**: 當 `checkCommonDenom()` 被調用時（例如調整分數值、點擊步進器按鈕），會執行 `setupDragAndDrop()`
3. **隱藏邏輯**: 在 else 分支（`!isCommonDenomReady`）中，直接設定 `row3.style.display = 'none'`，沒有檢查 bar3-row 是否正在顯示錯誤合併（error merge）

### 根本原因
- **無條件隱藏**: `setupDragAndDrop()` 的 else 分支無條件隱藏 bar3-row，即使它正在顯示使用者的錯誤嘗試
- **狀態未保留**: 沒有檢查 bar3-row 是否處於錯誤模式（`triggerErrorMerge()` 設定的狀態）
- **錯誤模式標識**: `triggerErrorMerge()` 設定 `row3.style.display = 'flex'` 來顯示錯誤長條圖，但 `setupDragAndDrop()` 沒有保留這個狀態

### 相關函式
1. **`triggerErrorMerge()`** (line 804):
   - 設定 bar3-row 為可見 (`display: 'flex'`)
   - 顯示使用者拖曳的錯誤合併結果
   - 設定紅色虛線輪廓

2. **`setupDragAndDrop(cd1, cd2)`** (line 972):
   - 當 `isCommonDenomReady` 為 true: 設定正確合併模式
   - 當 `isCommonDenomReady` 為 false: **隱藏 bar3-row** (原本無條件)

3. **`checkCommonDenom()`** (line 1128):
   - 檢查兩個分母是否相同
   - 調用 `setupDragAndDrop()`
   - 在分數值改變時被觸發

## 實施方案
修改 `setupDragAndDrop()` 的 else 分支，在隱藏 bar3-row 之前先檢查它是否已經可見（錯誤模式）。如果已經可見，保持顯示狀態；只有在它本來就不可見時才隱藏它。

## 變更清單

### 修改的檔案

1. ✅ `src/apps/addition/App.tsx`
   - 修改 `setupDragAndDrop()` 函式的 else 分支
   - 添加條件檢查：只在 bar3-row 不可見時才隱藏

## 實施步驟
1. ✅ 讀取 fix010.md 規範文件
2. ✅ 搜尋 "bar3WrongModeValue" 和相關錯誤模式代碼
3. ✅ 定位 `triggerErrorMerge()` 函式 (顯示錯誤長條圖)
4. ✅ 定位 `setupDragAndDrop()` 函式 (無條件隱藏 bar3-row)
5. ✅ 追蹤 `checkCommonDenom()` 調用 `setupDragAndDrop()` 的時機
6. ✅ 修改 else 分支，添加 display 狀態檢查
7. ✅ 建立此追蹤文件

## 技術細節

### 修改前後對比

**修改前（`setupDragAndDrop()` else 分支, lines 1023-1027）**:
```typescript
      } else {
        row3.style.display = 'none'  // ← 無條件隱藏
        convertBarToDraggable(1, cd1, 'var(--red)')
        convertBarToDraggable(2, cd2, 'var(--blue)')
```

**修改後**:
```typescript
      } else {
        // Don't hide bar3-row if it's already visible (error merge mode)
        if (row3.style.display !== 'flex') {
          row3.style.display = 'none'
        }
        convertBarToDraggable(1, cd1, 'var(--red)')
        convertBarToDraggable(2, cd2, 'var(--blue)')
```

### 技術說明

#### 狀態檢查邏輯
```typescript
if (row3.style.display !== 'flex') {
  row3.style.display = 'none'
}
```

- **檢查條件**: 如果 bar3-row 的 display 不是 'flex'
- **執行動作**: 設定為 'none'（隱藏）
- **保留狀態**: 如果 display 是 'flex'（錯誤模式下已顯示），則不做任何改變

#### 為什麼這樣修復有效

1. **錯誤模式狀態**: 當 `triggerErrorMerge()` 被調用時，設定 `row3.style.display = 'flex'`
2. **後續操作**: 使用者點擊步進器按鈕或調整分數值時，`checkCommonDenom()` 被觸發
3. **保留顯示**: `setupDragAndDrop()` 檢測到 display 是 'flex'，保持顯示狀態
4. **僅隱藏未使用**: 只有當 bar3-row 本來就不可見時，才設定為 'none'

#### 流程範例

**場景 1: 錯誤合併後點擊步進器**
1. 使用者拖曳區塊到 bar3 (錯誤嘗試)
2. `triggerErrorMerge()` 調用 → `row3.style.display = 'flex'`
3. 使用者點擊分子/分母步進器按鈕
4. `checkCommonDenom()` → `setupDragAndDrop()` 調用
5. else 分支: 檢查 `row3.style.display !== 'flex'` → **false**
6. **不隱藏** bar3-row，錯誤長條圖保持可見 ✅

**場景 2: 正常調整分數值（無錯誤長條圖）**
1. 使用者調整分數值
2. `checkCommonDenom()` → `setupDragAndDrop()` 調用
3. else 分支: 檢查 `row3.style.display !== 'flex'` → **true** (display 是 'none')
4. **隱藏** bar3-row，符合預期行為 ✅

### 相關按鈕和操作

#### 會觸發 checkCommonDenom() 的操作
- ✅ 點擊分子步進器 (▲/▼)
- ✅ 點擊分母步進器 (▲/▼)
- ✅ 直接輸入分數值
- ✅ 點擊「顯示帶分數」核取方塊
- ✅ 點擊「顯示數線」核取方塊
- ✅ 任何改變分數值的操作

#### 錯誤長條圖現在會保持顯示
使用者在錯誤合併後執行以上任何操作，bar3-row 都會保持可見，提供持續的視覺回饋。

## 受影響的應用
- ✅ **異分母分數加法（Addition）** - 主要修復應用
  - bar3-row (錯誤長條圖) 在點擊其他按鈕後保持可見
  - 錯誤模式的視覺回饋更持久

## 影響範圍
- ✅ Addition app: bar3-row 錯誤模式持久性
- ✅ 錯誤合併後的所有 UI 互動
- ✅ 分數值調整操作（步進器、直接輸入）
- ✅ 核取方塊操作（顯示帶分數、顯示數線）

## 預期行為

### 修復前 ❌
1. 使用者拖曳區塊到 bar3 (錯誤嘗試)
2. bar3-row 顯示錯誤長條圖
3. 使用者點擊分子步進器
4. **bar3-row 消失** ← 問題
5. 使用者失去錯誤上下文

### 修復後 ✅
1. 使用者拖曳區塊到 bar3 (錯誤嘗試)
2. bar3-row 顯示錯誤長條圖
3. 使用者點擊分子步進器
4. **bar3-row 保持顯示** ← 修復
5. 使用者可以參考錯誤來調整

### 明確清除的時機
錯誤長條圖應該在以下情況下才清除：
- ✅ 使用者點擊「重看」按鈕（重置動畫）
- ✅ 使用者開始新的問題
- ✅ 使用者達到正確答案（觸發正確合併）
- ✅ 明確的重置操作

## 測試驗證
驗證項目：
- ⏳ 加法應用：拖曳區塊到 bar3，觸發錯誤合併
- ⏳ 加法應用：錯誤長條圖顯示（紅色虛線輪廓）
- ⏳ 加法應用：點擊分子步進器，bar3-row 保持可見
- ⏳ 加法應用：點擊分母步進器，bar3-row 保持可見
- ⏳ 加法應用：勾選「顯示帶分數」，bar3-row 保持可見
- ⏳ 加法應用：勾選「顯示數線」，bar3-row 保持可見
- ⏳ 加法應用：直接輸入分數值，bar3-row 保持可見
- ⏳ 加法應用：點擊「重看」按鈕，bar3-row 正確清除
- ⏳ 加法應用：達到正確答案，bar3-row 轉換為正確合併模式
- ⏳ 無控制台錯誤或警告

## 設計考量

### 使用者學習流程
1. **嘗試**: 使用者拖曳區塊嘗試合併
2. **錯誤回饋**: 系統顯示錯誤長條圖（紅色虛線）
3. **調整**: 使用者調整分數值（步進器、輸入）
4. **參考**: 錯誤長條圖保持可見，使用者可以參考
5. **再次嘗試**: 使用者基於錯誤調整策略

### 教學價值
- **持續回饋**: 錯誤不會消失，提供持續學習參考
- **對比學習**: 使用者可以對比錯誤嘗試和正確答案
- **自我修正**: 保留錯誤上下文，幫助使用者自我修正

## 備註
- 修改僅影響 `setupDragAndDrop()` 函式
- 不影響正確合併模式（`isCommonDenomReady = true`）
- 不影響其他應用（Subtraction, Multiplication, Division）
- 修復邏輯簡單且穩健：僅檢查 display 屬性狀態
- 不需要引入新的狀態變數或標記

## 優先級
- **高優先級** - 影響使用者學習體驗和錯誤回饋持久性

## 後續改進建議
- 考慮添加明確的「清除錯誤」按鈕，讓使用者主動清除錯誤長條圖
- 可以考慮為錯誤長條圖添加動畫過渡效果
- 可以考慮在錯誤長條圖上顯示提示文字（例如「這是你的錯誤嘗試，可以調整分數值重試」）
- 根據使用者測試反饋，可能需要調整錯誤長條圖的視覺樣式

## 相關問題
- Fix 009: 解決了錯誤長條圖的重疊問題
- Fix 010: 解決了錯誤長條圖的持久性問題
- 兩者共同改善了錯誤模式的視覺呈現

## 狀態
✅ **已完成** - setupDragAndDrop() 函式已修改，錯誤長條圖現在會保持顯示