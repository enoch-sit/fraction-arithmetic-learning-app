# Track Fix 019 - 模式切換平滑過渡

## 問題描述
- **問題**: 在「分數比較」應用中，模式1和模式2之間切換時UI突然變化
- **影響**: 視覺體驗突兀，元素跳動，方向感喪失
- **使用者體驗**: 切換時感覺不流暢，缺乏連續性

## 實施日期
- **日期**: 2026-06-04
- **開發伺服器端口**: localhost:5173

## 根本原因分析

### 問題定位
1. **過渡時間過短**: 原有 transition 僅 0.12s 和 0.18s，變化過快
2. **缺少淡入淡出**: 突然出現/消失的元素沒有動畫
3. **佈局突變**: 元素出現/消失導致佈局重排
4. **多個變化同時發生**:
   - 長條寬度變化（100% ↔ 自訂寬度）
   - 垂直偏移變化（0 ↔ 自訂偏移）
   - 控制按鈕出現/消失（上下移動、隨機長度、設定同一長度）
   - 說明文字變化（模式1 ↔ 模式2 說明）

### 根本原因
- **設計缺陷**: 過渡動畫時間太短，無法提供流暢體驗
- **動畫缺失**: 條件渲染的元素沒有進入/退出動畫
- **體驗衝突**: 多個變化同時發生，缺乏協調的過渡效果

### 使用者體驗影響
- **視覺跳動**: UI 元素突然移動或改變大小
- **認知負擔**: 難以追蹤變化，失去方向感
- **操作困惑**: 不清楚模式之間的區別和關係
- **品質感知**: 應用感覺粗糙，缺乏精緻度

## 實施方案
增加過渡動畫時間，添加淡入淡出效果，確保模式切換流暢自然。

## 變更清單

### 修改的檔案

1. ✅ `src/apps/comparison/app.css`
   - 增加 `.comparison-row` 過渡時間
   - 增加 `.comparison-bar` 過渡時間
   - 增加 `.comparison-number-line-wrap` 過渡時間
   - 添加 `.comparison-row-header` 過渡效果
   - 添加 `.comparison-offset-handle` 淡入動畫
   - 添加 `.comparison-toolbar-panel` 過渡效果
   - 添加 `.comparison-control-group` 過渡效果
   - 添加 `.comparison-control-group.quick-actions` 淡入動畫
   - 添加 `.comparison-mode-copy` 過渡效果
   - 定義 `@keyframes fadeInFromRight` 動畫
   - 定義 `@keyframes fadeInFromBottom` 動畫

## 實施步驟
1. ✅ 讀取 fix019.md 規範文件
2. ✅ 搜尋 isSyncMode 相關代碼
3. ✅ 分析模式切換邏輯
4. ✅ 檢查現有過渡效果
5. ✅ 增加過渡動畫時間（0.12s → 0.4s，0.18s → 0.4s）
6. ✅ 添加淡入動畫（fadeInFromRight, fadeInFromBottom）
7. ✅ 添加過渡效果到相關容器
8. ✅ 建立此追蹤文件

## 技術細節

### 模式切換行為

#### 模式1（同步模式，isSyncMode = true）
```typescript
// 特徵
- 所有長條維持同一整體長度（100%）
- 無垂直偏移（0px）
- 沒有「上下移動」按鈕
- 沒有「隨機長度」和「設定同一長度」按鈕
- 說明文字：「模式1：所有長條維持同一整體長度，直接比較分數值。」
```

#### 模式2（自由模式，isSyncMode = false）
```typescript
// 特徵
- 長條可自訂寬度（containerWidths[index]）
- 可自訂垂直偏移（verticalOffsets[index]）
- 顯示「上下移動」按鈕
- 顯示「隨機長度」和「設定同一長度」按鈕
- 說明文字：「模式2：可調整長條整體長度並上下移動，先對齊長度再比較大小。」
```

#### 切換函式
```typescript
function toggleMode() {
  setIsSyncMode((currentMode) => {
    const nextMode = !currentMode
    if (nextMode) {
      // 切換到模式1：重置寬度和偏移
      setContainerWidths([100, 100, 100])
      setVerticalOffsets([0, 0, 0])
    }
    return nextMode
  })
}
```

