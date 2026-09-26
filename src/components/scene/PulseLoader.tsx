/** Small ECG trace that draws itself on a loop; used as a button loading indicator. */
export function PulseLoader() {
  return (
    <svg className="pulse-loader" viewBox="0 0 48 20" aria-hidden="true" focusable="false">
      <path d="M1 10 H14 L17 4 L21 16 L25 1 L29 19 L32 10 H47" />
    </svg>
  )
}
