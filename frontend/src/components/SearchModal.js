import React, { useEffect, useRef, useState, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import User from '../services/user'
import { apiOrigin } from '../api/http'
import { AuthContext } from '../hooks/AuthContext'

export default function SearchModal({ open, onClose, initialQuery }) {
  const ref = useRef(null)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const navigate = useNavigate()
  const { auth } = useContext(AuthContext)
  
  // When the modal opens with an `initialQuery` (from navbar input), prefill the input.
  useEffect(() => {
    if (!open) return
    if (initialQuery && initialQuery !== query) {
      setQuery(initialQuery)
    }
  }, [open, initialQuery, query]);

  function resolveProfilePhotoUrl(url) {
    if (!url) return null
    return url.startsWith('/') ? `${apiOrigin}${url}` : url
  }

  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  useEffect(() => {
    if (!open) return
    // focus input when opened
    try { const el = ref.current && ref.current.querySelector('input'); if (el) el.focus() } catch (_) {}
  }, [open])

  useEffect(() => {
    if (!open) return
    if (!query || query.trim().length < 1) return setResults([])

    let mounted = true
    const t = setTimeout(async () => {
      try {
        const res = await User.searchUsers(query)
        const data = res?.data ?? res
        if (!mounted) return
        // Expect an array of user docs
        setResults(Array.isArray(data) ? data : (data?.data || []))
      } catch (err) {
        if (!mounted) return
        setResults([])
      }
    }, 250)

    return () => { mounted = false; clearTimeout(t) }
  }, [query, open])

  if (!open) return null

  return (
    <div className="search-modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="search-modal-panel" ref={ref} role="dialog" aria-modal="true">
        <div className="search-modal-header">
          <input
            placeholder="Buscar"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Buscar"
          />
          <button className="search-modal-close" onClick={onClose} aria-label="Cerrar">✕</button>
        </div>

        <div className="search-modal-body">
          {query.trim().length === 0 && (
            <div className="search-modal-empty">Escribe para buscar usuarios</div>
          )}

          {results.length > 0 && (
            <ul className="search-results">
              {results.map((r) => {
                const id = r._id || r.id || r.userId
                const name = [r.firstName, r.lastName].filter(Boolean).join(' ') || r.username || r.name || 'Usuario'
                const thumb = resolveProfilePhotoUrl(r.profilePhotoUrl)
                return (
                  <li
                    key={id}
                    className="search-result-item"
                    onClick={() => {
                      onClose();
                      if (!id) return;
                      // If the result is the current authenticated user, navigate to own profile route
                      const myId = auth?._id || auth?.id || auth?._userId || auth?._id?.toString();
                      if (myId && id && id.toString() === myId.toString()) {
                        navigate('/profile');
                      } else {
                        navigate(`/profile/${id}`);
                      }
                    }}
                    style={{ cursor: 'pointer', display: 'flex', gap: 12, alignItems: 'center' }}
                  >
                    <div style={{ width: 40, height: 40, borderRadius: '50%', overflow: 'hidden', background: '#222', flexShrink:0, display:'inline-block' }}>
                      {thumb ? <img src={thumb} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} /> : <div style={{ width: '100%', height: '100%' }} />}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                      <div className="search-result-title" aria-label={`Usuario ${name}`} style={{ marginLeft: 6 }}>{name}</div>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
