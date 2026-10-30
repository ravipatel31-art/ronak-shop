import { API_BASE_URL } from './config.js';

const TOKEN_KEY = 'ronak_admin_token'

export const getToken = () => localStorage.getItem(TOKEN_KEY)
export const setToken = (token) =>
  token ? localStorage.setItem(TOKEN_KEY, token) : localStorage.removeItem(TOKEN_KEY)

export class ApiError extends Error {
  constructor(message, status, payload) {
    super(message)
    this.status = status
    this.payload = payload
  }
}

function buildUrl(path) {
  return `${API_BASE_URL}${path}`;
}

export async function api(path, { method = 'GET', body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  const auth = token ?? getToken()
  if (auth) headers.Authorization = `Bearer ${auth}`

  const res = await fetch(buildUrl(path), {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  let data = null
  const text = await res.text()
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = { detail: text }
    }
  }

  if (!res.ok) {
    const message =
      (data && (data.detail?.[0]?.msg || data.detail || data.message)) ||
      `Request failed (${res.status})`
    throw new ApiError(typeof message === 'string' ? message : 'Request failed', res.status, data)
  }
  return data
}

/** Multipart upload (browser sets the multipart boundary itself). */
export async function uploadImage(path, file) {
  const form = new FormData()
  form.append('file', file)
  const headers = {}
  const auth = getToken()
  if (auth) headers.Authorization = `Bearer ${auth}`

  const res = await fetch(buildUrl(path), { method: 'POST', headers, body: form })

  let data = null
  const text = await res.text()
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = { detail: text }
    }
  }
  if (!res.ok) {
    const message = (data && (data.detail?.[0]?.msg || data.detail)) || `Upload failed (${res.status})`
    throw new ApiError(typeof message === 'string' ? message : 'Upload failed', res.status, data)
  }
  return data
}

export const publicApi = {
  categories: () => api('/api/categories'),
  products: (params = {}) => api(`/api/products?${new URLSearchParams(params)}`),
  product: (slug) => api(`/api/products/${encodeURIComponent(slug)}`),
  site: () => api('/api/site'),
  createOrder: (body) => api('/api/orders', { method: 'POST', body }),
  createEnquiry: (body) => api('/api/enquiries', { method: 'POST', body }),
}

export const adminApi = {
  login: (body) => api('/api/auth/login', { method: 'POST', body }),
  me: () => api('/api/auth/me'),
  changePassword: (body) => api('/api/auth/change-password', { method: 'POST', body }),
  stats: () => api('/api/admin/stats'),
  orders: (params = {}) => api(`/api/admin/orders?${new URLSearchParams(params)}`),
  order: (number) => api(`/api/admin/orders/${encodeURIComponent(number)}`),
  setOrderStatus: (number, body) =>
    api(`/api/admin/orders/${encodeURIComponent(number)}/status`, { method: 'PATCH', body }),
  products: () => api('/api/admin/products'),
  saveProduct: (body, id) =>
    id
      ? api(`/api/admin/products/${id}`, { method: 'PATCH', body })
      : api('/api/admin/products', { method: 'POST', body }),
  deleteProduct: (id) => api(`/api/admin/products/${id}`, { method: 'DELETE' }),
  categories: () => api('/api/admin/categories'),
  saveCategory: (body, id) =>
    id
      ? api(`/api/admin/categories/${id}`, { method: 'PATCH', body })
      : api('/api/admin/categories', { method: 'POST', body }),
  deleteCategory: (id) => api(`/api/admin/categories/${id}`, { method: 'DELETE' }),
  inventory: () => api('/api/admin/inventory'),
  adjustStock: (id, body) => api(`/api/admin/inventory/${id}/adjust`, { method: 'POST', body }),
  movements: () => api('/api/admin/stock-movements'),
  upload: (file) => uploadImage('/api/admin/upload', file),
  site: () => api('/api/admin/site'),
  saveSite: (settings) => api('/api/admin/site', { method: 'PUT', body: { settings } }),
}
