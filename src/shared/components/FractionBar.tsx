interface FractionBarProps {
  label: string
  numerator: number
  denominator: number
  totalSegments: number
  fillColor: string
  operation: '×' | '÷'
  factorNum: number
  factorDen: number
  animate: boolean
  speedMultiplier: number
}

export default function FractionBar({
  label,
  numerator,
  denominator,
  totalSegments,
  fillColor,
  operation,
  factorNum,
  factorDen,
  animate,
  speedMultiplier,
}: FractionBarProps) {
  const ratio = numerator / denominator
  const scale = Math.max(1, ratio)
  const fillPercentage = (ratio / scale) * 100

  // Calculate animation timing
  const maxFactor = Math.max(factorNum, factorDen)
  const baseAnimDuration = maxFactor > 3 ? 2.0 : 4.0
  const animDuration = baseAnimDuration / speedMultiplier

  const renderGridOverlay = () => {
    const segments: JSX.Element[] = []

    for (let i = 1; i <= totalSegments; i++) {
      segments.push(<div key={`seg-${i}`} className="segment" />)

      if (i < totalSegments) {
        const isMainLine =
          (i % factorDen === 0 && operation === '÷') ||
          (operation === '×' && i % factorDen === 0)

        if (operation === '×') {
          if (isMainLine || factorDen === 1) {
            segments.push(<div key={`div-${i}`} className="divider-thick" />)
          } else {
            const initialHeight = animate ? '0%' : '100%'
            segments.push(
              <div key={`div-${i}`} className="divider-thin">
                <div
                  className="anim-line"
                  style={{
                    height: initialHeight,
                    background: 'var(--accent)',
                    transition: `height ${animDuration}s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.5s`,
                  }}
                />
              </div>
            )
          }
        } else {
          // Divide mode
          if (factorDen === 1) {
            segments.push(<div key={`div-${i}`} className="divider-thick" />)
          } else if (isMainLine) {
            segments.push(<div key={`div-${i}`} className="divider-thick" />)
          } else {
            const initialHeight = animate ? '100%' : '0%'
            segments.push(
              <div key={`div-${i}`} className="divider-thin">
                <div
                  className="anim-line"
                  style={{
                    height: initialHeight,
                    background: 'var(--grid-dark)',
                    transition: `height ${animDuration}s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.5s`,
                  }}
                />
              </div>
            )
          }
        }
      }
    }

    return <div className="grid-overlay">{segments}</div>
  }

  // Trigger animation after mount
  React.useEffect(() => {
    if (animate && factorDen !== 1) {
      const baseBgTimeout = maxFactor > 3 ? 1800 : 3800
      const bgTimeout = baseBgTimeout / speedMultiplier

      const timer = setTimeout(() => {
        const lines = document.querySelectorAll('.anim-line')
        lines.forEach((l) => {
          const line = l as HTMLElement
          line.style.height = operation === '×' ? '100%' : '0%'
          if (operation === '×') {
            setTimeout(() => {
              line.style.background = 'var(--grid-dark)'
            }, bgTimeout)
          }
        })
      }, 50)

      return () => clearTimeout(timer)
    }
  }, [animate, factorDen, operation, speedMultiplier, maxFactor])

  return (
    <div>
      <div
        className="bar-label"
        style={{
          color: fillColor,
          justifyContent: 'space-between',
          display: 'flex',
          width: '100%',
        }}
      >
        <span>{label}</span>
      </div>
      <div
        style={{
          width: '100%',
          overflowX: 'auto',
          overflowY: 'hidden',
          paddingBottom: '15px',
          borderRadius: '8px',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <div
          id="scale_wrapper"
          style={{
            width: `${scale * 100}%`,
            minWidth: '100%',
            transition: 'width 0.3s ease',
          }}
        >
          <div
            className="bar-container"
            style={{
              borderColor: fillColor,
              width: '100%',
            }}
          >
            <div
              className="bar-fill"
              style={{
                background: fillColor,
                opacity: 0.8,
                pointerEvents: 'none',
                width: `${fillPercentage}%`,
              }}
            />
            {renderGridOverlay()}
          </div>
        </div>
      </div>
    </div>
  )
}

// Import React for useEffect
import React from 'react'
