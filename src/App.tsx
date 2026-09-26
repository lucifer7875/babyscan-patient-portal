import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { LoginPage } from '@/features/auth/LoginPage'
import { selectAuth, sessionCleared } from '@/features/auth/authSlice'
import { ReportsPage } from '@/features/reports/ReportsPage'

const IDLE_LIMIT_MS = 5 * 60 * 1000
const ACTIVITY_EVENTS = ['pointerdown', 'keydown', 'scroll', 'touchstart'] as const

/** Clears any patient details from memory after 5 minutes without interaction. */
function useIdleReset() {
  const dispatch = useAppDispatch()
  useEffect(() => {
    let timer = window.setTimeout(reset, IDLE_LIMIT_MS)
    function reset() {
      dispatch(sessionCleared())
    }
    function bump() {
      window.clearTimeout(timer)
      timer = window.setTimeout(reset, IDLE_LIMIT_MS)
    }
    ACTIVITY_EVENTS.forEach((e) => window.addEventListener(e, bump, { passive: true }))
    return () => {
      window.clearTimeout(timer)
      ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, bump))
    }
  }, [dispatch])
}

export default function App() {
  useIdleReset()
  const { status, session } = useAppSelector(selectAuth)
  return status === 'success' && session ? <ReportsPage session={session} /> : <LoginPage />
}
