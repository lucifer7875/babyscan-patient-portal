/** Row as returned by the `search_patient_report` RPC. */
export interface RawReport {
  study_type: string | null
  filename: string | null
  storage_path: string | null
  created_at: string | null
  visit_date: string | null
  /** Patient fields repeated on every row. */
  full_name?: string | null
  file_id?: string | null
}

export type ReportCategory =
  | 'diagnostic'
  | 'echo'
  | 'doppler'
  | 'growth'
  | 'images3d'
  | 'images2d'
  | 'other'

/** Normalized, de-duplicated report ready for display. */
export interface ReportItem {
  id: string
  studyType: string
  filename: string
  storagePath: string
  createdAt: string
  visitDate: string | null
  rank: number
  category: ReportCategory
}
