import React from 'react'

export default function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className="app-footer">
      <div className="footer-inner">
        <div>
          <div className="footer-copyright">Copyright © {year} Freenet</div>
          <div className="footer-rights">Todos los derechos reservados.</div>
        </div>
        <div className="footer-links">Designed with ♥ • <a href="/privacy">Privacy</a> • <a href="/terms">Terms</a></div>
      </div>
    </footer>
  )
}
