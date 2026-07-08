import React, { useState, useEffect, useRef } from 'react';
import { AppHeader } from '../../shared/components/AppHeader';
import './app.css';

const IntegerPartsApp = () => {
  const [mode, setMode] = useState('mixed'); // 'whole', 'fraction', 'mixed'
  const [whole, setWhole] = useState(1);
  const [num, setNum] = useState(1);
  const [den, setDen] = useState(3);
  const [barHeight, setBarHeight] = useState(45);
  const [unitWidth, setUnitWidth] = useState(150);

  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0 });

  const inputAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleRightClick = (e: MouseEvent) => {
      if (inputAreaRef.current?.contains(e.target as Node)) {
        e.preventDefault();
        setContextMenu({ visible: true, x: e.pageX, y: e.pageY });
      } else {
        setContextMenu({ visible: false, x: 0, y: 0 });
      }
    };

    const handleClick = () => {
      setContextMenu({ visible: false, x: 0, y: 0 });
    };

    document.addEventListener('contextmenu', handleRightClick);
    document.addEventListener('click', handleClick);

    return () => {
      document.removeEventListener('contextmenu', handleRightClick);
      document.removeEventListener('click', handleClick);
    };
  }, []);

  const handleModeChange = (newMode: string) => {
    setMode(newMode);
    setWhole(1);
    setNum(1);
    setDen(1);
  };

  const handleCellClick = (clickedTotalCells: number, d: number) => {
    if (mode === 'fraction') {
        setNum(clickedTotalCells);
    } else if (mode === 'whole') {
        let w = Math.ceil(clickedTotalCells / d);
        setWhole(w > 0 ? w : 1);
    } else { // mixed
        let w = Math.floor(clickedTotalCells / d);
        let n = clickedTotalCells % d;
        if (w < 1) w = 1;
        if (n < 1) n = 1;
        setWhole(w);
        setNum(n);
    }
  }

  const renderBars = () => {
    const container = [];
    let displayD = den;
    let totalFilledCells = (mode === 'fraction' ? 0 : whole) * den + (mode === 'whole' ? 0 : num);

    if (mode === 'whole') {
      displayD = 1;
      totalFilledCells = whole;
    }

    const totalUnitsNeeded = Math.max(Math.ceil(totalFilledCells / displayD), 1);

    for (let u = 0; u < totalUnitsNeeded; u++) {
      const cells = [];
      let filledInThisUnit = 0;
      if (totalFilledCells > u * displayD) {
        filledInThisUnit = Math.min(displayD, totalFilledCells - u * displayD);
      }

      for (let i = 0; i < displayD; i++) {
        cells.push(
          <div
            key={i}
            className={`cell ${i < filledInThisUnit ? 'filled' : ''}`}
            onClick={() => handleCellClick((u * displayD) + i + 1, displayD)}
          />
        );
      }

      const labels = [];
      for (let i = 0; i <= displayD; i++) {
          if (i === displayD && u < totalUnitsNeeded - 1) continue;

          let valWhole = u, valRem = i;
          if (i === displayD) { valWhole = u + 1; valRem = 0; }

          labels.push(
              <div key={i} className="bar-label" style={{ left: `${(i / displayD) * 100}%` }}>
                  {valRem === 0 ? (
                      <span className="main">{valWhole}</span>
                  ) : (
                      valWhole === 0 ? (
                        <div className="stacked-fraction"><span className="num">{valRem}</span><span className="den">{displayD}</span></div>
                      ) : (
                        <div className="mixed-number"><span className="whole">{valWhole}</span><div className="stacked-fraction"><span className="num">{valRem}</span><span className="den">{displayD}</span></div></div>
                      )
                  )}
              </div>
          )
      }

      container.push(
        <div key={u} className="bar-wrapper" style={{ width: `${unitWidth}px` }}>
          <div className="unit-bar" style={{ height: `${Math.max(barHeight, 4)}px` }}>
            <div className="center-line" />
            <div className="border-overlay" />
            {cells}
          </div>
          <div className="label-row">
            {labels}
          </div>
        </div>
      );
    }
    return container;
  };

  const renderExplanation = () => {
    const totalNum = (mode === 'fraction' ? 0 : whole) * den + (mode === 'whole' ? 0 : num);
    const actualW = Math.floor(totalNum / den);
    const actualN = totalNum % den;

    let type = "分數";
    if (mode === 'mixed') {
        type = "帶分數";
    } else if (mode === 'whole') {
        type = "整數";
    } else if (mode === 'fraction') {
        if (num < den) {
            type = "真分數";
        } else {
            type = "假分數";
        }
    }
    
    const fFrac = (nu: number, de: number) => <div className="stacked-fraction"><span className="num">{nu}</span><span className="den">{de}</span></div>;
    const fMix = (wh: number, nu: number, de: number) => <div className="mixed-number"><span className="whole">{wh}</span>{fFrac(nu, de)}</div>;

    let currentValHtml;
    if (mode === 'mixed') {
        currentValHtml = fMix(whole, num, den);
    } else if (mode === 'fraction') {
        currentValHtml = fFrac(num, den);
    } else {
        currentValHtml = <strong style={{color: 'var(--integer-green)', fontSize: '1.1em'}}>{whole}</strong>;
    }

    const conversions = [];
    if (totalNum > 0 && !(mode === 'fraction' && num === totalNum)) {
        conversions.push(<div key="toImproper" style={{display: 'flex', alignItems: 'center', marginBottom: '8px'}}>轉換為假分數：<div style={{marginLeft: '10px'}}>{fFrac(totalNum, den)}</div></div>);
    }
    if (actualW > 0 && actualN > 0 && !(mode === 'mixed' && whole === actualW && num === actualN)) {
        conversions.push(<div key="toMixed" style={{display: 'flex', alignItems: 'center', marginBottom: '8px'}}>轉換為帶分數：<div style={{marginLeft: '10px'}}>{fMix(actualW, actualN, den)}</div></div>);
    }
    if (actualN === 0 && !(mode === 'whole' && whole === actualW)) {
        conversions.push(<div key="toWhole" style={{marginBottom: '8px'}}>轉換為整數：<strong style={{color: 'var(--integer-green)', marginLeft: '10px', fontSize: '1.1em'}}>{actualW}</strong></div>);
    }

    return (
        <div>
            <div className="info-title">當前數值分析</div>
            <div style={{ marginTop: '10px', marginBottom: '15px', fontSize: '1.05em' }}>
                <div style={{display: 'flex', alignItems: 'center', minHeight: '30px', marginBottom: '8px'}}>{currentValHtml}</div>
                <div>類型：<strong>{type}</strong></div>
            </div>
            <div style={{marginBottom: '15px'}}>{conversions}</div>
        </div>
    )
  }

  return (
    <div>
      <AppHeader title="整數與分數互換" />
      <div className="app-container">
        <div id="barsDisplay" className="bars-container">
          {renderBars()}
        </div>
        <div className="dashboard">
          <div className="input-section" ref={inputAreaRef}>
            <div className="info-title">調整數值</div>
            <div className="fraction-ui" id="inputArea">
              {mode !== 'fraction' && (
                <input type="number" id="inputWhole" value={whole} onChange={e => setWhole(Math.max(1, parseInt(e.target.value) || 1))} min="1" max="100" />
              )}
              {mode !== 'whole' && (
                <div className="fraction-input-stack" id="fractionPart">
                  <input type="number" id="inputNum" value={num} onChange={e => setNum(Math.max(1, parseInt(e.target.value) || 1))} min="1" max="100" />
                  <div className="f-line"></div>
                  <input type="number" id="inputDen" value={den} onChange={e => setDen(Math.max(1, parseInt(e.target.value) || 1))} min="1" max="100" />
                </div>
              )}
              <span className="mode-hint">右鍵點擊此區域<br/>可切換輸入模式</span>
            </div>
            <div className="settings" style={{ marginTop: '20px' }}>
              <div>
                <label>調整高度：</label>
                <input type="range" id="heightSlider" min="0" max="100" value={barHeight} onInput={e => setBarHeight(parseInt((e.target as HTMLInputElement).value))} />
              </div>
              <div style={{ marginTop: '10px' }}>
                <label>調整寬度：</label>
                <input type="range" id="widthSlider" min="50" max="300" value={unitWidth} onInput={e => setUnitWidth(parseInt((e.target as HTMLInputElement).value))} />
              </div>
            </div>
          </div>
          <div className="info-section" id="explanationText">
            {renderExplanation()}
          </div>
        </div>
      </div>
      {contextMenu.visible && (
        <div id="customContextMenu" style={{ top: contextMenu.y, left: contextMenu.x }}>
          <div onClick={() => handleModeChange('whole')}>整數</div>
          <div onClick={() => handleModeChange('fraction')}>分數</div>
          <div onClick={() => handleModeChange('mixed')}>帶分數</div>
        </div>
      )}
    </div>
  );
};

function App() {
    return <IntegerPartsApp />;
}

export default App;
