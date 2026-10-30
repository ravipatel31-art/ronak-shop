import { ArrowLeft, Check, MessageCircle } from 'lucide-react'
import { motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { publicApi } from '../lib/api.js'
import { showToast } from '../components/ToastHost.jsx'

export default function Enquiry() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    category: '',
    message: '',
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const set = (key) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm((f) => ({ ...f, [key]: value }))
  }

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setError('Please fill in all required fields')
      return
    }
    setBusy(true)
    try {
      console.log('Submitting enquiry:', form)
      const result = await publicApi.createEnquiry(form)
      console.log('Enquiry result:', result)
      showToast('Enquiry sent — we\'ll call you back')
      setForm({ name: '', email: '', phone: '', category: '', message: '' })
      navigate('/')
    } catch (err) {
      console.error('Enquiry error:', err)
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="page">
      <div className="container">
        <motion.div
          className="card"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
        >
          <Link to="/" className="link-btn" style={{ marginBottom: 16 }}>
            <ArrowLeft size={16} /> Back to home
          </Link>

          <div className="stack" style={{ gap: 24 }}>
            <div className="stack" style={{ gap: 10 }}>
              <div className="row" style={{ gap: 12 }}>
                <div className="icon-box" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
                  <MessageCircle size={22} strokeWidth={1.8} />
                </div>
                <div>
                  <h1 className="h2">Send us an enquiry</h1>
                  <p className="lede">Got a question about a piece or a custom request? Drop us a message and we’ll call you within a day.</p>
                </div>
              </div>
            </div>

            {error && <div className="form-error">{error}</div>}

            <form onSubmit={submit} className="stack" style={{ gap: 20 }}>
              <div className="field">
                <label htmlFor="enq-name">Full name *</label>
                <input id="enq-name" className="input" value={form.name} onChange={set('name')} placeholder="John Doe" required />
              </div>

              <div className="form-grid">
                <div className="field">
                  <label htmlFor="enq-email">Email *</label>
                  <input id="enq-email" className="input" type="email" value={form.email} onChange={set('email')} placeholder="john@example.com" required />
                </div>
                <div className="field">
                  <label htmlFor="enq-phone">Phone (optional)</label>
                  <input id="enq-phone" className="input" type="tel" value={form.phone} onChange={set('phone')} placeholder="+91 98765 43210" />
                </div>
              </div>

              <div className="field">
                <label htmlFor="enq-category">Category *</label>
                <select id="enq-category" className="select" value={form.category} onChange={set('category')} required>
                  <option value="">Select a category</option>
                  <option value="General">General enquiry</option>
                  <option value="Sofas">Sofas</option>
                  <option value="Beds">Beds</option>
                  <option value="Dining">Dining</option>
                  <option value="Chairs">Chairs</option>
                  <option value="Wardrobes">Wardrobes</option>
                  <option value="TV Units">TV Units</option>
                  <option value="Storage">Storage</option>
                  <option value="Custom">Custom piece</option>
                </select>
              </div>

              <div className="field">
                <label htmlFor="enq-message">Message *</label>
                <textarea
                  id="enq-message"
                  className="textarea"
                  value={form.message}
                  onChange={set('message')}
                  placeholder="Tell us what you're looking for, dimensions you need, or any specific requirements..."
                  rows={5}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={busy}
                style={{ width: '100%' }}
              >
                {busy ? (
                  <>
                    <span className="spinner" /> Sending…
                  </>
                ) : (
                  <>
                    <Check size={16} /> Send enquiry
                  </>
                )}
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </main>
  )
}
