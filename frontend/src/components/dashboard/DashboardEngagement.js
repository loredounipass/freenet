import React from 'react'

const ENGAGEMENT_STATS = [
  {
    id: 'engagement',
    label: 'Interacción total',
    value: '1',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/>
        <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
      </svg>
    ),
    color: 'var(--fn-teal)',
  },
  {
    id: 'comments',
    label: 'Comentarios recientes',
    value: '0',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
    color: 'var(--fn-blue)',
  },
  {
    id: 'mentions',
    label: 'Menciones recientes',
    value: '9',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="4"/>
        <path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94"/>
      </svg>
    ),
    color: '#a78bfa',
  },
]

const RECENT_INTERACTIONS = [
  { id: '1', user: 'Ana García',    action: 'le dio Me gusta a tu video',   time: 'Hace 2h',  avatar: 'AG' },
  { id: '2', user: 'Carlos M.',     action: 'comentó en tu publicación',     time: 'Hace 4h',  avatar: 'CM' },
  { id: '3', user: 'Laura P.',      action: 'compartió tu foto',             time: 'Hace 6h',  avatar: 'LP' },
  { id: '4', user: 'Diego R.',      action: 'te mencionó en un comentario',  time: 'Hace 1d',  avatar: 'DR' },
]

export default function DashboardEngagement() {
  return (
    <section className="db-section">
      <div className="db-section-header">
        <div>
          <h2 className="db-section-title">Interacción</h2>
          <p className="db-section-sub">Gestiona comentarios, menciones y más</p>
        </div>
        <button className="db-link-btn">Ver todo →</button>
      </div>

      {/* Stats row */}
      <div className="db-eng-stats">
        {ENGAGEMENT_STATS.map((s) => (
          <div key={s.id} className="db-eng-stat-card">
            <div className="db-eng-stat-icon" style={{ color: s.color, background: `${s.color}18` }}>
              {s.icon}
            </div>
            <div className="db-eng-stat-value" style={{ color: s.color }}>{s.value}</div>
            <div className="db-eng-stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Recent interactions feed */}
      <div className="db-eng-feed">
        <div className="db-eng-feed-title">Actividad reciente</div>
        {RECENT_INTERACTIONS.map((item) => (
          <div key={item.id} className="db-eng-feed-row">
            <div className="db-eng-avatar">{item.avatar}</div>
            <div className="db-eng-feed-text">
              <span className="db-eng-feed-user">{item.user}</span>{' '}
              <span className="db-eng-feed-action">{item.action}</span>
            </div>
            <span className="db-eng-feed-time">{item.time}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
