import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../context/StoreContext.jsx'
import { money } from '../lib/format.js'
import { thumb } from '../lib/picture.js'

export default function CartDrawer() {
  const { cart, cartTotal, setCartOpen, setQuantity, removeFromCart } = useStore()
  const navigate = useNavigate()
  const reduced = useReducedMotion()

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && setCartOpen(false)
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [setCartOpen])

  return (
    <>
      <motion.div
        className="scrim"
        onClick={() => setCartOpen(false)}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      />
      <motion.aside
        className="drawer-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Your selection"
        initial={reduced ? { opacity: 0 } : { x: '100%' }}
        animate={reduced ? { opacity: 1 } : { x: 0 }}
        exit={reduced ? { opacity: 0 } : { x: '100%' }}
        transition={{ type: 'spring', bounce: 0.16, duration: 0.45 }}
        drag={reduced ? false : 'x'}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={{ left: 0.02, right: 0.4 }}
        onDragEnd={(_, info) => {
          if (info.offset.x > 90 || info.velocity.x > 500) setCartOpen(false)
        }}
      >
        <div className="drawer-head">
          <div className="stack" style={{ gap: 2 }}>
            <strong style={{ fontSize: 17, letterSpacing: '-0.02em' }}>Your selection</strong>
            <span className="tiny muted">
              {cart.length} {cart.length === 1 ? 'item' : 'items'} · we confirm stock on call
            </span>
          </div>
          <button type="button" className="icon-btn" onClick={() => setCartOpen(false)} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="drawer-body">
          {cart.length === 0 ? (
            <div className="empty">
              <ShoppingBag size={26} strokeWidth={1.5} />
              <p>Nothing selected yet.</p>
              <button type="button" className="btn btn-primary btn-sm" onClick={() => navigate('/products')}>
                Browse furniture
              </button>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {cart.map((line) => (
                <motion.div
                  key={line.productId}
                  className="cart-line"
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0, marginTop: -16 }}
                  transition={{ type: 'spring', bounce: 0, duration: 0.35 }}
                >
                  {line.image ? <img src={thumb(line.image, 480)} alt="" loading="lazy" decoding="async" /> : <span className="thumb" aria-hidden="true" />}
                  <div className="grow stack" style={{ gap: 6 }}>
                    <div className="row-between" style={{ alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontWeight: 600, letterSpacing: '-0.015em', fontSize: 15 }}>
                          {line.name}
                        </div>
                        <div className="tiny muted">{money(line.price)} each</div>
                      </div>
                      <button
                        type="button"
                        className="icon-btn"
                        style={{ width: 32, height: 32 }}
                        onClick={() => removeFromCart(line.productId)}
                        aria-label={`Remove ${line.name}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="row-between">
                      <div className="qty">
                        <button
                          type="button"
                          onClick={() => setQuantity(line.productId, line.quantity - 1)}
                          aria-label="Decrease quantity"
                        >
                          <Minus size={14} />
                        </button>
                        <span>{line.quantity}</span>
                        <button
                          type="button"
                          onClick={() => setQuantity(line.productId, line.quantity + 1)}
                          aria-label="Increase quantity"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <strong style={{ fontSize: 15.5 }}>{money(line.price * line.quantity)}</strong>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        {cart.length > 0 && (
          <div className="drawer-foot">
            <div className="summary-line">
              <span className="muted">Estimated total</span>
              <strong>{money(cartTotal)}</strong>
            </div>
            <p className="tiny muted">
              Final price, delivery date and stock are confirmed by our team before you pay.
            </p>
            <button
              type="button"
              className="btn btn-primary btn-block"
              onClick={() => {
                setCartOpen(false)
                navigate('/checkout')
              }}
            >
              Request this order
            </button>
          </div>
        )}
      </motion.aside>
    </>
  )
}
