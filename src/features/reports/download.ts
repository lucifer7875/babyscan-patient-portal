import type { PDFDocument } from 'pdf-lib'
import { REPORTS_BUCKET, supabase } from '@/lib/supabase'
import { makeDummyPdf, mockDelay, USE_MOCK_DATA } from './mockData'
import type { ReportItem } from './types'

const bucket = () => supabase.storage.from(REPORTS_BUCKET)

/** Downloads a report file from Storage as a Blob. */
async function fetchBlob(storagePath: string): Promise<Blob> {
  // TEMPORARY: serve a generated test PDF; there is no pre-merged file in mock mode.
  if (USE_MOCK_DATA) {
    if (!storagePath.startsWith('mock/')) throw new Error('Not found')
    await mockDelay(600)
    return makeDummyPdf(storagePath)
  }
  const { data, error } = await bucket().download(storagePath)
  if (error || !data) throw error ?? new Error('Download failed')
  return data
}

/** Same as fetchBlob, but resolves to null instead of throwing. */
async function tryFetchBlob(storagePath: string): Promise<Blob | null> {
  if (!storagePath) return null
  try {
    return await fetchBlob(storagePath)
  } catch {
    return null
  }
}

/** Saves a Blob to the user's device (works on iOS Safari, Android Chrome, desktop). */
function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename || 'ultrasound_report.pdf'
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  setTimeout(() => {
    a.remove()
    URL.revokeObjectURL(url)
  }, 2000)
}

function safeName(value: string): string {
  return value.replace(/[^a-zA-Z0-9]/g, '_')
}

/**
 * Downloads one report. Order of attempts (same as the original portal):
 *   1. direct Blob download
 *   2. 5-minute signed URL
 *   3. public URL
 */
export async function downloadReport(report: ReportItem): Promise<void> {
  const blob = await tryFetchBlob(report.storagePath)
  if (blob) {
    saveBlob(blob, report.filename)
    return
  }

  const { data: signed } = await bucket().createSignedUrl(report.storagePath, 300, {
    download: report.filename || true,
  })
  if (signed?.signedUrl) {
    window.open(signed.signedUrl, '_blank', 'noopener,noreferrer')
    return
  }

  const { data: pub } = bucket().getPublicUrl(report.storagePath)
  if (!pub.publicUrl) throw new Error('Unable to download this report.')
  window.open(pub.publicUrl, '_blank', 'noopener,noreferrer')
}

/** Reports bulk progress: files fetched so far out of the total. */
export type ProgressFn = (done: number, total: number) => void

/** Fetches all files in parallel, reporting progress as each one settles. */
async function fetchAll(reports: ReportItem[], onProgress?: ProgressFn): Promise<(Blob | null)[]> {
  let done = 0
  onProgress?.(0, reports.length)
  return Promise.all(
    reports.map(async (r) => {
      const blob = await tryFetchBlob(r.storagePath)
      done += 1
      onProgress?.(done, reports.length)
      return blob
    }),
  )
}

function uniqueName(name: string, used: Set<string>): string {
  if (!used.has(name)) {
    used.add(name)
    return name
  }
  const dot = name.lastIndexOf('.')
  const base = dot > 0 ? name.slice(0, dot) : name
  const ext = dot > 0 ? name.slice(dot) : ''
  let i = 2
  while (used.has(`${base} (${i})${ext}`)) i += 1
  const candidate = `${base} (${i})${ext}`
  used.add(candidate)
  return candidate
}

/**
 * Bundles every report into one ZIP. Files that fail to download are skipped;
 * it only fails if none could be fetched.
 */
export async function downloadAllAsZip(
  reports: ReportItem[],
  fileId: string,
  onProgress?: ProgressFn,
): Promise<number> {
  const blobs = await fetchAll(reports, onProgress)

  const { default: JSZip } = await import('jszip')
  const zip = new JSZip()
  const used = new Set<string>()
  let added = 0
  reports.forEach((r, i) => {
    const blob = blobs[i]
    if (!blob) return
    zip.file(uniqueName(r.filename || `${r.studyType}.pdf`, used), blob)
    added += 1
  })
  if (added === 0) throw new Error('Could not download report files from cloud storage.')

  const out = await zip.generateAsync({ type: 'blob' })
  saveBlob(out, `${fileId}_All_Reports.zip`)
  return added
}

const PDF_MAGIC = [0x25, 0x50, 0x44, 0x46] // %PDF
const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47] // ‰PNG
const JPG_MAGIC = [0xff, 0xd8, 0xff]

function startsWith(bytes: Uint8Array, magic: number[]): boolean {
  return magic.every((b, i) => bytes[i] === b)
}

/** Appends one file (PDF pages, or a PNG/JPG sheet as its own page). Returns pages added. */
async function appendToPdf(
  lib: typeof import('pdf-lib'),
  merged: PDFDocument,
  bytes: Uint8Array,
): Promise<number> {
  if (startsWith(bytes, PDF_MAGIC)) {
    const src = await lib.PDFDocument.load(bytes, { ignoreEncryption: true })
    const pages = await merged.copyPages(src, src.getPageIndices())
    pages.forEach((p) => merged.addPage(p))
    return pages.length
  }
  const isPng = startsWith(bytes, PNG_MAGIC)
  if (!isPng && !startsWith(bytes, JPG_MAGIC)) return 0
  const image = isPng ? await merged.embedPng(bytes) : await merged.embedJpg(bytes)
  const page = merged.addPage([image.width, image.height])
  page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height })
  return 1
}

/**
 * Downloads every report as one PDF:
 *   1. use the pre-merged cloud file (reports/{fileId}_COMPLETE_REPORT.pdf) if present
 *   2. otherwise merge in the browser, in clinical order, skipping unreadable files
 */
export async function downloadAllAsMergedPdf(
  reports: ReportItem[],
  fileId: string,
  patientName: string,
  onProgress?: ProgressFn,
): Promise<void> {
  const target = `${fileId}_${safeName(patientName || 'Patient')}_Complete_Report.pdf`

  const preMerged = fileId ? await tryFetchBlob(`reports/${fileId}_COMPLETE_REPORT.pdf`) : null
  if (preMerged && preMerged.size > 1000) {
    saveBlob(preMerged, target)
    return
  }

  const ordered = [...reports].sort((a, b) => a.rank - b.rank)
  const blobs = await fetchAll(ordered, onProgress)
  const buffers = (
    await Promise.all(blobs.map(async (b) => (b ? new Uint8Array(await b.arrayBuffer()) : null)))
  ).filter((b): b is Uint8Array<ArrayBuffer> => b !== null && b.byteLength > 0)

  if (buffers.length === 0) throw new Error('No PDF scans could be downloaded from storage.')

  const [only] = buffers
  if (buffers.length === 1 && only && startsWith(only, PDF_MAGIC)) {
    saveBlob(new Blob([only], { type: 'application/pdf' }), target)
    return
  }

  const lib = await import('pdf-lib')
  const merged = await lib.PDFDocument.create()
  let pages = 0
  for (const bytes of buffers) {
    try {
      pages += await appendToPdf(lib, merged, bytes)
    } catch {
      // Skip a corrupt or unsupported file rather than failing the whole merge.
    }
  }
  if (pages === 0) throw new Error('Unable to extract pages from the report documents.')

  const out = new Uint8Array(await merged.save())
  saveBlob(new Blob([out], { type: 'application/pdf' }), target)
}
