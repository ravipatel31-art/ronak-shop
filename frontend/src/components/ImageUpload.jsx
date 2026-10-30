import { ImagePlus, Loader2 } from 'lucide-react'
import { useRef, useState } from 'react'
import { adminApi } from '../lib/api.js'
import { showToast } from './ToastHost.jsx'

/**
 * "Upload image" button backed by POST /api/admin/upload.
 * The server resizes the photo into responsive WebP and returns its path,
 * which is handed to `onUploaded` (usually to fill a form field).
 */
export default function ImageUpload({ label = 'Upload image', onUploaded, disabled = false }) {
  const inputRef = useRef(null)
  const [busy, setBusy] = useState(false)

  const onFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = '' // allow picking the same file again
    if (!file) return
    setBusy(true)
    try {
      const { url } = await adminApi.upload(file)
      onUploaded(url)
      showToast('Image uploaded')
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        hidden
        onChange={onFile}
      />
      <button
        type="button"
        className="btn btn-sm"
        onClick={() => inputRef.current?.click()}
        disabled={busy || disabled}
      >
        {busy ? (
          <>
            <Loader2 size={15} className="spin" /> Uploading…
          </>
        ) : (
          <>
            <ImagePlus size={15} /> {label}
          </>
        )}
      </button>
    </>
  )
}
