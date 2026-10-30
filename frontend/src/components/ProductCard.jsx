import { motion } from 'motion/react'
import { Link } from 'react-router-dom'
import { money } from '../lib/format.js'
import { picture, placeholder } from '../lib/picture.js'

export default function ProductCard({ product, index = 0 }) {
  const soldOut = product.stock <= 0
  const low = !soldOut && product.stock <= (product.low_stock_threshold ?? 3)
  const pic = picture(product.image_url, {
    sizes: '(max-width: 760px) 92vw, (max-width: 1180px) 30vw, 300px',
  })
  const blur = placeholder(product.image_url)

  return (
    <motion.article
      className="product-card"
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{
        type: 'spring',
        bounce: 0,
        duration: 0.5,
        delay: Math.min(index, 6) * 0.05,
      }}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.985 }}
    >
      <Link
        to={`/products/${product.slug}`}
        className="product-media"
        style={blur ? { backgroundImage: blur } : undefined}
      >
        {pic.src && (
          <img
            src={pic.src}
            srcSet={pic.srcSet}
            sizes={pic.sizes}
            alt={product.name}
            loading={index < 4 ? 'eager' : 'lazy'}
            decoding="async"
          />
        )}
        {soldOut ? (
          <span className="badge">Made to order</span>
        ) : product.compare_price ? (
          <span className="badge badge-accent">Save {money(product.compare_price - product.price)}</span>
        ) : null}
      </Link>

      <div className="product-body">
        <Link to={`/products/${product.slug}`}>
          <span className="product-name">{product.name}</span>
        </Link>
        <div className="product-meta">
          {product.category}
          {product.dimensions ? ` · ${product.dimensions}` : ''}
        </div>

        <div className="product-foot">
          <div>
            <span className="price">{money(product.price)}</span>
            {product.compare_price ? <span className="price-old">{money(product.compare_price)}</span> : null}
          </div>
          <span className={`badge ${soldOut ? '' : low ? 'badge-warn' : 'badge-accent'}`}>
            {soldOut ? `~${product.lead_time_days} days` : low ? `Only ${product.stock} left` : 'In stock'}
          </span>
        </div>
      </div>
    </motion.article>
  )
}
