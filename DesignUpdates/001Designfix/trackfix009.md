# Track Fix 009 - 加法應用中的不正確長條圖有重疊問題

## 問題描述
- **問題**: 在「異分母分數加法」應用中，不正確的長條圖（incorrect bar）存在重疊問題
- **影響**: 長條圖之間或長條圖與數線重疊，難以清楚看到各個視覺元素
- **使用性**: 當使用者拖曳區塊到錯誤位置時，視覺回饋不清晰

## 實施日期
- **日期**: 2026-06-04
- **開發伺服器端口**: localhost:5173

## 根本原因分析

### 問題定位
1. **重疊元素**: 長條圖容器（`.bar-wrap-container`）與數線容器（`.nl-wrap-container`）之間的間距不足
2. **CSS 間距**: `.nl-wrap-container` 的 `margin-top` 僅為 2px，當長條圖以堆疊模式（stacked-result-wrap）顯示時，多個 bar-unit 垂直堆疊，數線容器會與最後一個 bar-unit 重疊
3. **不一致性**: `.bar-wrap-container.stacked-result-wrap` 使用 `gap: 12px`，但數線容器的 `margin-top` 只有 2px，造成視覺不一致

### 根本原因
- `.nl-wrap-container` 的 `margin-top: 2px` 間距太小
- 當 bar3 (結果長條圖) 在錯誤模式下顯示多個 bar-unit 時（堆疊布局），數線容器緊貼在長條圖下方，造成視覺重疊
- 長條圖高度為 50px，堆疊時使用 12px 間距，但數線只有 2px 上邊距，不夠明確分隔兩個元素

## 實施方案
增加 `.nl-wrap-container` 的 `margin-top` 從 2px 到 12px，與堆疊布局的 gap 保持一致，提供足夠的視覺分隔。

## 變更清單

### 修改的檔案

1. ✅ `src/apps/addition/app.css`
   - 修改 `.nl-wrap-container` 的 `margin-top` 屬性
   - 從 2px 增加到 12px

## 實施步驟
1. ✅ 讀取 fix009.md 規範文件
2. ✅ 分析長條圖和數線容器的 CSS 布局
3. ✅ 確認堆疊布局使用 12px 間距
4. ✅ 識別數線容器的 margin-top 太小 (2px)
5. ✅ 將 margin-top 增加到 12px
6. ✅ 建立此追蹤文件

## 技術細節

### 修改前後對比

**修改前（`.nl-wrap-container`, line 68）**:
```css
.nl-wrap-container { 
  display: flex; 
  flex-wrap: wrap; 
  justify-content: flex-start; 
  align-items: flex-start; 
  min-height: 45px; 
  margin-top: 2px; 
  border: none; 
  position: relative; 
  gap: 15px; 
}
```

**修改後**:
```css
.nl-wrap-container { 
  display: flex; 
  flex-wrap: wrap; 
  justify-content: flex-start; 
  align-items: flex-start; 
  min-height: 45px; 
  margin-top: 12px; 
  border: none; 
  position: relative; 
  gap: 15px; 
}
```

### 技術說明

#### 長條圖布局結構
1. **`.bar-wrap-container`**: 包含 bar-unit 元素的容器
   - 正常模式：水平排列，gap: 15px
   - 堆疊模式（.stacked-result-wrap）：垂直排列，gap: 12px

2. **`.bar-unit`**: 單個長條圖單元
   - height: 50px
   - 在堆疊模式下垂直排列，單元之間有 12px 間距

3. **`.nl-wrap-container`**: 數線容器，顯示在長條圖下方
   - height: 45px (min-height)
   - 原本 margin-top: 2px，現在改為 12px

#### 為什麼使用 12px
1. **一致性**: 與 `.stacked-result-wrap` 的 gap (12px) 保持一致
2. **視覺清晰**: 提供足夠間距，防止長條圖與數線視覺重疊
3. **可讀性**: 使用者更容易區分長條圖和數線兩個不同的視覺元素
4. **設計平衡**: 12px 提供舒適的視覺呼吸空間，不會太緊密也不會太分散

