import { ArrowRight, Hammer, ShieldCheck, Trees, Truck, PackageCheck, Ruler, Sparkles, Phone } from 'lucide-react'
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react'
import { Fragment, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import ProductCard from '../components/ProductCard.jsx'
import Reveal from '../components/Reveal.jsx'
import { useStore } from '../context/StoreContext.jsx'
import { publicApi } from '../lib/api.js'
import { picture, placeholder } from '../lib/picture.js'

const steps = [
  { icon: Ruler, title: 'Tell us your requirement', text: 'Pick a piece or describe the size, wood and finish you want.' },
  { icon: Sparkles, title: 'We confirm price & date', text: 'Our team calls you within a day with the final quote and delivery date.' },
  { icon: PackageCheck, title: 'Built in our workshop', text: 'Carpenters build it to order and quality-check every joint and finish.' },
  { icon: Truck, title: 'Delivered & installed', text: 'Our own team delivers, installs and takes away the packaging.' },
]

const marqueeItems = [
  'Solid wood & veneer',
  'Made to measure',
  'Free installation',
  '1-year warranty',
  'Built in our workshop',
  'Delivered by our own team',
  'Replacement guarantee on defects',
]

function HeroTitle({ text, reduced }) {
  const words = (text || '').split(' ').filter(Boolean)
  return (
    <h1 className="display hero-title">
      {words.map((word, i) => (
        <Fragment key={`${word}-${i}`}>
          {i > 0 && ' '}
          <motion.span
            className="word"
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: '0.55em' }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              type: 'spring',
              bounce: 0,
              duration: 0.65,
              visualDuration: 0.45,
              delay: 0.12 + i * 0.055,
            }}
          >
            {word}
          </motion.span>
        </Fragment>
      ))}
    </h1>
  )
}

