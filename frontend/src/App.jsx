import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import CartDrawer from './components/CartDrawer.jsx'
import Footer from './components/Footer.jsx'
import NavBar from './components/NavBar.jsx'
import ToastHost from './components/ToastHost.jsx'
import { useStore } from './context/StoreContext.jsx'
import AdminLayout from './pages/admin/AdminLayout.jsx'
import AdminLogin from './pages/admin/AdminLogin.jsx'
import Dashboard from './pages/admin/Dashboard.jsx'
import InventoryPage from './pages/admin/InventoryPage.jsx'
import OrdersPage from './pages/admin/OrdersPage.jsx'
import ProductsPage from './pages/admin/ProductsPage.jsx'
import SettingsPage from './pages/admin/SettingsPage.jsx'
import Checkout from './pages/Checkout.jsx'
import Home from './pages/Home.jsx'
import NotFound from './pages/NotFound.jsx'
import ProductDetail from './pages/ProductDetail.jsx'
import Products from './pages/Products.jsx'
import Enquiry from './pages/Enquiry.jsx'

function Protected({ children }) {
  const { user, authReady } = useStore()
  if (!authReady) return <div className="page-loading" role="status" aria-label="Loading" />
  if (!user) return <Navigate to="/admin/login" replace />
  return children
}

/** Quick fade + rise between public pages (admin stays instant). */
function Page({ children }) {
  const reduced = useReducedMotion()
  return (
    <motion.div
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduced ? { opacity: 0 } : { opacity: 0, y: -6 }}
      transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
    >
      {children}
    </motion.div>
  )
}

export default function App() {
  const location = useLocation()
  const { cartOpen } = useStore()
  const isAdmin = location.pathname.startsWith('/admin')

  return (
    <>
      {!isAdmin && <NavBar />}
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Page><Home /></Page>} />
          <Route path="/products" element={<Page><Products /></Page>} />
          <Route path="/products/:slug" element={<Page><ProductDetail /></Page>} />
          <Route path="/checkout" element={<Page><Checkout /></Page>} />
          <Route path="/enquiry" element={<Enquiry />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin"
            element={
              <Protected>
                <AdminLayout />
              </Protected>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="inventory" element={<InventoryPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<Page><NotFound /></Page>} />
        </Routes>
      </AnimatePresence>
      {!isAdmin && <Footer />}
      <AnimatePresence>{cartOpen && <CartDrawer key="cart" />}</AnimatePresence>
      <ToastHost />
    </>
  )
}
