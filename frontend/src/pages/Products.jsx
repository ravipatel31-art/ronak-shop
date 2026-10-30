import { Search, SlidersHorizontal } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import ProductCard from '../components/ProductCard.jsx'
import { publicApi } from '../lib/api.js'

const sorts = [
  { value: 'featured', label: 'Featured' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
  { value: 'newest', label: 'Newest' },
]

export default function Products() {
  const [params, setParams] = useSearchParams()
  const [categories, setCategories] = useState([])
  const [data, setData] = useState({ items: [], total: 0, pages: 1 })
  const [loading, setLoading] = useState(true)
  const [search] = useState(params.get('search') || '')

  const category = params.get('category') || ''
  const sort = params.get('sort') || 'featured'
  const page = Number(params.get('page') || 1)

  useEffect(() => {
    publicApi.categories().then(setCategories).catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    const query = new URLSearchParams({ page: String(page), page_size: '24', sort })
    if (category) query.set('category', category)
    if (search.trim()) query.set('search', search.trim())
    const timer = setTimeout(() => {
      publicApi
        .products(Object.fromEntries(query))
        .then(setData)
        .catch(() => setData({ items: [], total: 0, pages: 1 }))
        .finally(() => setLoading(false))
    }, 220)
    return () => clearTimeout(timer)
  }, [category, sort, page, search])

  const update = (patch) => {
    const next = new URLSearchParams(params)
    Object.entries(patch).forEach(([key, value]) => {
      if (value) next.set(key, value)
      else next.delete(key)
    })
    if (!('page' in patch)) next.delete('page')
    setParams(next, { replace: true })
  }

  const activeCategory = useMemo(
    () => categories.find((c) => c.slug === category),
    [categories, category],
  )

  return (
    <main className="page">
      <div className="container">
        <div className="section-head" style={{ marginBottom: 20 }}>
          <span className="eyebrow">The collection</span>
          <h1 className="h2">{activeCategory ? activeCategory.name : 'All furniture'}</h1>
          <p className="lede">
            {activeCategory?.description ||
              'Every piece is built to order in our workshop. Prices include delivery and installation.'}
          </p>
        </div>

        {/* filter bar */}
        <div className="stack" style={{ gap: 14, marginBottom: 26 }}>
          <div className="row wrap" style={{ gap: 10 }}>
            <div className="search-wrap">
              <Search size={17} />
              <input
                className="input"
                type="search"
                placeholder="Search sofas, beds, teak…"
                value={search}
                onChange={(e) => update({ search: e.target.value })}
                aria-label="Search furniture"
              />
            </div>

            <div className="row" style={{ gap: 8 }}>
              <SlidersHorizontal size={16} color="var(--text-tertiary)" />
              <select
                className="select"
                style={{ width: 'auto', minWidth: 170 }}
                value={sort}
                onChange={(e) => update({ sort: e.target.value })}
                aria-label="Sort products"
              >
                {sorts.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="cat-strip">
            <button
              type="button"
              className={`chip ${!category ? 'active' : ''}`}
              onClick={() => update({ category: '' })}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                className={`chip ${category === cat.slug ? 'active' : ''}`}
                onClick={() => update({ category: cat.slug })}
              >
                {cat.name}
                <span className="tiny" style={{ opacity: 0.7 }}>
                  {cat.product_count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="product-grid">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="product-card" style={{ opacity: 0.5 }}>
                <div className="product-media" />
                <div className="product-body">
                  <div style={{ height: 16, width: '70%', background: 'var(--surface-sunken)', borderRadius: 6 }} />
                  <div style={{ height: 12, width: '45%', background: 'var(--surface-sunken)', borderRadius: 6 }} />
                </div>
              </div>
            ))}
          </div>
        ) : data.items.length === 0 ? (
          <div className="empty">
            <p>No pieces match that yet.</p>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setParams({}, { replace: true })}>
              Clear filters
            </button>
          </div>
        ) : (
          <>
            <div className="product-grid">
              {data.items.map((product, i) => (
                <ProductCard key={product.id} product={product} index={i} />
              ))}
            </div>

            {data.pages > 1 && (
              <div className="row center" style={{ justifyContent: 'center', gap: 10, marginTop: 30 }}>
                <button
                  type="button"
                  className="btn btn-sm"
                  disabled={page <= 1}
                  onClick={() => update({ page: String(page - 1) })}
                >
                  Previous
                </button>
                <span className="small muted">
                  Page {page} of {data.pages}
                </span>
                <button
                  type="button"
                  className="btn btn-sm"
                  disabled={page >= data.pages}
                  onClick={() => update({ page: String(page + 1) })}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}
