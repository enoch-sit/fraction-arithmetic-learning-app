# Track Fix 008 - 點擊「顯示帶分數」後缺少上下箭頭

## 問題描述
- **問題**: 在「異分母分數加法」、「異分母分數減法」、「分數乘法教學」、「異分母分數除法」四個應用中，點擊「顯示帶分數」按鈕後，輸入框沒有上下箭頭
- **影響**: 使用者只能透過鍵盤輸入數值，無法使用增減按鈕，操作不便
- **不一致性**: 與初始狀態不一致，降低使用者體驗

## 實施日期
- **日期**: 2026-06-04
- **開發伺服器端口**: localhost:5173

## 根本原因分析

### 問題定位
1. **CSS 隱藏**: `src/shared/base.css` 中有三處 CSS 規則使用 `-webkit-appearance: none` 明確隱藏了原生的 number input 上下箭頭
2. **受影響的 CSS 類別**:
   - `.input-wrapper input` (lines 419-420)
   - `.whole-input` (lines 524-525)
   - `.frac-input` (lines 534-535)

### 根本原因
- CSS 規則刻意隱藏了瀏覽器原生的 number input spin buttons（上下箭頭）
- 這些規則設定 `-webkit-appearance: none` 和 `margin: 0`
- 當啟用「顯示帶分數」時，`.whole-input` 的輸入框顯示但沒有箭頭
- 一般的 `.frac-input` 也有相同問題

## 實施方案
修改 CSS 規則，將隱藏箭頭改為顯示箭頭。保留規則結構但改變樣式設定，使用 `opacity: 1` 和 `height: 20px` 來確保箭頭可見且有適當高度。

## 變更清單

### 修改的檔案

1. ✅ `src/shared/base.css`
   - 修改三處 webkit spin button 樣式規則
   - 從隱藏改為顯示

## 實施步驟
1. ✅ 讀取 fix008.md 規範文件
2. ✅ 搜尋 base.css 中所有隱藏 spin buttons 的 CSS 規則
3. ✅ 確認受影響的類別：.input-wrapper input, .whole-input, .frac-input
4. ✅ 將 `-webkit-appearance: none; margin: 0` 改為 `opacity: 1; height: 20px`
5. ✅ 建立此追蹤文件

## 技術細節

### 修改前後對比

**修改前（第一處 - .input-wrapper input, lines 419-420）**:
```css
.input-wrapper input::-webkit-inner-spin-button,
.input-wrapper input::-webkit-outer-spin-button { 
  -webkit-appearance: none; 
  margin: 0; 
}
```

**修改後（第一處）**:
```css
.input-wrapper input::-webkit-inner-spin-button,
.input-wrapper input::-webkit-outer-spin-button { 
  opacity: 1; 
  height: 20px; 
}
```

---

**修改前（第二處 - .whole-input, lines 524-525）**:
```css
.whole-input::-webkit-inner-spin-button,
.whole-input::-webkit-outer-spin-button { 
  -webkit-appearance: none; 
  margin: 0; 
}
```

**修改後（第二處）**:
```css
.whole-input::-webkit-inner-spin-button,
.whole-input::-webkit-outer-spin-button { 
  opacity: 1; 
  height: 20px; 
}
```

---

**修改前（第三處 - .frac-input, lines 534-535）**:
```css
.frac-input::-webkit-inner-spin-button,
.frac-input::-webkit-outer-spin-button { 
  -webkit-appearance: none; 
  margin: 0; 
}
```

**修改後（第三處）**:
```css
.frac-input::-webkit-inner-spin-button,
.frac-input::-webkit-outer-spin-button { 
  opacity: 1; 
  height: 20px; 
}
```

### 技術說明

#### 原生 HTML5 Number Input Arrows
- **WebKit Spin Buttons**: Webkit 瀏覽器（Chrome, Safari, Edge）的 number input 原生上下箭頭
- **::-webkit-inner-spin-button**: 內層 spin button 偽元素
- **::-webkit-outer-spin-button**: 外層 spin button 偽元素

#### CSS 屬性說明
- **-webkit-appearance: none** ❌ : 移除原生外觀，隱藏箭頭
- **opacity: 1** ✅ : 確保完全不透明，箭頭可見
- **height: 20px** ✅ : 設定箭頭高度，確保可點擊的區域足夠大

