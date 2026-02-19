import { useState, useEffect, useRef, useContext } from 'react';
import { io } from 'socket.io-client';
import MessagesAndMultimedia from '../services/messagesAndMultimedia';
import { AuthContext } from './AuthContext';

/**
 * Hook to manage messages + realtime subscription.
 * - Uses `MessagesAndMultimedia` service for all HTTP calls (no direct axios here).
 * - Manages Socket.IO connection, reconnection and events.
 * Events handled:
 *  - 'receiveMessage' : incoming message for the current user/chat
 *  - 'messageSent' : acknowledgement delivered to sender sockets
 */
export default function useMessagesAndMultimedia() {
	const { auth } = useContext(AuthContext);
	const [messages, setMessages] = useState([]);
	const [connected, setConnected] = useState(false);
	const [error, setError] = useState(null);
	const socketRef = useRef(null);

	useEffect(() => {
		// connect to the backend namespace for messages
		// Prefer explicit env `REACT_APP_SOCKET_URL`. If missing and running the
		// CRA dev server (port 3000), default to backend on port 4000 so the
		// client doesn't try to open a socket on the frontend dev server.
		const rawSocketUrl = process.env.REACT_APP_SOCKET_URL || (typeof window !== 'undefined' ? (() => {
			try {
				if (window.location && window.location.hostname && window.location.port === '3000') {
					return `${window.location.protocol}//${window.location.hostname}:4000`;
				}
			} catch (_) {}
			return window.location.origin;
		})() : '');
		const socketBase = String(rawSocketUrl).replace(/\/$/, '');
		const socket = io(`${socketBase}/messages`, {
			withCredentials: true,
			autoConnect: true,
			transports: ['websocket', 'polling'],
			// enable automatic reconnection
			reconnection: true,
			reconnectionAttempts: Infinity,
			reconnectionDelayMax: 5000,
		});
		socketRef.current = socket;

		socket.on('connect', () => {
			setConnected(true);
			setError(null);
		});

		socket.on('disconnect', (reason) => {
			setConnected(false);
		});

		socket.on('receiveMessage', (payload) => {
			// prepend to messages list if not already present (avoid duplicates from fetch + socket)
			setMessages(prev => {
				if (!payload || !payload._id) return prev;
				if (prev.some(m => m._id === payload._id)) return prev;
				return [payload, ...prev];
			});
		});

		socket.on('messageSent', (payload) => {
			// sender receives messageSent; avoid duplicate entries
			setMessages(prev => {
				if (!payload || !payload._id) return prev;
				if (prev.some(m => m._id === payload._id)) return prev;
				return [payload, ...prev];
			});
		});

		socket.on('messageUpdated', (payload) => {
			// replace existing message by _id or prepend if missing
			setMessages(prev => {
				if (!payload || !payload._id) return prev;
				const idx = prev.findIndex(m => m._id === payload._id);
				if (idx === -1) return [payload, ...prev];
				const copy = [...prev];
				copy[idx] = Object.assign({}, copy[idx], payload);
				return copy;
			});
		});

		socket.on('error', (err) => {
			try { setError(err?.message || JSON.stringify(err)); } catch (_) { setError(String(err)); }
		});

		socket.on('connect_error', (err) => {
			try { setError(err?.message || 'Socket connect_error'); } catch (_) { setError('Socket connect_error'); }
		});

		return () => {
			try { socket.disconnect(); } catch (_) {}
			socketRef.current = null;
		};
	}, []);

	// Fetch messages for current user
	const fetchMyMessages = async () => {
		try {
			const resp = await MessagesAndMultimedia.getMyMessages();
			const data = resp?.data;
			// backend returns data in { data: [...] } or similar patterns
			let list = [];
			if (data && data.data && Array.isArray(data.data)) list = data.data;
			else if (Array.isArray(data)) list = data;
			// normalize & dedupe by _id (server may return duplicates in some edge cases)
			if (Array.isArray(list) && list.length > 0) {
				const map = new Map();
				for (const it of list) {
					if (it && it._id) map.set(it._id, it);
				}
				setMessages(Array.from(map.values()));
			} else {
				setMessages([]);
			}
			return resp;
		} catch (err) {
			setError(err.message || String(err));
			return null;
		}
	};

	// Create a message (text or metadata-only). Service handles validation + backend emission.
	const createMessage = async (dto) => {
		try {
			if (!auth || !auth._id) {
				setError('Usuario no autenticado');
				return null;
			}
			const payload = Object.assign({}, dto, { senderId: dto?.senderId || auth._id });
			if (!payload.receiverId) {
				setError('receiverId es requerido');
				return null;
			}
			const resp = await MessagesAndMultimedia.createMessage(payload);
			return resp;
		} catch (err) {
			setError(err.message || String(err));
			return null;
		}
	};

	// Upload a file and create message. Accepts File and dto fields.
	const uploadMessage = async (file, dto = {}) => {
		try {
			if (!auth || !auth._id) {
				setError('Usuario no autenticado');
				return null;
			}
			const payload = Object.assign({}, dto, { senderId: dto?.senderId || auth._id });
			if (!payload.receiverId) {
				setError('receiverId es requerido');
				return null;
			}
			const resp = await MessagesAndMultimedia.uploadMessage(file, payload);
			return resp;
		} catch (err) {
			setError(err.message || String(err));
			return null;
		}
	};

	// Join a chat room with another user (server will add socket to chat:<a-b>)
	const joinChat = (otherUserId) => {
		try {
			socketRef.current?.emit('joinChat', { otherUserId });
		} catch (err) {
			setError(err?.message || String(err));
		}
	};

	const disconnect = () => {
		try { socketRef.current?.disconnect(); } catch (_) {}
	};

	const connect = () => {
		try { socketRef.current?.connect(); } catch (_) {}
	};

	return {
		messages,
		connected,
		error,
		fetchMyMessages,
		createMessage,
		uploadMessage,
		joinChat,
		connect,
		disconnect,
	};
}
