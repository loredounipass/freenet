import React, { useState, useRef, useEffect, useContext, useCallback } from 'react'
import useDiscover, { isVideoPost } from '../../hooks/useDiscover'
import { AuthContext } from '../../hooks/AuthContext'
import { apiOrigin, mediaBase } from '../../api/http'
import CommentsPanel from '../feed/CommentsPanel'
import UserAvatar from '../common/UserAvatar'
import * as profileService from '../../services/profile'

/* ── helpers ── */
function resolveUrl(u) {
  if (!u) return null
  try {
    if (/^https?:\/\//i.test(u)) return u
    if (u.startsWith('/')) return `${apiOrigin}${u}`
    return u
  } catch (_) { return u }
}

function getMediaUrl(post) {
  if (!post) return null
  return (
    resolveUrl(post.multimediaUrl) ||
    resolveUrl(post.thumbnailUrl) ||
    (post.multimedia?.filename ? `${mediaBase}/${post.multimedia.filename}` : null)
  )
}


function formatCount(n) {
  if (!n || n === 0) return '0'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace('.0', '') + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace('.0', '') + 'K'
  return String(n)
}

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000
  if (diff < 60) return 'ahora'
  if (diff < 3600) return `${Math.floor(diff / 60)}m`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d`
  return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

/* ── filter tab values ── */
const IconAll = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M13.5 2C13.5 2 13 7 10 10C7 13 2 13.5 2 13.5C2 13.5 7 14 10 17C13 20 13.5 25 13.5 25C13.5 25 14 20 17 17C20 14 25 13.5 25 13.5C25 13.5 20 13 17 10C14 7 13.5 2 13.5 2Z" transform="scale(0.9) translate(0.5,0.5)"/>
    <path d="M19 2L19.8 4.2L22 5L19.8 5.8L19 8L18.2 5.8L16 5L18.2 4.2L19 2Z"/>
  </svg>
)
const IconPhoto = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="3" ry="3"/>
    <circle cx="8.5" cy="8.5" r="1.5"/>
    <polyline points="21 15 16 10 5 21"/>
  </svg>
)
const IconVideo = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="23 7 16 12 23 17 23 7"/>
    <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
  </svg>
)

const TABS = [
  { id: 'all',    label: 'Todo',    Icon: IconAll   },
  { id: 'image',  label: 'Fotos',   Icon: IconPhoto },
  { id: 'video',  label: 'Videos',  Icon: IconVideo },
]

/* ── DiscoverModal: full detail view ── */
function DiscoverModal({ post, onClose, actions, currentUserId, currentUserProfile }) {
  const mediaUrl = getMediaUrl(post)
  const isVideo  = isVideoPost(post)
  const videoRef = useRef(null)
  const [playing, setPlaying]       = useState(false)
  const [muted, setMuted]           = useState(false)
  const [liked, setLiked]           = useState(() => {
    if (!post?.likes || !currentUserId) return false
    return post.likes.some((id) => String(id) === String(currentUserId))
  })
  const [localLikes, setLocalLikes] = useState(post?.likesCount || 0)
  const [showComments, setShowComments] = useState(false)
  const [shareFeedback, setShareFeedback] = useState('')
  const [authorProfile, setAuthorProfile] = useState(null)
  
  // Load author profile (only for other users' posts)
  const isMyPost = post && currentUserId && String(post.author) === String(currentUserId)
  useEffect(() => {
    if (isMyPost || !post?.author) return
    let cancelled = false
    profileService.getProfileById(String(post.author))
      .then((res) => { if (!cancelled) setAuthorProfile((res?.data ?? res)) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [post?.author, isMyPost])

  // sync liked when post changes
  useEffect(() => {
    if (!post?.likes || !currentUserId) return
    setLiked(post.likes.some((id) => String(id) === String(currentUserId)))
    setLocalLikes(post.likesCount || 0)
  }, [post?.likes, post?.likesCount, currentUserId])

  // track view once modal opens
  useEffect(() => {
    if (post?._id && actions?.viewPost) {
      try { actions.viewPost(post._id).catch(() => {}) } catch (_) {}
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post?._id])

  // close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const handleLike = async (e) => {
    e.stopPropagation()
    try {
      if (!liked) {
        const res = await actions.likePost(post._id)
        const u = res?.data || res
        setLocalLikes(u?.likesCount ?? (localLikes + 1))
        setLiked(true)
      } else {
        const res = await actions.unlikePost(post._id)
        const u = res?.data || res
        setLocalLikes(u?.likesCount ?? Math.max(0, localLikes - 1))
        setLiked(false)
      }
    } catch (_) {}
  }

  const handleShare = async (e) => {
    e.stopPropagation()
    try {
      if (actions.sharePost) await actions.sharePost(post._id)
      const url = `${window.location.origin}/feed/${post._id}`
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(url)
        setShareFeedback('¡Enlace copiado!')
        setTimeout(() => setShareFeedback(''), 2200)
      }
    } catch (_) {
      setShareFeedback('Error al compartir')
      setTimeout(() => setShareFeedback(''), 2200)
    }
  }

  const handleVideoClick = () => {
    const v = videoRef.current
    if (!v) return
    if (v.paused) { v.play().catch(() => {}); setPlaying(true) }
    else { v.pause(); setPlaying(false) }
  }

  const displayName = (post.authorFirstName || post.authorLastName)
    ? `${post.authorFirstName || ''} ${post.authorLastName || ''}`.trim()
    : 'Usuario'

  return (
    <div className="disc-modal-backdrop" onClick={onClose}>
      <div className="disc-modal-container" onClick={(e) => e.stopPropagation()}>

        {/* Close */}
        <button className="disc-modal-close" onClick={onClose} aria-label="Cerrar">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>

        {/* Media side */}
        <div className="disc-modal-media">
          {isVideo ? (
            <div className="disc-modal-video-wrap" onClick={handleVideoClick}>
              <video
                ref={videoRef}
                src={mediaUrl}
                poster={resolveUrl(post.thumbnailUrl)}
                muted={muted}
                loop
                playsInline
                preload="metadata"
                className="disc-modal-video"
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
              />
              {/* Play overlay */}
              {!playing && (
                <div className="disc-modal-play-overlay">
                  <svg width="56" height="56" viewBox="0 0 24 24" fill="white" opacity="0.9">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </div>
              )}
              {/* Mute toggle */}
              <button
                className="disc-modal-mute-btn"
                onClick={(e) => { e.stopPropagation(); const v = videoRef.current; if (!v) return; v.muted = !v.muted; setMuted(v.muted) }}
                title={muted ? 'Activar sonido' : 'Silenciar'}
              >
                {muted ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                    <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                  </svg>
                )}
              </button>
            </div>
          ) : (
            <img src={mediaUrl} alt={post.description || 'media'} className="disc-modal-img" />
          )}
        </div>

        {/* Info side */}
        <div className="disc-modal-info">
          {/* Author */}
          <div className="disc-modal-author-row">
            <UserAvatar
              user={{
                _id: String(post.author || ''),
                firstName: isMyPost ? currentUserProfile?.firstName : (post.authorFirstName || authorProfile?.firstName),
                lastName: isMyPost ? currentUserProfile?.lastName : (post.authorLastName || authorProfile?.lastName),
                profilePhotoUrl: isMyPost ? currentUserProfile?.profilePhotoUrl : authorProfile?.profilePhotoUrl,
              }}
              size={40}
            />
            <div>
              <div className="disc-modal-author-name">{displayName}</div>
              <div className="disc-modal-time">{timeAgo(post.createdAt)}</div>
            </div>
          </div>

          {/* Description */}
          {post.description && (
            <p className="disc-modal-desc">{post.description}</p>
          )}

          {/* Stats */}
          <div className="disc-modal-stats">
            <span>
              <svg width="13" height="13" viewBox="0 0 24 24" fill={liked ? '#22c1c3' : 'currentColor'}>
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
              {formatCount(localLikes)}
            </span>
            <span>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              {formatCount(post.commentsCount || 0)}
            </span>
            <span>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
              </svg>
              {formatCount(typeof post.views === 'number' ? post.views : 0)}
            </span>
          </div>

          {/* Actions */}
          <div className="disc-modal-actions">
            <button
              className={`disc-modal-action-btn${liked ? ' liked' : ''}`}
              onClick={handleLike}
            >
              {liked ? '♥' : '♡'} Me gusta
            </button>
            <button
              className="disc-modal-action-btn"
              onClick={(e) => { e.stopPropagation(); actions.joinPost?.(post._id); setShowComments(true) }}
            >
              💬 Comentar
            </button>
            <button className="disc-modal-action-btn" onClick={handleShare}>
              {shareFeedback || '🔗 Compartir'}
            </button>
          </div>
        </div>
      </div>

      <CommentsPanel
        post={post}
        open={showComments}
        onClose={() => setShowComments(false)}
        addComment={actions.addComment}
        getComments={actions.getComments}
        joinPost={actions.joinPost}
        likeComment={() => {}}
        unlikeComment={() => {}}
      />
    </div>
  )
}

/* ── DiscoverGridItem ── */
function DiscoverGridItem({ post, onClick, span }) {
  const mediaUrl = getMediaUrl(post)
  const isVideo  = isVideoPost(post)
  const [hovered, setHovered] = useState(false)

  if (!mediaUrl) return null

  return (
    <div
      className={`disc-grid-item${span > 1 ? ` disc-span-${span}` : ''}`}
      onClick={() => onClick(post)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick(post) }}
    >
      {isVideo ? (
        <>
          <video
            src={mediaUrl}
            poster={resolveUrl(post.thumbnailUrl)}
            muted
            playsInline
            preload="metadata"
            className="disc-grid-media"
          />
          <div className="disc-grid-video-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
        </>
      ) : (
        <img
          src={mediaUrl}
          alt={post.description || ''}
          className="disc-grid-media"
          loading="lazy"
        />
      )}

      {/* Hover overlay */}
      <div className={`disc-grid-overlay${hovered ? ' disc-grid-overlay-visible' : ''}`}>
        <div className="disc-grid-overlay-stats">
          <span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
            {formatCount(post.likesCount || 0)}
          </span>
          <span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            {formatCount(post.commentsCount || 0)}
          </span>
        </div>
      </div>
    </div>
  )
}

/* ── Main Discover component ── */
export default function Discover() {
  const { auth } = useContext(AuthContext)
  const {
    items, loading, error, reload,
    likePost, unlikePost, viewPost, sharePost,
    getComments, addComment, joinPost,
  } = useDiscover()

  const [activeTab, setActiveTab]   = useState('all')
  const [searchVal, setSearchVal]   = useState('')
  const [selected, setSelected]     = useState(null)
  const searchRef = useRef(null)

  const actions = { likePost, unlikePost, viewPost, sharePost, getComments, addComment, joinPost }

  // Filter by tab and search
  const filtered = items.filter((post) => {
    const tabOk =
      activeTab === 'all'   ? true :
      activeTab === 'image' ? !isVideoPost(post) :
      activeTab === 'video' ? isVideoPost(post) : true

    const q = searchVal.trim().toLowerCase()
    const textOk = !q ||
      (post.description || '').toLowerCase().includes(q) ||
      (`${post.authorFirstName || ''} ${post.authorLastName || ''}`).toLowerCase().includes(q)

    return tabOk && textOk
  })

  // Navigate modal with keyboard arrows
  const handleKeyNav = useCallback((e) => {
    if (!selected) return
    const idx = filtered.findIndex((p) => p._id === selected._id)
    if (e.key === 'ArrowRight' && idx < filtered.length - 1) {
      setSelected(filtered[idx + 1])
    }
    if (e.key === 'ArrowLeft' && idx > 0) {
      setSelected(filtered[idx - 1])
    }
  }, [selected, filtered])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyNav)
    return () => window.removeEventListener('keydown', handleKeyNav)
  }, [handleKeyNav])

  // Mosaic layout: every 5th item spans 2 columns and is taller
  const getSpan = (idx) => ((idx + 1) % 5 === 0) ? 2 : 1

  return (
    <div className="disc-page">
      {/* ── Header ── */}
      <div className="disc-header">
        <div className="disc-header-inner">
          <div className="disc-header-left">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--fn-teal)' }}>
              <circle cx="12" cy="12" r="10"/>
              <polygon points="10 8 16 12 10 16 10 8"/>
            </svg>
            <h1 className="disc-header-title">Discover</h1>
          </div>

          {/* Search */}
          <div className="disc-search-wrap" ref={searchRef}>
            <span className="disc-search-icon">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
              </svg>
            </span>
            <input
              id="disc-search-input"
              className="disc-search-input"
              placeholder="Buscar por descripción o autor…"
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
            />
            {searchVal && (
              <button className="disc-search-clear" onClick={() => setSearchVal('')} aria-label="Limpiar búsqueda">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="disc-tabs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              id={`disc-tab-${tab.id}`}
              className={`disc-tab${activeTab === tab.id ? ' disc-tab-active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="disc-tab-icon"><tab.Icon /></span>
              {tab.label}
              {activeTab === tab.id && <span className="disc-tab-active-bar" />}
            </button>
          ))}
        </div>
      </div>

      {/* ── States ── */}
      {loading && (
        <div className="disc-state">
          <div className="disc-spinner" />
          <p>Cargando contenido…</p>
        </div>
      )}

      {!loading && error && (
        <div className="disc-state">
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>⚠️</div>
          <p style={{ color: '#ff7b7b', marginBottom: '1rem' }}>{error}</p>
          <button className="btn-primary" style={{ maxWidth: 160 }} onClick={reload}>
            Reintentar
          </button>
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="disc-state">
          <div className="disc-empty-icon">
            {searchVal ? '🔍' : (activeTab === 'video' ? '🎬' : (activeTab === 'image' ? '🖼️' : '🌐'))}
          </div>
          <h2 className="disc-empty-title">
            {searchVal
              ? 'Sin resultados para esa búsqueda'
              : activeTab === 'video'
              ? 'Aún no hay videos'
              : activeTab === 'image'
              ? 'Aún no hay fotos'
              : 'Aún no hay contenido multimedia'
            }
          </h2>
          <p className="disc-empty-sub">
            {searchVal ? 'Intenta con otras palabras.' : 'Sé el primero en compartir.'}
          </p>
        </div>
      )}

      {/* ── Grid ── */}
      {!loading && filtered.length > 0 && (
        <>
          <div className="disc-count-bar">
            <span className="disc-count">
              {filtered.length} publicacion{filtered.length !== 1 ? 'es' : ''}
            </span>
          </div>
          <div className="disc-grid">
            {filtered.map((post, idx) => (
              <DiscoverGridItem
                key={post._id}
                post={post}
                onClick={setSelected}
                span={getSpan(idx)}
              />
            ))}
          </div>
        </>
      )}

      {/* ── Modal ── */}
      {selected && (
        <DiscoverModal
          post={selected}
          onClose={() => setSelected(null)}
          actions={actions}
          currentUserId={auth?._id}
          currentUserProfile={auth}
        />
      )}
    </div>
  )
}
