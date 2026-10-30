import { AlertTriangle, Clock, IndianRupee, Package, PackageCheck, ShoppingBag } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Reveal from '../../components/Reveal.jsx'
import StatusPill from '../../components/StatusPill.jsx'
import { adminApi } from '../../lib/api.js'
import { money, shortDate } from '../../lib/format.js'

const stats = (data) => [
  { label: 'Awaiting confirmation', value: data.pending_orders, icon: Clock, tone: 'var(--warn)' },
  { label: 'Orders in progress', value: data.active_orders, icon: ShoppingBag, tone: 'var(--info)' },
  { label: 'Delivered', value: data.delivered_orders, icon: PackageCheck, tone: 'var(--accent)' },
  { label: 'Revenue this month', value: money(data.revenue), icon: IndianRupee, tone: 'var(--accent)', isMoney: true },
  { label: 'Active products', value: data.total_products, icon: Package, tone: 'var(--text-secondary)' },
  { label: 'Low stock alerts', value: data.low_stock_products, icon: AlertTriangle, tone: 'var(--danger)' },
]

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    adminApi
      .stats()
      .then(setData)
      .catch((e) => setError(e.message))
  }, [])

  if (error) return <div className="form-error">{error}</div>
  if (!data) {
    return (
      <div className="page-loading">
        <div className="spinner" />
      </div>
    )
  }

  return (
    <div className="stack" style={{ gap: 24 }}>
      <div className="stat-grid">
        {stats(data).map((stat, i) => (
          <Reveal key={stat.label} delay={i * 0.04}>
            <div className="stat">
              <div className="row-between">
                <span className="stat-label">{stat.label}</span>
                <stat.icon size={16} color={stat.tone} strokeWidth={1.9} />
              </div>
              <span className="stat-value" style={{ color: stat.isMoney ? 'var(--accent)' : undefined }}>
                {stat.value}
              </span>
            </div>
          </Reveal>
        ))}
      </div>

      <div className="panel">
        <div className="panel-head">
          <strong>Latest orders</strong>
          <Link to="/admin/orders" className="link-btn">
            All orders →
          </Link>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Placed</th>
              </tr>
            </thead>
            <tbody>
              {data.recent_orders.map((order) => (
                <tr key={order.order_number}>
                  <td>
                    <Link to={`/admin/orders?order=${order.order_number}`} className="link-btn">
                      {order.order_number}
                    </Link>
                  </td>
                  <td>
                    <div style={{ fontWeight: 550 }}>{order.customer_name}</div>
                    <div className="tiny muted">{order.phone}</div>
                  </td>
                  <td>{order.items.reduce((sum, item) => sum + item.quantity, 0)}</td>
                  <td style={{ fontWeight: 600 }}>{money(order.total)}</td>
                  <td>
                    <StatusPill status={order.status} label={order.status_label} />
                  </td>
                  <td className="muted">{shortDate(order.created_at)}</td>
                </tr>
              ))}
              {data.recent_orders.length === 0 && (
                <tr>
                  <td colSpan={6} className="muted center" style={{ padding: 30 }}>
                    No orders yet — they will appear here as customers enquire.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
