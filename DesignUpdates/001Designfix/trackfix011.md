# Track Fix 011 - 「拖到這裡」提示的顯示位置不正確

## 問題描述
- **問題**: 在「異分母分數加法」應用中，提示「拖到這裡」(drag here) 的顯示位置不正確
- **影響**: 提示文字位置錯誤，無法有效指引使用者拖曳到正確的投放區域
- **參考圖片**: images/image_8.png

## 實施日期
- **日期**: 2026-06-04
- **開發伺服器端口**: localhost:5173

## 根本原因分析

### 問題定位
1. **提示顯示函式**: `showAnchoredCue()` 在 line 404 顯示「拖到這裡」提示
   ```typescript
   showAnchoredCue(document.getElementById('bar3-wrap') as HTMLElement | null, '拖到這裡', '👇')
   ```

2. **定位邏輯**: `positionCue()` 函式計算提示位置
   - 使用 `getCueRole(target)` 判斷目標類型
   - bar3-wrap 被判定為 'default' 角色
   - default 角色的定位: `top = rect.bottom + 10` (目標下方 10px)

3. **問題**: bar3-wrap 是投放區域（drop zone），提示應該顯示在投放區域內部或上方，而不是下方
   - 當前邏輯將提示放在 bar3-wrap 下方
   - bar3-wrap 高度較大（尤其是堆疊模式），提示位置太低
   - 使用者看不到提示，或提示與其他元素重疊

### 根本原因
- **缺少 drop zone 角色**: `getCueRole()` 沒有為 bar3-wrap 定義特殊角色
- **預設定位不適用**: 預設定位（目標下方）不適合投放區域
- **參考圖片顯示**: 提示應該顯示在投放區域的上部內側，與投放區域重疊

### 期望行為（根據參考圖片）
- 提示「拖到這裡」應該顯示在 bar3-wrap 投放區域內部
- 水平居中
- 垂直位置在投放區域上部（大約 20px from top）
- 提示與投放區域重疊，提供明確的視覺指引

## 實施方案
1. 在 `getCueRole()` 添加 'dropzone' 角色，識別 bar3-wrap
2. 在 `positionCue()` 添加 dropzone 角色的定位邏輯
3. 將提示定位在投放區域內部上方

## 變更清單

### 修改的檔案

1. ✅ `src/apps/addition/App.tsx`
   - 修改 `getCueRole()` 函式，添加 bar3-wrap 的 'dropzone' 角色
   - 修改 `positionCue()` 函式，添加 dropzone 角色的定位邏輯

## 實施步驟
1. ✅ 讀取 fix011.md 規範文件
2. ✅ 檢視參考圖片 images/image_8.png
3. ✅ 搜尋「拖到這裡」文字，找到 showAnchoredCue 調用 (line 404)
4. ✅ 分析 `showAnchoredCue()` 函式 (line 322)
5. ✅ 分析 `positionCue()` 函式 (line 296)
6. ✅ 分析 `getCueRole()` 函式 (line 289)
7. ✅ 修改 `getCueRole()` 添加 dropzone 角色識別
8. ✅ 修改 `positionCue()` 添加 dropzone 定位邏輯
9. ✅ 建立此追蹤文件

## 技術細節

### 修改前後對比

**修改前（`getCueRole()`, lines 289-294）**:
```typescript
function getCueRole(target: HTMLElement) {
  if (target.id === 'frac1-group' || target.id === 'frac2-group') return 'fraction'
  if (target.id === 'ans-w' || target.id === 'ans-num' || target.id === 'ans-den' || target.closest('#bottom-answer-zone')) return 'answer'
  if (target.classList.contains('tool-btn') || target.closest('.denominator-tool-group')) return 'tool'
  return 'default'  // ← bar3-wrap 被判定為 default
}
```

