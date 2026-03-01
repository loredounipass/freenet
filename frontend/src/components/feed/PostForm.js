import React, { useState, useContext, useEffect } from 'react'
import useFeedAndMultimedia from '../../hooks/useFeedAndMultimedia'
import useProfile from '../../hooks/useProfile'
import { AuthContext } from '../../hooks/AuthContext'
import { apiOrigin } from '../../api/http'
import Toast from '../toasts/Toast'

function resolveProfilePhotoUrl(url) {
  if (!url) return null
  return url.startsWith('/') ? `${apiOrigin}${url}` : url
}

export default function PostForm() {
  const { createPostWithFile, createPost, loading } = useFeedAndMultimedia()
  const { auth } = useContext(AuthContext)
  const { profile } = useProfile()
  const profilePhotoUrl = resolveProfilePhotoUrl(profile?.profilePhotoUrl)
  const [description, setDescription] = useState('')
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [toast, setToast] = useState('')
  // ensure object URL is revoked on unmount
  useCleanupPreview(previewUrl)

  const onSubmit = async (e) => {
    e.preventDefault()
    try {
      if (file) {
        await createPostWithFile({ file, description, type: file.type && file.type.startsWith('video') ? 'video' : 'image' })
      } else {
        await createPost({ description, type: 'text', authorId: auth?._id })
      }
      setDescription('')
      setFile(null)
      // revoke preview URL after successful publish
      if (previewUrl) {
        try { URL.revokeObjectURL(previewUrl) } catch (_) {}
        setPreviewUrl(null)
      }
      e.target.reset()
    } catch (err) {
      console.error(err)
      setToast('Error creando el post')
    }
  }

  // handle file input with video duration validation (max 5 minutes)
  const handleFileChange = (e) => {
    const f = e.target.files[0]
    // clear any previous toast
    if (toast) setToast('')

    // revoke previous preview
    if (previewUrl) { try { URL.revokeObjectURL(previewUrl) } catch(_) {} }

    if (!f) {
      setFile(null)
      setPreviewUrl(null)
      return
    }

    if (f.type && f.type.startsWith('video')) {
      // create a temporary URL to read metadata
      const metaUrl = URL.createObjectURL(f)
      const vid = document.createElement('video')
      vid.preload = 'metadata'
      vid.src = metaUrl
      vid.onloadedmetadata = () => {
        try { URL.revokeObjectURL(metaUrl) } catch(_) {}
        const duration = vid.duration || 0
        const maxSeconds = 5 * 60 // 5 minutes
        if (duration > maxSeconds) {
          setToast('Los videos no pueden superar 5 minutos.')
          setFile(null)
          setPreviewUrl(null)
          e.target.value = ''
        } else {
          // accepted: set file and preview
          setFile(f)
          try { const url = URL.createObjectURL(f); setPreviewUrl(url) } catch(_) { setPreviewUrl(null) }
        }
      }
      vid.onerror = () => {
        try { URL.revokeObjectURL(metaUrl) } catch(_) {}
        setToast('No se pudo leer el archivo de video.')
        setFile(null)
        setPreviewUrl(null)
        e.target.value = ''
      }
    } else {
      // image or other file types
      setFile(f)
      try { const url = URL.createObjectURL(f); setPreviewUrl(url) } catch(_) { setPreviewUrl(null) }
    }
  }

  const handleDiscard = (e) => {
    e.preventDefault()
    setDescription('')
    setFile(null)
    if (previewUrl) {
      try { URL.revokeObjectURL(previewUrl) } catch (_) {}
      setPreviewUrl(null)
    }
    const input = document.getElementById('post-file-input')
    if (input) input.value = ''
  }

  const displayName = auth
    ? `${auth.firstName || ''} ${auth.lastName || ''}`.trim() || auth.username || 'Tú'
    : 'Tú'

  return (
    <form onSubmit={onSubmit} className="fb-post-form">
      {/* Top: avatar + textarea */}
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
        {/* Avatar */}
        <div
          style={{
            width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
            background: profilePhotoUrl ? 'transparent' : 'linear-gradient(135deg,#22c1c3,#1e90ff)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: '1rem', color: '#04111a',
            overflow: 'hidden',
          }}
        >
          {profilePhotoUrl ? (
            <img src={profilePhotoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            displayName ? displayName[0].toUpperCase() : '?'
          )}
        </div>
        <textarea
          className="fb-post-textarea"
          placeholder={`¿Qué estás pensando, ${displayName.split(' ')[0]}?`}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
      </div>

      {/* Bottom: file picker + button */}
      <div className="fb-post-footer" style={{ flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: '1 1 100%', minWidth: 0 }}>
          <input
            id="post-file-input"
            className="fb-file-input"
            type="file"
            accept="image/*,video/*"
            onChange={(e) => handleFileChange(e)}
          />
          {file && (
            <span className="fb-file-name" title={file.name}>
              {file.name}
            </span>
          )}
        </div>

        {/* Preview area for selected file */}
        {previewUrl && (
          <div className="fb-media">
            {file && file.type && file.type.startsWith('video') ? (
              <video
                controls
                style={{ width: '100%', maxHeight: '480px', display: 'block', objectFit: 'contain' }}
                src={previewUrl}
              >
                Tu navegador no soporta la etiqueta de video.
              </video>
            ) : (
              <img
                src={previewUrl}
                alt={file ? file.name : 'preview'}
                style={{ width: '100%', maxHeight: '480px', display: 'block', objectFit: 'contain' }}
              />
            )}
          </div>
        )}
        <div style={{ flex: '1 1 100%', display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem', alignItems: 'center', gap: '0.5rem' }}>
          <label className="fb-file-label" htmlFor="post-file-input" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', padding: '0.12rem 0.3rem', borderRadius: 6 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
              <span>Foto</span>
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', padding: '0.12rem 0.3rem', borderRadius: 6 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M5 3v18l15-9z" />
              </svg>
              <span>Video</span>
            </span>
          </label>
          <button
            className="fb-btn-primary"
            type="submit"
            disabled={loading || (!file && description.trim().length === 0)}
          >
            {loading ? 'Publicando…' : 'Publicar'}
          </button>
          {(file || description.trim().length > 0) && (
            <button
              type="button"
              className="btn-secondary"
              onClick={handleDiscard}
              disabled={loading}
            >
              Descartar
            </button>
          )}
        </div>
      </div>
      <Toast message={toast} onDismiss={() => setToast('')} />
    </form>
  )
}

// cleanup preview URL on unmount
function useCleanupPreview(url) {
  useEffect(() => {
    return () => {
      if (url) {
        try { URL.revokeObjectURL(url) } catch (_) {}
      }
    }
  }, [url])
}
