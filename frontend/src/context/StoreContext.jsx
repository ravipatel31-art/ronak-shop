import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { adminApi, getToken, publicApi, setToken } from '../lib/api.js'

const StoreContext = createContext(null)
const CART_KEY = 'ronak_cart'

const readCart = () => {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || []
  } catch {
    return []
  }
}

export function StoreProvider({ children }) {
  const [site, setSite] = useState({})
  const [siteReady, setSiteReady] = useState(false)
  const [cart, setCart] = useState(readCart)
  const [cartOpen, setCartOpen] = useState(false)
  const [user, setUser] = useState(null)
  const [authReady, setAuthReady] = useState(false)

  useEffect(() => {
    publicApi
      .site()
      .then(setSite)
      .catch(() => setSite({}))
      .finally(() => setSiteReady(true))
  }, [])

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(cart))
  }, [cart])

  // restore admin session on load
  useEffect(() => {
    if (!getToken()) {
      setAuthReady(true)
      return
    }
    adminApi
      .me()
      .then(setUser)
      .catch(() => setToken(null))
      .finally(() => setAuthReady(true))
  }, [])

  const refreshSite = useCallback(async () => {
    const next = await publicApi.site()
    setSite(next)
    return next
  }, [])

  const login = useCallback(async (username, password) => {
    const data = await adminApi.login({ username, password })
    setToken(data.access_token)
    setUser(data.user)
    return data.user
  }, [])

  const logout = useCallback(() => {
    setToken(null)
    setUser(null)
  }, [])

  const addToCart = useCallback((product, quantity = 1) => {
    setCart((current) => {
      const found = current.find((line) => line.productId === product.id)
      const max = Math.max(1, product.stock || 1)
      if (found) {
        return current.map((line) =>
          line.productId === product.id
            ? { ...line, quantity: Math.min(max, line.quantity + quantity) }
            : line,
        )
      }
      return [
        ...current,
        {
          productId: product.id,
          name: product.name,
          slug: product.slug,
          price: product.price,
          image: product.image_url,
          stock: product.stock,
          quantity: Math.min(Math.max(1, product.stock || 1), quantity),
        },
      ]
    })
  }, [])

  const setQuantity = useCallback((productId, quantity) => {
    setCart((current) =>
      quantity <= 0
        ? current.filter((line) => line.productId !== productId)
        : current.map((line) =>
            line.productId === productId
              ? { ...line, quantity: Math.min(line.stock || 99, quantity) }
              : line,
          ),
    )
  }, [])

  const removeFromCart = useCallback((productId) => {
    setCart((current) => current.filter((line) => line.productId !== productId))
  }, [])

  const clearCart = useCallback(() => setCart([]), [])

  const cartCount = useMemo(() => cart.reduce((sum, line) => sum + line.quantity, 0), [cart])
  const cartTotal = useMemo(
    () => cart.reduce((sum, line) => sum + line.price * line.quantity, 0),
    [cart],
  )

  const value = useMemo(
    () => ({
      site,
      siteReady,
      refreshSite,
      cart,
      cartCount,
      cartTotal,
      addToCart,
      setQuantity,
      removeFromCart,
      clearCart,
      cartOpen,
      setCartOpen,
      user,
      authReady,
      login,
      logout,
    }),
    [
      site,
      siteReady,
      refreshSite,
      cart,
      cartCount,
      cartTotal,
      addToCart,
      setQuantity,
      removeFromCart,
      clearCart,
      cartOpen,
      user,
      authReady,
      login,
      logout,
    ],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used inside StoreProvider')
  return ctx
}