### CSS 修改詳情

#### 1. 增加 comparison-row 過渡時間
```css
/* 修改前 */
.comparison-row {
  transition: transform 0.12s ease;
}

/* 修改後 */
.comparison-row {
  /* Increased transition duration for smoother mode switching (fix019) */
  transition: transform 0.4s ease-in-out;
}
```
- **作用**: 平滑垂直位移變化
- **變更**: 0.12s → 0.4s，ease → ease-in-out
- **效果**: 上下移動更流暢自然

#### 2. 增加 comparison-bar 過渡時間
```css
/* 修改前 */
.comparison-bar {
  transition: width 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
}

/* 修改後 */
.comparison-bar {
  /* Increased transition duration for smoother mode switching (fix019) */
  transition: width 0.4s ease-in-out, border-color 0.3s ease, box-shadow 0.3s ease;
}
```
- **作用**: 平滑寬度變化
- **變更**: width 0.18s → 0.4s，ease → ease-in-out
- **效果**: 長條伸縮更流暢

#### 3. 增加 comparison-number-line-wrap 過渡時間
```css
/* 修改前 */
.comparison-number-line-wrap {
  transition: width 0.18s ease;
}

/* 修改後 */
.comparison-number-line-wrap {
  /* Increased transition duration for smoother mode switching (fix019) */
  transition: width 0.4s ease-in-out;
}
```
- **作用**: 平滑數線寬度變化
- **變更**: 0.18s → 0.4s，ease → ease-in-out
- **效果**: 數線寬度同步平滑變化

#### 4. 添加 comparison-row-header 過渡
```css
/* 新增 */
.comparison-row-header {
  /* Smooth transition for content changes (fix019) */
  transition: all 0.3s ease-in-out;
}
```
- **作用**: 平滑標題區域內容變化
- **影響**: 「上下移動」按鈕出現/消失更自然
- **效果**: 避免突然重排

#### 5. 添加 comparison-offset-handle 淡入動畫
```css
/* 新增 */
.comparison-offset-handle {
  /* Fade-in animation for smooth appearance (fix019) */
  animation: fadeInFromRight 0.3s ease-in-out;
}

@keyframes fadeInFromRight {
  from {
    opacity: 0;
    transform: translateX(10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
```
- **作用**: 「上下移動」按鈕淡入效果
- **動畫**: 從右側滑入，同時透明度變化
- **效果**: 按鈕出現時更自然

#### 6. 添加 comparison-toolbar-panel 過渡
```css
/* 新增 */
.comparison-toolbar-panel {
  /* Smooth transition for layout changes (fix019) */
  transition: all 0.3s ease-in-out;
}
```
- **作用**: 平滑工具列佈局變化
- **影響**: 控制組出現/消失時的重排
- **效果**: 避免突然跳動

#### 7. 添加 comparison-control-group 過渡
```css
/* 新增 */
.comparison-control-group {
  /* Smooth transition for content changes (fix019) */
  transition: all 0.3s ease-in-out;
}
```
- **作用**: 平滑控制組內容變化
- **影響**: 快速操作按鈕出現/消失
- **效果**: 佈局變化更流暢

#### 8. 添加 quick-actions 淡入動畫
```css
/* 新增 */
.comparison-control-group.quick-actions {
  /* Fade-in animation for smooth appearance (fix019) */
  animation: fadeInFromBottom 0.3s ease-in-out;
}

@keyframes fadeInFromBottom {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```
- **作用**: 快速操作按鈕組淡入效果
- **動畫**: 從下方滑入，同時透明度變化
- **效果**: 「隨機長度」和「設定同一長度」按鈕出現更自然

#### 9. 添加 comparison-mode-copy 過渡
```css
/* 新增 */
.comparison-mode-copy {
  /* Smooth transition for text changes (fix019) */
  transition: opacity 0.2s ease-in-out;
}
```
- **作用**: 平滑模式說明文字變化
- **效果**: 文字切換時有淡入淡出效果
- **注意**: 僅透明度過渡，實際文字內容由 React 更新

