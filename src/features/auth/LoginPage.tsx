import { useEffect, useRef, useState } from 'react'
import { ClockCountdownIcon, LockKeyIcon, SealCheckIcon, ShieldCheckIcon } from '@phosphor-icons/react'
import { BrandLogo } from '@/components/BrandLogo'
import { GrowthTimeline } from '@/components/scene/GrowthTimeline'
import { GROWTH_STEPS } from '@/components/scene/growthSteps'
import { HeartRateChip } from '@/components/scene/HeartRateChip'
import { LifeCanvas } from '@/components/scene/LifeCanvas'
import { prefersReducedMotion, usePointerParallax } from '@/components/scene/usePointerParallax'
import { RevealText } from '@/components/scene/RevealText'
import { WombOrb } from '@/components/scene/WombOrb'
import { SiteFooter } from '@/features/reports/ReportsPage'
import { LoginForm } from './LoginForm'

const CLINIC = 'Baby Scan Fetal Medicine and Gynec imaging'
const STEP_MS = 3600

/** Immersive login: living background, womb orb with a growing baby, glass form card. */
export function LoginPage() {
  const sceneRef = useRef<HTMLDivElement>(null)
  const [step, setStep] = useState(1)
  const [playing, setPlaying] = useState(() => !prefersReducedMotion())

  usePointerParallax(sceneRef)

  useEffect(() => {
    if (!playing) return
    const t = window.setInterval(() => setStep((s) => (s + 1) % GROWTH_STEPS.length), STEP_MS)
    return () => window.clearInterval(t)
  }, [playing])

  const selectStep = (i: number) => {
    setPlaying(false)
    setStep(i)
  }

  return (
    <div className="scene" ref={sceneRef}>
      <LifeCanvas className="scene__canvas" />
      <div className="scene__aurora" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className="scene__spot" aria-hidden="true" />

      <a className="skip-link" href="#report-form">
        Skip to report form
      </a>

      <header className="scene__brand">
        <span className="scene__logo">
          <BrandLogo size={40} />
        </span>
        <span className="brand__text">
          <span className="brand__name">Baby Scan</span>
          <span className="brand__tag">Fetal Medicine &amp; Gynec imaging</span>
        </span>
        <span className="scene__secure">
          <LockKeyIcon size={14} weight="bold" aria-hidden="true" />
          Secure portal
        </span>
      </header>

      <section className="scene__hero" aria-label={CLINIC}>
        <div className="scene__copy">
          <p className="scene__eyebrow">
            <span className="live-dot" aria-hidden="true" />
            Patient report portal
          </p>
          <RevealText
            className="scene__title"
            text="Every heartbeat, every first picture, safely yours."
            highlightFrom={5}
            delay={150}
          />
          <p className="scene__lead">
            Your ultrasound reports, delivered privately. Enter the details printed on your receipt. No account or
            password needed.
          </p>
        </div>

        <div className="scene__stage">
          <WombOrb growth={step / (GROWTH_STEPS.length - 1)} />
          <HeartRateChip className="scene__hr" />
          <span className="float-chip float-chip--a" aria-hidden="true">
            <ShieldCheckIcon size={18} weight="duotone" />
            Encrypted access
          </span>
          <span className="float-chip float-chip--b" aria-hidden="true">
            <ClockCountdownIcon size={18} weight="duotone" />
            Online for 24 hours
          </span>
          <span className="float-chip float-chip--c" aria-hidden="true">
            <SealCheckIcon size={18} weight="duotone" />
            Doctor-signed reports
          </span>
        </div>

        <GrowthTimeline
          className="scene__growth"
          index={step}
          playing={playing}
          onSelect={selectStep}
          onTogglePlay={() => setPlaying((p) => !p)}
        />
      </section>

      <main className="scene__panel" id="main">
        <div className="glass">
          <LoginForm />
        </div>
        <SiteFooter />
      </main>
    </div>
  )
}
