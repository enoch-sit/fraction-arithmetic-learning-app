import type { ReactNode } from 'react'

interface ControlsPillProps {
  /** Checkbox labels — rendered before the speed divider */
  children: ReactNode
  speedId: string
  speedLabelId: string
  onSpeedChange: (val: string) => void
}

export default function ControlsPill({
  children,
  speedId,
  speedLabelId,
  onSpeedChange,
}: ControlsPillProps) {
  return (
    <div className="controls-pill">
      {children}
      <div className="divider" />
      <div className="speed-ctrl">
        動畫速度: <span id={speedLabelId}>1.0</span>x
        <input
          type="range"
          id={speedId}
          min="0.5"
          max="3"
          step="0.1"
          defaultValue="1"
          onInput={(e) => onSpeedChange((e.target as HTMLInputElement).value)}
        />
      </div>
    </div>
  )
}
