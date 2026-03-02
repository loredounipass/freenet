import React, { useState, useRef, useEffect, useContext, useCallback } from 'react'
import useVideos from '../../hooks/useVideos'
import { AuthContext } from '../../hooks/AuthContext'
import { apiOrigin } from '../../api/http'
import CommentsPanel from '../feed/CommentsPanel'
import UserAvatar from '../common/UserAvatar'
import * as profileService from '../../services/profile'

/* ── helpers ── */
function initials(name) {
  if (!name) return '?'
  const p = name.trim().split(' ')
  return p.length >= 2
    ? (p[0][0] + p[p.length - 1][0]).toUpperCase()
    : name[0].toUpperCase()
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

function resolveUrl(u) {
  if (!u) return null
  try {
    if (/^https?:\/\//i.test(u)) return u
    if (u.startsWith('/')) return `${apiOrigin}${u}`
    return u
  } catch (_) { return u }
}


/* ── Single Video Card (fullscreen-scroll style like Meta Reels/Watch) ── */
function VideoCard({ post, isActive, actions, currentUserId, currentUserProfile }) {
  const videoRef = useRef(null)
  const containerRef = useRef(null)
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(true)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [showControls, setShowControls] = useState(true)
  const [liked, setLiked] = useState(() => {
    if (!post?.likes || !currentUserId) return false
    return post.likes.some((id) => String(id) === String(currentUserId))
  })
  const [localLikes, setLocalLikes] = useState(post?.likesCount || 0)
  const [localViews, setLocalViews] = useState(post?.views || 0)
  const [viewTracked, setViewTracked] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [authorProfile, setAuthorProfile] = useState(null)
  const controlsTimerRef = useRef(null)

  const { likeVideo, unlikeVideo, viewVideo, shareVideo, getComments, addComment, joinPost } = actions

  // Load author profile (only for other users' videos)
  const isMyVideo = post && currentUserId && String(post.author) === String(currentUserId)
  useEffect(() => {
    if (isMyVideo || !post?.author) return
    let cancelled = false
    profileService.getProfileById(String(post.author))
      .then((res) => { if (!cancelled) setAuthorProfile((res?.data ?? res)) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [post?.author, isMyVideo])

  // Sync liked state when post data changes
  useEffect(() => {
    if (!post?.likes || !currentUserId) return
    setLiked(post.likes.some((id) => String(id) === String(currentUserId)))
    setLocalLikes(post.likesCount || 0)
  }, [post?.likes, post?.likesCount, currentUserId])

  // Auto play/pause based on visibility
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    if (isActive) {
      video.play().catch(() => {})
      setPlaying(true)
    } else {
      video.pause()
      setPlaying(false)
    }
  }, [isActive])

  const hideControlsSoon = useCallback(() => {
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current)
    controlsTimerRef.current = setTimeout(() => setShowControls(false), 2500)
  }, [])

  useEffect(() => {
    if (isActive && playing) hideControlsSoon()
    return () => { if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current) }
  }, [isActive, playing, hideControlsSoon])

  const handleVideoClick = () => {
    const video = videoRef.current
    if (!video) return
    setShowControls(true)
    if (video.paused) {
      video.play().catch(() => {})
      setPlaying(true)
    } else {
      video.pause()
      setPlaying(false)
    }
    hideControlsSoon()
  }

  const handleTimeUpdate = () => {
    const video = videoRef.current
    if (!video || !video.duration) return
    setProgress((video.currentTime / video.duration) * 100)
    // track view at 3 seconds
    if (!viewTracked && video.currentTime > 3) {
      setViewTracked(true)
      setLocalViews((v) => v + 1)
      try { viewVideo(post._id).catch(() => {}) } catch (_) {}
    }
  }

  const handleSeek = (e) => {
    const video = videoRef.current
    if (!video || !video.duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const pct = x / rect.width
    video.currentTime = pct * video.duration
    setProgress(pct * 100)
  }

  const toggleMute = (e) => {
    e.stopPropagation()
    const video = videoRef.current
    if (!video) return
    video.muted = !video.muted
    setMuted(video.muted)
  }

  const handleLike = async (e) => {
    e.stopPropagation()
    try {
      if (!liked) {
        const res = await likeVideo(post._id)
        const u = res?.data || res
        setLocalLikes(u?.likesCount || (localLikes + 1))
        setLiked(true)
      } else {
        const res = await unlikeVideo(post._id)
        const u = res?.data || res
        setLocalLikes(u?.likesCount || Math.max(0, localLikes - 1))
        setLiked(false)
      }
    } catch (_) {}
  }

  const handleShare = async (e) => {
    e.stopPropagation()
    try {
      if (shareVideo) await shareVideo(post._id)
      const url = `${window.location.origin}/feed/${post._id}`
      if (navigator?.clipboard?.writeText) await navigator.clipboard.writeText(url)
    } catch (_) {}
  }

  const handleComment = (e) => {
    e.stopPropagation()
    setShowControls(true)
    joinPost(post._id)
    setShowComments(true)
  }

  if (!post) return null
  const mediaUrl = resolveUrl(post.multimediaUrl) || resolveUrl(post.thumbnailUrl)
  if (!mediaUrl) return null

  const displayName = (post.authorFirstName || post.authorLastName)
    ? `${post.authorFirstName || ''} ${post.authorLastName || ''}`.trim()
    : 'Usuario'

  return (
    <>
      <div
        className="vf-card"
        ref={containerRef}
        onClick={handleVideoClick}
        onMouseMove={() => { setShowControls(true); hideControlsSoon() }}
      >
        {/* Video */}
        <video
          ref={videoRef}
          className="vf-video"
          src={mediaUrl}
          poster={resolveUrl(post.thumbnailUrl)}
          muted={muted}
          loop
          playsInline
          preload="metadata"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
        />

        {/* Dark gradient overlays */}
        <div className="vf-overlay-top" />
        <div className="vf-overlay-bottom" />

        {/* Play/pause indicator */}
        <div className={`vf-play-indicator ${showControls ? 'vf-controls-visible' : ''}`}>
          {!playing ? (
            <svg width="64" height="64" viewBox="0 0 24 24" fill="white" opacity="0.85">
              <path d="M8 5v14l11-7z"/>
            </svg>
          ) : null}
        </div>

        {/* Progress bar */}
        <div
          className={`vf-progress-wrap ${showControls ? 'vf-controls-visible' : ''}`}
          onClick={handleSeek}
        >
          <div className="vf-progress-track">
            <div className="vf-progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Top controls */}
        <div className={`vf-top-controls ${showControls ? 'vf-controls-visible' : ''}`}>
          {duration > 0 && (
            <span className="vf-duration">
              {Math.floor(duration / 60)}:{String(Math.floor(duration % 60)).padStart(2, '0')}
            </span>
          )}
          <button className="vf-mute-btn" onClick={toggleMute} title={muted ? 'Activar sonido' : 'Silenciar'}>
            {muted ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
              </svg>
            )}
          </button>
        </div>

        {/* Right-side action buttons (Meta Reels style) */}
        <div className="vf-actions-side" onClick={(e) => e.stopPropagation()}>
          {/* Like */}
          <button
            className={`vf-action-btn ${liked ? 'vf-action-liked' : ''}`}
            onClick={handleLike}
            title="Me gusta"
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill={liked ? '#22c1c3' : 'white'}>
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
            <span className="vf-action-count">{formatCount(localLikes)}</span>
          </button>

          {/* Comment */}
          <button className="vf-action-btn" onClick={handleComment} title="Comentar">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <span className="vf-action-count">{formatCount(post.commentsCount || 0)}</span>
          </button>

          {/* Share */}
          <button className="vf-action-btn" onClick={handleShare} title="Compartir">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
            </svg>
            <span className="vf-action-count">{formatCount(post.shares || 0)}</span>
          </button>

          {/* Views */}
          <div className="vf-action-btn vf-action-static" title="Vistas">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
            <span className="vf-action-count">{formatCount(localViews)}</span>
          </div>
        </div>

        {/* Bottom info (author + description) */}
        <div className="vf-info" onClick={(e) => e.stopPropagation()}>
          <div className="vf-author-row">
            <UserAvatar
              user={{
                _id: String(post.author || ''),
                firstName: isMyVideo ? currentUserProfile?.firstName : (post.authorFirstName || authorProfile?.firstName),
                lastName: isMyVideo ? currentUserProfile?.lastName : (post.authorLastName || authorProfile?.lastName),
                profilePhotoUrl: isMyVideo ? currentUserProfile?.profilePhotoUrl : authorProfile?.profilePhotoUrl,
              }}
              size={40}
            />
            <div>
              <div className="vf-author-name">{displayName}</div>
              <div className="vf-time">{timeAgo(post.createdAt)}</div>
            </div>
          </div>
          {post.description && (
            <p className="vf-description">{post.description}</p>
          )}
        </div>
      </div>

      <CommentsPanel
        post={post}
        open={showComments}
        onClose={() => setShowComments(false)}
        addComment={addComment}
        getComments={getComments}
        joinPost={joinPost}
        likeComment={() => {}}
        unlikeComment={() => {}}
      />
    </>
  )
}


/* ── Main VideoFeed component ── */
export default function VideoFeed() {
  const { auth } = useContext(AuthContext)
  const { videos, loading, error, reload, likeVideo, unlikeVideo, viewVideo, shareVideo, getComments, addComment, joinPost } = useVideos()
  const [activeIndex, setActiveIndex] = useState(0)
  const scrollRef = useRef(null)
  const cardRefs = useRef([])

  const actions = { likeVideo, unlikeVideo, viewVideo, shareVideo, getComments, addComment, joinPost }

  // Intersection observer: detect which card is in view
  useEffect(() => {
    const options = { root: scrollRef.current, threshold: 0.6 }
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const idx = cardRefs.current.indexOf(entry.target)
          if (idx !== -1) setActiveIndex(idx)
        }
      })
    }, options)

    cardRefs.current.forEach((el) => { if (el) obs.observe(el) })
    return () => obs.disconnect()
  }, [videos])

  // Keyboard nav
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'ArrowDown') setActiveIndex((i) => Math.min(i + 1, videos.length - 1))
      if (e.key === 'ArrowUp') setActiveIndex((i) => Math.max(i - 1, 0))
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [videos.length])

  // Scroll to active
  useEffect(() => {
    const el = cardRefs.current[activeIndex]
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [activeIndex])

  return (
    <div className="vf-page">
      {/* Header */}
      <div className="vf-header">
        <div className="vf-header-inner">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--fn-teal)' }}>
            <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
          </svg>
          <h1 className="vf-header-title">Videos</h1>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="vf-state">
          <div className="vf-spinner" />
          <p>Cargando videos...</p>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="vf-state">
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>⚠️</div>
          <p style={{ color: '#ff7b7b', marginBottom: '1rem' }}>{error}</p>
          <button className="btn-primary" style={{ maxWidth: 160 }} onClick={reload}>
            Reintentar
          </button>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && videos.length === 0 && (
        <div className="vf-state">
          <div className="vf-empty-icon">📹</div>
          <h2 className="vf-empty-title">Aún no hay videos</h2>
          <p className="vf-empty-sub">Sé el primero en publicar un video en el feed</p>
        </div>
      )}

      {/* Video scroll list */}
      {!loading && videos.length > 0 && (
        <div className="vf-scroll" ref={scrollRef}>
          {videos.map((video, idx) => (
            <div
              key={video._id}
              className="vf-card-wrapper"
              ref={(el) => { cardRefs.current[idx] = el }}
            >
              <VideoCard
                post={video}
                isActive={idx === activeIndex}
                actions={actions}
                currentUserId={auth?._id}
                currentUserProfile={auth}
              />
            </div>
          ))}
        </div>
      )}

      {/* Arrow nav buttons (Meta-style right side) */}
      {videos.length > 1 && (
        <div className="vf-nav-arrows">
          <button
            id="vf-btn-prev"
            className="vf-arrow-btn"
            disabled={activeIndex === 0}
            onClick={() => setActiveIndex((i) => Math.max(i - 1, 0))}
            aria-label="Video anterior"
            title="Video anterior"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="18 15 12 9 6 15"/>
            </svg>
          </button>
          <button
            id="vf-btn-next"
            className="vf-arrow-btn"
            disabled={activeIndex === videos.length - 1}
            onClick={() => setActiveIndex((i) => Math.min(i + 1, videos.length - 1))}
            aria-label="Siguiente video"
            title="Siguiente video"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
        </div>
      )}

      {/* Nav dots */}
      {videos.length > 1 && (
        <div className="vf-nav-dots">
          {videos.map((_, idx) => (
            <button
              key={idx}
              className={`vf-dot ${idx === activeIndex ? 'vf-dot-active' : ''}`}
              onClick={() => setActiveIndex(idx)}
              aria-label={`Video ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