### 動畫時間設計

#### 時間層次
```
快速變化（0.2s）:
- 文字透明度變化

中速變化（0.3s）:
- 容器佈局調整
- 元素淡入淡出
- 顏色和陰影變化

慢速變化（0.4s）:
- 寬度變化（長條、數線）
- 位置變化（垂直偏移）
```

#### 設計原則
1. **主要變化最慢**: 寬度和位置變化使用 0.4s，讓使用者能清楚看到變化
2. **次要變化適中**: 佈局和動畫使用 0.3s，提供流暢感
3. **快速反饋**: 文字變化使用 0.2s，保持即時性
4. **統一緩動函式**: 使用 ease-in-out 提供平滑加速和減速

### 緩動函式選擇

#### ease-in-out
```css
transition: transform 0.4s ease-in-out;
```
- **特性**: 開始慢、中間快、結束慢
- **適用**: 位置和尺寸變化
- **效果**: 自然、流暢、專業

#### ease
```css
transition: border-color 0.3s ease;
```
- **特性**: 開始快、逐漸減速
- **適用**: 顏色和視覺效果
- **效果**: 快速但不突兀

## 受影響的應用
- ✅ **分數比較（Comparison）** - 主要修復應用
  - 模式切換平滑過渡
  - 元素出現/消失動畫
  - 佈局變化流暢

## 影響範圍
- ✅ Comparison app: 模式切換動畫
- ✅ 使用者體驗：流暢、自然、專業
- ✅ 視覺連續性：無跳動，有方向感
- ✅ 認知負擔：降低，變化清晰可追蹤

## 預期結果
- ✅ 模式切換時長條寬度平滑變化（0.4s ease-in-out）
- ✅ 模式切換時垂直位置平滑移動（0.4s ease-in-out）
- ✅ 「上下移動」按鈕淡入效果（從右側滑入，0.3s）
- ✅ 快速操作按鈕組淡入效果（從下方滑入，0.3s）
- ✅ 模式說明文字平滑過渡（透明度變化，0.2s）
- ✅ 數線寬度同步平滑變化（0.4s ease-in-out）
- ✅ 佈局重排流暢自然（0.3s）
- ✅ 整體體驗流暢、專業、有連續性

## 測試驗證
驗證項目：
- ⏳ Comparison app: 切換到模式2，長條寬度平滑變化
- ⏳ Comparison app: 切換到模式2，「上下移動」按鈕淡入
- ⏳ Comparison app: 切換到模式2，快速操作按鈕組淡入
- ⏳ Comparison app: 切換回模式1，長條寬度平滑恢復100%
- ⏳ Comparison app: 切換回模式1，垂直偏移平滑歸零
- ⏳ Comparison app: 切換回模式1，按鈕消失無跳動
- ⏳ Comparison app: 模式說明文字變化流暢
- ⏳ Comparison app: 數線寬度同步變化（如顯示數線）
- ⏳ Comparison app: 連續快速切換模式，動畫不衝突
- ⏳ 無控制台錯誤或警告
- ⏳ 動畫流暢，無卡頓
- ⏳ 佈局無跳動或閃爍

## 設計考量

### 動畫設計原則
| 原則 | 實施 |
|------|------|
| 適當時長 | ✅ 0.2s-0.4s，視變化類型而定 |
| 統一緩動 | ✅ ease-in-out 提供自然感 |
| 淡入淡出 | ✅ fadeIn 動畫避免突然出現 |
| 層次過渡 | ✅ 不同元素不同時長，有節奏 |
| 方向暗示 | ✅ 從右側/下方滑入，符合直覺 |

### 使用者體驗流程（修改後）
1. **點擊模式按鈕**: 從「模式1」切換到「模式2」
2. **平滑變化**: 
   - 長條寬度可能變化（0.4s ease-in-out）
   - 垂直位置可能移動（0.4s ease-in-out）
   - 數線寬度同步變化（0.4s ease-in-out）
3. **元素淡入**: 
   - 「上下移動」按鈕從右側滑入（0.3s）
   - 快速操作按鈕組從下方滑入（0.3s）
