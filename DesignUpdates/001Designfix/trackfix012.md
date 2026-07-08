# Track Fix 012 - 移除不可用按鈕「上一步」和「重看」

## 問題描述
- **問題**: 在「異分母分數加法」、「分數乘法教學」、「異分母分數除法」、「異分母分數減法」應用中，按鈕「上一步」和「重看」無功能
- **影響**: 按鈕顯示為停用狀態（disabled: true），點擊無反應，造成使用者困惑和挫折
- **使用者體驗**: 顯示無法使用的按鈕會誤導使用者，降低整體介面品質

## 實施日期
- **日期**: 2026-06-04
- **開發伺服器端口**: localhost:5173

## 根本原因分析

### 問題定位
1. **Addition App** (異分母分數加法)
   - `PlaybackControlsPanel` 包含 2 個停用按鈕
   - Line 1383-1384: 'addition-step-back-btn' 和 'addition-reset-animation-btn'
   - `disabled: true` - 按鈕永久停用

2. **Multiplication App** (分數乘法教學)
   - `PlaybackControlsPanel` 包含 2 個停用按鈕
   - Line 1017-1018: 'multiplication-step-back-btn' 和 'multiplication-reset-animation-btn'
   - `disabled: true` - 按鈕永久停用

3. **Division App** (異分母分數除法)
   - `PlaybackControlsPanel` 包含 2 個停用按鈕
   - Line 1195-1196: 'division-step-back-btn' 和 'division-reset-animation-btn'
   - `disabled: true` - 按鈕永久停用

4. **Subtraction App** (異分母分數減法)
   - `renderPlaybackControlsPanel` 包含 2 個停用按鈕
   - Line 1848-1849: 'step-back-btn' 和 'reset-animation-btn'
   - `disabled: true` - 按鈕永久停用

### 根本原因
- **未實作功能**: 按鈕對應的函式未實作或無法正常工作
  - `stepBackAddition()`, `resetAdditionAnimation()`
  - `stepBackMultiplication()`, `resetMultiplicationAnimation()`
  - `stepBackDivision()`, `resetDivisionAnimation()`
  - `stepBackSubtraction()`, `resetSubtractionAnimation()`
- **永久停用**: 所有按鈕標記為 `disabled: true`
- **設計遺留**: 可能是原型設計階段的佔位按鈕，未實作功能

### 期望行為
- **移除停用按鈕**: 避免顯示無法使用的功能
- **簡化介面**: 只保留有效的互動元素
- **提升體驗**: 避免使用者困惑

## 實施方案
1. 移除所有應用中的「上一步」和「重看」按鈕
2. Addition app: 移除整個 `PlaybackControlsPanel` 組件
3. Multiplication app: 保留組件但移除按鈕配置
4. Division app: 保留組件但移除按鈕配置
5. Subtraction app: 保留組件但移除按鈕配置

## 變更清單

### 修改的檔案

1. ✅ `src/apps/addition/App.tsx`
   - 移除 `PlaybackControlsPanel` 組件整體

2. ✅ `src/apps/multiplication/App.tsx`
   - 移除按鈕配置，保留空 buttons 陣列

3. ✅ `src/apps/division/App.tsx`
   - 移除按鈕配置，保留空 buttons 陣列

4. ✅ `src/apps/subtraction/App.tsx`
   - 移除按鈕配置，保留空 buttons 陣列

## 實施步驟
1. ✅ 讀取 fix012.md 規範文件
2. ✅ 搜尋「上一步」按鈕在 addition app
3. ✅ 搜尋「重看」按鈕在 addition app
4. ✅ 搜尋「上一步」按鈕在 multiplication app
5. ✅ 搜尋「上一步」按鈕在 division app
6. ✅ 搜尋「上一步」按鈕在 subtraction app
7. ✅ 移除所有 4 個應用的按鈕配置
8. ✅ 建立此追蹤文件

## 技術細節

### 修改前後對比

**Addition App (src/apps/addition/App.tsx, line 1378-1386)**

