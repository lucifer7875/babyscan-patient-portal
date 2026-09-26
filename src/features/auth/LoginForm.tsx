import { useEffect, useRef, useState, type FormEvent } from 'react'
import {
  FileTextIcon,
  IdentificationCardIcon,
  InfoIcon,
  MagnifyingGlassIcon,
  UserIcon,
  WarningCircleIcon,
} from '@phosphor-icons/react'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { Field } from '@/components/Field'
import { PulseLoader } from '@/components/scene/PulseLoader'
import { fieldBlurred, fieldChanged, findReports, selectAuth, selectErrors, submitAttempted } from './authSlice'
import { FIELD_ORDER, LIMITS, type FieldName } from './validation'

const FIELD_LABELS: Record<FieldName, string> = {
  patientId: 'Patient ID',
  firstName: 'First name',
  lastName: 'Last name',
}

/** Patient ID + name lookup form (store-connected). */
export function LoginForm() {
  const dispatch = useAppDispatch()
  const { values, touched, submitted, status, submitError } = useAppSelector(selectAuth)
  const errors = useAppSelector(selectErrors)
  const summaryRef = useRef<HTMLDivElement>(null)
  const [failedAttempts, setFailedAttempts] = useState(0)

  const errorFields = FIELD_ORDER.filter((f) => errors[f])
  const completed = FIELD_ORDER.length - errorFields.length
  const loading = status === 'loading'
  const showSummary = submitted && errorFields.length > 0

  // Move focus to the error summary after each failed submit.
  useEffect(() => {
    if (failedAttempts > 0) summaryRef.current?.focus()
  }, [failedAttempts])

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    dispatch(submitAttempted())
    if (errorFields.length === 0) void dispatch(findReports())
    else setFailedAttempts((n) => n + 1)
  }

  const bind = (field: FieldName) => ({
    id: field,
    label: FIELD_LABELS[field],
    value: values[field],
    error: errors[field],
    showError: touched[field],
    onValueChange: (value: string) => dispatch(fieldChanged({ field, value })),
    onBlur: () => dispatch(fieldBlurred(field)),
    disabled: loading,
  })

  return (
    <>
      <header className="card__head">
        <span className="card__icon" aria-hidden="true">
          <FileTextIcon size={26} weight="duotone" />
        </span>
        <div>
          <h2 className="card__title">Download Ultrasound Report</h2>
          <p className="card__sub">Enter Patient ID and Name as printed on your report</p>
        </div>
      </header>

      {showSummary && (
        <div ref={summaryRef} className="summary" role="alert" tabIndex={-1} aria-labelledby="summary-title">
          <p id="summary-title" className="summary__title">
            <WarningCircleIcon size={18} weight="fill" aria-hidden="true" />
            Please check {errorFields.length === 1 ? 'this detail' : 'these details'}
          </p>
          <ul className="summary__list">
            {errorFields.map((f) => (
              <li key={f}>
                <a href={`#${f}`}>{errors[f]}</a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <form id="report-form" className="form" noValidate onSubmit={onSubmit} aria-busy={loading}>
        <Field
          {...bind('patientId')}
          icon={<IdentificationCardIcon size={22} />}
          placeholder="e.g. BS24015"
          hint="Printed at the top of your report or receipt."
          autoComplete="off"
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          inputMode="text"
          enterKeyHint="next"
          maxLength={LIMITS.patientId}
          className="field--mono"
        />

        <div className="form__row">
          <Field
            {...bind('firstName')}
            icon={<UserIcon size={20} />}
            placeholder="First name"
            autoComplete="given-name"
            autoCapitalize="words"
            enterKeyHint="next"
            maxLength={LIMITS.name}
          />
          <Field
            {...bind('lastName')}
            icon={<UserIcon size={20} />}
            placeholder="Last name"
            autoComplete="family-name"
            autoCapitalize="words"
            enterKeyHint="search"
            maxLength={LIMITS.name}
          />
        </div>

        <div className="progress" aria-live="polite">
          <div className="progress__track" aria-hidden="true">
            {FIELD_ORDER.map((f) => (
              <span key={f} className={`progress__seg${errors[f] ? '' : ' is-done'}`} />
            ))}
          </div>
          <span className="progress__label">
            {completed === FIELD_ORDER.length ? 'All details entered' : `${completed} of ${FIELD_ORDER.length} details entered`}
          </span>
        </div>

        <aside className="note">
          <InfoIcon size={20} weight="fill" aria-hidden="true" className="note__icon" />
          <p>
            <strong>Please note:</strong> Reports are available online for 24 hours. Kindly download and save a copy
            to your device for your permanent records.
          </p>
        </aside>

        {submitError && status === 'error' && !showSummary && (
          <p className="form__error" role="alert">
            <WarningCircleIcon size={18} weight="fill" aria-hidden="true" />
            {submitError}
          </p>
        )}

        <button type="submit" className="btn btn--primary btn--heart" disabled={loading}>
          {loading ? (
            <>
              <PulseLoader />
              Finding your reports…
            </>
          ) : (
            <>
              Find Ultrasound Reports
              <MagnifyingGlassIcon size={20} weight="bold" aria-hidden="true" />
            </>
          )}
        </button>
      </form>
    </>
  )
}
