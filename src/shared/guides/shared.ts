export const SHARED_GUIDE_CONTROLS = {
  buttonLabel: '?',
  buttonTitle: '使用教學',
  buttonAriaLabel: 'guided tour',
  navigation: {
    next: '下一步 →',
    previous: '← 上一步',
    done: '完成 ✓',
  },
  progressTemplate: '{{current}} / {{total}}',
} as const

export type GuideStepSide = 'top' | 'bottom' | 'left' | 'right'
export type StartupTooltipDisplayMode = 'popover' | 'cover'

export interface GuideStepContent {
  id: string
  element: string
  side: GuideStepSide
  title: string
  description: string
}

export interface StartupTooltipContent {
  id: string
  element: string
  title: string
  description: string
  side?: GuideStepSide
  displayMode?: StartupTooltipDisplayMode
  delayMs?: number
}

export interface PageGuideContent {
  startupHiddenMessages?: string[]
  startupTooltip?: StartupTooltipContent
  tourSteps: GuideStepContent[]
}