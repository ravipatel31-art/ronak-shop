const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

export const money = (value) => inr.format(Number(value) || 0)

export const formatDate = (value, opts = {}) =>
  new Date(value).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    ...opts,
  })

export const shortDate = (value) =>
  new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })

export const ORDER_STATUSES = [
  'pending',
  'confirmed',
  'in_production',
  'ready',
  'out_for_delivery',
  'delivered',
  'cancelled',
]

export const STATUS_META = {
  pending: { label: 'Order received', hint: 'We have your request and will call you shortly.' },
  confirmed: { label: 'Confirmed', hint: 'Price, size and delivery date agreed with you.' },
  in_production: { label: 'In production', hint: 'Your piece is on the workshop floor.' },
  ready: { label: 'Ready for dispatch', hint: 'Packed and quality-checked at our workshop.' },
  out_for_delivery: { label: 'Out for delivery', hint: 'Our team is on the way to you.' },
  delivered: { label: 'Delivered', hint: 'Installed and handed over. Enjoy!' },
  cancelled: { label: 'Cancelled', hint: 'This order was cancelled and stock released.' },
}
