import React from 'react'

interface FracInputStepperProps {
  id: string
  defaultValue?: number
  value?: number
  placeholder?: string
  min?: number
  max?: number
  onUpdate: () => void
  onShowBar?: () => void
  onChange?: (nextValue: number) => void
}

function step(id: string, delta: number, min: number, max: number, onUpdate: () => void, onShowBar: (() => void) | undefined, e: React.MouseEvent) {
  e.stopPropagation()
  const el = document.getElementById(id) as HTMLInputElement | null
  if (!el) return
  const current = parseFloat(el.value) || 0
  const next = Math.min(max, Math.max(min, current + delta))
  el.value = String(next)
  el.dispatchEvent(new Event('input', { bubbles: true }))
  onUpdate()
  onShowBar?.()
}

export default function FracInputStepper({
  id,
  defaultValue,
  value,
  placeholder,
  min = 1,
  max = 100,
  onUpdate,
  onShowBar,
  onChange,
}: FracInputStepperProps) {
  const isControlled = value !== undefined && onChange !== undefined

  const handleUp = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isControlled) {
      onChange!(Math.min(max, value! + 1))
    } else {
      step(id, 1, min, max, onUpdate, onShowBar, e)
    }
  }

  const handleDown = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isControlled) {
      onChange!(Math.max(min, value! - 1))
    } else {
      step(id, -1, min, max, onUpdate, onShowBar, e)
    }
  }

  return (
    <div className="frac-field">
      {isControlled ? (
        <input
          type="number"
          className="frac-input"
          id={id}
          value={value}
          placeholder={placeholder}
          min={min}
          max={max}
          inputMode="numeric"
          onChange={(e) => {
            const parsed = parseInt(e.target.value, 10)
            if (!Number.isNaN(parsed)) {
              onChange!(Math.min(max, Math.max(min, parsed)))
            }
          }}
        />
      ) : (
        <input
          type="number"
          className="frac-input"
          id={id}
          defaultValue={defaultValue}
          placeholder={placeholder}
          min={min}
          max={max}
          inputMode="numeric"
          onInput={onUpdate}
          onChange={onUpdate}
        />
      )}
      <div className="frac-step-group">
        <button
          className="frac-step-btn"
          onClick={handleUp}
          onMouseDown={(e) => e.preventDefault()}
          aria-label="increase"
          tabIndex={-1}
          type="button"
        >
          ▲
        </button>
        <button
          className="frac-step-btn"
          onClick={handleDown}
          onMouseDown={(e) => e.preventDefault()}
          aria-label="decrease"
          tabIndex={-1}
          type="button"
        >
          ▼
        </button>
      </div>
    </div>
  )
}
