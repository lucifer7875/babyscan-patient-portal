import { Fragment, type CSSProperties, type ElementType } from 'react'

interface RevealTextProps {
  as?: ElementType
  text: string
  /** Words (by index) to render with the highlight style. */
  highlightFrom?: number
  className?: string
  delay?: number
}

/**
 * Headline whose words rise into place one after another. The full sentence
 * stays a single readable string for screen readers.
 */
export function RevealText({ as: Tag = 'h1', text, highlightFrom, className, delay = 0 }: RevealTextProps) {
  const words = text.split(' ')
  return (
    <Tag className={['reveal', className].filter(Boolean).join(' ')} aria-label={text}>
      {words.map((word, i) => (
        <Fragment key={`${word}-${i}`}>
          <span
            aria-hidden="true"
            className={highlightFrom !== undefined && i >= highlightFrom ? 'reveal__word reveal__word--hl' : 'reveal__word'}
            style={{ '--i': i, '--d': `${delay}ms` } as CSSProperties}
          >
            <span className="reveal__inner">{word}</span>
          </span>
          {i < words.length - 1 ? ' ' : null}
        </Fragment>
      ))}
    </Tag>
  )
}
