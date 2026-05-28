/**
 * Adaptive Instruction State Tracker
 * Tracks user progress through the addition process and provides contextual guidance
 */

export type InstructionState =
  | 'initial'
  | 'bar1_shown'
  | 'bar2_shown'
  | 'common_denom_ready'
  | 'common_denom_not_ready'
  | 'dragging_blocks'
  | 'error_merge_shown'
  | 'all_merged'
  | 'complete'

interface StateMessage {
  message: string
  guidance?: string
  canDrag: boolean
}
export interface TooltipConfig {
  title: string
  description: string
  element: string
  side: 'top' | 'bottom' | 'left' | 'right'
  align: 'start' | 'center' | 'end'
  delayMs: number
  autoCloseMs: number
}
type StateTransitionMap = Record<InstructionState, StateMessage>

export const instructionStateMessages: StateTransitionMap = {
  initial: {
    message: '💡 點擊上方分數，顯示圖形！',
    guidance: '先按一下第一個分數輸入框，你就會看到圖形出現。',
    canDrag: false,
  },
  bar1_shown: {
    message: '💡 再點擊下方分數！',
    guidance: '現在請點擊第二個分數（藍色框），這樣我們就可以比較兩個分數了。',
    canDrag: false,
  },
  bar2_shown: {
    message: '💡 準備中...',
    canDrag: false,
  },
  common_denom_ready: {
    message: '💡 分母相同了！現在請將上方的色塊「拖拉」或「點擊」到合併結果區。',
    guidance: '這些色塊代表分數的部分。把紅色和藍色的色塊都拖到下面的「合併結果」區域。',
    canDrag: true,
  },
  common_denom_not_ready: {
    message: '💡 分母不同！試著點擊「擴分/約分」讓兩個分母相同，或者先把這些色塊試著拖拉在一起看看會怎樣。',
    guidance: '分母相同很重要，因為這樣我們才能用相同的「格線單位」來計算。',
    canDrag: true, // Allow for error merge demonstration
  },
  dragging_blocks: {
    message: '🎯 很好！繼續拖拉色塊...',
    guidance: '把所有的色塊都拖到合併結果區域。每個色塊代表一小份。',
    canDrag: true,
  },
  error_merge_shown: {
    message: '💡 發現了嗎？因為「分母」不相同，無法用相同的格線算出來。\n請試著點擊上方的「擴分/約分」尋找公共的分母！',
    guidance: '當分母不同時，我們需要先調整它們，使它們擁有相同的分母單位。',
    canDrag: true,
  },
  all_merged: {
    message: '💡 太棒了！全部合併完成，請填寫下方最終答案！',
    guidance: '把你看到的合併結果填入下方的答案框，系統會告訴你對不對。',
    canDrag: false,
  },
  complete: {
    message: '🎉 完成！',
    canDrag: false,
  },
}

const tooltipConfigs: Record<InstructionState, TooltipConfig | null> = {
  initial: null,
  bar1_shown: null,
  bar2_shown: null,
  common_denom_ready: null,
  common_denom_not_ready: null,
  dragging_blocks: null,
  error_merge_shown: null,
  all_merged: {
    title: '💡 最後一步',
    description: '太棒了！全部合併完成。<br>現在請把結果填入下方的答案框。',
    element: '#bottom-answer-zone',
    side: 'top',
    align: 'center',
    delayMs: 100,
    autoCloseMs: 3200,
  },
  complete: null,
}

export class InstructionStateTracker {
  private currentState: InstructionState = 'initial'
  private stateChangeCallback?: (state: InstructionState) => void

  setState(newState: InstructionState): void {
    if (this.currentState !== newState) {
      this.currentState = newState
      if (this.stateChangeCallback) {
        this.stateChangeCallback(newState)
      }
    }
  }

  getState(): InstructionState {
    return this.currentState
  }

  getMessage(): string {
    return instructionStateMessages[this.currentState].message
  }

  getGuidance(): string | undefined {
    return instructionStateMessages[this.currentState].guidance
  }

  canDrag(): boolean {
    return instructionStateMessages[this.currentState].canDrag
  }
  getTooltipConfig(): TooltipConfig | null {
    return tooltipConfigs[this.currentState]
  }
  onStateChange(callback: (state: InstructionState) => void): () => void {
    this.stateChangeCallback = callback
    return () => {
      this.stateChangeCallback = undefined
    }
  }

  reset(): void {
    this.currentState = 'initial'
  }
}

// Singleton instance
export const createInstructionTracker = (): InstructionStateTracker => {
  return new InstructionStateTracker()
}
