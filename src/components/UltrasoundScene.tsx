import { useId } from 'react'

/* Fan geometry (viewBox units): probe at the top, ±HALF_ANGLE spread. */
const CX = 200
const CY = 6
const HALF_ANGLE = 42
const PROBE_R = 26
const DEPTH_R = 400

function polar(r: number, deg: number): [number, number] {
  const rad = ((90 + deg) * Math.PI) / 180
  return [+(CX + r * Math.cos(rad)).toFixed(2), +(CY + r * Math.sin(rad)).toFixed(2)]
}

function arc(r: number, from = -HALF_ANGLE, to = HALF_ANGLE) {
  const [x1, y1] = polar(r, from)
  const [x2, y2] = polar(r, to)
  return `M${x1} ${y1} A${r} ${r} 0 0 1 ${x2} ${y2}`
}

const [pl, plY] = polar(PROBE_R, HALF_ANGLE)
const [pr, prY] = polar(PROBE_R, -HALF_ANGLE)
const [dl, dlY] = polar(DEPTH_R, HALF_ANGLE)
const [dr, drY] = polar(DEPTH_R, -HALF_ANGLE)
const FAN = `M${pl} ${plY} L${dl} ${dlY} A${DEPTH_R} ${DEPTH_R} 0 0 0 ${dr} ${drY} L${pr} ${prY} A${PROBE_R} ${PROBE_R} 0 0 1 ${pl} ${plY} Z`
const DEPTH_ARCS = [90, 160, 230, 300, 370]
const SCAN_LINES = [-32, -16, 0, 16, 32]

/**
 * Decorative ultrasound fan display: speckle texture, depth arcs,
 * a sweeping beam and an echo "blob" suggesting the gestational sac.
 */
export function UltrasoundScene({ className }: { className?: string }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '')

  return (
    <svg className={className} viewBox="0 0 400 420" aria-hidden="true" focusable="false" preserveAspectRatio="xMidYMin slice">
      <defs>
        <radialGradient id={`g${uid}`} cx={CX} cy={CY} r={DEPTH_R} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#5eead4" stopOpacity="0.5" />
          <stop offset="0.5" stopColor="#2dd4bf" stopOpacity="0.16" />
          <stop offset="1" stopColor="#2dd4bf" stopOpacity="0.04" />
        </radialGradient>
        <linearGradient id={`b${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ccfbf1" stopOpacity="0.85" />
          <stop offset="1" stopColor="#ccfbf1" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={`s${uid}`}>
          <stop offset="0.55" stopColor="#022c26" stopOpacity="0.55" />
          <stop offset="0.8" stopColor="#99f6e4" stopOpacity="0.35" />
          <stop offset="1" stopColor="#99f6e4" stopOpacity="0" />
        </radialGradient>
        <filter id={`n${uid}`} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="7" />
          <feColorMatrix values="0 0 0 0 0.8  0 0 0 0 1  0 0 0 0 0.95  0 0 0 0.6 -0.14" />
        </filter>
        <clipPath id={`c${uid}`}>
          <path d={FAN} />
        </clipPath>
      </defs>

      <g clipPath={`url(#c${uid})`}>
        <path d={FAN} fill={`url(#g${uid})`} />
        <rect width="400" height="420" filter={`url(#n${uid})`} opacity="0.4" />
        <ellipse className="us-sac" cx="212" cy="262" rx="70" ry="52" fill={`url(#s${uid})`} />
        {DEPTH_ARCS.map((r) => (
          <path key={r} d={arc(r)} fill="none" stroke="#ccfbf1" strokeOpacity="0.16" strokeDasharray="2 6" />
        ))}
        {SCAN_LINES.map((deg) => {
          const [x1, y1] = polar(PROBE_R, deg)
          const [x2, y2] = polar(DEPTH_R, deg)
          return <line key={deg} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#ccfbf1" strokeOpacity="0.06" />
        })}
        <g className="us-beam">
          <path d={`M${CX} ${CY} L${CX - 14} 430 L${CX + 14} 430 Z`} fill={`url(#b${uid})`} opacity="0.45" />
        </g>
      </g>

      <path d={FAN} fill="none" stroke="#99f6e4" strokeOpacity="0.3" strokeWidth="1.2" />

      {/* depth scale */}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <line key={i} x1="390" x2="397" y1={60 + i * 55} y2={60 + i * 55} stroke="#99f6e4" strokeOpacity="0.4" />
      ))}
    </svg>
  )
}

export function HeartbeatTrace({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 320 48" aria-hidden="true" focusable="false" preserveAspectRatio="none">
      <path
        d="M0 24 H320"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.25"
        strokeWidth="1"
      />
      <path
        className="hb-line"
        d="M0 24 H70 L80 24 L88 10 L96 38 L104 4 L112 44 L120 24 H190 L200 24 L208 12 L216 36 L224 6 L232 42 L240 24 H320"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
