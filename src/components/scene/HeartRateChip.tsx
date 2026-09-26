import { useEffect, useState } from 'react'
import { HeartIcon } from '@phosphor-icons/react'

/** Beat interval; matches --beat in scene.css. */
const BEAT_MS = 1100
const ECG = 'M0 16 H30 L36 16 L41 6 L46 26 L51 2 L56 30 L61 16 H90 L94 16 L98 10 L102 22 L106 16 H120'

/** Decorative fetal-heart-rate monitor with a live-looking BPM and ECG trace. */
export function HeartRateChip({ className }: { className?: string }) {
  const [bpm, setBpm] = useState(142)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const t = window.setInterval(() => setBpm(138 + Math.round(Math.random() * 10)), BEAT_MS * 2)
    return () => window.clearInterval(t)
  }, [])

  return (
    <div className={['hr-chip', className].filter(Boolean).join(' ')} aria-hidden="true">
      <span className="hr-chip__heart">
        <HeartIcon size={18} weight="fill" />
      </span>
      <span className="hr-chip__read">
        <span className="hr-chip__bpm">{bpm}</span>
        <span className="hr-chip__unit">bpm</span>
      </span>
      <svg className="hr-chip__ecg" viewBox="0 0 120 32" preserveAspectRatio="none">
        <path className="hr-chip__trace" d={ECG} />
        <path className="hr-chip__line" d={ECG} />
      </svg>
    </div>
  )
}
