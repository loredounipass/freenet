import React from 'react'

export default function Toast({ message, onDismiss }) {
  if (!message) return null
  return (
    <div style={{ position: 'fixed', bottom: '1.5rem', left: '50%', transform: 'translateX(-50%)', zIndex: 9999 }}>
      <div style={{ padding: '0.6rem 1rem', borderRadius: 10, background: 'linear-gradient(90deg, rgba(34,193,195,0.08), rgba(30,144,255,0.08))', border: '1px solid rgba(30,144,255,0.12)', color: 'var(--fn-text)', boxShadow: '0 8px 30px rgba(30,144,255,0.06)', backdropFilter: 'blur(8px)' }}>
        <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
          <span style={{ fontSize: '1.05rem' }}>⚠️</span>
          <span style={{ minWidth: 200 }}>{message}</span>
          <button onClick={onDismiss} style={{ marginLeft: '0.5rem', background: 'transparent', border: 'none', color: 'var(--fn-blue)', cursor: 'pointer', fontWeight: 700 }}>✕</button>
        </div>
      </div>
    </div>
  )
}
