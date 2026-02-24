import React, { useState, useEffect, useRef, useContext } from 'react'
import { AuthContext } from '../../hooks/AuthContext'

/* ── helpers ── */
function initials(name) {
  if (!name) return '?'
  const p = name.trim().split(' ')
  return p.length >= 2
    ? (p[0][0] + p[p.length - 1][0]).toUpperCase()
    : name[0].toUpperCase()
}

function relativeTime(dateStr) {
  if (!dateStr) return ''
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000
  if (diff < 60)   return 'ahora mismo'
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`
  return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

/* ── component ── */
export default function CommentsPanel({ post, open, onClose, addComment, getComments, joinPost, likeComment, unlikeComment }) {
  const { auth } = useContext(AuthContext)
  const [comments, setComments]           = useState([])
  const [loading, setLoading]             = useState(false)
  const [text, setText]                   = useState('')
  const [submitting, setSubmitting]       = useState(false)
  const [error, setError]                 = useState(null)
  const [replyTo, setReplyTo]             = useState(null)
  // optimistic like state updater
  const toggleLike = async (comment) => {
    if (!auth || !auth._id) return
    const meId = String(auth._id)
    const liked = Array.isArray(comment.likes) && comment.likes.includes(meId)
    // optimistic update
    setComments(prev => prev.map(c => c._id === comment._id ? ({ ...c, likesCount: (c.likesCount || 0) + (liked ? -1 : 1), likes: liked ? (Array.isArray(c.likes) ? c.likes.filter(id => id !== meId) : []) : ([...(Array.isArray(c.likes) ? c.likes : []), meId]) }) : c))
    try {
      if (liked) {
        if (typeof unlikeComment === 'function') await unlikeComment(comment._id, post._id)
      } else {
        if (typeof likeComment === 'function') await likeComment(comment._id, post._id)
      }
    } catch (err) {
      // revert on error
      try { const fresh = await getComments(post._id); setComments(Array.isArray(fresh) ? fresh : []) } catch (_) {}
    }
  }
  const bottomRef   = useRef(null)
  const inputRef    = useRef(null)
  const panelRef    = useRef(null)

  /* lock body scroll while open */
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
      inputRef.current?.focus()
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  /* load comments whenever the panel opens */
  useEffect(() => {
    if (!open || !post?._id) return
    let mounted = true
    if (typeof joinPost === 'function') {
      try { joinPost(post._id) } catch (_) {}
    }
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await getComments(post._id)
        if (mounted) setComments(Array.isArray(data) ? data : [])
      } catch (e) {
        if (mounted) setError('No se pudieron cargar los comentarios.')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [open, post, getComments, joinPost])

  /* scroll to bottom when comments arrive */
  useEffect(() => {
    if (open && comments.length > 0) {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 80)
    }
  }, [comments, open])

  /* close on Escape */
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!text.trim()) return
    setSubmitting(true)
    setError(null)
    try {
      const newComment = await addComment(post._id, text.trim(), replyTo?.id)
      setText('')
      setReplyTo(null)
      /* optimistic: append & then reload */
      const candidate = {
        _id: newComment?._id || Date.now().toString(),
        content: text.trim(),
        authorFirstName: auth?.firstName || '',
        authorLastName:  auth?.lastName  || '',
        author: auth?.username || 'Tú',
        parent: newComment?.parent || replyTo?.id || undefined,
        createdAt: new Date().toISOString(),
      }
      setComments(prev => [...prev, candidate])
      /* re-fetch for canonical data */
      try {
        const fresh = await getComments(post._id)
        setComments(Array.isArray(fresh) ? fresh : [candidate])
      } catch (_) {}
    } catch (e) {
      setError('No se pudo publicar el comentario.')
    } finally {
      setSubmitting(false)
      inputRef.current?.focus()
    }
  }

  const postAuthor = post
    ? ((post.authorFirstName || post.authorLastName)
        ? `${post.authorFirstName || ''} ${post.authorLastName || ''}`.trim()
        : post.author?.username || 'Usuario')
    : ''

  return (
    <>
      {/* ── Backdrop ── */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 400,
          background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(3px)',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity 240ms ease',
        }}
      />

      {/* ── Panel ── */}
      <div
        ref={panelRef}
        style={{
          position: 'fixed',
          top: 0, right: 0, bottom: 0,
          width: '100%', maxWidth: '440px',
          zIndex: 500,
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(180deg, #0d1720 0%, #081018 100%)',
          borderLeft: '1px solid rgba(255,255,255,0.07)',
          boxShadow: '-12px 0 48px rgba(0,0,0,0.55)',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 280ms cubic-bezier(0.32,0.72,0,1)',
        }}
      >
        {/* ── Panel header ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '1rem 1.25rem',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          flexShrink: 0,
        }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#e6eef5' }}>
              Comentarios
            </div>
            {postAuthor && (
              <div style={{ fontSize: '0.8rem', color: '#9fb7c3', marginTop: '2px' }}>
                Publicación de <span style={{ color: '#22c1c3', fontWeight: 600 }}>{postAuthor}</span>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '10px',
              width: '36px', height: '36px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: '#9fb7c3',
              transition: 'background 150ms ease, color 150ms ease',
              fontSize: '1.1rem', lineHeight: 1,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.10)'; e.currentTarget.style.color = '#e6eef5' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#9fb7c3' }}
          >
            ✕
          </button>
        </div>

        {/* ── Post snippet ── */}
        {post?.description && (
          <div style={{
            padding: '0.75rem 1.25rem',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            background: 'rgba(0,0,0,0.15)',
            flexShrink: 0,
          }}>
            <p style={{
              margin: 0, fontSize: '0.9rem',
              color: '#b8cdd8', lineHeight: 1.5,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}>
              {post.description}
            </p>
          </div>
        )}

        {/* ── Comments list ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem 1.25rem' }}>
          {loading && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.6rem',
              padding: '2rem 0', color: '#9fb7c3', fontSize: '0.9rem',
            }}>
              <span style={{
                width: 18, height: 18, borderRadius: '50%',
                border: '2px solid rgba(34,193,195,0.25)',
                borderTopColor: '#22c1c3',
                animation: 'fn-spin 0.9s linear infinite',
                display: 'inline-block',
              }} />
              Cargando comentarios…
            </div>
          )}

          {!loading && error && (
            <div style={{
              margin: '1rem 0', padding: '0.75rem 1rem',
              background: 'rgba(255,80,80,0.08)',
              border: '1px solid rgba(255,80,80,0.15)',
              borderRadius: '10px', color: '#ff9b9b', fontSize: '0.88rem',
            }}>
              {error}
            </div>
          )}

          {!loading && !error && comments.length === 0 && (
            <div style={{
              textAlign: 'center', padding: '3rem 1rem',
              color: '#9fb7c3',
            }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>💬</div>
              <div style={{ fontWeight: 600, marginBottom: '0.25rem', color: '#e6eef5' }}>
                Sin comentarios aún
              </div>
              <div style={{ fontSize: '0.88rem' }}>
                Sé el primero en comentar esta publicación.
              </div>
            </div>
          )}

          {!loading && comments.map((c, i) => {
            const name = (c.authorFirstName || c.authorLastName)
              ? `${c.authorFirstName || ''} ${c.authorLastName || ''}`.trim()
              : (c.author || 'Usuario')
            return (
              <div
                key={c._id || i}
                style={{
                  display: 'flex', gap: '0.75rem', alignItems: 'flex-start',
                  padding: '0.7rem 0',
                  borderBottom: i < comments.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                  animation: 'fb-comment-in 200ms ease',
                }}
              >
                {/* Avatar */}
                <div style={{
                  width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                  background: 'linear-gradient(135deg,#22c1c3,#1e90ff)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: '0.85rem', color: '#04111a',
                }}>
                  {initials(name)}
                </div>

                {/* Bubble */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '12px 12px 12px 4px',
                    padding: '0.6rem 0.85rem',
                  }}>
                    <div style={{
                      fontWeight: 700, fontSize: '0.83rem',
                      color: '#e6eef5', marginBottom: '2px',
                    }}>
                      {name}
                    </div>
                    <div style={{
                      fontSize: '0.9rem', color: '#ccdde8',
                      lineHeight: 1.45, wordBreak: 'break-word'
                    }}>
                      {c.parent && c.parentAuthorName
                        ? <div style={{ color: '#9fb7c3', marginBottom: '4px', marginLeft: '4px' }}>@{c.parentAuthorName}</div>
                        : null}
                      <div style={{ marginLeft: c.parent ? '8px' : 0 }}>{c.content}</div>
                    </div>
                  </div>
                  <div style={{
                    fontSize: '0.72rem', color: '#6f8a96',
                    marginTop: '4px', paddingLeft: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.6rem'
                  }}>
                    <div style={{ flex: 1 }}>{relativeTime(c.createdAt)}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <button
                        type="button"
                        onClick={() => { setReplyTo({ id: c._id, name }); inputRef.current?.focus() }}
                        style={{
                          background: 'transparent', border: 'none', color: '#22c1c3', cursor: 'pointer', fontSize: '0.78rem'
                        }}
                      >
                        Responder
                      </button>

                      {/* small like button next to responder */}
                      <button
                        type="button"
                        onClick={() => toggleLike(c)}
                        style={{ background: 'transparent', border: 'none', color: (Array.isArray(c.likes) && auth && auth._id && c.likes.includes(String(auth._id))) ? '#22c1c3' : '#9fb7c3', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem' }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill={(Array.isArray(c.likes) && auth && auth._id && c.likes.includes(String(auth._id))) ? '#22c1c3' : 'none'} stroke={(Array.isArray(c.likes) && auth && auth._id && c.likes.includes(String(auth._id))) ? '#22c1c3' : '#9fb7c3'} strokeWidth="1.5">
                          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                        </svg>
                        <span style={{ fontSize: '0.85rem' }}>{c.likesCount || 0}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}

          <div ref={bottomRef} />
        </div>

        {/* ── Write comment form ── */}
        <form
          onSubmit={handleSubmit}
          style={{
            borderTop: '1px solid rgba(255,255,255,0.07)',
            padding: '0.85rem 1.25rem 1.1rem',
            background: 'rgba(0,0,0,0.20)',
            flexShrink: 0,
          }}
        >
          {error && !loading && (
            <div style={{
              marginBottom: '0.5rem', padding: '0.5rem 0.75rem',
              background: 'rgba(255,80,80,0.08)',
              border: '1px solid rgba(255,80,80,0.15)',
              borderRadius: '8px', color: '#ff9b9b', fontSize: '0.83rem',
            }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'flex-end' }}>
            {/* My avatar */}
            <div style={{
              width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg,#22c1c3,#1e90ff)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: '0.85rem', color: '#04111a',
            }}>
              {auth
                ? initials(`${auth.firstName || ''} ${auth.lastName || ''}`.trim() || auth.username || '?')
                : '?'}
            </div>

            {/* Textarea */}
            <div style={{ flex: 1, position: 'relative' }}>
              {replyTo && (
                <div style={{
                  position: 'absolute', left: 8, top: -28, right: 8,
                  background: 'rgba(34,193,195,0.08)', border: '1px solid rgba(34,193,195,0.12)',
                  color: '#9ef0ef', fontSize: '0.82rem', padding: '4px 8px', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem'
                }}>
                  <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Respondiendo a <strong style={{ color: '#e6eef5' }}>{replyTo.name}</strong></div>
                  <button type="button" onClick={() => { setReplyTo(null); inputRef.current?.focus() }} style={{ background: 'transparent', border: 'none', color: '#9fb7c3', cursor: 'pointer' }}>✕</button>
                </div>
              )}
              <textarea
                ref={inputRef}
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e) }
                }}
                placeholder={replyTo ? `Responde a ${replyTo.name}… (Enter para enviar)` : "Escribe un comentario… (Enter para enviar)"}
                rows={1}
                style={{
                  width: '100%',
                  padding: '0.65rem 3rem 0.65rem 0.9rem',
                  borderRadius: '22px',
                  border: '1px solid rgba(255,255,255,0.07)',
                  background: 'rgba(255,255,255,0.04)',
                  color: '#e6eef5',
                  fontFamily: 'inherit',
                  fontSize: '0.9rem',
                  resize: 'none',
                  outline: 'none',
                  transition: 'border-color 160ms ease, box-shadow 160ms ease',
                  boxSizing: 'border-box',
                  lineHeight: 1.4,
                  overflow: 'hidden',
                }}
                onFocus={e => {
                  e.target.style.borderColor = 'rgba(34,193,195,0.45)'
                  e.target.style.boxShadow   = '0 0 0 3px rgba(34,193,195,0.07)'
                }}
                onBlur={e => {
                  e.target.style.borderColor = 'rgba(255,255,255,0.07)'
                  e.target.style.boxShadow   = 'none'
                }}
                onInput={e => {
                  e.target.style.height = 'auto'
                  e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
                }}
              />

              {/* Send button inside the textarea */}
              <button
                type="submit"
                disabled={submitting || !text.trim()}
                aria-label="Publicar comentario"
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '44%',
                  transform: 'translateY(-50%)',
                  width: '30px', height: '30px',
                  borderRadius: '50%',
                  border: 'none',
                  background: text.trim()
                    ? 'linear-gradient(135deg,#22c1c3,#1e90ff)'
                    : 'rgba(255,255,255,0.08)',
                  color: text.trim() ? '#04111a' : '#6f8a96',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: text.trim() ? 'pointer' : 'default',
                  transition: 'background 200ms ease, transform 140ms ease',
                  fontSize: '0.95rem',
                }}
                onMouseEnter={e => { if (text.trim()) e.currentTarget.style.transform = 'translateY(-50%) scale(1.12)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(-50%) scale(1)' }}
              >
                {submitting
                  ? <span style={{
                      width: 12, height: 12,
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderTopColor: '#fff',
                      borderRadius: '50%',
                      display: 'inline-block',
                      animation: 'fn-spin 0.9s linear infinite',
                    }} />
                  : <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                    </svg>
                }
              </button>
            </div>
          </div>

          <div style={{
            marginTop: '0.5rem', paddingLeft: '2.65rem',
            fontSize: '0.73rem', color: '#6f8a96',
          }}>
            Shift + Enter para nueva línea
          </div>
        </form>
      </div>

      <style>{`
        @keyframes fb-comment-in {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  )
}
