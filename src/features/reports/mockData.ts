import type { RawReport } from './types'

/**
 * TEMPORARY: while true, no Supabase API is called. Patient lookup returns the
 * static data below and every download is a generated dummy PDF.
 * Set to false to go back to the live report server.
 */
export const USE_MOCK_DATA = true

export const MOCK_PATIENT_ID = 'A159'
export const MOCK_PATIENT_NAME = 'Mrs. PRIYA SHARMA'

const today = new Date()
const visitDate = today.toLocaleDateString('en-GB')
const uploadedAt = new Date(today.getTime() - 2 * 60 * 60 * 1000).toISOString()

const row = (studyType: string, filename: string): RawReport => ({
  study_type: studyType,
  filename,
  storage_path: `mock/${MOCK_PATIENT_ID}/${filename}`,
  created_at: uploadedAt,
  visit_date: visitDate,
  full_name: MOCK_PATIENT_NAME,
  file_id: MOCK_PATIENT_ID,
})

export const MOCK_REPORTS: RawReport[] = [
  row('TARGET SCAN', `${MOCK_PATIENT_ID}_Target_Scan.pdf`),
  row('3D/4D FETAL IMAGES (Sheet 1)', `${MOCK_PATIENT_ID}_3D_4D_Sheet_1.pdf`),
  row('2D ULTRASOUND IMAGES', `${MOCK_PATIENT_ID}_2D_Images.pdf`),
]

/** Simulates network latency so loaders and progress states are visible. */
export const mockDelay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/** Builds a one-page "TEST REPORT" PDF for the given mock storage path. */
export async function makeDummyPdf(storagePath: string): Promise<Blob> {
  const record = MOCK_REPORTS.find((r) => r.storage_path === storagePath)
  const studyType = record?.study_type ?? 'ULTRASOUND REPORT'

  const { PDFDocument, StandardFonts, rgb, degrees } = await import('pdf-lib')
  const doc = await PDFDocument.create()
  doc.setTitle(`${studyType} - Test Report`)
  const page = doc.addPage([595.28, 841.89]) // A4
  const { width, height } = page.getSize()
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)
  const regular = await doc.embedFont(StandardFonts.Helvetica)
  const brand = rgb(0, 0.37, 0.31)
  const muted = rgb(0.4, 0.45, 0.44)

  // Watermark
  page.drawText('TEST PDF', {
    x: 120,
    y: 300,
    size: 96,
    font: bold,
    color: rgb(0.9, 0.95, 0.94),
    rotate: degrees(35),
  })

  // Header band
  page.drawRectangle({ x: 0, y: height - 90, width, height: 90, color: brand })
  page.drawText('Baby Scan', { x: 40, y: height - 48, size: 24, font: bold, color: rgb(1, 1, 1) })
  page.drawText('Fetal Medicine and Gynec imaging', {
    x: 40,
    y: height - 70,
    size: 11,
    font: regular,
    color: rgb(0.8, 0.98, 0.94),
  })

  let y = height - 140
  page.drawText(studyType, { x: 40, y, size: 20, font: bold, color: brand })
  y -= 22
  page.drawText('Dummy report for testing only - not a medical document', {
    x: 40,
    y,
    size: 11,
    font: regular,
    color: rgb(0.7, 0.3, 0),
  })

  y -= 40
  const details: [string, string][] = [
    ['Patient name', MOCK_PATIENT_NAME],
    ['Patient ID', MOCK_PATIENT_ID],
    ['Visit date', record?.visit_date ?? visitDate],
    ['File', record?.filename ?? storagePath],
  ]
  for (const [label, value] of details) {
    page.drawText(label, { x: 40, y, size: 11, font: regular, color: muted })
    page.drawText(value, { x: 170, y, size: 11, font: bold, color: rgb(0.1, 0.12, 0.12) })
    y -= 22
  }

  y -= 16
  page.drawLine({ start: { x: 40, y }, end: { x: width - 40, y }, thickness: 1, color: rgb(0.85, 0.9, 0.89) })
  y -= 30
  const lines = [
    'This PDF was generated in the browser because the portal is running with',
    'static mock data (USE_MOCK_DATA = true). No report server was contacted.',
    '',
    'Findings: Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do',
    'eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    '',
    'Impression: Sample text for layout and download testing.',
  ]
  for (const line of lines) {
    page.drawText(line, { x: 40, y, size: 11, font: regular, color: rgb(0.2, 0.22, 0.22) })
    y -= 18
  }

  page.drawText('Generated for testing - Baby Scan Secure Cloud Report Delivery Portal', {
    x: 40,
    y: 40,
    size: 9,
    font: regular,
    color: muted,
  })

  const bytes = await doc.save()
  return new Blob([new Uint8Array(bytes)], { type: 'application/pdf' })
}
