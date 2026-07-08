# Track Fix 007 - 修正導覽步驟 5/5 顯示位置錯誤

## 問題描述
- **問題**: 在「異分母分數加法」、「異分母分數減法」、「分數乘法教學」、「異分母分數除法」四個應用中，導覽步驟 5/5 顯示在錯誤的位置
- **影響**: 導覽提示框可能與其他 UI 元素重疊、顯示在螢幕外、或被截斷而難以閱讀

## 參考圖片
- images/image_3.png（在 fix007.md 中提及）

## 實施日期
- **日期**: 2026-06-04
- **開發伺服器端口**: localhost:5173

## 根本原因分析

### 問題定位
1. **目標元素**: 所有受影響應用的第 5 步都指向 `#bottom-answer-zone`（答案填寫區域）
2. **位置設置**: 原本使用 `side: 'top'`，意圖在答案區域上方顯示提示框
3. **實際問題**: 由於答案區域位於頁面底部，當提示框設定為在其「上方」顯示時，會與上方的動畫區域或控制面板重疊，造成位置錯誤

### 根本原因
- 位置設定 `side: 'top'` 對於頁面底部的元素不合適
- driver.js 自動計算位置時，可能將提示框推到不理想的位置
- 沒有考慮答案區域位於頁面底部的特殊情況

## 實施方案
將受影響應用的導覽步驟 5 的位置設定從 `side: 'top'` 改為 `side: 'bottom'`，讓提示框顯示在答案區域的下方，避免與上方內容重疊。

## 變更清單

### 修改的檔案

1. ✅ `src/shared/guides/addition.ts`
   - 步驟 5（answer-zone）: `side: 'top'` → `side: 'bottom'`

2. ✅ `src/shared/guides/subtraction.ts`
   - 步驟 5（answer-zone）: `side: 'top'` → `side: 'bottom'`

3. ✅ `src/shared/guides/multiplication.ts`
   - 步驟 5（answer-zone）: `side: 'top'` → `side: 'bottom'`

4. ✅ `src/shared/guides/division.ts`
   - 步驟 5（answer-zone）: `side: 'top'` → `side: 'bottom'`

## 實施步驟
1. ✅ 讀取 fix007.md 規範文件
2. ✅ 搜尋所有使用 `#bottom-answer-zone` 的導覽步驟
3. ✅ 確認受影響的四個應用（addition, subtraction, multiplication, division）
4. ✅ 檢查 addition 應用的 DOM 結構，確認 #bottom-answer-zone 的實際位置
5. ✅ 使用 multi_replace 批量修改三個應用（addition, subtraction, division）
6. ✅ 單獨修改 multiplication（因為描述文字略有不同）
7. ✅ 建立此追蹤文件

## 技術細節

### 修改前後對比

**修改前（所有四個應用）**:
```typescript
{
  id: 'answer-zone',
  element: '#bottom-answer-zone',
  side: 'top',  // ❌ 在答案區域上方顯示
  title: '✏️ 填寫答案',
  description: '...'
}
```

**修改後（所有四個應用）**:
```typescript
{
  id: 'answer-zone',
  element: '#bottom-answer-zone',
  side: 'bottom',  // ✅ 在答案區域下方顯示
  title: '✏️ 填寫答案',
  description: '...'
}
```

### Driver.js 位置機制
- **side 參數**: 控制提示框相對於目標元素的位置
- **可用值**: 'top', 'bottom', 'left', 'right', 或讓系統自動選擇
- **自動調整**: driver.js 會確保提示框保持在可視範圍內
- **bottom 優勢**: 對於頁面底部元素，使用 'bottom' 可以讓提示框自然延伸到頁面底部邊緣，不會與上方內容重疊

