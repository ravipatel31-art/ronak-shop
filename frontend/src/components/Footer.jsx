import { Clock, Mail, MapPin, Phone } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useStore } from '../context/StoreContext.jsx'

export default function Footer() {
  const { site } = useStore()

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <div className="brand" style={{ marginBottom: 12 }}>
              <span className="brand-mark" aria-hidden="true">
                R
              </span>
              <span>{site.shop_name || 'Ronak Furniture'}</span>
            </div>
            <p className="small muted" style={{ maxWidth: '32ch' }}>
              {site.tagline}
            </p>
          </div>

          <div>
            <h4>Shop</h4>
            <div className="footer-list">
              <Link to="/products">All furniture</Link>
              <Link to="/products?category=sofas">Sofas</Link>
              <Link to="/products?category=beds">Beds</Link>
              <Link to="/products?category=wardrobes">Wardrobes</Link>
            </div>
          </div>

          <div>
            <h4>Orders</h4>
            <div className="footer-list">
              <a href={`tel:${(site.phone || '').replace(/\s/g, '')}`}>Call to order</a>
              <Link to="/enquiry">Send an enquiry</Link>
              <span>{site.delivery_note}</span>
            </div>
          </div>

          <div>
            <h4>Visit us</h4>
            <div className="footer-list">
              <span className="row" style={{ alignItems: 'flex-start' }}>
                <MapPin size={15} style={{ marginTop: 3, flex: 'none' }} /> {site.address}
              </span>
              <a className="row" href={`tel:${(site.phone || '').replace(/\s/g, '')}`}>
                <Phone size={15} style={{ flex: 'none' }} /> {site.phone}
              </a>
              <a className="row" href={`mailto:${site.email}`}>
                <Mail size={15} style={{ flex: 'none' }} /> {site.email}
              </a>
              <span className="row">
                <Clock size={15} style={{ flex: 'none' }} /> {site.hours}
              </span>
            </div>
          </div>
        </div>

        <div className="footer-base">
          <span>{site.footer_text}</span>
          <span>Handcrafted · Made to order · Installed by our own team</span>
        </div>
      </div>
    </footer>
  )
}
