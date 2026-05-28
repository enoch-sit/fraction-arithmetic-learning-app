import type { PageGuideContent } from './shared'

export const additionGuideContent: PageGuideContent = {
  startupHiddenMessages: ['💡 準備中...', '💡 點擊上方分數，顯示圖形！'],
  startupTooltip: {
    id: 'addition-start',
    element: '#frac1-group',
    title: '先試試看',
    description: '點一下上方分數，先看看圖形怎麼變化。',
    side: 'bottom',
    delayMs: 450,
  },
  tourSteps: [
    {
      id: 'addend-1',
      element: '#frac1-group',
      side: 'bottom',
      title: '📝 被加數',
      description:
        '在這裡輸入第一個分數。<br>按 ▲▼ 調整分子和分母，或直接在格子裡輸入數字。<br>點擊整個方塊可以重設並顯示圖形。',
    },
    {
      id: 'addend-2',
      element: '#frac2-group',
      side: 'bottom',
      title: '📝 加數',
      description:
        '在這裡輸入第二個分數（加數）。<br>同樣可以用 ▲▼ 按鈕或直接輸入數字。',
    },
    {
      id: 'animation-zone',
      element: '#anim-zone',
      side: 'top',
      title: '🎬 動畫區',
      description:
        '動畫會逐步展示分數格子，並把兩個分數合併到共同分數單位，幫助你理解加法的視覺意義。',
    },
    {
      id: 'controls',
      element: '.controls-pill',
      side: 'bottom',
      title: '⚙️ 設定',
      description:
        '用滑桿調整動畫速度。<br>勾選「顯示帶分數」可以加入整數位，勾選「顯示數線」可以顯示數線。',
    },
    {
      id: 'answer-zone',
      element: '#bottom-answer-zone',
      side: 'top',
      title: '✏️ 填寫答案',
      description: '在這裡填寫你計算的結果。<br>系統會自動判斷對錯！',
    },
  ],
}