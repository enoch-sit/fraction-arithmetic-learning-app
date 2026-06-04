import { useEffect } from 'react'
import './app.css'
import AppHeader from '../../shared/components/AppHeader'
import FracInputStepper from '../../shared/components/FracInputStepper'
import LangBtn from '../../shared/components/LangBtn'
import ControlsPill from '../../shared/components/ControlsPill'
import GuidedTour from '../../shared/components/GuidedTour'
import { observeInstructionBannerVisibility } from '../../shared/components/InstructionBannerVisibility'
import { subtractionGuideContent } from '../../shared/guides/subtraction'
import { subtractionTourSteps } from '../../shared/tours/subtraction'
import { renderPlaybackControlsPanel } from '../../shared/components/PlaybackControlsPanel'
import { applyGridAnimation as applyGridAnimationShared } from '../../shared/utils/gridAnimation'

export default function App() {
  useEffect(() => {
    return observeInstructionBannerVisibility({
      elementId: 'drag-instruction',
      hiddenMessages: subtractionGuideContent.startupHiddenMessages ?? [],
    })
  }, [])

  useEffect(() => {
    // ---- State ----
    let currentWordProblemTemplate: string | null = null
    let s1 = 1
    let s2 = 1
    let bar1Visible = false
    let bar2Visible = false
    let currentSpeed = 1.0
    let isCommonDenomReady = false
    let trashedCount = 0
    let removalTargetPieces = 0
    let isRearranged = false
    let isRemovalAnimating = false
    const showMatchStation = false
    let removalHistory: Array<{ blockId: string; removePieces: number; beforePieces: number }> = []
    let cueFollowerCleanup: (() => void) | null = null

    const wordProblemTemplates = [
      '小明原本有 [FRAC1] 塊披薩，吃掉了 [FRAC2] 塊。請問還剩下多少塊披薩？',
      '第一塊農田面積為 [FRAC1] 公頃，第二塊面積比第一塊少 [FRAC2] 公頃。請問第二塊農田的面積是多少公頃？',
      '媽媽買了 [FRAC1] 公斤的蘋果，送給鄰居 [FRAC2] 公斤。請問還剩下多少公斤？',
      '水桶裡原有 [FRAC1] 公升的水，倒出了 [FRAC2] 公升。請問現在水桶裡還剩下多少公升的水？',
      '紅彩帶長 [FRAC1] 公尺，藍彩帶長 [FRAC2] 公尺。請問紅彩帶比藍彩帶長多少公尺？',
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
      const showNL = (document.getElementById('show-nl-cb') as HTMLInputElement).checked

      // Handle all bar displays (bar1, bar2, mismatch-preview)
      const prefixes = ['bar1', 'bar2', 'mismatch-preview']

      prefixes.forEach((prefix) => {
        const wrap = document.getElementById(`${prefix}-wrap`)
        const nlWrap = document.getElementById(`${prefix}-nl`)

        if (wrap) {
          if (showNL) wrap.classList.add('continuous')
          else wrap.classList.remove('continuous')
        }

        if (nlWrap && nlWrap.innerHTML.trim() !== '') {
          if (showNL) {
            nlWrap.style.display = 'flex'
            nlWrap.classList.add('continuous')
          } else {
            nlWrap.style.display = 'none'
            nlWrap.classList.remove('continuous')
          }
        }
      })

      // Re-render bars to regenerate number lines if needed
      if (bar1Visible) renderBar(1, 'none')
      if (bar2Visible) renderBar(2, 'none')
      renderMismatchPreview()
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

    function renderMatchStation() {
      return `
        <div id="lego-match-station" class="lego-match-station match-station-disabled">
          <div id="match-red-tile" class="match-station-tile match-station-red" role="button" tabindex="0" aria-label="點擊或拖動紅色小格">
            <span>紅色一格</span>
          </div>
          <div id="match-station-btn" class="match-hand-demo" role="button" tabindex="0" aria-label="示範把紅色一格拿到藍色一格">
            <span class="match-hand-path"></span>
            <span class="match-hand-icon">🤏</span>
          </div>
          <div id="match-blue-tile" class="match-station-tile match-station-blue" role="button" tabindex="0" aria-label="點擊或拖動藍色小格">
            <span>藍色一格</span>
          </div>
        </div>
      `
    }

    function onFrac1Click() {
      const row = document.getElementById('bar1-row')!
      row.style.display = 'flex'
      s1 = 1
      renderBar(1, 'none')
      row.classList.remove('fade-in-slow')
      void (row as HTMLElement).offsetWidth
      row.classList.add('fade-in-slow')
      bar1Visible = true
      updateTrashAreaVisibility()
      checkCommonDenom()
      showNextActionCue()
    }

    function onFrac2Click() {
      const row = document.getElementById('bar2-row')!
      row.style.display = 'flex'
      s2 = 1
      renderBar(2, 'none')
      row.classList.remove('fade-in-slow')
      void (row as HTMLElement).offsetWidth
      row.classList.add('fade-in-slow')
      bar2Visible = true
      updateTrashAreaVisibility()
      checkCommonDenom()
      showNextActionCue()
    }

    function applyTool(num: number, action: string) {
      let changed = false
      const old_s = num === 1 ? s1 : s2

      if (num === 1) {
        if (action === 'expand') { s1++; changed = true }
        else if (action === 'simplify' && s1 > 1) { s1--; changed = true }
      } else {
        if (action === 'expand') { s2++; changed = true }
        else if (action === 'simplify' && s2 > 1) { s2--; changed = true }
      }

      if (changed) {
        renderBar(num, action, old_s)
        setTimeout(() => {
          checkCommonDenom()
          showNextActionCue()
        }, 650 / currentSpeed)
      }
    }

    function applyGridAnimation(
      gridContainer: Element,
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
      const label = document.getElementById(`label${num}`)
      const wrap = document.getElementById(`bar${num}-wrap`)
      const nlWrap = document.getElementById(`bar${num}-nl`)

      if (label) label.innerHTML = getDisplayHtml(w, n * s, d * s, color)

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
          const grid = unit.querySelector('.bar-grid')

          const piecesInUnit = d * s
          let filledPieces = total_n * s - idx * piecesInUnit
          filledPieces = Math.max(0, Math.min(filledPieces, piecesInUnit))
          const fillPct = (filledPieces / piecesInUnit) * 100

          if (fill) {
            if (action === 'none') fill.style.transition = 'none'
            else fill.style.transition = `width var(--anim-time) ease`
            fill.style.width = fillPct + '%'
            fill.style.backgroundColor = color
          }
          if (grid) applyGridAnimation(grid, d, s, old_s, action)
        })
      }

      if (nlWrap) {
        nlWrap.style.display = showNL ? 'flex' : 'none'
        if (showNL) {
          nlWrap.classList.add('continuous')
          nlWrap.innerHTML = ''
          const maxW2 = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--max-wholes')) || 1
          for (let i = 0; i < maxW2; i++) {
            const nlUnit = document.createElement('div')
            nlUnit.className = 'nl-unit'
            const piecesInUnit = d * s
            const filledPieces = Math.max(0, Math.min(total_n * s - i * piecesInUnit, piecesInUnit))
            const svg = renderNLUnit(i, d, s, filledPieces, piecesInUnit, color, maxW2)
            nlUnit.innerHTML = svg
            nlWrap.appendChild(nlUnit)
          }
        } else {
          nlWrap.classList.remove('continuous')
        }
      }
    }

    function renderNLUnit(
      idx: number,
      d: number,
      s: number,
      filledPieces: number,
      _piecesInUnit: number,
      color: string,
      maxW: number
    ) {
      const totalPieces = d * s
      const filledEnd = filledPieces / totalPieces
      const isLast = idx === maxW - 1
      const extraRight = isLast ? 20 : 0

      let svg = `<svg width="100%" height="45" viewBox="0 0 100 45" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">`
      if (filledPieces > 0) {
        svg += `<rect x="0" y="5" width="${filledEnd * 100}" height="20" fill="${color}" opacity="0.85"/>`
      }
      svg += `<line x1="0" y1="5" x2="${100 + extraRight}" y2="5" stroke="#2c3e50" stroke-width="2"/>`
      svg += `<line x1="0" y1="5" x2="0" y2="25" stroke="#2c3e50" stroke-width="2.5"/>`
      if (isLast) {
        svg += `<line x1="100" y1="5" x2="100" y2="25" stroke="#2c3e50" stroke-width="2.5"/>`
        svg += `<polygon points="${100 + extraRight},5 ${100 + extraRight - 6},2 ${100 + extraRight - 6},8" fill="#2c3e50"/>`
      }
      for (let k = 1; k < d; k++) {
        const xPct = (k / d) * 100
        svg += `<line x1="${xPct}" y1="5" x2="${xPct}" y2="25" stroke="#2c3e50" stroke-width="2"/>`
      }
      for (let k = 0; k < d; k++) {
        for (let j = 1; j < s; j++) {
          const xPct = ((k * s + j) / (d * s)) * 100
          svg += `<line x1="${xPct}" y1="5" x2="${xPct}" y2="18" stroke="#2c3e50" stroke-width="1"/>`
        }
      }
      svg += `<text x="0" y="42" font-size="10" fill="#2c3e50" text-anchor="middle">${idx}</text>`
      if (isLast) {
        svg += `<text x="100" y="42" font-size="10" fill="#2c3e50" text-anchor="middle">${idx + 1}</text>`
      }
      svg += `</svg>`
      return svg
    }

    function renderMismatchPreview() {
      const row = document.getElementById('mismatch-preview-row') as HTMLElement | null
      const label = document.getElementById('mismatch-preview-label') as HTMLElement | null
      const wrap = document.getElementById('mismatch-preview-wrap') as HTMLElement | null
      const nlWrap = document.getElementById('mismatch-preview-nl') as HTMLElement | null
      if (!row || !label || !wrap || !nlWrap) return

      if (!bar1Visible || !bar2Visible || isCommonDenomReady) {
        row.style.display = 'none'
        wrap.innerHTML = ''
        nlWrap.style.display = 'none'
        nlWrap.innerHTML = ''
        return
      }

      const vals = getSafeValues()
      const minuendValue = vals.total_n1 / vals.d1
      const subtrahendValue = vals.total_n2 / vals.d2
      const maxW = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--max-wholes')) || 1
      const showNL = (document.getElementById('show-nl-cb') as HTMLInputElement).checked
      const minuendLabel = getDisplayHtml(vals.w1, vals.n1 * s1, vals.d1 * s1, 'var(--red)')
      const subtrahendLabel = getDisplayHtml(vals.w2, vals.n2 * s2, vals.d2 * s2, 'var(--blue)')

      row.style.display = 'flex'
      label.innerHTML = `
        <div class="mismatch-preview-formula">
          <span class="mismatch-preview-frac">${minuendLabel}</span>
          <span class="mismatch-preview-operator">-</span>
          <span class="mismatch-preview-frac">${subtrahendLabel}</span>
          <span class="mismatch-preview-operator">=</span>
          <span class="mismatch-preview-question">?</span>
        </div>
      `

      wrap.innerHTML = ''
      wrap.classList.add('continuous')
      for (let idx = 0; idx < maxW; idx++) {
        const unit = document.createElement('div')
        unit.className = 'bar-unit mismatch-preview-unit'

        const unitStart = idx
        const unitEnd = idx + 1
        const blueStart = Math.max(unitStart, 0)
        const blueEnd = Math.min(unitEnd, subtrahendValue)
        const redStart = Math.max(unitStart, subtrahendValue)
        const redEnd = Math.min(unitEnd, minuendValue)

        if (blueEnd > blueStart) {
          const blueFill = document.createElement('div')
          blueFill.className = 'mismatch-preview-fill mismatch-preview-fill-blue'
          blueFill.style.left = `${((blueStart - unitStart) / (unitEnd - unitStart)) * 100}%`
          blueFill.style.width = `${((blueEnd - blueStart) / (unitEnd - unitStart)) * 100}%`
          unit.appendChild(blueFill)
        }

        if (redEnd > redStart) {
          const redFill = document.createElement('div')
          redFill.className = 'mismatch-preview-fill mismatch-preview-fill-red'
          redFill.style.left = `${((redStart - unitStart) / (unitEnd - unitStart)) * 100}%`
          redFill.style.width = `${((redEnd - redStart) / (unitEnd - unitStart)) * 100}%`
          unit.appendChild(redFill)
        }

        wrap.appendChild(unit)
      }

      if (!showNL) {
        nlWrap.style.display = 'none'
        nlWrap.innerHTML = ''
        return
      }

      nlWrap.style.display = 'flex'
      nlWrap.classList.add('continuous')
      nlWrap.innerHTML = ''

      const milestones = [
        { value: subtrahendValue, color: 'var(--blue)', label: subtrahendLabel },
        { value: minuendValue, color: 'var(--red)', label: minuendLabel },
      ]

      for (let idx = 0; idx < maxW; idx++) {
        const nlUnit = document.createElement('div')
        nlUnit.className = 'nl-unit'
        let labelsHtml = ''

        milestones.forEach(({ value, color, label: milestoneLabel }) => {
          if (value < idx || value > idx + 1) return
          const normalizedX = (value - idx) * 100
          const isIntegerTick = Math.abs(value - Math.round(value)) < 0.0001
          if (isIntegerTick && value !== 0 && value !== maxW) return
          labelsHtml += `
            <div class="mismatch-preview-milestone" style="left:${normalizedX}%; color:${color};">
              <span class="mismatch-preview-milestone-line" style="background:${color};"></span>
              <span class="mismatch-preview-milestone-label">${milestoneLabel}</span>
            </div>
          `
        })

        const isLast = idx === maxW - 1
        nlUnit.innerHTML = `
          <div class="mismatch-preview-nl-svg-wrap">${renderNLUnit(idx, 1, 1, 0, 1, 'transparent', maxW)}</div>
          ${labelsHtml}
          <div class="mismatch-preview-integer-label mismatch-preview-integer-start">${idx}</div>
          ${isLast ? `<div class="mismatch-preview-integer-label mismatch-preview-integer-end">${idx + 1}</div>` : ''}
        `
        nlWrap.appendChild(nlUnit)
      }
    }

    function renderLegoPieces(block: HTMLElement, pieceCount: number, color: string) {
      block.innerHTML = ''
      block.style.setProperty('--lego-pieces', String(Math.max(1, pieceCount)))
      block.style.setProperty('--lego-color', color)

      for (let pieceIndex = 0; pieceIndex < pieceCount; pieceIndex++) {
        const piece = document.createElement('div')
        piece.className = 'lego-piece'
        piece.style.backgroundColor = color
        block.appendChild(piece)
      }
    }

    function createSingleLegoBlock(color: string) {
      const block = document.createElement('div')
      block.className = 'drag-block single-lego-block'
      block.style.opacity = '1'
      renderLegoPieces(block, 1, color)
      return block
    }

    function convertBarToDraggable(num: number, cd: number, color: string) {
      const vals = getSafeValues()
      const total_n = num === 1 ? vals.total_n1 : vals.total_n2
      const s = num === 1 ? s1 : s2
      const wrap = document.getElementById(`bar${num}-wrap`)!
      const units = wrap.querySelectorAll('.bar-unit')

      units.forEach((unit, idx) => {
        unit.querySelectorAll('.drag-block').forEach((block) => block.remove())
        const existingFill = unit.querySelector('.bar-fill')
        if (existingFill) existingFill.remove()
        const grid = unit.querySelector('.bar-grid')

        const piecesInUnit = cd
        const remainPieces = total_n * s - idx * piecesInUnit
        const clamped = Math.max(0, Math.min(remainPieces, piecesInUnit))
        if (clamped <= 0) return

        const block = document.createElement('div')
        block.className = 'drag-block'
        block.id = `drag-${num}-${idx}`
        block.style.width = (clamped / cd * 100) + '%'
        block.style.height = '100%'
        block.style.opacity = '1'



        block.style.position = 'relative'
        block.style.boxSizing = 'border-box'
        block.style.cursor = num === 1 && isCommonDenomReady ? 'pointer' : 'default'
        block.style.borderRight = (isCommonDenomReady && clamped === cd)
          ? '1px solid rgba(255,255,255,0.4)'
          : 'none'
        block.style.zIndex = '1'
        block.setAttribute('data-pieces', String(clamped))
        block.setAttribute('data-original-pieces', String(clamped))
        renderLegoPieces(block, clamped, color)

        if (grid) unit.insertBefore(block, grid)
        else unit.appendChild(block)
      })
    }

    function triggerErrorMerge() {
      const vals = getSafeValues()
      if (vals.d1 * s1 === vals.d2 * s2) {
        checkCommonDenom()
        return
      }
      const instrEl = document.getElementById('drag-instruction')!
      instrEl.innerHTML = `⚠️ 分母不同時，不能直接一小格一小格地減。請先點擊「擴分/約分」找到相同的分母。`
      renderMismatchPreview()
    }

    function clearGuidedTarget() {
      document.querySelectorAll('.guided-next-target').forEach((element) => {
        element.classList.remove('guided-next-target')
      })
    }

    function clearRemovalCue() {
      if (cueFollowerCleanup) {
        cueFollowerCleanup()
        cueFollowerCleanup = null
      }
      const cue = document.getElementById('subtraction-hand-cue')
      if (cue) cue.remove()
      const station = document.getElementById('lego-match-station') as HTMLElement | null
      if (station) station.classList.remove('match-station-guided')
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
      if (target.id === 'trash-can' || target.closest('.trash-meter-card')) return 'bin'
      if (target.id === 'ans-w' || target.id === 'ans-num' || target.id === 'ans-den' || target.closest('#bottom-answer-zone')) return 'answer'
      if (target.classList.contains('tool-btn') || target.id.startsWith('expand-') || target.id.startsWith('simplify-')) return 'tool'
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
      } else if (role === 'tool') {
        top = rect.bottom + 10
      } else if (role === 'bin') {
        top = rect.top - cueRect.height - 12
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
      clearRemovalCue()
      if (!target) return

      target.classList.add('guided-next-target')
      const cue = document.createElement('div')
      cue.id = 'subtraction-hand-cue'
      cue.className = 'subtraction-hand-cue'
      cue.innerHTML = `<span class="subtraction-hand-icon">${icon}</span><span class="subtraction-hand-text">${text}</span>`
      document.body.appendChild(cue)
      positionCue(cue, target)
      followCue(() => {
        if (!document.body.contains(cue) || !document.body.contains(target)) {
          clearRemovalCue()
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
      clearRemovalCue()
      const toolGroups = Array.from(document.querySelectorAll('.denominator-tool-group')) as HTMLElement[]
      const visibleGroups = toolGroups.filter((group) => group.offsetParent !== null)
      if (visibleGroups.length === 0) return

      visibleGroups.forEach((group) => group.classList.add('guided-next-target'))

      const cue = document.createElement('div')
      cue.id = 'subtraction-hand-cue'
      cue.className = 'subtraction-hand-cue subtraction-tool-cue'
      cue.innerHTML = `<span class="subtraction-hand-icon">👇</span><span class="subtraction-hand-text">調分母</span>`
      document.body.appendChild(cue)
      positionDenominatorToolsCue(cue, visibleGroups)
      followCue(() => {
        if (!document.body.contains(cue) || !positionDenominatorToolsCue(cue, visibleGroups)) {
          clearRemovalCue()
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

      updateRemovalTargets(getSafeValues().d1 * s1)
    }

    function getVisibleBarBlocks(num: number, fromRight = false) {
      const blocks = Array.from(document.querySelectorAll(`[id^="drag-${num}-"]`)) as HTMLElement[]
      const visible = blocks.filter((block) => block.style.display !== 'none' && parseInt(block.getAttribute('data-pieces') || '0') > 0)
      return fromRight ? visible.reverse() : visible
    }

    function getRemainingRemovalPieces() {
      return Math.max(0, removalTargetPieces - trashedCount)
    }

    function getNextRemovalCandidate() {
      const remaining = getRemainingRemovalPieces()
      if (remaining <= 0) return null

      const pieceBlock = getVisibleBarBlocks(1, true).find((block) => parseInt(block.getAttribute('data-pieces') || '0') > 0)
      if (!pieceBlock) return null
      return { block: pieceBlock, removePieces: 1, mode: 'piece' as const }
    }

    function getRightmostPieceRect(block: HTMLElement, pieceCountOverride?: number) {
      const blockRect = block.getBoundingClientRect()
      const blockPieces = Math.max(1, pieceCountOverride ?? parseInt(block.getAttribute('data-pieces') || '1'))
      const pieceWidth = blockRect.width / blockPieces
      return {
        left: blockRect.right - pieceWidth,
        right: blockRect.right,
        top: blockRect.top,
        bottom: blockRect.bottom,
        width: pieceWidth,
        height: blockRect.height,
      }
    }

    function clearMatchHitZones() {
      document.querySelectorAll('.lego-hit-zone').forEach((zone) => zone.remove())
    }

    function setHitZone(
      block: HTMLElement | null,
      role: 'red' | 'blue',
      cd: number,
      rect: DOMRect | { left: number; top: number; width: number; height: number } | null
    ) {
      const unit = block?.closest('.bar-unit') as HTMLElement | null
      if (!block || !unit || !rect) return

      const unitRect = unit.getBoundingClientRect()
      const touchRect = inflateRect(rect, 18, 18)
      const zoneLeft = Math.max(0, touchRect.left - unitRect.left)
      const zoneTop = Math.max(0, touchRect.top - unitRect.top)
      const zoneRight = Math.min(unitRect.width, touchRect.left + touchRect.width - unitRect.left)
      const zoneBottom = Math.min(unitRect.height, touchRect.top + touchRect.height - unitRect.top)
      let zone = unit.querySelector(`.lego-hit-zone-${role}`) as HTMLElement | null
      if (!zone) {
        zone = document.createElement('div')
        zone.className = `lego-hit-zone lego-hit-zone-${role}`
        unit.appendChild(zone)
      }

      zone.style.left = `${zoneLeft}px`
      zone.style.top = `${zoneTop}px`
      zone.style.width = `${Math.max(20, zoneRight - zoneLeft)}px`
      zone.style.height = `${Math.max(20, zoneBottom - zoneTop)}px`
      zone.onpointerdown = (event) => startRemovalDrag(event, block, cd, role)
    }

    function getActiveSubtrahendCandidate() {
      const blocks = Array.from(document.querySelectorAll('#bar2-wrap .drag-block')) as HTMLElement[]
      const block = blocks.reverse().find((candidate) => {
        const piecesLeft = parseInt(candidate.getAttribute('data-subtract-left') || candidate.getAttribute('data-pieces') || '0')
        return candidate.style.display !== 'none' && piecesLeft > 0
      })
      if (!block) return null
      return {
        block,
        piecesLeft: Math.max(1, parseInt(block.getAttribute('data-subtract-left') || block.getAttribute('data-pieces') || '1')),
      }
    }

    function getActiveSubtrahendPieceRect() {
      const candidate = getActiveSubtrahendCandidate()
      return candidate ? getRightmostPieceRect(candidate.block, candidate.piecesLeft) : null
    }

    function updateLabelsDuringRemoval(cd: number) {
      const vals = getSafeValues()
      const rem1 = (vals.total_n1 * s1) - trashedCount
      const w1r = Math.floor(rem1 / cd)
      const n1r = rem1 % cd
      const label1 = document.getElementById('label1')
      if (label1) label1.innerHTML = getDisplayHtml(w1r, n1r, cd, 'var(--red)')

      const label2 = document.getElementById('label2')
      if (label2) label2.innerHTML = getDisplayHtml(vals.w2, vals.n2 * s2, cd, 'var(--blue)')
    }

    function updateSubtrahendCountdown(cd: number, durationMs = 350) {
      const row = document.getElementById('bar2-row') as HTMLElement | null
      const blocks = Array.from(document.querySelectorAll('#bar2-wrap .drag-block')) as HTMLElement[]
      if (!row || blocks.length === 0) return

      const isActive = isCommonDenomReady && removalTargetPieces > 0
      row.classList.toggle('subtrahend-countdown-active', isActive)

      let piecesLeft = isActive ? Math.max(0, removalTargetPieces - trashedCount) : Number.POSITIVE_INFINITY
      blocks.forEach((block) => {
        const originalPieces = parseInt(block.getAttribute('data-original-pieces') || block.getAttribute('data-pieces') || '0')
        const visiblePieces = isActive ? Math.max(0, Math.min(originalPieces, piecesLeft)) : originalPieces
        piecesLeft -= visiblePieces

        block.style.transition = `width ${durationMs}ms ease, opacity ${durationMs}ms ease`
        block.style.width = `${(visiblePieces / cd) * 100}%`
        block.style.opacity = visiblePieces > 0 ? '1' : '0.18'
        block.setAttribute('data-subtract-left', String(visiblePieces))
        renderLegoPieces(block, visiblePieces, 'var(--blue)')
      })
    }

    function formatRemovalDisplay(totalPieces: number, cd: number, color: string) {
      const whole = Math.floor(totalPieces / cd)
      const numerator = totalPieces % cd
      return getDisplayHtml(whole, numerator, cd, color)
    }

    function updateTrashFeedback(cd: number) {
      const card = document.querySelector('.trash-meter-card') as HTMLElement | null
      const trashArea = document.getElementById('trash-area') as HTMLElement | null
      const fill = document.getElementById('trash-meter-fill') as HTMLElement | null
      const meter = document.getElementById('trash-meter') as HTMLElement | null
      const label = document.getElementById('trash-capacity-label') as HTMLElement | null
      const tooltip = document.getElementById('trash-tooltip') as HTMLElement | null
      const progress = document.getElementById('trash-progress') as HTMLElement | null

      const ratio = removalTargetPieces > 0 ? trashedCount / removalTargetPieces : 0
      const isComplete = removalTargetPieces > 0 && trashedCount >= removalTargetPieces
      if (trashArea) trashArea.classList.toggle('trash-area-complete', isComplete)
      if (card) card.classList.toggle('trash-meter-card-complete', isComplete)
      if (meter) meter.style.setProperty('--trash-target-pieces', String(Math.max(1, removalTargetPieces)))
      if (fill) fill.style.width = `${Math.min(100, Math.max(0, ratio * 100))}%`
      if (label) label.innerHTML = isComplete
        ? `已移除：${formatRemovalDisplay(trashedCount, cd, 'var(--red)')}`
        : `要拿走：${formatRemovalDisplay(removalTargetPieces, cd, 'var(--blue)')}`
      if (tooltip) tooltip.innerHTML = isComplete
        ? ''
        : trashedCount === 0
        ? '還沒有移走任何方塊'
        : `已移走：${formatRemovalDisplay(trashedCount, cd, 'var(--red)')}`
      if (progress) progress.textContent = isComplete ? '移除完成' : `${trashedCount} / ${removalTargetPieces} 格`
    }

    function showRemovalCue() {
      clearRemovalCue()
      const candidate = getNextRemovalCandidate()
      if (!candidate) return
      const targetRect = getActiveSubtrahendPieceRect()
      if (!targetRect) return
      const demoDurationMs = 1350
      const demoCycles = 3

      const cue = document.createElement('div')
      cue.id = 'subtraction-hand-cue'
      cue.className = 'bar-grab-demo'
      cue.innerHTML = `<span class="bar-grab-path-line"></span><span class="bar-grab-carrier"><span class="bar-grab-piece"></span><span class="bar-grab-hand">🤏</span></span>`
      document.body.appendChild(cue)

      const positionBarGrabCue = () => {
        const sourceRect = getRightmostPieceRect(candidate.block)
        const activeTargetRect = getActiveSubtrahendPieceRect()
        if (!activeTargetRect) {
          clearRemovalCue()
          return
        }

        const startLeft = sourceRect.left + sourceRect.width / 2 - 22
        const startTop = sourceRect.top + sourceRect.height / 2 - 22
        const endLeft = activeTargetRect.left + activeTargetRect.width / 2 - 22
        const endTop = activeTargetRect.top + activeTargetRect.height / 2 - 22

        cue.style.left = `${startLeft}px`
        cue.style.top = `${startTop}px`
        cue.style.setProperty('--bar-grab-dx', `${endLeft - startLeft}px`)
        cue.style.setProperty('--bar-grab-dy', `${endTop - startTop}px`)
        cue.style.setProperty('--bar-grab-distance', `${Math.hypot(endLeft - startLeft, endTop - startTop)}px`)
        cue.style.setProperty('--bar-grab-angle', `${Math.atan2(endTop - startTop, endLeft - startLeft)}rad`)
      }

      positionBarGrabCue()
      followCue(() => {
        if (!document.body.contains(cue) || !document.body.contains(candidate.block)) {
          clearRemovalCue()
          return
        }
        positionBarGrabCue()
      })

      window.setTimeout(() => {
        if (document.body.contains(cue)) clearRemovalCue()
      }, (demoDurationMs * demoCycles) + 120)
    }

    function animateHandToTarget(
      sourceRect: DOMRect | { left: number; top: number; right?: number; width: number; height: number },
      targetRect: DOMRect | { left: number; top: number; width: number; height: number },
      mode: 'whole' | 'piece',
      durationMs: number
    ) {
      clearRemovalCue()
      const hand = document.createElement('div')
      hand.className = 'subtraction-hand-cue subtraction-hand-travel'
      hand.innerHTML = `<span class="subtraction-hand-icon">${mode === 'whole' ? '✋' : '👇'}</span>`
      hand.style.left = `${(sourceRect.right ?? (sourceRect.left + sourceRect.width)) - Math.min(sourceRect.width * 0.5, 56)}px`
      hand.style.top = `${sourceRect.top - 42}px`
      hand.style.transitionDuration = `${durationMs}ms`
      document.body.appendChild(hand)

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          hand.style.left = `${targetRect.left + targetRect.width / 2 - 16}px`
          hand.style.top = `${targetRect.top - 28}px`
          hand.style.opacity = '0.1'
          hand.style.transform = 'scale(0.9)'
        })
      })

      window.setTimeout(() => hand.remove(), durationMs + 80)
    }

    function animateToTarget(
      el: HTMLElement,
      targetRect: DOMRect | { left: number; top: number; width: number; height: number },
      rect: DOMRect | { left: number; top: number; width: number; height: number } | null = null,
      isClone = false,
      durationMs = 3000
    ) {
      const startRect = rect || el.getBoundingClientRect()

      const clone = isClone ? el : (el.cloneNode(true) as HTMLElement)
      if (!isClone) el.style.display = 'none'

      clone.style.position = 'fixed'
      clone.style.left = startRect.left + 'px'
      clone.style.top = startRect.top + 'px'
      clone.style.width = startRect.width + 'px'
      clone.style.height = startRect.height + 'px'
      clone.style.margin = '0'
      clone.style.zIndex = '1000'
      clone.style.transition = `all ${durationMs}ms cubic-bezier(0.25, 1, 0.5, 1)`
      clone.style.pointerEvents = 'none'
      document.body.appendChild(clone)

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          clone.style.left = (targetRect.left + targetRect.width / 2 - startRect.width / 2) + 'px'
          clone.style.top = (targetRect.top + targetRect.height / 2 - startRect.height / 2) + 'px'
          clone.style.transform = 'scale(0.1)'
          clone.style.opacity = '0'
        })
      })

      setTimeout(() => { clone.remove() }, durationMs + 50)
    }

    function isPointInsideRect(
      clientX: number,
      clientY: number,
      rect: DOMRect | { left: number; top: number; width: number; height: number }
    ) {
      return clientX >= rect.left && clientX <= rect.left + rect.width && clientY >= rect.top && clientY <= rect.top + rect.height
    }

    function clearTextSelection() {
      window.getSelection()?.removeAllRanges()
    }

    function triggerErrorMerge() {
      const instrEl = document.getElementById('drag-instruction')
      if (instrEl) {
        instrEl.innerHTML = `⚠️ 分母不同，無法直接相減！請先點擊「擴分/約分」尋找公共的分母。`
      }
      showErrorMergeBar()
    }

    function showErrorMergeBar() {
      const errArea = document.getElementById('error-merge-area') as HTMLElement | null
      if (!errArea) return
      errArea.style.display = 'flex'

      const wrap = document.getElementById('error-bar-wrap') as HTMLElement | null
      const nlWrap = document.getElementById('error-nl-wrap') as HTMLElement | null
      if (!wrap || !nlWrap) return

      const showNL = (document.getElementById('show-nl-cb') as HTMLInputElement).checked
      const vals = getSafeValues()
      const maxW = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--max-wholes')) || 1

      wrap.innerHTML = ''
      nlWrap.innerHTML = ''

      const errorLabel = document.getElementById('error-label') as HTMLElement | null
      if (errorLabel) {
        errorLabel.innerHTML = `<div style="display:flex; align-items:center; justify-content:center; gap:5px; flex-wrap:wrap; font-size:1.8rem;">${getDisplayHtml(vals.w1, vals.n1, vals.d1, 'var(--red)')}<span style="font-weight:bold; color:var(--dark); font-size:1.8rem;">-</span>${getDisplayHtml(vals.w2, vals.n2, vals.d2, 'var(--blue)')}<span style="font-weight:bold; color:var(--dark); font-size:1.8rem;">?</span></div>`
      }

      for (let i = 0; i < maxW; i++) {
        const unit = document.createElement('div')
        unit.className = 'bar-unit'
        const pct1 = Math.max(0, Math.min(100, ((vals.total_n1 - (i * vals.d1)) / vals.d1) * 100))
        const pct2 = Math.max(0, Math.min(100, ((vals.total_n2 - (i * vals.d2)) / vals.d2) * 100))

        let grids = '<div class="grid-overlay">'
        for (let k = 1; k < vals.d1; k++) {
          grids += `<div class="abs-thin-line" style="left:${(k / vals.d1) * 100}%; height: 100%; top: 0;"></div>`
        }
        for (let k = 1; k < vals.d2; k++) {
          grids += `<div class="abs-thin-line" style="left:${(k / vals.d2) * 100}%; height: 100%; top: 0;"></div>`
        }
        grids += '</div>'

        unit.innerHTML = `<div class="bar-fill" style="width: ${pct1}%; background-color: var(--red); opacity: 0.85; height: 100%; top: 0; position: absolute; left: 0; z-index: 1;"></div><div class="bar-fill" style="width: ${pct2}%; background-color: var(--blue); opacity: 0.85; height: 100%; top: 0; position: absolute; left: 0; z-index: 2;"></div>${grids}`
        wrap.appendChild(unit)

        const nlUnit = document.createElement('div')
        nlUnit.className = 'nl-unit'
        let labelsHtml = (i === 0) ? `<div style="position: absolute; left: 0%; top: 0px; transform: translateX(-50%); display: flex; flex-direction: column; align-items: center; z-index: 5;"><div style="width: 2px; height: 6px; background: var(--dark); margin-bottom: 2px;"></div><span style="font-weight:bold; font-size:1.1rem; color:var(--dark);">0</span></div>` : ''
        labelsHtml += `<div style="position: absolute; left: 100%; top: 0px; transform: translateX(-50%); display: flex; flex-direction: column; align-items: center; z-index: 5;"><div style="width: 2px; height: 6px; background: var(--dark); margin-bottom: 2px;"></div><span style="font-weight:bold; font-size:1.1rem; color:var(--dark);">${i + 1}</span></div>`

        const f1 = vals.total_n1 / vals.d1
        const f2 = vals.total_n2 / vals.d2
        if (f1 > i && f1 <= i + 1) {
          labelsHtml += `<div style="position: absolute; left: ${(f1 - i) * 100}%; top: 0px; transform: translateX(-50%); display: flex; flex-direction: column; align-items: center; z-index: 6;"><div style="width: 2px; height: 10px; background: var(--red); margin-bottom: 2px;"></div><div style="transform: scale(0.85); transform-origin: top center; background: rgba(255,255,255,0.85); border-radius: 4px; padding: 2px; white-space:nowrap;">${getDisplayHtml(vals.w1, vals.n1, vals.d1, 'var(--red)')}</div></div>`
        }
        if (f2 > i && f2 <= i + 1) {
          labelsHtml += `<div style="position: absolute; left: ${(f2 - i) * 100}%; top: 0px; transform: translateX(-50%); display: flex; flex-direction: column; align-items: center; z-index: 6;"><div style="width: 2px; height: 10px; background: var(--blue); margin-bottom: 2px;"></div><div style="transform: scale(0.85); transform-origin: top center; background: rgba(255,255,255,0.85); border-radius: 4px; padding: 2px; white-space:nowrap;">${getDisplayHtml(vals.w2, vals.n2, vals.d2, 'var(--blue)')}</div></div>`
        }
        nlUnit.innerHTML = labelsHtml
        nlWrap.appendChild(nlUnit)
      }

      if (showNL) {
        wrap.classList.add('continuous')
        nlWrap.classList.add('continuous')
        nlWrap.style.display = 'flex'
      } else {
        wrap.classList.remove('continuous')
        nlWrap.classList.remove('continuous')
        nlWrap.style.display = 'none'
      }

      errorMergeShown = true
    }

    function hideErrorMergeBar() {
      const errArea = document.getElementById('error-merge-area') as HTMLElement | null
      if (errArea) errArea.style.display = 'none'
      errorMergeShown = false
    }

    // Toggle trash area visibility based on bar visibility (Fix015)
    function updateTrashAreaVisibility() {
      const trashArea = document.getElementById('trash-area') as HTMLElement | null
      if (!trashArea) return
      
      // Show trash area only when both bars are displayed
      if (bar1Visible && bar2Visible) {
        trashArea.style.display = 'flex'
      } else {
        trashArea.style.display = 'none'
      }
    }

  // Update trash content to show two bars with equal segments (Fix016)
  function updateTrashTooltip(cd: number) {
    const tooltip = document.getElementById('trash-content') as HTMLElement | null
    if (!tooltip) return
    
    // Show empty message if nothing trashed yet
    if (trashedCount === 0 || !isCommonDenomReady) {
      tooltip.innerHTML = "<div style='text-align:center; color:#7f8c8d; padding:10px; font-weight:normal;'>目前垃圾桶是空的</div>"
      return
    }
    
    const w = Math.floor(trashedCount / cd)
    const n = trashedCount % cd
    let fracHtml = ''
    
    if (w > 0 && n === 0) {
      fracHtml = `<b>${w}</b> 個整數`
    } else if (w > 0) {
      fracHtml = `<b>${w}</b> 個整數 和 <div class="inline-frac"><span>${n}</span><div class="line"></div><span>${cd}</span></div>`
    } else {
      fracHtml = `<div class="inline-frac"><span>${n}</span><div class="line"></div><span>${cd}</span></div>`
    }
    
    // Generate mini bar with EQUAL segments (using grid-overlay)
    const genMini = (count: number, color: string) => {
      if (cd <= 0) return ''
      let html = '<div class="bar-wrap-container continuous" style="margin-top: 8px;">'
      const maxWholes = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--max-wholes')) || 1
      
      for (let i = 0; i < maxWholes; i++) {
        const fillPct = (i < Math.floor(count / cd)) 
          ? 100 
          : ((i === Math.floor(count / cd) && (count % cd) > 0) 
              ? ((count % cd) / cd) * 100 
              : 0)
        
        // Grid overlay with thin lines for EQUAL segments
        const gridLines = Array.from({length: cd - 1}, (_, k) => 
          `<div class="abs-thin-line" style="left:${((k + 1) / cd) * 100}%;"></div>`
        ).join('')
        
        html += `<div class="bar-unit" style="background: transparent;">${
          fillPct > 0 
            ? `<div class="bar-fill" style="width:${fillPct}%; background-color:${color}; opacity: 0.85;"></div>` 
            : ''
        }<div class="grid-overlay">${gridLines}</div></div>`
      }
      return html + '</div>'
    }
    
    // Show TWO bars: red (被減數) and blue (減數)
    tooltip.innerHTML = `
      <div style="margin-bottom: 15px;">
        <div style="padding: 0 15px;">
          <span style="color:var(--red); font-weight:bold;">被減數 (紅) 已丟棄: ${fracHtml}</span>
        </div>
        ${genMini(trashedCount, 'var(--red)')}
      </div>
      <div>
        <div style="padding: 0 15px;">
          <span style="color:var(--blue); font-weight:bold;">減數 (藍) 已對消: ${fracHtml}</span>
        </div>
        ${genMini(trashedCount, 'var(--blue)')}
      </div>
    `
  }
    }

    function getBarLaneDropRect(block: HTMLElement) {
      const unit = block.closest('.bar-unit') as HTMLElement | null
      const lane = (unit || block).getBoundingClientRect()
      return inflateRect(lane, 18, 18)
    }

    function getStationTile(role: 'red' | 'blue') {
      return document.getElementById(`match-${role}-tile`) as HTMLElement | null
    }

    function startStationDrag(event: PointerEvent, cd: number, source: 'red' | 'blue') {
      if (isRemovalAnimating || isRearranged || event.button !== 0) return
      const candidate = getNextRemovalCandidate()
      const blueCandidate = getActiveSubtrahendCandidate()
      if (!candidate || !blueCandidate) return

      const sourceTile = getStationTile(source)
      const targetTile = getStationTile(source === 'red' ? 'blue' : 'red')
      if (!sourceTile || !targetTile) return
      event.stopPropagation()

      const sourceRect = sourceTile.getBoundingClientRect()
      const targetRect = targetTile.getBoundingClientRect()
      const startX = event.clientX
      const startY = event.clientY
      let ghost: HTMLElement | null = null
      let hasDragged = false

      const positionGhost = (clientX: number, clientY: number) => {
        if (!ghost) return
        ghost.style.left = `${clientX - sourceRect.width / 2}px`
        ghost.style.top = `${clientY - sourceRect.height / 2}px`
      }

      const createGhost = (clientX: number, clientY: number) => {
        clearRemovalCue()
        ghost = sourceTile.cloneNode(true) as HTMLElement
        ghost.removeAttribute('id')
        ghost.classList.add('match-station-ghost')
        ghost.style.position = 'fixed'
        ghost.style.width = `${sourceRect.width}px`
        ghost.style.height = `${sourceRect.height}px`
        ghost.style.margin = '0'
        ghost.style.pointerEvents = 'none'
        ghost.style.zIndex = '10002'
        ghost.style.setProperty('--lego-pieces', '1')
        document.body.appendChild(ghost)
        sourceTile.classList.add('match-station-dragging')
        positionGhost(clientX, clientY)
      }

      const handleMove = (moveEvent: PointerEvent) => {
        if (isRemovalAnimating) return
        const distance = Math.hypot(moveEvent.clientX - startX, moveEvent.clientY - startY)
        if (!hasDragged && distance > 5) {
          hasDragged = true
          createGhost(moveEvent.clientX, moveEvent.clientY)
        }
        if (!hasDragged) return

        moveEvent.preventDefault()
        positionGhost(moveEvent.clientX, moveEvent.clientY)
        targetTile.classList.toggle('match-station-over', isPointInsideRect(moveEvent.clientX, moveEvent.clientY, targetTile.getBoundingClientRect()))
      }

      const handleEnd = (endEvent: PointerEvent) => {
        window.removeEventListener('pointermove', handleMove)
        window.removeEventListener('pointerup', handleEnd)
        window.removeEventListener('pointercancel', handleEnd)
        targetTile.classList.remove('match-station-over')

        if (!hasDragged) return
        endEvent.preventDefault()
        const droppedRect = ghost?.getBoundingClientRect()
        ghost?.remove()
        sourceTile.classList.remove('match-station-dragging')
        sourceTile.dataset.suppressClick = 'true'
        window.setTimeout(() => { delete sourceTile.dataset.suppressClick }, 0)

        if (isPointInsideRect(endEvent.clientX, endEvent.clientY, targetTile.getBoundingClientRect())) {
          executeSubtractionStep(cd, { sourceRect: droppedRect || sourceRect, targetRect, skipHand: true, skipFlight: true })
        }
      }

      window.addEventListener('pointermove', handleMove, { passive: false })
      window.addEventListener('pointerup', handleEnd)
      window.addEventListener('pointercancel', handleEnd)
    }

    function updateMatchStation(cd: number) {
      const station = document.getElementById('lego-match-station') as HTMLElement | null
      const redTile = getStationTile('red')
      const blueTile = getStationTile('blue')
      const actionCue = document.getElementById('match-station-btn') as HTMLElement | null
      const candidate = getNextRemovalCandidate()
      const blueCandidate = getActiveSubtrahendCandidate()
      const isReady = Boolean(isCommonDenomReady && candidate && blueCandidate && !isRemovalAnimating)

      if (station) station.classList.toggle('match-station-disabled', !isReady)
      if (actionCue) {
        actionCue.setAttribute('aria-disabled', String(!isReady))
        actionCue.onclick = isReady ? () => {
          const sourceRect = redTile?.getBoundingClientRect()
          const targetRect = blueTile?.getBoundingClientRect()
          executeSubtractionStep(cd, { sourceRect: sourceRect || undefined, targetRect: targetRect || undefined })
        } : null
        actionCue.onkeydown = isReady ? (event) => {
          if (event.key !== 'Enter' && event.key !== ' ') return
          event.preventDefault()
          actionCue.click()
        } : null
      }
      if (redTile) {
        redTile.onpointerdown = isReady ? (event) => startStationDrag(event, cd, 'red') : null
        redTile.onclick = isReady ? () => {
          if (redTile.dataset.suppressClick === 'true') return
          const sourceRect = redTile.getBoundingClientRect()
          const targetRect = blueTile?.getBoundingClientRect()
          executeSubtractionStep(cd, { sourceRect, targetRect: targetRect || undefined })
        } : null
        redTile.onkeydown = isReady ? (event) => {
          if (event.key !== 'Enter' && event.key !== ' ') return
          event.preventDefault()
          redTile.click()
        } : null
      }
      if (blueTile) {
        blueTile.onpointerdown = isReady ? (event) => startStationDrag(event, cd, 'blue') : null
        blueTile.onclick = isReady ? () => {
          if (blueTile.dataset.suppressClick === 'true') return
          const sourceRect = redTile?.getBoundingClientRect()
          const targetRect = blueTile.getBoundingClientRect()
          executeSubtractionStep(cd, { sourceRect: sourceRect || undefined, targetRect })
        } : null
        blueTile.onkeydown = isReady ? (event) => {
          if (event.key !== 'Enter' && event.key !== ' ') return
          event.preventDefault()
          blueTile.click()
        } : null
      }
    }

    function startRemovalDrag(event: PointerEvent, block: HTMLElement, cd: number, source: 'red' | 'blue') {
      if (isRemovalAnimating || isRearranged || event.button !== 0) return
      const candidate = getNextRemovalCandidate()
      const blueCandidate = getActiveSubtrahendCandidate()
      if (!candidate || !blueCandidate) return
      if (source === 'red' && candidate.block !== block) return
      if (source === 'blue' && blueCandidate.block !== block) return
      if (!isPointInsideRect(event.clientX, event.clientY, getBarLaneDropRect(block))) return
      event.preventDefault()
      event.stopPropagation()
      clearTextSelection()

      const targetBlock = source === 'red' ? blueCandidate.block : candidate.block
      const targetRect = source === 'red' ? getActiveSubtrahendPieceRect() : getRightmostPieceRect(candidate.block)
      if (!targetRect) return
      const getDropRect = () => getBarLaneDropRect(targetBlock)

      const startX = event.clientX
      const startY = event.clientY
      const pieceRect = source === 'red' ? getRightmostPieceRect(block) : getRightmostPieceRect(block, blueCandidate.piecesLeft)
      const dragColor = source === 'red' ? 'var(--red)' : 'var(--blue)'
      let ghost: HTMLElement | null = null
      let hasDragged = false

      const positionGhost = (clientX: number, clientY: number) => {
        if (!ghost) return
        ghost.style.left = `${clientX - pieceRect.width / 2}px`
        ghost.style.top = `${clientY - pieceRect.height / 2}px`
      }

      const createGhost = (clientX: number, clientY: number) => {
        clearRemovalCue()
        ghost = createSingleLegoBlock(dragColor)
        ghost.classList.add('removal-drag-ghost')
        ghost.style.position = 'fixed'
        ghost.style.width = `${pieceRect.width}px`
        ghost.style.height = `${pieceRect.height}px`
        ghost.style.margin = '0'
        ghost.style.pointerEvents = 'none'
        ghost.style.zIndex = '10002'
        document.body.appendChild(ghost)
        block.classList.add('dragging-source')
        positionGhost(clientX, clientY)
      }

      const handleMove = (moveEvent: PointerEvent) => {
        if (isRemovalAnimating) return
        const distance = Math.hypot(moveEvent.clientX - startX, moveEvent.clientY - startY)
        if (!hasDragged && distance > 6) {
          hasDragged = true
          createGhost(moveEvent.clientX, moveEvent.clientY)
        }
        if (!hasDragged) return

        moveEvent.preventDefault()
        clearTextSelection()
        positionGhost(moveEvent.clientX, moveEvent.clientY)
        const isOverTargetLane = isPointInsideRect(moveEvent.clientX, moveEvent.clientY, getDropRect())
        targetBlock.classList.toggle('match-target-over', isOverTargetLane)
        targetBlock.closest('.bar-unit')?.classList.toggle('bar-lane-drop-over', isOverTargetLane)
      }

      const handleEnd = (endEvent: PointerEvent) => {
        window.removeEventListener('pointermove', handleMove)
        window.removeEventListener('pointerup', handleEnd)
        window.removeEventListener('pointercancel', handleEnd)
        targetBlock.classList.remove('match-target-over')
        targetBlock.closest('.bar-unit')?.classList.remove('bar-lane-drop-over')
        clearTextSelection()

        if (!hasDragged) return

        endEvent.preventDefault()
        const droppedRect = ghost?.getBoundingClientRect()
        ghost?.remove()
        block.classList.remove('dragging-source')
        block.dataset.suppressClick = 'true'
        window.setTimeout(() => { delete block.dataset.suppressClick }, 0)

        if (isPointInsideRect(endEvent.clientX, endEvent.clientY, getDropRect())) {
          executeSubtractionStep(cd, { sourceRect: droppedRect || pieceRect, targetRect, skipHand: true, stableBarAnimation: true })
        } else {
          showRemovalCue()
        }
      }

      window.addEventListener('pointermove', handleMove, { passive: false })
      window.addEventListener('pointerup', handleEnd)
      window.addEventListener('pointercancel', handleEnd)
    }

    function updateRemovalTargets(cd: number) {
      const candidate = getNextRemovalCandidate()
      const blueCandidate = getActiveSubtrahendCandidate()
      const redRect = candidate ? getRightmostPieceRect(candidate.block) : null
      const blueRect = getActiveSubtrahendPieceRect()
      const redWrap = document.getElementById('bar1-wrap') as HTMLElement | null
      const blueWrap = document.getElementById('bar2-wrap') as HTMLElement | null

      clearMatchHitZones()

      if (redWrap) {
        redWrap.onpointerdown = isCommonDenomReady && !isRemovalAnimating && Boolean(candidate)
          ? (event) => {
            if (!candidate) return
            startRemovalDrag(event, candidate.block, cd, 'red')
          }
          : null
      }

      if (blueWrap) {
        blueWrap.onpointerdown = isCommonDenomReady && !isRemovalAnimating && Boolean(candidate && blueCandidate)
          ? (event) => {
            if (!blueCandidate) return
            startRemovalDrag(event, blueCandidate.block, cd, 'blue')
          }
          : null
      }

      getVisibleBarBlocks(1).forEach((block) => {
        const isActiveCandidate = candidate?.block === block
        block.classList.toggle('removal-source-active', isActiveCandidate)
        block.onclick = !isRemovalAnimating && isActiveCandidate
          ? () => {
            if (block.dataset.suppressClick === 'true') return
            if (isCommonDenomReady) {
              executeSubtractionStep(cd, { skipHand: true, stableBarAnimation: true })
            } else {
              triggerErrorMerge()
            }
          }
          : null
        block.onpointerdown = !isRemovalAnimating && isActiveCandidate
          ? (event) => {
            if (isCommonDenomReady) {
              startRemovalDrag(event, block, cd, 'red')
            } else {
              triggerErrorMerge()
            }
          }
          : null
      })

      ;(Array.from(document.querySelectorAll('#bar2-wrap .drag-block')) as HTMLElement[]).forEach((block) => {
        const isActiveTarget = blueCandidate?.block === block
        block.classList.toggle('match-target-active', Boolean(isActiveTarget && candidate))
        block.onpointerdown = isCommonDenomReady && !isRemovalAnimating && isActiveTarget && Boolean(candidate)
          ? (event) => startRemovalDrag(event, block, cd, 'blue')
          : null
      })

      setHitZone(candidate?.block ?? null, 'red', cd, redRect)
      setHitZone(blueCandidate?.block ?? null, 'blue', cd, blueRect)

      const trashCan = document.getElementById('trash-can') as HTMLElement | null
      if (trashCan) {
        trashCan.onclick = null
        trashCan.classList.remove('trash-can-ready')
      }

      updateMatchStation(cd)
      showRemovalCue()
    }

    function updatePlaybackControls() {
      const canStepBack = removalHistory.length > 0 && !isRemovalAnimating
      const canReset = trashedCount > 0 && !isRemovalAnimating
      const stepBtn = document.getElementById('step-back-btn') as HTMLButtonElement | null
      const resetBtn = document.getElementById('reset-animation-btn') as HTMLButtonElement | null
      if (stepBtn) stepBtn.disabled = !canStepBack
      if (resetBtn) resetBtn.disabled = !canReset
    }

    function hideAnswerStage() {
      const ansZone = document.getElementById('bottom-answer-zone') as HTMLElement | null
      if (ansZone) {
        ansZone.classList.remove('answer-zone-visible')
        ansZone.style.opacity = '0'
        ansZone.style.display = 'none'
      }
      const ansW = document.getElementById('ans-w') as HTMLInputElement | null
      const ansNum = document.getElementById('ans-num') as HTMLInputElement | null
      const ansDen = document.getElementById('ans-den') as HTMLInputElement | null
      if (ansW) ansW.value = ''
      if (ansNum) ansNum.value = ''
      if (ansDen) ansDen.value = ''
      const feedback = document.getElementById('feedback') as HTMLElement | null
      if (feedback) feedback.style.opacity = '0'
    }

    function stepBackSubtraction() {
      if (!isCommonDenomReady || isRemovalAnimating || removalHistory.length === 0) return
      const vals = getSafeValues()
      const cd = vals.d1 * s1
      const last = removalHistory.pop()!
      const block = document.getElementById(last.blockId) as HTMLElement | null
      if (!block) return

      hideAnswerStage()
      clearRemovalCue()
      document.querySelectorAll('.rearranged-block').forEach((el) => el.remove())
      isRearranged = false

      trashedCount = Math.max(0, trashedCount - last.removePieces)
      block.style.display = ''
      block.style.opacity = '1'
      block.setAttribute('data-pieces', String(last.beforePieces))
      block.style.width = `${(last.beforePieces / cd) * 100}%`
      renderLegoPieces(block, last.beforePieces, 'var(--red)')

      updateSubtrahendCountdown(cd, 250)
      updateTrashFeedback(cd)
      updateLabelsDuringRemoval(cd)
      updateRemovalTargets(cd)
      updatePlaybackControls()
    }

    function resetSubtractionAnimation() {
      if (!isCommonDenomReady || isRemovalAnimating) return
      const vals = getSafeValues()
      const cd = vals.d1 * s1
      hideAnswerStage()
      clearRemovalCue()
      document.querySelectorAll('.rearranged-block').forEach((el) => el.remove())
      const tempContainer = document.getElementById('rearrange-temp-container')
      if (tempContainer) tempContainer.remove()

      isRearranged = false
      trashedCount = 0
      removalHistory = []
      convertBarToDraggable(1, cd, 'var(--red)')
      convertBarToDraggable(2, cd, 'var(--blue)')
      updateSubtrahendCountdown(cd, 250)
      updateTrashFeedback(cd)
      updateTrashTooltip(cd)
      updateLabelsDuringRemoval(cd)
      updateRemovalTargets(cd)
      updatePlaybackControls()
    }

    function executeSubtractionStep(
      cd: number,
      options: {
        sourceRect?: DOMRect | { left: number; top: number; width: number; height: number }
        targetRect?: DOMRect | { left: number; top: number; width: number; height: number }
        skipHand?: boolean
        skipFlight?: boolean
        stableBarAnimation?: boolean
      } = {}
    ) {
      if (isRearranged || isRemovalAnimating) return
      const candidate = getNextRemovalCandidate()
      if (!candidate) return

      isRemovalAnimating = true
      updatePlaybackControls()
      updateMatchStation(cd)
      const animDuration = options.skipFlight || options.stableBarAnimation
        ? Math.max(160, 240 / currentSpeed)
        : Math.max(450, 850 / currentSpeed)
      const block = candidate.block
      const blockPieces = parseInt(block.getAttribute('data-pieces') || '0')
      const blockRect = block.getBoundingClientRect()
      const sourceRect = options.sourceRect || getRightmostPieceRect(block)
      const targetRect = options.targetRect || getActiveSubtrahendPieceRect() || sourceRect
      removalHistory.push({ blockId: block.id, removePieces: candidate.removePieces, beforePieces: blockPieces })

      if (!options.skipHand) animateHandToTarget(sourceRect, targetRect, candidate.mode, animDuration)

      if (candidate.removePieces >= blockPieces) {
        if (options.stableBarAnimation) {
          block.style.transition = `width ${animDuration}ms ease, opacity ${animDuration}ms ease`
          block.setAttribute('data-pieces', '0')
          block.style.width = '0%'
          block.style.opacity = '0.18'
          renderLegoPieces(block, 0, 'var(--red)')
        } else if (options.skipFlight) block.style.display = 'none'
        else animateToTarget(block, targetRect, sourceRect, false, animDuration)
      } else {
        const pieceWidth = blockRect.width / blockPieces
        const clip = createSingleLegoBlock('var(--red)')
        block.style.transition = `width ${animDuration}ms ease, opacity ${animDuration}ms ease`
        block.setAttribute('data-pieces', String(blockPieces - candidate.removePieces))
        block.style.width = `${((blockPieces - candidate.removePieces) / cd) * 100}%`
        renderLegoPieces(block, blockPieces - candidate.removePieces, 'var(--red)')

        clip.style.width = `${(candidate.removePieces / cd) * 100}%`
        clip.style.position = 'fixed'
        clip.style.left = `${blockRect.right - pieceWidth * candidate.removePieces}px`
        clip.style.top = `${blockRect.top}px`
        clip.style.height = `${blockRect.height}px`
        clip.style.zIndex = '9999'
        const fakeRect = {
          left: blockRect.right - pieceWidth * candidate.removePieces,
          top: blockRect.top,
          width: pieceWidth * candidate.removePieces,
          height: blockRect.height,
        }
        if (options.skipFlight || options.stableBarAnimation) clip.remove()
        else animateToTarget(clip, targetRect, sourceRect || fakeRect, true, animDuration)
      }

      trashedCount += candidate.removePieces
      updateSubtrahendCountdown(cd, animDuration)
      updateTrashFeedback(cd)
      updateTrashTooltip(cd)
      updateLabelsDuringRemoval(cd)

      if (getRemainingRemovalPieces() <= 0) {
        clearRemovalCue()
        setTimeout(() => {
          isRemovalAnimating = false
          showAnswerZone()
          updatePlaybackControls()
        }, animDuration + 50)
        return
      }

      setTimeout(() => {
        isRemovalAnimating = false
        updateRemovalTargets(cd)
        updatePlaybackControls()
      }, animDuration + 50)
    }

    function showAnswerZone() {
      const vals = getSafeValues()
      const cd1 = vals.d1 * s1
      const ansZone = document.getElementById('bottom-answer-zone')!
      ansZone.style.display = 'flex'
      ansZone.classList.remove('answer-zone-visible')
      setTimeout(() => {
        ansZone.style.opacity = '1'
        ansZone.classList.add('answer-zone-visible')
        ansZone.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 50)

      document.getElementById('bot-frac1')!.innerHTML = getDisplayHtml(vals.w1, vals.n1 * s1, cd1, 'var(--red)')
      document.getElementById('bot-frac2')!.innerHTML = getDisplayHtml(vals.w2, vals.n2 * s2, cd1, 'var(--blue)')

      const exactN = (vals.total_n1 * vals.d2) - (vals.total_n2 * vals.d1)
      const exactD = vals.d1 * vals.d2
      let hint = ''
      const ansWEl = document.getElementById('ans-w') as HTMLInputElement
      if (exactN >= exactD) {
        ansWEl.style.display = 'inline-block'
        hint = ' (可填帶分數或假分數)'
      } else {
        ansWEl.style.display = 'none'
        ansWEl.value = ''
      }

      document.getElementById('bot-public-unit')!.innerHTML =
        `公共分數單位： <b class="answer-unit-inline">${getFracHtml(1, cd1, 'var(--dark)')}</b>`
      const instructionEl = document.getElementById('drag-instruction')!
      instructionEl.classList.add('instruction-text-hidden')
      instructionEl.innerHTML = ''

      const promptEl = document.getElementById('answer-stage-prompt') as HTMLElement | null
      if (promptEl) promptEl.innerHTML = `減去完成，請填寫最後答案${hint}`

      const btn = document.getElementById('rearrange-btn') as HTMLElement | null
      if (btn) {
        btn.style.display = 'none'
        btn.innerHTML = '把剩下的排好'
        isRearranged = false
      }

      showNextActionCue()
    }

    function toggleRearrange() {
      const btn = document.getElementById('rearrange-btn')!
      if (document.getElementById('rearrange-temp-container')) return

      const animDuration = 3 / currentSpeed
      const animArea = document.getElementById('anim-area')!
      const animAreaRect = animArea.getBoundingClientRect()
      const vals = getSafeValues()
      const cd = vals.d1 * s1
      const units = document.querySelectorAll('#bar1-wrap .bar-unit')

      const originalBlocks = Array.from(
        document.querySelectorAll('#bar1-wrap .drag-block')
      ).filter(
        (b) => (b as HTMLElement).style.display !== 'none' && parseInt((b as HTMLElement).getAttribute('data-pieces')!) > 0
      ) as HTMLElement[]

      const tempContainer = document.createElement('div')
      tempContainer.id = 'rearrange-temp-container'
      tempContainer.style.position = 'absolute'
      tempContainer.style.top = '0'
      tempContainer.style.left = '0'
      tempContainer.style.width = '100%'
      tempContainer.style.height = '100%'
      tempContainer.style.pointerEvents = 'none'
      tempContainer.style.zIndex = '100'
      animArea.appendChild(tempContainer)

      if (!isRearranged) {
        let current_target_slot = 0

        originalBlocks.forEach((block) => {
          block.style.opacity = '0'
          const rect = block.getBoundingClientRect()
          const pieces = parseInt(block.getAttribute('data-pieces')!)
          const pieceWidthPx = rect.width / pieces

          for (let i = 0; i < pieces; i++) {
            const startX = rect.left + i * pieceWidthPx - animAreaRect.left
            const startY = rect.top - animAreaRect.top

            const unit_idx = Math.floor(current_target_slot / cd)
            const piece_in_unit = current_target_slot % cd

            let targetLeft = 0
            let targetTop = 0
            let targetWidth = pieceWidthPx

            const targetUnit = units[unit_idx] as HTMLElement | undefined
            if (targetUnit) {
              const unit_rect = targetUnit.getBoundingClientRect()
              targetWidth = (unit_rect.width - 6) / cd
              targetLeft = unit_rect.left + 3 + piece_in_unit * targetWidth - animAreaRect.left
              targetTop = unit_rect.top + 3 - animAreaRect.top
            }

            const chunk = document.createElement('div')
            chunk.style.position = 'absolute'
            chunk.style.left = startX + 'px'
            chunk.style.top = startY + 'px'
            chunk.style.width = pieceWidthPx + 'px'
            chunk.style.height = rect.height + 'px'
            chunk.style.backgroundColor = 'var(--red)'
            chunk.style.opacity = '0.85'
            chunk.style.transition = `all ${animDuration}s cubic-bezier(0.25, 1, 0.5, 1)`
            tempContainer.appendChild(chunk)

            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                chunk.style.left = targetLeft + 'px'
                chunk.style.top = targetTop + 'px'
                chunk.style.width = targetWidth + 'px'
              })
            })

            current_target_slot++
          }
        })

        btn.innerHTML = '看原來位置'
        isRearranged = true

        setTimeout(() => {
          if (tempContainer.parentNode) tempContainer.parentNode.removeChild(tempContainer)
          document.querySelectorAll('.rearranged-block').forEach((el) => el.remove())

          if (isRearranged) {
            const slots_to_fill = current_target_slot
            let current_fill = 0
            units.forEach((unit) => {
              const fill_in_this = Math.min(cd, slots_to_fill - current_fill)
              if (fill_in_this > 0) {
                const rBlock = document.createElement('div')
                rBlock.className = 'rearranged-block'
                rBlock.style.position = 'absolute'
                rBlock.style.left = '0'
                rBlock.style.top = '0'
                rBlock.style.height = '100%'
                rBlock.style.width = `${(fill_in_this / cd) * 100}%`
                rBlock.style.backgroundColor = 'var(--red)'
                rBlock.style.opacity = '0.85'
                rBlock.style.zIndex = '1'
                const grid = unit.querySelector('.bar-grid')
                if (grid) unit.insertBefore(rBlock, grid)
                else unit.appendChild(rBlock)
                current_fill += fill_in_this
              }
            })
          }
        }, animDuration * 1000 + 50)

      } else {
        document.querySelectorAll('.rearranged-block').forEach((el) => ((el as HTMLElement).style.display = 'none'))

        let current_target_slot = 0

        originalBlocks.forEach((block) => {
          const rect = block.getBoundingClientRect()
          const pieces = parseInt(block.getAttribute('data-pieces')!)
          const pieceWidthPx = rect.width / pieces

          for (let i = 0; i < pieces; i++) {
            const targetX = rect.left + i * pieceWidthPx - animAreaRect.left
            const targetY = rect.top - animAreaRect.top

            const unit_idx = Math.floor(current_target_slot / cd)
            const piece_in_unit = current_target_slot % cd

            let startX = 0
            let startY = 0
            let startWidth = pieceWidthPx

            const srcUnit = units[unit_idx] as HTMLElement | undefined
            if (srcUnit) {
              const unit_rect = srcUnit.getBoundingClientRect()
              startWidth = (unit_rect.width - 6) / cd
              startX = unit_rect.left + 3 + piece_in_unit * startWidth - animAreaRect.left
              startY = unit_rect.top + 3 - animAreaRect.top
            }

            const chunk = document.createElement('div')
            chunk.style.position = 'absolute'
            chunk.style.left = startX + 'px'
            chunk.style.top = startY + 'px'
            chunk.style.width = startWidth + 'px'
            chunk.style.height = rect.height + 'px'
            chunk.style.backgroundColor = 'var(--red)'
            chunk.style.opacity = '0.85'
            chunk.style.transition = `all ${animDuration}s cubic-bezier(0.25, 1, 0.5, 1)`
            tempContainer.appendChild(chunk)

            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                chunk.style.left = targetX + 'px'
                chunk.style.top = targetY + 'px'
                chunk.style.width = pieceWidthPx + 'px'
              })
            })

            current_target_slot++
          }
        })

        btn.innerHTML = '把剩下的排好'
        isRearranged = false

        setTimeout(() => {
          if (tempContainer.parentNode) tempContainer.parentNode.removeChild(tempContainer)
          document.querySelectorAll('.rearranged-block').forEach((el) => el.remove())
          if (!isRearranged) {
            originalBlocks.forEach((block) => { block.style.opacity = '0.85' })
          }
        }, animDuration * 1000 + 50)
      }
    }

    function setupSubtraction(cd1: number, cd2: number) {
      const trashArea = document.getElementById('trash-area')!
      const wrap1 = document.getElementById('bar1-wrap') as HTMLElement
      const wrap2 = document.getElementById('bar2-wrap') as HTMLElement

      if (isCommonDenomReady) {
        wrap1.ondragover = null
        wrap1.ondragleave = null
        wrap1.ondrop = null
        wrap2.ondragover = null
        wrap2.ondragleave = null
        wrap2.ondrop = null
        trashArea.style.display = 'flex'
        trashedCount = 0
        removalHistory = []
        isRemovalAnimating = false
        removalTargetPieces = getSafeValues().total_n2 * s2

        convertBarToDraggable(1, cd1, 'var(--red)')
        convertBarToDraggable(2, cd2, 'var(--blue)')
        updateSubtrahendCountdown(cd1, 0)
        updateLabelsDuringRemoval(cd1)
        updateTrashFeedback(cd1)
        updateTrashTooltip(cd1)
        updateRemovalTargets(cd1)
        updatePlaybackControls()

      } else {
        trashArea.style.display = 'none'
        removalTargetPieces = 0
        removalHistory = []
        isRemovalAnimating = false
        clearRemovalCue()
        convertBarToDraggable(1, cd1, 'var(--red)')
        convertBarToDraggable(2, cd2, 'var(--blue)')
        updateSubtrahendCountdown(cd2, 0)

        const dragOverHandler = (e: DragEvent) => {
          e.preventDefault()
          ;(e.currentTarget as HTMLElement).style.opacity = '0.7'
        }
        const dragLeaveHandler = (e: DragEvent) => {
          ;(e.currentTarget as HTMLElement).style.opacity = '1'
        }
        const dropHandler = (e: DragEvent) => {
          e.preventDefault()
          ;(e.currentTarget as HTMLElement).style.opacity = '1'
          triggerErrorMerge()
        }

        wrap1.ondragover = dragOverHandler
        wrap1.ondragleave = dragLeaveHandler
        wrap1.ondrop = dropHandler
        wrap2.ondragover = dragOverHandler
        wrap2.ondragleave = dragLeaveHandler
        wrap2.ondrop = dropHandler
        renderMismatchPreview()
      }
    }

    function checkCommonDenom() {
      if (!bar1Visible || !bar2Visible) return
      hideErrorMergeBar()
      const vals = getSafeValues()
      const cd1 = vals.d1 * s1
      const cd2 = vals.d2 * s2

      isCommonDenomReady = (cd1 === cd2 && cd1 > 0)

      setupSubtraction(cd1, cd2)

      const ansZone = document.getElementById('bottom-answer-zone')!
      ansZone.classList.remove('answer-zone-visible')
      ansZone.style.opacity = '0'
      setTimeout(() => { ansZone.style.display = 'none' }, 300)

      const btn = document.getElementById('rearrange-btn') as HTMLElement | null
      if (btn) btn.style.display = 'none'
      isRearranged = false

      const label1 = document.getElementById('label1') as HTMLElement | null
      const label2 = document.getElementById('label2') as HTMLElement | null

      if (isCommonDenomReady) {
        document.getElementById('drag-instruction')!.classList.remove('instruction-text-hidden')
        document.getElementById('drag-instruction')!.innerHTML =
          `💡 分母相同了！把紅色一小格對到藍色一小格，一格一格拿走。`
        if (label1) label1.style.opacity = '1'
        if (label2) label2.style.opacity = '1'
      } else {
        document.getElementById('drag-instruction')!.classList.remove('instruction-text-hidden')
        document.getElementById('drag-instruction')!.innerHTML =
          `💡 先把兩個分數變成相同分母，之後才能開始拿走對應的方塊。`
        if (label1) label1.style.opacity = '1'
        if (label2) label2.style.opacity = '1'
      }

      renderMismatchPreview()

      showNextActionCue()
    }

    function updateUI() {
      hideErrorMergeBar()
      const valsInput = getSafeValues()
      const val1 = valsInput.total_n1 / valsInput.d1
      const val2 = valsInput.total_n2 / valsInput.d2
      if (val1 < val2) {
        ;(document.getElementById('w1') as HTMLInputElement).value = String(valsInput.w2)
        ;(document.getElementById('n1') as HTMLInputElement).value = String(valsInput.n2)
        ;(document.getElementById('d1') as HTMLInputElement).value = String(valsInput.d2)
        ;(document.getElementById('w2') as HTMLInputElement).value = String(valsInput.w1)
        ;(document.getElementById('n2') as HTMLInputElement).value = String(valsInput.n1)
        ;(document.getElementById('d2') as HTMLInputElement).value = String(valsInput.d1)
      }

      enforceInputLimits()
      updateMaxWholes()
      const vals = getSafeValues()

      s1 = 1; s2 = 1
      bar1Visible = false; bar2Visible = false
      updateTrashAreaVisibility()
      isCommonDenomReady = false
      trashedCount = 0
      removalTargetPieces = 0
      updateTrashTooltip(vals.d1 * s1)
      clearRemovalCue()

      document.querySelectorAll('.rearranged-block').forEach((el) => el.remove())
      const tempContainer2 = document.getElementById('rearrange-temp-container')
      if (tempContainer2) tempContainer2.remove()

      const rearrangeBtn = document.getElementById('rearrange-btn')
      if (rearrangeBtn) (rearrangeBtn as HTMLElement).style.display = 'none'
      isRearranged = false
      hideErrorMergeBar()

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
      const fbEl = document.getElementById('feedback') as HTMLElement
      fbEl.style.opacity = '0'
      const ansZone = document.getElementById('bottom-answer-zone')!
      ansZone.classList.remove('answer-zone-visible')
      ansZone.style.display = 'none'
      ansZone.style.opacity = '0'

      const animArea = document.getElementById('anim-area')!
      animArea.innerHTML = `
        <div id="bar1-row" style="display:none; position:relative; width:100%; min-height:80px; align-items:center; justify-content:space-between;">
          <div id="label1" style="width:15%; text-align:center; transition: opacity 0.5s; opacity: 1;"></div>
          <div class="bars-column">
            <div id="bar1-wrap" class="bar-wrap-container"></div>
            <div id="bar1-nl" class="nl-wrap-container" style="display:none;"></div>
          </div>
          <div id="bar1-tools" class="denominator-tool-group" style="width:15%; display:flex; gap:10px; justify-content:center; flex-wrap:wrap;">
            <button id="expand-1" class="tool-btn" onclick="window._sub.applyTool(1, 'expand')">➕ 擴分</button>
            <button id="simplify-1" class="tool-btn" onclick="window._sub.applyTool(1, 'simplify')">➖ 約分</button>
          </div>
        </div>
        <div id="bar2-row" style="display:none; position:relative; width:100%; min-height:80px; align-items:center; justify-content:space-between;">
          <div id="label2" style="width:15%; text-align:center; transition: opacity 0.5s; opacity: 1;"></div>
          <div class="bars-column">
            <div id="bar2-wrap" class="bar-wrap-container"></div>
            <div id="bar2-nl" class="nl-wrap-container" style="display:none;"></div>
          </div>
          <div id="bar2-tools" class="denominator-tool-group" style="width:15%; display:flex; gap:10px; justify-content:center; flex-wrap:wrap;">
            <button id="expand-2" class="tool-btn" onclick="window._sub.applyTool(2, 'expand')">➕ 擴分</button>
            <button id="simplify-2" class="tool-btn" onclick="window._sub.applyTool(2, 'simplify')">➖ 約分</button>
          </div>
        </div>
        <div id="error-merge-area" style="display:none; position:relative; width:100%; min-height:80px; align-items:center; justify-content:space-between; background: #fff3cd; border: 2px solid #ff6b6b; border-radius: 12px; padding: 15px; margin-top: 10px; animation: errorShake 0.5s;">
          <div id="error-label" style="width:15%; text-align:center; font-weight:bold; color:var(--dark);"></div>
          <div class="bars-column">
            <div id="error-bar-wrap" class="bar-wrap-container"></div>
            <div id="error-nl-wrap" class="nl-wrap-container" style="display:none;"></div>
          </div>
          <div style="width:15%; display:flex; justify-content:center;">
            <button class="tool-btn" style="background: #666;" onclick="window._sub.hideErrorMergeBar()">✕ 關閉</button>
          </div>
        </div>
        <div id="mismatch-preview-row" style="display:none; position:relative; width:100%; min-height:80px; align-items:center; justify-content:space-between;">
          <div id="mismatch-preview-label" style="width:15%; text-align:center; transition: opacity 0.5s; opacity: 1;"></div>
          <div class="bars-column mismatch-preview-column">
            <div id="mismatch-preview-wrap" class="bar-wrap-container"></div>
            <div id="mismatch-preview-nl" class="nl-wrap-container" style="display:none;"></div>
          </div>
          <div style="width:15%;"></div>
        </div>
        <div id="trash-area" style="display:none; position:relative; width:100%; min-height:50px; align-items:flex-start; justify-content:space-between; border-top: 2px dashed #ccc; padding-top: 5px;">
          <div style="width:15%; display: flex; flex-direction: column; align-items: center; gap: 5px;">
            <div id="trash-can" style="font-size: 3rem;">🗑️</div>
            <div style="font-weight:bold; color:var(--dark); font-size:1rem;">垃圾桶</div>
          </div>
          <div id="trash-content" class="bars-column" style="background: white; padding: 15px 0; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.08); border: 1px solid #eee;">
            <div style='text-align:center; color:#7f8c8d; padding:10px; font-weight:normal;'>目前垃圾桶是空的</div>
          </div>
          <div style="width:15%;"></div>
        </div>
      `

      renderBar(1, 'none')
      renderBar(2, 'none')
      document.getElementById('drag-instruction')!.classList.remove('instruction-text-hidden')
      document.getElementById('drag-instruction')!.innerHTML = `💡 點擊上方分數，顯示圖形！`
      showNextActionCue()
    }

    function randomChallenge() {
      let d1 = Math.floor(Math.random() * 5) + 3
      let d2 = Math.floor(Math.random() * 5) + 3
      while (d2 === d1) { d2 = Math.floor(Math.random() * 5) + 3 }

      let total1 = Math.floor(Math.random() * (d1 * 3)) + 2
      let total2 = Math.floor(Math.random() * (d2 * 2)) + 1

      if (total1 / d1 < total2 / d2) {
        let temp = total1; total1 = total2; total2 = temp
        temp = d1; d1 = d2; d2 = temp
      }

      let w1: string | number = ''
      let n1 = total1
      let w2: string | number = ''
      let n2 = total2

      const showWhole = (document.getElementById('show-whole-cb') as HTMLInputElement).checked
      if (showWhole) {
        w1 = Math.floor(total1 / d1)
        n1 = total1 % d1
        if (n1 === 0 && (w1 as number) > 0) { (w1 as any)--; n1 = d1 }
        w2 = Math.floor(total2 / d2)
        n2 = total2 % d2
        if (n2 === 0 && (w2 as number) > 0) { (w2 as any)--; n2 = d2 }
        if (w1 === 0) w1 = ''
        if (w2 === 0) w2 = ''
      }

      ;(document.getElementById('w1') as HTMLInputElement).value = String(w1)
      ;(document.getElementById('n1') as HTMLInputElement).value = String(n1)
      ;(document.getElementById('d1') as HTMLInputElement).value = String(d1)
      ;(document.getElementById('w2') as HTMLInputElement).value = String(w2)
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

        const exactN = (vals.total_n1 * vals.d2) - (vals.total_n2 * vals.d1)
        const exactD = vals.d1 * vals.d2
        const exactVal = exactN / exactD

        const divisor = exactN === 0 ? 1 : gcd(Math.abs(exactN), exactD)
        const simpleImproperN = exactN / divisor
        const simpleD = exactD / divisor

        const simpleW = Math.floor(simpleImproperN / simpleD)
        const simpleMixedN = simpleImproperN % simpleD

        const currentD = vals.d1 * s1
        const LcmD = lcm(vals.d1, vals.d2)

        if (Math.abs(userVal - exactVal) < 0.0001) {
          let msg = ''
          let isSimplest = false

          if (exactN === 0 && ansW === 0 && ansN === 0) isSimplest = true
          else if (ansW === 0 && ansN === simpleImproperN && ansD === simpleD) isSimplest = true
          else if (ansW === simpleW && ansN === simpleMixedN && ansD === simpleD) isSimplest = true
          else if (ansN === 0 && ansW === simpleW && simpleMixedN === 0) isSimplest = true

          if (isSimplest) {
            msg = '🎉 完全正確！而且已經是最簡化的答案了！'
          } else {
            msg = '🌟 答對了數值！但試試看，這個答案可以再「約分」或「轉成帶分數」喔！'
          }

          if (currentD !== LcmD && exactN !== 0) {
            msg += '<br><span style="color:var(--orange); font-size:1rem; font-weight:normal;">（提示：你通分時使用的分母不是最小公倍數喔！雖然算得對，但數字會比較大。）</span>'
          }

          ;(fb as HTMLElement).style.opacity = '1'
          ;(fb as HTMLElement).style.color = 'var(--success)'
          ;(fb as HTMLElement).innerHTML = msg
        } else {
          ;(fb as HTMLElement).style.opacity = '1'
          ;(fb as HTMLElement).style.color = 'var(--red)'
          ;(fb as HTMLElement).innerText = '👀 答案不對喔，再檢查一下整數和分子相減的結果！'
        }
      } else {
        ;(fb as HTMLElement).style.opacity = '0'
      }
    }

    // ---- Expose namespace ----
    ;(window as any)._sub = {
      applyTool,
      toggleWholeNumber,
      toggleNumberLine,
      triggerErrorMerge,
      hideErrorMergeBar,
      updateTrashAreaVisibility,
      updateTrashTooltip,
      updateSpeed,
      randomChallenge,
      updateUI,
      autoCheck,
      onFrac1Click,
      onFrac2Click,
      toggleRearrange,
      stepBackSubtraction,
      resetSubtractionAnimation,
    }

    // ---- Init ----
    updateSpeed()
    toggleWholeNumber()
    updateUI()

    return () => {
      clearRemovalCue()
      delete (window as any)._sub
    }
  }, [])

  return (
    <div className="container">
      <AppHeader
        leftSlot={<div className="title-badge">異分母分數減法</div>}
        rightSlot={<>
          <ControlsPill
            speedId="speed-slider"
            speedLabelId="speed-val"
            onSpeedChange={() => (window as any)._sub?.updateSpeed()}
          >
            <label className="checkbox-label" htmlFor="show-whole-cb">
              <input type="checkbox" id="show-whole-cb" onChange={() => (window as any)._sub?.toggleWholeNumber()} /> 顯示帶分數
            </label>
            <div className="divider" />
            <label className="checkbox-label" htmlFor="show-nl-cb">
              <input type="checkbox" id="show-nl-cb" onChange={() => (window as any)._sub?.toggleNumberLine()} /> 顯示數線
            </label>
          </ControlsPill>
          <LangBtn onClick={() => (window as any)._sub?.randomChallenge()}>🎲 隨機出題</LangBtn>
          <GuidedTour steps={subtractionTourSteps} />
        </>}
      />

      <div id="word-problem" className="word-problem" />

      <div className="answer-zone">
        <div className="formula">
          <div
            className="mixed-frac frac-btn"
            id="frac1-group"
            onClick={() => (window as any)._sub?.onFrac1Click()}
            title="點擊重置並顯示被減數圖形"
          >
            <input
              type="number"
              className="whole-input"
              id="w1"
              placeholder=" "
              min={0}
              max={10}
              onInput={() => (window as any)._sub?.updateUI()}
              onChange={() => (window as any)._sub?.updateUI()}
            />
            <div className="frac">
              <FracInputStepper id="n1" defaultValue={2} min={1} max={100} onUpdate={() => (window as any)._sub?.updateUI()} onShowBar={() => (window as any)._sub?.onFrac1Click()} />
              <div className="fraction-line" />
              <FracInputStepper id="d1" defaultValue={3} min={1} max={100} onUpdate={() => (window as any)._sub?.updateUI()} onShowBar={() => (window as any)._sub?.onFrac1Click()} />
            </div>
          </div>
          <span>-</span>
          <div
            className="mixed-frac frac-btn"
            id="frac2-group"
            onClick={() => (window as any)._sub?.onFrac2Click()}
            title="點擊重置並顯示減數圖形"
          >
            <input
              type="number"
              className="whole-input"
              id="w2"
              placeholder=" "
              min={0}
              max={10}
              onInput={() => (window as any)._sub?.updateUI()}
              onChange={() => (window as any)._sub?.updateUI()}
            />
            <div className="frac">
              <FracInputStepper id="n2" defaultValue={1} min={1} max={100} onUpdate={() => (window as any)._sub?.updateUI()} onShowBar={() => (window as any)._sub?.onFrac2Click()} />
              <div className="fraction-line" />
              <FracInputStepper id="d2" defaultValue={2} min={1} max={100} onUpdate={() => (window as any)._sub?.updateUI()} onShowBar={() => (window as any)._sub?.onFrac2Click()} />
            </div>
          </div>
        </div>
      </div>

      <div className="animation-zone" id="anim-zone">
        <div id="drag-instruction" className="instruction-text">💡 準備中...</div>
        <div id="anim-area" />

        <div id="bottom-answer-zone">
          <div className="answer-zone-header">
            <div>
              <div className="answer-zone-kicker">最後答案</div>
              <div id="answer-stage-prompt" className="answer-stage-prompt">請填寫最後答案</div>
            </div>
            <div id="bot-public-unit" className="answer-unit-badge" />
          </div>

          <div className="formula answer-formula-row">
            <div id="bot-frac1" />
            <span>-</span>
            <div id="bot-frac2" />
            <span>=</span>
            <div className="mixed-frac answer-input-group">
              <input
                type="number"
                className="whole-input"
                id="ans-w"
                placeholder=" "
                min={0}
                onInput={() => (window as any)._sub?.autoCheck()}
              />
              <div className="frac">
                <input
                  type="number"
                  className="frac-input"
                  id="ans-num"
                  placeholder="?"
                  min={0}
                  onInput={() => (window as any)._sub?.autoCheck()}
                />
                <div className="fraction-line answer-fraction-line" />
                <input
                  type="number"
                  className="frac-input"
                  id="ans-den"
                  placeholder="?"
                  min={1}
                  onInput={() => (window as any)._sub?.autoCheck()}
                />
              </div>
            </div>
          </div>
          <div id="feedback" className="feedback-msg" />
          <div className="answer-zone-actions">
            <button
              id="rearrange-btn"
              className="btn-hint answer-secondary-btn"
              style={{ display: 'none' }}
              onClick={() => (window as any)._sub?.toggleRearrange()}
            >
              把剩下的排好
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
