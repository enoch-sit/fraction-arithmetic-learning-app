import { useEffect, useState } from 'react'
import './app.css'
import AppHeader from '../../shared/components/AppHeader'
import LangBtn from '../../shared/components/LangBtn'
import ControlsPill from '../../shared/components/ControlsPill'
import ActionButtonRow from '../../shared/components/ActionButtonRow'
import QuestionBanner from '../../shared/components/QuestionBanner'
import StepperInput from '../../shared/components/StepperInput'
import GuidedTour from '../../shared/components/GuidedTour'
import { showLightGuideHint } from '../../shared/components/LightGuideHint'
import { expandingGuideContent } from '../../shared/guides/expanding'
import { expandingTourSteps } from '../../shared/tours/expanding'
import TutorialFingerOverlay from '../../shared/components/TutorialFingerOverlay'

export default function App() {
  const [showStartupHover, setShowStartupHover] = useState(true)

  useEffect(() => {
    const target = document.querySelector<HTMLElement>('.fraction-box')
    if (!target) {
      setShowStartupHover(false)
      return
    }

    target.classList.add('startup-cue-active')
    setShowStartupHover(true)

    const removeCue = () => {
      target.classList.remove('startup-cue-active')
      setShowStartupHover(false)
    }

    const timerId = window.setTimeout(removeCue, 3600)
    target.addEventListener('pointerdown', removeCue, { once: true })

    return () => {
      window.clearTimeout(timerId)
      target.removeEventListener('pointerdown', removeCue)
      removeCue()
    }
  }, [])

  useEffect(() => {
    const { startupTooltip } = expandingGuideContent

    if (startupTooltip) {
      return showLightGuideHint({
        id: startupTooltip.id,
        element: startupTooltip.element,
        title: startupTooltip.title,
        description: startupTooltip.description,
        side: startupTooltip.side,
        delayMs: startupTooltip.delayMs,
      })
    }
  }, [])

  useEffect(() => {
    const w = window as any

    try {
      if (window.self !== window.top) document.body.classList.add('embedded')
    } catch (_e) {
      document.body.classList.add('embedded')
    }

    const LIMITS = { den_start: 100, expand_factor: 20 }
    let currentOp = '*'
    let isSyncMode = true
    let targetNum: number | null = null
    let targetDen: number | null = null

    function toggleSyncMode() {
      isSyncMode = !isSyncMode
      const btn = document.getElementById('btn_toggle_sync') as HTMLButtonElement
      const cont1 = document.getElementById('container_original') as HTMLElement
      const cont2 = document.getElementById('container_process') as HTMLElement
      const lenControls = document.getElementById('length_controls') as HTMLElement

      if (isSyncMode) {
        btn.innerText = '模式1'
        btn.classList.add('btn-active-mode')
        lenControls.style.display = 'none'
        cont1.classList.remove('draggable-bar')
        cont1.style.width = '100%'
        cont2.classList.remove('draggable-bar')
        cont2.style.width = '100%'
        const val = (document.getElementById('fn') as HTMLInputElement).value
        manualFactorChange('fn', val)
      } else {
        btn.innerText = '模式2'
        btn.classList.remove('btn-active-mode')
        lenControls.style.display = 'flex'
        cont1.classList.add('draggable-bar')
        cont2.classList.add('draggable-bar')
        const fnVal = parseInt((document.getElementById('fn') as HTMLInputElement).value) || 1
        const fdVal = parseInt((document.getElementById('fd') as HTMLInputElement).value) || 1
        syncOpColor(currentOp, fnVal, fdVal)
        renderEverything(true)
      }
    }

    function generateRandomFraction() {
      let d = Math.floor(Math.random() * 11) + 2
      let n = Math.floor(Math.random() * d) + 1

      if (currentOp === '/') {
        let multiplier = Math.floor(Math.random() * 4) + 2
        if (d * multiplier > LIMITS.den_start) {
          multiplier = Math.floor(LIMITS.den_start / d)
          if (multiplier < 2) multiplier = 2
        }
        n = n * multiplier
        d = d * multiplier
        if (d > LIMITS.den_start) {
          d = LIMITS.den_start
          n = Math.floor(d / 2)
        }
      }

      ;(document.getElementById('n_start') as HTMLInputElement).value = String(n)
      ;(document.getElementById('d_start') as HTMLInputElement).value = String(d)
      ;(document.getElementById('fn') as HTMLInputElement).value = '1'
      ;(document.getElementById('fd') as HTMLInputElement).value = '1'
      syncOpColor(currentOp, 1, 1)
      drawOriginal(n, d)

      if (!isSyncMode) {
        const r1 = 30 + Math.random() * 60
        const r2 = 30 + Math.random() * 60
        ;(document.getElementById('container_original') as HTMLElement).style.width = r1 + '%'
        ;(document.getElementById('container_process') as HTMLElement).style.width = r2 + '%'
      }

      renderEverything(true)
    }

    function updateSpeedUI(val: string) {
      ;(document.getElementById('speed_label') as HTMLElement).innerText = Number(val).toFixed(1)
    }

    function toggleNumberLine() {
      const checked = (document.getElementById('cb_toggle_nl') as HTMLInputElement).checked
      ;(document.getElementById('number_line_wrapper') as HTMLElement).style.display = checked ? 'block' : 'none'
    }

    function randomizeBars() {
      if (isSyncMode) return
      const r1 = 30 + Math.random() * 60
      const r2 = 30 + Math.random() * 60
      ;(document.getElementById('container_original') as HTMLElement).style.width = r1 + '%'
      ;(document.getElementById('container_process') as HTMLElement).style.width = r2 + '%'
      renderEverything(false)
    }

    function matchBars() {
      if (isSyncMode) return
      ;(document.getElementById('container_original') as HTMLElement).style.width = '100%'
      ;(document.getElementById('container_process') as HTMLElement).style.width = '100%'
      renderEverything(false)
    }

    function makeDraggable(containerId: string) {
      const container = document.getElementById(containerId) as HTMLElement
      const nlWrapper = document.getElementById('number_line_wrapper') as HTMLElement
      let isDragging = false

      function updateBarWidth(e: MouseEvent | TouchEvent) {
        if (!isDragging || isSyncMode) return
        const parent = container.parentElement!
        const rect = parent.getBoundingClientRect()

        let clientX: number
        if (e instanceof TouchEvent && e.touches && e.touches.length > 0) {
          clientX = e.touches[0].clientX
        } else if (e.type === 'touchend') {
          return
        } else {
          clientX = (e as MouseEvent).clientX
        }

        let x = clientX - rect.left
        let percent = (x / rect.width) * 100
        if (percent < 5) percent = 5
        if (percent > 100) percent = 100

        const otherId = containerId === 'container_original' ? 'container_process' : 'container_original'
        const otherW = document.getElementById(otherId)!.getBoundingClientRect().width
        const targetX = rect.left + otherW

        if (Math.abs(clientX - targetX) < 20) {
          percent = (otherW / rect.width) * 100
        } else if (Math.abs(clientX - (rect.left + rect.width)) < 20) {
          percent = 100
        }

        container.style.width = percent + '%'
        renderEverything(false)
      }

      container.addEventListener('mousedown', (e) => {
        if (isSyncMode) return
        isDragging = true
        container.style.transition = 'border-color 0.3s, box-shadow 0.3s'
        if (containerId === 'container_original') nlWrapper.style.transition = 'none'
        updateBarWidth(e)
      })
      window.addEventListener('mousemove', (e) => { if (isDragging) updateBarWidth(e) })
      window.addEventListener('mouseup', () => {
        if (isDragging) {
          isDragging = false
          container.style.transition = 'width 0.3s ease, border-color 0.3s, box-shadow 0.3s'
          if (containerId === 'container_original') nlWrapper.style.transition = 'width 0.3s ease, opacity 0.3s ease'
        }
      })
      container.addEventListener('touchstart', (e) => {
        if (isSyncMode) return
        isDragging = true
        container.style.transition = 'border-color 0.3s, box-shadow 0.3s'
        if (containerId === 'container_original') nlWrapper.style.transition = 'none'
        updateBarWidth(e)
      }, { passive: false })
      window.addEventListener('touchmove', (e) => {
        if (isDragging) { e.preventDefault(); updateBarWidth(e) }
      }, { passive: false })
      window.addEventListener('touchend', () => {
        if (isDragging) {
          isDragging = false
          container.style.transition = 'width 0.3s ease, border-color 0.3s, box-shadow 0.3s'
          if (containerId === 'container_original') nlWrapper.style.transition = 'width 0.3s ease, opacity 0.3s ease'
        }
      })
    }

    function initDraggableBars() {
      makeDraggable('container_original')
      makeDraggable('container_process')
    }

    function drawNumberLine(divisions: number) {
      const container = document.getElementById('nl_ticks')!
      let html = ''
      for (let i = 0; i <= divisions; i++) {
        const leftPos = (i / divisions) * 100
        let labelHtml: string
        if (i === 0) {
          labelHtml = '0'
        } else if (i === divisions) {
          labelHtml = '1'
        } else {
          labelHtml = `<span class="nl-frac"><span class="nl-num">${i}</span><span class="nl-line-frac"></span><span class="nl-den">${divisions}</span></span>`
        }
        html += `<div class="nl-tick-wrapper" style="left: ${leftPos}%;"><div class="nl-tick"></div><div class="nl-label">${labelHtml}</div></div>`
      }
      container.innerHTML = html
    }

    function renderQuestionBanner() {
      const banner = document.getElementById('question_banner')!
      if (targetNum === null && targetDen === null) { banner.classList.remove('show'); return }
      const n = parseInt((document.getElementById('n_start') as HTMLInputElement).value) || 0
      const d = parseInt((document.getElementById('d_start') as HTMLInputElement).value) || 1
      const tNumHtml = targetNum !== null ? String(targetNum) : '<span class="q-blank">?</span>'
      const tDenHtml = targetDen !== null ? String(targetDen) : '<span class="q-blank">?</span>'
      document.getElementById('q_equation')!.innerHTML =
        `<span class="q-frac"><span class="q-num">${n}</span><span class="q-line"></span><span class="q-den">${d}</span></span>` +
        `<span>=</span>` +
        `<span class="q-frac"><span class="q-num">${tNumHtml}</span><span class="q-line"></span><span class="q-den">${tDenHtml}</span></span>`
      banner.classList.add('show')
    }

    function setMode(op: string) {
      currentOp = op
      const symbol = op === '*' ? '×' : '÷'
      ;(document.getElementById('on') as HTMLElement).innerText = symbol
      ;(document.getElementById('od') as HTMLElement).innerText = symbol
      ;(document.getElementById('fn') as HTMLInputElement).value = '1'
      ;(document.getElementById('fd') as HTMLInputElement).value = '1'

      const btnMerge = document.getElementById('btn_merge') as HTMLButtonElement
      const btnSlice = document.getElementById('btn_slice') as HTMLButtonElement

      if (op === '/') {
        btnMerge.disabled = true
        btnSlice.disabled = false
      } else {
        btnSlice.disabled = true
        btnMerge.disabled = false
      }

      syncOpColor(op, 1, 1)
      renderEverything(true)
    }

    function checkEmpty(el: HTMLInputElement, defaultVal: number) {
      if (el.value === '' || isNaN(Number(el.value))) {
        el.value = String(defaultVal)
        if (el.id === 'fn' || el.id === 'fd') manualFactorChange(el.id, String(defaultVal))
        else manualInputChange()
      }
    }

    function stepInput(id: string, delta: number) {
      const el = document.getElementById(id) as HTMLInputElement
      let val = parseInt(el.value) || 0
      val += delta
      if (id === 'd_start' && val < 1) val = 1
      if (id === 'n_start' && val < 0) val = 0
      el.value = String(val)
      manualInputChange()
    }

    function manualInputChange() {
      let n = parseInt((document.getElementById('n_start') as HTMLInputElement).value)
      let d = parseInt((document.getElementById('d_start') as HTMLInputElement).value)
      if (isNaN(d) || isNaN(n)) return
      if (d > LIMITS.den_start) d = LIMITS.den_start
      if (d < 1) d = 1
      if (n > d) n = d
      if (n < 0) n = 0
      ;(document.getElementById('n_start') as HTMLInputElement).value = String(n)
      ;(document.getElementById('d_start') as HTMLInputElement).value = String(d)
      drawOriginal(n, d)
      renderEverything(true)
    }

    function stepFactor(id: string, delta: number) {
      const val = parseInt((document.getElementById(id) as HTMLInputElement).value) || 1
      manualFactorChange(id, String(val + delta))
    }

    function manualFactorChange(id: string, v: string) {
      if (v === '') return
      let val = parseInt(v) || 1
      if (val < 1) val = 1
      const maxLimit = currentOp === '*' ? LIMITS.expand_factor : LIMITS.den_start
      if (val > maxLimit) val = maxLimit
      ;(document.getElementById(id) as HTMLInputElement).value = String(val)
      if (isSyncMode) {
        const otherId = id === 'fn' ? 'fd' : 'fn'
        ;(document.getElementById(otherId) as HTMLInputElement).value = String(val)
      }
      const fnVal = parseInt((document.getElementById('fn') as HTMLInputElement).value) || 1
      const fdVal = parseInt((document.getElementById('fd') as HTMLInputElement).value) || 1
      syncOpColor(currentOp, fnVal, fdVal)
      renderEverything(true)
    }

    function syncOpColor(op: string, fnVal: number, fdVal: number) {
      const isMismatch = !isSyncMode && fnVal !== fdVal
      const baseColor = fnVal === 1 ? '#ccc' : op === '*' ? 'var(--yellow)' : 'var(--success)'
      document.querySelectorAll<HTMLElement>('.op-select').forEach(el => {
        el.style.borderColor = baseColor
        el.style.color = fnVal === 1 ? '#888' : baseColor
      })
      ;(document.getElementById('wrap_fn') as HTMLElement).style.borderColor = isMismatch ? 'var(--red)' : baseColor
      ;(document.getElementById('wrap_fd') as HTMLElement).style.borderColor = isMismatch
        ? 'var(--red)'
        : fdVal === 1 && !isMismatch ? '#ccc' : op === '*' ? 'var(--yellow)' : 'var(--success)'
      const textColor = isMismatch ? 'var(--red)' : fnVal === 1 ? '#888' : baseColor
      document.querySelectorAll<HTMLElement>('#wrap_fn input, #wrap_fn .step-btn, #wrap_fd input, #wrap_fd .step-btn').forEach(el => {
        el.style.color = textColor
      })
      ;(document.getElementById('group_fn') as HTMLElement).style.borderLeftColor = isMismatch ? 'var(--red)' : '#eee'
      ;(document.getElementById('group_fd') as HTMLElement).style.borderLeftColor = isMismatch ? 'var(--red)' : '#eee'
    }

    function renderEverything(anim: boolean) {
      const n1 = parseInt((document.getElementById('n_start') as HTMLInputElement).value) || 2
      const d1 = parseInt((document.getElementById('d_start') as HTMLInputElement).value) || 8
      const elFn = document.getElementById('fn') as HTMLInputElement
      const elFd = document.getElementById('fd') as HTMLInputElement
      const fnVal = elFn && elFn.value !== '' ? parseInt(elFn.value) : 1
      const fdVal = elFd && elFd.value !== '' ? parseInt(elFd.value) : 1

      ;(document.getElementById('ln') as HTMLElement).innerText = String(n1)
      ;(document.getElementById('ld') as HTMLElement).innerText = String(d1)
      const errorEl = document.getElementById('error_msg')!
      errorEl.innerText = ''

      const c1 = document.getElementById('container_original') as HTMLElement
      const c2 = document.getElementById('container_process') as HTMLElement

      let w1Percent = parseFloat(c1.style.width)
      if (isNaN(w1Percent)) w1Percent = 100
      let w2Percent = parseFloat(c2.style.width)
      if (isNaN(w2Percent)) w2Percent = 100
      ;(document.getElementById('number_line_wrapper') as HTMLElement).style.width = w1Percent + '%'

      const isLengthMismatch = !isSyncMode && Math.abs(w1Percent - w2Percent) > 0.5
      let isValid = true
      const isNumMismatch = !isSyncMode && fnVal !== fdVal

      if (isLengthMismatch) {
        isValid = false
        c1.style.borderColor = 'var(--red)'
        c2.style.borderColor = 'var(--red)'
        c1.style.boxShadow = '0 0 8px rgba(231, 76, 60, 0.4)'
        c2.style.boxShadow = '0 0 8px rgba(231, 76, 60, 0.4)'
        errorEl.innerText = '⚠️ 提示：兩個長條圖整體長度不一致！請拖拉至相同長度。'
      } else {
        c1.style.borderColor = 'var(--primary)'
        c2.style.borderColor = 'var(--accent)'
        c1.style.boxShadow = 'none'
        c2.style.boxShadow = 'none'
      }

      if (isNumMismatch) {
        isValid = false
        if (errorEl.innerText !== '') errorEl.innerText += '\n'
        errorEl.innerText += '⚠️ 提示：分子和分母必須乘以或除以相同的數字。'
      }

      if (isValid && currentOp === '/') {
        if (fnVal === 0) {
          isValid = false
        } else if (n1 % fnVal !== 0 || d1 % fdVal !== 0) {
          if (errorEl.innerText !== '') errorEl.innerText += '\n'
          errorEl.innerText += `⚠️ 錯誤：分子或分母不能被 ${fnVal} 整除`
          isValid = false
        }
      }

      const n2: number | string = isValid ? (currentOp === '*' ? n1 * fnVal : n1 / fnVal) : '?'
      const d2: number | string = isValid ? (currentOp === '*' ? d1 * fdVal : d1 / fdVal) : '?'

      ;(document.getElementById('n_target') as HTMLInputElement).value = String(n2)
      ;(document.getElementById('d_target') as HTMLInputElement).value = String(d2)

      const bp = document.getElementById('bar_process') as HTMLElement
      const gp = document.getElementById('grid_process') as HTMLElement
      const nlContainer = document.querySelector<HTMLElement>('.number-line-container')!

      if (isLengthMismatch) {
        bp.style.visibility = 'hidden'
        gp.style.visibility = 'hidden'
        nlContainer.style.visibility = 'hidden'
      } else if (isValid) {
        bp.style.visibility = 'visible'
        gp.style.visibility = 'visible'
        nlContainer.style.visibility = 'visible'
        drawProcess(n1, d1, n2 as number, d2 as number, fnVal, currentOp, anim)
        const maxGrid = currentOp === '*' ? (d2 as number) : d1
        drawNumberLine(maxGrid)
      } else {
        bp.style.visibility = 'visible'
        gp.style.visibility = 'visible'
        bp.style.width = '0%'
        gp.innerHTML = ''
        nlContainer.style.visibility = 'hidden'
      }
    }

    function drawOriginal(n: number, d: number) {
      ;(document.getElementById('bar_original') as HTMLElement).style.width = (n / d * 100) + '%'
      let html = '<div class="grid-overlay">'
      for (let i = 1; i <= d; i++) {
        html += `<div class="segment"></div>`
        if (i < d) html += `<div class="divider-thick"></div>`
      }
      html += '</div>'
      document.getElementById('grid_original')!.innerHTML = html
    }

    function drawProcess(_n1: number, d1: number, n2: number, d2: number, factor: number, op: string, anim: boolean) {
      const b = document.getElementById('bar_process') as HTMLElement
      const g = document.getElementById('grid_process') as HTMLElement
      b.style.width = (n2 / d2 * 100) + '%'

      let html = '<div class="grid-overlay">'
      const maxGrid = op === '*' ? d2 : d1
      let baseAnimDuration = 2.0
      let baseBgTimeout = 1800
      if (factor > 3) { baseAnimDuration = 1.0; baseBgTimeout = 800 }

      const speedVal = parseFloat((document.getElementById('speed_slider') as HTMLInputElement).value)
      const animDuration = (baseAnimDuration / speedVal) + 's'
      const bgTimeout = baseBgTimeout / speedVal

      for (let i = 1; i <= maxGrid; i++) {
        html += `<div class="segment"></div>`
        if (i < maxGrid) {
          const isMainLine = op === '/' ? i % factor === 0 : i % factor === 0
          if (op === '*') {
            if (isMainLine || factor === 1) {
              html += `<div class="divider-thick"></div>`
            } else {
              const hS = anim ? '0%' : '100%'
              html += `<div class="divider-thin"><div class="anim-line" style="height:${hS}; background: var(--accent); transition: height ${animDuration} cubic-bezier(0.4, 0, 0.2, 1), background-color 0.5s;"></div></div>`
            }
          } else {
            if (factor === 1 || isMainLine) {
              html += `<div class="divider-thick"></div>`
            } else {
              const hS = anim ? '100%' : '0%'
              html += `<div class="divider-thin"><div class="anim-line" style="height:${hS}; background: var(--grid-dark); transition: height ${animDuration} cubic-bezier(0.4, 0, 0.2, 1), background-color 0.5s;"></div></div>`
            }
          }
        }
      }
      html += '</div>'
      g.innerHTML = html

      if (anim && factor !== 1) {
        setTimeout(() => {
          g.querySelectorAll<HTMLElement>('.anim-line').forEach(l => {
            l.style.height = op === '*' ? '100%' : '0%'
            if (op === '*') setTimeout(() => { l.style.background = 'var(--grid-dark)' }, bgTimeout)
          })
        }, 50)
      }
    }

    // Initialize
    const urlParams = new URLSearchParams(window.location.search)
    const pNum = parseInt(urlParams.get('numerator') || '')
    const pDen = parseInt(urlParams.get('denominator') || '')
    const pMode = urlParams.get('mode')
    const pTargetNum = urlParams.get('targetNum')
    const pTargetDen = urlParams.get('targetDen')

    if (pTargetNum !== null && pTargetNum !== '') targetNum = parseInt(pTargetNum)
    if (pTargetDen !== null && pTargetDen !== '') targetDen = parseInt(pTargetDen)

    if (!isNaN(pNum) && !isNaN(pDen) && pDen >= 1) {
      ;(document.getElementById('n_start') as HTMLInputElement).value = String(Math.min(pNum, pDen))
      ;(document.getElementById('d_start') as HTMLInputElement).value = String(Math.min(pDen, LIMITS.den_start))
    }

    if (pMode === 'simplify') setMode('/')
    else setMode('*')

    renderQuestionBanner()
    manualInputChange()
    initDraggableBars()

    window.addEventListener('message', (e: MessageEvent) => {
      if (e.data && e.data.type === 'set-params') {
        const p = e.data.params
        if (p.targetNum !== undefined) targetNum = p.targetNum
        if (p.targetDen !== undefined) targetDen = p.targetDen
        if (p.numerator != null && p.denominator != null) {
          ;(document.getElementById('n_start') as HTMLInputElement).value = String(Math.min(p.numerator, p.denominator))
          ;(document.getElementById('d_start') as HTMLInputElement).value = String(Math.min(p.denominator, LIMITS.den_start))
        }
        if (p.mode === 'simplify') setMode('/')
        else setMode('*')
        renderQuestionBanner()
        manualInputChange()
      }
    })

    // Expose for JSX event handlers
    w._exp = {
      toggleSyncMode,
      generateRandomFraction,
      updateSpeedUI,
      toggleNumberLine,
      randomizeBars,
      matchBars,
      setModeExpand: () => setMode('*'),
      setModeSimplify: () => setMode('/'),
      stepInput,
      stepFactor,
      manualFactorChange,
      manualInputChange,
      checkEmpty,
    }

    return () => { delete w._exp }
  }, [])

  return (
    <div className="container">
      <TutorialFingerOverlay
        target=".fraction-box"
        position="fixed"
        visible={showStartupHover}
        horizontalAnchor="center"
        verticalAnchor="center"
        offsetX={-28}
        offsetY={-28}
        animationVariant="click"
        ariaLabel="startup hover hint"
      />
      <AppHeader
        leftSlot={<>
          <LangBtn id="btn_toggle_sync" active onClick={() => (window as any)._exp?.toggleSyncMode()}>模式1</LangBtn>
          <div className="title-badge" id="title_text">分數擴分與約分</div>
        </>}
        rightSlot={<>
          <LangBtn onClick={() => (window as any)._exp?.generateRandomFraction()}>隨機分數</LangBtn>
          <ControlsPill
            speedId="speed_slider"
            speedLabelId="speed_label"
            onSpeedChange={(v) => (window as any)._exp?.updateSpeedUI(v)}
          >
            <label className="checkbox-label">
              <input type="checkbox" id="cb_toggle_nl"
                onChange={() => (window as any)._exp?.toggleNumberLine()} /> 顯示數線
            </label>
          </ControlsPill>
          <GuidedTour steps={expandingTourSteps} />
        </>}
      />

      <QuestionBanner id="question_banner" labelId="q_label" equationId="q_equation" />

      <ActionButtonRow
        primary={{ id: 'btn_merge', label: '約分', onClick: () => (window as any)._exp?.setModeSimplify() }}
        secondary={{ id: 'btn_slice', label: '擴分', onClick: () => (window as any)._exp?.setModeExpand() }}
      />

      <div className="math-engine" id="engine">
        <div className="fraction-box">
          <StepperInput
            id="n_start" defaultValue={2} min={1} max={100}
            inputClassName="num-input" wrapperClassName="start-wrap"
            onInput={() => (window as any)._exp?.manualInputChange()}
            onBlur={(e) => (window as any)._exp?.checkEmpty(e.target as HTMLInputElement, 2)}
            onStepUp={() => (window as any)._exp?.stepInput('n_start', 1)}
            onStepDown={() => (window as any)._exp?.stepInput('n_start', -1)}
          />
          <div className="fraction-line" />
          <StepperInput
            id="d_start" defaultValue={8} min={1} max={100}
            inputClassName="den-input" wrapperClassName="start-wrap"
            onInput={() => (window as any)._exp?.manualInputChange()}
            onBlur={(e) => (window as any)._exp?.checkEmpty(e.target as HTMLInputElement, 8)}
            onStepUp={() => (window as any)._exp?.stepInput('d_start', 1)}
            onStepDown={() => (window as any)._exp?.stepInput('d_start', -1)}
          />
        </div>

        <div className="eq-sign">=</div>

        <div className="process-container">
          <div className="row-align">
            <div id="ln" className="base-num num-input">2</div>
            <div id="on" className="op-select">×</div>
            <StepperInput
              id="fn" defaultValue={1} min={1} max={20}
              wrapperClassName="factor-wrap" wrapperId="wrap_fn" stepperGroupId="group_fn"
              onInput={() => {
                const elem = document.getElementById('fn') as HTMLInputElement;
                if (elem) (window as any)._exp?.manualFactorChange('fn', elem.value);
              }}
              onBlur={(e) => (window as any)._exp?.checkEmpty(e.target as HTMLInputElement, 1)}
              onStepUp={() => (window as any)._exp?.stepFactor('fn', 1)}
              onStepDown={() => (window as any)._exp?.stepFactor('fn', -1)}
            />
          </div>
          <div className="fraction-line" style={{ margin: '10px 0', background: '#ddd', height: '3px' }}></div>
          <div className="row-align">
            <div id="ld" className="base-num den-input">8</div>
            <div id="od" className="op-select">×</div>
            <StepperInput
              id="fd" defaultValue={1} min={1} max={20}
              wrapperClassName="factor-wrap" wrapperId="wrap_fd" stepperGroupId="group_fd"
              onInput={() => {
                const elem = document.getElementById('fd') as HTMLInputElement;
                if (elem) (window as any)._exp?.manualFactorChange('fd', elem.value);
              }}
              onBlur={(e) => (window as any)._exp?.checkEmpty(e.target as HTMLInputElement, 1)}
              onStepUp={() => (window as any)._exp?.stepFactor('fd', 1)}
              onStepDown={() => (window as any)._exp?.stepFactor('fd', -1)}
            />
          </div>
        </div>

        <div className="eq-sign">=</div>

        <div className="fraction-box" style={{ width: '80px' }}>
          <input type="text" id="n_target" className="fraction-input num-target" readOnly tabIndex={-1} />
          <div className="fraction-line"></div>
          <input type="text" id="d_target" className="fraction-input den-input" readOnly tabIndex={-1} />
        </div>
      </div>

      <div id="error_msg"></div>

      <div className="visual-stack">
        <div>
          <div className="bar-label" style={{ color: 'var(--primary)', justifyContent: 'space-between', display: 'flex', width: '100%' }}>
            <span id="label_original">原分數</span>
            <div id="length_controls" style={{ display: 'none', gap: '10px' }}>
              <button className="lang-btn" onClick={() => (window as any)._exp?.randomizeBars()}
                style={{ fontSize: '0.85rem', padding: '4px 10px', boxShadow: '0 2px 0 var(--gray)', transform: 'translateY(0)' }}>隨機長度</button>
              <button className="lang-btn" onClick={() => (window as any)._exp?.matchBars()}
                style={{ fontSize: '0.85rem', padding: '4px 10px', boxShadow: '0 2px 0 var(--gray)', transform: 'translateY(0)' }}>設定同一長度</button>
            </div>
          </div>
          <div className="bar-container" id="container_original" style={{ borderColor: 'var(--primary)', width: '100%' }}>
            <div id="bar_original" className="bar-fill" style={{ background: 'var(--primary)', opacity: 0.6 }}></div>
            <div id="grid_original"></div>
          </div>
        </div>

        <div>
          <div className="bar-label" style={{ color: 'var(--accent)', justifyContent: 'space-between', display: 'flex', width: '100%' }}>
            <span id="label_result">運算結果</span>
          </div>
          <div className="bar-container" id="container_process" style={{ borderColor: 'var(--accent)', width: '100%' }}>
            <div id="bar_process" className="bar-fill" style={{ background: 'var(--accent)', opacity: 0.8, pointerEvents: 'none' }}></div>
            <div id="grid_process" style={{ pointerEvents: 'none' }}></div>
          </div>
          <div id="number_line_wrapper" className="number-line-wrapper" style={{ display: 'none' }}>
            <div className="number-line-container">
              <div className="nl-line"></div>
              <div id="nl_ticks"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
