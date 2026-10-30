import { MessageCircle, Phone, RefreshCw, Search } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import StatusPill from '../../components/StatusPill.jsx'
import { showToast } from '../../components/ToastHost.jsx'
import { adminApi } from '../../lib/api.js'
import { formatDate, money, ORDER_STATUSES, shortDate, STATUS_META } from '../../lib/format.js'
import { thumb } from '../../lib/picture.js'

const filters = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Awaiting confirmation' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'in_production', label: 'In production' },
  { value: 'ready', label: 'Ready' },
  { value: 'out_for_delivery', label: 'Out for delivery' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
]

export default function OrdersPage() {
  const [params, setParams] = useSearchParams()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const status = params.get('status') || ''
  const openNumber = params.get('order') || ''

  const load = async () => {
    setLoading(true)
    try {
      const query = new URLSearchParams()
      if (status) query.set('status', status)
      if (search.trim()) query.set('search', search.trim())
      const data = await adminApi.orders(Object.fromEntries(query))
      setOrders(data)
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(load, search ? 250 : 0)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, search])

  const openOrder = useMemo(
    () => orders.find((o) => o.order_number === openNumber) || null,
    [orders, openNumber],
  )

  const close = () => {
    const next = new URLSearchParams(params)
    next.delete('order')
    setParams(next, { replace: true })
  }

  const select = (order) => {
    const next = new URLSearchParams(params)
    next.set('order', order.order_number)
    setParams(next, { replace: true })
  }

  return (
    <div className="stack" style={{ gap: 18 }}>
      <div className="row wrap" style={{ gap: 10 }}>
        <div className="search-wrap">
          <Search size={17} />
          <input
            className="input"
            type="search"
            placeholder="Search order number, name or phone"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search orders"
          />
        </div>
        <button type="button" className="btn btn-sm" onClick={load} aria-label="Refresh orders">
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      <div className="tabs">
        {filters.map((f) => (
          <button
            key={f.value}
            type="button"
            className={`tab ${status === f.value ? 'active' : ''}`}
            onClick={() => {
              const next = new URLSearchParams(params)
              if (f.value) next.set('status', f.value)
              else next.delete('status')
              setParams(next, { replace: true })
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="panel">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Placed</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="muted center" style={{ padding: 30 }}>
                    Loading…
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="muted center" style={{ padding: 30 }}>
                    No orders in this view.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.order_number} onClick={() => select(order)} style={{ cursor: 'pointer' }}>
                    <td>
                      <strong>{order.order_number}</strong>
                    </td>
                    <td>
                      <div style={{ fontWeight: 550 }}>{order.customer_name}</div>
                      <div className="tiny muted">{order.city || '—'}</div>
                    </td>
                    <td>
                      {order.items.reduce((sum, item) => sum + item.quantity, 0)}
                      <span className="tiny muted"> pcs</span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{money(order.total)}</td>
                    <td>
                      <StatusPill status={order.status} label={order.status_label} />
                    </td>
                    <td className="muted">{shortDate(order.created_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {openOrder && (
          <OrderDetail
            key={openOrder.order_number}
            order={openOrder}
            onClose={close}
            onUpdated={(updated) =>
              setOrders((list) => list.map((o) => (o.order_number === updated.order_number ? updated : o)))
            }
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function OrderDetail({ order, onClose, onUpdated }) {
  const [status, setStatus] = useState(order.status)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)

  const save = async () => {
    if (status === order.status && !note.trim()) {
      showToast('Pick a new status or add a note first', 'error')
      return
    }
    setBusy(true)
    try {
      const updated = await adminApi.setOrderStatus(order.order_number, { status, note: note.trim() })
      onUpdated(updated)
      setNote('')
      showToast(`Order ${order.order_number} → ${STATUS_META[updated.status].label}`)
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  const phoneDigits = (order.phone || '').replace(/\D/g, '')
  const localDigits = phoneDigits.slice(-10)
  const waHref = localDigits.length === 10 ? `https://wa.me/91${localDigits}` : null

  return (
    <>
      <motion.div
        className="scrim"
        style={{ zIndex: 100 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        onClick={onClose}
      />
      <motion.div
        className="modal-overlay"
        style={{ zIndex: 110, alignItems: 'stretch', justifyItems: 'end', padding: 0 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        onClick={onClose}
      >
        <motion.div
          className="modal"
          style={{ width: 'min(620px, 100%)', maxHeight: '100dvh', height: '100dvh', borderRadius: 0 }}
          initial={{ x: 40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 40, opacity: 0 }}
          transition={{ type: 'spring', bounce: 0.14, duration: 0.45 }}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-label={`Order ${order.order_number}`}
        >
          <div className="modal-head">
            <div className="stack" style={{ gap: 4 }}>
              <strong style={{ fontSize: 17, letterSpacing: '-0.02em' }}>{order.order_number}</strong>
              <span className="tiny muted">{formatDate(order.created_at)}</span>
            </div>
            <div className="row" style={{ gap: 8 }}>
              <StatusPill status={order.status} label={order.status_label} />
              <button type="button" className="icon-btn" onClick={onClose} aria-label="Close order">
                ✕
              </button>
            </div>
          </div>

          <div className="modal-body">
            {/* customer */}
            <section className="panel">
              <div className="panel-head">
                <strong>Customer</strong>
                <div className="row" style={{ gap: 6 }}>
                  <a className="btn btn-sm" href={`tel:${order.phone}`}>
                    <Phone size={14} /> Call
                  </a>
                  {waHref && (
                    <a className="btn btn-sm" href={waHref} target="_blank" rel="noreferrer">
                      <MessageCircle size={14} /> WhatsApp
                    </a>
                  )}
                </div>
              </div>
              <div className="panel-body stack" style={{ gap: 8 }}>
                <div className="row-between">
                  <span className="muted small">Name</span>
                  <strong>{order.customer_name}</strong>
                </div>
                <div className="row-between">
                  <span className="muted small">Phone</span>
                  <strong>{order.phone}</strong>
                </div>
                {order.email && (
                  <div className="row-between">
                    <span className="muted small">Email</span>
                    <span>{order.email}</span>
                  </div>
                )}
                <div className="row-between" style={{ alignItems: 'flex-start' }}>
                  <span className="muted small">Address</span>
                  <span style={{ textAlign: 'right', maxWidth: 66 }}>
                    {order.address}
                    {order.city ? `, ${order.city}` : ''}
                  </span>
                </div>
                {order.notes && (
                  <div style={{ background: 'var(--warn-soft)', color: 'var(--warn)', padding: '10px 12px', borderRadius: 10, fontSize: 14 }}>
                    <strong>Customer note:</strong> {order.notes}
                  </div>
                )}
              </div>
            </section>

            {/* items */}
            <section className="panel">
              <div className="panel-head">
                <strong>Items</strong>
                <span className="tiny muted">{order.items.length} lines</span>
              </div>
              <div className="panel-body stack" style={{ gap: 14 }}>
                {order.items.map((item) => (
                  <div key={item.id} className="cart-line">
                    {item.product_image ? <img src={thumb(item.product_image, 480)} alt="" loading="lazy" decoding="async" /> : null}
                    <div className="grow row-between">
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 15 }}>{item.product_name}</div>
                        <div className="tiny muted">
                          {money(item.unit_price)} × {item.quantity}
                        </div>
                      </div>
                      <strong style={{ fontSize: 15 }}>{money(item.unit_price * item.quantity)}</strong>
                    </div>
                  </div>
                ))}

                <div style={{ borderTop: '1px solid var(--hairline)', paddingTop: 8 }}>
                  <div className="summary-line">
                    <span className="muted">Subtotal</span>
                    <span>{money(order.subtotal)}</span>
                  </div>
                  {order.discount > 0 && (
                    <div className="summary-line">
                      <span className="muted">Discount</span>
                      <span>− {money(order.discount)}</span>
                    </div>
                  )}
                  <div className="summary-line">
                    <span className="muted">Delivery</span>
                    <span>{order.delivery_fee > 0 ? money(order.delivery_fee) : 'Free'}</span>
                  </div>
                  <div className="summary-line total">
                    <span>Total</span>
                    <span>{money(order.total)}</span>
                  </div>
                </div>
              </div>
            </section>

            {/* timeline */}
            <section className="panel">
              <div className="panel-head">
                <strong>History</strong>
              </div>
              <div className="panel-body">
                <div className="timeline">
                  {[...order.timeline].reverse().map((event) => (
                    <div key={`${event.status}-${event.created_at}`} className="tl-item">
                      <div className="tl-rail">
                        <span className="tl-dot" />
                        <span className="tl-line" />
                      </div>
                      <div>
                        <div className="row-between wrap" style={{ gap: 8 }}>
                          <strong style={{ fontSize: 15 }}>{event.label}</strong>
                          <span className="tiny muted">{shortDate(event.created_at)}</span>
                        </div>
                        {event.note && <p className="small muted">{event.note}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* update */}
            <section className="panel">
              <div className="panel-head">
                <strong>Update status</strong>
              </div>
              <div className="panel-body stack" style={{ gap: 12 }}>
                <div className="field">
                  <label htmlFor="status">New status</label>
                  <select
                    id="status"
                    className="select"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    {ORDER_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {STATUS_META[s].label}
                      </option>
                    ))}
                  </select>
                  <span className="tiny muted">{STATUS_META[status]?.hint}</span>
                </div>

                <div className="field">
                  <label htmlFor="note">Note for the customer (optional)</label>
                  <input
                    id="note"
                    className="input"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="e.g. Delivery scheduled for Saturday 11 am"
                  />
                </div>

                <div className="row" style={{ gap: 10 }}>
                  <button type="button" className="btn btn-primary btn-sm" onClick={save} disabled={busy}>
                    {busy ? 'Saving…' : 'Save update'}
                  </button>
                  <span className="tiny muted">
                    Stock is returned automatically if you cancel the order.
                  </span>
                </div>
              </div>
            </section>
          </div>
        </motion.div>
      </motion.div>
    </>
  )
}
