import { Boxes, ExternalLink, LayoutDashboard, LogOut, Menu, Package, ClipboardList, Settings, X } from 'lucide-react'
import { useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useStore } from '../../context/StoreContext.jsx'

const nav = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/orders', label: 'Orders', icon: ClipboardList },
  { to: '/admin/products', label: 'Products & prices', icon: Package },
  { to: '/admin/inventory', label: 'Inventory', icon: Boxes },
  { to: '/admin/settings', label: 'Website & account', icon: Settings },
]

const titles = {
  '/admin': 'Dashboard',
  '/admin/orders': 'Orders',
  '/admin/products': 'Products & prices',
  '/admin/inventory': 'Inventory',
  '/admin/settings': 'Website & account',
}

export default function AdminLayout() {
  const { user, logout } = useStore()
  const location = useLocation()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const signOut = () => {
    logout()
    navigate('/admin/login', { replace: true })
  }

  return (
    <div className="admin-shell">
      <aside className={`admin-side ${open ? 'open' : ''}`}>
        <div className="admin-brand">
          <Link to="/" className="brand" onClick={() => setOpen(false)}>
            <span className="brand-mark" aria-hidden="true">
              R
            </span>
            <span>Admin</span>
          </Link>
          <button
            type="button"
            className="icon-btn admin-menu-btn"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
          >
            <X size={19} />
          </button>
        </div>

        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={() => setOpen(false)}
            className={({ isActive }) => `side-link ${isActive ? 'active' : ''}`}
          >
            <item.icon size={17} strokeWidth={1.8} />
            {item.label}
          </NavLink>
        ))}

        <div style={{ marginTop: 'auto', paddingTop: 18, display: 'grid', gap: 6 }}>
          <Link to="/" className="side-link">
            <ExternalLink size={17} strokeWidth={1.8} /> View shop
          </Link>
          <button type="button" className="side-link" onClick={signOut} style={{ background: 'none', border: 0, cursor: 'pointer', width: '100%' }}>
            <LogOut size={17} strokeWidth={1.8} /> Sign out
          </button>
        </div>
      </aside>

      {open && (
        <div
          className="scrim"
          style={{ zIndex: 90 }}
          onClick={() => setOpen(false)}
          role="presentation"
        />
      )}

      <div className="admin-main">
        <header className="admin-topbar">
          <div className="row" style={{ gap: 10 }}>
            <button
              type="button"
              className="icon-btn admin-menu-btn"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
            <div className="stack" style={{ gap: 1 }}>
              <strong style={{ fontSize: 16.5, letterSpacing: '-0.02em' }}>
                {titles[location.pathname] || 'Admin'}
              </strong>
              <span className="tiny muted">Signed in as {user?.name || user?.username}</span>
            </div>
          </div>

          <div className="row" style={{ gap: 8 }}>
            <Link to="/" className="btn btn-sm">
              View shop
            </Link>
            <button type="button" className="btn btn-sm" onClick={signOut}>
              Sign out
            </button>
          </div>
        </header>

        <div className="admin-content">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
