interface StepperInputProps {
  id: string
  defaultValue: number
  min: number
  max: number
  /** CSS class on the <input> e.g. "num-input" or "den-input" */
  inputClassName?: string
  /** Extra class on the .input-wrapper div e.g. "start-wrap" or "factor-wrap" */
  wrapperClassName?: string
  /** id for the stepper group div */
  stepperGroupId?: string
  /** id for the outer wrapper div */
  wrapperId?: string
  onInput?: () => void
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void
  onStepUp: () => void
  onStepDown: () => void
}

export default function StepperInput({
  id,
  defaultValue,
  min,
  max,
  inputClassName = '',
  wrapperClassName = '',
  wrapperId,
  stepperGroupId,
  onInput,
  onBlur,
  onStepUp,
  onStepDown,
}: StepperInputProps) {
  return (
    <div id={wrapperId} className={`input-wrapper${wrapperClassName ? ' ' + wrapperClassName : ''}`}>
      <input
        type="number"
        id={id}
        className={inputClassName}
        defaultValue={defaultValue}
        min={min}
        max={max}
        inputMode="numeric"
        onKeyDown={(e) => {
          if (
            !/[0-9]/.test(e.key) &&
            e.key !== 'Backspace' &&
            e.key !== 'Tab' &&
            e.key !== 'ArrowLeft' &&
            e.key !== 'ArrowRight'
          )
            e.preventDefault()
        }}
        onInput={onInput}
        onBlur={onBlur}
      />
      <div className="stepper-btn-group" id={stepperGroupId}>
        <button className="step-btn up" onClick={onStepUp}>+</button>
        <button className="step-btn down" onClick={onStepDown}>-</button>
      </div>
    </div>
  )
}