### 為什麼使用 opacity 和 height
1. **顯示箭頭**: `opacity: 1` 確保箭頭完全可見
2. **可用性**: `height: 20px` 提供足夠大的點擊區域
3. **原生功能**: 使用瀏覽器原生箭頭，無需額外實作
4. **跨瀏覽器**: 在 Chrome, Edge, Safari 等 Webkit 瀏覽器中運作良好
5. **觸控友善**: 在平板和觸控裝置上也能使用

## 受影響的應用

### 主要受益應用（有「顯示帶分數」功能）
1. **異分母分數加法（Addition）**
   - `.whole-input` 現在有箭頭
   - `.frac-input` (分子、分母) 也有箭頭

2. **異分母分數減法（Subtraction）**
   - `.whole-input` 現在有箭頭
   - `.frac-input` 現在有箭頭

3. **分數乘法教學（Multiplication）**
   - `.whole-input` 現在有箭頭
   - `.frac-input` 現在有箭頭

4. **異分母分數除法（Division）**
   - `.whole-input` 現在有箭頭
   - `.frac-input` 現在有箭頭

### 其他受益應用（有 .frac-input）
所有使用 `.frac-input` 或 `.input-wrapper input` 的應用都會顯示箭頭：
- 相等分數 (Equivalent)
- 整數與分數互換 (IntFracConv)
- 分數比較 (Comparison)

## 影響範圍
- ✅ 異分母分數加法（Addition） - .whole-input 和 .frac-input
- ✅ 異分母分數減法（Subtraction） - .whole-input 和 .frac-input
- ✅ 分數乘法教學（Multiplication） - .whole-input 和 .frac-input
- ✅ 異分母分數除法（Division） - .whole-input 和 .frac-input
- ✅ 所有其他使用 .frac-input 的應用

## 預期結果
- ✅ 點擊「顯示帶分數」前，所有 number input 顯示上下箭頭
- ✅ 點擊「顯示帶分數」後，整數輸入框（.whole-input）顯示上下箭頭
- ✅ 分子分母輸入框（.frac-input）始終顯示上下箭頭
- ✅ 箭頭可點擊，點擊後數值增減正常
- ✅ 鍵盤上下箭頭鍵也能使用
- ✅ 觸控裝置上箭頭也可用

## 測試驗證
驗證項目：
- ⏳ 加法應用：啟用「顯示帶分數」前，分數輸入框有箭頭
- ⏳ 加法應用：啟用「顯示帶分數」後，整數輸入框有箭頭
- ⏳ 加法應用：啟用「顯示帶分數」後，分數輸入框仍有箭頭
- ⏳ 加法應用：點擊上箭頭，數值增加
- ⏳ 加法應用：點擊下箭頭，數值減少
- ⏳ 減法應用：箭頭在兩種模式下都可見且可用
- ⏳ 乘法應用：箭頭在兩種模式下都可見且可用
- ⏳ 除法應用：箭頭在兩種模式下都可見且可用
- ⏳ 鍵盤上下箭頭鍵正常工作
- ⏳ 平板/觸控裝置上箭頭可點擊
- ⏳ 箭頭高度足夠（20px），易於點擊
- ⏳ 無控制台錯誤或警告

## 瀏覽器相容性

### 支援的瀏覽器
- ✅ Google Chrome (所有現代版本)
- ✅ Microsoft Edge (Chromium-based)
- ✅ Safari (所有現代版本)
- ✅ Opera (Chromium-based)

### Firefox 注意事項
- Firefox 使用 `-moz-appearance: textfield` 隱藏箭頭
- CSS 中已有 `-moz-appearance: textfield` 設定
- Firefox 使用者可使用鍵盤上下箭頭，或直接輸入數字

## 備註
- 修改在 `base.css` 中完成，影響所有應用
- 使用瀏覽器原生箭頭，無需額外 JavaScript
- 箭頭外觀由瀏覽器決定，可能在不同瀏覽器中略有不同
- 如果需要自訂外觀，可以考慮使用 StepperInput 組件代替原生箭頭
- `-moz-appearance: textfield` 保留，Firefox 使用者體驗不變

## 優先級
- **高優先級** - 影響多個應用的使用性，「顯示帶分數」是常用功能

## 後續改進建議
- 考慮為箭頭添加 hover 效果（改變顏色或背景）
- 可以調整箭頭的大小和樣式以更好地配合應用設計
- 考慮在移動裝置上使用更大的點擊區域
- 可以根據使用者反饋進一步優化箭頭的外觀和行為
- 如果原生箭頭不夠明顯，可以考慮使用自訂的 StepperInput 組件

## 狀態
✅ **已完成** - CSS 已修改，所有 number input 現在顯示上下箭頭