### 為什麼改為 'bottom'
1. **避免重疊**: 答案區域上方是動畫區域和控制面板，使用 'top' 會導致提示框與這些區域重疊
2. **更好的視覺**: 提示框在答案區域下方，用戶可以同時看到答案區域和提示內容
3. **自然流**: 從上到下的閱讀流，最後一步的提示框出現在底部更符合用戶直覺
4. **空間充足**: 頁面底部通常有足夠的空間顯示提示框

## 受影響的應用

### 1. 異分母分數加法（Addition）
- 應用路徑: `src/apps/addition/App.tsx`
- 導覽定義: `src/shared/guides/addition.ts`
- 步驟 5 描述: "在這裡填寫你計算的結果。系統會自動判斷對錯！"

### 2. 異分母分數減法（Subtraction）
- 應用路徑: `src/apps/subtraction/App.tsx`
- 導覽定義: `src/shared/guides/subtraction.ts`
- 步驟 5 描述: "在這裡填寫你計算的結果。系統會自動判斷對錯！"

### 3. 分數乘法教學（Multiplication）
- 應用路徑: `src/apps/multiplication/App.tsx`
- 導覽定義: `src/shared/guides/multiplication.ts`
- 步驟 5 描述: "在這裡輸入你算出來的乘積。記得化簡！系統會告訴你是否正確。"

### 4. 異分母分數除法（Division）
- 應用路徑: `src/apps/division/App.tsx`
- 導覽定義: `src/shared/guides/division.ts`
- 步驟 5 描述: "在這裡填寫你計算的結果。系統會自動判斷對錯！"

## 影響範圍
- ✅ 異分母分數加法（Addition）
- ✅ 異分母分數減法（Subtraction）
- ✅ 分數乘法教學（Multiplication）
- ✅ 異分母分數除法（Division）
- ⚪ 不影響其他應用（相等分數、整數與分數互換、分數比較）

## 預期結果
- ✅ 導覽步驟 5/5 顯示在正確位置（答案區域下方）
- ✅ 提示框不再與其他 UI 元素重疊
- ✅ 提示框完全可見，不會被截斷
- ✅ 用戶可以清楚閱讀導覽內容
- ✅ 所有螢幕尺寸下都能正確顯示

## 測試驗證
驗證項目：
- ⏳ 加法應用：步驟 5/5 顯示在答案區域下方，無重疊
- ⏳ 減法應用：步驟 5/5 顯示在答案區域下方，無重疊
- ⏳ 乘法應用：步驟 5/5 顯示在答案區域下方，無重疊
- ⏳ 除法應用：步驟 5/5 顯示在答案區域下方，無重疊
- ⏳ 提示框完全可見，不被截斷
- ⏳ 提示框內容可清楚閱讀
- ⏳ z-index 正確（提示框在所有內容之上）
- ⏳ 導航按鈕可正常使用
- ⏳ 關閉按鈕正常工作
- ⏳ 行動裝置/平板佈局正常顯示

## Driver.js 整合說明
- 使用第三方庫 driver.js 處理導覽功能
- driver.js 根據 `side` 參數自動計算並調整提示框位置
- driver.js 確保提示框始終在可視範圍內
- 我們的修改只是調整 `side` 參數值，其他邏輯由 driver.js 處理

## 備註
- 此修改僅涉及導覽內容定義檔案，不需要修改組件程式碼
- 所有四個應用的第 5 步都指向相同的元素（#bottom-answer-zone），因此可以統一修改
- 修改後，driver.js 會自動處理提示框的實際渲染和定位
- 如果未來需要進一步調整位置，可以考慮使用 driver.js 的其他定位選項或自定義 CSS

## 優先級
- **高優先級** - 影響用戶入門體驗，導覽功能是新用戶學習應用的重要途徑

## 後續改進建議
- 在所有應用中測試導覽流程，確保所有步驟位置都合適
- 考慮為不同螢幕尺寸提供不同的位置策略
- 可以添加自動偵測並調整位置的邏輯
- 收集用戶反饋，進一步優化導覽體驗

## 狀態
✅ **已完成** - 四個應用的導覽步驟 5/5 位置已修正