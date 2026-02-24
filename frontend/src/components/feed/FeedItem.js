import React, { useState, useEffect, useRef, useContext } from 'react'
import { mediaBase, apiOrigin } from '../../api/http'
import CommentsPanel from './CommentsPanel'
import NewChatDialog from '../chat/NewChatDialog'
import MessagesService from '../../services/messagesAndMultimedia'
import { AuthContext } from '../../hooks/AuthContext'

/* ── helpers ── */
function initials(name) {
  if (!name) return '?'
  const p = name.trim().split(' ')
  return p.length >= 2
    ? (p[0][0] + p[p.length - 1][0]).toUpperCase()
    : name[0].toUpperCase()
}

export default function FeedItem({ post, actions = {} }) {
  const { likePost, unlikePost, addComment, joinPost, viewPost, getComments, likeComment, unlikeComment, sharePost } = actions
  const { auth } = useContext(AuthContext)

  // Derive initial liked state from post.likes array (contains user IDs)
  const isLikedByMe = (p) => {
    if (!p || !auth?._id) return false
    return Array.isArray(p.likes) && p.likes.some(
      (id) => String(id) === String(auth._id)
    )
  }

  const [liked, setLiked]               = useState(() => isLikedByMe(post))
  const [localLikes, setLocalLikes]     = useState(post ? (post.likesCount || 0) : 0)
  const [showComments, setShowComments] = useState(false)
  const [localShares, setLocalShares]   = useState(post ? (post.shares || 0) : 0)
  const [shareBusy, setShareBusy]       = useState(false)
  const [shareFeedback, setShareFeedback] = useState('')
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const containerRef = useRef(null)
  const [viewed, setViewed]             = useState(false)

  // Keep liked/localLikes in sync when post data updates from socket or re-fetch
  useEffect(() => {
    setLiked(isLikedByMe(post))
    setLocalLikes(post?.likesCount || 0)
    setLocalShares(post?.shares || 0)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post?.likes, post?.likesCount, auth?._id])

  /* auto-view on scroll */
  useEffect(() => {
    if (!post || !post._id || typeof window === 'undefined') return
    const el = containerRef.current
    if (!el || viewed) return
    let obs
    try {
      obs = new IntersectionObserver((entries) => {
        entries.forEach(e => {
          if (e.isIntersecting && e.intersectionRatio > 0.25 && !viewed) {
            try { viewPost(post._id).catch(() => {}) } catch (_) {}
            setViewed(true)
          }
        })
      }, { threshold: [0.25, 0.5, 1] })
      obs.observe(el)
    } catch (_) {}
    return () => { try { if (obs && el) obs.unobserve(el) } catch (_) {} }
  }, [post, viewed, viewPost])

  if (!post) return null
  const {
    description, multimedia, author,
    authorFirstName, authorLastName,
    createdAt, thumbnailUrl, multimediaUrl,
    commentsCount, views,
  } = post

  const displayName = (authorFirstName || authorLastName)
    ? `${authorFirstName || ''} ${authorLastName || ''}`.trim()
    : (author?.username || 'Usuario')

  const meta = post.multimedia || {}
  const shareUrl = (typeof window !== 'undefined' && window.location)
    ? `${window.location.origin}/feed/${post._id}`
    : `${apiOrigin}/feed/${post._id}`
  const resolveUrl = (u) => {
    if (!u) return null
    try {
      if (/^https?:\/\//i.test(u)) return u
      if (u.startsWith('/')) return `${apiOrigin}${u}`
      return u
    } catch (_) { return u }
  }
  const mediaUrl =
    resolveUrl(multimediaUrl) ||
    resolveUrl(thumbnailUrl) ||
    (multimedia?.filename ? `${mediaBase}/${multimedia.filename}` : null)

  const isVideo = (() => {
    if (!mediaUrl) return false
    if (meta?.duration) return true
    if (multimedia?.mimetype?.startsWith('video/')) return true
    try { return !!mediaUrl.match(/\.(mp4|webm|ogg|mov|mkv)(\?|$)/i) } catch (_) { return false }
  })()

  const timeStr = createdAt
    ? new Date(createdAt).toLocaleString(undefined, {
        month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    : ''

  const handleLike = async () => {
    try {
      if (!liked) {
        const res = await likePost(post._id)
        const u = (res && res.data) ? res.data : res
        setLocalLikes(u.likesCount || (localLikes + 1))
        setLiked(true)
      } else {
        const res = await unlikePost(post._id)
        const u = (res && res.data) ? res.data : res
        setLocalLikes(u.likesCount || Math.max(0, localLikes - 1))
        setLiked(false)
      }
    } catch (_) {}
  }

  const handleShare = async () => {
    if (shareBusy) return
    setShareBusy(true)
    try {
      // Prefer server-side share action if provided
      if (sharePost) {
        const res = await sharePost(post._id)
        const u = (res && res.data) ? res.data : res
        setLocalShares((s) => (u && typeof u.shares === 'number') ? u.shares : s + 1)
        setShareFeedback('Compartido')
        setTimeout(() => setShareFeedback(''), 1800)
        // open contact chooser so user can forward to contacts (preserve previous behaviour)
        try { setShareDialogOpen(true) } catch (_) {}
        return u
      }

      // Fallback: use Web Share API when available
      const shareUrl = (typeof window !== 'undefined' && window.location)
        ? `${window.location.origin}/feed/${post._id}`
        : `${apiOrigin}/feed/${post._id}`

      if (navigator && navigator.share) {
        await navigator.share({ title: description || 'Publicación', text: description || '', url: shareUrl })
        setLocalShares((s) => s + 1)
        setShareFeedback('Compartido')
        setTimeout(() => setShareFeedback(''), 1800)
        try { setShareDialogOpen(true) } catch (_) {}
        return { shared: true }
      }

      // Last-resort: copy URL to clipboard
      if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl)
        setLocalShares((s) => s + 1)
        setShareFeedback('Enlace copiado')
        setTimeout(() => setShareFeedback(''), 1800)
        try { setShareDialogOpen(true) } catch (_) {}
        return { copied: true }
      }
    } catch (_) {
      try { setShareFeedback('Error al compartir') } catch (_) {}
      setTimeout(() => setShareFeedback(''), 2200)
    } finally {
      setShareBusy(false)
    }
  }

  const handleShareToContact = async (user) => {
    // user: { _id, firstName, lastName, email }
    try {
      const shareUrl = (typeof window !== 'undefined' && window.location)
        ? `${window.location.origin}/feed/${post._id}`
        : `${apiOrigin}/feed/${post._id}`
      // send a message with the link
      try {
        await MessagesService.createMessage({ content: shareUrl, type: 'text', receiverId: user._id, senderId: auth?._id })
        setShareFeedback('Enviado')
        setTimeout(() => setShareFeedback(''), 1600)
      } catch (err) {
        setShareFeedback('No se pudo enviar')
        setTimeout(() => setShareFeedback(''), 2200)
      }
    } catch (_) {}
    setShareDialogOpen(false)
  }

  return (
    <>
      <div className="fb-card mb-4" ref={containerRef}>

        {/* ── Header ── */}
        <div style={{
          display: 'flex', alignItems: 'center',
          gap: '0.75rem', padding: '1rem 1.25rem 0.85rem',
        }}>
          <div className="fb-avatar">{initials(displayName)}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="fb-author">{displayName}</div>
            <div className="fb-time">{timeStr}</div>
          </div>
        </div>

        {/* ── Description ── */}
        {description && (
          <div style={{ padding: '0 1.25rem 1rem' }}>
            <p className="fb-desc">{description}</p>
          </div>
        )}

        {/* ── Media ── */}
        {mediaUrl && (
          <div className="fb-media">
            {isVideo ? (
              <video
                onPlay={() => {
                  if (!viewed) {
                    try { viewPost(post._id).catch(() => {}) } catch (_) {}
                    setViewed(true)
                  }
                }}
                controls
                style={{ width: '100%', maxHeight: '480px', display: 'block', objectFit: 'contain' }}
                poster={resolveUrl(thumbnailUrl)}
              >
                <source src={mediaUrl} type={multimedia?.mimetype || 'video/mp4'} />
                Tu navegador no soporta la etiqueta de video.
              </video>
            ) : (
              <img
                src={mediaUrl}
                alt="media"
                style={{ width: '100%', maxHeight: '480px', display: 'block', objectFit: 'contain' }}
              />
            )}
          </div>
        )}

        {/* ── Stats row ── */}
        <div className="fb-stats">
          <span>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"
              style={{ color: liked ? '#22c1c3' : undefined }}>
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
            {localLikes} {localLikes === 1 ? 'like' : 'likes'}
          </span>
          <span style={{ cursor: 'pointer' }} onClick={() => setShowComments(true)}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            {commentsCount || 0} comentario{commentsCount !== 1 ? 's' : ''}
          </span>
          <span style={{ cursor: 'pointer', marginLeft: '0.6rem' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7"/>
              <path d="M12 3v13"/>
              <path d="M8 7l4-4 4 4"/>
            </svg>
            {localShares || 0} compartido{(localShares || 0) !== 1 ? 's' : ''}
          </span>
          <span style={{ marginLeft: 'auto' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
            {typeof views === 'number' ? views : 0} vista{views !== 1 ? 's' : ''}
          </span>
        </div>

        {/* ── Action buttons ── */}
        <div className="fb-actions">
          <button onClick={handleLike} className={`btn-like${liked ? ' liked' : ''}`}>
            {liked ? '♥ Te gusta' : '♡ Me gusta'}
          </button>
          <button onClick={() => setShowComments(true)} className="btn-comment">
            💬 Comentar
          </button>
          <button onClick={handleShare} className="btn-share" disabled={shareBusy}>
            {shareBusy ? '...' : (shareFeedback || '🔗 Compartir')}
          </button>
        </div>

        {/* ── Media meta ── */}
        {meta && (meta.width || meta.height || meta.duration || meta.size) && (
          <div style={{ padding: '0.4rem 1.25rem 0.6rem', fontSize: '0.73rem', color: '#9fb7c3', opacity: 0.7 }}>
            {meta.width && meta.height && <span style={{ marginRight: '1rem' }}>📐 {meta.width}×{meta.height}</span>}
            {meta.duration && <span style={{ marginRight: '1rem' }}>⏱ {Math.round(meta.duration)}s</span>}
            {meta.size && <span>💾 {Math.round(meta.size / 1024)} KB</span>}
          </div>
        )}
      </div>

      {/* ── Comments slide-in panel ── */}
      <CommentsPanel
        post={post}
        open={showComments}
        onClose={() => setShowComments(false)}
        addComment={addComment}
        getComments={getComments}
        joinPost={joinPost}
        likeComment={likeComment}
        unlikeComment={unlikeComment}
      />

      <NewChatDialog
        open={shareDialogOpen}
        onClose={() => setShareDialogOpen(false)}
        onSelectUser={(u) => handleShareToContact(u)}
        currentUserId={auth?._id}
        shareUrl={shareUrl}
      />
    </>
  )
}
