interface NumberLineDisplayProps {
  denominator: number
  totalSegments: number
  visible: boolean
}

export default function NumberLineDisplay({
  denominator,
  totalSegments,
  visible,
}: NumberLineDisplayProps) {
  if (!visible) return null

  const renderTicks = () => {
    const ticks: JSX.Element[] = []

    for (let i = 0; i <= totalSegments; i++) {
      const leftPos = (i / totalSegments) * 100
      let labelContent: string | JSX.Element

      if (i === 0) {
        labelContent = '0'
      } else if (i === denominator) {
        labelContent = '1'
      } else if (i % denominator === 0) {
        labelContent = (i / denominator).toString()
      } else {
        labelContent = (
          <span className="nl-frac">
            <span className="nl-num">{i}</span>
            <span className="nl-line-frac" />
            <span className="nl-den">{denominator}</span>
          </span>
        )
      }

      ticks.push(
        <div
          key={`tick-${i}`}
          className="nl-tick-wrapper"
          style={{ left: `${leftPos}%` }}
        >
          <div className="nl-tick" />
          <div className="nl-label">{labelContent}</div>
        </div>
      )
    }

    return ticks
  }

  return (
    <div className="number-line-wrapper" style={{ display: visible ? 'block' : 'none' }}>
      <div className="number-line-container">
        <div className="nl-line" />
        <div id="nl_ticks">{renderTicks()}</div>
      </div>
    </div>
  )
}
