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

  useEffect(() => {
    if (!open) return
    if (initialQuery && initialQuery !== query) {
      setQuery(initialQuery)
    }
  }, [open, initialQuery, query])

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

        {/* ── Header: search bar ── */}
        <div className="search-modal-header">
          <span className="search-modal-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            </svg>
          </span>
          <input
            placeholder="Buscar personas…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Buscar"
          />
          {query && (
            <button className="search-modal-clear" onClick={() => setQuery('')} aria-label="Limpiar">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          )}
          <button className="search-modal-close" onClick={onClose} aria-label="Cerrar">✕</button>
        </div>

        {/* ── Body ── */}
        <div className="search-modal-body">

          {/* Empty state */}
          {query.trim().length === 0 && (
            <div className="search-modal-empty">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
              </svg>
              <p>Busca por nombre o usuario</p>
            </div>
          )}

          {/* Results */}
          {results.length > 0 && (
            <>
              <div className="search-results-label">Personas</div>
              <ul className="search-results">
                {results.map((r) => {
                  const id        = r._id || r.id || r.userId
                  const firstName = r.firstName || ''
                  const lastName  = r.lastName  || ''
                  const fullName  = [firstName, lastName].filter(Boolean).join(' ') || r.username || r.name || 'Usuario'
                  const handle    = r.username ? `@${r.username}` : null
                  const photoUrl  = resolveProfilePhotoUrl(r.profilePhotoUrl)

                  // Deterministic accent color for initial fallback
                  const palette = ['#22c1c3','#F6851B','#7c3aed','#0ea5e9','#10b981','#f43f5e','#f59e0b','#3b82f6','#8b5cf6','#ec4899']
                  let hash = 0
                  const seed = String(id || firstName || '')
                  for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash)
                  const bgColor = palette[Math.abs(hash) % palette.length]
                  const initial = (firstName || fullName || '?')[0]?.toUpperCase() ?? '?'

                  return (
                    <li
                      key={id}
                      className="search-result-item"
                      onClick={() => {
                        onClose()
                        if (!id) return
                        const myId = auth?._id || auth?.id
                        if (myId && id && id.toString() === myId.toString()) {
                          navigate('/profile')
                        } else {
                          navigate(`/profile/${id}`)
                        }
                      }}
                    >
                      {/* ── Avatar: real photo OR colored initial ── */}
                      <div
                        className="search-result-avatar"
                        style={{ background: photoUrl ? 'transparent' : bgColor }}
                      >
                        {photoUrl
                          ? <img src={photoUrl} alt={fullName} />
                          : <span>{initial}</span>
                        }
                      </div>

                      {/* ── Name + handle ── */}
                      <div className="search-result-info">
                        <span className="search-result-name">{fullName}</span>
                        {handle && <span className="search-result-handle">{handle}</span>}
                      </div>

                      {/* ── Chevron ── */}
                      <svg className="search-result-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 18l6-6-6-6"/>
                      </svg>
                    </li>
                  )
                })}
              </ul>
            </>
          )}

          {/* No results for query */}
          {query.trim().length > 0 && results.length === 0 && (
            <div className="search-modal-empty">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
              </svg>
              <p>Sin resultados para "<strong style={{ color: 'var(--fn-text)' }}>{query}</strong>"</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
