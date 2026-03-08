import React, { useState, useContext, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import useFeedAndMultimedia from '../../hooks/useFeedAndMultimedia'
import { AuthContext } from '../../hooks/AuthContext'
import Toast from '../toasts/Toast'
import UserAvatar from '../common/UserAvatar'

export default function PostForm() {
  const navigate  = useNavigate()
  const { createPostWithFile, createPost, loading } = useFeedAndMultimedia()
  const { auth }  = useContext(AuthContext)
  const [description, setDescription] = useState('')
  const [file, setFile]               = useState(null)
  const [previewUrl, setPreviewUrl]   = useState(null)
  const [toast, setToast]             = useState('')
  const [expanded, setExpanded]       = useState(false)
  const textareaRef = useRef(null)
  useCleanupPreview(previewUrl)

  /* ── submit ── */
  const onSubmit = async (e) => {
    e.preventDefault()
    try {
      if (file) {
        await createPostWithFile({ file, description, type: file.type?.startsWith('video') ? 'video' : 'image' })
      } else {
        await createPost({ description, type: 'text', authorId: auth?._id })
      }
      setDescription('')
      setFile(null)
      setExpanded(false)
      if (previewUrl) { try { URL.revokeObjectURL(previewUrl) } catch (_) {}; setPreviewUrl(null) }
      if (e.target?.reset) e.target.reset()
    } catch (err) {
      console.error(err)
      setToast('Error creando el post')
    }
  }

  /* ── file handler ── */
  const handleFileChange = (e) => {
    const f = e.target.files[0]
    if (toast) setToast('')
    if (previewUrl) { try { URL.revokeObjectURL(previewUrl) } catch (_) {} }
    if (!f) { setFile(null); setPreviewUrl(null); return }

    if (f.type?.startsWith('video')) {
      const metaUrl = URL.createObjectURL(f)
      const vid = document.createElement('video')
      vid.preload = 'metadata'
      vid.src = metaUrl
      vid.onloadedmetadata = () => {
        try { URL.revokeObjectURL(metaUrl) } catch (_) {}
        if ((vid.duration || 0) > 300) {
          setToast('Los videos no pueden superar 5 minutos.')
          setFile(null); setPreviewUrl(null); e.target.value = ''
        } else {
          setFile(f)
          try { setPreviewUrl(URL.createObjectURL(f)) } catch (_) { setPreviewUrl(null) }
        }
      }
      vid.onerror = () => {
        try { URL.revokeObjectURL(metaUrl) } catch (_) {}
        setToast('No se pudo leer el archivo de video.')
        setFile(null); setPreviewUrl(null); e.target.value = ''
      }
    } else {
      setFile(f)
      try { setPreviewUrl(URL.createObjectURL(f)) } catch (_) { setPreviewUrl(null) }
    }
    setExpanded(true)
  }

  const handleDiscard = (e) => {
    e.preventDefault()
    setDescription('')
    setFile(null)
    setExpanded(false)
    if (previewUrl) { try { URL.revokeObjectURL(previewUrl) } catch (_) {}; setPreviewUrl(null) }
    const input = document.getElementById('post-file-input')
    if (input) input.value = ''
  }

  const displayName   = auth ? `${auth.firstName || ''}`.trim() || auth.username || 'Tú' : 'Tú'
  const firstName     = displayName.split(' ')[0]
  const hasContent    = file || description.trim().length > 0

  return (
    <form onSubmit={onSubmit} className="fb-post-form">

      {/* ── Single bar row ── */}
      <div className="fb-post-bar">
        {/* Avatar */}
        <UserAvatar
          user={auth}
          size={36}
          onClick={() => navigate('/profile')}
          title="Ir a mi perfil"
        />

        {/* Text input — expands on focus */}
        <input
          ref={textareaRef}
          className="fb-post-input"
          placeholder={`¿Qué estás pensando, ${firstName}?`}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onFocus={() => setExpanded(true)}
        />

        {/* Right-side actions */}
        <div className="fb-post-actions">
          {/* Photo icon */}
          <label
            className="fb-post-icon-btn"
            htmlFor="post-file-input"
            title="Foto / Video"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
          </label>

          {/* Video icon */}
          <label
            className="fb-post-icon-btn"
            htmlFor="post-file-input"
            title="Video"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="23 7 16 12 23 17 23 7"/>
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
            </svg>
          </label>

          {/* Hidden file input */}
          <input
            id="post-file-input"
            className="fb-file-input"
            type="file"
            accept="image/*,video/*"
            onChange={handleFileChange}
          />

          {/* Publish button */}
          <button
            className="fb-btn-primary"
            type="submit"
            disabled={loading || !hasContent}
          >
            {loading ? '…' : 'Publicar'}
          </button>
        </div>
      </div>

      {/* ── Expanded area: preview + discard ── */}
      {(expanded && (previewUrl || file)) && (
        <div className="fb-post-expanded">
          {/* File name */}
          {file && (
            <span className="fb-file-name" title={file.name}>{file.name}</span>
          )}

          {/* Media preview */}
          {previewUrl && (
            <div className="fb-media">
              {file?.type?.startsWith('video') ? (
                <video controls src={previewUrl} style={{ width: '100%', maxHeight: '360px', objectFit: 'contain', display: 'block', borderRadius: 10 }} />
              ) : (
                <img src={previewUrl} alt={file?.name || 'preview'} style={{ width: '100%', maxHeight: '360px', objectFit: 'contain', display: 'block', borderRadius: 10 }} />
              )}
            </div>
          )}

          {/* Discard */}
          <button type="button" className="btn-secondary" onClick={handleDiscard} disabled={loading}>
            Descartar
          </button>
        </div>
      )}

      <Toast message={toast} onDismiss={() => setToast('')} />
    </form>
  )
}

function useCleanupPreview(url) {
  useEffect(() => {
    return () => { if (url) { try { URL.revokeObjectURL(url) } catch (_) {} } }
  }, [url])
}
