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
		;(incoming || []).forEach((p) => { if (p && p._id) map.set(p._id, p) })
		;(existing || []).forEach((p) => { if (p && p._id && !map.has(p._id)) map.set(p._id, p) })
		const arr = Array.from(map.values())
		arr.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
		return arr
	}

	const getErrMsg = (err) => {
		try { return err?.response?.data?.message || err?.message || JSON.stringify(err) } catch (_) { return String(err) }
	}

	const loadMyPosts = useCallback(async () => {
		setLoading(true)
		setError(null)
		try {
			const res = await feedService.getMyPosts()
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
			setPosts(prev => mergePosts(prev, [payload]))
		})

		socket.on('postUpdated', (payload) => {
			if (!payload || !payload._id) return
			setPosts(prev => mergePosts(prev, [payload]))
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

	return {
		posts,
		loading,
		error,
		loadMyPosts,
		createPost,
		createPostWithFile,
	}
}
