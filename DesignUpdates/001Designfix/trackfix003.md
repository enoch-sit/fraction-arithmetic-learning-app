# Track Fix 003 - 所有長條圖使用方角

## 問題描述
- **問題**: 所有分數長條圖應使用方角（直角）而非圓角，以保持一致性和清晰度
- **影響**: 多個應用中的長條圖樣式不一致

## 設計參考
- UI 參考: 「異分母分數加法」應用（addition app）
- 功能參考: 「整數與分數互換」應用（intfracconv app）

## 實施日期
- **日期**: 2026-06-04
- **開發伺服器端口**: localhost:5173

## 根本原因
- 長條圖元素使用了 `border-radius` 屬性，產生圓角效果
- 不同應用中的圓角半徑值不一致（4px、10px、12px 等）
- 與設計規範不符，應使用方角（border-radius: 0）

## 實施方案
將所有長條圖相關元素的 `border-radius` 改為 `0`，確保視覺一致性。

## 變更清單

### 修改的檔案

1. ✅ `src/apps/equivalent/app.css`
   - `.bar-container`: border-radius: 12px → 0
   - `.bar-fill`: border-radius: 10px → 0
   - `.grid-overlay`: border-radius: 10px → 0

2. ✅ `src/apps/addition/app.css`
   - `.bar-unit`: border-radius: 4px → 0
   - `.bar-wrap-container.continuous .bar-unit:last-child`: 圓角 4px → 0
   - `.bar-wrap-container.continuous .bar-unit:first-child`: 圓角 4px → 0

3. ✅ `src/apps/subtraction/app.css`
   - `.bar-unit`: border-radius: 4px → 0
   - `.bar-wrap-container.continuous .bar-unit:last-child`: 圓角 4px → 0
   - `.bar-wrap-container.continuous .bar-unit:first-child`: 圓角 4px → 0

4. ✅ `src/apps/division/app.css`
   - `.bar-unit`: border-radius: 4px → 0
   - `.bar-wrap-container.continuous .bar-unit:last-child`: 圓角 4px → 0
   - `.bar-wrap-container.continuous .bar-unit:first-child`: 圓角 4px → 0

5. ✅ `src/apps/multiplication/app.css`
   - `.bar-unit`: border-radius: 4px → 0
   - `.bar-wrap-container.continuous .bar-unit.bar-unit-last`: 圓角 4px → 0
   - `.bar-wrap-container.continuous .bar-unit:last-child`: 圓角 4px → 0
   - `.bar-wrap-container.continuous .bar-unit:first-child`: 圓角 4px → 0

## 實施步驟
1. ✅ 識別所有使用長條圖的應用
2. ✅ 搜尋並定位所有與長條圖相關的 CSS 類別
3. ✅ 更新 equivalent 應用的長條圖樣式
4. ✅ 更新 addition 應用的長條圖樣式
5. ✅ 更新 subtraction 應用的長條圖樣式
6. ✅ 更新 division 應用的長條圖樣式
7. ✅ 更新 multiplication 應用的長條圖樣式
8. ✅ 建立此追蹤文件

## 技術細節

### 修改前的樣式問題
```css
/* 不一致的圓角值 */
.bar-container { border-radius: 12px; }  /* equivalent */
.bar-fill { border-radius: 10px; }  /* equivalent */
.bar-unit { border-radius: 4px; }  /* addition, subtraction, division, multiplication */
```

### 修改後的統一樣式
```css
/* 所有長條圖元素統一使用方角 */
.bar-container { border-radius: 0; }
.bar-fill { border-radius: 0; }
.grid-overlay { border-radius: 0; }
.bar-unit { border-radius: 0; }

/* 連續模式下的第一個和最後一個單元也是方角 */
.bar-wrap-container.continuous .bar-unit:last-child {
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}
.bar-wrap-container.continuous .bar-unit:first-child {
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
}
```

## 影響的應用
- ✅ 相等分數（equivalent）
- ✅ 異分母分數加法（addition）
- ✅ 異分母分數減法（subtraction）
- ✅ 分數乘法（multiplication）
- ✅ 分數除法（division）
- ⚪ 分數比較（comparison）- 無長條圖元素
- ⚪ 擴分（expanding）- 待確認
- ⚪ 整數與分數互換（intfracconv）- 無長條圖元素

## 預期結果
- ✅ 所有長條圖使用方角邊框
- ✅ 所有應用的視覺樣式一致
- ✅ 更清晰的分數視覺化表示
- ✅ 符合設計規範

## 備註
- 此修改僅影響視覺呈現，不影響應用功能
- 所有長條圖相關的交互功能保持不變
- CSS 變更立即生效，無需重新編譯

## 狀態
✅ **已完成** - 所有受影響的應用 CSS 已更新為方角樣式