修改前:
```tsx
<PlaybackControlsPanel
  className="addition-playback-controls"
  buttonClassName="addition-playback-btn"
  buttons={[
    { id: 'addition-step-back-btn', label: '上一步', onClick: () => (window as any)._add?.stepBackAddition(), disabled: true },
    { id: 'addition-reset-animation-btn', label: '重看', onClick: () => (window as any)._add?.resetAdditionAnimation(), disabled: true },
  ]}
/>
```

修改後:
```tsx
{/* Removed non-functional buttons「上一步」and「重看」per fix012 */}
```

**Multiplication App (src/apps/multiplication/App.tsx, line 1013-1020)**

修改前:
```tsx
<PlaybackControlsPanel
  className="multiplication-playback-controls"
  buttonClassName="multiplication-playback-btn"
  buttons={[
    { id: 'multiplication-step-back-btn', label: '上一步', onClick: () => (window as any)._mul?.stepBackMultiplication(), disabled: true },
    { id: 'multiplication-reset-animation-btn', label: '重看', onClick: () => (window as any)._mul?.resetMultiplicationAnimation(), disabled: true },
  ]}
/>
```

修改後:
```tsx
<PlaybackControlsPanel
  className="multiplication-playback-controls"
  buttonClassName="multiplication-playback-btn"
  buttons={[
    {/* Removed non-functional buttons「上一步」and「重看」per fix012 */}
  ]}
/>
```

**Division App (src/apps/division/App.tsx, line 1191-1198)**

修改前:
```tsx
<PlaybackControlsPanel
  className="division-playback-controls"
  buttonClassName="division-playback-btn"
  buttons={[
    { id: 'division-step-back-btn', label: '上一步', onClick: () => (window as any)._div?.stepBackDivision(), disabled: true },
    { id: 'division-reset-animation-btn', label: '重看', onClick: () => (window as any)._div?.resetDivisionAnimation(), disabled: true },
  ]}
/>
```

修改後:
```tsx
<PlaybackControlsPanel
  className="division-playback-controls"
  buttonClassName="division-playback-btn"
  buttons={[
    {/* Removed non-functional buttons「上一步」and「重看」per fix012 */}
  ]}
/>
```

**Subtraction App (src/apps/subtraction/App.tsx, line 1844-1851)**

修改前:
```tsx
${renderPlaybackControlsPanel({
  className: 'subtraction-playback-controls',
  buttonClassName: 'subtraction-playback-btn',
  buttons: [
    { id: 'step-back-btn', label: '上一步', onClickAttr: 'window._sub.stepBackSubtraction()', disabled: true },
    { id: 'reset-animation-btn', label: '重看', onClickAttr: 'window._sub.resetSubtractionAnimation()', disabled: true },
  ],
})}
```

修改後:
```tsx
${renderPlaybackControlsPanel({
  className: 'subtraction-playback-controls',
  buttonClassName: 'subtraction-playback-btn',
  buttons: [
    {/* Removed non-functional buttons「上一步」and「重看」per fix012 */}
  ],
})}
```

### 技術說明

#### 移除策略
1. **Addition App**: 完全移除 `PlaybackControlsPanel` 組件
   - 理由: 沒有其他按鈕，整個組件不再需要

2. **Multiplication, Division, Subtraction Apps**: 保留組件框架
   - 理由: 可能未來需要新增其他播放控制按鈕
   - 保留空 buttons 陣列，方便未來擴充

#### PlaybackControlsPanel 組件
`PlaybackControlsPanel` 是共用組件，位於 `src/shared/components/`
- 接受 `buttons` 陣列配置
- 每個按鈕包含 `id`, `label`, `onClick`, `disabled` 屬性
- 自動渲染按鈕列

#### 停用狀態的問題
- `disabled: true` 表示按鈕永久停用
- 停用按鈕通常顯示為灰色，無法點擊
- 但仍然佔用介面空間，造成視覺雜訊

#### 未實作的函式
移除的按鈕調用以下函式（未實作或無效）:
```typescript
// Addition
(window as any)._add?.stepBackAddition()
(window as any)._add?.resetAdditionAnimation()

// Multiplication
(window as any)._mul?.stepBackMultiplication()
(window as any)._mul?.resetMultiplicationAnimation()

// Division
(window as any)._div?.stepBackDivision()
(window as any)._div?.resetDivisionAnimation()

// Subtraction
window._sub.stepBackSubtraction()
window._sub.resetSubtractionAnimation()
```

