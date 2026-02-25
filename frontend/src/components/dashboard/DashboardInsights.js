import React from 'react'

/* ── Static mock data (swap for real API later) ── */
const METRICS = [
  {
    id: 'views',
    label: 'Vistas',
    value: '2.4K',
    change: '+12%',
    positive: true,
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
        <circle cx="12" cy="12" r="3"/>
      </svg>
    ),
    color: 'var(--fn-teal)',
  },
  {
    id: 'likes',
    label: 'Me gusta',
    value: '348',
    change: '+8%',
    positive: true,
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>
    ),
    color: '#e05c86',
  },
  {
    id: 'comments',
    label: 'Comentarios',
    value: '91',
    change: '+5%',
    positive: true,
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
    color: 'var(--fn-blue)',
  },
  {
    id: 'reach',
    label: 'Alcance',
    value: '1.1K',
    change: '-3%',
    positive: false,
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="2" y1="12" x2="22" y2="12"/>
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10A15.3 15.3 0 0 1 12 2z"/>
      </svg>
    ),
    color: '#a78bfa',
  },
]

/* Tiny sparkline using SVG path */
const SPARKLINES = {
  views:    [10,28,18,40,22,60,48,70,55,80,65,90],
  likes:    [5,12,8,20,15,28,22,35,30,42,38,50],
  comments: [2,5,3,9,7,14,11,18,15,22,19,28],
  reach:    [20,35,28,45,38,50,42,38,30,25,22,18],
}

function Sparkline({ id, color }) {
  const data = SPARKLINES[id] || []
  if (!data.length) return null
  const max = Math.max(...data)
  const min = Math.min(...data)
  const W = 80, H = 32
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * W
    const y = H - ((v - min) / (max - min || 1)) * H
    return `${x},${y}`
  }).join(' ')
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="db-sparkline">
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.85"
      />
      {/* gradient area */}
      <defs>
        <linearGradient id={`grad-${id}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <polygon
        points={`0,${H} ${pts} ${W},${H}`}
        fill={`url(#grad-${id})`}
      />
    </svg>
  )
}

/* Chart bars (last 7 days) */
const CHART_DATA = [
  { day: 'Lun', views: 28, likes: 5  },
  { day: 'Mar', views: 45, likes: 12 },
  { day: 'Mié', views: 30, likes: 8  },
  { day: 'Jue', views: 63, likes: 20 },
  { day: 'Vie', views: 52, likes: 15 },
  { day: 'Sáb', views: 78, likes: 25 },
  { day: 'Dom', views: 90, likes: 32 },
]
const MAX_VIEWS = Math.max(...CHART_DATA.map((d) => d.views))

export default function DashboardInsights() {
  return (
    <section className="db-section">
      {/* Section header */}
      <div className="db-section-header">
        <div>
          <h2 className="db-section-title">Estadísticas</h2>
          <p className="db-section-sub">Últimos 28 días</p>
        </div>
        <button className="db-link-btn">Ver todo →</button>
      </div>

      {/* Metric cards */}
      <div className="db-metrics-grid">
        {METRICS.map((m) => (
          <div key={m.id} className="db-metric-card">
            <div className="db-metric-top">
              <div className="db-metric-icon" style={{ color: m.color, background: `${m.color}18` }}>
                {m.icon}
              </div>
              <Sparkline id={m.id} color={m.color} />
            </div>
            <div className="db-metric-value">{m.value}</div>
            <div className="db-metric-label">{m.label}</div>
            <div className={`db-metric-change${m.positive ? ' db-metric-change-pos' : ' db-metric-change-neg'}`}>
              {m.positive ? '▲' : '▼'} {m.change} vs período anterior
            </div>
          </div>
        ))}
      </div>

      {/* Bar chart */}
      <div className="db-chart-card">
        <div className="db-chart-header">
          <span className="db-chart-title">Vistas por día</span>
          <div className="db-chart-legend">
            <span className="db-legend-dot" style={{ background: 'var(--fn-teal)' }} /> Vistas
            <span className="db-legend-dot" style={{ background: '#e05c86', marginLeft: '1rem' }} /> Likes
          </div>
        </div>
        <div className="db-bar-chart">
          {CHART_DATA.map((d) => (
            <div key={d.day} className="db-bar-group">
              <div className="db-bars">
                <div
                  className="db-bar db-bar-views"
                  style={{ height: `${(d.views / MAX_VIEWS) * 100}%` }}
                  title={`${d.views} vistas`}
                />
                <div
                  className="db-bar db-bar-likes"
                  style={{ height: `${(d.likes / MAX_VIEWS) * 100}%` }}
                  title={`${d.likes} likes`}
                />
              </div>
              <span className="db-bar-label">{d.day}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
