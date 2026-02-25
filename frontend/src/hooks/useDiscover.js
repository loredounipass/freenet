import { useState, useEffect, useCallback, useRef } from 'react'
import { io } from 'socket.io-client'
import feedService from '../services/feedAndMultimedia'
import { apiOrigin } from '../api/http'

/* ── helpers ── */
function resolveUrl(u) {
  if (!u) return null
  try {
    if (/^https?:\/\//i.test(u)) return u
    if (u.startsWith('/')) return `${apiOrigin}${u}`
    return u
  } catch (_) { return u }
}

export function isMediaPost(post) {
  if (!post) return false

  // If post has an explicit type field
  if (post.type === 'image' || post.type === 'video') return true

  // Check multimedia mimetype
  const mime = post.multimedia?.mimetype || ''
  if (mime.startsWith('image/') || mime.startsWith('video/')) return true

  // Check URL patterns
  const url = resolveUrl(post.multimediaUrl) || resolveUrl(post.thumbnailUrl) || ''
  if (/\.(jpg|jpeg|png|gif|webp|avif|svg)(\\?|$)/i.test(url)) return true
  if (/\.(mp4|webm|ogg|mov|mkv)(\\?|$)/i.test(url)) return true

  // Fall back: if post has a multimediaUrl at all it's visual media
  if (post.multimediaUrl || post.thumbnailUrl) return true

  return false
}

export function isVideoPost(post) {
  if (!post) return false
  if (post.type === 'video') return true
  const mime = post.multimedia?.mimetype || ''
  if (mime.startsWith('video/')) return true
  if (post.multimedia?.duration) return true
  const url = resolveUrl(post.multimediaUrl) || ''
  return /\.(mp4|webm|ogg|mov|mkv)(\?|$)/i.test(url)
}

export default function useDiscover() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const socketRef = useRef(null)

  const mergePosts = (existing = [], incoming = []) => {
    const map = new Map()
    ;(incoming || []).forEach((p) => { if (p && p._id) map.set(p._id, p) })
    ;(existing || []).forEach((p) => {
      if (!p || !p._id) return
      if (!map.has(p._id)) {
        map.set(p._id, p)
      } else {
        const inc = map.get(p._id) || {}
        const merged = { ...inc }
        if (!inc.multimediaUrl && p.multimediaUrl) merged.multimediaUrl = p.multimediaUrl
        if (!inc.thumbnailUrl && p.thumbnailUrl) merged.thumbnailUrl = p.thumbnailUrl
        if (!inc.multimedia && p.multimedia) merged.multimedia = p.multimedia
        if (!inc.authorFirstName && p.authorFirstName) merged.authorFirstName = p.authorFirstName
        if (!inc.authorLastName && p.authorLastName) merged.authorLastName = p.authorLastName
        if (inc.likesCount == null && p.likesCount != null) merged.likesCount = p.likesCount
        if (!inc.likes && Array.isArray(p.likes)) merged.likes = p.likes
        map.set(p._id, merged)
      }
    })
    const arr = Array.from(map.values()).filter(isMediaPost)
    arr.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    return arr
  }

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await feedService.getFeed(200)
      const allPosts = res.data || []
      setItems(allPosts.filter(isMediaPost))
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Error al cargar contenido')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // Real-time socket updates
  useEffect(() => {
    const rawSocketUrl = process.env.REACT_APP_SOCKET_URL || (typeof window !== 'undefined' ? (() => {
      try {
        if (window.location?.hostname && window.location.port === '3000') {
          return `${window.location.protocol}//${window.location.hostname}:4000`
        }
      } catch (_) {}
      return window.location.origin
    })() : '')

    const socketBase = String(rawSocketUrl).replace(/\/$/, '')
    const socket = io(`${socketBase}/feed`, { withCredentials: true, autoConnect: false })
    socketRef.current = socket

    socket.on('postCreated', (payload) => {
      if (!payload?._id || !isMediaPost(payload)) return
      // fetch enriched post if multimedia URL is missing
      if (payload.multimediaId && !payload.multimediaUrl && !payload.thumbnailUrl) {
        feedService.getPostById(payload._id)
          .then((res) => {
            const p = res?.data || res
            if (isMediaPost(p)) setItems((prev) => mergePosts(prev, [p]))
          })
          .catch(() => {})
      } else {
        setItems((prev) => mergePosts(prev, [payload]))
      }
    })

    socket.on('postUpdated', (payload) => {
      if (!payload?._id) return
      setItems((prev) => {
        const filtered = prev.filter((p) => p._id !== payload._id)
        return isMediaPost(payload) ? mergePosts(filtered, [payload]) : filtered
      })
    })

    socket.on('postDeleted', (payload) => {
      if (!payload?._id) return
      setItems((prev) => prev.filter((p) => p._id !== payload._id))
    })

    try { socket.connect() } catch (_) {}

    return () => {
      if (socketRef.current === socket) {
        try { socket.off(); socket.disconnect() } catch (_) {}
        socketRef.current = null
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const likePost = async (postId) => {
    try {
      const res = await feedService.likePost(postId)
      const updated = res?.data || res
      setItems((prev) => mergePosts(prev, [updated]))
      return updated
    } catch (err) { throw err }
  }

  const unlikePost = async (postId) => {
    try {
      const res = await feedService.unlikePost(postId)
      const updated = res?.data || res
      setItems((prev) => mergePosts(prev, [updated]))
      return updated
    } catch (err) { throw err }
  }

  const viewPost = async (postId) => {
    try {
      const res = await feedService.viewPost(postId)
      const updated = res?.data || res
      setItems((prev) => mergePosts(prev, [updated]))
      return updated
    } catch (err) { throw err }
  }

  const sharePost = async (postId) => {
    try {
      const res = await feedService.sharePost(postId)
      const updated = res?.data || res
      setItems((prev) => mergePosts(prev, [updated]))
      return updated
    } catch (err) { throw err }
  }

  const getComments = async (postId) => {
    try {
      const res = await feedService.getComments(postId)
      return res?.data || res
    } catch (err) { throw err }
  }

  const addComment = async (postId, content, parentId) => {
    try {
      const res = await feedService.addComment(postId, content, parentId)
      return res?.data || res
    } catch (err) { throw err }
  }

  return {
    items,
    loading,
    error,
    reload: load,
    likePost,
    unlikePost,
    viewPost,
    sharePost,
    getComments,
    addComment,
    joinPost: (postId) => {
      try {
        if (!socketRef.current) return
        if (socketRef.current.connected) {
          socketRef.current.emit('joinPost', { postId })
        } else {
          socketRef.current.once('connect', () => {
            try { socketRef.current.emit('joinPost', { postId }) } catch (_) {}
          })
        }
      } catch (_) {}
    },
  }
}