### 受影響的場景

#### Bar3 錯誤模式（Wrong Mode）
- **什麼時候觸發**: 使用者拖曳區塊到 bar3 (結果長條圖區域) 但未達到正確答案
- **顯示內容**: 
  - bar3-wrap: 顯示使用者拖曳的區塊，形成不完整或錯誤的長條圖
  - bar3-nl: 顯示數線，標示正確答案的位置（紅色和藍色標記）
- **堆疊布局**: 當結果長條圖需要超過 1 個整數單位時，bar-units 垂直堆疊
- **修正效果**: 數線現在與最後一個 bar-unit 之間有 12px 間距，不再重疊

#### 顯示數線（Show Number Line）
- **功能**: 使用者勾選「顯示數線」核取方塊
- **顯示**: 在長條圖下方顯示數線，標示重要數值
- **修正效果**: 數線與長條圖之間有清晰的間距

## 受影響的應用
- ✅ **異分母分數加法（Addition）** - 主要受益應用
  - bar3-wrap 和 bar3-nl 之間間距增加
  - 錯誤模式下的視覺更清晰

## 影響範圍
- ✅ Addition app: bar3 (結果長條圖) 區域
- ✅ 錯誤模式下的長條圖與數線顯示
- ✅ 堆疊布局（多個整數單位）
- ✅ 「顯示數線」功能啟用時

## 預期結果
- ✅ 長條圖與數線之間有 12px 明確間距
- ✅ 堆疊布局時，最後一個 bar-unit 與數線不重疊
- ✅ 視覺元素清晰可辨，易於理解
- ✅ 間距與其他元素保持一致
- ✅ 錯誤模式下的視覺回饋更清楚

## 測試驗證
驗證項目：
- ⏳ 加法應用：拖曳區塊到 bar3，觸發錯誤模式
- ⏳ 加法應用：啟用「顯示數線」，檢查間距
- ⏳ 加法應用：結果需要多個整數單位（堆疊布局）
- ⏳ 加法應用：長條圖與數線之間有 12px 間距
- ⏳ 加法應用：數線標記清晰可見，不與長條圖重疊
- ⏳ 加法應用：不同分數組合（1/2 + 1/3, 2/5 + 3/4 等）
- ⏳ 加法應用：移動裝置上的顯示效果
- ⏳ 加法應用：不同瀏覽器的顯示一致性
- ⏳ 無控制台錯誤或警告

## 設計考量

### 視覺層次
1. **長條圖層**: 顯示使用者拖曳的區塊和填充進度
2. **間距層**: 12px 的空白空間，提供視覺分隔
3. **數線層**: 顯示數值標記和正確答案位置

### 間距標準
- bar-units 之間: 12px (stacked mode)
- bar-wrap 與 nl-wrap 之間: 12px (現在一致)
- 水平 bar-units 之間: 15px (normal mode)

## 備註
- 修改僅影響 Addition app 的 app.css
- 不影響其他應用（Subtraction, Multiplication, Division）
- 這些應用可能也有類似的數線容器，但 fix009 spec 只提到 Addition
- 如果其他應用也出現相同問題，可以應用相同的修復方法
- 間距增加不會影響功能，只改善視覺呈現

## 優先級
- **高優先級** - 影響視覺清晰度和使用者理解

## 後續改進建議
- 檢查其他應用（Subtraction, Multiplication, Division）是否有相同的重疊問題
- 考慮在 `base.css` 中統一定義數線容器的標準間距
- 可以考慮為錯誤模式添加更明顯的視覺回饋（例如紅色邊框或背景）
- 根據使用者測試反饋，可能需要調整間距大小

## 相關問題
- Fix 010: 可能與 "incorrect bar disappearing" 相關
- 兩者都涉及 bar3 錯誤模式的視覺呈現

## 狀態
✅ **已完成** - CSS 已修改，數線容器 margin-top 增加到 12px