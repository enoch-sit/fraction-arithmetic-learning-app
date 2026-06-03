// No React import needed for functional components

interface ConversionPanelProps {
  whole: number
  numerator: number
  denominator: number
}

export default function ConversionPanel({ whole, numerator, denominator }: ConversionPanelProps) {
  // Calculate total numerator
  const totalNum = whole * denominator + numerator
  const actualW = Math.floor(totalNum / denominator)
  const actualN = totalNum % denominator

  // Determine type
  let type = "分數"
  if (whole > 0 && numerator > 0) {
    type = "帶分數"
  } else if (numerator === 0) {
    type = "整數"
  } else if (whole === 0 && numerator > 0) {
    if (numerator < denominator) {
      type = "真分數"
    } else {
      type = "假分數"
    }
  }

  // Helper to render stacked fraction
  const renderFraction = (num: number, den: number) => (
    <div style={{
      display: 'inline-flex',
      flexDirection: 'column',
      alignItems: 'center',
      verticalAlign: 'middle',
      fontSize: '13px',
      lineHeight: 1.2
    }}>
      <span style={{
        borderBottom: '1.5px solid #333',
        padding: '0 2px',
        width: '100%',
        textAlign: 'center',
        color: 'var(--primary-red)',
        fontWeight: 'bold'
      }}>{num}</span>
      <span style={{
        padding: '0 2px',
        width: '100%',
        textAlign: 'center',
        color: 'var(--border-blue)'
      }}>{den}</span>
    </div>
  )

  // Helper to render mixed number
  const renderMixed = (w: number, n: number, d: number) => (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
      <span style={{ fontSize: '15px', fontWeight: 'bold', color: 'var(--integer-green)' }}>
        {w}
      </span>
      {renderFraction(n, d)}
    </div>
  )

  // Build conversion HTML
  const conversions = []

  // To fraction conversion
  if (totalNum > 0 && !(whole === 0 && numerator === totalNum)) {
    conversions.push(
      <div key="to-fraction" style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
        轉換為分數：
        <div style={{ marginLeft: '10px' }}>
          {renderFraction(totalNum, denominator)}
        </div>
      </div>
    )
  }

  // To mixed number conversion
  if (actualW > 0 && actualN > 0 && !(whole === actualW && numerator === actualN)) {
    conversions.push(
      <div key="to-mixed" style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
        轉換為帶分數：
        <div style={{ marginLeft: '10px' }}>
          {renderMixed(actualW, actualN, denominator)}
        </div>
      </div>
    )
  }

  // To whole number conversion
  if (actualN === 0 && !(whole === actualW && numerator === 0)) {
    conversions.push(
      <div key="to-whole" style={{ marginBottom: '8px' }}>
        轉換為整數：
        <strong style={{ color: 'var(--integer-green)', marginLeft: '10px', fontSize: '1.1em' }}>
          {actualW}
        </strong>
      </div>
    )
  }

  // Current value display
  let currentValDisplay
  if (whole > 0 && numerator > 0) {
    currentValDisplay = renderMixed(whole, numerator, denominator)
  } else if (numerator > 0) {
    currentValDisplay = renderFraction(numerator, denominator)
  } else {
    currentValDisplay = (
      <strong style={{ color: 'var(--integer-green)', fontSize: '1.1em' }}>
        {whole}
      </strong>
    )
  }

  return (
    <div className="info-section" style={{
      padding: '15px',
      border: '1px solid #cbd5e0',
      backgroundColor: '#fff',
      borderRadius: '5px'
    }}>
      <div className="info-title" style={{
        color: '#2d3748',
        fontWeight: 'bold',
        marginBottom: '10px',
        borderBottom: '1px solid #edf2f7'
      }}>
        數值轉換與解析
      </div>
      <div style={{ marginTop: '10px', marginBottom: '15px', fontSize: '1.05em' }}>
        <div style={{ display: 'flex', alignItems: 'center', minHeight: '30px', marginBottom: '8px' }}>
          {currentValDisplay}
        </div>
        <div>類型：<strong>{type}</strong></div>
      </div>
      <div style={{ marginBottom: '15px' }}>
        {conversions}
      </div>
    </div>
  )
}
