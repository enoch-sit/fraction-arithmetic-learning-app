# Track Fix 004 - 在整數與分數互換的長條圖中添加 1/3 高度的水平線

## 問題描述
- **問題**: 「整數與分數互換」應用的長條圖缺少在約 1/3 高度處的水平參考線
- **影響**: 缺少視覺參考，不利於用戶理解分數部分

## 設計參考
- 參考圖片: images/image_5.png (在 fix004.md 中提及)
- 水平線應位於長條圖高度的 1/3 處

## 實施日期
- **日期**: 2026-06-04
- **開發伺服器端口**: localhost:5173

## 根本原因
- InteractiveBars 組件原本只有一條中心線（50% 高度）
- 沒有提供 1/3 高度的視覺參考線

## 實施方案
在 InteractiveBars 組件的每個長條圖中添加一條水平參考線，位於 33.333% （1/3）高度處。

## 變更清單

### 修改的檔案

1. ✅ `src/shared/components/InteractiveBars.tsx`
   - 在 `unit-bar` 容器內添加新的 `.third-line` 元素
   - 定位在 `top: 33.333%` 處
   - 使用半透明顏色 `rgba(0, 0, 0, 0.3)` 確保不會過於突兀
   - 高度為 `2px`，與現有的中心線一致
   - 設置 `z-index: 1`，確保在單元格下方但在背景上方
   - 設置 `pointer-events: none`，不干擾用戶點擊交互

## 實施步驟
1. ✅ 讀取 fix004.md 規範文件
2. ✅ 檢查 intfracconv/App.tsx 確認使用 InteractiveBars 組件
3. ✅ 讀取 InteractiveBars.tsx 組件源碼
4. ✅ 在組件中添加 1/3 高度的水平線元素
5. ✅ 建立此追蹤文件

## 技術細節

### 添加的程式碼
```tsx
{/* Third line at 1/3 height */}
<div
  className="third-line"
  style={{
    position: 'absolute',
    top: '33.333%',
    left: 0,
    right: 0,
    height: '2px',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    transform: 'translateY(-50%)',
    zIndex: 1,
    pointerEvents: 'none'
  }}
/>
```

### 樣式特點
- **位置**: `position: absolute` + `top: 33.333%` 確保準確定位在 1/3 高度
- **顏色**: `rgba(0, 0, 0, 0.3)` 半透明黑色，微妙但可見
- **粗細**: `height: 2px` 與現有中心線保持一致
- **對齊**: `transform: translateY(-50%)` 確保線條中心對齊到 1/3 位置
- **層級**: `z-index: 1` 在填充單元格下方，但在背景上方
- **交互**: `pointer-events: none` 不影響用戶點擊操作

### 與現有中心線的協調
- 中心線 (50% 高度): `backgroundColor: rgba(51, 51, 51, ${f})`，動態透明度
- 三分之一線 (33.333% 高度): `backgroundColor: rgba(0, 0, 0, 0.3)`，固定透明度
- 兩條線的風格和厚度保持一致，形成協調的視覺參考系統

## 影響範圍
- ✅ 整數與分數互換（intfracconv）- 主要受益應用
- ⚪ 其他使用 InteractiveBars 組件的應用（如果有）也會自動獲得此改進

## 預期結果
- ✅ 長條圖中顯示 1/3 高度的水平參考線
- ✅ 參考線不干擾用戶交互
- ✅ 幫助用戶更好地理解分數部分的視覺化
- ✅ 與現有的中心線形成完整的參考系統

## 測試驗證
- ⏳ Playwright 自動化測試（由於截圖問題暫未完成）
- ⏳ 視覺驗證：確認線條位於正確的 1/3 高度
- ⏳ 交互驗證：確認線條不影響單元格點擊功能
- ⏳ 響應式驗證：確認在不同屏幕尺寸下線條位置正確

## 備註
- InteractiveBars 是共享組件，位於 `src/shared/components/`
- 此修改不影響組件的其他功能和現有的動畫效果
- 線條樣式可以根據用戶反饋進一步調整（如改為虛線、調整顏色等）
- 線條在所有模式下（完整長條圖模式和分數模式）都會顯示

## 狀態
✅ **已完成** - 水平參考線已添加到 InteractiveBars 組件