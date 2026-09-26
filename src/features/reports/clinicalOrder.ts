import type { RawReport, ReportCategory, ReportItem } from './types'

/**
 * Clinical priority rank (lower = shown first). Ported from the original portal
 * so report ordering matches what patients and clinicians expect:
 *   diagnostic scans → echo → doppler → growth charts → 3D/4D → 2D images.
 */
export function getReportSortRank(studyType: string, filename = ''): number {
  const s = `${studyType || ''} ${filename || ''}`.toUpperCase()

  if (s.includes('ECHO')) return 200
  if (s.includes('DOPPLER')) return 300
  if (
    (s.includes('GROWTH') && (s.includes('GRAPH') || s.includes('CHART') || s.includes('CURVE'))) ||
    s.includes('CHART') ||
    s.includes('GRAPH') ||
    s.includes('CURVE')
  ) {
    return 400
  }
  if (s.includes('3D') || s.includes('4D')) {
    const sheet = s.match(/SHEET\s*(\d+)/i) ?? s.match(/(\d+)/)
    return 500 + Math.min(sheet ? parseInt(sheet[1] as string, 10) : 1, 99)
  }
  if (s.includes('2D') || s.includes('IMAGE') || s.includes('PHOTO')) {
    const sheet = s.match(/SHEET\s*(\d+)/i) ?? s.match(/(\d+)/)
    return 600 + Math.min(sheet ? parseInt(sheet[1] as string, 10) : 1, 99)
  }

  if (s.includes('EARLY TARGET') || s.includes('EARLY ANOMALY')) return 130
  if (s.includes('TARGET') || s.includes('ANOMALY') || s.includes('LEVEL 2') || s.includes('LEVEL-2')) return 110
  if (s.includes('NT') || s.includes('NB') || s.includes('FIRST TRIMESTER') || s.includes('1ST TRIMESTER')) return 120
  if (s.includes('3RD TRIMESTER') || s.includes('THIRD TRIMESTER') || s.includes('GROWTH SCAN')) return 140
  if (s.includes('2ND OPINION') || s.includes('SECOND OPINION')) return 150
  if (s.includes('EARLY') || s.includes('VIABILITY') || s.includes('DATING')) return 160
  if (s.includes('PELVIC') || s.includes('PELVIS')) return 170
  if (s.includes('FOLLICULAR')) return 180

  return 190
}

function categoryFor(rank: number): ReportCategory {
  if (rank < 200) return 'diagnostic'
  if (rank < 300) return 'echo'
  if (rank < 400) return 'doppler'
  if (rank < 500) return 'growth'
  if (rank < 600) return 'images3d'
  if (rank < 700) return 'images2d'
  return 'other'
}

function normalizeStudyType(raw: string | null): string {
  const t = (raw || 'ULTRASOUND SCAN').trim()
  if (t.toUpperCase() === 'ULTRASOUND IMAGES') return '2D ULTRASOUND IMAGES'
  return t
}

/** True when two rows are the same underlying scan (dedupe key). */
function isSameReport(a: RawReport, b: RawReport): boolean {
  if (a.storage_path && b.storage_path && a.storage_path === b.storage_path) return true
  if (a.filename && b.filename && a.filename === b.filename) return true

  const sa = normalizeStudyType(a.study_type).toUpperCase()
  const sb = normalizeStudyType(b.study_type).toUpperCase()
  if (sa === sb) return true

  const is3dA = sa.includes('3D') || sa.includes('4D')
  const is3dB = sb.includes('3D') || sb.includes('4D')
  if (is3dA && is3dB) {
    const na = (sa.match(/SHEET\s*(\d+)/i) ?? [])[1] ?? '1'
    const nb = (sb.match(/SHEET\s*(\d+)/i) ?? [])[1] ?? '1'
    if (na === nb) return true
  }
  return false
}

/**
 * De-duplicates rows (keeping the most recently created for each scan) and
 * returns them in clinical order, mirroring the original portal's behaviour.
 */
export function normalizeReports(records: RawReport[]): ReportItem[] {
  const kept: RawReport[] = []
  for (const rec of records) {
    const idx = kept.findIndex((k) => isSameReport(rec, k))
    if (idx >= 0) {
      const prev = kept[idx] as RawReport
      if (new Date(rec.created_at ?? 0) > new Date(prev.created_at ?? 0)) kept[idx] = rec
    } else {
      kept.push(rec)
    }
  }

  return kept
    .map((r, i): ReportItem => {
      const studyType = normalizeStudyType(r.study_type)
      const rank = getReportSortRank(studyType, r.filename ?? '')
      return {
        id: r.storage_path || r.filename || `report-${i}`,
        studyType,
        filename: r.filename ?? `${studyType}.pdf`,
        storagePath: r.storage_path ?? '',
        createdAt: r.created_at ?? '',
        visitDate: r.visit_date,
        rank,
        category: categoryFor(rank),
      }
    })
    .sort((a, b) => (a.rank !== b.rank ? a.rank - b.rank : (b.createdAt || '').localeCompare(a.createdAt || '')))
}
