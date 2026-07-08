import React, { useState, useRef } from 'react'
import AppHeader from '../../shared/components/AppHeader'
import InteractiveBars from '../../shared/components/InteractiveBars'
import ModeSelector from '../../shared/components/ModeSelector'
import ConversionPanel from '../../shared/components/ConversionPanel'
import GuidedTour from '../../shared/components/GuidedTour'
import { intfracconvTourSteps } from '../../shared/tours/intfracconv'
import './app.css'

type InputMode = 'whole' | 'fraction' | 'mixed'

export default function App() {
  // State
  const [mode, setMode] = useState<InputMode>('mixed')
  const [whole, setWhole] = useState<number>(1)
  const [numerator, setNumerator] = useState<number>(1)
  const [denominator, setDenominator] = useState<number>(3)
  const [barHeight, setBarHeight] = useState<number>(45)
  const [unitWidth, setUnitWidth] = useState<number>(150)
  const [menuVisible, setMenuVisible] = useState<boolean>(false)
  const [menuX, setMenuX] = useState<number>(0)
  const [menuY, setMenuY] = useState<number>(0)

  const inputAreaRef = useRef<HTMLDivElement>(null)
  const longPressTimer = useRef<number | null>(null)

  // Calculate actual values based on mode
  const getActualValues = () => {
    let actualW = whole
    let actualN = numerator

    // In fraction mode, whole is 0
    if (mode === 'fraction') {
      actualW = 0
    }

    // In whole mode, numerator is 0
    if (mode === 'whole') {
      actualN = 0
    }

    return { actualW, actualN }
  }

  const { actualW, actualN } = getActualValues()

  // Handlers
  const handleModeChange = (newMode: InputMode) => {
    setMode(newMode)
    // Reset all inputs to 1 when changing mode
    setWhole(1)
    setNumerator(1)
    setDenominator(1)
  }

  const handleWholeChange = (value: string) => {
    let num = parseInt(value)
    if (isNaN(num) || num <= 0) num = 1
    if (num > 100) num = 100
    setWhole(num)
  }

  const handleNumeratorChange = (value: string) => {
    let num = parseInt(value)
    if (isNaN(num) || num <= 0) num = 1
    if (num > 100) num = 100
    setNumerator(num)
  }

  const handleDenominatorChange = (value: string) => {
    let num = parseInt(value)
    if (isNaN(num) || num <= 0) num = 1
    if (num > 100) num = 100
    setDenominator(num)
  }

  const handleCellClick = (clickedTotalCells: number, d: number) => {
    if (mode === 'fraction') {
      // Fraction mode: just set numerator
      setWhole(1)
      setNumerator(clickedTotalCells)
    } else if (mode === 'whole') {
      // Whole mode: ceil to next whole
      const w = Math.ceil(clickedTotalCells / d)
      setWhole(w > 0 ? w : 1)
      setNumerator(1)
    } else {
      // Mixed mode: split into whole and remainder
      const w = Math.floor(clickedTotalCells / d)
      const n = clickedTotalCells % d
      
      setWhole(w < 1 ? 1 : w)
      setNumerator(n < 1 ? 1 : n)
    }
  }

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    setMenuX(e.pageX)
    setMenuY(e.pageY)
    setMenuVisible(true)
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    longPressTimer.current = window.setTimeout(() => {
      setMenuX(e.touches[0].pageX)
      setMenuY(e.touches[0].pageY)
      setMenuVisible(true)
    }, 600)
  }

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }

  return (
    <div className="app-container">
      <AppHeader
        leftSlot={<div className="title-badge">整數與分數互換</div>}
        rightSlot={<GuidedTour steps={intfracconvTourSteps} />}
      />

      <InteractiveBars
        whole={actualW}
        numerator={actualN}
        denominator={denominator}
        barHeight={barHeight}
        unitWidth={unitWidth}
        onCellClick={handleCellClick}
      />

      <div className="dashboard">
        <div className="input-section">
          <div className="info-title">請輸入數值</div>
          <div
            ref={inputAreaRef}
            className="fraction-ui"
            onContextMenu={handleContextMenu}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <input
              type="number"
              id="inputWhole"
              value={whole}
              min={1}
              max={100}
              onChange={(e) => handleWholeChange(e.target.value)}
              style={{
                display: mode === 'fraction' ? 'none' : 'block',
                width: '55px',
                padding: '5px',
                textAlign: 'center',
                fontSize: '1.2em',
                fontWeight: 'bold',
                border: '2px solid var(--integer-green)',
                backgroundColor: 'white',
                borderRadius: '4px'
              }}
            />
            <div
              className="fraction-part"
              style={{
                display: mode === 'whole' ? 'none' : 'inline-flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}
            >
              <input
                type="number"
                id="inputNum"
                value={numerator}
                min={1}
                max={100}
                onChange={(e) => handleNumeratorChange(e.target.value)}
                style={{
                  width: '55px',
                  padding: '5px',
                  textAlign: 'center',
                  fontSize: '1.2em',
                  fontWeight: 'bold',
                  color: 'var(--primary-red)',
                  border: '2px solid #ff9999',
                  borderRadius: '4px'
                }}
              />
              <div className="f-line" style={{
                width: '100%',
                height: '2px',
                background: 'black',
                margin: '4px 0'
              }} />
              <input
                type="number"
                id="inputDen"
                value={denominator}
                min={1}
                max={100}
                onChange={(e) => handleDenominatorChange(e.target.value)}
                style={{
                  width: '55px',
                  padding: '5px',
                  textAlign: 'center',
                  fontSize: '1.2em',
                  fontWeight: 'bold',
                  color: 'var(--border-blue)',
                  border: '2px solid #9999ff',
                  borderRadius: '4px'
                }}
              />
            </div>
            <span className="mode-hint">
              網頁版可右點擊,<br />平板可長按以切換模式
            </span>
          </div>

          <div className="settings">
            <div>
              <label>長條圖高度：</label>
              <input
                type="range"
                id="heightSlider"
                min={0}
                max={100}
                value={barHeight}
                onChange={(e) => setBarHeight(parseInt(e.target.value))}
              />
            </div>
            <div style={{ marginTop: '10px' }}>
              <label>單位闊度：</label>
              <input
                type="range"
                id="widthSlider"
                min={50}
                max={300}
                value={unitWidth}
                onChange={(e) => setUnitWidth(parseInt(e.target.value))}
              />
            </div>
          </div>
        </div>

        <ConversionPanel
          whole={actualW}
          numerator={actualN}
          denominator={denominator}
        />
      </div>

      <ModeSelector
        visible={menuVisible}
        x={menuX}
        y={menuY}
        onSelect={handleModeChange}
        onClose={() => setMenuVisible(false)}
      />
    </div>
  )
}
