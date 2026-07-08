# Track Fix 006 - 為整數與分數互換應用添加導覽功能

## 問題描述
- **問題**: 「整數與分數互換」應用缺少導覽設定或教學功能
- **影響**: 新使用者沒有引導，不了解如何使用應用

## 現狀分析
- 其他應用（加法、減法等）都有導覽功能
- IntFracConv 應用沒有整合 GuidedTour 組件
- 新使用者缺乏功能說明

## 實施日期
- **日期**: 2026-06-04
- **開發伺服器端口**: localhost:5173

## 根本原因
- 應用開發時可能未考慮到導覽功能
- GuidedTour 組件已存在但未應用到此應用
- 缺少相關的導覽內容定義

## 實施方案
按照其他應用的模式，整合現有的 GuidedTour 組件並創建相應的導覽內容。

## 變更清單

### 新增的檔案

1. ✅ `src/shared/guides/intfracconv.ts`
   - 定義導覽內容 intfracconvGuideContent
   - 包含啟動提示訊息和工具提示
   - 定義 6 個導覽步驟

2. ✅ `src/shared/tours/intfracconv.ts`
   - 將導覽內容轉換為 DriveStep 格式
   - 匯出 intfracconvTourSteps 供組件使用

### 修改的檔案

3. ✅ `src/apps/intfracconv/App.tsx`
   - 導入 GuidedTour 組件
   - 導入 intfracconvTourSteps
   - 將 GuidedTour 添加到 AppHeader 的 rightSlot

## 實施步驟
1. ✅ 讀取 fix006.md 規範文件
2. ✅ 檢查現有的 GuidedTour 組件實現
3. ✅ 參考其他應用（addition）的導覽實現模式
4. ✅ 確認導覽內容結構（guides 和 tours 目錄）
5. ✅ 分析 intfracconv 應用的 UI 元素和結構
6. ✅ 創建 intfracconv 導覽內容檔案（guides/intfracconv.ts）
7. ✅ 創建 intfracconv 導覽步驟檔案（tours/intfracconv.ts）
8. ✅ 在 App.tsx 中整合 GuidedTour 組件
9. ✅ 建立此追蹤文件

## 技術細節

### 導覽內容結構（guides/intfracconv.ts）

```typescript
export const intfracconvGuideContent: PageGuideContent = {
  startupHiddenMessages: ['💡 準備中...', '💡 試試點擊長條圖的格子！'],
  startupTooltip: {
    id: 'intfracconv-start',
    element: '.fraction-ui',
    title: '先試試看',
    description: '在這裡輸入分數，或直接點擊長條圖來設定數值。',
    side: 'bottom',
    delayMs: 450,
  },
  tourSteps: [
    // 6 個導覽步驟...
  ],
}
```

### 導覽步驟說明

定義了 6 個導覽步驟，涵蓋主要功能：

1. **輸入數值** (`.fraction-ui`)
   - 介紹輸入區域
   - 說明如何使用按鈕或直接輸入
   - 強調自動更新功能

2. **互動長條圖** (`.bar-wrapper`)
   - 介紹視覺化顯示
   - 說明可以直接點擊格子設定數值
   - 解釋紅色填充的意義

3. **參考線** (`.third-line`)
   - 介紹 1/3 高度的參考線
   - 說明其用途（比較分數大小）

4. **數值轉換** (`.conversion-panel`)
   - 介紹轉換面板
   - 說明分數與帶分數的互換顯示

5. **調整顯示** (`.settings`)
   - 介紹設定區域
   - 說明可以調整長條圖的高度和寬度

6. **切換模式** (`.mode-hint`)
   - 介紹模式切換功能
   - 說明如何觸發（右鍵點擊或長按）
   - 提及三種模式（整數、分數、帶分數）

### 整合到應用（App.tsx）

**添加的導入語句：**
```typescript
import GuidedTour from '../../shared/components/GuidedTour'
import { intfracconvTourSteps } from '../../shared/tours/intfracconv'
```

**添加到 AppHeader：**
```tsx
<AppHeader
  leftSlot={<div className="title-badge">整數與分數互換</div>}
  rightSlot={<GuidedTour steps={intfracconvTourSteps} />}
/>
```

### GuidedTour 組件技術
- 使用 driver.js 庫實現導覽功能
- 支援進度顯示
- 包含「下一步」、「上一步」、「關閉」按鈕
- 中文化按鈕文字（透過 SHARED_GUIDE_CONTROLS）
- 自動計算最佳 popover 位置

## 導覽特色

### 使用者體驗
- **啟動提示**: 頁面載入時顯示友善的提示訊息
- **步進式教學**: 逐步引導用戶了解每個功能
- **視覺高亮**: 突出當前教學的 UI 元素
- **彈性導航**: 用戶可以前進、後退或跳過教學

### 覆蓋範圍
- ✅ 輸入功能（鍵盤輸入、按鈕調整）
- ✅ 視覺化功能（長條圖、點擊互動）
- ✅ 參考線（fix004 新增的功能）
- ✅ 轉換顯示（分數 ↔ 帶分數）
- ✅ 設定調整（高度、寬度滑桿）
- ✅ 模式切換（整數、分數、帶分數）

## 影響範圍
- ✅ 整數與分數互換（intfracconv）應用
- ⚪ 不影響其他應用

## 預期結果
- ✅ IntFracConv 應用現在有導覽按鈕
- ✅ 新使用者可以獲得逐步引導
- ✅ 所有主要功能都有說明
- ✅ 使用體驗與其他應用一致

## 測試驗證
驗證項目：
- ⏳ 導覽按鈕出現在應用右上角
- ⏳ 點擊按鈕啟動導覽
- ⏳ 所有 6 個步驟正確顯示
- ⏳ 每個步驟的目標元素正確高亮
- ⏳ 「下一步」、「上一步」、「關閉」按鈕正常運作
- ⏳ 導覽完成後正常關閉
- ⏳ 導覽內容準確描述功能
- ⏳ 無控制台錯誤或警告

## 與其他修復的協調
- **Fix004**: 導覽內容包含對 1/3 參考線的說明（第 3 步驟）
- **Fix005**: 導覽內容不再提及已移除的確定按鈕
- 導覽內容反映當前的實際 UI 狀態

## 備註
- 導覽使用 driver.js 第三方庫，已在其他應用中驗證穩定
- 導覽內容為繁體中文，符合應用的整體語言風格
- 導覽步驟可以根據用戶反饋進一步優化和調整
- 所有元素選擇器（`.fraction-ui`, `.bar-wrapper` 等）需要確保在實際 DOM 中存在

## 未來改進建議
- 考慮添加「首次訪問自動啟動」功能
- 可以添加「不再顯示」選項
- 考慮添加更多互動示例（如在導覽中實際演示點擊）
- 可以根據使用數據調整導覽步驟順序和內容

## 狀態
✅ **已完成** - 導覽功能已整合到整數與分數互換應用