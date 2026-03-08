import React, { useState, useContext, useRef } from 'react'
import { AuthContext } from '../../hooks/AuthContext'
import { avatarColor } from '../common/UserAvatar'
import { apiOrigin } from '../../api/http'

/* ─────────────────────────────────────────────────────────
   Datos genéricos hasta que el backend tenga soporte
───────────────────────────────────────────────────────── */
const MOCK_STORIES = [
  { id: 's1', name: 'Andrea G.',  gradient: 'linear-gradient(160deg, #22c1c3 0%, #1e90ff 100%)', emoji: '🌊', accent: '#22c1c3' },
  { id: 's2', name: 'Carlos M.',  gradient: 'linear-gradient(160deg, #7c3aed 0%, #ec4899 100%)', emoji: '🎵', accent: '#7c3aed' },
  { id: 's3', name: 'Sofía R.',   gradient: 'linear-gradient(160deg, #f59e0b 0%, #f43f5e 100%)', emoji: '✈️', accent: '#f59e0b' },
  { id: 's4', name: 'Diego P.',   gradient: 'linear-gradient(160deg, #10b981 0%, #0ea5e9 100%)', emoji: '🏄', accent: '#10b981' },
  { id: 's5', name: 'Valentina',  gradient: 'linear-gradient(160deg, #f43f5e 0%, #f59e0b 100%)', emoji: '🌸', accent: '#f43f5e' },
  { id: 's6', name: 'Luis M.',    gradient: 'linear-gradient(160deg, #0ea5e9 0%, #7c3aed 100%)', emoji: '�', accent: '#0ea5e9' },
  { id: 's7', name: 'Camila V.',  gradient: 'linear-gradient(160deg, #ec4899 0%, #f59e0b 100%)', emoji: '🌺', accent: '#ec4899' },
]

/* ─── Visor fullscreen ─── */
function StoryViewer({ story, onClose }) {
  return (
    <div className="hs-viewer-backdrop" onClick={onClose}>
      <div className="hs-viewer-card" onClick={(e) => e.stopPropagation()}>
        <div className="hs-viewer-progress">
          <div className="hs-viewer-bar" />
        </div>
        <div className="hs-viewer-header">
          <div className="hs-viewer-avatar" style={{ background: story.gradient }}>
            <span>{story.emoji}</span>
          </div>
          <span className="hs-viewer-name">{story.name}</span>
          <span className="hs-viewer-time">ahora</span>
          <button className="hs-viewer-close" onClick={onClose} aria-label="Cerrar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <div className="hs-viewer-content" style={{ background: story.gradient }}>
          <span className="hs-viewer-emoji">{story.emoji}</span>
          <p className="hs-viewer-label">{story.name}</p>
          <p className="hs-viewer-sublabel">Historia de ejemplo</p>
        </div>
      </div>
    </div>
  )
}

/* ─── Arrow button ─── */
function ArrowBtn({ direction, onClick, visible }) {
  return (
    <button
      className={`hs-arrow hs-arrow-${direction}${visible ? ' hs-arrow-visible' : ''}`}
      onClick={onClick}
      aria-label={direction === 'left' ? 'Scroll izquierda' : 'Scroll derecha'}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        {direction === 'left'
          ? <path d="M15 18l-6-6 6-6"/>
          : <path d="M9 18l6-6-6-6"/>
        }
      </svg>
    </button>
  )
}

/* ─── Componente principal ─── */
export default function Historias() {
  const { auth }              = useContext(AuthContext)
  const [viewing, setViewing] = useState(null)
  const [showLeft, setShowLeft]   = useState(false)
  const [showRight, setShowRight] = useState(true)
  const stripRef = useRef(null)

  const myName     = auth ? `${auth.firstName || ''}`.trim() || 'Tú' : 'Tú'
  const myPhotoUrl = auth?.profilePhotoUrl
    ? (auth.profilePhotoUrl.startsWith('/') ? `${apiOrigin}${auth.profilePhotoUrl}` : auth.profilePhotoUrl)
    : null
  const myColor    = avatarColor(String(auth?._id || auth?.firstName || ''))

  /* ── Scroll helpers ── */
  const SCROLL_AMOUNT = 360

  const scrollLeft = () => {
    const el = stripRef.current
    if (!el) return
    el.scrollBy({ left: -SCROLL_AMOUNT, behavior: 'smooth' })
  }

  const scrollRight = () => {
    const el = stripRef.current
    if (!el) return
    el.scrollBy({ left: SCROLL_AMOUNT, behavior: 'smooth' })
  }

  const onScroll = () => {
    const el = stripRef.current
    if (!el) return
    setShowLeft(el.scrollLeft > 10)
    setShowRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 10)
  }

  return (
    <>
      <div className="hs-wrapper">

        {/* ── Arrow left ── */}
        <ArrowBtn direction="left" onClick={scrollLeft} visible={showLeft} />

        {/* ── Strip ── */}
        <div
          className="hs-strip"
          ref={stripRef}
          onScroll={onScroll}
        >
          {/* Crear historia */}
          <div className="hs-card hs-card-create">
            {myPhotoUrl
              ? <img src={myPhotoUrl} alt={myName} className="hs-card-bg-img" />
              : <div className="hs-card-bg-color" style={{ background: myColor }} />
            }
            <div className="hs-card-overlay" />
            <div className="hs-card-plus">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M12 5v14M5 12h14" stroke="white" strokeWidth="3" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="hs-card-name">Crear historia</span>
          </div>

          {/* Historias genéricas */}
          {MOCK_STORIES.map((story) => (
            <button
              key={story.id}
              className="hs-card"
              onClick={() => setViewing(story)}
              title={`Ver historia de ${story.name}`}
            >
              <div className="hs-card-bg-gradient" style={{ background: story.gradient }} />
              <div className="hs-card-overlay" />
              <div
                className="hs-card-avatar"
                style={{ borderColor: story.accent, background: story.gradient }}
              >
                <span className="hs-card-avatar-emoji">{story.emoji}</span>
              </div>
              <span className="hs-card-center-emoji">{story.emoji}</span>
              <span className="hs-card-name">{story.name}</span>
            </button>
          ))}
        </div>

        {/* ── Arrow right ── */}
        <ArrowBtn direction="right" onClick={scrollRight} visible={showRight} />

      </div>

      {/* Visor */}
      {viewing && (
        <StoryViewer story={viewing} onClose={() => setViewing(null)} />
      )}
    </>
  )
}
