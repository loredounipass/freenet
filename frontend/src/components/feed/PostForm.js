import React, { useState, useContext } from 'react'
import useFeedAndMultimedia from '../../hooks/useFeedAndMultimedia'
import { AuthContext } from '../../hooks/AuthContext'

export default function PostForm() {
  const { createPostWithFile, createPost, loading } = useFeedAndMultimedia()
  const { auth } = useContext(AuthContext)
  const [description, setDescription] = useState('')
  const [file, setFile] = useState(null)

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
      e.target.reset()
    } catch (err) {
      console.error(err)
      alert('Error creando el post')
    }
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
            background: 'linear-gradient(135deg,#22c1c3,#1e90ff)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: '1rem', color: '#04111a'
          }}
        >
          {displayName ? displayName[0].toUpperCase() : '?'}
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
      <div className="fb-post-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: 0 }}>
          <label className="fb-file-label" htmlFor="post-file-input">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
            Foto / Video
          </label>
          <input
            id="post-file-input"
            className="fb-file-input"
            type="file"
            accept="image/*,video/*"
            onChange={(e) => setFile(e.target.files[0])}
          />
          {file && (
            <span className="fb-file-name" title={file.name}>
              {file.name}
            </span>
          )}
        </div>

        <button
          className="fb-btn-primary"
          type="submit"
          disabled={loading || (!file && description.trim().length === 0)}
        >
          {loading ? 'Publicando…' : 'Publicar'}
        </button>
      </div>
    </form>
  )
}
