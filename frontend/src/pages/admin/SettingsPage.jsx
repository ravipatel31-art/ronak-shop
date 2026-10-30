import { Check, Eye, Lock, Save } from 'lucide-react'
import { motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { showToast } from '../../components/ToastHost.jsx'
import ImageUpload from '../../components/ImageUpload.jsx'
import { useStore } from '../../context/StoreContext.jsx'
import { adminApi } from '../../lib/api.js'
import { thumb } from '../../lib/picture.js'

const groups = [
  {
    title: 'Shop identity',
    hint: 'Shown in the header, footer and contact blocks.',
    fields: [
      { key: 'shop_name', label: 'Shop name' },
      { key: 'tagline', label: 'Tagline' },
      { key: 'phone', label: 'Phone' },
      { key: 'email', label: 'Email' },
      { key: 'address', label: 'Address' },
      { key: 'hours', label: 'Working hours' },
    ],
  },
  {
    title: 'Home page hero',
    hint: 'The first thing a visitor sees.',
    fields: [
      { key: 'hero_title', label: 'Headline', wide: true },
      { key: 'hero_subtitle', label: 'Sub-headline', wide: true, textarea: true },
      { key: 'hero_image', label: 'Hero image', wide: true, upload: true },
      { key: 'delivery_note', label: 'Delivery note', wide: true },
    ],
  },
  {
    title: 'About section',
    hint: 'Your workshop story on the home page.',
    fields: [
      { key: 'about_title', label: 'Section title', wide: true },
      { key: 'about_body', label: 'Body copy', wide: true, textarea: true },
      { key: 'showroom_note', label: 'Showroom note', wide: true },
    ],
  },
  {
    title: 'Footer',
    hint: 'Bottom of every page.',
    fields: [
      { key: 'footer_text', label: 'Copyright line', wide: true },
      { key: 'whatsapp', label: 'WhatsApp link', wide: true },
      { key: 'instagram', label: 'Instagram link', wide: true },
    ],
  },
]

export default function SettingsPage() {
  const { refreshSite } = useStore()
  const [settings, setSettings] = useState(null)
  const [busy, setBusy] = useState(false)
  const [pw, setPw] = useState({ current_password: '', new_password: '' })
  const [pwBusy, setPwBusy] = useState(false)

  useEffect(() => {
    adminApi
      .site()
      .then((data) => setSettings(data.settings))
      .catch((e) => showToast(e.message, 'error'))
  }, [])

  const save = async (e) => {
    e.preventDefault()
    setBusy(true)
    try {
      const data = await adminApi.saveSite(settings)
      setSettings(data.settings)
      await refreshSite()
      showToast('Website content updated')
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  const changePassword = async (e) => {
    e.preventDefault()
    setPwBusy(true)
    try {
      await adminApi.changePassword(pw)
      setPw({ current_password: '', new_password: '' })
      showToast('Password changed')
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setPwBusy(false)
    }
  }

  if (!settings) {
    return (
      <div className="page-loading">
        <div className="spinner" />
      </div>
    )
  }

  return (
    <div className="stack" style={{ gap: 22 }}>
      <div className="row wrap" style={{ gap: 10 }}>
        <Link to="/" className="btn btn-sm">
          <Eye size={15} /> Preview shop
        </Link>
        <span className="small muted">Changes appear on the public site as soon as you save.</span>
      </div>

      <form className="stack" style={{ gap: 18 }} onSubmit={save}>
        {groups.map((group) => (
          <section className="panel" key={group.title}>
            <div className="panel-head">
              <div className="stack" style={{ gap: 2 }}>
                <strong>{group.title}</strong>
                <span className="tiny muted">{group.hint}</span>
              </div>
            </div>
            <div className="panel-body">
              <div className="form-grid">
                {group.fields.map((field) => (
                  <div className="field" key={field.key} style={field.wide ? { gridColumn: '1 / -1' } : undefined}>
                    <label htmlFor={field.key}>{field.label}</label>
                    {field.upload ? (
                      <>
                        <div className="row" style={{ gap: 8 }}>
                          <input
                            id={field.key}
                            className="input"
                            value={settings[field.key] || ''}
                            placeholder="Upload a photo, or paste an image URL"
                            onChange={(e) => setSettings((s) => ({ ...s, [field.key]: e.target.value }))}
                          />
                          <ImageUpload onUploaded={(url) => setSettings((s) => ({ ...s, [field.key]: url }))} />
                        </div>
                        {settings[field.key] && (
                          <img
                            className="thumb"
                            style={{ width: '100%', height: 170, borderRadius: 12, marginTop: 6 }}
                            src={thumb(settings[field.key], 480)}
                            alt="Preview"
                          />
                        )}
                      </>
                    ) : field.textarea ? (
                      <textarea
                        id={field.key}
                        className="textarea"
                        value={settings[field.key] || ''}
                        onChange={(e) => setSettings((s) => ({ ...s, [field.key]: e.target.value }))}
                      />
                    ) : (
                      <input
                        id={field.key}
                        className="input"
                        value={settings[field.key] || ''}
                        onChange={(e) => setSettings((s) => ({ ...s, [field.key]: e.target.value }))}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        ))}

        <motion.div className="row" style={{ gap: 12 }} layout>
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? 'Saving…' : <><Save size={16} /> Save website content</>}
          </button>
          {!busy && (
            <span className="small muted row" style={{ gap: 6 }}>
              <Check size={15} color="var(--accent)" /> Live for every visitor
            </span>
          )}
        </motion.div>
      </form>

      <section className="panel">
        <div className="panel-head">
          <div className="stack" style={{ gap: 2 }}>
            <strong>Account security</strong>
            <span className="tiny muted">Change the admin password for this device.</span>
          </div>
          <Lock size={16} color="var(--text-tertiary)" />
        </div>
        <form className="panel-body stack" style={{ gap: 14, maxWidth: 460 }} onSubmit={changePassword}>
          <div className="field">
            <label htmlFor="current_password">Current password</label>
            <input
              id="current_password"
              type="password"
              className="input"
              autoComplete="current-password"
              value={pw.current_password}
              onChange={(e) => setPw((p) => ({ ...p, current_password: e.target.value }))}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="new_password">New password (min 6 characters)</label>
            <input
              id="new_password"
              type="password"
              className="input"
              autoComplete="new-password"
              minLength={6}
              value={pw.new_password}
              onChange={(e) => setPw((p) => ({ ...p, new_password: e.target.value }))}
              required
            />
          </div>
          <div>
            <button type="submit" className="btn btn-sm btn-primary" disabled={pwBusy}>
              {pwBusy ? 'Updating…' : 'Update password'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