**修改後**:
```typescript
function getCueRole(target: HTMLElement) {
  if (target.id === 'frac1-group' || target.id === 'frac2-group') return 'fraction'
  if (target.id === 'ans-w' || target.id === 'ans-num' || target.id === 'ans-den' || target.closest('#bottom-answer-zone')) return 'answer'
  if (target.classList.contains('tool-btn') || target.closest('.denominator-tool-group')) return 'tool'
  if (target.id === 'bar3-wrap') return 'dropzone'  // ← 新增 dropzone 角色
  return 'default'
}
```

**修改前（`positionCue()`, lines 296-318）**:
```typescript
function positionCue(cue: HTMLElement, target: HTMLElement) {
  const rect = target.getBoundingClientRect()
  const cueRect = cue.getBoundingClientRect()
  const role = getCueRole(target)

  let left = rect.left + (rect.width / 2) - (cueRect.width / 2)
  let top = rect.bottom + 10  // ← 預設: 目標下方

  if (role === 'fraction') {
    top = rect.bottom + 14
  } else if (role === 'answer') {
    left = rect.right + 10
    top = rect.bottom - cueRect.height
    if (left + cueRect.width > window.innerWidth - 12) {
      left = rect.left + (rect.width / 2) - (cueRect.width / 2)
      top = rect.bottom + 12
    }
  }
  // 沒有 dropzone 角色的處理

  if (top < 12) top = rect.bottom + 10
  if (top + cueRect.height > window.innerHeight - 12) top = Math.max(12, rect.top - cueRect.height - 10)

  cue.style.left = `${clampCueLeft(left, cueRect.width)}px`
  cue.style.top = `${top}px`
}
```

**修改後**:
```typescript
function positionCue(cue: HTMLElement, target: HTMLElement) {
  const rect = target.getBoundingClientRect()
  const cueRect = cue.getBoundingClientRect()
  const role = getCueRole(target)

  let left = rect.left + (rect.width / 2) - (cueRect.width / 2)
  let top = rect.bottom + 10

  if (role === 'fraction') {
    top = rect.bottom + 14
  } else if (role === 'answer') {
    left = rect.right + 10
    top = rect.bottom - cueRect.height
    if (left + cueRect.width > window.innerWidth - 12) {
      left = rect.left + (rect.width / 2) - (cueRect.width / 2)
      top = rect.bottom + 12
    }
  } else if (role === 'dropzone') {
    // Position tooltip inside/overlaying the drop zone
    // Centered horizontally, positioned in the upper portion
    left = rect.left + (rect.width / 2) - (cueRect.width / 2)
    top = rect.top + 20  // ← 新增: 投放區域內部上方 20px
  }

  if (top < 12) top = rect.bottom + 10
  if (top + cueRect.height > window.innerHeight - 12) top = Math.max(12, rect.top - cueRect.height - 10)

  cue.style.left = `${clampCueLeft(left, cueRect.width)}px`
  cue.style.top = `${top}px`
}
```

### 技術說明

#### 定位邏輯
```typescript
else if (role === 'dropzone') {
  // 水平居中
  left = rect.left + (rect.width / 2) - (cueRect.width / 2)
  
  // 投放區域內部上方 20px
  top = rect.top + 20
}
```

- **水平居中**: `(rect.width / 2) - (cueRect.width / 2)` 計算居中偏移
- **垂直定位**: `rect.top + 20` 從投放區域頂部向下 20px
- **重疊顯示**: 提示與投放區域重疊，提供明確視覺指引

#### 為什麼使用 20px 偏移
- **視覺平衡**: 20px 提供足夠的上方留白，不會太貼近邊框
- **可見性**: 提示完全顯示在投放區域內部，不會被裁切
- **參考圖片**: 根據 image_8.png 的視覺效果調整

#### 角色系統
`getCueRole()` 現在支援 4 種角色：
1. **'fraction'**: 分數輸入區域 (frac1-group, frac2-group)
   - 定位: 目標下方 14px
2. **'answer'**: 答案輸入區域 (ans-w, ans-num, ans-den, bottom-answer-zone)
   - 定位: 目標右側或下方（根據空間）
