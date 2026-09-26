export type FieldName = 'patientId' | 'firstName' | 'lastName'
export type FormValues = Record<FieldName, string>
export type FormErrors = Partial<Record<FieldName, string>>

export const FIELD_ORDER: readonly FieldName[] = ['patientId', 'firstName', 'lastName']

export const LIMITS = { patientId: 20, name: 40 } as const

const PATIENT_ID = /^[A-Z0-9][A-Z0-9\-/]{2,19}$/
const NAME = /^[\p{L}][\p{L} .'-]{0,39}$/u

/** Strips anything that is not allowed in the field while the user types. */
export function sanitize(field: FieldName, raw: string): string {
  if (field === 'patientId') {
    return raw.toUpperCase().replace(/[^A-Z0-9\-/]/g, '').slice(0, LIMITS.patientId)
  }
  return raw
    .replace(/[^\p{L} .'-]/gu, '')
    .replace(/\s{2,}/g, ' ')
    .slice(0, LIMITS.name)
}

export function validateField(field: FieldName, value: string): string | undefined {
  const v = value.trim()
  if (field === 'patientId') {
    if (!v) return 'Enter the Patient ID printed on your report.'
    if (!PATIENT_ID.test(v)) return 'Patient ID should be 3–20 letters or numbers, as printed on your report.'
    return undefined
  }
  const label = field === 'firstName' ? 'first name' : 'last name'
  if (!v) return `Enter your ${label} as printed on your report.`
  if (!NAME.test(v)) return `Use letters only for your ${label}.`
  return undefined
}

export function validateAll(values: FormValues): FormErrors {
  const errors: FormErrors = {}
  for (const f of FIELD_ORDER) {
    const e = validateField(f, values[f])
    if (e) errors[f] = e
  }
  return errors
}
