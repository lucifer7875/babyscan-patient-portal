export type DownloadState = 'idle' | 'busy' | 'done'

interface DownloadButtonProps {
  state: DownloadState
  label: string
  disabled?: boolean
  onClick: () => void
}

const TEXT: Record<DownloadState, string> = {
  idle: 'Download',
  busy: 'Saving…',
  done: 'Saved',
}

/**
 * Download button with an animated glyph: the arrow drops into the tray while
 * saving, then morphs into a drawn check mark once the file is saved.
 */
export function DownloadButton({ state, label, disabled, onClick }: DownloadButtonProps) {
  return (
    <button
      type="button"
      className="dl-btn"
      data-state={state}
      onClick={onClick}
      disabled={disabled || state === 'busy'}
      aria-label={state === 'done' ? `${label} saved. Download again` : `Download ${label}`}
      aria-busy={state === 'busy'}
    >
      <svg className="dl-glyph" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <circle className="dl-ring" cx="12" cy="12" r="10.5" />
        <g className="dl-arrow">
          <path d="M12 6.5v8" />
          <path d="M8.5 11.5 12 15l3.5-3.5" />
        </g>
        <path className="dl-tray" d="M7 17.5h10" />
        <path className="dl-check" d="M7.5 12.5 10.5 15.5 16.5 9" />
      </svg>
      <span className="dl-btn__text">{TEXT[state]}</span>
    </button>
  )
}
