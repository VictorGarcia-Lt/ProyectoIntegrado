import { useEffect, useState, useRef } from 'react'

export const IDLE_TIMEOUT_MS = 2 * 60 * 1000
const WARNING_MS = 15 * 1000

export function useIdleTimeout({ enabled, onIdle, onWarning }) {
  const [secondsLeft, setSecondsLeft] = useState(0)
  const warningShown = useRef(false)
  const idleTimer = useRef(null)
  const warningTimer = useRef(null)
  const countdownTimer = useRef(null)

  useEffect(() => {
    if (!enabled) return

    const clearTimers = () => {
      if (idleTimer.current) clearTimeout(idleTimer.current)
      if (warningTimer.current) clearTimeout(warningTimer.current)
      if (countdownTimer.current) clearInterval(countdownTimer.current)
    }

    const reset = () => {
      clearTimers()
      warningShown.current = false
      setSecondsLeft(0)
      onWarning?.(false)

      warningTimer.current = setTimeout(() => {
        warningShown.current = true
        setSecondsLeft(WARNING_MS / 1000)
        onWarning?.(true)
        countdownTimer.current = setInterval(() => {
          setSecondsLeft(s => {
            if (s <= 1) {
              clearInterval(countdownTimer.current)
              return 0
            }
            return s - 1
          })
        }, 1000)
      }, IDLE_TIMEOUT_MS - WARNING_MS)

      idleTimer.current = setTimeout(() => {
        onIdle?.()
      }, IDLE_TIMEOUT_MS)
    }

    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart']
    events.forEach(ev => window.addEventListener(ev, reset, { passive: true }))
    reset()

    return () => {
      events.forEach(ev => window.removeEventListener(ev, reset))
      clearTimers()
    }
  }, [enabled])

  return { secondsLeft, warningShown: secondsLeft > 0 }
}