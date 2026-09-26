import { useEffect, useRef } from 'react'

interface Cell {
  x: number
  y: number
  r: number
  vy: number
  sway: number
  phase: number
  hue: number
  alpha: number
}

const REDUCED = '(prefers-reduced-motion: reduce)'

function makeCell(w: number, h: number, anywhere: boolean): Cell {
  const r = 3 + Math.random() ** 2 * 22
  return {
    x: Math.random() * w,
    y: anywhere ? Math.random() * h : h + r + Math.random() * 80,
    r,
    vy: 0.12 + (1 - r / 25) * 0.35,
    sway: 6 + Math.random() * 18,
    phase: Math.random() * Math.PI * 2,
    // mostly teal, a few warm "life" tones
    hue: Math.random() < 0.18 ? 18 : 168 + Math.random() * 12,
    alpha: 0.25 + Math.random() * 0.45,
  }
}

/**
 * Full-bleed animated backdrop: soft floating cells that drift upward and part
 * around the pointer, over slow flowing "amniotic" waves.
 */
export function LifeCanvas({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const reduced = window.matchMedia(REDUCED).matches
    const pointer = { x: -9999, y: -9999 }
    let w = 0
    let h = 0
    let cells: Cell[] = []
    let raf = 0
    let t = 0

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const rect = canvas.getBoundingClientRect()
      w = rect.width
      h = rect.height
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      // Keep existing cells so mobile address-bar resizes don't reshuffle the scene.
      const target = Math.round(Math.min(60, Math.max(18, (w * h) / 26000)))
      while (cells.length < target) cells.push(makeCell(w, h, true))
      cells.length = target
    }

    const drawWaves = () => {
      const bands = [
        { amp: 18, len: 520, speed: 0.00025, y: 0.8, color: 'rgba(45, 212, 191, 0.10)' },
        { amp: 26, len: 760, speed: -0.00018, y: 0.86, color: 'rgba(0, 163, 137, 0.14)' },
        { amp: 14, len: 420, speed: 0.0004, y: 0.92, color: 'rgba(153, 246, 228, 0.08)' },
      ]
      for (const b of bands) {
        ctx.beginPath()
        ctx.moveTo(0, h)
        for (let x = 0; x <= w + 20; x += 20) {
          const y = h * b.y + Math.sin(x / b.len * Math.PI * 2 + t * b.speed * 6) * b.amp
          ctx.lineTo(x, y)
        }
        ctx.lineTo(w, h)
        ctx.closePath()
        ctx.fillStyle = b.color
        ctx.fill()
      }
    }

    const drawCell = (c: Cell) => {
      const x = c.x + Math.sin(t * 0.0006 + c.phase) * c.sway
      const g = ctx.createRadialGradient(x - c.r * 0.3, c.y - c.r * 0.3, c.r * 0.1, x, c.y, c.r)
      g.addColorStop(0, `hsla(${c.hue}, 90%, 92%, ${c.alpha})`)
      g.addColorStop(0.45, `hsla(${c.hue}, 75%, 62%, ${c.alpha * 0.45})`)
      g.addColorStop(1, `hsla(${c.hue}, 70%, 45%, 0)`)
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.arc(x, c.y, c.r, 0, Math.PI * 2)
      ctx.fill()
      if (c.r > 12) {
        // nucleus
        ctx.fillStyle = `hsla(${c.hue}, 80%, 96%, ${c.alpha * 0.5})`
        ctx.beginPath()
        ctx.arc(x + c.r * 0.12, c.y + c.r * 0.1, c.r * 0.18, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    const step = (now: number) => {
      const dt = t ? Math.min(now - t, 50) : 16
      t = now
      ctx.clearRect(0, 0, w, h)
      drawWaves()
      for (let i = 0; i < cells.length; i += 1) {
        const c = cells[i] as Cell
        c.y -= c.vy * (dt / 16)
        // part around the pointer
        const dx = c.x - pointer.x
        const dy = c.y - pointer.y
        const d2 = dx * dx + dy * dy
        if (d2 < 16000) {
          const f = (1 - d2 / 16000) * 1.6
          const d = Math.sqrt(d2) || 1
          c.x += (dx / d) * f
          c.y += (dy / d) * f
        }
        if (c.y < -c.r - 20) cells[i] = makeCell(w, h, false)
        drawCell(c)
      }
      raf = requestAnimationFrame(step)
    }

    const onPointer = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      pointer.x = e.clientX - rect.left
      pointer.y = e.clientY - rect.top
    }
    const onLeave = () => {
      pointer.x = -9999
      pointer.y = -9999
    }
    const onVisibility = () => {
      cancelAnimationFrame(raf)
      if (!document.hidden && !reduced) {
        t = 0
        raf = requestAnimationFrame(step)
      }
    }

    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    if (reduced) {
      t = 1
      drawWaves()
      cells.forEach(drawCell)
    } else {
      raf = requestAnimationFrame(step)
      window.addEventListener('pointermove', onPointer, { passive: true })
      document.addEventListener('pointerleave', onLeave)
      document.addEventListener('visibilitychange', onVisibility)
    }

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      window.removeEventListener('pointermove', onPointer)
      document.removeEventListener('pointerleave', onLeave)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  return <canvas ref={ref} className={className} aria-hidden="true" />
}
