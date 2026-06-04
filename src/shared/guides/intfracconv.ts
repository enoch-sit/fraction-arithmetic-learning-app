import type { PageGuideContent } from './shared'

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
    {
      id: 'input-area',
      element: '.fraction-ui',
      side: 'bottom',
      title: '📝 輸入數值',
      description:
        '在這裡輸入整數和分數。<br>可以使用上下按鈕調整數值，或直接在格子裡輸入數字。<br>數值會自動更新顯示！',
    },
    {
      id: 'interactive-bars',
      element: '.bar-wrapper',
      side: 'top',
      title: '🎨 互動長條圖',
      description:
        '這是視覺化的分數顯示。<br>你可以直接點擊長條圖的格子來設定數值。<br>紅色部分表示已填滿的分數。',
    },
    {
      id: 'third-line',
      element: '.third-line',
      side: 'right',
      title: '📏 參考線',
      description:
        '這條橫線標示 1/3 的位置，幫助你快速比較分數與 1/3 的大小關係。',
    },
    {
      id: 'conversion-panel',
      element: '.conversion-panel',
      side: 'left',
      title: '🔄 數值轉換',
      description:
        '這裡顯示分數與帶分數的轉換結果。<br>可以看到分數轉為帶分數，以及轉為假分數的結果。',
    },
    {
      id: 'settings',
      element: '.settings',
      side: 'top',
      title: '⚙️ 調整顯示',
      description:
        '用滑桿調整長條圖的高度和寬度，找到最適合你的觀看方式。',
    },
    {
      id: 'mode-hint',
      element: '.mode-hint',
      side: 'top',
      title: '🔀 切換模式',
      description:
        '右鍵點擊輸入區域（或在平板上長按），可以切換整數、分數、帶分數模式。',
    },
  ],
}
