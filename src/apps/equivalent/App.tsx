import { useEffect, useState } from 'react'
import './app.css'
import AppHeader from '../../shared/components/AppHeader'
import LangBtn from '../../shared/components/LangBtn'
import ControlsPill from '../../shared/components/ControlsPill'
import ActionButtonRow from '../../shared/components/ActionButtonRow'
import QuestionBanner from '../../shared/components/QuestionBanner'
import StepperInput from '../../shared/components/StepperInput'
import FractionBar from '../../shared/components/FractionBar'
import NumberLineDisplay from '../../shared/components/NumberLineDisplay'

interface EquivalentFractionsState {
  mode: 'sync' | 'independent'
  operation: '×' | '÷'
  numerator: number
  denominator: number
  factorNum: number
  factorDen: number
  targetNum: number | null
  targetDen: number | null
  showNumberLine: boolean
  animate: boolean
  speedMultiplier: number
  errorMsg: string
}

const LIMITS = {
  numStart: 20,
  denStart: 20,
  factor: 10,
}

export default function App() {
  const [state, setState] = useState<EquivalentFractionsState>(() => {
    const params = new URLSearchParams(window.location.search)
    const numFromURL = parseInt(params.get('numerator') || '1', 10)
    const denFromURL = parseInt(params.get('denominator') || '4', 10)
    const modeFromURL = params.get('mode') === 'independent' ? 'independent' : 'sync'
    const targetNumFromURL = params.get('targetNum') ? parseInt(params.get('targetNum')!, 10) : null
    const targetDenFromURL = params.get('targetDen') ? parseInt(params.get('targetDen')!, 10) : null

    return {
      mode: modeFromURL,
      operation: '×',
      numerator: Math.max(1, Math.min(numFromURL, LIMITS.numStart)),
      denominator: Math.max(1, Math.min(denFromURL, LIMITS.denStart)),
      factorNum: 1,
      factorDen: 1,
      targetNum: targetNumFromURL,
      targetDen: targetDenFromURL,
      showNumberLine: false,
      animate: true,
      speedMultiplier: 1,
      errorMsg: '',
    }
  })

  // Calculation engine
  const calculateResult = (
    num: number,
    den: number,
    op: '×' | '÷',
    fNum: number,
    fDen: number
  ) => {
    if (op === '×') {
      return { resultNum: num * fNum, resultDen: den * fDen }
    } else {
      if (fDen === 1) return { resultNum: num, resultDen: den }
      if (num % fDen !== 0 || den % fDen !== 0) {
        return { resultNum: NaN, resultDen: NaN }
      }
      return { resultNum: num / fDen, resultDen: den / fDen }
    }
  }

  const { resultNum, resultDen } = calculateResult(
    state.numerator,
    state.denominator,
    state.operation,
    state.factorNum,
    state.factorDen
  )

  // Validation
  useEffect(() => {
    if (state.operation === '÷' && state.factorDen !== 1) {
      if (state.numerator % state.factorDen !== 0 || state.denominator % state.factorDen !== 0) {
        setState((s) => ({
          ...s,
          errorMsg: `⚠️ 除法模式下，分子和分母都必須能被 ${state.factorDen} 整除`,
        }))
        return
      }
    }

    if (state.mode === 'independent' && state.targetNum !== null && state.targetDen !== null) {
      if (!isNaN(resultNum) && !isNaN(resultDen)) {
        const leftRatio = state.numerator / state.denominator
        const rightRatio = state.targetNum / state.targetDen
        if (Math.abs(leftRatio - rightRatio) > 0.0001) {
          setState((s) => ({ ...s, errorMsg: '⚠️ 兩邊的分數值不相等' }))
          return
        }
      }
    }

    setState((s) => ({ ...s, errorMsg: '' }))
  }, [
    state.operation,
    state.factorDen,
    state.numerator,
    state.denominator,
    state.mode,
    state.targetNum,
    state.targetDen,
    resultNum,
    resultDen,
  ])

  // Sync mode auto-update
  useEffect(() => {
    if (state.mode === 'sync') {
      if (!isNaN(resultNum) && !isNaN(resultDen)) {
        setState((s) => ({ ...s, targetNum: resultNum, targetDen: resultDen }))
      }
    }
  }, [state.mode, resultNum, resultDen])

  // PostMessage API
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (typeof e.data !== 'object' || !e.data) return

      if (e.data.type === 'setFraction') {
        const { numerator, denominator } = e.data
        if (typeof numerator === 'number' && typeof denominator === 'number') {
          setState((s) => ({ ...s, numerator, denominator }))
        }
      } else if (e.data.type === 'setMode') {
        if (e.data.mode === 'sync' || e.data.mode === 'independent') {
          setState((s) => ({ ...s, mode: e.data.mode }))
        }
      } else if (e.data.type === 'setTarget') {
        const { targetNum, targetDen } = e.data
        if (typeof targetNum === 'number' && typeof targetDen === 'number') {
          setState((s) => ({ ...s, targetNum, targetDen }))
        }
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  // Handlers
  const toggleMode = () => {
    setState((s) => ({ ...s, mode: s.mode === 'sync' ? 'independent' : 'sync' }))
  }

  const toggleOperation = () => {
    setState((s) => ({
      ...s,
      operation: s.operation === '×' ? '÷' : '×',
      factorNum: 1,
      factorDen: 1,
    }))
  }

  const handleRandom = () => {
    const newNum = Math.floor(Math.random() * LIMITS.numStart) + 1
    const newDen = Math.floor(Math.random() * LIMITS.denStart) + 1
    setState((s) => ({ ...s, numerator: newNum, denominator: newDen }))
  }

  const handleSwap = () => {
    setState((s) => ({ ...s, numerator: s.denominator, denominator: s.numerator }))
  }

  const totalSegments =
    state.operation === '×'
      ? state.denominator * state.factorDen
      : state.denominator

  const displayedTargetNum = state.targetNum ?? resultNum
  const displayedTargetDen = state.targetDen ?? resultDen

  const isResultValid = !isNaN(resultNum) && !isNaN(resultDen)
  const isMatch =
    state.mode === 'independent' &&
    state.targetNum !== null &&
    state.targetDen !== null &&
    isResultValid &&
    Math.abs(state.numerator / state.denominator - state.targetNum / state.targetDen) < 0.0001

  return (
    <div>
      <AppHeader
        leftSlot={
          <h1
            style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: 'var(--accent)',
              margin: 0,
            }}
          >
            相等分數 (約分/擴分)
          </h1>
        }
        rightSlot={<LangBtn />}
      />

      <QuestionBanner
        question="如何找到相等的分數？"
        subtitle="相等分數：使用乘法擴分、除法約分來改變分母"
      />

      <div className="math-engine">
        {/* Left fraction */}
        <div className="fraction-box">
          <input
            type="text"
            className="fraction-input num-target"
            value={state.numerator}
            readOnly
          />
          <div className="fraction-line" />
          <input
            type="text"
            className="fraction-input num-target"
            value={state.denominator}
            readOnly
          />
        </div>

        <div className="eq-sign">=</div>

        {/* Process container */}
        <div className="process-container">
          <div className="row-align">
            <div className="base-num">{state.numerator}</div>
            <div className="op-select" onClick={toggleOperation}>
              {state.operation}
            </div>
            <StepperInput
              id="factor_num"
              defaultValue={state.factorNum}
              min={1}
              max={LIMITS.factor}
              wrapperClassName="factor-wrap"
              onInput={(val) => setState((s) => ({ ...s, factorNum: val }))}
            />
          </div>

          <div className="row-align">
            <div className="base-num">{state.denominator}</div>
            <div className="op-select" onClick={toggleOperation}>
              {state.operation}
            </div>
            <StepperInput
              id="factor_den"
              defaultValue={state.factorDen}
              min={1}
              max={LIMITS.factor}
              wrapperClassName="factor-wrap"
              onInput={(val) => setState((s) => ({ ...s, factorDen: val }))}
            />
          </div>
        </div>

        <div className="eq-sign">
          {state.mode === 'independent' && !isMatch ? '≠' : '='}
        </div>

        {/* Right fraction */}
        <div className="fraction-box">
          {state.mode === 'sync' ? (
            <>
              <input
                type="text"
                className="fraction-input num-target"
                value={isResultValid ? displayedTargetNum : '?'}
                readOnly
              />
              <div className="fraction-line" />
              <input
                type="text"
                className="fraction-input num-target"
                value={isResultValid ? displayedTargetDen : '?'}
                readOnly
              />
            </>
          ) : (
            <>
              <StepperInput
                id="target_num"
                defaultValue={state.targetNum ?? 1}
                min={1}
                max={LIMITS.numStart * LIMITS.factor}
                wrapperClassName="start-wrap"
                inputClassName="num-target"
                onInput={(val) => setState((s) => ({ ...s, targetNum: val }))}
              />
              <div className="fraction-line" />
              <StepperInput
                id="target_den"
                defaultValue={state.targetDen ?? 1}
                min={1}
                max={LIMITS.denStart * LIMITS.factor}
                wrapperClassName="start-wrap"
                inputClassName="num-target"
                onInput={(val) => setState((s) => ({ ...s, targetDen: val }))}
              />
            </>
          )}
        </div>
      </div>

      {state.errorMsg && <div id="error_msg">{state.errorMsg}</div>}

      <div style={{ marginBottom: '15px' }}>
        <StepperInput
          id="numerator"
          defaultValue={state.numerator}
          min={1}
          max={LIMITS.numStart}
          wrapperClassName="start-wrap"
          inputClassName="num-target"
          onInput={(val) => setState((s) => ({ ...s, numerator: val }))}
        />
        <StepperInput
          id="denominator"
          defaultValue={state.denominator}
          min={1}
          max={LIMITS.denStart}
          wrapperClassName="start-wrap"
          inputClassName="num-target"
          onInput={(val) => setState((s) => ({ ...s, denominator: val }))}
        />
      </div>

      <div className="visual-stack">
        <FractionBar
          label={`原始分數: ${state.numerator}/${state.denominator}`}
          numerator={state.numerator}
          denominator={state.denominator}
          totalSegments={state.denominator}
          fillColor="var(--accent)"
          operation={state.operation}
          factorNum={state.factorNum}
          factorDen={state.factorDen}
          animate={false}
          speedMultiplier={state.speedMultiplier}
        />

        {isResultValid && (
          <FractionBar
            label={`結果分數: ${displayedTargetNum}/${displayedTargetDen}`}
            numerator={displayedTargetNum}
            denominator={displayedTargetDen}
            totalSegments={totalSegments}
            fillColor="var(--accent)"
            operation={state.operation}
            factorNum={state.factorNum}
            factorDen={state.factorDen}
            animate={state.animate}
            speedMultiplier={state.speedMultiplier}
          />
        )}
      </div>

      <NumberLineDisplay
        denominator={state.denominator}
        totalSegments={totalSegments}
        visible={state.showNumberLine}
      />

      <ActionButtonRow
        primary={{
          id: 'btn_random',
          label: '🎲 隨機',
          onClick: handleRandom,
        }}
        secondary={{
          id: 'btn_swap',
          label: '⇅ 交換',
          onClick: handleSwap,
        }}
      />

      <button
        id="btn_toggle_sync"
        onClick={toggleMode}
        style={{
          margin: '10px auto',
          display: 'block',
          padding: '10px 20px',
          fontSize: '1rem',
          fontWeight: 'bold',
          borderRadius: '8px',
          border: '2px solid var(--accent)',
          background: state.mode === 'sync' ? 'var(--accent)' : 'white',
          color: state.mode === 'sync' ? 'white' : 'var(--accent)',
          cursor: 'pointer',
        }}
      >
        {state.mode === 'sync' ? '🔒 同步模式' : '🔓 獨立模式'}
      </button>

      <ControlsPill
        speedId="speed"
        speedLabelId="speed_label"
        onSpeedChange={(val) => setState((s) => ({ ...s, speedMultiplier: val }))}
      >
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            cursor: 'pointer',
          }}
        >
          <input
            type="checkbox"
            checked={state.showNumberLine}
            onChange={(e) =>
              setState((s) => ({ ...s, showNumberLine: e.target.checked }))
            }
          />
          數線
        </label>
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            cursor: 'pointer',
          }}
        >
          <input
            type="checkbox"
            checked={state.animate}
            onChange={(e) => setState((s) => ({ ...s, animate: e.target.checked }))}
          />
          動畫
        </label>
      </ControlsPill>
    </div>
  )
}
