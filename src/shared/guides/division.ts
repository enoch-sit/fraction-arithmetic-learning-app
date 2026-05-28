import type { PageGuideContent } from './shared'

export const divisionGuideContent: PageGuideContent = {
  startupHiddenMessages: ['💡 準備中...', '💡 點擊上方分數，顯示長條圖！'],
  startupTooltip: {
    id: 'division-start',
    element: '#frac1-group',
    title: '先試試看',
    description: '點一下上方分數，先顯示長條圖，再開始看除法。',
    side: 'bottom',
    delayMs: 450,
  },
  tourSteps: [
    {
      id: 'dividend',
      element: '#frac1-group',
      side: 'bottom',
      title: '📝 被除數',
      description:
        '在這裡輸入第一個分數（被除數）。<br>按 ▲▼ 調整分子和分母，或直接輸入數字。<br>點擊方塊可以重設並顯示圖形。',
    },
    {
      id: 'divisor',
      element: '#frac2-group',
      side: 'bottom',
      title: '📝 除數',
      description: '在這裡輸入除數。<br>分數除法等同於乘以除數的倒數：a/b ÷ c/d = a/b × d/c。',
    },
    {
      id: 'animation-zone',
      element: '#anim-zone',
      side: 'top',
      title: '🎬 動畫區',
      description: '動畫會顯示被除數的格子，再用「模具」標示除數的大小，幫助你看到除數能放入幾次。',
    },
    {
      id: 'controls',
      element: '.controls-pill',
      side: 'bottom',
      title: '⚙️ 設定',
      description: '調整動畫速度，勾選「顯示帶分數」可以輸入整數部分，勾選「顯示數線」顯示數線輔助。',
    },
    {
      id: 'answer-zone',
      element: '#bottom-answer-zone',
      side: 'top',
      title: '✏️ 填寫答案',
      description: '在這裡輸入除法的商。<br>記得化簡到最簡分數！',
    },
  ],
}