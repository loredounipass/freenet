import React, { useState, useEffect, useRef } from 'react'
import { mediaBase, apiOrigin } from '../../api/http'
import useFeedAndMultimedia from '../../hooks/useFeedAndMultimedia'

export default function FeedItem({ post }) {
  const { likePost, unlikePost, addComment, joinPost, viewPost, getComments } = useFeedAndMultimedia()
  const [liked, setLiked] = useState(false)
  const [localLikes, setLocalLikes] = useState(post ? (post.likesCount || 0) : 0)
  const [showComment, setShowComment] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [comments, setComments] = useState([])
  const [loadingComments, setLoadingComments] = useState(false)
  const containerRef = useRef(null)
  const [viewed, setViewed] = useState(false)

  

  
  
  useEffect(() => {
    if (!post || !post._id || typeof window === 'undefined') return
    const el = containerRef.current
    if (!el || viewed) return
    let obs
    try {
      obs = new IntersectionObserver((entries) => {
        entries.forEach(e => {
            if (e.isIntersecting && e.intersectionRatio > 0.25 && !viewed) {
            try { viewPost(post._id).catch(() => {}) } catch(_){ }
            setViewed(true)
          }
        })
      }, { threshold: [0.25, 0.5, 1] })
      obs.observe(el)
    } catch (_) {}
    return () => { try { if (obs && el) obs.unobserve(el) } catch(_){} }
  }, [post, viewed, viewPost])

  useEffect(() => {
    if (!showComment) return
    let mounted = true
    joinPost(post._id)
    const load = async () => {
      setLoadingComments(true)
      try {
        const data = await getComments(post._id)
        if (mounted) setComments(Array.isArray(data) ? data : [])
      } catch (_) { if (mounted) setComments([]) }
      finally { if (mounted) setLoadingComments(false) }
    }
    load()
    return () => { mounted = false }
  }, [showComment, post, joinPost, getComments])

  if (!post) return null
  const { description, multimedia, author, createdAt, thumbnailUrl, multimediaUrl, commentsCount, views } = post

  // prefer provided multimediaUrl or thumbnailUrl
  const meta = post.multimedia || {}
  const resolveUrl = (u) => {
    if (!u) return null
    try {
      if (/^https?:\/\//i.test(u)) return u
      if (u.startsWith('/')) return `${apiOrigin}${u}`
      return u
    } catch (_) { return u }
  }
  const mediaUrl = resolveUrl(multimediaUrl) || resolveUrl(thumbnailUrl) || (multimedia && multimedia.filename ? `${mediaBase}/${multimedia.filename}` : null)

  const isVideo = (() => {
    if (!mediaUrl) return false
    if (meta && meta.duration) return true
    if (multimedia && multimedia.mimetype && multimedia.mimetype.startsWith && multimedia.mimetype.startsWith('video/')) return true
    try {
      return !!mediaUrl.match(/\.(mp4|webm|ogg|mov|mkv)(\?|$)/i)
    } catch (_){ return false }
  })()

  return (
    <div className="fb-card mb-4">
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="fb-author">{author?.username || 'Usuario'}</div>
          <div className="fb-time">{createdAt ? new Date(createdAt).toLocaleString() : ''}</div>
        </div>
        <div className="fb-desc">{description}</div>
      </div>
      {mediaUrl && (
        <div className="fb-media" ref={containerRef}>
            {isVideo ? (
            <video onPlay={() => { if (!viewed) { try { viewPost(post._id).catch(() => {}) } catch(_){ } setViewed(true) } }} controls className="w-full max-h-96 mx-auto h-auto object-contain" poster={resolveUrl(thumbnailUrl)}>
              <source src={mediaUrl} type={(multimedia && multimedia.mimetype) || 'video/mp4'} />
              Tu navegador no soporta la etiqueta de video.
            </video>
          ) : (
            <img src={mediaUrl} alt="media" className="w-full max-h-80 mx-auto h-auto object-contain" />
          )}
        </div>
      )}
      <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
        <div>
          {localLikes ? `${localLikes} ${localLikes === 1 ? 'like' : 'likes'}` : '0 likes'}
        </div>
        <div>{commentsCount ? `${commentsCount} ${commentsCount === 1 ? 'comentario' : 'comentarios'}` : '0 comentarios'}</div>
        <div>{(typeof views === 'number' ? views : 0) ? `${views} ${views === 1 ? 'vista' : 'vistas'}` : '0 vistas'}</div>
      </div>
      <div className="p-3 flex items-center space-x-3">
        <button onClick={async () => {
          try {
            if (!liked) {
              const res = await likePost(post._id)
              const updated = (res && res.data) ? res.data : res
              setLocalLikes(updated.likesCount || (localLikes + 1))
              setLiked(true)
            } else {
              const res = await unlikePost(post._id)
              const updated = (res && res.data) ? res.data : res
              setLocalLikes(updated.likesCount || Math.max(0, localLikes - 1))
              setLiked(false)
            }
          } catch (_) {}
        }} className="btn-like">
          {liked ? 'Unlike' : 'Like'}
        </button>

        <button onClick={() => setShowComment(s => !s)} className="btn-comment">Comentar</button>
      </div>
      {showComment && (
        <div className="p-3">
          <div className="mb-2">
            {loadingComments && <div className="text-sm text-gray-500">Cargando comentarios...</div>}
            {!loadingComments && comments && comments.length === 0 && <div className="text-sm text-gray-500">No hay comentarios aún.</div>}
            {!loadingComments && comments && comments.map(c => (
              <div key={c._id} className="mb-2 border-b pb-2">
                <div className="text-sm font-semibold">{c.author}</div>
                <div className="text-sm">{c.content}</div>
                <div className="text-xs text-gray-400">{new Date(c.createdAt).toLocaleString()}</div>
              </div>
            ))}
          </div>

          <textarea value={commentText} onChange={(e) => setCommentText(e.target.value)} className="w-full mb-2" rows={3} />
          <div className="flex space-x-2">
            <button onClick={async () => {
              try {
                if (!commentText) return
                await addComment(post._id, commentText)
                setCommentText('')
                setShowComment(false)
              } catch (_) {}
            }} className="btn-primary">Publicar</button>
            <button onClick={() => { setCommentText(''); setShowComment(false) }} className="btn-secondary">Cancelar</button>
          </div>
        </div>
      )}
      {meta && (meta.width || meta.height || meta.duration || meta.size) && (
        <div className="p-3 text-xs text-gray-500 dark:text-gray-400">
          {meta.width && meta.height && <span className="mr-3">Resolución: {meta.width}x{meta.height}</span>}
          {meta.duration && <span className="mr-3">Duración: {Math.round(meta.duration)}s</span>}
          {meta.size && <span>Tamaño: {Math.round(meta.size/1024)} KB</span>}
        </div>
      )}
    </div>
  )
}
