import { useEffect, useState } from 'react'

/** Small toast bus: showToast(message, 'error' | undefined) */
let listener = null

export function showToast(message, kind) {
  listener?.(message, kind)
}

export default function ToastHost() {
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    listener = (message, kind) => {
      const id = Math.random().toString(36).slice(2)
      setToasts((t) => [...t, { id, message, kind }])
      setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3600)
    }
    return () => {
      listener = null
    }
  }, [])

  return (
    <div className="toast-wrap" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.kind === 'error' ? 'error' : ''}`}>
          {t.message}
        </div>
      ))}
    </div>
  )
}
