import type { PageGuideContent } from './shared'

export const multiplicationGuideContent: PageGuideContent = {
  startupHiddenMessages: ['💡 準備中...請先點擊上方的「被乘數」'],
  startupTooltip: {
    id: 'multiplication-start',
    element: '#frac1-group',
    title: '先從左邊開始',
    description: '先點一下左邊的被乘數，再看乘法圖形怎麼出現。',
    side: 'bottom',
    delayMs: 450,
  },
  tourSteps: [
    {
      id: 'multiplicand',
      element: '#frac1-group',
      side: 'bottom',
      title: '📝 被乘數',
      description:
        '在這裡輸入第一個分數（被乘數）。<br>按 ▲▼ 調整分子和分母，或直接輸入（最大值為 10）。<br>點擊方塊可以重設並顯示圖形。',
    },
    {
      id: 'multiplier',
      element: '#frac2-group',
      side: 'bottom',
      title: '📝 乘數',
      description: '在這裡輸入第二個分數（乘數）。<br>分數乘法：分子乘以分子，分母乘以分母。',
    },
    {
      id: 'animation-zone',
      element: '#anim-zone',
      side: 'top',
      title: '🎬 動畫區',
      description: '動畫會先在矩形中顯示被乘數，再用另一個方向的分割展示乘數，交叉的格子就是乘積。',
    },
    {
      id: 'controls',
      element: '.controls-pill',
      side: 'bottom',
      title: '⚙️ 設定',
      description: '調整動畫播放速度，讓演示更快或更慢。<br>勾選「顯示帶分數」可以輸入整數部分。',
    },
    {
      id: 'answer-zone',
      element: '#bottom-answer-zone',
      side: 'bottom',
      title: '✏️ 填寫答案',
      description: '在這裡輸入你算出來的乘積。<br>記得化簡！系統會告訴你是否正確。',
    },
  ],
}