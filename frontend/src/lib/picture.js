/**
 * Local WebP helpers.
 *
 * Images live in `public/img/<photo-id>-<width>.webp` (20/480/800/1200/1800),
 * so the browser downloads only the size it can actually use, from our own
 * origin — no CDN round-trip, no DNS/TLS handshake.
 *
 * Any URL that doesn't match that pattern (an admin pasting an external image)
 * falls back to a plain `src`.
 */
const LOCAL = /^\/img\/(.+)-(\d+)\.webp$/

export function picture(src, { sizes = '100vw', width = 800, widths = [480, 800, 1200, 1800] } = {}) {
  if (!src) return { src: '' }
  const match = LOCAL.exec(src)
  if (!match) return { src }
  const base = match[1]
  return {
    src: `/img/${base}-${width}.webp`,
    srcSet: widths.map((w) => `/img/${base}-${w}.webp ${w}w`).join(', '),
    sizes,
  }
}

/** Tiny (20px) placeholder shown as a soft blur while the real image decodes. */
export function placeholder(src) {
  const match = LOCAL.exec(src || '')
  return match ? `url(/img/${match[1]}-20.webp)` : undefined
}

/** Fixed-size variant for thumbnails (cart lines, order items, admin tables). */
export function thumb(src, width = 480) {
  if (!src) return ''
  const match = LOCAL.exec(src)
  return match ? `/img/${match[1]}-${width}.webp` : src
}
