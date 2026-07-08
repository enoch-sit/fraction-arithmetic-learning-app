# Track Fix 018 - 刪除「目前排序」顯示答案

## 問題描述
- **問題**: 在「分數比較」應用中，顯示「目前排序」直接給學生答案
- **影響**: 學生無需思考即可看到正確排序，失去學習機會
- **教育問題**: 立即顯示答案違背教學目的，應該讓學生自己嘗試和學習

## 實施日期
- **日期**: 2026-06-04
- **開發伺服器端口**: localhost:5173

## 根本原因分析

### 問題定位
1. **摘要面板**: `comparison-summary-panel` 區段顯示目前排序
2. **標題**: 「目前排序」文字明確指出這是答案
3. **摘要內容**: `getComparisonSummary(visibleEntries)` 顯示排序結果
4. **位置**: 顯示在輸入區域和視覺比較之間，非常顯眼

### 根本原因
- **設計缺陷**: 面板設計為顯示當前狀態，但實際上透露了正確答案
- **教學衝突**: 應該讓學生嘗試和驗證，而不是直接看到答案
- **學習障礙**: 學生可能只是複製顯示的答案，而不理解比較過程

### 教育影響
- **減少思考**: 學生不需要自己計算和比較分數
- **失去挑戰**: 沒有試錯學習的機會
- **降低參與**: 已知答案的情況下，學習動機下降

## 實施方案
移除「目前排序」摘要面板，保留警告訊息但移至獨立區域。

## 變更清單

### 修改的檔案

1. ✅ `src/apps/comparison/App.tsx`
   - 移除 `comparison-summary-panel` 區段
   - 保留長度不一致警告，移至獨立區域

## 實施步驟
1. ✅ 讀取 fix018.md 規範文件
2. ✅ 搜尋「目前排序」文字
3. ✅ 定位 comparison-summary-panel 區段
4. ✅ 移除摘要面板 JSX
5. ✅ 保留警告訊息，移至獨立區域
6. ✅ 建立此追蹤文件

## 技術細節

### 修改前後對比

**修改前（lines 531-537）**:
```tsx
<section className="comparison-summary-panel">
  <div className="comparison-summary-title">目前排序</div>
  <div className="comparison-summary-copy">{getComparisonSummary(visibleEntries)}</div>
  {!isSyncMode && !widthsMatch ? (
    <div className="comparison-warning">⚠️ 長條圖整體長度不一致，請先拖曳到相同長度再比較。</div>
  ) : null}
</section>
```
- ❌ 顯示「目前排序」標題
- ❌ 顯示排序摘要（答案）
- ✅ 顯示長度不一致警告（保留）

**修改後**:
```tsx
{/* Removed comparison-summary-panel per fix018 - shows answer to students */}
{!isSyncMode && !widthsMatch ? (
  <section className="comparison-warning-panel">
    <div className="comparison-warning">⚠️ 長條圖整體長度不一致，請先拖曳到相同長度再比較。</div>
  </section>
) : null}
```
- ✅ 移除摘要面板
- ✅ 保留警告訊息
- ✅ 警告移至獨立區域
- ✅ 添加註解說明移除原因

### 保留的功能

#### getComparisonSummary 函式
```typescript
// 函式仍存在於代碼中，供內部驗證使用
// 不再顯示在 UI 上
const getComparisonSummary = (entries: FractionEntry[]): string => {
  // ... 計算排序邏輯
}
```
- **保留原因**: 可能用於答案驗證或其他內部邏輯
- **不影響**: 不顯示在使用者介面
- **未來用途**: 可用於檢查學生答案是否正確

#### 長度不一致警告
```tsx
{!isSyncMode && !widthsMatch ? (
  <section className="comparison-warning-panel">
    <div className="comparison-warning">⚠️ 長條圖整體長度不一致，請先拖曳到相同長度再比較。</div>
  </section>
) : null}
```
- **保留原因**: 提供操作引導，不透露答案
- **位置變更**: 從 summary-panel 內移至獨立區域
- **新類別**: `comparison-warning-panel` 用於樣式控制

### 相關狀態和邏輯

#### 保留的狀態
- `visibleEntries`: 分數輸入列表
- `isSyncMode`: 同步模式標記
- `widthsMatch`: 長度是否匹配

#### 不需修改的組件
- `FractionInputCard`: 輸入卡片
- `ComparisonRow`: 視覺比較行
- 拖曳和調整邏輯

