import type { InputHTMLAttributes, ReactNode } from 'react'
import { WarningCircleIcon, CheckCircleIcon } from '@phosphor-icons/react'

interface FieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'onChange' | 'value'> {
  id: string
  label: string
  hint?: string
  icon?: ReactNode
  value: string
  error?: string
  showError: boolean
  onValueChange: (value: string) => void
}

export function Field({ id, label, hint, icon, value, error, showError, onValueChange, className, ...inputProps }: FieldProps) {
  const invalid = showError && Boolean(error)
  const valid = !error && value.trim().length > 0
  const describedBy = [hint ? `${id}-hint` : null, invalid ? `${id}-error` : null].filter(Boolean).join(' ') || undefined

  return (
    <div className={['field', invalid && 'field--invalid', valid && 'field--valid', className].filter(Boolean).join(' ')}>
      <label className="field__label" htmlFor={id}>
        {label}
        <span className="field__req" aria-hidden="true">*</span>
      </label>
      <div className="field__control">
        {icon && <span className="field__icon" aria-hidden="true">{icon}</span>}
        <input
          id={id}
          name={id}
          className="field__input"
          value={value}
          required
          aria-required="true"
          aria-invalid={invalid}
          aria-describedby={describedBy}
          onChange={(e) => onValueChange(e.target.value)}
          {...inputProps}
        />
        <span className="field__status" aria-hidden="true">
          {invalid ? <WarningCircleIcon size={20} weight="fill" /> : valid ? <CheckCircleIcon size={20} weight="fill" /> : null}
        </span>
      </div>
      {hint && !invalid && (
        <p id={`${id}-hint`} className="field__hint">
          {hint}
        </p>
      )}
      {invalid && (
        <p id={`${id}-error`} className="field__error">
          {error}
        </p>
      )}
    </div>
  )
}
