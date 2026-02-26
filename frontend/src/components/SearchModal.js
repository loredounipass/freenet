import React, { useEffect, useRef, useState } from 'react'

export default function SearchModal({ open, onClose }) {
  const ref = useRef(null)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])

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
    // simple fake search results for demo; replace with real API as needed
    if (!query || query.trim().length < 1) return setResults([])
    const q = query.toLowerCase()
    const demo = [
      { id: 'r1', title: 'Personas', subtitle: 'Buscar personas' },
      { id: 'r2', title: 'Publicaciones', subtitle: 'Buscar publicaciones' },
      { id: 'r3', title: 'Grupos', subtitle: 'Buscar grupos' },
    ]
    setResults(demo.filter(d => d.title.toLowerCase().includes(q) || d.subtitle.toLowerCase().includes(q)))
  }, [query])

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
              {results.map(r => (
                <li key={r.id} className="search-result-item">
                  <div className="search-result-title">{r.title}</div>
                  <div className="search-result-sub">{r.subtitle}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
