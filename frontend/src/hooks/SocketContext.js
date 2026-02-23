/**
 * SocketContext — singleton Socket.IO connection for the /messages namespace.
 *
 * Wraps the entire app so that ConversationList, ChatView, and any other
 * consumers all share ONE socket. This prevents the connect→disconnect→connect
 * loop that happens when each component creates its own connection.
 */
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { AuthContext } from './AuthContext';

export const SocketContext = createContext(null);

/** Resolves the socket base URL (same logic that was in the hook). */
function resolveSocketUrl() {
  const envUrl = process.env.REACT_APP_SOCKET_URL;
  if (envUrl) return String(envUrl).replace(/\/$/, '');

  if (typeof window !== 'undefined') {
    try {
      if (window.location.port === '3000') {
        return `${window.location.protocol}//${window.location.hostname}:4000`;
      }
    } catch (_) {}
    return window.location.origin;
  }
  return '';
}

export function SocketProvider({ children }) {
  const { auth } = useContext(AuthContext);
  const socketRef      = useRef(null);
  const [connected, setConnected] = useState(false);
  const [messages, setMessages]   = useState([]);

  /* ── Create the socket once (or when auth token changes) ──────── */
  useEffect(() => {
    const base = resolveSocketUrl();
    const socket = io(`${base}/messages`, {
      withCredentials: true,
      autoConnect: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });
    socketRef.current = socket;

    socket.on('connect',    () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    const addOrUpdate = (payload) => {
      if (!payload || !payload._id) return;
      setMessages(prev => {
        const idx = prev.findIndex(m => m._id === payload._id);
        if (idx === -1) return [payload, ...prev];
        const copy = [...prev];
        copy[idx] = { ...copy[idx], ...payload };
        return copy;
      });
    };

    socket.on('receiveMessage', addOrUpdate);
    socket.on('messageSent',    addOrUpdate);
    socket.on('messageUpdated', addOrUpdate);

    return () => {
      try { socket.disconnect(); } catch (_) {}
      socketRef.current = null;
    };
    // Deliberately run once — auth._id shouldn't change during a session
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Stable helpers exposed to consumers ─────────────────────── */
  const joinChat = (otherUserId) => {
    try { socketRef.current?.emit('joinChat', { otherUserId }); } catch (_) {}
  };

  const setMessagesExternal = (updater) => setMessages(updater);

  return (
    <SocketContext.Provider value={{ connected, messages, setMessages: setMessagesExternal, joinChat, socketRef }}>
      {children}
    </SocketContext.Provider>
  );
}

/** Convenience hook for consumers. */
export function useSocket() {
  return useContext(SocketContext);
}
