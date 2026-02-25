import { useState, useEffect, useCallback, useRef } from 'react'
import { io } from 'socket.io-client'
import feedService from '../services/feedAndMultimedia'

const isVideoPost = (post) => {
  if (!post) return false
  if (post.type === 'video') return true
  const url = post.multimediaUrl || ''
  return /\.(mp4|webm|ogg|mov|mkv)(\?|$)/i.test(url)
}

export default function useVideos() {
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const socketRef = useRef(null)

  const mergePosts = (existing = [], incoming = []) => {
    const map = new Map()
    ;(incoming || []).forEach((p) => {
      if (!p || !p._id) return
      map.set(p._id, p)
    })
    ;(existing || []).forEach((p) => {
      if (!p || !p._id) return
      if (!map.has(p._id)) {
        map.set(p._id, p)
      } else {
        const inc = map.get(p._id) || {}
        const merged = Object.assign({}, inc)
        if (!inc.multimediaUrl && p.multimediaUrl) merged.multimediaUrl = p.multimediaUrl
        if (!inc.thumbnailUrl && p.thumbnailUrl) merged.thumbnailUrl = p.thumbnailUrl
        if (!inc.authorFirstName && p.authorFirstName) merged.authorFirstName = p.authorFirstName
        if (!inc.authorLastName && p.authorLastName) merged.authorLastName = p.authorLastName
        if ((inc.likesCount === undefined || inc.likesCount === null) && p.likesCount !== undefined) merged.likesCount = p.likesCount
        if (!inc.likes && Array.isArray(p.likes)) merged.likes = p.likes
        map.set(p._id, merged)
      }
    })
    const arr = Array.from(map.values()).filter(isVideoPost)
    arr.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    return arr
  }

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await feedService.getVideoFeed()
      const data = res.data || []
      setVideos(data.filter(isVideoPost))
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Error al cargar videos')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  // Real-time socket updates — reuse /feed namespace
  useEffect(() => {
    const rawSocketUrl = process.env.REACT_APP_SOCKET_URL || (typeof window !== 'undefined' ? (() => {
      try {
        if (window.location && window.location.hostname && window.location.port === '3000') {
          return `${window.location.protocol}//${window.location.hostname}:4000`
        }
      } catch (_) {}
      return window.location.origin
    })() : '')
    const socketBase = String(rawSocketUrl).replace(/\/$/, '')
    const socket = io(`${socketBase}/feed`, {
      withCredentials: true,
      autoConnect: false,
    })
    socketRef.current = socket

    socket.on('postCreated', (payload) => {
      if (!payload || !payload._id || !isVideoPost(payload)) return
      setVideos((prev) => mergePosts(prev, [payload]))
    })

    socket.on('postUpdated', (payload) => {
      if (!payload || !payload._id) return
      setVideos((prev) => {
        // if it was a video and still is, update; if no longer video remove it
        const exists = prev.some((p) => p._id === payload._id)
        if (!exists && !isVideoPost(payload)) return prev
        if (isVideoPost(payload)) return mergePosts(prev, [payload])
        return prev.filter((p) => p._id !== payload._id)
      })
    })

    socket.on('postDeleted', (payload) => {
      if (!payload || !payload._id) return
      setVideos((prev) => prev.filter((p) => p._id !== payload._id))
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

  const likeVideo = async (postId) => {
    try {
      const res = await feedService.likePost(postId)
      const updated = res?.data || res
      setVideos((prev) => mergePosts(prev, [updated]))
      return updated
    } catch (err) { throw err }
  }

  const unlikeVideo = async (postId) => {
    try {
      const res = await feedService.unlikePost(postId)
      const updated = res?.data || res
      setVideos((prev) => mergePosts(prev, [updated]))
      return updated
    } catch (err) { throw err }
  }

  const viewVideo = async (postId) => {
    try {
      const res = await feedService.viewPost(postId)
      const updated = res?.data || res
      setVideos((prev) => mergePosts(prev, [updated]))
      return updated
    } catch (err) { throw err }
  }

  const shareVideo = async (postId) => {
    try {
      const res = await feedService.sharePost(postId)
      const updated = res?.data || res
      setVideos((prev) => mergePosts(prev, [updated]))
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
    videos,
    loading,
    error,
    reload: load,
    likeVideo,
    unlikeVideo,
    viewVideo,
    shareVideo,
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
