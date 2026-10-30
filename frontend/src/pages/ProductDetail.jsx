import { ArrowLeft, Check, Minus, Package, Plus, ShieldCheck, Truck } from 'lucide-react'
import { motion } from 'motion/react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import ProductCard from '../components/ProductCard.jsx'
import { showToast } from '../components/ToastHost.jsx'
import { useStore } from '../context/StoreContext.jsx'
import { publicApi } from '../lib/api.js'
import { money } from '../lib/format.js'
import { picture, placeholder, thumb } from '../lib/picture.js'

export default function ProductDetail() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { addToCart } = useStore()
  const [product, setProduct] = useState(null)
  const [error, setError] = useState('')
  const [qty, setQty] = useState(1)
  const [active, setActive] = useState(0)
  const [added, setAdded] = useState(false)

  useEffect(() => {
    setProduct(null)
    setError('')
    setQty(1)
    setActive(0)
    publicApi
      .product(slug)
      .then(setProduct)
      .catch((e) => setError(e.message))
    window.scrollTo({ top: 0 })
  }, [slug])

  const images = useMemo(() => {
    if (!product) return []
    return [product.image_url, ...(product.gallery || [])].filter(Boolean)
  }, [product])

  const mainPic = product
    ? picture(images[active], { sizes: '(max-width: 900px) 100vw, 55vw', width: 1200 })
    : {}
  const mainBlur = product ? placeholder(images[active]) : undefined

  if (error) {
    return (
      <main className="page">
        <div className="container">
          <div className="empty" style={{ paddingTop: 80 }}>
            <p>{error}</p>
            <Link to="/products" className="btn btn-primary">
              Back to furniture
            </Link>
          </div>
        </div>
      </main>
    )
  }

  if (!product) {
    return (
      <main className="page">
        <div className="page-loading">
          <div className="spinner" />
        </div>
      </main>
    )
  }

  const soldOut = product.stock <= 0
  const max = Math.max(1, product.stock)

  const handleAdd = (goToCheckout = false) => {
    addToCart(product, qty)
    if (goToCheckout) {
      navigate('/checkout')
      return
    }
    setAdded(true)
    showToast(`${product.name} added to your selection`)
    setTimeout(() => setAdded(false), 1600)
  }

  return (
    <main className="page">
      <div className="container">
        <Link to="/products" className="link-btn row" style={{ gap: 6, marginBottom: 18, display: 'inline-flex' }}>
          <ArrowLeft size={15} /> All furniture
        </Link>

        <div className="pdp">
          {/* media */}
          <div className="pdp-media">
            <motion.div
              className="pdp-main"
              key={active}
              style={mainBlur ? { backgroundImage: mainBlur } : undefined}
              initial={{ opacity: 0.4, scale: 0.995 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
            >
              <img
                src={mainPic.src || undefined}
                srcSet={mainPic.srcSet}
                sizes={mainPic.sizes}
                alt={product.name}
                fetchPriority={active === 0 ? 'high' : undefined}
                decoding="async"
              />
            </motion.div>

            {images.length > 1 && (
              <div className="pdp-thumbs">
                {images.map((src, i) => (
                  <button
                    key={src}
                    type="button"
                    className={`pdp-thumb ${i === active ? 'active' : ''}`}
                    style={placeholder(src) ? { backgroundImage: placeholder(src) } : undefined}
                    onClick={() => setActive(i)}
                    aria-label={`View image ${i + 1}`}
                  >
                    <img src={thumb(src, 480)} alt="" loading="lazy" decoding="async" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* details */}
          <div className="stack" style={{ gap: 20 }}>
            <div className="stack" style={{ gap: 10 }}>
              <div className="row wrap" style={{ gap: 8 }}>
                <span className="badge">{product.category}</span>
                <span className={`badge ${soldOut ? 'badge-warn' : 'badge-accent'}`}>
                  {soldOut ? `Built to order · ~${product.lead_time_days} days` : `${product.stock} in stock`}
                </span>
              </div>
              <h1 className="h2" style={{ fontSize: 'clamp(1.8rem, 4vw, 2.5rem)' }}>
                {product.name}
              </h1>
              <div className="row" style={{ gap: 4 }}>
                <span className="price" style={{ fontSize: 26 }}>
                  {money(product.price)}
                </span>
                {product.compare_price ? (
                  <span className="price-old" style={{ fontSize: 16 }}>
                    {money(product.compare_price)}
                  </span>
                ) : null}
              </div>
              <p className="lede" style={{ fontSize: '1.02rem' }}>
                {product.description}
              </p>
            </div>

            <div className="row wrap" style={{ gap: 14 }}>
              <div className="qty">
                <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease">
                  <Minus size={15} />
                </button>
                <span>{qty}</span>
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.min(max, q + 1))}
                  aria-label="Increase"
                  disabled={soldOut}
                >
                  <Plus size={15} />
                </button>
              </div>
              <span className="small muted">
                {soldOut ? 'No stock — we will build a fresh piece for you' : `${money(product.price * qty)} total`}
              </span>
            </div>

            <div className="stack" style={{ gap: 10 }}>
              <motion.button
                type="button"
                className="btn btn-primary btn-block"
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.1 }}
                onClick={() => handleAdd(false)}
              >
                {added ? (
                  <>
                    <Check size={17} /> Added
                  </>
                ) : (
                  'Add to selection'
                )}
              </motion.button>
              <motion.button
                type="button"
                className="btn btn-block"
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.1 }}
                onClick={() => handleAdd(true)}
              >
                Request this order
              </motion.button>
              <p className="tiny muted center">
                No payment now — our team confirms price, stock and delivery date with you first.
              </p>
            </div>

            <dl className="spec-list">
              <div className="spec-row">
                <dt>Materials</dt>
                <dd>{product.materials || '—'}</dd>
              </div>
              <div className="spec-row">
                <dt>Dimensions</dt>
                <dd>{product.dimensions || 'Made to your size'}</dd>
              </div>
              <div className="spec-row">
                <dt>Warranty</dt>
                <dd>{product.warranty}</dd>
              </div>
              <div className="spec-row">
                <dt>Lead time</dt>
                <dd>{product.lead_time_days} days from confirmation</dd>
              </div>
            </dl>

            <div className="row wrap" style={{ gap: 16 }}>
              <span className="row small muted" style={{ gap: 7 }}>
                <Truck size={16} color="var(--accent)" /> Free delivery within 30 km
              </span>
              <span className="row small muted" style={{ gap: 7 }}>
                <Package size={16} color="var(--accent)" /> Packaging removed by us
              </span>
              <span className="row small muted" style={{ gap: 7 }}>
                <ShieldCheck size={16} color="var(--accent)" /> Defect replacement
              </span>
            </div>
          </div>
        </div>

        {product.related?.length > 0 && (
          <section className="section-tight">
            <div className="section-head">
              <span className="eyebrow">Goes well with</span>
              <h2 className="h3">More from {product.category}</h2>
            </div>
            <div className="product-grid">
              {product.related.map((item, i) => (
                <ProductCard key={item.id} product={item} index={i} />
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  )
}