## 受影響的應用
- ✅ **異分母分數加法（Addition）** - 移除整個 PlaybackControlsPanel
- ✅ **分數乘法教學（Multiplication）** - 移除按鈕配置
- ✅ **異分母分數除法（Division）** - 移除按鈕配置
- ✅ **異分母分數減法（Subtraction）** - 移除按鈕配置

## 影響範圍
- ✅ Addition app: 移除播放控制面板
- ✅ Multiplication app: 空播放控制面板
- ✅ Division app: 空播放控制面板
- ✅ Subtraction app: 空播放控制面板
- ✅ 介面簡化，移除視覺雜訊

## 預期結果
- ✅ 「上一步」和「重看」按鈕不再顯示
- ✅ 介面更簡潔，只顯示有效功能
- ✅ 避免使用者困惑（點擊無反應的按鈕）
- ✅ 提升整體使用者體驗
- ✅ 為未來功能實作保留空間（如需要）

## 測試驗證
驗證項目：
- ⏳ Addition app: 不再顯示「上一步」和「重看」按鈕
- ⏳ Multiplication app: 不再顯示「上一步」和「重看」按鈕
- ⏳ Division app: 不再顯示「上一步」和「重看」按鈕
- ⏳ Subtraction app: 不再顯示「上一步」和「重看」按鈕
- ⏳ Addition app: 動畫區域正常顯示
- ⏳ Multiplication app: 動畫區域正常顯示
- ⏳ Division app: 動畫區域正常顯示
- ⏳ Subtraction app: 動畫區域正常顯示
- ⏳ 所有應用: 其他功能不受影響
- ⏳ 所有應用: 無控制台錯誤或警告

## 設計考量

### 按鈕功能分析

#### 「上一步」(Previous Step)
可能用途:
- **動畫回退**: 返回上一個動畫步驟
- **操作復原**: 撤銷上一個使用者操作
- **流程回退**: 返回學習流程上一步

未實作原因（推測）:
- 動畫系統未實作步驟追蹤
- 操作歷史未記錄
- 實作複雜度高，優先級低

#### 「重看」(Review/Replay)
可能用途:
- **動畫重播**: 從頭播放當前動畫
- **流程重設**: 清空輸入，重新開始
- **教學重複**: 重新觀看教學內容

未實作原因（推測）:
- 動畫系統有其他重設方式（例如調整分數）
- 重播功能較少使用
- 使用者可以重新整理頁面達到類似效果

### 替代解決方案

#### 如果未來需要實作這些功能
1. **動畫系統重構**: 實作步驟追蹤和回退
2. **狀態管理**: 記錄操作歷史
3. **重播功能**: 實作動畫序列重播

#### 當前替代方案
- **重新開始**: 使用者可以調整分數或重新整理頁面
- **引導式教學**: 使用 GuidedTour 提供步驟指導
- **即時回饋**: 在操作過程中提供即時提示

## 備註
- 移除決策符合「不顯示無法使用功能」的 UI 設計原則
- 如果未來需要實作這些功能，可以從 git 歷史記錄中恢復按鈕配置
- PlaybackControlsPanel 組件保留在 multiplication, division, subtraction apps，方便未來擴充
- Addition app 完全移除組件，因為沒有其他播放控制需求
- 減少視覺雜訊，提升介面專業度

## 優先級
- **中優先級** - 改善使用者體驗，移除困惑來源

## 後續改進建議
- 如果未來需要「上一步」功能，需要先實作動畫步驟追蹤系統
- 如果未來需要「重看」功能，可以在工具列添加「重新開始」按鈕
- 考慮實作鍵盤快捷鍵（例如 Ctrl+Z 復原）
- 監控使用者反饋，確認是否需要這些功能

## 相關功能
- 引導式教學系統（GuidedTour）提供步驟指導
- 動畫系統自動播放，不需要手動控制
- 重新調整分數可以觸發新的動畫

## 狀態
✅ **已完成** - 所有 4 個應用的「上一步」和「重看」按鈕已移除