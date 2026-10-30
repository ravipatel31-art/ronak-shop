import { AnimatePresence, motion, useReducedMotion, useScroll } from 'motion/react'
import { Menu, ShoppingBag, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useStore } from '../context/StoreContext.jsx'

const links = [
  { to: '/', label: 'Home', end: true },
  { to: '/products', label: 'Furniture' },
  { to: '/enquiry', label: 'Enquiry' },
]

export default function NavBar() {
  const { cartCount, setCartOpen, site } = useStore()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()
  const reduced = useReducedMotion()
  const { scrollYProgress } = useScroll()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => setMenuOpen(false), [location.pathname])

  const pillTransition = reduced ? { duration: 0 } : { type: 'spring', bounce: 0.15, duration: 0.5 }

  return (
    <>
      <header className={`nav ${scrolled ? 'scrolled' : ''}`}>
        <div className="nav-inner">
          <Link to="/" className="brand" aria-label={`${site.shop_name || 'Ronak Furniture'} home`}>
            <span className="brand-mark" aria-hidden="true">
              R
            </span>
            <span>{site.shop_name || 'Ronak Furniture'}</span>
          </Link>

          <nav className="nav-links" aria-label="Primary">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                {({ isActive }) => (
                  <>
                    {isActive && <motion.span layoutId="nav-pill" className="nav-pill" transition={pillTransition} />}
                    {link.label}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="nav-actions">
            <button
              type="button"
              className="icon-btn"
              onClick={() => setCartOpen(true)}
              aria-label={`Your selection, ${cartCount} items`}
            >
              <ShoppingBag size={19} strokeWidth={1.8} />
              {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
            </button>
            <button
              type="button"
              className="icon-btn nav-menu-btn"
              onClick={() => setMenuOpen((v) => !v)}
              aria-expanded={menuOpen}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        <motion.div className="nav-progress" style={{ scaleX: scrollYProgress }} aria-hidden="true" />
      </header>

      <AnimatePresence>
        {menuOpen && (
          <motion.nav
            className="mobile-sheet"
            aria-label="Mobile"
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: -14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: -14 }}
            transition={{ type: 'spring', bounce: 0, duration: 0.34 }}
          >
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.span layoutId="nav-pill-mobile" className="nav-pill" transition={pillTransition} />
                    )}
                    {link.label}
                  </>
                )}
              </NavLink>
            ))}
          </motion.nav>
        )}
      </AnimatePresence>
    </>
  )
}
