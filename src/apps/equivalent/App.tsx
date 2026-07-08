import { useEffect, useState, useMemo } from 'react'
import './app.css'
import AppHeader from '../../shared/components/AppHeader'
import ControlsPill from '../../shared/components/ControlsPill'
import ActionButtonRow from '../../shared/components/ActionButtonRow'
import QuestionBanner from '../../shared/components/QuestionBanner'
import StepperInput from '../../shared/components/StepperInput'
import FractionBar from '../../shared/components/FractionBar'
import NumberLineDisplay from '../../shared/components/NumberLineDisplay'

const LIMITS = {
  numStart: 20,
  denStart: 20,
  factor: 10,
}

export default function App() {
  const [mode, setMode] = useState<'sync' | 'independent'>('sync');
  const [operation, setOperation] = useState<'×' | '÷'>('×');
  const [numerator, setNumerator] = useState(1);
  const [denominator, setDenominator] = useState(4);
  const [factorNum, setFactorNum] = useState(1);
  const [factorDen, setFactorDen] = useState(1);
  const [targetNum, setTargetNum] = useState<number | null>(1);
  const [targetDen, setTargetDen] = useState<number | null>(4);
  const [showNumberLine, setShowNumberLine] = useState(false);
  const [animate, setAnimate] = useState(true);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const [errorMsg, setErrorMsg] = useState('');

  const { resultNum, resultDen } = useMemo(() => {
    if (operation === '×') {
      return { resultNum: numerator * factorNum, resultDen: denominator * factorDen };
    } else {
      if (factorNum !== factorDen) return { resultNum: NaN, resultDen: NaN };
      if (numerator % factorNum !== 0 || denominator % factorDen !== 0) {
        return { resultNum: NaN, resultDen: NaN };
      }
      return { resultNum: numerator / factorNum, resultDen: denominator / factorDen };
    }
  }, [numerator, denominator, operation, factorNum, factorDen]);

  useEffect(() => {
    let error = '';
    if (operation === '÷') {
      if (factorNum !== factorDen) {
        error = '⚠️ 除法模式下，分子和分母的除數必須相同';
      } else if (numerator % factorNum !== 0 || denominator % factorNum !== 0) {
        error = `⚠️ 除法模式下，分子和分母都必須能被 ${factorNum} 整除`;
      }
    }
    if (!error && mode === 'independent' && targetNum !== null && targetDen !== null) {
      if (resultNum !== targetNum || resultDen !== targetDen) {
        error = '⚠️ 等式兩邊不相等';
      }
    }
    setErrorMsg(error);
  }, [operation, factorNum, factorDen, numerator, denominator, mode, targetNum, targetDen, resultNum, resultDen]);

  useEffect(() => {
    if (mode === 'sync') {
      if (!isNaN(resultNum) && !isNaN(resultDen)) {
        setTargetNum(resultNum);
        setTargetDen(resultDen);
      } else {
        setTargetNum(null);
        setTargetDen(null);
      }
    }
  }, [mode, resultNum, resultDen]);

  const handleFactorNumChange = (val: number) => {
    setFactorNum(val);
    if (mode === 'sync' || operation === '÷') {
      setFactorDen(val);
    }
  };

  const handleFactorDenChange = (val: number) => {
    setFactorDen(val);
    if (mode === 'sync' || operation === '÷') {
      setFactorNum(val);
    }
  };

  const toggleMode = () => setMode(m => m === 'sync' ? 'independent' : 'sync');
  const toggleOperation = () => setOperation(op => op === '×' ? '÷' : '×');

  const handleRandom = () => {
    setNumerator(Math.floor(Math.random() * LIMITS.numStart) + 1);
    setDenominator(Math.floor(Math.random() * LIMITS.denStart) + 1);
    setFactorNum(1);
    setFactorDen(1);
  };

  const handleSwap = () => {
    if (targetNum === null || targetDen === null) return;
    setNumerator(targetNum);
    setDenominator(targetDen);
    setTargetNum(numerator);
    setTargetDen(denominator);
  };

  const isResultValid = !isNaN(resultNum) && !isNaN(resultDen);
  const isMatch = mode === 'independent' && targetNum !== null && targetDen !== null && isResultValid && resultNum === targetNum && resultDen === targetDen;
  const totalSegments = operation === '×' ? denominator * factorDen : denominator;

  return (
    <div>
      <AppHeader title="相等分數 (約分/擴分)" />
      <QuestionBanner question="在空格內填上正確的數字" />

      <div className="math-engine">
        <div className="fraction-box">
          <input type="text" className="fraction-input" value={numerator} readOnly />
          <div className="fraction-line" />
          <input type="text" className="fraction-input" value={denominator} readOnly />
        </div>

        <div className="eq-sign">=</div>

        <div className="process-container">
          <div className="row-align">
            <div className="base-num">{numerator}</div>
            <div className="op-select" onClick={toggleOperation}>{operation}</div>
            <StepperInput id="factor_num" value={factorNum} min={1} max={LIMITS.factor} onInput={handleFactorNumChange} />
          </div>
          <div className="row-align">
            <div className="base-num">{denominator}</div>
            <div className="op-select" onClick={toggleOperation}>{operation}</div>
            <StepperInput id="factor_den" value={factorDen} min={1} max={LIMITS.factor} onInput={handleFactorDenChange} disabled={mode === 'sync' || operation === '÷'} />
          </div>
        </div>

        <div className="eq-sign">{mode === 'independent' && !isMatch ? '≠' : '='}</div>

        <div className="fraction-box">
          {mode === 'sync' ? (
            <>
              <input type="text" className="fraction-input" value={targetNum ?? '?'} readOnly />
              <div className="fraction-line" />
              <input type="text" className="fraction-input" value={targetDen ?? '?'} readOnly />
            </>
          ) : (
            <>
              <StepperInput id="target_num" value={targetNum ?? 1} min={1} max={LIMITS.numStart * LIMITS.factor} onInput={setTargetNum} />
              <div className="fraction-line" />
              <StepperInput id="target_den" value={targetDen ?? 1} min={1} max={LIMITS.denStart * LIMITS.factor} onInput={setTargetDen} />
            </>
          )}
        </div>
      </div>

      {errorMsg && <div id="error_msg">{errorMsg}</div>}

      <div style={{ marginBottom: '15px' }}>
        <StepperInput id="numerator" value={numerator} min={1} max={LIMITS.numStart} onInput={setNumerator} />
        <StepperInput id="denominator" value={denominator} min={1} max={LIMITS.denStart} onInput={setDenominator} />
      </div>

      <div className="visual-stack">
        <FractionBar
          label={`原始分數: ${numerator}/${denominator}`}
          numerator={numerator}
          denominator={denominator}
          totalSegments={denominator}
        />
        {isResultValid && targetNum !== null && targetDen !== null && (
          <FractionBar
            label={`結果分數: ${targetNum}/${targetDen}`}
            numerator={targetNum}
            denominator={targetDen}
            totalSegments={totalSegments}
            animate={animate}
            speedMultiplier={speedMultiplier}
          />
        )}
      </div>

      <NumberLineDisplay denominator={denominator} totalSegments={totalSegments} visible={showNumberLine} />

      <ActionButtonRow
        primary={{ id: 'btn_random', label: '🎲 隨機', onClick: handleRandom }}
        secondary={{ id: 'btn_swap', label: '⇅ 交換', onClick: handleSwap }}
      />

      <button id="btn_toggle_sync" onClick={toggleMode} style={{
        margin: '10px auto', display: 'block', padding: '10px 20px', fontSize: '1rem', fontWeight: 'bold',
        borderRadius: '8px', border: '2px solid var(--accent)',
        background: mode === 'sync' ? 'var(--accent)' : 'white',
        color: mode === 'sync' ? 'white' : 'var(--accent)',
        cursor: 'pointer',
      }}>
        {mode === 'sync' ? '🔒 同步模式' : '🔓 獨立模式'}
      </button>

      <ControlsPill onSpeedChange={setSpeedMultiplier}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
          <input type="checkbox" checked={showNumberLine} onChange={e => setShowNumberLine(e.target.checked)} />
          數線
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
          <input type="checkbox" checked={animate} onChange={e => setAnimate(e.target.checked)} />
          動畫
        </label>
      </ControlsPill>
    </div>
  )
}

