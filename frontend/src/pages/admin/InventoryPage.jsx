import { History, Minus, PackagePlus, Plus, Search } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { showToast } from '../../components/ToastHost.jsx'
import { adminApi } from '../../lib/api.js'
import { money, shortDate } from '../../lib/format.js'
import { thumb } from '../../lib/picture.js'

export default function InventoryPage() {
  const [items, setItems] = useState([])
  const [movements, setMovements] = useState([])
  const [search, setSearch] = useState('')
  const [adjusting, setAdjusting] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const [inv, mv] = await Promise.all([adminApi.inventory(), adminApi.movements()])
      setItems(inv)
      setMovements(mv)
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const visible = items.filter((p) =>
    p.name.toLowerCase().includes(search.trim().toLowerCase()),
  )
  const lowCount = items.filter((p) => p.low_stock && !p.out_of_stock).length
  const outCount = items.filter((p) => p.out_of_stock).length

  return (
    <div className="stack" style={{ gap: 18 }}>
      <div className="stat-grid">
        <div className="stat">
          <span className="stat-label">Products tracked</span>
          <span className="stat-value">{items.length}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Running low</span>
          <span className="stat-value" style={{ color: lowCount ? 'var(--warn)' : undefined }}>
            {lowCount}
          </span>
        </div>
        <div className="stat">
          <span className="stat-label">Out of stock</span>
          <span className="stat-value" style={{ color: outCount ? 'var(--danger)' : undefined }}>
            {outCount}
          </span>
        </div>
      </div>

      <div className="row wrap" style={{ gap: 10 }}>
        <div className="search-wrap">
          <Search size={17} />
          <input
            className="input"
            type="search"
            placeholder="Search inventory"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search inventory"
          />
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <strong>Stock levels</strong>
          <span className="tiny muted">Ordered pieces reserve stock automatically</span>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Price</th>
                <th>In stock</th>
                <th>Alert at</th>
                <th>State</th>
                <th style={{ textAlign: 'right' }}>Adjust</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="muted center" style={{ padding: 30 }}>
                    Loading…
                  </td>
                </tr>
              ) : visible.length === 0 ? (
                <tr>
                  <td colSpan={6} className="muted center" style={{ padding: 30 }}>
                    Nothing found.
                  </td>
                </tr>
              ) : (
                visible.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div className="row" style={{ gap: 12 }}>
                        {p.image_url ? (
                          <img className="thumb" src={thumb(p.image_url, 480)} alt="" loading="lazy" decoding="async" />
                        ) : (
                          <span className="thumb" aria-hidden="true" />
                        )}
                        <div>
                          <div style={{ fontWeight: 550 }}>{p.name}</div>
                          <div className="tiny muted">{p.category || 'Uncategorised'}</div>
                        </div>
                      </div>
                    </td>
                    <td>{money(p.price)}</td>
                    <td style={{ fontWeight: 700, fontSize: 16 }}>{p.stock}</td>
                    <td className="muted">{p.low_stock_threshold}</td>
                    <td>
                      <span className={`badge ${p.out_of_stock ? 'badge-danger' : p.low_stock ? 'badge-warn' : 'badge-accent'}`}>
                        {p.out_of_stock ? 'Out of stock' : p.low_stock ? 'Low stock' : 'Healthy'}
                      </span>
                    </td>
                    <td>
                      <div className="row" style={{ gap: 6, justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          className="btn btn-sm"
                          onClick={() => setAdjusting({ ...p, mode: 'add', qty: 1, reason: 'New batch received' })}
                        >
                          <PackagePlus size={14} /> Receive
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm"
                          onClick={() => setAdjusting({ ...p, mode: 'remove', qty: 1, reason: 'Damaged / scrap' })}
                        >
                          <Minus size={14} /> Reduce
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <strong className="row" style={{ gap: 8 }}>
            <History size={16} /> Stock movement log
          </strong>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>When</th>
                <th>Product</th>
                <th>Change</th>
                <th>After</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              {movements.length === 0 ? (
                <tr>
                  <td colSpan={5} className="muted center" style={{ padding: 26 }}>
                    No stock movements yet.
                  </td>
                </tr>
              ) : (
                movements.slice(0, 40).map((m) => (
                  <tr key={m.id}>
                    <td className="muted">{shortDate(m.created_at)}</td>
                    <td>{m.product?.name || '—'}</td>
                    <td style={{ fontWeight: 700, color: m.change > 0 ? 'var(--accent)' : 'var(--danger)' }}>
                      {m.change > 0 ? `+${m.change}` : m.change}
                    </td>
                    <td>{m.stock_after}</td>
                    <td className="muted">
                      {m.reason}
                      {m.order_number ? ` · ${m.order_number}` : ''}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {adjusting && (
          <AdjustModal
            key={adjusting.id}
            item={adjusting}
            onClose={() => setAdjusting(null)}
            onSaved={() => {
              setAdjusting(null)
              load()
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function AdjustModal({ item, onClose, onSaved }) {
  const [qty, setQty] = useState(item.qty || 1)
  const [reason, setReason] = useState(item.reason || '')
  const [busy, setBusy] = useState(false)
  const sign = item.mode === 'add' ? 1 : -1
  const preview = item.stock + sign * qty

  const save = async () => {
    if (qty < 1) return
    setBusy(true)
    try {
      await adminApi.adjustStock(item.id, {
        change: sign * qty,
        reason: reason.trim() || (sign > 0 ? 'Stock received' : 'Stock reduced'),
      })
      showToast(`${item.name}: stock now ${preview}`)
      onSaved()
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <motion.div
      className="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      onClick={onClose}
    >
      <motion.div
        className="modal"
        style={{ width: 'min(460px, 100%)' }}
        initial={{ opacity: 0, y: 22, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 14, scale: 0.985 }}
        transition={{ type: 'spring', bounce: 0.16, duration: 0.4 }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Adjust stock"
      >
        <div className="modal-head">
          <div className="stack" style={{ gap: 3 }}>
            <strong>{item.mode === 'add' ? 'Receive stock' : 'Reduce stock'}</strong>
            <span className="tiny muted">{item.name}</span>
          </div>
        </div>

        <div className="modal-body">
          <div className="field">
            <label htmlFor="qty">Quantity</label>
            <div className="qty">
              <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Less">
                <Plus size={14} style={{ transform: 'rotate(45deg)' }} />
              </button>
              <span>{qty}</span>
              <button type="button" onClick={() => setQty((q) => q + 1)} aria-label="More">
                <Plus size={14} />
              </button>
            </div>
          </div>

          <div className="field">
            <label htmlFor="reason">Reason</label>
            <input
              id="reason"
              className="input"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="New batch received, damage, correction…"
            />
          </div>

          <div className="summary-line total" style={{ marginTop: 0 }}>
            <span>Stock after change</span>
            <span style={{ color: preview < 0 ? 'var(--danger)' : undefined }}>
              {item.stock} {sign > 0 ? '+' : '−'} {qty} = {preview}
            </span>
          </div>

          {preview < 0 && <div className="form-error">Stock cannot go below zero.</div>}
        </div>

        <div className="modal-foot">
          <button type="button" className="btn btn-sm" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={save}
            disabled={busy || preview < 0}
            style={{ display: 'inline-flex', gap: 6 }}
          >
            {sign > 0 ? <Plus size={15} /> : <Minus size={15} />}
            {busy ? 'Saving…' : 'Apply'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
