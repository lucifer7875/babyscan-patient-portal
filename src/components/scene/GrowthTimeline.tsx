// import { PauseIcon, PlayIcon } from '@phosphor-icons/react'
import { GROWTH_STEPS, type GrowthStep } from './growthSteps'

interface GrowthTimelineProps {
  index: number
  playing: boolean
  onSelect: (index: number) => void
  /** Unused while the play/pause button is commented out. */
  onTogglePlay?: () => void
  className?: string
}

/** Pregnancy journey stepper; auto-advances with a visible pause control. */
export function GrowthTimeline({ index, playing, onSelect, className }: GrowthTimelineProps) {
  const current = GROWTH_STEPS[index] as GrowthStep
  return (
    <div className={['growth', className].filter(Boolean).join(' ')} data-playing={playing}>
      <div className="growth__head">
        <p className="growth__now">
          <span className="growth__week">Week {current.week}</span>
          <span className="growth__scan" key={current.scan}>
            {current.scan} · {current.size}
          </span>
        </p>
        {/* Play/pause control hidden for now.
        <button
          type="button"
          className="growth__play"
          onClick={onTogglePlay}
          aria-label={playing ? 'Pause pregnancy timeline' : 'Play pregnancy timeline'}
        >
          {playing ? <PauseIcon size={14} weight="fill" /> : <PlayIcon size={14} weight="fill" />}
        </button>
        */}
      </div>
      <ol className="growth__track" aria-label="Pregnancy journey">
        {GROWTH_STEPS.map((step, i) => (
          <li key={step.week} className="growth__item">
            <button
              type="button"
              className="growth__dot"
              data-state={i < index ? 'past' : i === index ? 'current' : 'future'}
              aria-current={i === index ? 'step' : undefined}
              aria-label={`Week ${step.week}: ${step.scan}`}
              onClick={() => onSelect(i)}
            >
              <span className="growth__fill" />
            </button>
            <span className="growth__label" aria-hidden="true">
              W{step.week}
            </span>
          </li>
        ))}
      </ol>
    </div>
  )
}
