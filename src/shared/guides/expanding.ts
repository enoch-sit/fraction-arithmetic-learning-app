import type { PageGuideContent } from './shared'

export const expandingGuideContent: PageGuideContent = {
  startupTooltip: {
    id: 'expanding-start',
    element: '.fraction-box',
    title: '先看這裡',
    description: '先點一下原始分數。左邊長條保留原來的分數，右邊長條顯示擴分或約分後的結果，方便直接比較。',
    side: 'bottom',
    delayMs: 450,
  },
  tourSteps: [
    {
      id: 'mode-toggle',
      element: '#btn_merge',
      side: 'bottom',
      title: '🔀 操作模式',
      description: '「約分」：把分數化簡到最簡分數。<br>「擴分」：把分數乘以一個因數讓分母變大。<br>點擊按鈕切換模式。',
    },
    {
      id: 'source-fraction',
      element: '.fraction-box',
      side: 'right',
      title: '📝 原始分數',
      description: '在這裡輸入你要約分或擴分的分數。<br>按 +/- 按鈕或直接輸入數字。',
    },
    {
      id: 'factor-numerator',
      element: '#wrap_fn',
      side: 'bottom',
      title: '🔢 因數（分子）',
      description: '輸入你想要乘以（或除以）的因數，用來改變分子。<br>擴分時選大於 1 的數，約分時系統會自動計算。',
    },
    {
      id: 'factor-denominator',
      element: '#wrap_fd',
      side: 'top',
      title: '🔢 因數（分母）',
      description: '分母的因數。<br>在「模式1」（同步模式）時，分子和分母的因數會保持一致，確保等值分數。',
    },
    {
      id: 'sync-mode',
      element: '#btn_toggle_sync',
      side: 'bottom',
      title: '🔗 同步模式',
      description: '開啟「模式1」時，分子和分母的因數會自動同步，讓分數保持等值。<br>關閉時可以分別調整，用來練習找出是否為等值分數。',
    },
    {
      id: 'visual-stack',
      element: '.visual-stack',
      side: 'top',
      title: '📊 視覺化長條圖',
      description: '這裡用兩個長條做比較：左邊保留原分數，右邊顯示運算後的結果。<br>像 2/3 這種例子，如果只有一個長條，你只能看到它變了，卻看不到變化前後其實代表同一個量。<br>兩個長條等長時，就表示兩個分數相等。',
    },
  ],
}