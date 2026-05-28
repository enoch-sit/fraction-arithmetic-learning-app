import { useEffect } from 'react'
import './app.css'
import AppHeader from '../../shared/components/AppHeader'
import FracInputStepper from '../../shared/components/FracInputStepper'
import LangBtn from '../../shared/components/LangBtn'
import ControlsPill from '../../shared/components/ControlsPill'
import GuidedTour from '../../shared/components/GuidedTour'
import PlaybackControlsPanel from '../../shared/components/PlaybackControlsPanel'
import { observeInstructionBannerVisibility } from '../../shared/components/InstructionBannerVisibility'
import { multiplicationGuideContent } from '../../shared/guides/multiplication'
import { multiplicationTourSteps } from '../../shared/tours/multiplication'
import { createPlaybackHistory } from '../../shared/utils/playbackHistory'

export default function App() {
  useEffect(() => {
    return observeInstructionBannerVisibility({
      elementId: 'drag-instruction',
      hiddenMessages: multiplicationGuideContent.startupHiddenMessages ?? [],
    })
  }, [])

  useEffect(() => {
    // ---- State ----
    const playbackHistory = createPlaybackHistory(updatePlaybackControls)
    let currentWordProblemTemplate: string | null = null
    let currentSpeed = 1.0
    let isRearranged = false
    let isAnimating = false
    let animBlocks: { el: HTMLElement; state: string }[] = []
    let preRearrangePositions: { left: string; unit: HTMLElement }[] = []
    let currentNL_D = 1
    let isPhase1OrLater = false
    let cueFollowerCleanup: (() => void) | null = null
    let isRestoringPlayback = false

    const wordProblemTemplates = [
      '一盒巧克力重 [FRAC1] 公斤，小明買了 [FRAC2] 盒。請問總共重多少公斤？',
      '一塊農田面積為 [FRAC1] 公頃，第二塊面積是第一塊的 [FRAC2] 倍。請問第二塊農田的面積是多少公頃？',
      '媽媽做一塊蛋糕需要 [FRAC1] 杯麵粉，她做了 [FRAC2] 塊蛋糕。請問總共需要多少杯麵粉？',
      '水桶容量為 [FRAC1] 公升，目前裝了 [FRAC2] 桶水。請問總共有多少公升的水？',
      '紅彩帶長 [FRAC1] 公尺，藍彩帶長度是紅彩帶的 [FRAC2] 倍。請問藍彩帶長多少公尺？',
    ]

    // ---- Helpers ----
    function toggleWholeNumber() {
      const showWhole = (document.getElementById('show-whole-cb') as HTMLInputElement).checked
      const w1El = document.getElementById('w1') as HTMLInputElement
      const w2El = document.getElementById('w2') as HTMLInputElement
      const ansWEl = document.getElementById('ans-w') as HTMLInputElement
      w1El.style.display = showWhole ? 'inline-block' : 'none'
      w2El.style.display = showWhole ? 'inline-block' : 'none'
      if (!showWhole) { w1El.value = ''; w2El.value = ''; ansWEl.value = '' }
      updateUI()
    }

    function updateSpeed() {
      currentSpeed = parseFloat((document.getElementById('speed-slider') as HTMLInputElement).value)
      const valEl = document.getElementById('speed-val')
      if (valEl) valEl.innerText = currentSpeed.toFixed(1)
    }

    function toggleNumberLine() {
      if (isPhase1OrLater) {
        const nlWrap = document.getElementById('bar1-nl')
        if (nlWrap) nlWrap.style.display = 'none'
        return
      }
      const maxW = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--max-wholes')) || 1
      renderNumberLine('bar1-nl', maxW, currentNL_D)
      const wrap = document.getElementById('main-bar-wrap')
      if (wrap) {
        const showNL = (document.getElementById('show-nl-cb') as HTMLInputElement).checked
        if (showNL) wrap.classList.add('continuous')
        else wrap.classList.remove('continuous')
      }
    }

    function getSafeValues() {
      let w1 = parseInt((document.getElementById('w1') as HTMLInputElement).value) || 0
      let d1 = parseInt((document.getElementById('d1') as HTMLInputElement).value) || 1
      let n1 = parseInt((document.getElementById('n1') as HTMLInputElement).value) || 0
      let w2 = parseInt((document.getElementById('w2') as HTMLInputElement).value) || 0
      let d2 = parseInt((document.getElementById('d2') as HTMLInputElement).value) || 1
      let n2 = parseInt((document.getElementById('n2') as HTMLInputElement).value) || 0

      if (w1 < 0) w1 = 0; if (w2 < 0) w2 = 0
      if (d1 < 1) d1 = 1; if (d1 > 10) d1 = 10
      if (d2 < 1) d2 = 1; if (d2 > 10) d2 = 10
      if (n1 < 0) n1 = 0; if (n2 < 0) n2 = 0
      if (w1 === 0 && n1 === 0) n1 = 1
      if (w2 === 0 && n2 === 0) n2 = 1

      return {
        w1, n1, d1,
        w2, n2, d2,
        total_n1: w1 * d1 + n1,
        total_n2: w2 * d2 + n2,
      }
    }

    function updateMaxWholes() {
      const vals = getSafeValues()
      const maxW = Math.max(
        1,
        Math.ceil(vals.total_n1 / vals.d1),
        Math.ceil((vals.total_n1 * vals.total_n2) / (vals.d1 * vals.d2))
      )
      document.documentElement.style.setProperty('--max-wholes', String(maxW))
      return maxW
    }

    function updateUI() {
      const vals = getSafeValues()
      ;(document.getElementById('d1') as HTMLInputElement).value = String(vals.d1)
      ;(document.getElementById('d2') as HTMLInputElement).value = String(vals.d2)
      playbackHistory.clear()

      const wpEl = document.getElementById('word-problem')!
      if (currentWordProblemTemplate) {
        const frac1Html = `<b>${getDisplayHtml(vals.w1, vals.n1, vals.d1, 'var(--red)')}</b>`
        const frac2Html = `<b>${getDisplayHtml(vals.w2, vals.n2, vals.d2, 'var(--blue)')}</b>`
        wpEl.innerHTML = currentWordProblemTemplate
          .replace(/\[FRAC1\]/g, frac1Html)
          .replace(/\[FRAC2\]/g, frac2Html)
        wpEl.style.display = 'block'
      }

      updatePlaybackControls()
    }

    function getPlaybackButtons() {
      const rearrangeBtn = document.getElementById('rearrange-btn') as HTMLButtonElement | null
      return {
        step: document.getElementById('multiplication-step-back-btn') as HTMLButtonElement | null,
        reset: document.getElementById('multiplication-reset-animation-btn') as HTMLButtonElement | null,
        rearrange: rearrangeBtn,
      }
    }

    function updatePlaybackControls() {
      const { step, reset, rearrange } = getPlaybackButtons()
      const row = document.getElementById('bar1-row') as HTMLElement | null
      const answerZone = document.getElementById('bottom-answer-zone') as HTMLElement | null
      const rearrangeBusy = Boolean(rearrange && rearrange.style.display === 'block' && rearrange.disabled)
      const hasVisibleState = (row?.style.display === 'flex') || (answerZone?.style.display === 'flex') || isPhase1OrLater
      if (step) step.disabled = isAnimating || rearrangeBusy || !playbackHistory.canStepBack()
      if (reset) reset.disabled = isAnimating || rearrangeBusy || !hasVisibleState
    }

    function runPlaybackRestore(action: () => void) {
      isRestoringPlayback = true
      try {
        action()
      } finally {
        isRestoringPlayback = false
      }
    }

    function hideAnswerStage(clearValues = false) {
      const ansZone = document.getElementById('bottom-answer-zone') as HTMLElement | null
      if (ansZone) {
        ansZone.style.display = 'none'
        ansZone.style.opacity = '0'
      }
      const feedback = document.getElementById('feedback') as HTMLElement | null
      if (feedback) {
        feedback.style.opacity = '0'
        feedback.innerHTML = ''
      }
      if (clearValues) {
        const ansW = document.getElementById('ans-w') as HTMLInputElement | null
        const ansNum = document.getElementById('ans-num') as HTMLInputElement | null
        const ansDen = document.getElementById('ans-den') as HTMLInputElement | null
        if (ansW) ansW.value = ''
        if (ansNum) ansNum.value = ''
        if (ansDen) ansDen.value = ''
      }
    }

    function resetMultiplicationView(clearHistory = false) {
      if (clearHistory) playbackHistory.clear()
      isAnimating = false
      isRearranged = false
      isPhase1OrLater = false
      animBlocks = []
      preRearrangePositions = []
      clearCue()
      updateUI()

      const row = document.getElementById('bar1-row') as HTMLElement | null
      const label = document.getElementById('label1') as HTMLElement | null
      const wrap = document.getElementById('main-bar-wrap') as HTMLElement | null
      const nlWrap = document.getElementById('bar1-nl') as HTMLElement | null
      const rearrangeBtn = document.getElementById('rearrange-btn') as HTMLButtonElement | null

      if (row) {
        row.style.display = 'none'
        row.classList.remove('fade-in-slow')
      }
      if (label) {
        label.style.opacity = '1'
        label.innerHTML = ''
      }
      if (wrap) wrap.innerHTML = ''
      if (nlWrap) {
        nlWrap.style.display = 'none'
        nlWrap.innerHTML = ''
      }
      hideAnswerStage(true)
      if (rearrangeBtn) {
        rearrangeBtn.style.display = 'none'
        rearrangeBtn.disabled = false
        rearrangeBtn.innerHTML = '💡 提示：重新排列'
      }

      document.getElementById('drag-instruction')!.innerHTML = '💡 準備中...請先點擊上方的「被乘數」'
      showNextActionCue()
      updatePlaybackControls()
    }

    function stepBackMultiplication() {
      if (!playbackHistory.stepBack()) return
      updatePlaybackControls()
    }

    function resetMultiplicationAnimation() {
      resetMultiplicationView(true)
    }

    function getFracHtml(n: number, d: number, color = 'inherit') {
      return `<div class="inline-frac" style="color: ${color};"><span>${n}</span><div class="line"></div><span>${d}</span></div>`
    }

    function getDisplayHtml(w: number, n: number, d: number, color: string) {
      if (w > 0) {
        return `<div style="display:inline-flex; align-items:center;">
                  <span style="color:${color}; font-size:1.8rem; font-weight:bold; margin-right:4px; line-height:1;">${w}</span>
                  ${getFracHtml(n, d, color)}
                </div>`
      }
      return getFracHtml(n, d, color)
    }

    function gcd(a: number, b: number): number { return b ? gcd(b, a % b) : a }

    function clearGuidedTarget() {
      document.querySelectorAll('.guided-next-target').forEach((element) => {
        element.classList.remove('guided-next-target')
      })
    }

    function clearCue() {
      if (cueFollowerCleanup) {
        cueFollowerCleanup()
        cueFollowerCleanup = null
      }
      const cue = document.getElementById('multiplication-hand-cue')
      if (cue) cue.remove()
      clearGuidedTarget()
    }

    function followCue(updatePosition: () => void) {
      let frameId = 0
      let followFrameId = 0
      let isFollowing = true

      const scheduleUpdate = () => {
        if (!isFollowing || frameId) return
        frameId = window.requestAnimationFrame(() => {
          frameId = 0
          if (!isFollowing) return
          updatePosition()
        })
      }

      const trackAnimatedTargets = () => {
        if (!isFollowing) return
        updatePosition()
        if (!isFollowing) return
        followFrameId = window.requestAnimationFrame(trackAnimatedTargets)
      }

      window.addEventListener('scroll', scheduleUpdate, true)
      window.addEventListener('resize', scheduleUpdate)
      followFrameId = window.requestAnimationFrame(trackAnimatedTargets)
      cueFollowerCleanup = () => {
        isFollowing = false
        if (frameId) window.cancelAnimationFrame(frameId)
        if (followFrameId) window.cancelAnimationFrame(followFrameId)
        window.removeEventListener('scroll', scheduleUpdate, true)
        window.removeEventListener('resize', scheduleUpdate)
      }
    }

    function clampCueLeft(left: number, width: number) {
      return Math.min(window.innerWidth - width - 12, Math.max(12, left))
    }

    function getCueRole(target: HTMLElement) {
      if (target.id === 'frac1-group' || target.id === 'frac2-group') return 'fraction'
      if (target.id === 'ans-w' || target.id === 'ans-num' || target.id === 'ans-den' || target.closest('#bottom-answer-zone')) return 'answer'
      return 'default'
    }

    function positionCue(cue: HTMLElement, target: HTMLElement) {
      const rect = target.getBoundingClientRect()
      const cueRect = cue.getBoundingClientRect()
      const role = getCueRole(target)

      let left = rect.left + (rect.width / 2) - (cueRect.width / 2)
      let top = rect.bottom + 10

      if (role === 'fraction') {
        top = rect.bottom + 14
      } else if (role === 'answer') {
        left = rect.right + 10
        top = rect.bottom - cueRect.height
        if (left + cueRect.width > window.innerWidth - 12) {
          left = rect.left + (rect.width / 2) - (cueRect.width / 2)
          top = rect.bottom + 12
        }
      }

      if (top < 12) top = rect.bottom + 10
      if (top + cueRect.height > window.innerHeight - 12) top = Math.max(12, rect.top - cueRect.height - 10)

      cue.style.left = `${clampCueLeft(left, cueRect.width)}px`
      cue.style.top = `${top}px`
    }

    function showAnchoredCue(target: HTMLElement | null, text: string, icon = '👆') {
      clearCue()
      if (!target) return

      target.classList.add('guided-next-target')
      const cue = document.createElement('div')
      cue.id = 'multiplication-hand-cue'
      cue.className = 'multiplication-hand-cue'
      cue.innerHTML = `<span class="multiplication-hand-icon">${icon}</span><span class="multiplication-hand-text">${text}</span>`
      document.body.appendChild(cue)
      positionCue(cue, target)
      followCue(() => {
        if (!document.body.contains(cue) || !document.body.contains(target)) {
          clearCue()
          return
        }
        positionCue(cue, target)
      })
    }

    function showNextActionCue() {
      const answerZone = document.getElementById('bottom-answer-zone') as HTMLElement | null
      if (answerZone && answerZone.style.display !== 'none' && answerZone.style.display !== '') {
        showAnchoredCue(document.querySelector('.answer-input-group') as HTMLElement | null, '填這裡')
        return
      }

      const bar1Row = document.getElementById('bar1-row') as HTMLElement | null
      if (!bar1Row || bar1Row.style.display === 'none') {
        showAnchoredCue(document.getElementById('frac1-group') as HTMLElement | null, '先點第一個分數')
        return
      }

      if (isAnimating) {
        clearCue()
        return
      }

      showAnchoredCue(document.getElementById('frac2-group') as HTMLElement | null, '再點第二個分數')
    }

    function renderNumberLine(wrapId: string, maxW: number, d: number) {
      const nlWrap = document.getElementById(wrapId)
      if (!nlWrap) return
      const showNL = (document.getElementById('show-nl-cb') as HTMLInputElement).checked
      if (!showNL) { nlWrap.style.display = 'none'; return }
      nlWrap.style.display = 'flex'
      nlWrap.classList.add('continuous')
      nlWrap.innerHTML = ''

      for (let i = 0; i < maxW; i++) {
        const nlUnit = document.createElement('div')
        nlUnit.className = 'nl-unit'
        let labelsHtml = ''

        for (let k = 0; k < d; k++) {
          const leftPct = (k / d) * 100
          let valHtml = ''
          if (k === 0) {
            valHtml = `<span style="font-weight:bold; font-size:1.1rem; color:var(--dark);">${i}</span>`
          } else {
            const fracPart = `<div class="inline-frac" style="font-size:0.85em; color:var(--dark);"><span>${k}</span><div class="line"></div><span>${d}</span></div>`
            if (i > 0) {
              valHtml = `<div style="display: flex; align-items: center; justify-content: center;"><span style="font-weight:bold; font-size:1.05rem; margin-right:2px; color:var(--dark);">${i}</span>${fracPart}</div>`
            } else {
              valHtml = fracPart
            }
          }
          labelsHtml += `<div style="position: absolute; left: ${leftPct}%; top: 0px; transform: translateX(-50%); display: flex; align-items: center; justify-content: center; flex-direction: column; z-index: 5;">
            <div style="width: 2px; height: 6px; background: var(--dark); margin-bottom: 2px;"></div>
            ${valHtml}
          </div>`
        }

        if (i === maxW - 1) {
          labelsHtml += `<div style="position: absolute; left: 100%; top: 0px; transform: translateX(-50%); display: flex; align-items: center; justify-content: center; flex-direction: column; z-index: 5;">
            <div style="width: 2px; height: 6px; background: var(--dark); margin-bottom: 2px;"></div>
            <span style="font-weight:bold; font-size:1.1rem; color:var(--dark);">${i + 1}</span>
          </div>`
        }

        nlUnit.innerHTML = labelsHtml
        nlWrap.appendChild(nlUnit)
      }
    }

    function onFrac1Click() {
      if (isAnimating) return
      const row = document.getElementById('bar1-row') as HTMLElement
      if (!isRestoringPlayback && row.style.display === 'none') {
        playbackHistory.push(() => {
          runPlaybackRestore(() => {
            resetMultiplicationView(false)
          })
        })
      }

      isPhase1OrLater = false

      const vals = getSafeValues()
      const A = vals.total_n1
      const B = vals.d1
      const maxW = updateMaxWholes()

      const bar1Row = document.getElementById('bar1-row')!
      bar1Row.style.display = 'flex'
      bar1Row.classList.add('fade-in-slow')

      const label1 = document.getElementById('label1')!
      label1.style.opacity = '1'
      label1.innerHTML = getDisplayHtml(vals.w1, vals.n1, vals.d1, 'var(--red)')

      const wrap = document.getElementById('main-bar-wrap')!
      wrap.innerHTML = ''

      for (let i = 0; i < maxW; i++) {
        const unit = document.createElement('div')
        unit.className = i === maxW - 1 ? 'bar-unit bar-unit-last' : 'bar-unit'

        for (let k = 1; k < B; k++) {
          const thickLine = document.createElement('div')
          thickLine.className = 'abs-thick-line'
          thickLine.style.left = `${(k / B) * 100}%`
          unit.appendChild(thickLine)
        }

        const startCol = i * B
        const endCol = Math.min(startCol + B, A)
        for (let k = startCol; k < endCol; k++) {
          const block = document.createElement('div')
          block.className = 'stage0-block'
          block.style.position = 'absolute'
          block.style.left = `${((k - startCol) / B) * 100}%`
          block.style.width = `${100 / B}%`
          block.style.height = '100%'
          block.style.backgroundColor = 'var(--red)'
          block.style.opacity = '0.85'
          unit.appendChild(block)
        }
        wrap.appendChild(unit)
      }

      currentNL_D = B
      toggleNumberLine()

      document.getElementById('drag-instruction')!.innerHTML =
        `👉 點擊 × ${getDisplayHtml(vals.w2, vals.n2, vals.d2, 'var(--blue)')}`
      const ansZone = document.getElementById('bottom-answer-zone')!
      ansZone.style.display = 'none'
      ansZone.style.opacity = '0'
      showNextActionCue()
      updatePlaybackControls()
    }

    function onFrac2Click() {
      if (isAnimating) return
      const rowCheck = document.getElementById('bar1-row')!
      if (rowCheck.style.display === 'none') {
        onFrac1Click()
        setTimeout(onFrac2Click, 1600)
        return
      }

      if (!isRestoringPlayback) {
        playbackHistory.push(() => {
          runPlaybackRestore(() => {
            isAnimating = false
            isPhase1OrLater = false
            isRearranged = false
            animBlocks = []
            preRearrangePositions = []
            hideAnswerStage(true)
            const rearrangeBtn = document.getElementById('rearrange-btn') as HTMLButtonElement | null
            if (rearrangeBtn) {
              rearrangeBtn.style.display = 'none'
              rearrangeBtn.disabled = false
            }
            onFrac1Click()
          })
        })
      }

      isAnimating = true
      isPhase1OrLater = true
      clearCue()
      updatePlaybackControls()

      const label1 = document.getElementById('label1')!
      label1.style.opacity = '0'
      const nlWrap = document.getElementById('bar1-nl')!
      nlWrap.style.display = 'none'

      const vals = getSafeValues()
      const A = vals.total_n1
      const B = vals.d1
      const C = vals.total_n2
      const D = vals.d2
      const maxW = updateMaxWholes()

      document.getElementById('drag-instruction')!.innerHTML =
        `<span id="anim-step-text" style="color:var(--blue); font-weight:bold;">準備中...</span>`

      const wrap = document.getElementById('main-bar-wrap')!
      wrap.innerHTML = ''

      animBlocks = []
      const dashedLines: HTMLElement[] = []

      for (let i = 0; i < maxW; i++) {
        const unit = document.createElement('div')
        unit.className = i === maxW - 1 ? 'bar-unit bar-unit-last' : 'bar-unit'
        unit.id = `unit-${i}`

        for (let k = 0; k < B * D; k++) {
          const globalIdx = i * B * D + k
          let state = 'empty'

          if (C <= D) {
            if (globalIdx < A * D) {
              const rem = globalIdx % D
              state = rem < C ? 'kept' : 'discarded'
            }
          } else {
            if (globalIdx < A * D) state = 'kept'
            else if (globalIdx < A * C) state = 'added'
          }

          if (state !== 'empty') {
            const block = document.createElement('div')
            block.className = 'sub-block'
            block.style.position = 'absolute'
            block.style.left = `${(k / (B * D)) * 100}%`
            block.style.width = `${100 / (B * D)}%`
            block.style.height = '100%'
            block.style.backgroundColor = 'var(--red)'
            block.style.opacity = state === 'added' ? '0' : '0.85'
            block.dataset.state = state
            unit.appendChild(block)
            animBlocks.push({ el: block, state })
          }
        }

        for (let k = 1; k < B * D; k++) {
          if (k % D !== 0) {
            const thinLine = document.createElement('div')
            thinLine.className = 'abs-thin-line'
            thinLine.style.left = `${(k / (B * D)) * 100}%`
            thinLine.style.height = '0%'
            thinLine.style.borderLeft = '2px dashed var(--dark)'
            thinLine.style.background = 'transparent'
            thinLine.style.transform = 'translateX(-50%)'
            unit.appendChild(thinLine)
            dashedLines.push(thinLine)
          }
        }

        for (let k = 1; k < B; k++) {
          const thickLine = document.createElement('div')
          thickLine.className = 'abs-thick-line'
          thickLine.style.left = `${(k / B) * 100}%`
          unit.appendChild(thickLine)
        }

        wrap.appendChild(unit)
      }

      const startTime = performance.now()
      const totalDuration = 3500 / currentSpeed

      function loop(now: number) {
        const t = now - startTime
        let p = t / totalDuration
        if (p > 1) p = 1

        const stepTextEl = document.getElementById('anim-step-text')
        let stepText = ''

        if (p <= 0.5) {
          stepText = '第 1 步：將被乘數進一步細分'
          const h = (p / 0.5) * 100
          dashedLines.forEach(l => { l.style.height = `${h}%` })
          animBlocks.forEach(b => {
            if (b.state === 'discarded' || b.state === 'kept') b.el.style.opacity = '0.85'
            if (b.state === 'added') b.el.style.opacity = '0'
          })
        } else {
          stepText = '第 2 步：保留結果，完成乘法'
          dashedLines.forEach(l => { l.style.height = '100%' })
          const fade_p = (p - 0.5) / 0.5
          animBlocks.forEach(b => {
            if (b.state === 'discarded') b.el.style.opacity = `${0.85 * (1 - fade_p)}`
            if (b.state === 'added') b.el.style.opacity = `${0.85 * fade_p}`
            if (b.state === 'kept') b.el.style.opacity = '0.85'
          })
        }

        if (stepTextEl) stepTextEl.innerText = stepText

        if (p < 1) {
          requestAnimationFrame(loop)
        } else {
          finishAnimation()
        }
      }

      requestAnimationFrame(loop)
    }

    function finishAnimation() {
      isAnimating = false

      document.getElementById('drag-instruction')!.innerHTML =
        `💡 現在，根據最終顯示的紅色方塊填寫答案吧！`

      const vals = getSafeValues()
      const resultD = vals.d1 * vals.d2
      const resultN = vals.total_n1 * vals.total_n2

      const ansZone = document.getElementById('bottom-answer-zone')!
      ansZone.style.display = 'flex'
      setTimeout(() => { ansZone.style.opacity = '1' }, 50)

      document.getElementById('bot-frac1')!.innerHTML = getDisplayHtml(vals.w1, vals.n1, vals.d1, 'var(--red)')
      document.getElementById('bot-frac2')!.innerHTML = getDisplayHtml(vals.w2, vals.n2, vals.d2, 'var(--blue)')

      const ansWEl = document.getElementById('ans-w') as HTMLInputElement
      if (resultN >= resultD) {
        ansWEl.style.display = 'inline-block'
      } else {
        ansWEl.style.display = 'none'
      }

      ansWEl.value = ''
      ;(document.getElementById('ans-num') as HTMLInputElement).value = ''
      ;(document.getElementById('ans-den') as HTMLInputElement).value = ''
      const fb = document.getElementById('feedback')!
      fb.style.opacity = '0'

      const btn = document.getElementById('rearrange-btn')!
      btn.style.display = 'block'
      btn.innerHTML = '💡 提示：重新排列'
      isRearranged = false

      animBlocks = animBlocks.filter(b => {
        if (b.state === 'discarded') {
          b.el.remove()
          return false
        }
        return true
      })
      showNextActionCue()
      updatePlaybackControls()
    }

    function toggleRearrange() {
      const btn = document.getElementById('rearrange-btn') as HTMLButtonElement
      if (btn.disabled) return

      if (!isRestoringPlayback) {
        playbackHistory.push(() => {
          runPlaybackRestore(() => {
            toggleRearrange()
          })
        })
      }

      btn.disabled = true
      updatePlaybackControls()

      const vals = getSafeValues()
      const B = vals.d1
      const D = vals.d2
      const slotsPerUnit = B * D

      const wrap = document.getElementById('main-bar-wrap')!
      const wrapRect = wrap.getBoundingClientRect()

      if (!isRearranged) {
        preRearrangePositions = []
        const ghosts: HTMLElement[] = []

        animBlocks.forEach(b => {
          const rect = b.el.getBoundingClientRect()
          preRearrangePositions.push({ left: b.el.style.left, unit: b.el.parentElement as HTMLElement })

          const ghost = document.createElement('div')
          ghost.style.position = 'absolute'
          ghost.style.left = `${rect.left - wrapRect.left}px`
          ghost.style.top = `${rect.top - wrapRect.top}px`
          ghost.style.width = `${rect.width}px`
          ghost.style.height = `${rect.height}px`
          ghost.style.backgroundColor = 'var(--red)'
          ghost.style.opacity = '0.85'
          ghost.style.transition = 'all 0.6s cubic-bezier(0.25, 1, 0.5, 1)'
          ghost.style.zIndex = '100'
          wrap.appendChild(ghost)
          ghosts.push(ghost)

          b.el.style.visibility = 'hidden'
        })

        setTimeout(() => {
          ghosts.forEach((ghost, i) => {
            const unitIdx = Math.floor(i / slotsPerUnit)
            const rem = i % slotsPerUnit
            const targetUnit = document.getElementById(`unit-${unitIdx}`)
            if (!targetUnit) return
            const tRect = targetUnit.getBoundingClientRect()
            ghost.style.left = `${tRect.left - wrapRect.left + (rem * (tRect.width / slotsPerUnit))}px`
            ghost.style.top = `${tRect.top - wrapRect.top}px`
          })
        }, 50)

        setTimeout(() => {
          animBlocks.forEach((b, i) => {
            const unitIdx = Math.floor(i / slotsPerUnit)
            const rem = i % slotsPerUnit
            const targetUnit = document.getElementById(`unit-${unitIdx}`)
            if (!targetUnit) return
            targetUnit.appendChild(b.el)
            b.el.style.left = `${(rem / slotsPerUnit) * 100}%`
            b.el.style.visibility = 'visible'
          })
          ghosts.forEach(g => g.remove())
          btn.innerHTML = '🔙 復原排列'
          isRearranged = true
          btn.disabled = false
          updatePlaybackControls()
        }, 650)

      } else {
        const ghosts: HTMLElement[] = []

        animBlocks.forEach(b => {
          const rect = b.el.getBoundingClientRect()
          const ghost = document.createElement('div')
          ghost.style.position = 'absolute'
          ghost.style.left = `${rect.left - wrapRect.left}px`
          ghost.style.top = `${rect.top - wrapRect.top}px`
          ghost.style.width = `${rect.width}px`
          ghost.style.height = `${rect.height}px`
          ghost.style.backgroundColor = 'var(--red)'
          ghost.style.opacity = '0.85'
          ghost.style.transition = 'all 0.6s cubic-bezier(0.25, 1, 0.5, 1)'
          ghost.style.zIndex = '100'
          wrap.appendChild(ghost)
          ghosts.push(ghost)
          b.el.style.visibility = 'hidden'
        })

        setTimeout(() => {
          ghosts.forEach((ghost, i) => {
            const orig = preRearrangePositions[i]
            if (!orig) return
            orig.unit.appendChild(animBlocks[i].el)
            animBlocks[i].el.style.left = orig.left
            const tRect = animBlocks[i].el.getBoundingClientRect()
            ghost.style.left = `${tRect.left - wrapRect.left}px`
            ghost.style.top = `${tRect.top - wrapRect.top}px`
          })
        }, 50)

        setTimeout(() => {
          animBlocks.forEach(b => { b.el.style.visibility = 'visible' })
          ghosts.forEach(g => g.remove())
          btn.innerHTML = '💡 提示：重新排列'
          isRearranged = false
          btn.disabled = false
          updatePlaybackControls()
        }, 650)
      }
    }

    function autoCheck() {
      const vals = getSafeValues()
      const ansNStr = (document.getElementById('ans-num') as HTMLInputElement).value
      const ansDStr = (document.getElementById('ans-den') as HTMLInputElement).value
      if (ansNStr === '' || ansDStr === '') return

      const ansW = parseInt((document.getElementById('ans-w') as HTMLInputElement).value) || 0
      const ansN = parseInt(ansNStr)
      const ansD = parseInt(ansDStr)

      const userVal = ansW + ansN / ansD
      const exactN = vals.total_n1 * vals.total_n2
      const exactD = vals.d1 * vals.d2
      const exactVal = exactN / exactD

      const fb = document.getElementById('feedback')!

      if (Math.abs(userVal - exactVal) < 0.0001) {
        const divisor = gcd(exactN, exactD)
        const simpleN = exactN / divisor
        const simpleD = exactD / divisor
        const simpleW = Math.floor(simpleN / simpleD)
        const simpleMixedN = simpleN % simpleD

        let isSimplest = false
        if (ansW === simpleW && ansN === simpleMixedN && ansD === simpleD) isSimplest = true
        else if (ansW === 0 && ansN === simpleN && ansD === simpleD) isSimplest = true

        if (isSimplest) {
          fb.innerHTML = '🎉 完全正確！而且已經是最簡化的答案了！'
        } else {
          fb.innerHTML = '🌟 答對了數值！但試試看，這個答案可以再「約分」或「轉成帶分數」喔！'
        }
        fb.style.opacity = '1'
        ;(fb as HTMLElement).style.color = 'var(--success)'
      } else {
        fb.innerHTML = '❌ 答案不對喔！請再觀察一下紅色的方塊總數。'
        fb.style.opacity = '1'
        ;(fb as HTMLElement).style.color = 'var(--red)'
      }
    }

    function randomChallenge() {
      if (isAnimating) return

      const showWhole = (document.getElementById('show-whole-cb') as HTMLInputElement).checked
      let w1 = 0; let w2 = 0

      const d1 = Math.floor(Math.random() * 4) + 2
      let n1 = Math.floor(Math.random() * (d1 - 1)) + 1
      const d2 = Math.floor(Math.random() * 4) + 2
      let n2 = Math.floor(Math.random() * (d2 - 1)) + 1

      if (showWhole) {
        w1 = Math.floor(Math.random() * 2)
        w2 = Math.floor(Math.random() * 2)
        if (w1 === 0 && n1 === 0) n1 = 1
        if (w2 === 0 && n2 === 0) n2 = 1
      }

      ;(document.getElementById('w1') as HTMLInputElement).value = w1 ? String(w1) : ''
      ;(document.getElementById('n1') as HTMLInputElement).value = String(n1)
      ;(document.getElementById('d1') as HTMLInputElement).value = String(d1)
      ;(document.getElementById('w2') as HTMLInputElement).value = w2 ? String(w2) : ''
      ;(document.getElementById('n2') as HTMLInputElement).value = String(n2)
      ;(document.getElementById('d2') as HTMLInputElement).value = String(d2)

      currentWordProblemTemplate = wordProblemTemplates[Math.floor(Math.random() * wordProblemTemplates.length)]
      resetMultiplicationView(true)
    }

    // ---- Expose namespace ----
    ;(window as any)._mul = {
      toggleWholeNumber,
      toggleNumberLine,
      updateSpeed,
      randomChallenge,
      updateUI,
      autoCheck,
      onFrac1Click,
      onFrac2Click,
      toggleRearrange,
      stepBackMultiplication,
      resetMultiplicationAnimation,
    }

    // ---- Init ----
    randomChallenge()

    return () => {
      clearCue()
      delete (window as any)._mul
    }
  }, [])

  return (
    <div className="container">
      <AppHeader
        leftSlot={<div className="title-badge">分數乘法教學</div>}
        rightSlot={<>
          <ControlsPill
            speedId="speed-slider"
            speedLabelId="speed-val"
            onSpeedChange={() => (window as any)._mul?.updateSpeed()}
          >
            <label className="checkbox-label" htmlFor="show-whole-cb">
              <input type="checkbox" id="show-whole-cb" onChange={() => (window as any)._mul?.toggleWholeNumber()} /> 顯示帶分數
            </label>
            <div className="divider" />
            <label className="checkbox-label" htmlFor="show-nl-cb">
              <input type="checkbox" id="show-nl-cb" onChange={() => (window as any)._mul?.toggleNumberLine()} /> 顯示數線
            </label>
          </ControlsPill>
          <LangBtn onClick={() => (window as any)._mul?.randomChallenge()}>🎲 隨機出題</LangBtn>
          <GuidedTour steps={multiplicationTourSteps} />
        </>}
      />

      <div id="word-problem" className="word-problem" />

      <div className="answer-zone">
        <div className="formula">
          <div
            className="mixed-frac frac-btn"
            id="frac1-group"
            onClick={() => (window as any)._mul?.onFrac1Click()}
            title="點擊設定被乘數圖形"
          >
            <input
              type="number"
              className="whole-input"
              id="w1"
              placeholder=" "
              min={0}
              max={10}
              onInput={() => (window as any)._mul?.updateUI()}
              onChange={() => (window as any)._mul?.updateUI()}
            />
            <div className="frac">
              <FracInputStepper id="n1" defaultValue={2} min={1} max={10} onUpdate={() => (window as any)._mul?.updateUI()} onShowBar={() => (window as any)._mul?.onFrac1Click()} />
              <div className="fraction-line" />
              <FracInputStepper id="d1" defaultValue={3} min={1} max={10} onUpdate={() => (window as any)._mul?.updateUI()} onShowBar={() => (window as any)._mul?.onFrac1Click()} />
            </div>
          </div>
          <span
            style={{ cursor: 'pointer' }}
            onClick={() => (window as any)._mul?.onFrac2Click()}
            title="點擊播放乘法"
          >
            ×
          </span>
          <div
            className="mixed-frac frac-btn"
            id="frac2-group"
            onClick={() => (window as any)._mul?.onFrac2Click()}
            title="點擊播放乘法"
          >
            <input
              type="number"
              className="whole-input"
              id="w2"
              placeholder=" "
              min={0}
              max={10}
              onInput={() => (window as any)._mul?.updateUI()}
              onChange={() => (window as any)._mul?.updateUI()}
            />
            <div className="frac">
              <FracInputStepper id="n2" defaultValue={1} min={1} max={10} onUpdate={() => (window as any)._mul?.updateUI()} onShowBar={() => (window as any)._mul?.onFrac2Click()} />
              <div className="fraction-line" />
              <FracInputStepper id="d2" defaultValue={2} min={1} max={10} onUpdate={() => (window as any)._mul?.updateUI()} onShowBar={() => (window as any)._mul?.onFrac2Click()} />
            </div>
          </div>
        </div>
      </div>

      <div className="animation-zone" id="anim-zone">
        <div id="drag-instruction" className="instruction-text">💡 準備中...請先點擊上方的「被乘數」</div>
        <div id="anim-area">
          <div
            id="bar1-row"
            style={{
              display: 'none',
              position: 'relative',
              width: '100%',
              minHeight: '80px',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div
              id="label1"
              style={{
                width: '15%',
                textAlign: 'center',
                fontSize: '1.3rem',
                transition: 'opacity 0.5s',
                opacity: 1,
                fontWeight: 'bold',
              }}
            />
            <div className="bars-column">
              <div id="main-bar-wrap" className="bar-wrap-container" />
              <div id="bar1-nl" className="nl-wrap-container" style={{ display: 'none' }} />
            </div>
            <div style={{ width: '15%' }} />
          </div>
        </div>

        <PlaybackControlsPanel
          className="multiplication-playback-controls"
          buttonClassName="multiplication-playback-btn"
          buttons={[
            { id: 'multiplication-step-back-btn', label: '上一步', onClick: () => (window as any)._mul?.stepBackMultiplication(), disabled: true },
            { id: 'multiplication-reset-animation-btn', label: '重看', onClick: () => (window as any)._mul?.resetMultiplicationAnimation(), disabled: true },
          ]}
        />

        <div id="bottom-answer-zone">
          <div className="formula">
            <div id="bot-frac1" />
            <span>×</span>
            <div id="bot-frac2" />
            <span>=</span>
            <div className="mixed-frac answer-input-group" style={{ cursor: 'default' }}>
              <input
                type="number"
                className="whole-input"
                id="ans-w"
                placeholder=" "
                min={0}
                onInput={() => (window as any)._mul?.autoCheck()}
              />
              <div className="frac">
                <input
                  type="number"
                  className="frac-input"
                  id="ans-num"
                  placeholder="?"
                  min={0}
                  onInput={() => (window as any)._mul?.autoCheck()}
                />
                <div className="fraction-line" style={{ background: '#ccc' }} />
                <input
                  type="number"
                  className="frac-input"
                  id="ans-den"
                  placeholder="?"
                  min={1}
                  onInput={() => (window as any)._mul?.autoCheck()}
                />
              </div>
            </div>
          </div>
          <div id="feedback" className="feedback-msg" />
          <button
            id="rearrange-btn"
            className="btn-hint"
            style={{ display: 'none' }}
            onClick={() => (window as any)._mul?.toggleRearrange()}
          >
            💡 提示：重新排列
          </button>
        </div>
      </div>
    </div>
  )
}
