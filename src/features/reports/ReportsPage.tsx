import { useRef } from 'react'
import { ClockCountdownIcon, FileTextIcon, LockKeyIcon, ShieldCheckIcon } from '@phosphor-icons/react'
import { useAppDispatch } from '@/app/hooks'
import { BrandLogo } from '@/components/BrandLogo'
import { LifeCanvas } from '@/components/scene/LifeCanvas'
import { RevealText } from '@/components/scene/RevealText'
import { usePointerParallax } from '@/components/scene/usePointerParallax'
import { SuccessPanel } from '@/components/SuccessPanel'
import { HeartbeatTrace, UltrasoundScene } from '@/components/UltrasoundScene'
import { sessionCleared } from '@/features/auth/authSlice'
import type { PatientSession } from '@/features/auth/reportService'

const CLINIC = 'Baby Scan Fetal Medicine and Gynec imaging'

/**
 * Verified-patient screen: same living scene as the login, with the
 * ultrasound scan animation on the left and the report list in a glass card.
 */
export function ReportsPage({ session }: { session: PatientSession }) {
  const dispatch = useAppDispatch()
  const sceneRef = useRef<HTMLDivElement>(null)
  usePointerParallax(sceneRef)

  return (
    <div className="scene scene--reports" ref={sceneRef}>
      <LifeCanvas className="scene__canvas" />
      <div className="scene__aurora" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className="scene__spot" aria-hidden="true" />

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

      <section className="reports-hero" aria-label={CLINIC}>
        <UltrasoundScene className="reports-hero__scan" />

        <div className="reports-hero__copy">
          <p className="scene__eyebrow">
            <span className="live-dot" aria-hidden="true" />
            Verified · reports ready
          </p>
          <RevealText
            className="scene__title"
            text="Your reports are ready. Save them to keep forever."
            highlightFrom={4}
            delay={150}
          />
          <p className="scene__lead">
            Download each scan, or save everything at once as a single PDF or ZIP. Links stay online for 24 hours.
          </p>
        </div>

        <div className="hero__heart reports-hero__heart" aria-hidden="true">
          <HeartbeatTrace className="hero__trace" />
        </div>

        <ul className="trust reports-hero__trust" aria-label="Why it is safe">
          <li className="trust__item">
            <ShieldCheckIcon size={20} weight="duotone" aria-hidden="true" />
            <span>Encrypted, private access</span>
          </li>
          <li className="trust__item">
            <FileTextIcon size={20} weight="duotone" aria-hidden="true" />
            <span>Reports signed by your doctor</span>
          </li>
          <li className="trust__item">
            <ClockCountdownIcon size={20} weight="duotone" aria-hidden="true" />
            <span>Available online for 24 hours</span>
          </li>
        </ul>
      </section>

      <main className="scene__panel" id="main">
        <div className="glass">
          <div className="glass__scroll">
            <SuccessPanel session={session} onReset={() => dispatch(sessionCleared())} />
          </div>
        </div>
        <SiteFooter />
      </main>
    </div>
  )
}

export function SiteFooter() {
  return (
    <footer className="foot">
      <p>
        © {new Date().getFullYear()} {CLINIC}. All rights reserved.
      </p>
      <p className="foot__secure">
        <LockKeyIcon size={14} weight="bold" aria-hidden="true" />
        Secure Cloud Report Delivery Portal
      </p>
    </footer>
  )
}
