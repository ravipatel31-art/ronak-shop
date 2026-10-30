import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <main className="page">
      <div className="container">
        <div className="empty" style={{ paddingTop: 90 }}>
          <span className="eyebrow">404</span>
          <h1 className="h2">This page isn’t in the showroom</h1>
          <p>The link may be old, or the piece has been archived.</p>
          <div className="row" style={{ gap: 10 }}>
            <Link to="/" className="btn btn-primary">
              Back home
            </Link>
            <Link to="/products" className="btn">
              Browse furniture
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
