import { supabase } from '@/lib/supabase'
import { normalizeReports } from '@/features/reports/clinicalOrder'
import type { RawReport, ReportItem } from '@/features/reports/types'
import { MOCK_PATIENT_ID, MOCK_REPORTS, mockDelay, USE_MOCK_DATA } from '@/features/reports/mockData'
import type { FormValues } from './validation'

export interface PatientSession {
  patientId: string
  displayName: string
  verifiedAt: number
  reports: ReportItem[]
}

/** Thrown when the details are valid but no matching report exists. */
export class ReportNotFoundError extends Error {
  constructor() {
    super('Report not found')
    this.name = 'ReportNotFoundError'
  }
}

/**
 * Looks up a patient's reports via the Supabase `search_patient_report` RPC,
 * then de-duplicates and clinically orders them for display.
 */
export async function lookupReports(values: FormValues, signal?: AbortSignal): Promise<PatientSession> {
  const patientId = values.patientId.trim()
  const firstName = values.firstName.trim()
  const lastName = values.lastName.trim()

  // TEMPORARY: static data instead of the report server (see mockData.ts).
  if (USE_MOCK_DATA) {
    await mockDelay(900)
    if (patientId !== MOCK_PATIENT_ID) throw new ReportNotFoundError()
    return toSession(MOCK_REPORTS, patientId, firstName, lastName)
  }

  const query = supabase.rpc('search_patient_report', {
    p_file_id: patientId,
    p_first_name: firstName,
    p_last_name: lastName,
  })
  if (signal) query.abortSignal(signal)

  const { data, error } = await query
  if (error) throw error

  const records = (data ?? []) as RawReport[]
  if (records.length === 0) throw new ReportNotFoundError()
  return toSession(records, patientId, firstName, lastName)
}

function toSession(records: RawReport[], patientId: string, firstName: string, lastName: string): PatientSession {
  const first = records[0] as RawReport
  return {
    patientId: first.file_id?.trim() || patientId,
    displayName: first.full_name?.trim() || `${firstName} ${lastName}`.trim(),
    verifiedAt: Date.now(),
    reports: normalizeReports(records),
  }
}
