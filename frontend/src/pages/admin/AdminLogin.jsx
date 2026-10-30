import { motion } from 'motion/react'
import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useStore } from '../../context/StoreContext.jsx'

export default function AdminLogin() {
  const { user, authReady, login } = useStore()
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (authReady && user) return <Navigate to="/admin" replace />

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await login(form.username.trim(), form.password)
      navigate('/admin', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="login-screen">
      <motion.form
        className="login-card"
        onSubmit={submit}
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', bounce: 0, duration: 0.5 }}
      >
        <div className="stack" style={{ gap: 6 }}>
          <div className="brand" style={{ marginBottom: 6 }}>
            <span className="brand-mark" aria-hidden="true">
              R
            </span>
            <span>Ronak Furniture</span>
          </div>
          <h1 className="h3">Admin sign in</h1>
          <p className="small muted">Edit products, prices, stock, orders and the website content.</p>
        </div>

        {error && <div className="form-error">{error}</div>}

        <div className="stack" style={{ gap: 14 }}>
          <div className="field">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              className="input"
              value={form.username}
              onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
              autoComplete="username"
              autoCapitalize="none"
              required
            />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="input"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              autoComplete="current-password"
              required
            />
          </div>
        </div>

        <motion.button
          type="submit"
          className="btn btn-primary btn-block"
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.1 }}
          disabled={busy}
        >
          {busy ? <span className="spinner" style={{ borderTopColor: 'currentColor' }} /> : null}
          {busy ? 'Signing in…' : 'Sign in'}
        </motion.button>

        <a href="/" className="link-btn center" style={{ textAlign: 'center' }}>
          ← Back to the shop
        </a>
      </motion.form>
    </div>
  )
}
