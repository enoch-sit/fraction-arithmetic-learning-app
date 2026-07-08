import { driver } from 'driver.js'
import type { DriveStep } from 'driver.js'
import clickHand from '../../assets/guide/click-hand.svg'
import type { StartupTooltipDisplayMode } from '../guides/shared'

type LightGuideHintOptions = {
  id: string
  element: string
  title?: string
  description: string
  side?: NonNullable<DriveStep['popover']>['side']
  align?: NonNullable<DriveStep['popover']>['align']
  displayMode?: StartupTooltipDisplayMode
  delayMs?: number
  autoCloseMs?: number
}

export function showLightGuideHint({
  element,
  title = '小提示',
  description,
  side = 'bottom',
  align = 'center',
  displayMode = 'popover',
  delayMs = 450,
  autoCloseMs = 3200,
}: LightGuideHintOptions) {
  if (typeof window === 'undefined') return () => {}

  let autoCloseTimerId: number | null = null
  let pointerDismissTimerId: number | null = null
  let removePointerListener: (() => void) | null = null
  let removeViewportListeners: (() => void) | null = null
  let coverElement: HTMLDivElement | null = null
  let hintDriver: ReturnType<typeof driver> | null = null
  let isDestroyed = false

  const timerId = window.setTimeout(() => {
    if (!document.querySelector(element)) return

    const destroyHint = () => {
      if (isDestroyed) return
      isDestroyed = true

      if (autoCloseTimerId !== null) {
        window.clearTimeout(autoCloseTimerId)
        autoCloseTimerId = null
      }

      if (pointerDismissTimerId !== null) {
        window.clearTimeout(pointerDismissTimerId)
        pointerDismissTimerId = null
      }

      if (removePointerListener) {
        removePointerListener()
        removePointerListener = null
      }

      if (removeViewportListeners) {
        removeViewportListeners()
        removeViewportListeners = null
      }

      if (coverElement) {
        coverElement.remove()
        coverElement = null
      }

      hintDriver?.destroy()
    }

    if (displayMode === 'cover') {
      const target = document.querySelector<HTMLElement>(element)
      if (!target) return

      coverElement = document.createElement('div')
      coverElement.className = 'light-guide-cover'
      coverElement.setAttribute('aria-hidden', 'true')
      coverElement.innerHTML = `
        <div class="light-guide-cover-card">
          <div class="light-guide-cover-title">${title}</div>
          <div class="light-guide-hint-body">
            <div class="light-guide-hint-visual" aria-hidden="true">
              <img class="light-guide-hint-hand" src="${clickHand}" alt="" />
              <span class="light-guide-hint-ring light-guide-hint-ring-a"></span>
              <span class="light-guide-hint-ring light-guide-hint-ring-b"></span>
            </div>
            <div class="light-guide-cover-copy">${description}</div>
          </div>
        </div>
      `
      document.body.appendChild(coverElement)

      const updateCoverPosition = () => {
        if (!coverElement) return
        const rect = target.getBoundingClientRect()
        coverElement.style.left = `${rect.left + rect.width / 2}px`
        coverElement.style.top = `${rect.top + rect.height / 2}px`
      }

      updateCoverPosition()
      window.addEventListener('resize', updateCoverPosition)
      window.addEventListener('scroll', updateCoverPosition, true)
      removeViewportListeners = () => {
        window.removeEventListener('resize', updateCoverPosition)
        window.removeEventListener('scroll', updateCoverPosition, true)
      }

      const handlePointerDown = () => {
        destroyHint()
      }

      pointerDismissTimerId = window.setTimeout(() => {
        document.addEventListener('pointerdown', handlePointerDown, true)
        removePointerListener = () => {
          document.removeEventListener('pointerdown', handlePointerDown, true)
        }
      }, 180)

      autoCloseTimerId = window.setTimeout(() => {
        destroyHint()
      }, autoCloseMs)

      return destroyHint
    }

    const descriptionHtml = `
      <div class="light-guide-hint-body">
        <div class="light-guide-hint-visual" aria-hidden="true">
          <img class="light-guide-hint-hand" src="${clickHand}" alt="" />
          <span class="light-guide-hint-ring light-guide-hint-ring-a"></span>
          <span class="light-guide-hint-ring light-guide-hint-ring-b"></span>
        </div>
        <div class="light-guide-hint-copy">${description}</div>
      </div>
    `

    hintDriver = driver({
      allowClose: true,
      overlayOpacity: 0,
      overlayClickBehavior: 'close',
      showProgress: false,
      showButtons: ['close'],
      popoverClass: 'math-tour-popover math-tour-popover-light',
      steps: [
        {
          element,
          popover: {
            title,
            description: descriptionHtml,
            side,
            align,
          },
        },
      ],
    })

    hintDriver.drive()

    const handlePointerDown = () => {
      destroyHint()
    }

    pointerDismissTimerId = window.setTimeout(() => {
      document.addEventListener('pointerdown', handlePointerDown, true)
      removePointerListener = () => {
        document.removeEventListener('pointerdown', handlePointerDown, true)
      }
    }, 180)

    autoCloseTimerId = window.setTimeout(() => {
      destroyHint()
    }, autoCloseMs)
  }, delayMs)

  return () => {
    window.clearTimeout(timerId)

    if (autoCloseTimerId !== null) {
      window.clearTimeout(autoCloseTimerId)
    }

    if (pointerDismissTimerId !== null) {
      window.clearTimeout(pointerDismissTimerId)
    }

    if (removePointerListener) {
      removePointerListener()
    }

    if (removeViewportListeners) {
      removeViewportListeners()
    }

    if (coverElement) {
      coverElement.remove()
    }
  }
}