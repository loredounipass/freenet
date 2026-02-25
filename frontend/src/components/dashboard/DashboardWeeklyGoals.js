import React from 'react'

const GOALS = [
  {
    id: 'reels',
    label: 'Publica 5 reels públicos',
    progress: 1,
    total: 5,
    daysLeft: 4,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polygon points="23 7 16 12 23 17 23 7"/>
        <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
      </svg>
    ),
    color: 'var(--fn-teal)',
  },
  {
    id: 'story',
    label: 'Publica una historia cada día',
    progress: 2,
    total: 7,
    daysLeft: 4,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
    ),
    color: 'var(--fn-blue)',
  },
  {
    id: 'followers',
    label: 'Consigue 5 nuevos seguidores',
    progress: 2,
    total: 5,
    daysLeft: null,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    color: '#a78bfa',
  },
]

function GoalRow({ goal }) {
  const pct = Math.round((goal.progress / goal.total) * 100)
  return (
    <div className="db-goal-row">
      <div className="db-goal-icon" style={{ color: goal.color, background: `${goal.color}18` }}>
        {goal.icon}
      </div>
      <div className="db-goal-info">
        <div className="db-goal-label">{goal.label}</div>
        <div className="db-goal-track">
          <div className="db-goal-bar-bg">
            <div
              className="db-goal-bar-fill"
              style={{ width: `${pct}%`, background: goal.color }}
            />
          </div>
          <span className="db-goal-pct">{pct}%</span>
        </div>
        <div className="db-goal-meta">
          <span className="db-goal-count">{goal.progress}/{goal.total} completado</span>
          {goal.daysLeft && (
            <span className="db-goal-days">{goal.daysLeft} días restantes</span>
          )}
        </div>
      </div>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <polyline points="9 18 15 12 9 6"/>
      </svg>
    </div>
  )
}

export default function DashboardWeeklyGoals() {
  const overallPct = Math.round(
    GOALS.reduce((acc, g) => acc + (g.progress / g.total) * 100, 0) / GOALS.length
  )

  return (
    <section className="db-section">
      <div className="db-section-header">
        <div>
          <h2 className="db-section-title">Progreso semanal</h2>
          <p className="db-section-sub">{overallPct}% completado</p>
        </div>
        <button className="db-link-btn">Ver todo →</button>
      </div>

      {/* Circular progress summary */}
      <div className="db-goals-summary">
        <svg width="72" height="72" viewBox="0 0 72 72">
          <circle cx="36" cy="36" r="28" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8"/>
          <circle
            cx="36" cy="36" r="28"
            fill="none"
            stroke="url(#goalGrad)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 28}`}
            strokeDashoffset={`${2 * Math.PI * 28 * (1 - overallPct / 100)}`}
            transform="rotate(-90 36 36)"
          />
          <defs>
            <linearGradient id="goalGrad" x1="1" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--fn-teal)"/>
              <stop offset="100%" stopColor="var(--fn-blue)"/>
            </linearGradient>
          </defs>
          <text x="36" y="40" textAnchor="middle" fontSize="14" fontWeight="800" fill="#e6eef5">
            {overallPct}%
          </text>
        </svg>
        <div className="db-goals-summary-text">
          <div className="db-goals-summary-label">Esta semana</div>
          <div className="db-goals-summary-sub">Completa tus metas para ampliar tu alcance</div>
        </div>
      </div>

      {/* Goals list */}
      <div className="db-goals-list">
        {GOALS.map((g) => <GoalRow key={g.id} goal={g} />)}
      </div>
    </section>
  )
}
