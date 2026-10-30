import { Check, Pencil, Plus, Search, Star, Trash2, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { showToast } from '../../components/ToastHost.jsx'
import ImageUpload from '../../components/ImageUpload.jsx'
import { adminApi } from '../../lib/api.js'
import { money } from '../../lib/format.js'
import { thumb } from '../../lib/picture.js'

const blank = {
  name: '',
  slug: '',
  category_id: '',
  description: '',
  materials: '',
  dimensions: '',
  warranty: '1 year warranty · free installation',
  price: '',
  compare_price: '',
  image_url: '',
  gallery: '',
  stock: 0,
  low_stock_threshold: 3,
  lead_time_days: 14,
  is_active: true,
  is_featured: false,
  sort_order: 0,
}

export default function ProductsPage() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState(null) // product object | 'new'
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const [prods, cats] = await Promise.all([adminApi.products(), adminApi.categories()])
      setProducts(prods)
      setCategories(cats)
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const visible = products.filter((p) =>
    `${p.name} ${p.category?.name || ''}`.toLowerCase().includes(search.trim().toLowerCase()),
  )

  const toggleActive = async (product) => {
    try {
      await adminApi.saveProduct(toPayload(product, { is_active: !product.is_active }), product.id)
      showToast(product.is_active ? 'Product hidden from the shop' : 'Product is live on the shop')
      load()
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  const remove = async (product) => {
    if (!window.confirm(`Archive “${product.name}”? It disappears from the shop but stays in reports.`))
      return
    try {
      await adminApi.deleteProduct(product.id)
      showToast('Product archived')
      load()
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  return (
    <div className="stack" style={{ gap: 18 }}>
      <div className="row wrap" style={{ gap: 10 }}>
        <div className="search-wrap">
          <Search size={17} />
          <input
            className="input"
            type="search"
            placeholder="Search products"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search products"
          />
        </div>
        <button type="button" className="btn btn-primary btn-sm" onClick={() => setEditing('new')}>
          <Plus size={16} /> New product
        </button>
      </div>

      <div className="panel">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
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
                    No products yet.
                  </td>
                </tr>
              ) : (
                visible.map((product) => (
                  <tr key={product.id}>
                    <td>
                      <div className="row" style={{ gap: 12 }}>
                        {product.image_url ? (
                          <img className="thumb" src={thumb(product.image_url, 480)} alt="" loading="lazy" decoding="async" />
                        ) : (
                          <span className="thumb" aria-hidden="true" />
                        )}
                        <div>
                          <div style={{ fontWeight: 550 }}>{product.name}</div>
                          <div className="tiny muted">{product.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td className="muted">{product.category?.name || '—'}</td>
                    <td style={{ fontWeight: 600 }}>
                      {money(product.price)}
                      {product.compare_price ? (
                        <div className="tiny muted" style={{ fontWeight: 400 }}>
                          was {money(product.compare_price)}
                        </div>
                      ) : null}
                    </td>
                    <td>
                      <span className={`badge ${product.stock <= 0 ? 'badge-danger' : product.stock <= product.low_stock_threshold ? 'badge-warn' : 'badge-accent'}`}>
                        {product.stock <= 0 ? 'Out of stock' : `${product.stock} in stock`}
                      </span>
                    </td>
                    <td>
                      <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
                        <span className={`badge ${product.is_active ? 'badge-accent' : ''}`}>
                          {product.is_active ? 'Live' : 'Hidden'}
                        </span>
                        {product.is_featured ? (
                          <span className="badge">
                            <Star size={11} /> Featured
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td>
                      <div className="row" style={{ gap: 6, justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          className="btn btn-sm"
                          onClick={() => setEditing(product)}
                          aria-label={`Edit ${product.name}`}
                        >
                          <Pencil size={14} /> Edit price
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm"
                          onClick={() => toggleActive(product)}
                          aria-label={product.is_active ? 'Hide product' : 'Show product'}
                        >
                          {product.is_active ? 'Hide' : 'Show'}
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-danger"
                          onClick={() => remove(product)}
                          aria-label={`Archive ${product.name}`}
                        >
                          <Trash2 size={14} />
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

      <CategoriesPanel categories={categories} onChanged={load} />

      <AnimatePresence>
        {editing && (
          <ProductForm
            key={editing === 'new' ? 'new' : editing.id}
            product={editing === 'new' ? null : editing}
            categories={categories}
            onClose={() => setEditing(null)}
            onSaved={() => {
              setEditing(null)
              load()
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function toPayload(product, patch = {}) {
  const base = { ...blank, ...product, ...patch }
  return {
    name: base.name,
    slug: base.slug || null,
    category_id: base.category_id ? Number(base.category_id) : null,
    description: base.description || '',
    materials: base.materials || '',
    dimensions: base.dimensions || '',
    warranty: base.warranty || '',
    price: Number(base.price) || 0,
    compare_price: base.compare_price ? Number(base.compare_price) : null,
    image_url: base.image_url || '',
    gallery: base.gallery || '',
    stock: Number(base.stock) || 0,
    low_stock_threshold: Number(base.low_stock_threshold) || 0,
    lead_time_days: Number(base.lead_time_days) || 0,
    is_active: Boolean(base.is_active),
    is_featured: Boolean(base.is_featured),
    sort_order: Number(base.sort_order) || 0,
  }
}

function ProductForm({ product, categories, onClose, onSaved }) {
  const [form, setForm] = useState(() =>
    product
      ? {
          ...blank,
          ...product,
          category_id: product.category_id ?? '',
          compare_price: product.compare_price ?? '',
          gallery: product.gallery || '',
        }
      : blank,
  )
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const set = (key) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm((f) => ({ ...f, [key]: value }))
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) {
      setError('Give the product a name')
      return
    }
    setBusy(true)
    setError('')
    try {
      await adminApi.saveProduct(toPayload(form), product?.id)
      showToast(product ? 'Product updated' : 'Product added to the shop')
      onSaved()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <motion.div
        className="modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.16 }}
        onClick={onClose}
      >
        <motion.form
          className="modal"
          onSubmit={submit}
          initial={{ opacity: 0, y: 24, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.99 }}
          transition={{ type: 'spring', bounce: 0.16, duration: 0.42 }}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-label={product ? 'Edit product' : 'New product'}
        >
          <div className="modal-head">
            <strong style={{ fontSize: 17, letterSpacing: '-0.02em' }}>
              {product ? 'Edit product' : 'New product'}
            </strong>
            <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
              <X size={19} />
            </button>
          </div>

          <div className="modal-body">
            {error && <div className="form-error">{error}</div>}

            <div className="form-grid">
              <div className="field">
                <label htmlFor="p-name">Name</label>
                <input id="p-name" className="input" value={form.name} onChange={set('name')} required />
              </div>
              <div className="field">
                <label htmlFor="p-slug">URL slug (optional)</label>
                <input id="p-slug" className="input" value={form.slug} onChange={set('slug')} placeholder="auto from name" />
              </div>
              <div className="field">
                <label htmlFor="p-cat">Category</label>
                <select id="p-cat" className="select" value={form.category_id} onChange={set('category_id')}>
                  <option value="">No category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="p-price">Price (₹)</label>
                <input id="p-price" className="input" type="number" min="0" step="1" value={form.price} onChange={set('price')} required />
              </div>
              <div className="field">
                <label htmlFor="p-compare">Compare-at price (₹, optional)</label>
                <input id="p-compare" className="input" type="number" min="0" step="1" value={form.compare_price} onChange={set('compare_price')} />
              </div>
              <div className="field">
                <label htmlFor="p-stock">Stock on hand</label>
                <input id="p-stock" className="input" type="number" min="0" step="1" value={form.stock} onChange={set('stock')} />
              </div>
              <div className="field">
                <label htmlFor="p-low">Low-stock alert at</label>
                <input id="p-low" className="input" type="number" min="0" step="1" value={form.low_stock_threshold} onChange={set('low_stock_threshold')} />
              </div>
              <div className="field">
                <label htmlFor="p-lead">Lead time (days)</label>
                <input id="p-lead" className="input" type="number" min="0" step="1" value={form.lead_time_days} onChange={set('lead_time_days')} />
              </div>
            </div>

            <div className="field">
              <label htmlFor="p-desc">Description</label>
              <textarea id="p-desc" className="textarea" value={form.description} onChange={set('description')} />
            </div>

            <div className="form-grid">
              <div className="field">
                <label htmlFor="p-mat">Materials</label>
                <input id="p-mat" className="input" value={form.materials} onChange={set('materials')} />
              </div>
              <div className="field">
                <label htmlFor="p-dim">Dimensions</label>
                <input id="p-dim" className="input" value={form.dimensions} onChange={set('dimensions')} />
              </div>
              <div className="field">
                <label htmlFor="p-warr">Warranty</label>
                <input id="p-warr" className="input" value={form.warranty} onChange={set('warranty')} />
              </div>
            </div>

            <div className="field">
              <label htmlFor="p-img">Main image</label>
              <div className="row" style={{ gap: 8 }}>
                <input
                  id="p-img"
                  className="input"
                  value={form.image_url}
                  onChange={set('image_url')}
                  placeholder="Upload a photo, or paste an image URL"
                />
                <ImageUpload onUploaded={(url) => setForm((f) => ({ ...f, image_url: url }))} />
              </div>
              {form.image_url && (
                <img
                  className="thumb"
                  style={{ width: '100%', height: 170, borderRadius: 12, marginTop: 6 }}
                  src={thumb(form.image_url, 480)}
                  alt="Preview"
                />
              )}
            </div>

            <div className="field">
              <label htmlFor="p-gal">Gallery images (one URL per line)</label>
              <textarea id="p-gal" className="textarea" value={form.gallery} onChange={set('gallery')} />
              <div className="row" style={{ gap: 8, marginTop: 8 }}>
                <ImageUpload
                  label="Upload extra image"
                  onUploaded={(url) =>
                    setForm((f) => ({ ...f, gallery: f.gallery.trim() ? `${f.gallery.trimEnd()}\n${url}` : url }))
                  }
                />
                <span className="tiny muted">Uploads are added to the list above</span>
              </div>
            </div>

            <div className="row wrap" style={{ gap: 18 }}>
              <label className="row" style={{ gap: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={form.is_active} onChange={set('is_active')} />
                Live on the shop
              </label>
              <label className="row" style={{ gap: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={form.is_featured} onChange={set('is_featured')} />
                Feature on home page
              </label>
            </div>
          </div>

          <div className="modal-foot">
            <button type="button" className="btn btn-sm" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={busy}>
              {busy ? 'Saving…' : <><Check size={15} /> Save product</>}
            </button>
          </div>
        </motion.form>
      </motion.div>
    </>
  )
}

function CategoriesPanel({ categories, onChanged }) {
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)

  const add = async (e) => {
    e.preventDefault()
    if (!name.trim()) return
    setBusy(true)
    try {
      await adminApi.saveCategory({ name: name.trim(), description: '' })
      showToast('Category added')
      setName('')
      onChanged()
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  const remove = async (cat) => {
    if (!window.confirm(`Delete the “${cat.name}” category? Products stay, they lose the category.`)) return
    try {
      await adminApi.deleteCategory(cat.id)
      showToast('Category deleted')
      onChanged()
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  return (
    <div className="panel">
      <div className="panel-head">
        <strong>Categories</strong>
        <span className="tiny muted">{categories.length} total</span>
      </div>
      <div className="panel-body stack" style={{ gap: 14 }}>
        <div className="row wrap" style={{ gap: 10 }}>
          {categories.map((cat) => (
            <span key={cat.id} className="chip" style={{ cursor: 'default' }}>
              {cat.name}
              <button
                type="button"
                className="link-btn"
                style={{ color: 'var(--danger)', fontSize: 13 }}
                onClick={() => remove(cat)}
                aria-label={`Delete ${cat.name}`}
              >
                remove
              </button>
            </span>
          ))}
        </div>
        <form className="row" style={{ gap: 10 }} onSubmit={add}>
          <input
            className="input"
            style={{ maxWidth: 260 }}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="New category name"
            aria-label="New category name"
          />
          <button type="submit" className="btn btn-sm" disabled={busy || !name.trim()}>
            <Plus size={15} /> Add
          </button>
        </form>
      </div>
    </div>
  )
}
