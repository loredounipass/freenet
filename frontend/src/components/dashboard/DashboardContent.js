import React from 'react'

const POSTS = [
  {
    id: '1',
    type: 'video',
    thumbnail: null,
    title: 'Mi primer video',
    views: 320,
    likes: 48,
    comments: 12,
    date: 'Hace 2 días',
  },
  {
    id: '2',
    type: 'image',
    thumbnail: null,
    title: 'Foto del atardecer',
    views: 180,
    likes: 34,
    comments: 6,
    date: 'Hace 5 días',
  },
  {
    id: '3',
    type: 'video',
    thumbnail: null,
    title: 'Tutorial rápido',
    views: 540,
    likes: 76,
    comments: 23,
    date: 'Hace 1 semana',
  },
]

function TypeBadge({ type }) {
  return type === 'video' ? (
    <span className="db-content-badge db-content-badge-video">
      <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
      Video
    </span>
  ) : (
    <span className="db-content-badge db-content-badge-image">
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
        <polyline points="21 15 16 10 5 21"/>
      </svg>
      Foto
    </span>
  )
}

function PostRow({ post }) {
  return (
    <div className="db-content-row">
      {/* Thumbnail placeholder */}
      <div className="db-content-thumb">
        {post.type === 'video' ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="23 7 16 12 23 17 23 7"/>
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
        )}
      </div>

      {/* Info */}
      <div className="db-content-info">
        <div className="db-content-title">{post.title}</div>
        <div className="db-content-meta">
          <TypeBadge type={post.type} />
          <span className="db-content-date">{post.date}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="db-content-stats">
        <div className="db-content-stat">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
          </svg>
          {post.views}
        </div>
        <div className="db-content-stat">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
          {post.likes}
        </div>
        <div className="db-content-stat">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          {post.comments}
        </div>
      </div>

      {/* Action */}
      <button className="db-content-action" title="Ver más opciones">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
        </svg>
      </button>
    </div>
  )
}

export default function DashboardContent() {
  return (
    <section className="db-section">
      <div className="db-section-header">
        <div>
          <h2 className="db-section-title">Contenido</h2>
          <p className="db-section-sub">Accede a tus publicaciones y crea contenido nuevo</p>
        </div>
        <button className="db-link-btn">Ver todo →</button>
      </div>

      <div className="db-content-list">
        {POSTS.map((post) => <PostRow key={post.id} post={post} />)}
      </div>
    </section>
  )
}