## 受影響的應用
- ✅ **分數比較（Comparison）** - 主要修復應用
  - 移除答案顯示
  - 保留操作警告

## 影響範圍
- ✅ Comparison app: UI 顯示
- ✅ 學習體驗：學生需自己思考和驗證
- ✅ 教學效果：增加挑戰性和參與度

## 預期結果
- ✅ 「目前排序」摘要不再顯示
- ✅ `getComparisonSummary()` 函式不再被 UI 調用
- ✅ 學生無法直接看到正確答案
- ✅ 長度不一致警告仍然顯示（引導操作）
- ✅ 學生需要自己比較和排序分數
- ✅ 提高學習參與度和思考深度

## 測試驗證
驗證項目：
- ⏳ Comparison app: 「目前排序」不再顯示
- ⏳ Comparison app: 摘要文字（排序結果）不可見
- ⏳ Comparison app: 長度不一致警告仍正常顯示
- ⏳ Comparison app: 警告顯示在適當位置（輸入區和視覺區之間）
- ⏳ Comparison app: 輸入卡片功能正常
- ⏳ Comparison app: 視覺比較功能正常
- ⏳ Comparison app: 拖曳調整功能正常
- ⏳ Comparison app: 同步模式功能正常
- ⏳ 無控制台錯誤或警告
- ⏳ CSS 樣式正常（無因移除而導致的佈局問題）

## 設計考量

### 教學設計原則
| 原則 | 實施 |
|------|------|
| 主動學習 | ✅ 學生需自己比較分數 |
| 試錯機會 | ✅ 可以嘗試不同排序 |
| 即時反饋 | ⏳ 未來可添加驗證功能 |
| 引導學習 | ✅ 保留操作提示（警告） |

### 使用者體驗流程（修改後）
1. **輸入分數**: 在輸入卡片中設定分數
2. **查看視覺**: 觀察長條圖視覺化
3. **調整對齊**: 如有警告，拖曳至相同長度
4. **自行比較**: 根據視覺判斷大小關係
5. **學習理解**: 理解分數比較的概念
6. ⏳ **驗證答案**: （未來功能）提交答案後檢查

### 未來改進方向
- 添加「檢查答案」按鈕，讓學生主動驗證
- 提供漸進式提示系統（不直接給答案）
- 添加練習模式和測驗模式
- 記錄學習進度和正確率

## CSS 相關

### 可能需要調整的樣式
```css
/* In src/apps/comparison/app.css */

/* 移除的類別（可以保留或清理）: */
.comparison-summary-panel { /* 已不使用 */ }
.comparison-summary-title { /* 已不使用 */ }
.comparison-summary-copy { /* 已不使用 */ }

/* 新增的類別（如需特殊樣式）: */
.comparison-warning-panel {
  margin: 16px 0;
  padding: 12px;
  background: #fff3cd;
  border-radius: 4px;
}

.comparison-warning {
  color: #856404;
  text-align: center;
  font-weight: 500;
}
```
- **注意**: 目前 warning 使用既有的 `.comparison-warning` 樣式
- **清理**: 可選擇性清理未使用的 CSS 類別

## 備註
- 移除僅影響 UI 顯示，不影響內部邏輯
- `getComparisonSummary()` 函式保留，可用於未來的驗證功能
- 警告訊息移至獨立區域，保持 UI 組織清晰
- 符合教學應用的最佳實踐：引導而非給答案

## 優先級
- **高優先級** - 影響教學效果和學習體驗

## 相關修復
- 無直接相關修復
- 獨立的 UI 調整

## 後續改進建議
1. **添加驗證功能**: 
   - 添加「檢查答案」按鈕
   - 學生提交後顯示是否正確
   - 正確後可選擇性顯示排序結果作為確認

2. **提示系統**:
   - 「需要提示嗎？」按鈕
   - 提供漸進式提示（如「哪個分數最小？」）
   - 不直接給出完整答案

3. **學習模式**:
   - 學習模式：可查看答案和解釋
   - 練習模式：隱藏答案，提供驗證
   - 測驗模式：計時和評分

4. **視覺反饋**:
   - 學生排序後，視覺化顯示其選擇
   - 比較學生排序與正確排序（驗證後）

## 狀態
✅ **已完成** - 移除「目前排序」摘要面板，保留操作警告
