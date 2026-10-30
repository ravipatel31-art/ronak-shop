import { STATUS_META } from '../lib/format.js'

export default function StatusPill({ status, label }) {
  const meta = STATUS_META[status] || { label: status }
  return (
    <span className={`status-pill status-${status}`}>
      <span className="dot" aria-hidden="true" />
      {label || meta.label}
    </span>
  )
}
