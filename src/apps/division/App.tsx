import { useEffect } from 'react'
import './app.css'
import AppHeader from '../../shared/components/AppHeader'
import FracInputStepper from '../../shared/components/FracInputStepper'
import LangBtn from '../../shared/components/LangBtn'
import ControlsPill from '../../shared/components/ControlsPill'
import GuidedTour from '../../shared/components/GuidedTour'
import PlaybackControlsPanel from '../../shared/components/PlaybackControlsPanel'
import { observeInstructionBannerVisibility } from '../../shared/components/InstructionBannerVisibility'
import { divisionGuideContent } from '../../shared/guides/division'
import { divisionTourSteps } from '../../shared/tours/division'
import { createPlaybackHistory } from '../../shared/utils/playbackHistory'
import { applyGridAnimation as applyGridAnimationShared } from '../../shared/utils/gridAnimation'

export default function App() {
  useEffect(() => {
    return observeInstructionBannerVisibility({
      elementId: 'drag-instruction',
      hiddenMessages: divisionGuideContent.startupHiddenMessages ?? [],
    })
  }, [])

  useEffect(() => {
    // ---- State ----
    const playbackHistory = createPlaybackHistory(updatePlaybackControls)
    let currentWordProblemTemplate: string | null = null
    let s1 = 1
    let s2 = 1
    let bar1Visible = false
    let bar2Visible = false
    let currentSpeed = 1.0
    let isCommonDenomReady = false
    let cueFollowerCleanup: (() => void) | null = null
    let isFillingChunk = false
    const pendingTimeouts = new Set<number>()

    const wordProblemTemplates = [
      '有 [FRAC1] 公升的果汁，每 [FRAC2] 公升倒成一杯，可以倒滿幾杯？',
      '一條長 [FRAC1] 公尺的緞帶，每 [FRAC2] 公尺剪成一段，共可剪成多少段？',
      '農場有 [FRAC1] 公斤的飼料，小動物每天固定吃掉 [FRAC2] 公斤，這些飼料可以吃幾天？',
      '廚師烤了 [FRAC1] 塊大披薩，每人分 [FRAC2] 塊，可以分給多少人？',
      '水桶裡有 [FRAC1] 加侖的水，每次舀出 [FRAC2] 加侖，一共可以舀幾次？',
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
      const duration = 0.6 / currentSpeed
      document.documentElement.style.setProperty('--anim-time', duration + 's')
    }

    function toggleNumberLine() {
      if (bar1Visible) renderBar(1, 'none')
      if (bar2Visible) renderBar(2, 'none')
    }

    function getPlaybackButtons() {
      return {
        step: document.getElementById('division-step-back-btn') as HTMLButtonElement | null,
        reset: document.getElementById('division-reset-animation-btn') as HTMLButtonElement | null,
      }
    }

    function updatePlaybackControls() {
      const { step, reset } = getPlaybackButtons()
      const bar3Row = document.getElementById('bar3-row') as HTMLElement | null
      const answerZone = document.getElementById('bottom-answer-zone') as HTMLElement | null
      const hasVisibleState = bar1Visible || bar2Visible || (bar3Row?.style.display === 'flex') || (answerZone?.style.display === 'flex')
      if (step) step.disabled = isFillingChunk || !playbackHistory.canStepBack()
      if (reset) reset.disabled = isFillingChunk || !hasVisibleState
    }

    function scheduleDivisionTimeout(callback: () => void, delayMs: number) {
      const timeoutId = window.setTimeout(() => {
        pendingTimeouts.delete(timeoutId)
        callback()
      }, delayMs)
      pendingTimeouts.add(timeoutId)
      return timeoutId
    }

    function clearPendingDivisionTimeouts() {
      pendingTimeouts.forEach((timeoutId) => window.clearTimeout(timeoutId))
      pendingTimeouts.clear()
      isFillingChunk = false
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

    function resetDivisionAnimation() {
      clearPendingDivisionTimeouts()
      playbackHistory.clear()
      hideAnswerStage(true)
      updateUI()
      updatePlaybackControls()
    }

    function stepBackDivision() {
      clearPendingDivisionTimeouts()
      if (!playbackHistory.stepBack()) return
      hideAnswerStage()
      updatePlaybackControls()
    }

    function clearGuidedTarget() {
      document.querySelectorAll('.guided-next-target').forEach((element) => {
        element.classList.remove('guided-next-target')
      })
    }

    function clearDivisionCue() {
      if (cueFollowerCleanup) {
        cueFollowerCleanup()
        cueFollowerCleanup = null
      }
      const cue = document.getElementById('division-hand-cue')
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

    function positionAnchoredCue(cue: HTMLElement, target: HTMLElement) {
      const rect = target.getBoundingClientRect()
      const cueRect = cue.getBoundingClientRect()
      let left = rect.left + (rect.width / 2) - (cueRect.width / 2)
      let top = rect.bottom + 12

      if (target.classList.contains('tool-btn') || target.closest('.denominator-tool-group')) {
        top = rect.bottom + 10
      }
      if (target.id === 'ans-w' || target.id === 'ans-num' || target.id === 'ans-den' || target.closest('#bottom-answer-zone')) {
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
      clearDivisionCue()
      if (!target) return

      target.classList.add('guided-next-target')
      const cue = document.createElement('div')
      cue.id = 'division-hand-cue'
      cue.className = 'division-hand-cue'
      cue.innerHTML = `<span class="division-hand-icon">${icon}</span><span class="division-hand-text">${text}</span>`
      document.body.appendChild(cue)
      positionAnchoredCue(cue, target)
      followCue(() => {
        if (!document.body.contains(cue) || !document.body.contains(target)) {
          clearDivisionCue()
          return
        }
        positionAnchoredCue(cue, target)
      })
    }

    function showDenominatorToolsCue() {
      clearDivisionCue()
      const toolGroups = Array.from(document.querySelectorAll('.denominator-tool-group')) as HTMLElement[]
      const visibleGroups = toolGroups.filter((group) => group.offsetParent !== null)
      if (visibleGroups.length === 0) return

      visibleGroups.forEach((group) => group.classList.add('guided-next-target'))
      const cue = document.createElement('div')
      cue.id = 'division-hand-cue'
      cue.className = 'division-hand-cue division-tool-cue'
      cue.innerHTML = `<span class="division-hand-icon">👇</span><span class="division-hand-text">調分母</span>`
      document.body.appendChild(cue)

      const positionToolsCue = () => {
        const visible = visibleGroups.filter((group) => group.offsetParent !== null)
        if (visible.length === 0) return false
        const rects = visible.map((group) => group.getBoundingClientRect())
        const left = Math.min(...rects.map((rect) => rect.left))
        const right = Math.max(...rects.map((rect) => rect.right))
        const top = Math.min(...rects.map((rect) => rect.top))
        const bottom = Math.max(...rects.map((rect) => rect.bottom))
        const cueRect = cue.getBoundingClientRect()
        let cueTop = top - cueRect.height - 12
        if (cueTop < 12) cueTop = bottom + 10
        cue.style.left = `${clampCueLeft(left + ((right - left) / 2) - (cueRect.width / 2), cueRect.width)}px`
        cue.style.top = `${cueTop}px`
        return true
      }

      positionToolsCue()
      followCue(() => {
        if (!document.body.contains(cue) || !positionToolsCue()) clearDivisionCue()
      })
    }

    function showDivisionDragCue() {
      clearDivisionCue()
      const source = Array.from(document.querySelectorAll('#drag-overlay .drag-block'))
        .find((block) => (block as HTMLElement).style.visibility !== 'hidden') as HTMLElement | undefined
      const target = document.getElementById('divisor-mold') as HTMLElement | null
      if (!source || !target) return

      const cue = document.createElement('div')
      cue.id = 'division-hand-cue'
      cue.className = 'division-drag-demo'
      cue.innerHTML = `<span class="division-drag-path-line"></span><span class="division-drag-carrier"><span class="division-drag-piece"></span><span class="division-drag-hand">🤏</span></span>`
      document.body.appendChild(cue)

      const positionDragCue = () => {
        const sourceRect = source.getBoundingClientRect()
        const targetRect = target.getBoundingClientRect()
        const startLeft = sourceRect.left + sourceRect.width / 2 - 22
        const startTop = sourceRect.top + sourceRect.height / 2 - 22
        const endLeft = targetRect.left + Math.min(targetRect.width * 0.5, sourceRect.width / 2) - 22
        const endTop = targetRect.top + targetRect.height / 2 - 22

        cue.style.left = `${startLeft}px`
        cue.style.top = `${startTop}px`
        cue.style.setProperty('--division-drag-dx', `${endLeft - startLeft}px`)
        cue.style.setProperty('--division-drag-dy', `${endTop - startTop}px`)
        cue.style.setProperty('--division-drag-distance', `${Math.hypot(endLeft - startLeft, endTop - startTop)}px`)
        cue.style.setProperty('--division-drag-angle', `${Math.atan2(endTop - startTop, endLeft - startLeft)}rad`)
      }

      positionDragCue()
      followCue(() => {
        if (!document.body.contains(cue) || !document.body.contains(source) || !document.body.contains(target)) {
          clearDivisionCue()
          return
        }
        positionDragCue()
      })

      window.setTimeout(() => {
        if (document.body.contains(cue)) clearDivisionCue()
      }, 1350 * 3 + 120)
    }

    function showDivisionNextActionCue() {
      const answerZone = document.getElementById('bottom-answer-zone') as HTMLElement | null
      if (answerZone && answerZone.style.display !== 'none' && answerZone.style.display !== '') {
        showAnchoredCue(document.querySelector('.answer-input-group') as HTMLElement | null, '填這裡')
        return
      }

      if (!bar1Visible) {
        showAnchoredCue(document.getElementById('frac1-group') as HTMLElement | null, '先點第一個分數')
        return
      }

      if (!bar2Visible) {
        showAnchoredCue(document.getElementById('frac2-group') as HTMLElement | null, '再點第二個分數')
        return
      }

      if (!isCommonDenomReady) showDenominatorToolsCue()
    }

    function getSafeValues() {
      let w1 = parseInt((document.getElementById('w1') as HTMLInputElement).value) || 0
      let d1 = parseInt((document.getElementById('d1') as HTMLInputElement).value) || 1
      let n1 = parseInt((document.getElementById('n1') as HTMLInputElement).value) || 0
      let w2 = parseInt((document.getElementById('w2') as HTMLInputElement).value) || 0
      let d2 = parseInt((document.getElementById('d2') as HTMLInputElement).value) || 1
      let n2 = parseInt((document.getElementById('n2') as HTMLInputElement).value) || 0

      if (w1 < 0) w1 = 0; if (w2 < 0) w2 = 0
      if (d1 < 1) d1 = 1; if (d1 > 100) d1 = 100
      if (d2 < 1) d2 = 1; if (d2 > 100) d2 = 100
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

    function enforceInputLimits() {
      const safe = getSafeValues()
      ;(document.getElementById('d1') as HTMLInputElement).value = String(safe.d1)
      ;(document.getElementById('d2') as HTMLInputElement).value = String(safe.d2)
    }

    function updateMaxWholes() {
      const vals = getSafeValues()
      const wholes1 = Math.max(1, Math.ceil(vals.total_n1 / vals.d1))
      const wholes2 = Math.max(1, Math.ceil(vals.total_n2 / vals.d2))
      const maxW = Math.max(wholes1, wholes2)
      document.documentElement.style.setProperty('--max-wholes', String(maxW))
      return maxW
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
    function lcm(a: number, b: number) { return (a * b) / gcd(a, b) }

    function onFrac1Click() {
      if (!bar1Visible) {
        playbackHistory.push(() => {
          const row = document.getElementById('bar1-row') as HTMLElement | null
          s1 = 1
          bar1Visible = false
          isCommonDenomReady = false
          hideAnswerStage()
          if (row) row.style.display = 'none'
          document.getElementById('drag-instruction')!.innerHTML = '💡 點擊上方分數，顯示長條圖！'
          showDivisionNextActionCue()
          updatePlaybackControls()
        })
      }

      const row = document.getElementById('bar1-row')!
      row.style.display = 'flex'
      s1 = 1
      renderBar(1, 'none')
      row.classList.remove('fade-in-slow')
      void (row as HTMLElement).offsetWidth
      row.classList.add('fade-in-slow')
      bar1Visible = true
      checkCommonDenom()
      showDivisionNextActionCue()
      updatePlaybackControls()
    }

    function onFrac2Click() {
      if (!bar2Visible) {
        playbackHistory.push(() => {
          const row = document.getElementById('bar2-row') as HTMLElement | null
          s2 = 1
          bar2Visible = false
          isCommonDenomReady = false
          hideAnswerStage()
          if (row) row.style.display = 'none'
          checkCommonDenom()
          showDivisionNextActionCue()
          updatePlaybackControls()
        })
      }

      const row = document.getElementById('bar2-row')!
      row.style.display = 'flex'
      s2 = 1
      renderBar(2, 'none')
      row.classList.remove('fade-in-slow')
      void (row as HTMLElement).offsetWidth
      row.classList.add('fade-in-slow')
      bar2Visible = true
      checkCommonDenom()
      showDivisionNextActionCue()
      updatePlaybackControls()
    }

    function applyTool(num: number, action: string) {
      let changed = false
      const prevS1 = s1
      const prevS2 = s2
      const old_s = num === 1 ? s1 : s2

      if (num === 1) {
        if (action === 'expand') { s1++; changed = true }
        else if (action === 'simplify' && s1 > 1) { s1--; changed = true }
      } else {
        if (action === 'expand') { s2++; changed = true }
        else if (action === 'simplify' && s2 > 1) { s2--; changed = true }
      }

      if (changed) {
        playbackHistory.push(() => {
          s1 = prevS1
          s2 = prevS2
          if (bar1Visible) renderBar(1, 'none')
          if (bar2Visible) renderBar(2, 'none')
          hideAnswerStage()
          checkCommonDenom()
          showDivisionNextActionCue()
          updatePlaybackControls()
        })

        renderBar(num, action, old_s)
        scheduleDivisionTimeout(() => {
          checkCommonDenom()
          updatePlaybackControls()
        }, 650 / currentSpeed)
      }
    }

    function applyGridAnimation(
      gridContainer: HTMLElement,
      d: number,
      s: number,
      old_s: number,
      action: string
    ) {
      applyGridAnimationShared(gridContainer, d, s, old_s, action, currentSpeed)
    }

    function renderBar(num: number, action = 'none', old_s = 1) {
      const vals = getSafeValues()
      const showNL = (document.getElementById('show-nl-cb') as HTMLInputElement).checked

      const total_n = num === 1 ? vals.total_n1 : vals.total_n2
      const d = num === 1 ? vals.d1 : vals.d2
      const w = num === 1 ? vals.w1 : vals.w2
      const n = num === 1 ? vals.n1 : vals.n2
      const s = num === 1 ? s1 : s2
      const color = num === 1 ? 'var(--red)' : 'var(--blue)'

      const maxW = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--max-wholes')) || 1

      const label = document.getElementById(`label${num}`) as HTMLElement | null
      const wrap = document.getElementById(`bar${num}-wrap`) as HTMLElement | null
      const nlWrap = document.getElementById(`bar${num}-nl`) as HTMLElement | null

      if (label) {
        label.style.transition = 'opacity 0.5s'
        label.style.opacity = '1'
        label.innerHTML = getDisplayHtml(w, n * s, d * s, color)
      }

      if (wrap) {
        if (showNL) wrap.classList.add('continuous')
        else wrap.classList.remove('continuous')

        if (action === 'none') {
          wrap.innerHTML = ''
          for (let i = 0; i < maxW; i++) {
            const unit = document.createElement('div')
            unit.className = 'bar-unit'
            unit.innerHTML = `<div class="bar-fill"></div><div class="bar-grid"></div>`
            wrap.appendChild(unit)
          }
        }

        const units = wrap.querySelectorAll('.bar-unit')
        units.forEach((unit, idx) => {
          const fill = unit.querySelector('.bar-fill') as HTMLElement | null
          const grid = unit.querySelector('.bar-grid') as HTMLElement | null

          const filledParts = (total_n * s) - (idx * d * s)
          const clamped = Math.max(0, Math.min(d * s, filledParts))
          const pct = (clamped / (d * s)) * 100

          if (fill) {
            fill.style.width = `${pct}%`
            fill.style.backgroundColor = color
          }

          if (grid) applyGridAnimation(grid, d, s, old_s, action)
        })
      }

      if (nlWrap) {
        if (showNL) {
          nlWrap.style.display = 'flex'
          nlWrap.classList.add('continuous')
          nlWrap.innerHTML = ''
          for (let i = 0; i < maxW; i++) {
            const nlUnit = document.createElement('div')
            nlUnit.className = 'nl-unit'
            const currentD = d * s
            let labelsHtml = ''
            for (let k = 0; k < currentD; k++) {
              const leftPct = (k / currentD) * 100
              let valHtml = ''
              if (k === 0) {
                valHtml = `<span style="font-weight:bold; font-size:1.1rem; color:var(--dark);">${i}</span>`
              } else {
                const fracPart = `<div class="inline-frac" style="font-size:0.85em; color:var(--dark);"><span>${k}</span><div class="line"></div><span>${currentD}</span></div>`
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
        } else {
          nlWrap.style.display = 'none'
          nlWrap.innerHTML = ''
        }
      }

      if (action !== 'none') {
        const animTimeMs = (0.6 / currentSpeed) * 1000
        scheduleDivisionTimeout(() => {
          const current_s = num === 1 ? s1 : s2
          if (current_s === s) renderBar(num, 'none')
        }, 50 + animTimeMs)
      }
    }

    function checkCommonDenom() {
      if (!bar1Visible || !bar2Visible) return
      const vals = getSafeValues()
      const cd1 = vals.d1 * s1
      const cd2 = vals.d2 * s2

      isCommonDenomReady = (cd1 === cd2 && cd1 > 0)

      const ansZone = document.getElementById('bottom-answer-zone')!
      ansZone.style.opacity = '0'
      scheduleDivisionTimeout(() => { ansZone.style.display = 'none' }, 300)

      if (isCommonDenomReady) {
        clearDivisionCue()
        document.querySelectorAll<HTMLElement>('.tool-btn').forEach(btn => { btn.style.display = 'none' })
        const nl1 = document.getElementById('bar1-nl'); if (nl1) nl1.style.display = 'none'
        const nl2 = document.getElementById('bar2-nl'); if (nl2) nl2.style.display = 'none'
        ;(document.getElementById('show-nl-cb') as HTMLInputElement).disabled = true

        document.getElementById('drag-instruction')!.innerHTML = `💡 成功通分！即將開始除法演示...`
        startDivisionAnimation(cd1)
      } else {
        document.querySelectorAll<HTMLElement>('.tool-btn').forEach(btn => { btn.style.display = 'flex' })
        ;(document.getElementById('show-nl-cb') as HTMLInputElement).disabled = false
        if ((document.getElementById('show-nl-cb') as HTMLInputElement).checked) {
          const nl1 = document.getElementById('bar1-nl'); if (nl1) nl1.style.display = 'flex'
          const nl2 = document.getElementById('bar2-nl'); if (nl2) nl2.style.display = 'flex'
        }
        document.getElementById('drag-instruction')!.innerHTML = `💡 試著點擊「擴/約分」讓兩個分數的分母相同！`
        showDenominatorToolsCue()
        const bar3Row = document.getElementById('bar3-row')
        if (bar3Row) bar3Row.style.display = 'none'
        if (!(document.getElementById('show-nl-cb') as HTMLInputElement).checked) {
          const w1 = document.getElementById('bar1-wrap'); if (w1) w1.classList.remove('continuous')
          const w2 = document.getElementById('bar2-wrap'); if (w2) w2.classList.remove('continuous')
        }
      }
    }

    function startDivisionAnimation(cd: number) {
      const vals = getSafeValues()
      const P1 = vals.total_n1 * s1
      const P2 = vals.total_n2 * s2

      const wrap1 = document.getElementById('bar1-wrap')!
      const wrap2 = document.getElementById('bar2-wrap')!
      wrap1.classList.add('continuous')
      wrap2.classList.add('continuous')

      const lbl1 = document.getElementById('label1')!
      const lbl2 = document.getElementById('label2')!
      lbl1.style.opacity = '0'
      lbl2.style.opacity = '0'

      scheduleDivisionTimeout(() => {
        buildDivisorMold(wrap2, P2, cd)
        scheduleDivisionTimeout(() => {
          setupManualDragAndFill(P1, P2, cd)
        }, 1000)
      }, 800)
    }

    function buildDivisorMold(wrap: HTMLElement, P2: number, cd: number) {
      const maxW = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--max-wholes')) || 1
      const singleUnitPct = 100 / maxW
      const totalPct = (P2 / cd) * singleUnitPct

      let moldHtml = `<div id="divisor-mold" style="position:relative; width:${totalPct}%; height:50px; border:3px solid var(--blue); background:var(--blue); opacity:0.85; box-sizing:border-box; border-radius:4px; display:flex; transition: 0.3s box-shadow;">`
      for (let i = 1; i < P2; i++) {
        moldHtml += `<div style="position:absolute; top:0; left:${(i / P2) * 100}%; width:1px; height:100%; background:var(--dark);"></div>`
      }
      moldHtml += `</div>`
      wrap.innerHTML = moldHtml

      const mold = document.getElementById('divisor-mold')!
      setTimeout(() => { mold.style.boxShadow = '0 0 15px 5px rgba(52, 152, 219, 0.6)' }, 100)
      setTimeout(() => { mold.style.boxShadow = 'none' }, 600)
    }

    function setupManualDragAndFill(P1: number, P2: number, cd: number) {
      if (P2 === 0) return

      const bar3Row = document.getElementById('bar3-row')!
      bar3Row.style.display = 'flex'
      const wrap3 = document.getElementById('bar3-wrap')!
      wrap3.style.outline = 'none'
      wrap3.style.flexDirection = 'column'
      wrap3.style.alignItems = 'flex-start'
      wrap3.style.gap = '10px'
      wrap3.innerHTML = ''
      wrap3.setAttribute('data-filled', '0')
      wrap3.setAttribute('data-anims-finished', '0')

      const wrap2 = document.getElementById('bar2-wrap')!
      wrap2.classList.add('droppable-area')

      const lbl3 = document.getElementById('label3')!
      lbl3.innerHTML = `除法結果<span style="font-size:0.8rem; color:var(--dark); margin-top:5px;">(已量測的數量)</span>`
      lbl3.style.opacity = '1'

      const wrap1 = document.getElementById('bar1-wrap')!
      const maxW = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--max-wholes')) || 1

      const numMolds = Math.ceil(P1 / P2)
      const moldWidthPct = (P2 / (cd * maxW)) * 100

      const molds: HTMLElement[] = []
      for (let i = 0; i < numMolds; i++) {
        const mold = document.createElement('div')
        mold.style.width = moldWidthPct + '%'
        mold.style.height = '50px'
        mold.style.border = '3px solid var(--blue)'
        mold.style.borderRadius = '4px'
        mold.style.boxSizing = 'border-box'
        mold.style.position = 'relative'
        mold.style.display = 'flex'
        mold.style.backgroundColor = 'rgba(52, 152, 219, 0.05)'

        for (let k = 1; k < P2; k++) {
          const line = document.createElement('div')
          line.style.position = 'absolute'
          line.style.top = '0'
          line.style.left = (k / P2) * 100 + '%'
          line.style.width = '1px'
          line.style.height = '100%'
          line.style.backgroundColor = 'var(--dark)'
          line.style.zIndex = '5'
          mold.appendChild(line)
        }
        wrap3.appendChild(mold)
        molds.push(mold)
      }

      wrap1.querySelectorAll<HTMLElement>('.bar-fill').forEach(f => { f.style.visibility = 'hidden' })

      const overlay = document.createElement('div')
      overlay.id = 'drag-overlay'
      overlay.style.position = 'absolute'
      overlay.style.top = '0'
      overlay.style.left = '0'
      overlay.style.width = '100%'
      overlay.style.height = '100%'
      overlay.style.zIndex = '10'
      wrap1.style.position = 'relative'
      wrap1.insertBefore(overlay, wrap1.firstChild)

      for (let i = 0; i < numMolds; i++) {
        const size = (i === numMolds - 1 && P1 % P2 !== 0) ? (P1 % P2) : P2
        const startPiece = i * P2
        const chunkLeftPct = (startPiece / (cd * maxW)) * 100
        const chunkWidthPct = (size / (cd * maxW)) * 100

        const chunk = document.createElement('div')
        chunk.className = 'drag-block'
        chunk.id = 'div-chunk-' + i
        chunk.style.position = 'absolute'
        chunk.style.top = '0'
        chunk.style.left = chunkLeftPct + '%'
        chunk.style.width = chunkWidthPct + '%'
        chunk.style.height = '100%'
        chunk.style.backgroundColor = 'var(--red)'
        chunk.style.opacity = '0.85'
        chunk.style.border = '2px solid white'
        chunk.style.borderRadius = '4px'
        chunk.style.boxSizing = 'border-box'
        chunk.style.cursor = 'grab'
        chunk.draggable = true
        chunk.setAttribute('data-size', String(size))

        chunk.ondragstart = (e) => {
          if (e.dataTransfer) e.dataTransfer.setData('text/plain', chunk.id)
          setTimeout(() => { chunk.style.opacity = '0.4' }, 0)
        }
        chunk.ondragend = () => { chunk.style.opacity = '0.85' }
        chunk.onclick = () => { handleDropChunk(chunk.id, molds, P1, P2) }

        overlay.appendChild(chunk)
      }

      document.getElementById('drag-instruction')!.innerHTML =
        `💡 請將上方紅色的「被除數」色塊，每次拖拉（或點擊）「一整份」到第二列的「除數」圖形中來測量！`
      showDivisionDragCue()

      wrap2.ondragover = (e) => {
        e.preventDefault()
        ;(wrap2 as HTMLElement).style.boxShadow = '0 0 15px 5px rgba(52, 152, 219, 0.5)'
      }
      wrap2.ondragleave = () => { (wrap2 as HTMLElement).style.boxShadow = 'none' }
      wrap2.ondrop = (e) => {
        e.preventDefault()
        ;(wrap2 as HTMLElement).style.boxShadow = 'none'
        const id = (e as DragEvent).dataTransfer?.getData('text/plain') || ''
        if (id) handleDropChunk(id, molds, P1, P2)
      }
    }

    function handleDropChunk(
      chunkId: string,
      molds: HTMLElement[],
      P1: number,
      P2: number
    ) {
      const chunk = document.getElementById(chunkId) as HTMLElement | null
      if (!chunk || chunk.style.visibility === 'hidden') return
      clearDivisionCue()

      const wrap2 = document.getElementById('bar2-wrap')!
      const wrap3 = document.getElementById('bar3-wrap')!
      let filledCount = parseInt(wrap3.getAttribute('data-filled') || '0')
      const totalChunks = Math.ceil(P1 / P2)

      const size = parseInt(chunk.getAttribute('data-size') || '0')
      const targetMold = molds[filledCount]
      if (!targetMold) return

      const previousFilledCount = filledCount
      const previousAnimsFinished = parseInt(wrap3.getAttribute('data-anims-finished') || '0')
      let createdFill: HTMLElement | null = null

      playbackHistory.push(() => {
        hideAnswerStage()
        if (createdFill) createdFill.remove()
        chunk.style.visibility = 'visible'
        chunk.draggable = true
        chunk.style.opacity = '0.85'
        wrap3.setAttribute('data-filled', String(previousFilledCount))
        wrap3.setAttribute('data-anims-finished', String(previousAnimsFinished))
        document.getElementById('drag-instruction')!.innerHTML =
          '💡 請將上方紅色的「被除數」色塊，每次拖拉（或點擊）「一整份」到第二列的「除數」圖形中來測量！'
        showDivisionDragCue()
        updatePlaybackControls()
      })

      chunk.style.visibility = 'hidden'
      chunk.draggable = false

      filledCount++
      wrap3.setAttribute('data-filled', String(filledCount))

      const startRect = wrap2.getBoundingClientRect()
      const endRect = targetMold.getBoundingClientRect()

      const animBlock = document.createElement('div')
      animBlock.style.position = 'fixed'
      animBlock.style.top = startRect.top + 'px'
      animBlock.style.left = startRect.left + 'px'
      const animWidth = (size / P2) * endRect.width
      animBlock.style.width = animWidth + 'px'
      animBlock.style.height = endRect.height + 'px'
      animBlock.style.backgroundColor = 'var(--red)'
      animBlock.style.opacity = '0.85'
      animBlock.style.border = '2px solid white'
      animBlock.style.borderRadius = '4px'
      animBlock.style.boxSizing = 'border-box'
      animBlock.style.zIndex = '9999'
      animBlock.style.transition = 'top 2s ease-in-out, left 2s ease-in-out'
      document.body.appendChild(animBlock)
      isFillingChunk = true
      updatePlaybackControls()

      void animBlock.offsetWidth

      animBlock.style.top = endRect.top + 'px'
      animBlock.style.left = endRect.left + 'px'

      scheduleDivisionTimeout(() => {
        animBlock.remove()

        const fill = document.createElement('div')
        fill.style.position = 'absolute'
        fill.style.top = '0'
        fill.style.left = '0'
        fill.style.width = (size / P2) * 100 + '%'
        fill.style.height = '100%'
        fill.style.backgroundColor = 'var(--red)'
        fill.style.opacity = '0.85'
        fill.style.borderRight = '1px solid rgba(255,255,255,0.4)'
        createdFill = fill
        targetMold.appendChild(fill)

        let animsFinished = parseInt(wrap3.getAttribute('data-anims-finished') || '0')
        animsFinished++
        wrap3.setAttribute('data-anims-finished', String(animsFinished))

        if (animsFinished === totalChunks) {
          wrap3.style.outline = 'none'
          wrap3.style.backgroundColor = 'transparent'
          showAnswerZone(P1, P2)
        }

        isFillingChunk = false
        updatePlaybackControls()
      }, 2000)
    }

    function showAnswerZone(P1: number, P2: number) {
      const vals = getSafeValues()
      const ansZone = document.getElementById('bottom-answer-zone')!
      ansZone.style.display = 'flex'
      scheduleDivisionTimeout(() => { ansZone.style.opacity = '1' }, 50)

      document.getElementById('bot-frac1')!.innerHTML = getDisplayHtml(vals.w1, vals.n1 * s1, vals.d1 * s1, 'var(--red)')
      document.getElementById('bot-frac2')!.innerHTML = getDisplayHtml(vals.w2, vals.n2 * s2, vals.d2 * s2, 'var(--blue)')

      const exactN = vals.total_n1 * vals.d2
      const exactD = vals.total_n2 * vals.d1

      let hint = ''
      const ansWEl = document.getElementById('ans-w') as HTMLInputElement
      if (exactN >= exactD) {
        ansWEl.style.display = 'inline-block'
        hint = ' (可填帶分數或假分數)'
      } else {
        ansWEl.style.display = 'none'
        ansWEl.value = ''
      }

      document.getElementById('bot-public-unit')!.style.display = 'none'
      document.getElementById('drag-instruction')!.innerHTML =
        `💡 太棒了！全部量測完成。可以看出總共裝滿了幾「份」嗎？請填寫下方最終答案！${hint}`
      showAnchoredCue(document.querySelector('.answer-input-group') as HTMLElement | null, '填這裡')

      // suppress unused-var warning
      void P1
      void P2
    }

    function updateUI() {
      enforceInputLimits()
      updateMaxWholes()
      const vals = getSafeValues()

      s1 = 1; s2 = 1
      bar1Visible = false; bar2Visible = false
      isCommonDenomReady = false
      clearPendingDivisionTimeouts()
      clearDivisionCue()

      ;(document.getElementById('show-nl-cb') as HTMLInputElement).disabled = false

      const wpEl = document.getElementById('word-problem')!
      if (currentWordProblemTemplate) {
        const frac1Html = `<b>${getDisplayHtml(vals.w1, vals.n1, vals.d1, 'var(--red)')}</b>`
        const frac2Html = `<b>${getDisplayHtml(vals.w2, vals.n2, vals.d2, 'var(--blue)')}</b>`
        wpEl.innerHTML = currentWordProblemTemplate
          .replace(/\[FRAC1\]/g, frac1Html)
          .replace(/\[FRAC2\]/g, frac2Html)
        wpEl.style.display = 'block'
      } else {
        wpEl.style.display = 'none'
      }

      ;(document.getElementById('ans-w') as HTMLInputElement).value = ''
      ;(document.getElementById('ans-w') as HTMLInputElement).style.display = 'none'
      ;(document.getElementById('ans-num') as HTMLInputElement).value = ''
      ;(document.getElementById('ans-den') as HTMLInputElement).value = ''
      const fb = document.getElementById('feedback')!
      fb.style.opacity = '0'
      const ansZone = document.getElementById('bottom-answer-zone')!
      ansZone.style.display = 'none'
      ansZone.style.opacity = '0'
      playbackHistory.clear()

      const animArea = document.getElementById('anim-area')!
      animArea.innerHTML = `
        <div id="bar1-row" style="display:none; position:relative; width:100%; min-height:80px; align-items:center; justify-content:space-between;">
          <div id="label1" style="width:15%; text-align:center;"></div>
          <div class="bars-column">
            <div id="bar1-wrap" class="bar-wrap-container"></div>
            <div id="bar1-nl" class="nl-wrap-container" style="display:none;"></div>
          </div>
          <div class="denominator-tool-group" style="width:15%; display:flex; gap:10px; justify-content:center; flex-wrap:wrap;">
            <button class="tool-btn" onclick="window._div.applyTool(1, 'expand')">➕ 擴分</button>
            <button class="tool-btn" onclick="window._div.applyTool(1, 'simplify')">➖ 約分</button>
          </div>
        </div>
        <div id="bar2-row" style="display:none; position:relative; width:100%; min-height:80px; align-items:center; justify-content:space-between;">
          <div id="label2" style="width:15%; text-align:center;"></div>
          <div class="bars-column">
            <div id="bar2-wrap" class="bar-wrap-container"></div>
            <div id="bar2-nl" class="nl-wrap-container" style="display:none;"></div>
          </div>
          <div class="denominator-tool-group" style="width:15%; display:flex; gap:10px; justify-content:center; flex-wrap:wrap;">
            <button class="tool-btn" onclick="window._div.applyTool(2, 'expand')">➕ 擴分</button>
            <button class="tool-btn" onclick="window._div.applyTool(2, 'simplify')">➖ 約分</button>
          </div>
        </div>
        <div id="bar3-row" style="display:none; position:relative; width:100%; min-height:80px; align-items:center; justify-content:space-between; margin-top:10px; padding-top:15px; border-top:2px dashed #ccc;">
          <div id="label3" style="width:15%; text-align:center; font-weight:bold; color:var(--dark); font-size:1.1rem; display:flex; flex-direction:column; align-items:center;"></div>
          <div class="bars-column">
            <div id="bar3-wrap" class="bar-wrap-container" style="min-height:50px; border-radius:4px; transition:0.3s; flex-direction:row; align-items:center;"></div>
          </div>
          <div style="width:15%;"></div>
        </div>
      `

      renderBar(1, 'none')
      renderBar(2, 'none')
      document.getElementById('drag-instruction')!.innerHTML = `💡 點擊上方分數，顯示長條圖！`
      showDivisionNextActionCue()
      updatePlaybackControls()
    }

    function randomChallenge() {
      let d1 = Math.floor(Math.random() * 5) + 3
      let d2 = Math.floor(Math.random() * 5) + 3
      while (d2 === d1) { d2 = Math.floor(Math.random() * 5) + 3 }

      let n1 = Math.floor(Math.random() * (d1 * 2)) + 1
      let n2 = Math.floor(Math.random() * d2) + 1

      let w1: number | string = ''
      const w2 = ''

      const showWhole = (document.getElementById('show-whole-cb') as HTMLInputElement).checked
      if (showWhole && Math.random() > 0.5 && n1 >= d1) {
        w1 = Math.floor(n1 / d1)
        n1 = n1 % d1
        if (n1 === 0) n1 = 1
      }

      ;(document.getElementById('w1') as HTMLInputElement).value = w1 ? String(w1) : ''
      ;(document.getElementById('n1') as HTMLInputElement).value = String(n1)
      ;(document.getElementById('d1') as HTMLInputElement).value = String(d1)
      ;(document.getElementById('w2') as HTMLInputElement).value = w2
      ;(document.getElementById('n2') as HTMLInputElement).value = String(n2)
      ;(document.getElementById('d2') as HTMLInputElement).value = String(d2)

      currentWordProblemTemplate = wordProblemTemplates[Math.floor(Math.random() * wordProblemTemplates.length)]
      updateUI()
    }

    function autoCheck() {
      const vals = getSafeValues()
      const ansWStr = (document.getElementById('ans-w') as HTMLInputElement).value
      const ansNStr = (document.getElementById('ans-num') as HTMLInputElement).value
      const ansDStr = (document.getElementById('ans-den') as HTMLInputElement).value

      let ansW = parseInt(ansWStr) || 0
      let ansN = parseInt(ansNStr)
      let ansD = parseInt(ansDStr)

      if (ansNStr === '' && ansDStr === '') { ansN = 0; ansD = 1 }

      const fb = document.getElementById('feedback')!

      if (!isNaN(ansN) && !isNaN(ansD) && ansD !== 0) {
        const userTotalN = ansW * ansD + ansN
        const userVal = userTotalN / ansD

        const exactN = vals.total_n1 * vals.d2
        const exactD = vals.total_n2 * vals.d1
        const exactVal = exactN / exactD

        const divisor = gcd(exactN, exactD)
        const simpleImproperN = exactN / divisor
        const simpleD = exactD / divisor
        const simpleW = Math.floor(simpleImproperN / simpleD)
        const simpleMixedN = simpleImproperN % simpleD

        const currentD = vals.d1 * s1
        const leastCmD = lcm(vals.d1, vals.d2)

        if (Math.abs(userVal - exactVal) < 0.0001) {
          let isSimplest = false
          if (ansW === 0 && ansN === simpleImproperN && ansD === simpleD) isSimplest = true
          if (ansW === simpleW && ansN === simpleMixedN && ansD === simpleD) isSimplest = true
          if (ansN === 0 && ansW === simpleW && simpleMixedN === 0) isSimplest = true

          let msg = isSimplest
            ? '🎉 完全正確！這就是最終答案！'
            : '🌟 答對了數值！試試看，這個答案可以再「約分」或「轉成帶分數」喔！'

          if (currentD !== leastCmD) {
            msg += '<br><span style="color:var(--orange); font-size:1rem; font-weight:normal;">（提示：你通分時使用的分母不是最小公倍數喔！雖然算得對，但數字比較大會比較辛苦。）</span>'
          }

          fb.style.opacity = '1'
          ;(fb as HTMLElement).style.color = 'var(--success)'
          fb.innerHTML = msg
        } else {
          fb.style.opacity = '1'
          ;(fb as HTMLElement).style.color = 'var(--red)'
          fb.innerText = '👀 答案不對喔，再觀察一下總共裝滿了幾個模具？剩下不滿的佔幾個格子？'
        }
      } else {
        fb.style.opacity = '0'
      }
    }

    // ---- Expose namespace ----
    ;(window as any)._div = {
      toggleWholeNumber,
      toggleNumberLine,
      updateSpeed,
      randomChallenge,
      updateUI,
      autoCheck,
      onFrac1Click,
      onFrac2Click,
      applyTool,
      stepBackDivision,
      resetDivisionAnimation,
    }

    // ---- Init ----
    updateSpeed()
    toggleWholeNumber()
    updateUI()

    return () => {
      clearPendingDivisionTimeouts()
      clearDivisionCue()
      delete (window as any)._div
    }
  }, [])

  return (
    <div className="container">
      <AppHeader
        leftSlot={<div className="title-badge">異分母分數除法</div>}
        rightSlot={<>
          <ControlsPill
            speedId="speed-slider"
            speedLabelId="speed-val"
            onSpeedChange={() => (window as any)._div?.updateSpeed()}
          >
            <label className="checkbox-label" htmlFor="show-whole-cb">
              <input type="checkbox" id="show-whole-cb" onChange={() => (window as any)._div?.toggleWholeNumber()} /> 顯示帶分數
            </label>
            <div className="divider" />
            <label className="checkbox-label" htmlFor="show-nl-cb">
              <input type="checkbox" id="show-nl-cb" onChange={() => (window as any)._div?.toggleNumberLine()} /> 顯示數線
            </label>
          </ControlsPill>
          <LangBtn onClick={() => (window as any)._div?.randomChallenge()}>🎲 隨機出題</LangBtn>
          <GuidedTour steps={divisionTourSteps} />
        </>}
      />

      <div id="word-problem" className="word-problem" />

      <div className="answer-zone">
        <div className="formula">
          <div
            className="mixed-frac frac-btn"
            id="frac1-group"
            onClick={() => (window as any)._div?.onFrac1Click()}
            title="點擊重置並顯示被除數圖形"
          >
            <input
              type="number"
              className="whole-input"
              id="w1"
              placeholder=" "
              min={0}
              max={10}
              onInput={() => (window as any)._div?.updateUI()}
              onChange={() => (window as any)._div?.updateUI()}
            />
            <div className="frac">
              <FracInputStepper id="n1" defaultValue={2} min={1} max={100} onUpdate={() => (window as any)._div?.updateUI()} onShowBar={() => (window as any)._div?.onFrac1Click()} />
              <div className="fraction-line" />
              <FracInputStepper id="d1" defaultValue={3} min={1} max={100} onUpdate={() => (window as any)._div?.updateUI()} onShowBar={() => (window as any)._div?.onFrac1Click()} />
            </div>
          </div>
          <span>÷</span>
          <div
            className="mixed-frac frac-btn"
            id="frac2-group"
            onClick={() => (window as any)._div?.onFrac2Click()}
            title="點擊重置並顯示除數圖形"
          >
            <input
              type="number"
              className="whole-input"
              id="w2"
              placeholder=" "
              min={0}
              max={10}
              onInput={() => (window as any)._div?.updateUI()}
              onChange={() => (window as any)._div?.updateUI()}
            />
            <div className="frac">
              <FracInputStepper id="n2" defaultValue={1} min={1} max={100} onUpdate={() => (window as any)._div?.updateUI()} onShowBar={() => (window as any)._div?.onFrac2Click()} />
              <div className="fraction-line" />
              <FracInputStepper id="d2" defaultValue={2} min={1} max={100} onUpdate={() => (window as any)._div?.updateUI()} onShowBar={() => (window as any)._div?.onFrac2Click()} />
            </div>
          </div>
        </div>
      </div>

      <div className="animation-zone" id="anim-zone">
        <div id="drag-instruction" className="instruction-text">💡 準備中...</div>
        <div id="anim-area" />

        <PlaybackControlsPanel
          className="division-playback-controls"
          buttonClassName="division-playback-btn"
          buttons={[
            { id: 'division-step-back-btn', label: '上一步', onClick: () => (window as any)._div?.stepBackDivision(), disabled: true },
            { id: 'division-reset-animation-btn', label: '重看', onClick: () => (window as any)._div?.resetDivisionAnimation(), disabled: true },
          ]}
        />

        <div id="bottom-answer-zone">
          <div
            id="bot-public-unit"
            style={{ display: 'none', fontSize: '1.2rem', color: 'var(--blue)', marginBottom: 10, fontWeight: 'bold', background: '#e8f4f8', padding: '5px 15px', borderRadius: 8 }}
          />
          <div className="formula">
            <div id="bot-frac1" />
            <span>÷</span>
            <div id="bot-frac2" />
            <span>=</span>
            <div className="mixed-frac answer-input-group" style={{ cursor: 'default' }}>
              <input
                type="number"
                className="whole-input"
                id="ans-w"
                placeholder=" "
                min={0}
                onInput={() => (window as any)._div?.autoCheck()}
              />
              <div className="frac">
                <input
                  type="number"
                  className="frac-input"
                  id="ans-num"
                  placeholder="?"
                  min={0}
                  onInput={() => (window as any)._div?.autoCheck()}
                />
                <div className="fraction-line" style={{ background: '#ccc' }} />
                <input
                  type="number"
                  className="frac-input"
                  id="ans-den"
                  placeholder="?"
                  min={1}
                  onInput={() => (window as any)._div?.autoCheck()}
                />
              </div>
            </div>
          </div>
          <div id="feedback" className="feedback-msg" />
        </div>
      </div>
    </div>
  )
}
