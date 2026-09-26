export interface GrowthStep {
  week: number
  scan: string
  size: string
}

/** Typical scans across a pregnancy; sizes are approximate crown-to-heel lengths. */
export const GROWTH_STEPS: readonly GrowthStep[] = [
  { week: 12, scan: 'NT scan', size: '≈ 6 cm' },
  { week: 20, scan: 'Anomaly scan', size: '≈ 25 cm' },
  { week: 28, scan: 'Growth scan', size: '≈ 37 cm' },
  { week: 36, scan: 'Well-being scan', size: '≈ 47 cm' },
]