export default function Home() {
  const { site } = useStore()
  const [categories, setCategories] = useState([])
  const [featured, setFeatured] = useState([])
  const reduced = useReducedMotion()
  const heroRef = useRef(null)

  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const imgY = useTransform(scrollYProgress, [0, 1], [reduced ? '0%' : '-7%', '0%'])

  useEffect(() => {
    publicApi.categories().then(setCategories).catch(() => setCategories([]))
    publicApi.products({ featured: 'true', page_size: 8 }).then((d) => setFeatured(d.items)).catch(() => setFeatured([]))
  }, [])

  const tel = `tel:${(site.phone || '').replace(/\s/g, '')}`

  return (
    <main className="home">
      {/* ---------------- hero ---------------- */}
      <section className="hero" ref={heroRef}>
        <div className="container">
          <div className="hero-grid">
            <div className="hero-copy">
              <motion.span
                className="eyebrow"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.05 }}
              >
                {site.tagline}
              </motion.span>

              <HeroTitle text={site.hero_title} reduced={reduced} />

              <motion.p
                className="lede"
                initial={reduced ? { opacity: 0 } : { opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', bounce: 0, duration: 0.6, delay: 0.42 }}
              >
                {site.hero_subtitle}
              </motion.p>

              <motion.div
                className="hero-cta"
                initial={reduced ? { opacity: 0 } : { opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', bounce: 0, duration: 0.6, delay: 0.52 }}
              >
                <Link to="/products" className="btn btn-primary">
                  Browse furniture <ArrowRight size={17} />
                </Link>
                <a className="btn" href={tel}>
                  <Phone size={16} /> Call {site.phone}
                </a>
              </motion.div>

              <motion.div
                className="hero-trust"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.66 }}
              >
                <span>
                  <Trees size={15} strokeWidth={1.8} color="var(--gold)" /> Solid wood & veneer
                </span>
                <span>
                  <Truck size={15} strokeWidth={1.8} color="var(--gold)" /> Free delivery & installation
                </span>
                <span>
                  <ShieldCheck size={15} strokeWidth={1.8} color="var(--gold)" /> 1-year warranty
                </span>
              </motion.div>
            </div>

            <motion.div
              className="hero-visual"
              initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 18 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: 'spring', bounce: 0, duration: 0.8, visualDuration: 0.55 }}
            >
              <div className="hero-glow" aria-hidden="true" />
              <div className="hero-frame" style={{ backgroundImage: placeholder(site.hero_image) }}>
                {site.hero_image && (
                  <motion.img
                    {...picture(site.hero_image, { sizes: '(max-width: 960px) 100vw, 52vw', width: 1800, widths: [800, 1200, 1800] })}
                    style={{ y: imgY }}
                    alt=""
                    fetchPriority="high"
                    decoding="async"
                  />
                )}
              </div>
              <motion.span
                className="float-chip chip-1"
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', bounce: 0.2, duration: 0.5, delay: 0.75 }}
              >
                <Hammer size={15} strokeWidth={1.9} color="var(--accent)" /> Built to order
              </motion.span>
              <motion.span
                className="float-chip chip-2"
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', bounce: 0.2, duration: 0.5, delay: 0.88 }}
              >
                <Truck size={15} strokeWidth={1.9} color="var(--accent)" /> Free installation
              </motion.span>
            </motion.div>
          </div>

          <div className="scroll-cue" aria-hidden="true" />
        </div>
      </section>

      {/* ---------------- marquee ---------------- */}
      <div className="marquee" aria-hidden="true">
        <div className="marquee-track">
          {[0, 1].map((group) => (
            <div className="marquee-group" key={group} aria-hidden={group === 1}>
              {marqueeItems.map((item) => (
                <span className="marquee-item" key={item}>
                  {item}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ---------------- categories ---------------- */}
      <section className="section-tight">
        <div className="container">
          <Reveal className="section-head">
            <span className="eyebrow">Shop by room</span>
            <h2 className="h2">Everything, built to your requirement</h2>
          </Reveal>

          <div className="cat-strip">
            {categories.map((cat, i) => (
              <Reveal key={cat.id} delay={i * 0.04}>
                <Link to={`/products?category=${cat.slug}`} className="cat-card">
                  <strong>{cat.name}</strong>
                  <span className="tiny muted">{cat.description}</span>
                  <span className="tiny" style={{ color: 'var(--gold)', fontWeight: 600 }}>
                    {cat.product_count} {cat.product_count === 1 ? 'piece' : 'pieces'}
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- featured ---------------- */}
      <section className="section-tight">
        <div className="container">
          <Reveal className="section-head row-between wrap" style={{ alignItems: 'flex-end' }}>
            <div className="stack" style={{ gap: 8 }}>
              <span className="eyebrow">Most requested</span>
              <h2 className="h2">Popular this month</h2>
            </div>
            <Link to="/products" className="link-btn">
              View all furniture →
            </Link>
          </Reveal>

          <div className="product-grid">
            {featured.map((product, i) => (
              <ProductCard key={product.id} product={product} index={i} />
            ))}
            {featured.length === 0 && (
              <div className="empty">Loading pieces…</div>
            )}
          </div>
        </div>
      </section>

      {/* ---------------- how it works ---------------- */}
      <section className="section">
        <div className="container">
          <Reveal className="section-head center">
            <span className="eyebrow">How ordering works</span>
            <h2 className="h2">Four steps, no surprises</h2>
            <p className="lede" style={{ textAlign: 'center' }}>
              You only pay after the price, size and delivery date are confirmed with you.
            </p>
          </Reveal>

          <div className="steps-wrap">
            <div className="steps-line" aria-hidden="true">
              <motion.div
                className="steps-line-progress"
                initial={reduced ? { scaleX: 1 } : { scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={reduced ? { duration: 0 } : { duration: 1.2, ease: [0.77, 0, 0.175, 1], delay: 0.15 }}
              />
            </div>

            <div className="steps">
              {steps.map((step, i) => (
                <Reveal key={step.title} delay={0.2 + i * 0.09}>
                  <div className="step">
                    <div className="row-between">
                      <span className="step-num">{i + 1}</span>
                      <step.icon size={19} strokeWidth={1.7} color="var(--text-tertiary)" />
                    </div>
                    <strong style={{ fontSize: 16.5, letterSpacing: '-0.018em' }}>{step.title}</strong>
                    <p className="small muted">{step.text}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- about ---------------- */}
      <section className="section-tight">
        <div className="container">
          <div className="card" style={{ padding: 'clamp(26px, 4vw, 46px)' }}>
            <Reveal className="stack" style={{ gap: 16, maxWidth: '760px' }}>
              <span className="eyebrow">About the workshop</span>
              <h2 className="h2">{site.about_title}</h2>
              <p className="lede">{site.about_body}</p>
              <div className="row wrap" style={{ gap: 10, marginTop: 6 }}>
                <span className="badge badge-accent">{site.showroom_note}</span>
                <span className="badge">1-year warranty</span>
                <span className="badge">Free installation</span>
                <span className="badge">Replacement guarantee on defects</span>
              </div>
              <div className="row wrap" style={{ gap: 12, marginTop: 10 }}>
                <Link to="/products" className="btn btn-primary">
                  Start with a piece
                </Link>
                <a className="btn" href={tel}>
                  Call {site.phone}
                </a>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ---------------- final CTA ---------------- */}
      <section className="section-tight" style={{ paddingBottom: 'clamp(48px, 6vw, 84px)' }}>
        <div className="container">
          <Reveal>
            <div className="cta-panel">
              <div className="cta-sheen" aria-hidden="true" />
              <div className="stack" style={{ gap: 6 }}>
                <h2 className="h2">Visit the workshop — or just call</h2>
                <span className="small">
                  {site.address} · {site.hours}
                </span>
              </div>
              <div className="row wrap" style={{ gap: 12 }}>
                <a className="btn cta-btn-primary" href={tel}>
                  <Phone size={16} /> Call {site.phone}
                </a>
                <Link to="/products" className="btn cta-btn-ghost">
                  Browse furniture <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  )
}