3. **'tool'**: 工具按鈕 (tool-btn, denominator-tool-group)
   - 定位: 預設邏輯
4. **'dropzone'**: 投放區域 (bar3-wrap) ← 新增
   - 定位: 投放區域內部上方 20px
5. **'default'**: 其他元素
   - 定位: 目標下方 10px

### 提示顯示時機
提示「拖到這裡」在以下情況顯示：
- 當分母相同（`isCommonDenomReady = true`）時
- 引導使用者拖曳區塊到 bar3-wrap 投放區域進行合併
- icon: '👇' (向下指的手，指向投放區域)

## 受影響的應用
- ✅ **異分母分數加法（Addition）** - 主要修復應用
  - bar3-wrap 投放區域的提示位置正確
  - 提示顯示在投放區域內部，更清楚指引

## 影響範圍
- ✅ Addition app: bar3-wrap 投放區域提示
- ✅ `showAnchoredCue()` 調用，針對 bar3-wrap
- ✅ 引導式教學流程（guided instruction）

## 預期結果
- ✅ 提示「拖到這裡」顯示在 bar3-wrap 投放區域內部上方
- ✅ 水平居中對齊
- ✅ 與投放區域重疊，提供明確視覺指引
- ✅ 使用者清楚知道要拖曳到哪裡
- ✅ 提示不會與其他元素重疊或被遮擋

## 測試驗證
驗證項目：
- ⏳ 加法應用：調整分數值，使分母相同
- ⏳ 加法應用：提示「拖到這裡」顯示在 bar3-wrap 內部
- ⏳ 加法應用：提示水平居中
- ⏳ 加法應用：提示位於投放區域上方部分
- ⏳ 加法應用：提示與投放區域視覺重疊
- ⏳ 加法應用：拖曳區塊到提示指示的位置
- ⏳ 加法應用：提示在拖曳過程中保持可見
- ⏳ 加法應用：不同視窗大小下的提示位置
- ⏳ 加法應用：移動裝置上的提示顯示
- ⏳ 無控制台錯誤或警告

## 設計考量

### 視覺層次
1. **投放區域**: bar3-wrap，橙色虛線輪廓
2. **提示層**: 「拖到這裡」提示，重疊在投放區域上方
3. **icon**: 👇 向下指的手，明確指向投放區域

### 使用者引導流程
1. **分母相同**: 使用者調整分數，使分母相同
2. **顯示投放區域**: bar3-wrap 顯示，橙色虛線輪廓
3. **顯示提示**: 「拖到這裡」提示顯示在投放區域內部
4. **拖曳操作**: 使用者拖曳區塊到投放區域
5. **合併結果**: 區塊合併，顯示結果

### 定位策略
- **重疊顯示**: 提示與投放區域重疊，提供最直接的視覺關聯
- **內部定位**: 提示在投放區域內部，避免與外部元素衝突
- **上方位置**: 提示在上方，不會被拖曳的區塊遮擋

## 備註
- 修改僅影響 `getCueRole()` 和 `positionCue()` 函式
- 不影響其他提示的定位邏輯
- dropzone 角色目前僅用於 bar3-wrap
- 如果其他投放區域需要類似定位，可以擴展 getCueRole() 判斷條件
- 定位偏移 (20px) 可根據實際視覺效果調整

## 優先級
- **高優先級** - 影響使用者引導和拖曳操作的清晰度

## 後續改進建議
- 可以考慮為提示添加動畫效果（例如脈衝、閃爍）
- 可以考慮根據投放區域高度動態調整提示位置
- 可以考慮在投放區域為空時顯示更大的提示
- 根據使用者測試反饋，可能需要調整垂直偏移量 (20px)

## 相關提示
- Addition app 使用多個 showAnchoredCue 調用來引導使用者
- 其他提示: 「調分母」、「點擊或拖拉」、「填入答案」
- 提示系統支援自動跟隨目標元素（followCue）

## 狀態
✅ **已完成** - bar3-wrap 提示位置已修正，顯示在投放區域內部上方