/**
 * Client-side hardening for production builds.
 *
 * These are deterrents only: anything shipped to a browser can ultimately be
 * inspected. Real protection comes from the server (auth, rate limiting,
 * short-lived signed report URLs) and the headers in public/_headers.
 */
function isInspectShortcut(e: KeyboardEvent): boolean {
  if (e.key === 'F12') return true
  const key = e.key.toUpperCase()
  const mod = e.ctrlKey || e.metaKey
  if (!mod) return false
  // Ctrl/Cmd+Shift+I/J/C/K (devtools), Cmd+Alt+I/J/C (macOS)
  if ((e.shiftKey || e.altKey) && ['I', 'J', 'C', 'K'].includes(key)) return true
  // Ctrl/Cmd+U (view source), +S (save page), +P (print page)
  return !e.shiftKey && !e.altKey && ['U', 'S', 'P'].includes(key)
}

export function installSecurityGuard(): void {
  if (import.meta.env.DEV) return

  // Refuse to render inside a frame (clickjacking), in addition to frame-ancestors.
  if (window.top !== window.self) {
    try {
      window.top!.location.href = window.self.location.href
    } catch {
      document.documentElement.innerHTML = ''
      return
    }
  }

  const stop = (e: Event) => e.preventDefault()
  document.addEventListener('contextmenu', stop)
  document.addEventListener('dragstart', stop)
  document.addEventListener(
    'keydown',
    (e) => {
      if (isInspectShortcut(e)) {
        e.preventDefault()
        e.stopPropagation()
      }
    },
    { capture: true },
  )
}
