import { motion } from 'motion/react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { showToast } from '../components/ToastHost.jsx'
import { useStore } from '../context/StoreContext.jsx'
import { publicApi } from '../lib/api.js'
import { money } from '../lib/format.js'
import { thumb } from '../lib/picture.js'

const emptyForm = {
  customer_name: '',
  phone: '',
  email: '',
  address: '',
  city: '',
  notes: '',
}

export default function Checkout() {
  const { cart, cartTotal, clearCart, site } = useStore()
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [placed, setPlaced] = useState(null)

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }))
    setErrors((err) => ({ ...err, [key]: undefined, form: undefined }))
  }

  const validate = () => {
    const next = {}
    if (form.customer_name.trim().length < 2) next.customer_name = 'Please enter your full name'
    if (!/^[+\d][\d\s-]{5,}$/.test(form.phone.trim())) next.phone = 'Enter a valid phone number'
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email.trim())) next.email = 'Enter a valid email'
    if (form.address.trim().length < 6) next.address = 'Delivery address is required'
    if (cart.length === 0) next.form = 'Your selection is empty'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    try {
      const order = await publicApi.createOrder({
        ...form,
        items: cart.map((line) => ({ product_id: line.productId, quantity: line.quantity })),
      })
      setPlaced(order)
      clearCart()
      window.scrollTo({ top: 0 })
    } catch (err) {
      setErrors({ form: err.message })
      showToast(err.message, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  /* ---------------- success ---------------- */
  if (placed) {
    return (
      <main className="page">
        <div className="success-screen">
          <motion.div
            className="success-inner"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', bounce: 0, duration: 0.5 }}
          >
            <span className="badge badge-accent">Order request received</span>
            <h1 className="h2">Thanks, {placed.customer_name.split(' ')[0]}!</h1>
            <p className="lede" style={{ textAlign: 'center' }}>
              Keep this number handy — our team will call you within a day to confirm price, stock and
              delivery date.
            </p>
            <div className="order-code">{placed.order_number}</div>
            <div className="card" style={{ padding: 18, width: '100%', textAlign: 'left' }}>
              <div className="summary-line">
                <span className="muted">Items</span>
                <span>{placed.items.reduce((s, i) => s + i.quantity, 0)}</span>
              </div>
              <div className="summary-line">
                <span className="muted">Estimated total</span>
                <strong>{money(placed.total)}</strong>
              </div>
              <div className="summary-line">
                <span className="muted">Delivery to</span>
                <span style={{ textAlign: 'right', maxWidth: '60%' }}>{placed.address}</span>
              </div>
            </div>
            <div className="row wrap" style={{ justifyContent: 'center', gap: 12 }}>
              <a className="btn btn-primary" href={`tel:${(site.phone || '').replace(/\s/g, '')}`}>
                Call {site.phone}
              </a>
              <Link to="/products" className="btn">
                Keep browsing
              </Link>
            </div>
            <p className="tiny muted">Confirmation call from {site.phone}</p>
          </motion.div>
        </div>
      </main>
    )
  }

  /* ---------------- form ---------------- */
  if (cart.length === 0) {
    return (
      <main className="page">
        <div className="container">
          <div className="empty" style={{ paddingTop: 80 }}>
            <p>Your selection is empty.</p>
            <Link to="/products" className="btn btn-primary">
              Browse furniture
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="page">
      <div className="container">
        <div className="section-head" style={{ marginBottom: 24 }}>
          <span className="eyebrow">Step 1 of 1</span>
          <h1 className="h2">Where should it land?</h1>
          <p className="lede">
            Send your requirement — we call you back with the confirmed price and delivery date before
            anything is built.
          </p>
        </div>

        <form className="checkout" onSubmit={submit} noValidate>
          <div className="stack" style={{ gap: 22 }}>
            <div className="panel">
              <div className="panel-head">
                <strong>Contact & delivery</strong>
              </div>
              <div className="panel-body stack" style={{ gap: 16 }}>
                {errors.form && <div className="form-error">{errors.form}</div>}

                <div className="form-grid">
                  <div className="field">
                    <label htmlFor="customer_name">Full name</label>
                    <input
                      id="customer_name"
                      className="input"
                      value={form.customer_name}
                      onChange={set('customer_name')}
                      placeholder="Priya Sharma"
                      autoComplete="name"
                    />
                    {errors.customer_name && <span className="error-text">{errors.customer_name}</span>}
                  </div>

                  <div className="field">
                    <label htmlFor="phone">Phone (we call you to confirm)</label>
                    <input
                      id="phone"
                      className="input"
                      value={form.phone}
                      onChange={set('phone')}
                      placeholder="98765 43210"
                      inputMode="tel"
                      autoComplete="tel"
                    />
                    {errors.phone && <span className="error-text">{errors.phone}</span>}
                  </div>

                  <div className="field">
                    <label htmlFor="email">Email (optional)</label>
                    <input
                      id="email"
                      className="input"
                      value={form.email}
                      onChange={set('email')}
                      placeholder="you@example.com"
                      inputMode="email"
                      autoComplete="email"
                    />
                    {errors.email && <span className="error-text">{errors.email}</span>}
                  </div>

                  <div className="field">
                    <label htmlFor="city">City</label>
                    <input
                      id="city"
                      className="input"
                      value={form.city}
                      onChange={set('city')}
                      placeholder="Pune"
                      autoComplete="address-level2"
                    />
                  </div>
                </div>

                <div className="field">
                  <label htmlFor="address">Delivery address</label>
                  <textarea
                    id="address"
                    className="textarea"
                    value={form.address}
                    onChange={set('address')}
                    placeholder="Flat / house, street, area, landmark"
                    autoComplete="street-address"
                  />
                  {errors.address && <span className="error-text">{errors.address}</span>}
                </div>

                <div className="field">
                  <label htmlFor="notes">Anything we should know? (optional)</label>
                  <textarea
                    id="notes"
                    className="textarea"
                    value={form.notes}
                    onChange={set('notes')}
                    placeholder="Size changes, finish preference, lift availability, preferred time…"
                    style={{ minHeight: 84 }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* summary */}
          <aside className="panel" style={{ position: 'sticky', top: 'calc(var(--nav-h) + 16px)' }}>
            <div className="panel-head">
              <strong>Your selection</strong>
              <span className="tiny muted">{cart.length} items</span>
            </div>
            <div className="panel-body stack" style={{ gap: 14 }}>
              {cart.map((line) => (
                <div key={line.productId} className="cart-line">
                  {line.image ? <img src={thumb(line.image, 480)} alt="" loading="lazy" decoding="async" /> : <span className="thumb" aria-hidden="true" />}
                  <div className="grow">
                    <div className="row-between" style={{ alignItems: 'flex-start' }}>
                      <span style={{ fontWeight: 600, fontSize: 15, letterSpacing: '-0.015em' }}>
                        {line.name}
                      </span>
                      <span style={{ fontWeight: 600, fontSize: 15 }}>
                        {money(line.price * line.quantity)}
                      </span>
                    </div>
                    <span className="tiny muted">Qty {line.quantity}</span>
                  </div>
                </div>
              ))}

              <div style={{ borderTop: '1px solid var(--hairline)', paddingTop: 8 }}>
                <div className="summary-line">
                  <span className="muted">Subtotal</span>
                  <span>{money(cartTotal)}</span>
                </div>
                <div className="summary-line">
                  <span className="muted">Delivery & installation</span>
                  <span style={{ color: 'var(--accent)', fontWeight: 600 }}>Free within 30 km</span>
                </div>
                <div className="summary-line total">
                  <span>Estimated total</span>
                  <span>{money(cartTotal)}</span>
                </div>
              </div>

              <motion.button
                type="submit"
                className="btn btn-primary btn-block"
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.1 }}
                disabled={submitting}
              >
                {submitting ? <span className="spinner" style={{ borderTopColor: 'currentColor' }} /> : null}
                {submitting ? 'Sending…' : 'Place order request'}
              </motion.button>

              <p className="tiny muted center">
                You pay only after our team confirms the price with you. No card details needed.
              </p>
            </div>
          </aside>
        </form>
      </div>
    </main>
  )
}
