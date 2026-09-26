import { useEffect, useRef, useState, type CSSProperties } from 'react'
import {
  ArrowCounterClockwiseIcon,
  CalendarBlankIcon,
  ChartLineIcon,
  CheckCircleIcon,
  CheckIcon,
  ClockCountdownIcon,
  CubeIcon,
  FilePdfIcon,
  FileTextIcon,
  FileZipIcon,
  HeartbeatIcon,
  ImagesIcon,
  SealCheckIcon,
  WarningCircleIcon,
  WaveformIcon,
  type Icon,
} from '@phosphor-icons/react'
import type { PatientSession } from '@/features/auth/reportService'
import type { ReportCategory, ReportItem } from '@/features/reports/types'
import { downloadAllAsMergedPdf, downloadAllAsZip, downloadReport } from '@/features/reports/download'
import { DownloadButton, type DownloadState } from './DownloadButton'

interface SuccessPanelProps {
  session: PatientSession
  onReset: () => void
}

const CATEGORY_ICON: Record<ReportCategory, Icon> = {
  diagnostic: FileTextIcon,
  echo: HeartbeatIcon,
  doppler: WaveformIcon,
  growth: ChartLineIcon,
  images3d: CubeIcon,
  images2d: ImagesIcon,
  other: FileTextIcon,
}

const CATEGORY_LABEL: Record<ReportCategory, string> = {
  diagnostic: 'Scan report',
  echo: 'Echocardiography',
  doppler: 'Doppler study',
  growth: 'Growth chart',
  images3d: '3D / 4D images',
  images2d: '2D images',
  other: 'Report',
}

const AVAILABLE_MS = 24 * 60 * 60 * 1000

/** Formats ISO dates nicely; shows any other value (e.g. "26-09-2026") exactly as stored. */
function formatDate(value: string | null): string | null {
  const v = value?.trim()
  if (!v) return null
  if (!/^\d{4}-\d{2}-\d{2}/.test(v)) return v
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return v
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

/** Time left in the 24-hour window, counted from the newest upload. Null if unknown. */
function useTimeLeft(reports: ReportItem[]): string | null {
  const newest = Math.max(...reports.map((r) => Date.parse(r.createdAt)).filter(Number.isFinite))
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 30_000)
    return () => window.clearInterval(t)
  }, [])
  if (!Number.isFinite(newest)) return null
  const left = newest + AVAILABLE_MS - now
  if (left <= 0 || left > AVAILABLE_MS) return null
  const h = Math.floor(left / 3_600_000)
  const m = Math.floor((left % 3_600_000) / 60_000)
  return h > 0 ? `${h}h ${m}m` : `${m} min`
}

type BulkAction = 'zip' | 'pdf'
interface BulkState {
  action: BulkAction
  done: number
  total: number
  finished: boolean
}

