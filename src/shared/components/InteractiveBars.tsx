// No React import needed for functional components

interface InteractiveBarsProps {
  whole: number          // Whole number part
  numerator: number      // Numerator (0 if whole mode)
  denominator: number    // Denominator
  barHeight: number      // Height in pixels (affects mode interpolation)
  unitWidth: number      // Width per bar in pixels
  onCellClick: (totalCells: number, denominator: number) => void
}

export default function InteractiveBars({
  whole,
  numerator,
  denominator,
  barHeight,
  unitWidth,
  onCellClick
}: InteractiveBarsProps) {
  // Calculate interpolation factor for mode transition
  // f = 0: full bar mode, f = 1: full fraction mode
  let f = 0
  if (barHeight <= 6) f = 1
  else if (barHeight >= 26) f = 0
  else f = (26 - barHeight) / 20

  // Calculate display parameters
  let displayD = denominator
  let totalFilledCells = (whole * denominator) + numerator

  // If input is whole number (numerator = 0), don't show divisions
  if (numerator === 0) {
    displayD = 1
    totalFilledCells = whole
  }

  // Calculate number of bars needed
  const totalUnitsNeeded = Math.max(Math.ceil(totalFilledCells / displayD), 1)

  // Render bars
  const bars = []
  for (let u = 0; u < totalUnitsNeeded; u++) {
    const filledInThisUnit = Math.min(displayD, Math.max(0, totalFilledCells - (u * displayD)))
    
    // Create cells for this bar
    const cells = []
    for (let i = 0; i < displayD; i++) {
      const isFilled = i < filledInThisUnit
      cells.push(
        <div
          key={i}
          className={`cell ${isFilled ? 'filled' : ''}`}
          onClick={() => onCellClick((u * displayD) + i + 1, displayD)}
          style={{
            flex: 1,
            position: 'relative',
            cursor: 'pointer',
            zIndex: 2,
            backgroundColor: isFilled ? 'var(--primary-red)' : 'transparent',
            transition: 'background-color 0.2s'
          }}
        >
          {/* Vertical divider after each cell */}
          <div style={{
            content: '',
            position: 'absolute',
            right: 0,
            top: '50%',
            transform: 'translateY(-50%)',
            width: '1px',
            height: `calc(100% * ${1 - f} + 12px * ${f})`,
            backgroundColor: '#666',
            zIndex: 3,
            pointerEvents: 'none',
            opacity: i === displayD - 1 ? f : 1
          }} />
        </div>
      )
    }

    // Create labels for this bar
    const labels = []
    for (let i = 0; i <= displayD; i++) {
      // Skip right edge label if not last bar in row
      if (i === displayD && u < totalUnitsNeeded - 1) continue

      let valWhole = u
      let valRem = i
      if (i === displayD) {
        valWhole = u + 1
        valRem = 0
      }

      const labelContent = valRem === 0 ? (
        <span className="main" style={{ fontWeight: 'bold', fontSize: '15px', color: 'var(--integer-green)' }}>
          {valWhole}
        </span>
      ) : (
        valWhole === 0 ? (
          <div className="stacked-fraction" style={{
            display: 'inline-flex',
            flexDirection: 'column',
            alignItems: 'center',
            verticalAlign: 'middle',
            fontSize: '13px',
            lineHeight: 1.2
          }}>
            <span className="num" style={{
              borderBottom: '1.5px solid #333',
              padding: '0 2px',
              width: '100%',
              textAlign: 'center',
              color: 'var(--primary-red)',
              fontWeight: 'bold'
            }}>{valRem}</span>
            <span className="den" style={{
              padding: '0 2px',
              width: '100%',
              textAlign: 'center',
              color: 'var(--border-blue)'
            }}>{displayD}</span>
          </div>
        ) : (
          <div className="mixed-number" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <span className="whole" style={{ fontSize: '15px', fontWeight: 'bold', color: 'var(--integer-green)' }}>
              {valWhole}
            </span>
            <div className="stacked-fraction" style={{
              display: 'inline-flex',
              flexDirection: 'column',
              alignItems: 'center',
              verticalAlign: 'middle',
              fontSize: '13px',
              lineHeight: 1.2
            }}>
              <span className="num" style={{
                borderBottom: '1.5px solid #333',
                padding: '0 2px',
                width: '100%',
                textAlign: 'center',
                color: 'var(--primary-red)',
                fontWeight: 'bold'
              }}>{valRem}</span>
              <span className="den" style={{
                padding: '0 2px',
                width: '100%',
                textAlign: 'center',
                color: 'var(--border-blue)'
              }}>{displayD}</span>
            </div>
          </div>
        )
      )

      labels.push(
        <div
          key={i}
          className="bar-label"
          style={{
            position: 'absolute',
            left: `${(i / displayD) * 100}%`,
            transform: 'translateX(-50%)',
            whiteSpace: 'nowrap',
            display: 'flex',
            justifyContent: 'center',
            top: 0
          }}
        >
          {labelContent}
        </div>
      )
    }

    bars.push(
      <div
        key={u}
        className="bar-wrapper"
        style={{
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
          marginRight: '-2px',
          width: `${unitWidth}px`
        }}
      >
        <div
          className="unit-bar"
          style={{
            position: 'relative',
            display: 'flex',
            boxSizing: 'border-box',
            background: `rgba(255, 255, 255, ${1 - f})`,
            height: `${Math.max(barHeight, 4)}px`,
            marginTop: `${15 * f}px`,
            marginBottom: `${5 * f}px`,
            borderRadius: '2px'
          }}
        >
          {/* Third line at 1/3 height */}
          <div
            className="third-line"
            style={{
              position: 'absolute',
              top: '33.333%',
              left: 0,
              right: 0,
              height: '2px',
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              transform: 'translateY(-50%)',
              zIndex: 1,
              pointerEvents: 'none'
            }}
          />

          {/* Center line (visible in fraction mode) */}
          <div
            className="center-line"
            style={{
              position: 'absolute',
              top: '50%',
              left: 0,
              right: 0,
              height: '2px',
              backgroundColor: `rgba(51, 51, 51, ${f})`,
              transform: 'translateY(-50%)',
              zIndex: 1,
              pointerEvents: 'none'
            }}
          />

          {/* Border overlay */}
          <div
            className="border-overlay"
            style={{
              position: 'absolute',
              inset: 0,
              boxSizing: 'border-box',
              border: `2px solid rgba(0, 0, 255, ${1 - f})`,
              zIndex: 4,
              pointerEvents: 'none',
              borderRadius: '2px'
            }}
          />

          {/* Left tick mark */}
          <div style={{
            content: '',
            position: 'absolute',
            left: 0,
            top: '50%',
            transform: 'translateY(-50%)',
            width: '1px',
            height: `calc(100% * ${1 - f} + 12px * ${f})`,
            backgroundColor: '#666',
            opacity: f,
            zIndex: 3,
            pointerEvents: 'none'
          }} />

          {cells}
        </div>

        {/* Label row */}
        <div
          className="label-row"
          style={{
            position: 'relative',
            height: '30px',
            marginTop: `${5 + 5 * f}px`,
            width: '100%'
          }}
        >
          {labels}
        </div>
      </div>
    )
  }

  return (
    <div
      className="bars-container"
      style={{
        display: 'flex',
        flexWrap: 'nowrap',
        columnGap: 0,
        rowGap: '50px',
        marginBottom: '40px',
        minHeight: '80px',
        alignItems: 'flex-start',
        padding: '20px 50px',
        background: '#fafafa',
        border: '1px solid #eee',
        borderRadius: '4px',
        overflowX: 'auto'
      }}
    >
      {bars}
    </div>
  )
}