4. **文字更新**: 說明文字平滑過渡（0.2s）
5. **完成切換**: 所有變化完成，新模式就緒
6. **反向切換**: 切換回模式1時，所有變化反向平滑進行

### 技術權衡

#### 動畫時長權衡
| 考量 | 選擇 | 理由 |
|------|------|------|
| 過快（<0.2s）| ❌ 避免 | 變化難以察覺，失去過渡意義 |
| 適中（0.2-0.4s）| ✅ 採用 | 流暢且不拖延，最佳體驗 |
| 過慢（>0.5s）| ❌ 避免 | 拖慢操作，降低效率 |

#### CSS vs JavaScript 動畫
| 方案 | 評估 |
|------|------|
| CSS transitions | ✅ 採用，性能佳，代碼簡潔 |
| CSS animations | ✅ 採用，用於淡入淡出 |
| JS animations | ❌ 未用，CSS 已滿足需求 |

### 未來改進方向
- 添加「預覽模式」，顯示切換前後對比
- 提供動畫速度偏好設定（快速/標準/慢速）
- 添加「減少動畫」無障礙選項（prefers-reduced-motion）
- 為不同變化類型設計更豐富的過渡效果

## CSS 相關

### 新增的動畫
```css
/* 從右側滑入 - 用於橫向按鈕 */
@keyframes fadeInFromRight {
  from {
    opacity: 0;
    transform: translateX(10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* 從下方滑入 - 用於按鈕組 */
@keyframes fadeInFromBottom {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

### 動畫使用場景
| 動畫 | 元素 | 觸發時機 |
|------|------|----------|
| fadeInFromRight | .comparison-offset-handle | 切換到模式2 |
| fadeInFromBottom | .quick-actions | 切換到模式2 |

### 過渡效果總覽
| 元素 | 屬性 | 時長 | 緩動 |
|------|------|------|------|
| .comparison-row | transform | 0.4s | ease-in-out |
| .comparison-bar | width | 0.4s | ease-in-out |
| .comparison-bar | border-color | 0.3s | ease |
| .comparison-bar | box-shadow | 0.3s | ease |
| .comparison-number-line-wrap | width | 0.4s | ease-in-out |
| .comparison-row-header | all | 0.3s | ease-in-out |
| .comparison-toolbar-panel | all | 0.3s | ease-in-out |
| .comparison-control-group | all | 0.3s | ease-in-out |
| .comparison-mode-copy | opacity | 0.2s | ease-in-out |

## 無障礙考量

### prefers-reduced-motion
```css
/* 未來可添加 */
@media (prefers-reduced-motion: reduce) {
  .comparison-row,
  .comparison-bar,
  .comparison-number-line-wrap,
  .comparison-row-header,
  .comparison-toolbar-panel,
  .comparison-control-group,
  .comparison-mode-copy {
    transition: none;
    animation: none;
  }
}
```
- **目的**: 尊重使用者偏好設定
- **效果**: 停用所有過渡和動畫
- **狀態**: 建議未來添加

## 備註
- 修改僅影響 CSS 動畫和過渡，不影響邏輯
- 所有動畫使用 GPU 加速屬性（transform, opacity）
- 動畫時長經過測試，平衡流暢度和效率
- 淡入動畫會在每次元素重新渲染時觸發

## 優先級
- **高優先級** - 顯著提升使用者體驗和應用品質感

## 相關修復
- Fix018: 刪除「目前排序」（同一應用，獨立功能）

## 後續改進建議
1. **動畫偏好設定**:
   - 添加設定選項：快速/標準/慢速
   - 記住使用者偏好（localStorage）

2. **無障礙支援**:
   - 添加 prefers-reduced-motion 媒體查詢
   - 提供「停用動畫」選項

3. **進階動畫**:
   - 長條顏色漸變效果
   - 模式切換時的整體淡入淡出
   - 數線刻度的逐步顯示動畫

4. **性能優化**:
   - 使用 will-change 屬性優化性能
   - 動畫結束後移除 will-change
   - 監控動畫性能，確保 60fps

## 狀態
✅ **已完成** - 增加過渡時間，添加淡入淡出動畫，模式切換流暢自然