export function SuccessPanel({ session, onReset }: SuccessPanelProps) {
  const headingRef = useRef<HTMLHeadingElement>(null)
  const [rowState, setRowState] = useState<Record<string, DownloadState>>({})
  const [bulk, setBulk] = useState<BulkState | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const { reports } = session
  const timeLeft = useTimeLeft(reports)

  useEffect(() => headingRef.current?.focus(), [])

  useEffect(() => {
    if (!toast) return
    const t = window.setTimeout(() => setToast(null), 4000)
    return () => window.clearTimeout(t)
  }, [toast])

  const busy = (bulk !== null && !bulk.finished) || Object.values(rowState).includes('busy')
  const savedCount = reports.filter((r) => rowState[r.id] === 'done').length

  const runSingle = async (report: ReportItem) => {
    if (busy) return
    setError(null)
    setRowState((s) => ({ ...s, [report.id]: 'busy' }))
    try {
      await downloadReport(report)
      setRowState((s) => ({ ...s, [report.id]: 'done' }))
      setToast(`${report.studyType} saved to your device`)
    } catch {
      setRowState((s) => ({ ...s, [report.id]: 'idle' }))
      setError(`Could not download "${report.studyType}". Please try again.`)
    }
  }

  const runBulk = async (action: BulkAction) => {
    if (busy) return
    setError(null)
    setBulk({ action, done: 0, total: reports.length, finished: false })
    const onProgress = (done: number, total: number) =>
      setBulk((b) => (b && b.action === action ? { ...b, done, total } : b))
    try {
      if (action === 'zip') await downloadAllAsZip(reports, session.patientId, onProgress)
      else await downloadAllAsMergedPdf(reports, session.patientId, session.displayName, onProgress)
      setBulk((b) => (b ? { ...b, done: b.total, finished: true } : b))
      setRowState(Object.fromEntries(reports.map((r) => [r.id, 'done' as const])))
      setToast(action === 'zip' ? 'All reports saved as a ZIP file' : 'All reports saved as one PDF')
      window.setTimeout(() => setBulk(null), 2200)
    } catch {
      setBulk(null)
      setError(
        action === 'zip'
          ? 'Could not build the ZIP file. Please try downloading reports individually.'
          : 'Could not build the merged PDF. Please try downloading reports individually.',
      )
    }
  }

  const bulkButton = (action: BulkAction, IconCmp: Icon, idleText: string, busyText: string) => {
    const own = bulk?.action === action ? bulk : null
    const progress = own && own.total > 0 ? own.done / own.total : 0
    const state = own ? (own.finished ? 'done' : 'busy') : 'idle'
    return (
      <button
        type="button"
        className={`bulk__btn bulk__btn--${action}`}
        data-state={state}
        onClick={() => runBulk(action)}
        disabled={busy}
        aria-busy={state === 'busy'}
        style={{ '--p': progress } as CSSProperties}
      >
        <span className="bulk__fill" aria-hidden="true" />
        <span className="bulk__content">
          {state === 'done' ? (
            <CheckIcon size={20} weight="bold" aria-hidden="true" className="bulk__check" />
          ) : state === 'busy' ? (
            <span className="spinner spinner--current" aria-hidden="true" />
          ) : (
            <IconCmp size={20} weight="duotone" aria-hidden="true" />
          )}
          <span>
            {state === 'done'
              ? 'Saved to device'
              : own && state === 'busy'
                ? `${busyText} ${own.done}/${own.total}`
                : idleText}
          </span>
        </span>
      </button>
    )
  }

  return (
    <section className="results" aria-labelledby="results-title">
      <header className="results__head">
        <div className="results__avatar" aria-hidden="true">
          <span className="results__avatar-ring" />
          <SealCheckIcon size={34} weight="fill" />
        </div>
        <div className="results__who">
          <p className="results__chip">
            <CheckCircleIcon size={14} weight="fill" aria-hidden="true" />
            <span id="results-title" ref={headingRef} tabIndex={-1}>
              Verified patient
            </span>
          </p>
          <p className="results__name">{session.displayName}</p>
          <p className="results__id">
            Patient ID <span className="mono">{session.patientId}</span>
          </p>
        </div>
      </header>

      <div className="stats" role="list">
        <div className="stat" role="listitem">
          <span className="stat__value">{reports.length}</span>
          <span className="stat__label">{reports.length === 1 ? 'scan ready' : 'scans ready'}</span>
        </div>
        <div className="stat" role="listitem">
          <span className="stat__value">
            {savedCount}
            <span className="stat__of">/{reports.length}</span>
          </span>
          <span className="stat__label">saved</span>
        </div>
        {timeLeft && (
          <div className="stat stat--time" role="listitem">
            <span className="stat__value stat__value--sm">
              <ClockCountdownIcon size={18} weight="bold" aria-hidden="true" />
              {timeLeft}
            </span>
            <span className="stat__label">left online</span>
          </div>
        )}
      </div>

      {reports.length > 1 && (
        <div className="bulk" role="group" aria-label="Download all reports">
          {bulkButton('pdf', FilePdfIcon, 'Download all as one PDF', 'Merging')}
          {bulkButton('zip', FileZipIcon, 'Download all as ZIP', 'Zipping')}
        </div>
      )}

      <aside className="note note--warn">
        <WarningCircleIcon size={20} weight="fill" aria-hidden="true" className="note__icon" />
        <p>
          <strong>Important:</strong> Reports remain accessible online for 24 hours. Please download and save a copy to
          your device for future reference.
        </p>
      </aside>

      {error && (
        <p className="form__error" role="alert">
          <WarningCircleIcon size={18} weight="fill" aria-hidden="true" />
          {error}
        </p>
      )}

      <h3 className="results__subtitle">Available ultrasound scans</h3>

      <ul className="report-list" aria-label="Available ultrasound scans">
        {reports.map((report) => {
          const CatIcon = CATEGORY_ICON[report.category]
          const date = formatDate(report.visitDate)
          const state = rowState[report.id] ?? 'idle'
          return (
            <li key={report.id} className="report" data-state={state}>
              <span className={`report__icon report__icon--${report.category}`} aria-hidden="true">
                <CatIcon size={22} weight="duotone" />
                <span className="report__tick">
                  <CheckIcon size={10} weight="bold" />
                </span>
              </span>
              <div className="report__meta">
                <p className="report__type">{report.studyType}</p>
                <p className="report__date">
                  <span className="report__cat">{CATEGORY_LABEL[report.category]}</span>
                  {date && (
                    <>
                      <span className="report__dot" aria-hidden="true" />
                      <span className="report__when">
                        <CalendarBlankIcon size={13} aria-hidden="true" />
                        {date}
                      </span>
                    </>
                  )}
                </p>
              </div>
              <DownloadButton
                state={state}
                label={report.studyType}
                disabled={busy}
                onClick={() => runSingle(report)}
              />
            </li>
          )
        })}
      </ul>

      <button type="button" className="btn btn--ghost" onClick={onReset} disabled={busy}>
        <ArrowCounterClockwiseIcon size={18} aria-hidden="true" />
        Search for another patient
      </button>

      <div className="toast-region" role="status" aria-live="polite">
        {toast && (
          <p key={toast} className="toast">
            <CheckCircleIcon size={20} weight="fill" aria-hidden="true" />
            {toast}
          </p>
        )}
      </div>
    </section>
  )
}
