import { useState, useEffect, useCallback, useRef, useContext } from 'react'
import { io } from 'socket.io-client'
import feedService from '../services/feedAndMultimedia'
import { AuthContext } from './AuthContext'

export default function useFeedAndMultimedia() {
	useContext(AuthContext)
	const [posts, setPosts] = useState([])
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState(null)
	const socketRef = useRef(null)

	const mergePosts = (existing = [], incoming = []) => {
		const map = new Map()
		// insert incoming first, but merge with existing to preserve media/author fields if missing
		;(incoming || []).forEach((p) => {
			if (!p || !p._id) return
			map.set(p._id, p)
		})
		;(existing || []).forEach((p) => {
			if (!p || !p._id) return
			if (!map.has(p._id)) {
				map.set(p._id, p)
			} else {
				// merge: prefer incoming values, but keep multimedia/author fields from existing if incoming lacks them
				const inc = map.get(p._id) || {}
				const merged = Object.assign({}, inc)
				if (!inc.multimediaUrl && p.multimediaUrl) merged.multimediaUrl = p.multimediaUrl
				if (!inc.thumbnailUrl && p.thumbnailUrl) merged.thumbnailUrl = p.thumbnailUrl
				if (!inc.multimedia && p.multimedia) merged.multimedia = p.multimedia
				if (!inc.authorFirstName && p.authorFirstName) merged.authorFirstName = p.authorFirstName
				if (!inc.authorLastName && p.authorLastName) merged.authorLastName = p.authorLastName
				if ((inc.likesCount === undefined || inc.likesCount === null) && (p.likesCount !== undefined)) merged.likesCount = p.likesCount
				if ((inc.commentsCount === undefined || inc.commentsCount === null) && (p.commentsCount !== undefined)) merged.commentsCount = p.commentsCount
				// preserve likes array from existing post when incoming payload omits it
				if (!inc.likes && Array.isArray(p.likes)) merged.likes = p.likes
				map.set(p._id, merged)
			}
		})
		const arr = Array.from(map.values())
		arr.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
		return arr
	}

	const getErrMsg = (err) => {
		try { return err?.response?.data?.message || err?.message || JSON.stringify(err) } catch (_) { return String(err) }
	}

	const loadMyPosts = useCallback(async (limit = 50) => {
		setLoading(true)
		setError(null)
		try {
			const res = await feedService.getFeed(limit)
			setPosts(res.data || [])
		} catch (err) {
			setError(err)
		} finally {
			setLoading(false)
		}
	}, [])

	useEffect(() => {
		loadMyPosts()
	}, [loadMyPosts])

	useEffect(() => {
		// establish socket connection to /feed namespace once on mount
		const rawSocketUrl = process.env.REACT_APP_SOCKET_URL || (typeof window !== 'undefined' ? (() => {
			try {
				if (window.location && window.location.hostname && window.location.port === '3000') {
					return `${window.location.protocol}//${window.location.hostname}:4000`;
				}
			} catch (_) {}
			return window.location.origin;
		})() : '');
		const socketBase = String(rawSocketUrl).replace(/\/$/, '');
		const socket = io(`${socketBase}/feed`, {
			withCredentials: true,
			autoConnect: false,
			// let Socket.IO negotiate transports (prefer websockets in production)
		});
		socketRef.current = socket;

		socket.on('connect', () => {})
		socket.on('disconnect', () => {})
		socket.on('connect_error', (err) => { try { setError(getErrMsg(err)) } catch (_) {} })

		socket.on('postCreated', (payload) => {
			if (!payload || !payload._id) return
			// if payload lacks multimedia details, fetch enriched post
			if (payload.multimediaId && !payload.multimediaUrl && !payload.thumbnailUrl) {
				try {
					feedService.getPostById(payload._id).then((res) => {
						const created = (res && res.data) ? res.data : res
						setPosts(prev => mergePosts(prev, [created]))
					}).catch(() => setPosts(prev => mergePosts(prev, [payload])))
				} catch (_) { setPosts(prev => mergePosts(prev, [payload])) }
			} else {
				setPosts(prev => mergePosts(prev, [payload]))
			}
		})

		socket.on('commentCreated', (payload) => {
			if (!payload || !payload.post) return
			// refresh the related post to update counts
			try {
				feedService.getPostById(payload.post).then((res) => {
					const updated = (res && res.data) ? res.data : res
					setPosts(prev => mergePosts(prev, [updated]))
				}).catch(() => {})
			} catch (_) {}
		})

		socket.on('postUpdated', (payload) => {
			if (!payload || !payload._id) return
			// prefer server-sent payload, but if it lacks multimedia metadata fetch full post
			if (payload.multimediaId && !payload.multimediaUrl && !payload.thumbnailUrl) {
				try {
					feedService.getPostById(payload._id).then((res) => {
						const updated = (res && res.data) ? res.data : res
						setPosts(prev => mergePosts(prev, [updated]))
					}).catch(() => setPosts(prev => mergePosts(prev, [payload])))
				} catch (_) { setPosts(prev => mergePosts(prev, [payload])) }
			} else {
				setPosts(prev => mergePosts(prev, [payload]))
			}
		})

		socket.on('postDeleted', (payload) => {
			if (!payload || !payload._id) return
			setPosts(prev => prev.filter(p => p._id !== payload._id))
		})

		socket.on('error', () => {})

		try { socket.connect() } catch (_) {}

		return () => {
			if (socketRef.current === socket) {
				try { socket.off(); socket.disconnect(); } catch (_) {}
				socketRef.current = null
			}
		}
	}, [])

	const createPost = async (dto) => {
		setLoading(true)
		try {
			const res = await feedService.createPost(dto)
			const created = (res && res.data) ? res.data : res
			setPosts(prev => mergePosts(prev, [created]))
			return res
		} catch (err) {
			const msg = getErrMsg(err)
			setError(msg)
			throw err
		} finally {
			setLoading(false)
		}
	}

	const createPostWithFile = async ({ file, description, type }) => {
		setLoading(true)
		try {
			const res = await feedService.createPostWithFile({ file, description, type })
			const created = (res && res.data) ? res.data : res
			setPosts(prev => mergePosts(prev, [created]))
			return res
		} catch (err) {
			const msg = getErrMsg(err)
			setError(msg)
			throw err
		} finally {
			setLoading(false)
		}
	}

	const addComment = async (postId, content, parentId) => {
		try {
			const res = await feedService.addComment(postId, content, parentId)
			const created = (res && res.data) ? res.data : res
			// optimistic: refresh the post to update counts
			try { const p = await feedService.getPostById(postId); const postObj = p && p.data ? p.data : p; setPosts(prev => mergePosts(prev, [postObj])); } catch(_){ }
			return created
		} catch (err) { throw err }
	}

	const likePost = async (postId) => {
		try {
			const res = await feedService.likePost(postId)
			const updated = (res && res.data) ? res.data : res
			setPosts(prev => mergePosts(prev, [updated]))
			return updated
		} catch (err) { throw err }
	}

	const likeComment = async (commentId, postId) => {
		try {
			const res = await feedService.likeComment(commentId)
			const updated = (res && res.data) ? res.data : res
			// refresh the related post to update counts / UI
			try { const p = await feedService.getPostById(postId); const postObj = p && p.data ? p.data : p; setPosts(prev => mergePosts(prev, [postObj])); } catch(_){}
			return updated
		} catch (err) { throw err }
	}

	const unlikeComment = async (commentId, postId) => {
		try {
			const res = await feedService.unlikeComment(commentId)
			const updated = (res && res.data) ? res.data : res
			try { const p = await feedService.getPostById(postId); const postObj = p && p.data ? p.data : p; setPosts(prev => mergePosts(prev, [postObj])); } catch(_){}
			return updated
		} catch (err) { throw err }
	}

	const unlikePost = async (postId) => {
		try {
			const res = await feedService.unlikePost(postId)
			const updated = (res && res.data) ? res.data : res
			setPosts(prev => mergePosts(prev, [updated]))
			return updated
		} catch (err) { throw err }
	}

	const viewPost = async (postId) => {
		try {
			const res = await feedService.viewPost(postId)
			const updated = (res && res.data) ? res.data : res
			setPosts(prev => mergePosts(prev, [updated]))
			return updated
		} catch (err) { throw err }
	}

	const sharePost = async (postId) => {
		try {
			const res = await feedService.sharePost(postId)
			const updated = (res && res.data) ? res.data : res
			setPosts(prev => mergePosts(prev, [updated]))
			return updated
		} catch (err) { throw err }
	}

	const getComments = async (postId) => {
		try {
			const res = await feedService.getComments(postId)
			return (res && res.data) ? res.data : res
		} catch (err) { throw err }
	}

	return {
		posts,
		loading,
		error,
		loadMyPosts,
		createPost,
		createPostWithFile,
		addComment,
		likePost,
		unlikePost,
		likeComment,
		unlikeComment,
		joinPost: (postId) => {
			try {
				if (!socketRef.current) return
				if (socketRef.current.connected) {
					socketRef.current.emit('joinPost', { postId })
				} else {
					socketRef.current.once('connect', () => { try { socketRef.current.emit('joinPost', { postId }) } catch(_){} })
				}
			} catch (_) {}
		},
		viewPost,
		sharePost,
		getComments,
	}
}
