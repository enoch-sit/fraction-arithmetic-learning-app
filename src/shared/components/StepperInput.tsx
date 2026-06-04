import React from 'react';

interface StepperInputProps {
  id: string;
  value: number;
  min: number;
  max: number;
  onInput: (value: number) => void;
  disabled?: boolean;
  inputClassName?: string;
  wrapperClassName?: string;
}

export default function StepperInput({
  id,
  value,
  min,
  max,
  onInput,
  disabled = false,
  inputClassName = '',
  wrapperClassName = '',
}: StepperInputProps) {
  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = parseInt(e.target.value, 10);
    const clampedValue = Math.max(min, Math.min(max, isNaN(rawValue) ? min : rawValue));
    onInput(clampedValue);
  };

  const handleStep = (step: number) => {
    const newValue = Math.max(min, Math.min(max, value + step));
    onInput(newValue);
  };

  return (
    <div className={`input-wrapper ${wrapperClassName}`}>
      <input
        type="number"
        id={id}
        className={inputClassName}
        value={value}
        min={min}
        max={max}
        onChange={handleInput}
        disabled={disabled}
        inputMode="numeric"
      />
      <div className="stepper-btn-group">
        <button className="step-btn up" onClick={() => handleStep(1)} disabled={disabled || value >= max}>+</button>
        <button className="step-btn down" onClick={() => handleStep(-1)} disabled={disabled || value <= min}>-</button>
      </div>
    </div>
  );
}
