import type { CSSProperties } from 'react'
import fetusMask from '@/assets/fetus-mask.png'

interface WombOrbProps {
  /** 0–1: how grown the baby looks (drives its scale). */
  growth: number
  className?: string
}

const reducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Closed elliptical path centred in the 400×400 box (used for orbiting satellites). */
function ellipsePath(rx: number, ry: number) {
  return `M${200 - rx} 200a${rx} ${ry} 0 1 0 ${rx * 2} 0a${rx} ${ry} 0 1 0 ${-rx * 2} 0`
}

const ORBITS = [
  { rx: 196, ry: 64, tilt: -16, dur: '11s', r: 5 },
  { rx: 186, ry: 96, tilt: 24, dur: '15s', r: 3.5 },
]

/**
 * Decorative "womb" orb: a glassy amniotic sphere with swirling fluid, the
 * baby from the Baby Scan logo floating inside, orbiting satellites, and
 * ripples that pulse outward on every heartbeat.
 */
export function WombOrb({ growth, className }: WombOrbProps) {
  const animate = !reducedMotion()
  const style = {
    '--baby': `url(${fetusMask})`,
    '--growth': (0.55 + growth * 0.45).toFixed(3),
  } as CSSProperties

  return (
    <div className={['orb', className].filter(Boolean).join(' ')} style={style} aria-hidden="true">
      <div className="orb__halo" />
      <span className="orb__ripple" />
      <span className="orb__ripple orb__ripple--2" />
      <span className="orb__ripple orb__ripple--3" />

      <svg className="orb__orbits" viewBox="0 0 400 400">
        {ORBITS.map((o) => {
          const d = ellipsePath(o.rx, o.ry)
          return (
            <g key={o.tilt} transform={`rotate(${o.tilt} 200 200)`}>
              <path className="orb__path" d={d} />
              <circle className="orb__sat" r={o.r} cx={200 - o.rx} cy={200}>
                {animate && <animateMotion dur={o.dur} repeatCount="indefinite" path={d} begin="0s" />}
              </circle>
            </g>
          )
        })}
        <circle className="orb__dash" cx="200" cy="200" r="182" />
      </svg>

      <div className="orb__sphere">
        <div className="orb__fluid" />
        <div className="orb__fluid orb__fluid--2" />
        <div className="orb__specks" />
        <div className="orb__baby-wrap">
          <div className="orb__baby-body">
            <div className="orb__baby" />
            <span className="orb__heart" />
          </div>
        </div>
        <div className="orb__rim" />
        <div className="orb__shine" />
      </div>
    </div>
  )
}
