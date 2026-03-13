import React from 'react'

export default function ScaleSelector({ questionId, value, onChange, options = [], disabled = false }) {
  return (
    <div className="scale-pills" role="radiogroup" aria-label={`Scala per ${questionId}`}>
      {options.map(opt => {
        const isSelected = value === opt.value
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            disabled={disabled}
            onClick={() => !disabled && onChange(questionId, opt.value)}
            className={`scale-pill ${isSelected ? 'selected' : ''} ${disabled ? 'disabled' : ''}`}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

