import { useEffect } from 'react'
import './app.css'
import AppHeader from '../../shared/components/AppHeader'
import FracInputStepper from '../../shared/components/FracInputStepper'
import LangBtn from '../../shared/components/LangBtn'
import ControlsPill from '../../shared/components/ControlsPill'
import GuidedTour from '../../shared/components/GuidedTour'
import PlaybackControlsPanel from '../../shared/components/PlaybackControlsPanel'
import { observeInstructionBannerVisibility } from '../../shared/components/InstructionBannerVisibility'
import { additionGuideContent } from '../../shared/guides/addition'
import { additionTourSteps } from '../../shared/tours/addition'
import { createInstructionTracker } from '../../shared/utils/instructionStateTracker'
import { createUnitDragSystem } from '../../shared/utils/unitDragSystem'
import { createPlaybackHistory } from '../../shared/utils/playbackHistory'
import { applyGridAnimation as applyGridAnimationShared } from '../../shared/utils/gridAnimation'

export default function App() {
  useEffect(() => {
    return observeInstructionBannerVisibility({
      elementId: 'drag-instruction',
      hiddenMessages: additionGuideContent.startupHiddenMessages ?? [],
    })
  }, [])

  useEffect(() => {
    const w = window as any
    const instructionTracker = createInstructionTracker()
    const unitDragSystem = createUnitDragSystem()
    const playbackHistory = createPlaybackHistory(updatePlaybackControls)
    w.unitDragSystem = unitDragSystem // expose for debugging

    let currentWordProblemTemplate: string | null = null
    let s1 = 1
    let s2 = 1
    let bar1Visible = false
    let bar2Visible = false
    let currentSpeed = 1.0
    let bar3BlocksCount = 0
    let isCommonDenomReady = false
    let bar3WrongModeValue = 0
    let cueFollowerCleanup: (() => void) | null = null
    let playbackPlaceholderCounter = 0
    const pendingTimeouts = new Set<number>()

    // Update instruction banner whenever state changes
    instructionTracker.onStateChange(() => {
      const instructionEl = document.getElementById('drag-instruction')
      if (instructionEl) {
        instructionEl.innerHTML = instructionTracker.getMessage()
      }

    })

    const wordProblemTemplates = [
      '小明吃了 [FRAC1] 塊披薩，小紅吃了 [FRAC2] 塊。請問他們共吃了多少塊披薩？',
      '第一塊農田面積為 [FRAC1] 公頃，第二塊為 [FRAC2] 公頃。請問兩塊農田的面積共是多少公頃？',
      '媽媽買了 [FRAC1] 公斤的蘋果和 [FRAC2] 公斤的橘子。請問水果總共有多少公斤？',
      '水桶裡原有 [FRAC1] 公升的水，又加入了 [FRAC2] 公升。請問現在水桶裡共有多少公升的水？',
      '紅彩帶長 [FRAC1] 公尺，藍彩帶長 [FRAC2] 公尺。請問兩條彩帶接在一起共長多少公尺？'
    ]

    function toggleWholeNumber() {
      const showWhole = (document.getElementById('show-whole-cb') as HTMLInputElement).checked
      ;(document.getElementById('w1') as HTMLElement).style.display = showWhole ? 'inline-block' : 'none'
      ;(document.getElementById('w2') as HTMLElement).style.display = showWhole ? 'inline-block' : 'none'
      if (!showWhole) {
        ;(document.getElementById('w1') as HTMLInputElement).value = ''
        ;(document.getElementById('w2') as HTMLInputElement).value = ''
        ;(document.getElementById('ans-w') as HTMLInputElement).value = ''
      }
      updateUI()
    }

    function updateSpeed() {
      currentSpeed = parseFloat((document.getElementById('speed-slider') as HTMLInputElement).value)
      ;(document.getElementById('speed-val') as HTMLElement).innerText = currentSpeed.toFixed(1)
      const duration = 0.6 / currentSpeed
      document.documentElement.style.setProperty('--anim-time', duration + 's')
    }

    function toggleNumberLine() {
      if (bar1Visible) renderBar(1, 'none')
      if (bar2Visible) renderBar(2, 'none')
      const vals = getSafeValues()
      const cd1 = vals.d1 * s1
      const bar3Row = document.getElementById('bar3-row')!
      if (bar3Row.style.display !== 'none') {
        const wrap3 = document.getElementById('bar3-wrap')!
        const showNL = (document.getElementById('show-nl-cb') as HTMLInputElement).checked
        if (showNL) wrap3.classList.add('continuous')
        else wrap3.classList.remove('continuous')
        if (isCommonDenomReady) renderBar3NumberLine(cd1)
        else renderBar3WrongModeNumberLine()
      }
    }

    function getPlaybackButtons() {
      return {
        step: document.getElementById('addition-step-back-btn') as HTMLButtonElement | null,
        reset: document.getElementById('addition-reset-animation-btn') as HTMLButtonElement | null,
      }
    }

    function updatePlaybackControls() {
      const buttons = getPlaybackButtons()
      const bar3Row = document.getElementById('bar3-row') as HTMLElement | null
      const answerZone = document.getElementById('bottom-answer-zone') as HTMLElement | null
      const hasVisibleState = bar1Visible || bar2Visible || (bar3Row?.style.display === 'flex') || (answerZone?.style.display === 'flex')
      if (buttons.step) buttons.step.disabled = !playbackHistory.canStepBack()
      if (buttons.reset) buttons.reset.disabled = !hasVisibleState
    }

    function scheduleAdditionTimeout(callback: () => void, delayMs: number) {
      const timeoutId = window.setTimeout(() => {
        pendingTimeouts.delete(timeoutId)
        callback()
      }, delayMs)
      pendingTimeouts.add(timeoutId)
      return timeoutId
    }

    function clearPendingAdditionTimeouts() {
      pendingTimeouts.forEach((timeoutId) => window.clearTimeout(timeoutId))
      pendingTimeouts.clear()
    }

    function hideAnswerStage(clearValues = false) {
      const ansZone = document.getElementById('bottom-answer-zone') as HTMLElement | null
      if (ansZone) {
        ansZone.classList.remove('answer-zone-visible')
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

    function restoreRowsAfterUndo() {
      const row1 = document.getElementById('bar1-row') as HTMLElement | null
      const row2 = document.getElementById('bar2-row') as HTMLElement | null

      if (row1 && bar1Visible) {
        row1.style.display = 'flex'
        row1.style.opacity = '1'
      }

      if (row2 && bar2Visible) {
        row2.style.display = 'flex'
        row2.style.opacity = '1'
      }
    }

    function resetAdditionAnimation() {
      const bar3Row = document.getElementById('bar3-row') as HTMLElement | null
      const answerZone = document.getElementById('bottom-answer-zone') as HTMLElement | null
      if (!bar1Visible && !bar2Visible && !playbackHistory.canStepBack() && bar3Row?.style.display !== 'flex' && answerZone?.style.display !== 'flex') return
      clearPendingAdditionTimeouts()
      playbackHistory.clear()
      hideAnswerStage(true)
      updateUI()
      updatePlaybackControls()
    }

    function stepBackAddition() {
      clearPendingAdditionTimeouts()
      if (!playbackHistory.stepBack()) return
      hideAnswerStage()
      restoreRowsAfterUndo()
      showNextActionCue()
      updatePlaybackControls()
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

      return { w1, n1, d1, w2, n2, d2, total_n1: w1 * d1 + n1, total_n2: w2 * d2 + n2 }
    }

    function enforceInputLimits() {
      const safe = getSafeValues()
      ;(document.getElementById('d1') as HTMLInputElement).value = String(safe.d1)
      ;(document.getElementById('d2') as HTMLInputElement).value = String(safe.d2)
    }

    function updateMaxWholes() {
      const vals = getSafeValues()
      let wholes1 = Math.max(1, Math.ceil(vals.total_n1 / vals.d1))
      let wholes2 = Math.max(1, Math.ceil(vals.total_n2 / vals.d2))
      let maxW = Math.max(wholes1, wholes2)
      const sumN = vals.total_n1 * vals.d2 + vals.total_n2 * vals.d1
      const sumD = vals.d1 * vals.d2
      const wholesSum = Math.max(1, Math.ceil(sumN / sumD))
      maxW = Math.max(maxW, wholesSum)
      document.documentElement.style.setProperty('--max-wholes', String(maxW))
    }

    function getFracHtml(n: number, d: number, color = 'inherit') {
      return `<div class="inline-frac" style="color: ${color};"><span>${n}</span><div class="line"></div><span>${d}</span></div>`
    }

    function getDisplayHtml(ww: number, n: number, d: number, color: string) {
      if (ww > 0) {
        return `<div style="display:inline-flex; align-items:center;"><span style="color:${color}; font-size:1.8rem; font-weight:bold; margin-right:4px; line-height:1;">${ww}</span>${getFracHtml(n, d, color)}</div>`
      }
      return getFracHtml(n, d, color)
    }

    function gcd(a: number, b: number): number { return b ? gcd(b, a % b) : a }
    function lcm(a: number, b: number) { return (a * b) / gcd(a, b) }

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
      const cue = document.getElementById('addition-hand-cue')
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
      if (target.classList.contains('tool-btn') || target.closest('.denominator-tool-group')) return 'tool'
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
      cue.id = 'addition-hand-cue'
      cue.className = 'addition-hand-cue'
      cue.innerHTML = `<span class="addition-hand-icon">${icon}</span><span class="addition-hand-text">${text}</span>`
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

    function positionDenominatorToolsCue(cue: HTMLElement, groups: HTMLElement[]) {
      const visibleGroups = groups.filter((group) => group.offsetParent !== null)
      if (visibleGroups.length === 0) return false

      const rects = visibleGroups.map((group) => group.getBoundingClientRect())
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

    function showDenominatorToolsCue() {
      clearCue()
      const toolGroups = Array.from(document.querySelectorAll('.denominator-tool-group')) as HTMLElement[]
      const visibleGroups = toolGroups.filter((group) => group.offsetParent !== null)
      if (visibleGroups.length === 0) return

      visibleGroups.forEach((group) => group.classList.add('guided-next-target'))

      const cue = document.createElement('div')
      cue.id = 'addition-hand-cue'
      cue.className = 'addition-hand-cue addition-tool-cue'
      cue.innerHTML = `<span class="addition-hand-icon">👇</span><span class="addition-hand-text">調分母</span>`
      document.body.appendChild(cue)
      positionDenominatorToolsCue(cue, visibleGroups)
      followCue(() => {
        if (!document.body.contains(cue) || !positionDenominatorToolsCue(cue, visibleGroups)) {
          clearCue()
        }
      })
    }

    function showNextActionCue() {
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

      if (!isCommonDenomReady) {
        showDenominatorToolsCue()
        return
      }

      showAnchoredCue(document.getElementById('bar3-wrap') as HTMLElement | null, '拖到這裡', '👇')
    }

    function onFrac1Click() {
      if (!bar1Visible) {
        playbackHistory.push(() => {
          const row = document.getElementById('bar1-row') as HTMLElement | null
          s1 = 1
          bar1Visible = false
          isCommonDenomReady = false
          hideAnswerStage()
          if (row) {
            row.style.display = 'none'
            row.style.opacity = '1'
          }
          instructionTracker.reset()
          instructionTracker.setState('initial')
          showNextActionCue()
          updatePlaybackControls()
        })
      }

      const row = document.getElementById('bar1-row')!
      row.style.display = 'flex'
      row.style.opacity = '1'
      row.style.transition = ''
      s1 = 1
      renderBar(1, 'none')
      row.classList.remove('fade-in-slow')
      void (row as HTMLElement).offsetWidth
      row.classList.add('fade-in-slow')
      bar1Visible = true
      instructionTracker.setState('bar1_shown')
      checkCommonDenom()
      showNextActionCue()
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
          if (row) {
            row.style.display = 'none'
            row.style.opacity = '1'
          }
          if (bar1Visible) instructionTracker.setState('bar1_shown')
          else {
            instructionTracker.reset()
            instructionTracker.setState('initial')
          }
          checkCommonDenom()
          showNextActionCue()
          updatePlaybackControls()
        })
      }

      const row = document.getElementById('bar2-row')!
      row.style.display = 'flex'
      row.style.opacity = '1'
      row.style.transition = ''
      s2 = 1
      renderBar(2, 'none')
      row.classList.remove('fade-in-slow')
      void (row as HTMLElement).offsetWidth
      row.classList.add('fade-in-slow')
      bar2Visible = true
      if (bar1Visible) {
        instructionTracker.setState('bar2_shown')
      }
      checkCommonDenom()
      showNextActionCue()
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
          showNextActionCue()
          updatePlaybackControls()
        })

        renderBar(num, action, old_s)
        scheduleAdditionTimeout(() => {
          checkCommonDenom()
          showNextActionCue()
          updatePlaybackControls()
        }, 650 / currentSpeed)
      }
    }

    function applyGridAnimation(gridContainer: Element, d: number, s: number, old_s: number, action: string) {
      applyGridAnimationShared(gridContainer, d, s, old_s, action, currentSpeed)
    }

    function applyRowLayout(container: HTMLElement | null, rowWholes: number) {
      if (!container) return
      const safeRowWholes = Math.max(1, rowWholes)
      container.style.setProperty('--row-wholes', String(safeRowWholes))
      container.style.width = '100%'
    }

    function applyResultRowLayout(container: HTMLElement | null, rowWholes: number) {
      if (!container) return
      const safeRowWholes = Math.max(1, rowWholes)
      container.style.setProperty('--row-wholes', '1')
      container.style.width = '100%'
      container.classList.toggle('stacked-result-wrap', safeRowWholes > 1)
      container.classList.remove('continuous')
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

      const rowWholes = Math.max(1, Math.ceil(total_n / d))

      const label = document.getElementById(`label${num}`)
      const wrap = document.getElementById(`bar${num}-wrap`)
      const nlWrap = document.getElementById(`bar${num}-nl`)

      if (label) label.innerHTML = getDisplayHtml(w, n * s, d * s, color)

      if (wrap) {
        applyRowLayout(wrap as HTMLElement, rowWholes)
        if (showNL) wrap.classList.add('continuous')
        else wrap.classList.remove('continuous')

        if (action === 'none') {
          wrap.innerHTML = ''
          for (let i = 0; i < rowWholes; i++) {
            const unit = document.createElement('div')
            unit.className = 'bar-unit'
            unit.innerHTML = `<div class="bar-fill"></div><div class="bar-grid"></div>`
            wrap.appendChild(unit)
          }
        }

        wrap.querySelectorAll('.bar-unit').forEach((unit, idx) => {
          const fill = unit.querySelector<HTMLElement>('.bar-fill')
          const grid = unit.querySelector('.bar-grid')

          const filled_parts = (total_n * s) - (idx * d * s)
          const clamped = Math.max(0, Math.min(d * s, filled_parts))
          const pct = (clamped / (d * s)) * 100

          if (fill) { fill.style.width = `${pct}%`; fill.style.backgroundColor = color }
          if (grid) applyGridAnimation(grid, d, s, old_s, action)
        })
      }

      if (nlWrap) {
        applyRowLayout(nlWrap as HTMLElement, rowWholes)
        if (showNL) {
          nlWrap.style.display = 'flex'
          nlWrap.classList.add('continuous')
          nlWrap.innerHTML = ''
          const currentD = d * s
          for (let i = 0; i < rowWholes; i++) {
            const nlUnit = document.createElement('div')
            nlUnit.className = 'nl-unit'
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
              labelsHtml += `<div style="position: absolute; left: ${leftPct}%; top: 0px; transform: translateX(-50%); display: flex; align-items: center; justify-content: center; flex-direction: column; z-index: 5;"><div style="width: 2px; height: 6px; background: var(--dark); margin-bottom: 2px;"></div>${valHtml}</div>`
            }
            if (i === rowWholes - 1) {
              labelsHtml += `<div style="position: absolute; left: 100%; top: 0px; transform: translateX(-50%); display: flex; align-items: center; justify-content: center; flex-direction: column; z-index: 5;"><div style="width: 2px; height: 6px; background: var(--dark); margin-bottom: 2px;"></div><span style="font-weight:bold; font-size:1.1rem; color:var(--dark);">${i + 1}</span></div>`
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
        scheduleAdditionTimeout(() => {
          const current_s = num === 1 ? s1 : s2
          if (current_s === s) renderBar(num, 'none')
        }, 50 + animTimeMs)
      }
    }

    function renderBar3NumberLine(cd: number) {
      const nlWrap = document.getElementById('bar3-nl')
      if (!nlWrap) return
      const showNL = (document.getElementById('show-nl-cb') as HTMLInputElement).checked
      if (!showNL || !isCommonDenomReady) { nlWrap.style.display = 'none'; nlWrap.innerHTML = ''; return }

      nlWrap.style.display = 'flex'
      nlWrap.innerHTML = ''
      const maxW = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--max-wholes')) || 1
      applyResultRowLayout(nlWrap as HTMLElement, maxW)

      for (let i = 0; i < maxW; i++) {
        const nlUnit = document.createElement('div')
        nlUnit.className = 'nl-unit'
        let labelsHtml = ''

        for (let k = 0; k < cd; k++) {
          const totalIdx = i * cd + k
          const leftPct = (k / cd) * 100
          const isCurrentCount = totalIdx === bar3BlocksCount
          const showLabel = totalIdx <= bar3BlocksCount
          let valHtml = ''
          if (showLabel) {
            const labelColor = isCurrentCount && totalIdx !== 0 ? 'var(--red)' : 'var(--dark)'
            const labelScale = isCurrentCount && totalIdx !== 0 ? 'transform: scale(1.15); font-weight: bold; transition: 0.3s;' : 'transition: 0.3s;'
            if (k === 0) {
              valHtml = `<span style="font-weight:bold; font-size:1.1rem; color:${labelColor}; ${labelScale}">${i}</span>`
            } else {
              const fracPart = `<div class="inline-frac" style="font-size:0.85em; color:${labelColor}; ${labelScale}"><span>${k}</span><div class="line"></div><span>${cd}</span></div>`
              if (i > 0) {
                valHtml = `<div style="display: flex; align-items: center; justify-content: center;"><span style="font-weight:bold; font-size:1.05rem; margin-right:2px; color:${labelColor}; ${labelScale}">${i}</span>${fracPart}</div>`
              } else {
                valHtml = fracPart
              }
            }
          }
          const tickColor = totalIdx <= bar3BlocksCount && totalIdx !== 0 ? 'var(--red)' : 'var(--dark)'
          const tickHeight = isCurrentCount && totalIdx !== 0 ? '8px' : '6px'
          const tickWidth = isCurrentCount && totalIdx !== 0 ? '3px' : '2px'
          const zIndex = isCurrentCount ? 10 : 5
          labelsHtml += `<div style="position: absolute; left: ${leftPct}%; top: 0px; transform: translateX(-50%); display: flex; align-items: center; justify-content: center; flex-direction: column; z-index: ${zIndex};"><div style="width: ${tickWidth}; height: ${tickHeight}; background: ${tickColor}; margin-bottom: 2px; transition: 0.3s;"></div>${valHtml}</div>`
        }

        if (i === maxW - 1) {
          const maxTotalIdx = maxW * cd
          const isCurrentCount = maxTotalIdx === bar3BlocksCount
          const showLabel = maxTotalIdx <= bar3BlocksCount
          let valHtml = ''
          if (showLabel) {
            const labelColor = isCurrentCount ? 'var(--red)' : 'var(--dark)'
            const labelScale = isCurrentCount ? 'transform: scale(1.15); font-weight: bold; transition: 0.3s;' : 'transition: 0.3s;'
            valHtml = `<span style="font-weight:bold; font-size:1.1rem; color:${labelColor}; ${labelScale}">${maxW}</span>`
          }
          const tickColor = maxTotalIdx <= bar3BlocksCount ? 'var(--red)' : 'var(--dark)'
          const tickHeight = isCurrentCount ? '8px' : '6px'
          const tickWidth = isCurrentCount ? '3px' : '2px'
          const zIndex = isCurrentCount ? 10 : 5
          labelsHtml += `<div style="position: absolute; left: 100%; top: 0px; transform: translateX(-50%); display: flex; align-items: center; justify-content: center; flex-direction: column; z-index: ${zIndex};"><div style="width: ${tickWidth}; height: ${tickHeight}; background: ${tickColor}; margin-bottom: 2px; transition: 0.3s;"></div>${valHtml}</div>`
        }

        nlUnit.innerHTML = labelsHtml
        nlWrap.appendChild(nlUnit)
      }
    }

    function renderBar3WrongModeNumberLine() {
      const nlWrap = document.getElementById('bar3-nl')
      if (!nlWrap) return

      const showNL = (document.getElementById('show-nl-cb') as HTMLInputElement).checked
      if (!showNL || isCommonDenomReady) {
        nlWrap.style.display = 'none'
        nlWrap.innerHTML = ''
        return
      }

      const vals = getSafeValues()
      const firstValue = vals.total_n1 / vals.d1
      const totalValue = firstValue + (vals.total_n2 / vals.d2)
      const maxW = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--max-wholes')) || 1
      const firstLabel = getDisplayHtml(vals.w1, vals.n1 * s1, vals.d1 * s1, 'var(--red)')
      const totalLabel = `<div style="display:flex; align-items:center; justify-content:center; gap:4px;">${getDisplayHtml(vals.w1, vals.n1 * s1, vals.d1 * s1, 'var(--red)')}<span style="color:var(--dark);">+</span>${getDisplayHtml(vals.w2, vals.n2 * s2, vals.d2 * s2, 'var(--blue)')}</div>`
      const milestones = [
        { value: firstValue, label: firstLabel, color: 'var(--red)' },
        { value: totalValue, label: totalLabel, color: 'var(--blue)' },
      ]

      nlWrap.style.display = 'flex'
      nlWrap.innerHTML = ''
      applyResultRowLayout(nlWrap as HTMLElement, maxW)

      for (let i = 0; i < maxW; i++) {
        const nlUnit = document.createElement('div')
        nlUnit.className = 'nl-unit'
        let labelsHtml = `<div style="position: absolute; left: 0%; top: 0px; transform: translateX(-50%); display: flex; align-items: center; justify-content: center; flex-direction: column; z-index: 5;"><div style="width: 2px; height: 6px; background: var(--dark); margin-bottom: 2px;"></div><span style="font-weight:bold; font-size:1.1rem; color:var(--dark);">${i}</span></div>`

        milestones.forEach((milestone, index) => {
          if (milestone.value <= i || milestone.value > i + 1) return
          const leftPct = (milestone.value - i) * 100
          const isWholeBoundary = Math.abs(milestone.value - Math.round(milestone.value)) < 0.0001
          if (isWholeBoundary && leftPct !== 100) return
          labelsHtml += `<div style="position: absolute; left: ${leftPct}%; top: 0px; transform: translateX(-50%); display: flex; align-items: center; justify-content: center; flex-direction: column; z-index: ${10 + index};"><div style="width: 3px; height: 8px; background: ${milestone.color}; margin-bottom: 2px;"></div>${milestone.label}</div>`
        })

        if (i === maxW - 1) {
          labelsHtml += `<div style="position: absolute; left: 100%; top: 0px; transform: translateX(-50%); display: flex; align-items: center; justify-content: center; flex-direction: column; z-index: 5;"><div style="width: 2px; height: 6px; background: var(--dark); margin-bottom: 2px;"></div><span style="font-weight:bold; font-size:1.1rem; color:var(--dark);">${maxW}</span></div>`
        }

        nlUnit.innerHTML = labelsHtml
        nlWrap.appendChild(nlUnit)
      }
    }

    function convertBarToDraggable(num: number, cd: number, color: string) {
      const wrap = document.getElementById(`bar${num}-wrap`)!
      const vals = getSafeValues()
      const total_n = num === 1 ? vals.total_n1 : vals.total_n2
      const s = num === 1 ? s1 : s2

      wrap.querySelectorAll('.bar-unit').forEach((unit, uIdx) => {
        const fill = unit.querySelector<HTMLElement>('.bar-fill')
        if (fill) fill.style.display = 'none'

        const filled_parts = (total_n * s) - (uIdx * cd)
        const clamped = Math.max(0, Math.min(cd, filled_parts))

        Array.from(unit.childNodes).forEach(child => {
          const el = child as HTMLElement
          if (!el.classList?.contains('bar-grid') && !el.classList?.contains('bar-fill')) unit.removeChild(child)
        })

        ;(unit as HTMLElement).style.display = 'flex'
        ;(unit as HTMLElement).style.flexDirection = 'row'

        const grid = unit.querySelector('.bar-grid')

        function makeBlock(width: string, pieces: number) {
          const block = document.createElement('div')
          block.className = 'drag-block'
          block.id = `drag-${num}-${uIdx}-${Math.random().toString(36).substr(2, 5)}`
          block.style.width = width
          block.style.height = '100%'
          block.style.backgroundColor = color
          block.style.opacity = '0.85'
          block.draggable = true
          block.style.cursor = 'grab'
          block.style.position = 'relative'
          block.style.boxSizing = 'border-box'
          block.style.borderRight = isCommonDenomReady ? '1px solid rgba(255,255,255,0.4)' : 'none'
          block.style.zIndex = '1'
          block.setAttribute('data-pieces', String(pieces))

          block.ondragstart = (e) => { e.dataTransfer!.setData('text/plain', block.id); setTimeout(() => { block.style.opacity = '0.4' }, 0) }
          block.ondragend = () => { if (block.draggable) block.style.opacity = '0.85' }
          block.onclick = () => {
            if (block.draggable) {
              if (isCommonDenomReady) moveToBar3(block, cd)
              else triggerErrorMerge()
            }
          }

          if (grid) unit.insertBefore(block, grid)
          else unit.appendChild(block)
        }

        if (clamped === cd || !isCommonDenomReady) {
          makeBlock(`${(clamped / cd) * 100}%`, clamped)
        } else {
          const pieceWidth = 100 / cd
          for (let i = 0; i < clamped; i++) makeBlock(`${pieceWidth}%`, 1)
        }
      })
    }

    function triggerErrorMerge() {
      const row3 = document.getElementById('bar3-row')!
      if (row3.style.display === 'flex') return
      row3.style.display = 'flex'
      instructionTracker.setState('error_merge_shown')

      const wrap3 = document.getElementById('bar3-wrap')!
      wrap3.style.outline = '3px dashed var(--red)'
      wrap3.style.backgroundColor = '#fafafa'
      wrap3.innerHTML = ''

      const vals = getSafeValues()
      const maxW = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--max-wholes')) || 1
      applyResultRowLayout(wrap3 as HTMLElement, maxW)

      for (let i = 0; i < maxW; i++) {
        const unit = document.createElement('div')
        unit.className = 'bar-unit'
        unit.style.display = 'flex'
        unit.style.flexDirection = 'row'
        wrap3.appendChild(unit)
      }

      const label3 = document.getElementById('label3')!
      label3.innerHTML = `<div style="display:inline-flex; align-items:center;">${getDisplayHtml(vals.w1, vals.n1, vals.d1, 'var(--red)')}<span style="margin: 0 5px;">+</span>${getDisplayHtml(vals.w2, vals.n2, vals.d2, 'var(--blue)')}</div><span style="font-size:0.8rem; color:var(--red); margin-top:5px;">(分母不同，無格線)</span>`

      bar3WrongModeValue = 0

      document.querySelectorAll('.drag-block').forEach(block => {
        if (block.id.startsWith('drag-1')) moveToBar3WrongMode(block as HTMLElement)
      })
      document.querySelectorAll('.drag-block').forEach(block => {
        if (block.id.startsWith('drag-2')) moveToBar3WrongMode(block as HTMLElement)
      })

      renderBar3WrongModeNumberLine()
    }

    function moveToBar3(block: HTMLElement, cd: number) {
      instructionTracker.setState('dragging_blocks')
      const wrap3 = document.getElementById('bar3-wrap')!
      const pieces = parseInt(block.getAttribute('data-pieces') || '1') || 1
      const previousBar3BlocksCount = bar3BlocksCount
      const placeholderId = `addition-placeholder-${playbackPlaceholderCounter++}`

      const placeholder = document.createElement('div')
      placeholder.id = placeholderId
      placeholder.style.width = block.style.width
      placeholder.style.height = block.style.height
      block.parentNode!.insertBefore(placeholder, block)

      const undoMove = (createdPieces: HTMLElement[] = []) => {
        hideAnswerStage()
        restoreRowsAfterUndo()

        const currentPlaceholder = document.getElementById(placeholderId)
        createdPieces.forEach((pieceNode) => pieceNode.remove())

        if (currentPlaceholder?.parentNode) {
          currentPlaceholder.parentNode.insertBefore(block, currentPlaceholder)
          currentPlaceholder.remove()
        }

        block.style.display = ''
        block.draggable = true
        block.style.cursor = 'grab'
        block.style.opacity = '0.85'
        block.style.borderRight = isCommonDenomReady ? '1px solid rgba(255,255,255,0.4)' : 'none'
        bar3BlocksCount = previousBar3BlocksCount
        renderBar3NumberLine(cd)
        instructionTracker.setState('common_denom_ready')
        showNextActionCue()
        updatePlaybackControls()
      }

      if (pieces === cd && bar3BlocksCount % cd === 0) {
        playbackHistory.push(() => {
          undoMove()
        })

        const targetUnitIdx = Math.floor(bar3BlocksCount / cd)
        const targetUnit = wrap3.querySelectorAll('.bar-unit')[targetUnitIdx]
        if (targetUnit) {
          const grid = targetUnit.querySelector('.bar-grid')
          if (grid) targetUnit.insertBefore(block, grid)
          else targetUnit.appendChild(block)
          block.draggable = false
          block.style.cursor = 'default'
          block.style.opacity = '1'
          block.style.borderRight = '1px solid rgba(255,255,255,0.2)'
          bar3BlocksCount += pieces
        }
      } else {
        const createdPieces: HTMLElement[] = []
        playbackHistory.push(() => {
          undoMove(createdPieces)
        })

        block.style.display = 'none'
        for (let i = 0; i < pieces; i++) {
          const targetUnitIdx = Math.floor(bar3BlocksCount / cd)
          const targetUnit = wrap3.querySelectorAll('.bar-unit')[targetUnitIdx]
          if (targetUnit) {
            const pieceNode = document.createElement('div')
            pieceNode.style.width = `${100 / cd}%`
            pieceNode.style.height = '100%'
            pieceNode.style.backgroundColor = block.style.backgroundColor
            pieceNode.style.opacity = '1'
            pieceNode.style.borderRight = '1px solid rgba(255,255,255,0.2)'
            pieceNode.style.position = 'relative'
            pieceNode.style.boxSizing = 'border-box'
            pieceNode.style.zIndex = '1'
            createdPieces.push(pieceNode)
            const grid = targetUnit.querySelector('.bar-grid')
            if (grid) targetUnit.insertBefore(pieceNode, grid)
            else targetUnit.appendChild(pieceNode)
            bar3BlocksCount++
          }
        }
      }

      const vals = getSafeValues()
      const totalNeeded = (vals.total_n1 * s1) + (vals.total_n2 * s2)
      renderBar3NumberLine(cd)
      checkAllDropped(totalNeeded)
      updatePlaybackControls()
    }

    function moveToBar3WrongMode(block: HTMLElement) {
      const numStr = block.id.split('-')[1]
      const cd = numStr === '1' ? (getSafeValues().d1 * s1) : (getSafeValues().d2 * s2)
      const pieces = parseInt(block.getAttribute('data-pieces') || '1') || 1
      const blockVal = pieces / cd
      let remainingValToPlace = blockVal

      while (remainingValToPlace > 0.0001) {
        const targetUnitIdx = Math.floor(bar3WrongModeValue)
        const currentUnitFilled = bar3WrongModeValue - targetUnitIdx
        const spaceInUnit = 1.0 - currentUnitFilled
        const valToPlaceNow = Math.min(remainingValToPlace, spaceInUnit)

        const wrap3 = document.getElementById('bar3-wrap')!
        const targetUnit = wrap3.querySelectorAll('.bar-unit')[targetUnitIdx]
        if (targetUnit) {
          const pieceNode = document.createElement('div')
          pieceNode.style.width = `${valToPlaceNow * 100}%`
          pieceNode.style.height = '100%'
          pieceNode.style.backgroundColor = block.style.backgroundColor
          pieceNode.style.opacity = '1'
          pieceNode.style.borderRight = 'none'
          pieceNode.style.position = 'relative'
          pieceNode.style.boxSizing = 'border-box'
          pieceNode.style.zIndex = '1'
          targetUnit.appendChild(pieceNode)
        }
        bar3WrongModeValue += valToPlaceNow
        remainingValToPlace -= valToPlaceNow
      }

      const vals = getSafeValues()
      const totalNeededVal = (vals.total_n1 / vals.d1) + (vals.total_n2 / vals.d2)
      if (Math.abs(bar3WrongModeValue - totalNeededVal) < 0.0001) {
        instructionTracker.setState('error_merge_shown')
      }

      renderBar3WrongModeNumberLine()
    }

    function setupDragAndDrop(cd1: number, cd2: number) {
      const row3 = document.getElementById('bar3-row')!
      const wrap3 = document.getElementById('bar3-wrap')!
      const maxW = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--max-wholes')) || 1

      if (isCommonDenomReady) {
        row3.style.display = 'flex'
        wrap3.style.outline = '3px dashed var(--orange)'
        wrap3.style.backgroundColor = '#fafafa'
        wrap3.innerHTML = ''
        applyResultRowLayout(wrap3 as HTMLElement, maxW)

        for (let i = 0; i < maxW; i++) {
          const unit = document.createElement('div')
          unit.className = 'bar-unit'
          unit.style.display = 'flex'
          unit.style.flexDirection = 'row'
          const grid = document.createElement('div')
          grid.className = 'bar-grid'
          unit.appendChild(grid)
          wrap3.appendChild(unit)
        }

        const label3 = document.getElementById('label3')!
        label3.innerHTML = `合併結果<span style="font-size:0.8rem; color:var(--orange); margin-top:5px;">(點擊或拖拉)</span>`
        wrap3.querySelectorAll('.bar-grid').forEach(gridContainer => applyGridAnimation(gridContainer, cd1, 1, 1, 'none'))
        renderBar3NumberLine(cd1)
        convertBarToDraggable(1, cd1, 'var(--red)')
        convertBarToDraggable(2, cd2, 'var(--blue)')
        bar3BlocksCount = 0

        wrap3.ondragover = (e) => { 
          e.preventDefault()
          wrap3.classList.add('drag-over')
        }
        wrap3.ondragleave = () => { 
          wrap3.classList.remove('drag-over')
        }
        wrap3.ondrop = (e) => {
          e.preventDefault()
          wrap3.classList.remove('drag-over')
          const draggedId = e.dataTransfer!.getData('text/plain')
          if (!draggedId) return
          const draggedEl = document.getElementById(draggedId)
          if (draggedEl && draggedEl.classList.contains('drag-block')) moveToBar3(draggedEl, cd1)
        }

        const wrap1 = document.getElementById('bar1-wrap')!
        const wrap2 = document.getElementById('bar2-wrap')!
        wrap1.ondragover = null; wrap1.ondrop = null; wrap1.ondragleave = null
        wrap2.ondragover = null; wrap2.ondrop = null; wrap2.ondragleave = null
        updatePlaybackControls()
      } else {
        row3.style.display = 'none'
        convertBarToDraggable(1, cd1, 'var(--red)')
        convertBarToDraggable(2, cd2, 'var(--blue)')

        const wrap1 = document.getElementById('bar1-wrap')!
        const wrap2 = document.getElementById('bar2-wrap')!
        
        // Cross-bar unit dragging: allow dragging blocks between bars for exploration
        // Even without matching denominators, students can drag units to see them
        const createCrossBarDragHandlers = () => {
          const dragOverHandler = (e: DragEvent) => {
            e.preventDefault()
            const target = e.currentTarget as HTMLElement
            target.classList.add('drag-over')
            target.style.opacity = '0.7'
          }
          const dragLeaveHandler = (e: DragEvent) => {
            const target = e.currentTarget as HTMLElement
            target.classList.remove('drag-over')
            target.style.opacity = '1'
          }
          const dropHandler = (e: DragEvent) => {
            e.preventDefault()
            const target = e.currentTarget as HTMLElement
            target.classList.remove('drag-over')
            target.style.opacity = '1'
            
            const draggedId = e.dataTransfer!.getData('text/plain')
            if (!draggedId) return
            const draggedEl = document.getElementById(draggedId)
            if (!draggedEl || !draggedEl.classList.contains('drag-block')) return
            
            // If denominators don't match, show error message
            if (!isCommonDenomReady) {
              triggerErrorMerge()
            }
            // If denominators match and target is Bar1 or Bar2, still show guidance
            // but keep blocks in their original bars - they should drag to Bar3 instead
            else {
              instructionTracker.setState('dragging_blocks')
            }
          }
          return { dragOverHandler, dragLeaveHandler, dropHandler }
        }
        
        const handlers = createCrossBarDragHandlers()
        
        wrap1.ondragover = handlers.dragOverHandler
        wrap1.ondragleave = handlers.dragLeaveHandler
        wrap1.ondrop = handlers.dropHandler
        
        wrap2.ondragover = handlers.dragOverHandler
        wrap2.ondragleave = handlers.dragLeaveHandler
        wrap2.ondrop = handlers.dropHandler
        updatePlaybackControls()
      }
    }

    function checkAllDropped(totalNeeded: number) {
      if (!isCommonDenomReady) return
      if (bar3BlocksCount === totalNeeded || totalNeeded === 0) {
        instructionTracker.setState('all_merged')
        const vals = getSafeValues()
        const cd1 = vals.d1 * s1
        const bar1Row = document.getElementById('bar1-row')
        const bar2Row = document.getElementById('bar2-row')
        if (bar1Row) { bar1Row.style.transition = 'opacity 0.8s'; bar1Row.style.opacity = '0' }
        if (bar2Row) { bar2Row.style.transition = 'opacity 0.8s'; bar2Row.style.opacity = '0' }
        scheduleAdditionTimeout(() => {
          if (bar1Row) bar1Row.style.display = 'none'
          if (bar2Row) bar2Row.style.display = 'none'
        }, 800)
        const ansZone = document.getElementById('bottom-answer-zone') as HTMLElement
        ansZone.style.display = 'flex'
        ansZone.classList.remove('answer-zone-visible')
        scheduleAdditionTimeout(() => {
          ansZone.style.opacity = '1'
          ansZone.classList.add('answer-zone-visible')
          ansZone.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }, 50)
        document.getElementById('bot-frac1')!.innerHTML = getDisplayHtml(vals.w1, vals.n1 * s1, cd1, 'var(--red)')
        document.getElementById('bot-frac2')!.innerHTML = getDisplayHtml(vals.w2, vals.n2 * s2, cd1, 'var(--blue)')
        document.getElementById('bar3-wrap')!.style.outline = '3px solid transparent'

        const exactN = (vals.total_n1 * vals.d2) + (vals.total_n2 * vals.d1)
        const exactD = vals.d1 * vals.d2
        let hint = ''
        if (exactN >= exactD) {
          ;(document.getElementById('ans-w') as HTMLElement).style.display = 'inline-block'
          hint = ' (可填帶分數或假分數)'
        } else {
          ;(document.getElementById('ans-w') as HTMLElement).style.display = 'none'
          ;(document.getElementById('ans-w') as HTMLInputElement).value = ''
        }

        document.getElementById('bot-public-unit')!.innerHTML =
          `公共分數單位： <b class="answer-unit-inline">${getFracHtml(1, cd1, 'var(--dark)')}</b>`
        const promptEl = document.getElementById('answer-stage-prompt') as HTMLElement | null
        if (promptEl) promptEl.innerHTML = `合併完成，請填寫最後答案${hint}`
        showNextActionCue()
      }
    }

    function checkCommonDenom() {
      if (!bar1Visible || !bar2Visible) return
      const vals = getSafeValues()
      const cd1 = vals.d1 * s1
      const cd2 = vals.d2 * s2
      isCommonDenomReady = cd1 === cd2 && cd1 > 0
      setupDragAndDrop(cd1, cd2)
      const ansZone = document.getElementById('bottom-answer-zone') as HTMLElement
      ansZone.classList.remove('answer-zone-visible')
      ansZone.style.opacity = '0'
      scheduleAdditionTimeout(() => { ansZone.style.display = 'none' }, 300)
      if (isCommonDenomReady) {
        instructionTracker.setState('common_denom_ready')
      } else {
        instructionTracker.setState('common_denom_not_ready')
      }
      showNextActionCue()
    }

    function updateUI() {
      enforceInputLimits()
      updateMaxWholes()
      const vals = getSafeValues()
      clearPendingAdditionTimeouts()
      s1 = 1; s2 = 1; bar1Visible = false; bar2Visible = false; isCommonDenomReady = false
      instructionTracker.reset()
      instructionTracker.setState('initial')

      const wpEl = document.getElementById('word-problem')!
      if (currentWordProblemTemplate) {
        const frac1Html = `<b>${getDisplayHtml(vals.w1, vals.n1, vals.d1, 'var(--red)')}</b>`
        const frac2Html = `<b>${getDisplayHtml(vals.w2, vals.n2, vals.d2, 'var(--blue)')}</b>`
        wpEl.innerHTML = currentWordProblemTemplate.replace(/\[FRAC1\]/g, frac1Html).replace(/\[FRAC2\]/g, frac2Html)
        wpEl.style.display = 'block'
      } else {
        wpEl.style.display = 'none'
      }

      ;(document.getElementById('ans-w') as HTMLInputElement).value = ''
      ;(document.getElementById('ans-w') as HTMLElement).style.display = 'none'
      ;(document.getElementById('ans-num') as HTMLInputElement).value = ''
      ;(document.getElementById('ans-den') as HTMLInputElement).value = ''
      ;(document.getElementById('feedback') as HTMLElement).style.opacity = '0'
      const ansZone = document.getElementById('bottom-answer-zone') as HTMLElement
      ansZone.classList.remove('answer-zone-visible')
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
            <button class="tool-btn" onclick="window._add.applyTool(1,'expand')">➕ 擴分</button>
            <button class="tool-btn" onclick="window._add.applyTool(1,'simplify')">➖ 約分</button>
          </div>
        </div>
        <div id="bar2-row" style="display:none; position:relative; width:100%; min-height:80px; align-items:center; justify-content:space-between;">
          <div id="label2" style="width:15%; text-align:center;"></div>
          <div class="bars-column">
            <div id="bar2-wrap" class="bar-wrap-container"></div>
            <div id="bar2-nl" class="nl-wrap-container" style="display:none;"></div>
          </div>
          <div class="denominator-tool-group" style="width:15%; display:flex; gap:10px; justify-content:center; flex-wrap:wrap;">
            <button class="tool-btn" onclick="window._add.applyTool(2,'expand')">➕ 擴分</button>
            <button class="tool-btn" onclick="window._add.applyTool(2,'simplify')">➖ 約分</button>
          </div>
        </div>
        <div id="bar3-row" style="display:none; position:relative; width:100%; min-height:80px; align-items:center; justify-content:space-between; margin-top: 10px; padding-top: 15px; border-top: 2px dashed #ccc;">
          <div id="label3" style="width:15%; text-align:center; font-weight:bold; color:var(--dark); font-size:1.1rem; display:flex; flex-direction:column; align-items:center;">
            合併結果<span style="font-size:0.8rem; color:var(--orange); margin-top:5px;">(點擊或拖拉)</span>
          </div>
          <div class="bars-column">
            <div id="bar3-wrap" class="bar-wrap-container droppable-area" style="min-height: 50px; outline: 3px dashed var(--orange); outline-offset: 4px; border-radius: 4px; transition: 0.3s;"></div>
            <div id="bar3-nl" class="nl-wrap-container" style="display:none;"></div>
          </div>
          <div style="width:15%;"></div>
        </div>
      `

      renderBar(1, 'none')
      renderBar(2, 'none')
      showNextActionCue()
      updatePlaybackControls()
    }

    function randomChallenge() {
      let d1 = Math.floor(Math.random() * 5) + 3
      let d2 = Math.floor(Math.random() * 5) + 3
      while (d2 === d1) { d2 = Math.floor(Math.random() * 5) + 3 }
      let n1 = Math.floor(Math.random() * (d1 * 2)) + 1
      let n2 = Math.floor(Math.random() * d2) + 1
      let w1: string | number = ''

      const showWhole = (document.getElementById('show-whole-cb') as HTMLInputElement).checked
      if (showWhole && Math.random() > 0.5 && n1 >= d1) {
        w1 = Math.floor(n1 / d1)
        n1 = n1 % d1
        if (n1 === 0) n1 = 1
      }

      ;(document.getElementById('w1') as HTMLInputElement).value = String(w1)
      ;(document.getElementById('n1') as HTMLInputElement).value = String(n1)
      ;(document.getElementById('d1') as HTMLInputElement).value = String(d1)
      ;(document.getElementById('w2') as HTMLInputElement).value = ''
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

      const ansW = parseInt(ansWStr) || 0
      let ansN = parseInt(ansNStr)
      let ansD = parseInt(ansDStr)

      if (ansNStr === '' && ansDStr === '') { ansN = 0; ansD = 1 }

      const fb = document.getElementById('feedback')!

      if (!isNaN(ansN) && !isNaN(ansD) && ansD !== 0) {
        const userTotalN = ansW * ansD + ansN
        const userVal = userTotalN / ansD
        const exactN = (vals.total_n1 * vals.d2) + (vals.total_n2 * vals.d1)
        const exactD = vals.d1 * vals.d2
        const exactVal = exactN / exactD
        const divisor = gcd(exactN, exactD)
        const simpleImproperN = exactN / divisor
        const simpleD = exactD / divisor
        const simpleW = Math.floor(simpleImproperN / simpleD)
        const simpleMixedN = simpleImproperN % simpleD
        const currentD = vals.d1 * s1
        const LcmD = lcm(vals.d1, vals.d2)

        if (Math.abs(userVal - exactVal) < 0.0001) {
          let isSimplest = false
          if (ansW === 0 && ansN === simpleImproperN && ansD === simpleD) isSimplest = true
          if (ansW === simpleW && ansN === simpleMixedN && ansD === simpleD) isSimplest = true
          if (ansN === 0 && ansW === simpleW && simpleMixedN === 0) isSimplest = true

          let msg = isSimplest ? '🎉 完全正確！而且已經是最簡化的答案了！' : '🌟 答對了數值！但試試看，這個答案可以再「約分」或「轉成帶分數」喔！'
          if (currentD !== LcmD) msg += '<br><span style="color:var(--orange); font-size:1rem; font-weight:normal;">（提示：你通分時使用的分母不是最小公倍數喔！雖然算得對，但數字會比較大。）</span>'
          fb.style.opacity = '1'; fb.style.color = 'var(--success)'; fb.innerHTML = msg
        } else {
          fb.style.opacity = '1'; fb.style.color = 'var(--red)'; fb.innerText = '👀 答案不對喔，再檢查一下整數和分子相加的結果！'
        }
      } else { fb.style.opacity = '0' }
    }

    // Initialize
    updateSpeed()
    toggleWholeNumber()
    updateUI()

    // Expose namespace for all onclick handlers (innerHTML + JSX)
    w._add = {
      applyTool,
      toggleWholeNumber,
      toggleNumberLine,
      updateSpeed,
      randomChallenge,
      updateUI,
      autoCheck,
      onFrac1Click,
      onFrac2Click,
      stepBackAddition,
      resetAdditionAnimation,
    }

    return () => {
      clearPendingAdditionTimeouts()
      clearCue()
      delete w._add
    }
  }, [])

  return (
    <div className="container">
      <AppHeader
        leftSlot={<div className="title-badge">異分母分數加法</div>}
        rightSlot={<>
          <ControlsPill
            speedId="speed-slider"
            speedLabelId="speed-val"
            onSpeedChange={() => (window as any)._add?.updateSpeed()}
          >
            <label className="checkbox-label">
              <input type="checkbox" id="show-whole-cb" onChange={() => (window as any)._add?.toggleWholeNumber()} /> 顯示帶分數
            </label>
            <div className="divider" />
            <label className="checkbox-label">
              <input type="checkbox" id="show-nl-cb" onChange={() => (window as any)._add?.toggleNumberLine()} /> 顯示數線
            </label>
          </ControlsPill>
          <LangBtn onClick={() => (window as any)._add?.randomChallenge()}>🎲 隨機出題</LangBtn>
          <GuidedTour steps={additionTourSteps} />
        </>}
      />

      <div id="word-problem" className="word-problem"></div>

      <div className="answer-zone">
        <div className="formula">
          <div className="mixed-frac frac-btn" id="frac1-group" onClick={() => (window as any)._add?.onFrac1Click()}
            title="點擊重置並顯示被加數圖形">
            <input type="number" className="whole-input" id="w1" placeholder=" " min="0" max="10" title="被加數整數部分"
              onInput={() => (window as any)._add?.updateUI()} onChange={() => (window as any)._add?.updateUI()} />
            <div className="frac">
              <FracInputStepper id="n1" defaultValue={2} min={1} max={100} onUpdate={() => (window as any)._add?.updateUI()} onShowBar={() => (window as any)._add?.onFrac1Click()} />
              <div className="fraction-line"></div>
              <FracInputStepper id="d1" defaultValue={3} min={1} max={100} onUpdate={() => (window as any)._add?.updateUI()} onShowBar={() => (window as any)._add?.onFrac1Click()} />
            </div>
          </div>
          <span>+</span>
          <div className="mixed-frac frac-btn" id="frac2-group" onClick={() => (window as any)._add?.onFrac2Click()}
            title="點擊重置並顯示加數圖形">
            <input type="number" className="whole-input" id="w2" placeholder=" " min="0" max="10" title="加數整數部分"
              onInput={() => (window as any)._add?.updateUI()} onChange={() => (window as any)._add?.updateUI()} />
            <div className="frac">
              <FracInputStepper id="n2" defaultValue={1} min={1} max={100} onUpdate={() => (window as any)._add?.updateUI()} onShowBar={() => (window as any)._add?.onFrac2Click()} />
              <div className="fraction-line"></div>
              <FracInputStepper id="d2" defaultValue={2} min={1} max={100} onUpdate={() => (window as any)._add?.updateUI()} onShowBar={() => (window as any)._add?.onFrac2Click()} />
            </div>
          </div>
        </div>
      </div>

      <div className="animation-zone" id="anim-zone">
        <div id="drag-instruction" className="instruction-text">💡 準備中...</div>
        <div id="anim-area"></div>

        <PlaybackControlsPanel
          className="addition-playback-controls"
          buttonClassName="addition-playback-btn"
          buttons={[
            { id: 'addition-step-back-btn', label: '上一步', onClick: () => (window as any)._add?.stepBackAddition(), disabled: true },
            { id: 'addition-reset-animation-btn', label: '重看', onClick: () => (window as any)._add?.resetAdditionAnimation(), disabled: true },
          ]}
        />

        <div id="bottom-answer-zone">
          <div className="answer-zone-header">
            <div>
              <div className="answer-zone-kicker">最後答案</div>
              <div id="answer-stage-prompt" className="answer-stage-prompt">請填寫最後答案</div>
            </div>
            <div id="bot-public-unit" className="answer-unit-badge" />
          </div>
          <div className="formula answer-formula-row">
            <div id="bot-frac1"></div>
            <span>+</span>
            <div id="bot-frac2"></div>
            <span>=</span>
            <div className="mixed-frac answer-input-group">
              <input type="number" className="whole-input" id="ans-w" placeholder=" " min="0" title="答案整數部分"
                onInput={() => (window as any)._add?.autoCheck()} />
              <div className="frac">
                <input type="number" className="frac-input" id="ans-num" placeholder="?" min="0"
                  onInput={() => (window as any)._add?.autoCheck()} />
                <div className="fraction-line answer-fraction-line"></div>
                <input type="number" className="frac-input" id="ans-den" placeholder="?" min="1"
                  onInput={() => (window as any)._add?.autoCheck()} />
              </div>
            </div>
          </div>
          <div id="feedback" className="feedback-msg"></div>
        </div>
      </div>
    </div>
  )
}
